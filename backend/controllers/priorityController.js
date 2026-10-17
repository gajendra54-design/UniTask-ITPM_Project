import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import Subtask from "../models/Subtask.js";
import CalendarTask from "../models/CalendarTask.js";
import { generateBreakdown } from "../services/groqService.js";
import {
  prioritizeSortAssignments,
  getCriticalAssignments,
  analyzeWorkload,
  groupByPriorityBand,
  calculateAveragePriority,
} from "../services/priorityService.js";

export const aiBreakdown = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const aiData = await generateBreakdown(description);

    res.json(aiData);
  } catch (error) {
    console.error("AI Breakdown Error:", error.message);
    res.status(500).json({
      message: "AI Breakdown Failed",
      error: error.message,
    });
  }
};

/**
 * POST /api/assignments/save
 * Save assignment with subtasks
 */
export const saveAssignment = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      course,
      aiDescription,
      deadline,
      totalEstimatedHours,
      realisticDays,
      subtasks,
    } = req.body;

    // 🔒 Detailed validation with specific error messages
    const errors = [];

    if (!title) errors.push("title is required");
    if (!course) errors.push("course is required");
    if (!aiDescription) errors.push("aiDescription is required");
    if (!totalEstimatedHours || totalEstimatedHours <= 0)
      errors.push("totalEstimatedHours must be a positive number");
    if (!realisticDays || realisticDays <= 0)
      errors.push("realisticDays must be a positive number");
    if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0)
      errors.push("subtasks array is required with at least one task");

    if (errors.length > 0) {
      console.error("Validation errors:", errors, "Received body:", req.body);
      return res.status(400).json({
        message: "Missing or invalid required fields",
        errors,
        received: {
          title: !!title,
          course: !!course,
          aiDescription: !!aiDescription,
          totalEstimatedHours: totalEstimatedHours,
          realisticDays: realisticDays,
          subtasksLength: subtasks?.length || 0,
        },
      });
    }

    // 1️⃣ Create Assignment
    const assignment = await Assignment.create({
      userId,
      title,
      course,
      aiDescription,
      deadline,
      totalEstimatedHours,
      realisticDays,
    });

    // 2️⃣ Create Subtasks linked to assignment
    const subtaskDocs = await Subtask.insertMany(
      subtasks.map((task) => ({
        userId,
        assignmentId: assignment._id,
        title: task.title,
        subDescription: task.subDescription || "",
        estimatedHours: task.estimatedHours || 1,
        difficultyLevel: task.difficultyLevel || "Medium",
        completed: task.completed || false,
      })),
    );

    // 3️⃣ Attach subtasks to assignment
    assignment.subtasks = subtaskDocs.map((t) => t._id);
    await assignment.save();

    return res.status(201).json({
      message: "Assignment saved successfully",
      assignment,
    });
  } catch (error) {
    console.error("Save Assignment Error:", error);
    res.status(500).json({
      message: "Failed to save assignment",
      error: error.message,
    });
  }
};

/**
 * GET /api/assignments
 * Fetch all assignments with subtasks
 */
export const getAssignments = async (req, res) => {
  try {
    const userId = req.user._id;
    const assignments = await Assignment.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "subtasks",
          localField: "_id",
          foreignField: "assignmentId",
          as: "subtasks",
        },
      },
      {
        $project: {
          title: 1,
          course: 1,
          deadline: 1,
          createdAt: 1,
          subtaskCount: { $size: "$subtasks" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

// GET /api/assignments/:id
export const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const subtasks = await Subtask.find({
      assignmentId: assignment._id,
    });

    res.json({ assignment, subtasks });
  } catch (error) {
    res.status(500).json({ message: "Failed to load assignment" });
  }
};

// DELETE /api/assignments/:id
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 2. Delete all related subtasks
    await Subtask.deleteMany({ assignmentId: id });

    // 3. Delete assignment
    await Assignment.findByIdAndDelete(id);

    res.json({ message: "Assignment and subtasks deleted successfully" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/priority/subtask/:id
 * Update subtask status
 */
export const updateSubtaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completed } = req.body;

    const subtask = await Subtask.findById(id);

    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    // Update fields if provided
    if (status !== undefined) subtask.status = status;
    if (completed !== undefined) subtask.completed = completed;

    // Sync logic
    if (subtask.status === "Completed") {
      subtask.completed = true;
    } else if (subtask.completed) {
      subtask.status = "Completed";
    } else if (!subtask.completed && subtask.status === "Completed") {
      // If marked as not completed but status was "Completed", revert to "Pending"
      subtask.status = "Pending";
    }

    await subtask.save();

    res.json(subtask);
  } catch (error) {
    console.error("Update subtask status error:", error);
    res.status(500).json({ message: "Failed to update subtask status" });
  }
};

