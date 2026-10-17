import express from "express";
import multer from "multer";
import fs from "fs";
import {
  aiBreakdown,
  uploadAndAnalyzePdf,
  saveAssignment,
  getAssignments,
  getAssignmentById,
  deleteAssignment,
  updateAssignment,
  getAssignmentStats,
} from "../controllers/assignmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

router.post("/ai-breakdown", protect, aiBreakdown);
router.post("/upload-pdf", protect, upload.single("file"), uploadAndAnalyzePdf);
router.post("/save", protect, saveAssignment);
router.get("/analytics/summary", protect, getAssignmentStats);
router.get("/", protect, getAssignments);
router.get("/:id", protect, getAssignmentById);
router.put("/:id", protect, updateAssignment);
router.delete("/:id", protect, deleteAssignment);

export default router;
