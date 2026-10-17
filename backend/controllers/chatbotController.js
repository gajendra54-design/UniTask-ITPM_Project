/**
 * AI Assignment Chatbot Controller
 * Handles chatbot guidance requests with deep integration into UniTask data
 */

import { getGuidanceResponse, getAvailableTopics } from "../services/chatbotGuideService.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import Assignment from "../models/Assignment.js";

dotenv.config();

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

/**
 * POST /chatbot/ai-message
 * Get AI-powered response with real UniTask integration
 */
export const getAIMessage = async (req, res) => {
  if (!groq) {
    return res.status(503).json({ success: false, message: "AI chat is not configured. Set GROQ_API_KEY on the server." });
  }
  try {
    const { message, context = "general", history = [] } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // 🔥 INTEGRATION: Fetch user's active assignments to give the AI context
    let userContext = "";
    if (userId) {
      const activeAssignments = await Assignment.find({ userId, status: "Active" })
        .limit(5)
        .select("title course deadline status");
      
      if (activeAssignments.length > 0) {
        userContext = `\nUSER'S CURRENT ASSIGNMENTS:\n${activeAssignments.map(a => 
          `- ${a.title} (${a.course}) ${a.deadline ? "| Due: " + a.deadline.toDateString() : ""}`
        ).join("\n")}`;
      } else {
        userContext = "\nUser has no active assignments currently.";
      }
    }

    const systemPrompt = `You are "UniTask AI", a premium academic assistant for the UniTask platform.
Your goal is to help students manage their study life efficiently.

PLATFORM FEATURES YOU SUPPORT:
- Dashboard: Overview of progress and deadlines.
- Assignments: AI Breakdown into subtasks.
- Calendar: 8-hour daily limit rule.
- Smart Priority: Scoring system (0-100).
- Skills: Time Management, Research, Technical, Communication.
- Study Materials: AI Flashcards.

USER STATS & CONTEXT:${userContext}
CURRENT PAGE CONTEXT: ${context}

TONE & STYLE:
- Professional, encouraging, and concise (3-4 sentences).
- Use relevant emojis (📚, 🎯, ✨).
- If the user asks about their tasks, reference the specific assignments listed above.
- Always recommend using the "AI Breakdown" or "Smart Priority" tools for better planning.`;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map(msg => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        })),
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    res.status(200).json({
      success: true,
      message: aiResponse,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error in AI integration:", error.message);
    res.status(500).json({
      success: false,
      message: "AI Service Integration Error",
      error: error.message,
    });
  }
};

/**
 * GET /chatbot/guidance
 * Get guidance response for a user message
 */
export const getGuidance = (req, res) => {
  try {
    const { message } = req.query;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message parameter is required",
      });
    }

    const response = getGuidanceResponse(message);

    res.status(200).json({
      success: true,
      message: response,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error getting guidance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get guidance response",
      error: error.message,
    });
  }
};

/**
 * GET /chatbot/topics
 * Get available guidance topics
 */
export const getTopics = (req, res) => {
  try {
    const topics = getAvailableTopics();

    res.status(200).json({
      success: true,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error("Error getting topics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get topics",
      error: error.message,
    });
  }
};

/**
 * POST /chatbot/message
 * Save chatbot conversation message (optional)
 */
export const saveChatMessage = (req, res) => {
  try {
    const { message, type } = req.body;

    if (!message || !type) {
      return res.status(400).json({
        success: false,
        message: "Message and type are required",
      });
    }

    if (!["user", "bot"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be 'user' or 'bot'",
      });
    }

    res.status(201).json({
      success: true,
      message: "Message recorded",
      data: {
        message,
        type,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Error saving chat message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save message",
      error: error.message,
    });
  }
};

export default {
  getGuidance,
  getTopics,
  saveChatMessage,
  getAIMessage
};
