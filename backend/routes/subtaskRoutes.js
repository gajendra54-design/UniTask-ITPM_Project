import express from "express";
import { updateSubtask } from "../controllers/subtaskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch("/:id", protect, updateSubtask);

export default router;
