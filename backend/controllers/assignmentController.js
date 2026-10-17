import mongoose from "mongoose";
import fs from "fs";
import Assignment from "../models/Assignment.js";
import Subtask from "../models/Subtask.js";
import CalendarTask from "../models/CalendarTask.js";
import { generateBreakdown } from "../services/groqService.js";
import { extractTextHybrid } from "../utils/extractTextHybrid.js";

export const aiBreakdown = async (req, res) => {
  try {
    const { description, workHoursPerDay } = req.body;

    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }

    const aiData = await generateBreakdown(description, workHoursPerDay);

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
 * POST /api/assignments/upload-pdf
 * Extract text from uploaded PDF and generate AI breakdown
 */
export const uploadAndAnalyzePdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No PDF file uploaded" });
    }

    const { path: filePath, mimetype } = req.file;

    // 1. Extract Text
    let extractedText = await extractTextHybrid(filePath, mimetype);

    // Provide generic fallback text if no text is found, but we should probably error out
    if (!extractedText || extractedText.trim().length === 0) {
      // Clean up the file
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res
        .status(400)
        .json({ message: "Could not extract text from the provided file." });
    }

    // Pass max 15000 characters to AI to avoid overflow limits
    const safeText = extractedText.substring(0, 15000);

    // 2. Generate Breakdown
    const aiData = await generateBreakdown(safeText);

    // Clean up local temp file as it's no longer needed
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json(aiData);
  } catch (error) {
    console.error("Upload and Analyze PDF Error:", error.message);

    // Attempt clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "PDF Analysis Failed",
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
    const userId = req.user.id;
    const {
      title,
      course,
      aiDescription,
      deadline,
      totalEstimatedHours,
      realisticDays,
      subtasks,
    } = req.body;

    // 🔒 Basic validation
    if (
      !title ||
      !course ||
      !aiDescription ||
      !totalEstimatedHours ||
      !realisticDays ||
      !subtasks?.length
    ) {
      return res.status(400).json({
        message: "Missing required fields",
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
          status: 1,
          totalEstimatedHours: 1,
          createdAt: 1,
          subtaskCount: { $size: "$subtasks" },
          completed: {
            $size: {
              $filter: {
                input: "$subtasks",
                as: "sub",
                cond: { $eq: ["$$sub.completed", true] },
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    // Update statuses dynamically based on rules
    const now = new Date();
    const bulkOps = [];

    const updatedAssignments = assignments.map((a) => {
      let isCompleted = a.subtaskCount > 0 && a.completed === a.subtaskCount;
      let isPassed = a.deadline && new Date(a.deadline) < now;

      let newStatus = "Active";
      if (isCompleted && !isPassed) newStatus = "Completed";
      else if (isCompleted && isPassed) newStatus = "Archived";
      else if (!isCompleted && isPassed) newStatus = "Overdue";

      if (a.status !== newStatus) {
        a.status = newStatus;
        bulkOps.push({
          updateOne: {
            filter: { _id: a._id },
            update: { $set: { status: newStatus } },
          },
        });
      }
      return a;
    });

    if (bulkOps.length > 0) {
      await Assignment.bulkWrite(bulkOps);
    }

    res.json(updatedAssignments);
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

    const subtaskCount = subtasks.length;
    const completedCount = subtasks.filter((s) => s.completed).length;
    const isCompleted = subtaskCount > 0 && completedCount === subtaskCount;
    const isPassed =
      assignment.deadline && new Date(assignment.deadline) < new Date();

    let newStatus = "Active";
    if (isCompleted && !isPassed) newStatus = "Completed";
    else if (isCompleted && isPassed) newStatus = "Archived";
    else if (!isCompleted && isPassed) newStatus = "Overdue";

    if (assignment.status !== newStatus) {
      assignment.status = newStatus;
      await assignment.save();
    }

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

// PUT /api/assignments/:id
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      course,
      deadline,
      status,
      subtasks,
      aiDescription,
      totalEstimatedHours,
      realisticDays,
    } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 1. Update Assignment fields
    if (title) assignment.title = title;
    if (course) assignment.course = course;
    if (deadline !== undefined) assignment.deadline = deadline;
    if (status !== undefined) assignment.status = status;
    if (aiDescription !== undefined) assignment.aiDescription = aiDescription;
    if (totalEstimatedHours !== undefined)
      assignment.totalEstimatedHours = totalEstimatedHours;
    if (realisticDays !== undefined) assignment.realisticDays = realisticDays;

    // 2. Process subtasks (if provided)
    if (subtasks && Array.isArray(subtasks)) {
      const incomingSubtaskIds = subtasks
        .filter((s) => s._id)
        .map((s) => s._id.toString());

      // Delete subtasks that are missing from the incoming array
      await Subtask.deleteMany({
        assignmentId: id,
        _id: { $nin: incomingSubtaskIds },
      });

      const updatedSubtaskIds = [];

      for (const task of subtasks) {
        if (task._id) {
          // Update existing subtask
          const existingSubtask = await Subtask.findById(task._id);
          if (existingSubtask) {
            existingSubtask.title = task.title;
            existingSubtask.subDescription = task.subDescription || "";
            existingSubtask.estimatedHours = task.estimatedHours || 1;
            existingSubtask.completed = task.completed || false;
            await existingSubtask.save();
            updatedSubtaskIds.push(existingSubtask._id);
          }
        } else {
          // Create new subtask
          const newSubtask = await Subtask.create({
            userId: req.user.id,
            assignmentId: id,
            title: task.title,
            subDescription: task.subDescription || "",
            estimatedHours: task.estimatedHours || 1,
            difficultyLevel: task.difficultyLevel || "Medium",
            completed: task.completed || false,
          });
          updatedSubtaskIds.push(newSubtask._id);
        }
      }

      // Update assignment's subtasks reference array
      assignment.subtasks = updatedSubtaskIds;
    }

    await assignment.save();

    res.json({
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/assignments/analytics/summary
 * Fetch analytics summary for the current user
 */
export const getAssignmentStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get assignments and their subtasks
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
    ]);

    // 2. Get Calendar Tasks
    const calendarTasks = await CalendarTask.find({ userId });

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);

    const stats = {
      totalTasks: 0,
      thisWeek: {
        total: 0,
        completed: 0
      },
      thisMonth: {
        total: 0,
        completed: 0
      },
      courseBreakdown: {},
      typeBreakdown: {
        assignment: 0,
        deadline: 0,
        lab: 0,
        meeting: 0,
        exam: 0,
        other: 0
      },
      completionRate: {
        completed: 0,
        pending: 0
      }
    };

    // Process Assignments and Subtasks
    assignments.forEach(a => {
      // Course breakdown
      stats.courseBreakdown[a.course] = (stats.courseBreakdown[a.course] || 0) + 1;
      
      // Every assignment counts as an 'assignment' type
      stats.typeBreakdown.assignment++;

      if (a.subtasks.length > 0) {
        a.subtasks.forEach(s => {
          stats.totalTasks++;
          
          const createdDate = new Date(s.createdAt);

          if (createdDate >= oneWeekAgo) {
            stats.thisWeek.total++;
            if (s.completed) stats.thisWeek.completed++;
          }

          if (createdDate >= oneMonthAgo) {
            stats.thisMonth.total++;
            if (s.completed) stats.thisMonth.completed++;
          }

          if (s.completed) {
            stats.completionRate.completed++;
          } else {
            stats.completionRate.pending++;
          }
        });
      } else {
        // If assignment has no subtasks, count it as one task
        stats.totalTasks++;
        const createdDate = new Date(a.createdAt);
        if (createdDate >= oneWeekAgo) {
          stats.thisWeek.total++;
          if (a.status === 'Completed') stats.thisWeek.completed++;
        }
        if (createdDate >= oneMonthAgo) {
          stats.thisMonth.total++;
          if (a.status === 'Completed') stats.thisMonth.completed++; 
        }
        
        if (a.status === 'Completed') stats.completionRate.completed++;
        else stats.completionRate.pending++;
      }
    });

    // Process Calendar Tasks
    calendarTasks.forEach(t => {
      stats.totalTasks++;
      
      // Type breakdown
      if (stats.typeBreakdown[t.type] !== undefined) {
        stats.typeBreakdown[t.type]++;
      } else {
        stats.typeBreakdown.other++;
      }

      const taskDate = new Date(t.date);

      if (taskDate >= oneWeekAgo && taskDate <= now) {
         // This is technically 'past week', but usually analytics show 'tasks handled recently'
         // or 'tasks scheduled for this period'. 
         // Let's use the task date for 'this week/month' logic if it fits.
      }
      
      // Use createdAt for 'created this period' or date for 'scheduled this period'?
      // User asked for "Total tasks this week/month". 
      // Usually signifies activity. Let's use createdAt for consistency with assignments.
      const createdDate = new Date(t.createdAt);
      if (createdDate >= oneWeekAgo) {
        stats.thisWeek.total++;
        if (t.status === 'Done') stats.thisWeek.completed++;
      }
      if (createdDate >= oneMonthAgo) {
        stats.thisMonth.total++;
        if (t.status === 'Done') stats.thisMonth.completed++;
      }

      if (t.status === 'Done') {
        stats.completionRate.completed++;
      } else {
        stats.completionRate.pending++;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error("Get Analytics Error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
};
