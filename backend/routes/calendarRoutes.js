import express from "express";
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  seedDemoTasks,
} from "../controllers/calendarController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getTasks).post(protect, createTask);
router
  .route("/:id")
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.post("/seed", protect, seedDemoTasks);

export default router;
