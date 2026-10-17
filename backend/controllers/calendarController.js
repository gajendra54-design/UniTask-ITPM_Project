import CalendarTask from "../models/CalendarTask.js";

// @desc    Get all tasks for logged-in user
// @route   GET /api/calendar
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const tasks = await CalendarTask.find({ userId: req.user._id });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new task (supports recurrence)
// @route   POST /api/calendar
// @access  Private
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      startTime,
      endTime,
      type,
      subjectModule,
      priority,
      status,
      estimatedHours,
      repeat = 'None',
      occurrences = 1
    } = req.body;

    const numOccurrences = Math.min(Math.max(parseInt(occurrences) || 1, 1), 10);
    const tasksToCreate = [];
    const baseDate = new Date(date);

    for (let i = 0; i < numOccurrences; i++) {
      const currentDate = new Date(baseDate);
      if (repeat === 'Daily') {
        currentDate.setDate(baseDate.getDate() + i);
      } else if (repeat === 'Weekly') {
        currentDate.setDate(baseDate.getDate() + (i * 7));
      } else if (i > 0) {
        break; // No repeat, only one occurrence
      }

      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingTasks = await CalendarTask.find({
        userId: req.user._id,
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      const totalHours = existingTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const newHours = parseFloat(estimatedHours) || 0;

      if (existingTasks.length >= 3) {
        return res.status(400).json({ 
          message: `Limit exceeded for ${currentDate.toLocaleDateString()}: Max 3 assignments allowed per day.` 
        });
      }

      if (totalHours + newHours > 8) {
        return res.status(400).json({ 
          message: `Limit exceeded for ${currentDate.toLocaleDateString()}: Exceeds 8h daily limit (Total would be ${totalHours + newHours}h).` 
        });
      }

      tasksToCreate.push({
        userId: req.user._id,
        title,
        description,
        date: currentDate,
        startTime,
        endTime,
        type,
        subjectModule,
        priority,
        status,
        estimatedHours,
      });
    }

    const createdTasks = await CalendarTask.insertMany(tasksToCreate);
    res.status(201).json(createdTasks);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get one task
// @route   GET /api/calendar/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await CalendarTask.findById(req.params.id);

    if (task) {
      if (task.userId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }
      res.status(200).json(task);
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update/reschedule a task
// @route   PUT /api/calendar/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await CalendarTask.findById(req.params.id);

    if (task) {
      if (task.userId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }

      const targetDate = req.body.date || task.date;
      const taskDate = new Date(targetDate);
      const startOfDay = new Date(taskDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(taskDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingTasks = await CalendarTask.find({
        userId: req.user._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        _id: { $ne: task._id }
      });

      const totalHours = existingTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const updatedHours = req.body.estimatedHours !== undefined ? (parseFloat(req.body.estimatedHours) || 0) : task.estimatedHours;

      if (existingTasks.length >= 3) {
        return res.status(400).json({ message: "You cannot add more than 3 assignments to one day" });
      }

      if (totalHours + updatedHours > 8) {
        return res.status(400).json({ 
          message: `This task update will exceed the 8h daily limit (Current: ${totalHours}h). Total would be ${totalHours + updatedHours}h.` 
        });
      }

      task.title = req.body.title || task.title;
      task.description = req.body.description !== undefined ? req.body.description : task.description;
      task.date = req.body.date || task.date;
      task.startTime = req.body.startTime || task.startTime;
      task.endTime = req.body.endTime || task.endTime;
      task.type = req.body.type || task.type;
      task.subjectModule = req.body.subjectModule !== undefined ? req.body.subjectModule : task.subjectModule;
      task.priority = req.body.priority || task.priority;
      task.status = req.body.status || task.status;
      task.estimatedHours = req.body.estimatedHours !== undefined ? req.body.estimatedHours : task.estimatedHours;

      const updatedTask = await task.save();
      res.status(200).json(updatedTask);
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/calendar/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await CalendarTask.findById(req.params.id);

    if (task) {
      if (task.userId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }
      await CalendarTask.deleteOne({ _id: task._id });
      res.status(200).json({ message: "Task removed" });
    } else {
      res.status(404).json({ message: "Task not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed Demo Data for Calendar
// @route   POST /api/calendar/seed
// @access  Private
export const seedDemoTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    // Optional: Clear existing tasks for this user to have a clean demo
    await CalendarTask.deleteMany({ userId });

    const today = new Date();
    const demoTasks = [
      {
        userId,
        title: "ITPM Project Proposal",
        description: "Submit the final proposal and group details.",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        startTime: "10:00",
        endTime: "11:00",
        type: "deadline",
        subjectModule: "ITPM",
        priority: "High",
        status: "Pending",
        estimatedHours: 2,
      },
      {
        userId,
        title: "Database System Lab",
        description: "Focus on SQL optimization techniques.",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
        startTime: "14:00",
        endTime: "16:00",
        type: "lab",
        subjectModule: "DBMS",
        priority: "Medium",
        status: "In Progress",
        estimatedHours: 2,
      },
      {
        userId,
        title: "Study Group: System Arch",
        description: "Discuss design patterns and microservices.",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
        startTime: "18:00",
        endTime: "20:00",
        type: "meeting",
        subjectModule: "Architecture",
        priority: "Medium",
        status: "Pending",
        estimatedHours: 2,
      },
      {
        userId,
        title: "Web Dev Final Exam",
        description: "Covers React, Node, and MongoDB.",
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        startTime: "09:00",
        endTime: "12:00",
        type: "exam",
        subjectModule: "Web Development",
        priority: "High",
        status: "Pending",
        estimatedHours: 4,
      }
    ];

    const createdTasks = await CalendarTask.insertMany(demoTasks);
    res.status(201).json({ message: "Demo data seeded successfully!", count: createdTasks.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
