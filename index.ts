import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import createRagger, {
  NomicEmbedder,
  PostgresVectorStore,
  MinioDocStore,
  Document,
} from "forge-patch";

dotenv.config();

const app = express();

const nomicApiKey = process.env.NOMIC_API_KEY;
if (!nomicApiKey) {
  throw new Error("NOMIC_API_KEY is not set in the environment variables");
}

const connectionString = process.env.POSTGRES_STRING;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment variables");
}

const minioEndpoint = process.env.AH_S3_OBJECT_STORAGE_STACKHERO_SILVER_HOST;
if (!minioEndpoint) {
  throw new Error("AH_S3_OBJECT_STORAGE_STACKHERO_SILVER_HOST is not set");
}

const minioAccessKey =
  process.env.AH_S3_OBJECT_STORAGE_STACKHERO_SILVER_ROOT_ACCESS_KEY;
if (!minioAccessKey) {
  throw new Error(
    "AH_S3_OBJECT_STORAGE_STACKHERO_SILVER_ROOT_ACCESS_KEY is not set"
  );
}

const minioSecretKey =
  process.env.AH_S3_OBJECT_STORAGE_STACKHERO_SILVER_ROOT_SECRET_KEY;
if (!minioSecretKey) {
  throw new Error(
    "AH_S3_OBJECT_STORAGE_STACKHERO_SILVER_ROOT_SECRET_KEY is not set"
  );
}

const embedder = new NomicEmbedder({
  type: "nomic",
  apiKey: nomicApiKey,
});

const postgresVectorStore = new PostgresVectorStore(connectionString);

const minioDocStore = new MinioDocStore({
  endpoint: minioEndpoint,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
});

//in order to create a ragger we need:
// 1. embedder
// 2. vectorStore
// 3. docStore
const ragger = createRagger(embedder, {
  vectorStore: postgresVectorStore,
  docStore: minioDocStore,
});

// More permissive CORS configuration
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const API_KEY = process.env.LAMBDA_API_KEY;
const API_URL = "https://api.lambdalabs.com/v1/chat/completions";

// Add a simple GET route for testing
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Initialize a document and return the chunks
app.get("/rag", async (req, res) => {
  const chunks = await ragger.initializeDocument(
    new Document("Norman has 10 apples, 2000 oranges, and 77 bananas.")
  );
  res.json(chunks);
});

app.post("/chat", async (req, res) => {
  const { messages, model } = req.body;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: model || "hermes3-405b-fp8-128k",
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON:", text);
      throw new Error("Invalid JSON response from API");
    }

    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
