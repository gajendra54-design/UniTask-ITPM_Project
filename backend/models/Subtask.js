import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subDescription: {
      type: String,
      required: true,
    },
    estimatedHours: {
      type: Number,
      required: true,
      min: 0.25,
    },
    difficultyLevel: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    // Filled during Smart Priority stage
    priorityLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    priorityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    // Filled during Calendar stage
    scheduledDate: {
      type: Date,
      default: null,
    },

    completed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Subtask", subtaskSchema);
