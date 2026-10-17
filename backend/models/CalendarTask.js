import mongoose from "mongoose";

const calendarTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      validate: {
        validator: function(v) {
          const uniqueChars = new Set(v.toLowerCase().replace(/\s/g, '')).size;
          return /[a-zA-Z]/.test(v) && uniqueChars >= 3;
        },
        message: "Title must contain at least one letter and at least 3 unique characters"
      }
    },
    type: {
      type: String,
      enum: ["deadline", "lab", "meeting", "exam"],
      default: "deadline",
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    startTime: {
      type: String, // format e.g., "09:00"
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String, // format e.g., "10:30"
      required: [true, "End time is required"],
    },
    subjectModule: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Done"],
      default: "Pending",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"],
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CalendarTask", calendarTaskSchema);
