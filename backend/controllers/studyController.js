import StudyMaterial from "../models/StudyMaterial.js";
import Groq from "groq-sdk";
import fs from "fs";
import { extractTextHybrid } from "../utils/extractTextHybrid.js";

let groq;

export const generateFlashcards = async (req, res) => {
  try {
    const { title, description } = req.body;
    let text = req.body.text;
    let sourceType = req.body.sourceType || "text";

    if (!title) {
        return res.status(400).json({ success: false, message: "Title is required" });
    }

    // Process uploaded file (PDF / Images) using Hybrid Extractor
    if (req.file) {
      if (!req.file.mimetype.startsWith("application/pdf") && !req.file.mimetype.startsWith("image/")) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ success: false, message: "Only PDF or Image files are allowed" });
      }
      
      sourceType = req.file.mimetype === "application/pdf" ? "pdf" : "image";
      
      try {
        text = await extractTextHybrid(req.file.path, req.file.mimetype);
      } catch (extractError) {
        console.error("Hybrid Extraction failed:", extractError);
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ success: false, message: "Failed to extract text from file using OCR." });
      }
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Text content is required" });
    }

    if (!groq) {
      groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }

    // Call Groq to generate flashcards
    const prompt = `Based on the following text, generate a comprehensive set of flashcards for exam preparation.
    Extract the most important concepts, definitions, and facts.
    Respond ONLY with a valid JSON array of objects. Do not include markdown formatting like \`\`\`json.
    Each object must have exactly two keys: "question" and "answer".
    Text: ${text.substring(0, 15000)} // Limiting text length for API limits
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Use consistent model from groqService.js
      temperature: 0.3,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "[]";
    
    let flashcards = [];
    try {
        // Strip out possible markdown wrapper if the AI still included it
        const jsonStr = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        flashcards = JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse JSON from AI:", aiResponse);
        return res.status(500).json({ success: false, message: "Failed to parse flashcards from AI response." });
    }

    if (!Array.isArray(flashcards) || flashcards.length === 0) {
        return res.status(500).json({ success: false, message: "AI generated an empty set of flashcards." });
    }

    // Create the study material in DB
    const studyMaterial = await StudyMaterial.create({
      userId: req.user._id,
      title,
      description: description || "",
      sourceType,
      flashcards,
    });

    res.status(201).json({ success: true, data: studyMaterial });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ success: false, message: "Server error generating flashcards", error: error.message });
  }
};

export const getMaterials = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch study materials" });
  }
};

export const getMaterialById = async (req, res) => {
  try {
    const material = await StudyMaterial.findOne({ _id: req.params.id, userId: req.user._id });
    if (!material) {
      return res.status(404).json({ success: false, message: "Study material not found" });
    }
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch study material" });
  }
};

// Public endpoint - no auth required (for QR code sharing)
export const getMaterialByIdPublic = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: "Study material not found" });
    }
    res.status(200).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch study material" });
  }
};

export const deleteMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!material) {
      return res.status(404).json({ success: false, message: "Study material not found" });
    }
    res.status(200).json({ success: true, message: "Study material deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete study material" });
  }
};
