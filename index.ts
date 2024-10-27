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

const databaseURL = process.env.DATABASE_URL;
if (!databaseURL) {
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

const postgresVectorStore = new PostgresVectorStore(databaseURL);

// Call createIndex to ensure the table exists
await postgresVectorStore.createIndex();

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
    new Document(
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean luctus, arcu eu venenatis mollis, ex purus blandit turpis, quis placerat lorem felis eget massa. Fusce luctus, elit ut maximus vestibulum, urna diam commodo lorem, vel gravida erat elit nec enim. Cras tempor ex non magna auctor tincidunt. Aliquam at dolor rutrum orci aliquam egestas. Sed iaculis metus et quam consequat, eu hendrerit lectus pharetra. Proin ultrices, elit a ullamcorper convallis, nisi elit posuere quam, vel commodo erat leo et nunc. Vivamus eu mi sit amet metus luctus dictum vitae id lorem. The total number of fruits is 99 apples, 8 bananas, and 10 oranges, Aenean augue turpis, vestibulum id sem at, pellentesque lacinia augue. Fusce ultricies, arcu sit amet ullamcorper rutrum, lorem mi commodo justo, nec molestie turpis enim at lectus. Nulla ornare nisi libero, quis molestie nibh dignissim quis. Fusce rhoncus est a risus tempus imperdiet."
    )
  );
  const results = await ragger.query(
    "What is the total number of fruits?",
    chunks.map((chunk) => chunk.forgeMetadata.documentId)
  );

  res.json(results);
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
