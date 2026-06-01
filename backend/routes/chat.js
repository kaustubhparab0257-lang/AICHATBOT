const express = require("express");
const router = express.Router();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const jwt = require("jsonwebtoken");
const {
  firebaseAdmin,
  isFirebaseAdminConfigured,
} = require("../config/firebaseAdmin");

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    console.log("[chat] Incoming message:", message);

    // Optional Authentication
    const authHeader = req.headers.authorization;
    let user = null;

    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (token) {
      try {
        if (process.env.JWT_SECRET) {
          user = jwt.verify(token, process.env.JWT_SECRET);
          console.log("[chat] Authenticated via JWT:", user.id);
        } else if (isFirebaseAdminConfigured && firebaseAdmin) {
          const decoded = await firebaseAdmin.auth().verifyIdToken(token);

          user = {
            id: decoded.uid,
            email: decoded.email,
            name: decoded.name,
          };

          console.log(
            "[chat] Authenticated via Firebase:",
            decoded.uid
          );
        }
      } catch (err) {
        console.log("[chat] Invalid Token:", err.message);
      }
    }

    // Validation
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // Check API Key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing in .env",
      });
    }

    console.log(
      "[chat] API Key Loaded:",
      process.env.GEMINI_API_KEY.substring(0, 8) + "..."
    );

    // Gemini Setup
    const genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY
    );

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });

    const prompt = `
You are a helpful AI assistant.

User:
${message}

Assistant:
`;

    console.log("[chat] Sending request to Gemini...");

    const result = await model.generateContent(prompt);

    const response = result.response;

    const text = response.text();

    console.log("[chat] Gemini Reply:", text);

    return res.status(200).json({
      reply: text,
    });
  } catch (error) {
    console.error("[chat] Gemini request failed:");

    console.error(error);

    return res.status(500).json({
      error:
        error.message ||
        "AI generation failed. Check backend logs.",
    });
  }
});

module.exports = router;