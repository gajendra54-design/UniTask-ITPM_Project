import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import {
  generateFlashcards,
  getMaterials,
  getMaterialById,
  getMaterialByIdPublic,
  deleteMaterial,
} from "../controllers/studyController.js";
import fs from "fs";

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

// Public route - QR code shared flashcard access (no auth required)
router.route("/shared/:id").get(getMaterialByIdPublic);

router.use(protect);

router.route("/")
  .get(getMaterials);

router.route("/generate")
  .post(upload.single("file"), generateFlashcards);

router.route("/:id")
  .get(getMaterialById)
  .delete(deleteMaterial);

export default router;
