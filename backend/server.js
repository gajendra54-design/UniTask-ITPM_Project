import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import subtaskRoutes from "./routes/subtaskRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import priorityRoutes from "./routes/priorityRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import skillsAnalysisRoutes from "./skills-analysis/routes/skillsAnalysisRoutes.js";
import groupRoutes from "./routes/groupRoutes.v2.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import resourceSummaryRoutes from "./routes/resourceSummaryRoutes.js";
import { initTaskCronJobs } from "./cron/taskCron.js";

import studyRoutes from "./routes/studyRoutes.js";
import { initializeSkillsAnalysisReportJob } from "./jobs/skillsAnalysisReportJob.js";

// Connect to Database
await connectDB();

//Notification_stsyem
// Initialize scheduled jobs
initializeSkillsAnalysisReportJob();

// Initialize Task Cron Jobs
initTaskCronJobs();
//main

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files
// app.use("/uploads", express.static("uploads"));

// Health Check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime() }),
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/subtasks", subtaskRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/priority", priorityRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/skills-analysis", skillsAnalysisRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", resourceSummaryRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
