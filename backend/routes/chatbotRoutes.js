/**
 * Chatbot Guidance Routes
 * Endpoints for AI assignment chatbot guidance
 */

import express from "express";
import {
  getGuidance,
  getTopics,
  saveChatMessage,
  getAIMessage,
} from "../controllers/chatbotController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * POST /api/chatbot/ai-message
 * Get AI-powered response using Groq LLM
 * Protected route - requires authentication
 */
router.post("/ai-message", protect, getAIMessage);

/**
 * GET /api/chatbot/guidance
 * Get guidance response for a user message
 * Query params: message (string)
 */
router.get("/guidance", getGuidance);

/**
 * GET /api/chatbot/topics
 * Get all available guidance topics
 */
router.get("/topics", getTopics);

/**
 * POST /api/chatbot/message
 * Save chatbot conversation message
 * Protected route - requires authentication
 */
router.post("/message", protect, saveChatMessage);

export const chatbotRouter = router;

export default chatbotRouter;