/**
 * GET /api/assignments/priority/sorted
 * Get all user assignments sorted by priority
 */
export const getAssignmentsSortedByPriority = async (req, res) => {
  try {
    const userId = req.user._id;
    const assignments = await Assignment.find({ userId }).lean();
    
    // Fetch relevant calendar tasks (Deadlines, Exams, Labs)
    const calendarTasks = await CalendarTask.find({ 
      userId, 
      type: { $in: ["deadline", "exam", "lab"] },
      status: { $ne: "Done" } 
    }).lean();

    // Map CalendarTasks to the common interface 
    // prioritizeSortAssignments in service handles the rest of normalization
    const mappedCalendarTasks = calendarTasks.map(t => ({
      ...t,
      status: t.status === "Done" ? "Completed" : (t.status === "Pending" ? "Active" : t.status)
    }));

    const combinedTasks = [...assignments, ...mappedCalendarTasks];

    if (!combinedTasks.length) {
      return res.json({
        message: "No assignments found",
        assignments: [],
        summary: { total: 0, critical: 0, high: 0, average: 0 },
      });
    }

    const prioritized = prioritizeSortAssignments(combinedTasks);
    const critical = prioritized.filter(
      (a) => a.priorityBand === "Critical",
    ).length;
    const high = prioritized.filter((a) => a.priorityBand === "High").length;

    res.json({
      assignments: prioritized,
      summary: {
        total: prioritized.length,
        critical,
        high,
        average: Math.round(
          prioritized.reduce((sum, a) => sum + a.priorityScore, 0) /
            prioritized.length,
        ),
      },
    });
  } catch (error) {
    console.error("Priority sort error:", error);
    res.status(500).json({ message: "Failed to sort assignments" });
  }
};

/**
 * GET /api/assignments/priority/critical
 * Get critical assignments due within next 7 days
 */
export const getCriticalTasksForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const days = req.query.days || 7;

    const assignments = await Assignment.find({ userId });
    const critical = getCriticalAssignments(assignments, parseInt(days));

    res.json({
      critical,
      count: critical.length,
      message:
        critical.length > 0
          ? `${critical.length} critical task(s) requiring immediate attention`
          : "No critical tasks",
    });
  } catch (error) {
    console.error("Critical tasks error:", error);
    res.status(500).json({ message: "Failed to fetch critical tasks" });
  }
};

/**
 * GET /api/assignments/priority/workload-analysis
 * Analyze workload distribution by date
 */
export const getWorkloadAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;

    const assignments = await Assignment.find({ userId }).lean();
    const calendarTasks = await CalendarTask.find({ 
      userId, 
      type: { $in: ["deadline", "exam", "lab"] },
      status: { $ne: "Done" } 
    }).lean();
    
    const workload = analyzeWorkload([...assignments, ...calendarTasks]);

    const overloaded = workload.filter((day) => day.criticalCount > 2);

    res.json({
      workload,
      overloadedDays: overloaded,
      totalWorkload: workload.reduce((sum, day) => sum + day.totalHours, 0),
      averageDailyHours:
        workload.length > 0
          ? Math.round(
              workload.reduce((sum, day) => sum + day.totalHours, 0) /
                workload.length,
            )
          : 0,
    });
  } catch (error) {
    console.error("Workload analysis error:", error);
    res.status(500).json({ message: "Failed to analyze workload" });
  }
};

/**
 * GET /api/assignments/priority/band
 * Get assignments grouped by priority band
 */
export const getAssignmentsByPriorityBand = async (req, res) => {
  try {
    const userId = req.user._id;

    const assignments = await Assignment.find({ userId });
    const grouped = groupByPriorityBand(assignments);

    res.json({
      ...grouped,
      totals: {
        critical: grouped.critical.length,
        high: grouped.high.length,
        medium: grouped.medium.length,
        low: grouped.low.length,
      },
    });
  } catch (error) {
    console.error("Priority band error:", error);
    res.status(500).json({ message: "Failed to group assignments" });
  }
};
