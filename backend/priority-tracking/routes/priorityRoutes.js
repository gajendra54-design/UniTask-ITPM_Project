import express from "express";
import {
  aiBreakdown,
  saveAssignment,
  getAssignments,
  getAssignmentById,
  deleteAssignment,
  getAssignmentsSortedByPriority,
  getCriticalTasksForUser,
  getWorkloadAnalysis,
  getAssignmentsByPriorityBand,
} from "./priorityController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/ai-breakdown", protect, aiBreakdown);
router.post("/save", protect, saveAssignment);
router.get("/", protect, getAssignments);

// Priority routes
router.get("/sorted", protect, getAssignmentsSortedByPriority);
router.get("/critical", protect, getCriticalTasksForUser);
router.get("/workload-analysis", protect, getWorkloadAnalysis);
router.get("/band", protect, getAssignmentsByPriorityBand);

router.get("/:id", protect, getAssignmentById);
router.delete("/:id", protect, deleteAssignment);

export default router;
