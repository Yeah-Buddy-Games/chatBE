import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

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
        model: model || "hermes3-405b",
        messages: messages,
      }),
    });

    const data = await response.json();
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
