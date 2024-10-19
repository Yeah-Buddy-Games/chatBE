import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Update CORS configuration
const corsOptions = {
  origin:
    process.env.FRONTEND_URL || "https://chatbotfe-b6e339a47a76.herokuapp.com",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

const API_KEY = process.env.LAMBDA_API_KEY;
const API_URL = "https://api.lambdalabs.com/v1/chat/completions";

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
