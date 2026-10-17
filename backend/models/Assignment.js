import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    aiDescription: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    totalEstimatedHours: {
      type: Number,
      default: 0,
    },
    realisticDays: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Archived", "Overdue"],
      default: "Active",
    },

    // Filled during Smart Priority stage

    // Filled progressively in Priority & Calendar stages
    manuallyAdded: {
      type: Boolean,
      default: false,
    },

    dailyStudyLimitHours: {
      type: Number,
      min: 1,
      max: 24,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Assignment", assignmentSchema);
