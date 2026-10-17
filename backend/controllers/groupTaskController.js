import GroupTask from '../models/GroupTask.js';
import Group from '../models/Group.js';
import Contribution from '../models/Contribution.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';
import { getMentionEmailTemplate } from '../utils/emailTemplates.js';

// @desc    Create a new group task (Admin only)
// @route   POST /api/groups/:id/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Check if current user is admin
    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can create tasks' });
    }

    const { title, description, assignedTo, priority, dueDate, dependsOn, subtasks, recurrence, estimatedHours } = req.body;

    const task = await GroupTask.create({
      group: group._id,
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      dependsOn: dependsOn || [],
      subtasks: subtasks || [],
      recurrence: recurrence || 'none',
      estimatedHours: estimatedHours || 0,
      createdBy: req.user._id
    });

    // Create notification if assigned
    if (assignedTo) {
      await Notification.create({
        userId: assignedTo,
        message: `You have been assigned a new task: ${title} in group ${group.name}`,
        groupId: group._id
      });
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks for a group
// @route   GET /api/groups/:id/tasks
// @access  Private
export const getGroupTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      GroupTask.find({ group: req.params.id })
        .populate('assignedTo', 'name')
        .populate('dependsOn', 'title status')
        .populate('comments.author', 'name')
        .populate('attachments.uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GroupTask.countDocuments({ group: req.params.id })
    ]);

    res.status(200).json({ success: true, data: tasks, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task status
// @route   PATCH /api/groups/:id/tasks/:taskId/status
// @access  Private
export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await GroupTask.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Fetch group and dependencies in parallel
    const needsDepsCheck = (status === 'Done' || status === 'In Progress') && task.dependsOn?.length > 0;
    const [group, deps] = await Promise.all([
      Group.findById(task.group).lean(),
      needsDepsCheck
        ? GroupTask.find({ _id: { $in: task.dependsOn } }).select('status').lean()
        : Promise.resolve(null)
    ]);

    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task status' });
    }

    if (deps) {
      const incompleteDeps = deps.filter(d => d.status !== 'Done');
      if (incompleteDeps.length > 0) {
        return res.status(400).json({ success: false, message: 'Cannot start or complete task until dependencies are Done.' });
      }
    }

    const oldStatus = task.status;
    task.status = status;

    if (status === 'Done' && oldStatus !== 'Done') {
      task.completedAt = new Date();
      if (task.assignedTo) {
        await Contribution.findOneAndUpdate(
          { group: task.group, user: task.assignedTo },
          { $inc: { score: 10 }, $push: { activities: { action: `Completed task: ${task.title}`, points: 10, createdAt: new Date() } } }
        );
      }
    } else if (status !== 'Done' && oldStatus === 'Done') {
      task.completedAt = undefined;
    }

    await task.save();
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update task (Admin only)
// @route   PUT /api/groups/:id/tasks/:taskId
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await GroupTask.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const group = await Group.findById(task.group);
    
    // Check if current user is admin
    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can update tasks' });
    }

    const { title, description, assignedTo, priority, dueDate, dependsOn, subtasks, recurrence, estimatedHours } = req.body;

    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    task.assignedTo = assignedTo !== undefined ? assignedTo : task.assignedTo;
    task.priority = priority !== undefined ? priority : task.priority;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    if (dependsOn !== undefined) task.dependsOn = dependsOn;
    if (subtasks !== undefined) task.subtasks = subtasks;
    if (recurrence !== undefined) task.recurrence = recurrence;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete task (Admin only)
// @route   DELETE /api/groups/:id/tasks/:taskId
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await GroupTask.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const group = await Group.findById(task.group);
    
    // Check if current user is admin
    const isAdmin = group.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only admins can delete tasks' });
    }

    await GroupTask.findByIdAndDelete(req.params.taskId);

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add comment to a task
// @route   POST /api/groups/:id/tasks/:taskId/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const task = await GroupTask.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { content, mentions } = req.body;
    
    task.comments.push({
      author: req.user._id,
      content,
      mentions: mentions || []
    });

    await task.save();

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      const group = await Group.findById(task.group);
      const notifications = mentions.map(userId => ({
        userId: userId,
        title: 'You were mentioned',
        message: `${req.user.name} mentioned you in task: ${task.title}`,
        type: 'Task',
        link: `/groups/${group._id}`,
        groupId: group._id
      }));
      await Notification.insertMany(notifications);

      // 📧 Send Emails
      const mentionedUsers = await User.find({ _id: { $in: mentions } });
      for (const u of mentionedUsers) {
        if (u.email) {
          const emailHtml = getMentionEmailTemplate(
            u.name, 
            req.user.name, 
            task.title, 
            group.name, 
            `/groups/${group._id}`
          );
          await sendEmail({
            to: u.email,
            subject: `You were mentioned in UniTask: ${task.title}`,
            html: emailHtml,
            text: `${req.user.name} mentioned you in task: ${task.title} in group ${group.name}`
          });
        }
      }
    }

    await task.populate('comments.author', 'name');
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload attachment for a task
// @route   POST /api/groups/:id/tasks/:taskId/attachments
// @access  Private
export const uploadAttachment = async (req, res) => {
  try {
    const task = await GroupTask.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    task.attachments.push({
      name: req.file.originalname,
      url: `uploads/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    await task.save();
    await task.populate('attachments.uploadedBy', 'name');

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get data for task burndown chart/analytics
// @route   GET /api/groups/:id/analytics/burndown
// @access  Private
export const getBurndownData = async (req, res) => {
  try {
    const tasks = await GroupTask.find({ group: req.params.id })
      .select('createdAt completedAt status estimatedHours')
      .sort({ createdAt: 1 })
      .lean(); // .lean() for read-only — no mongoose overhead

    if (tasks.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const startDate = new Date(tasks[0].createdAt);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const totalEffort = tasks.reduce((acc, t) => acc + (t.estimatedHours || 1), 0);

    // Pre-index completed tasks by day — O(N) not O(N * days)
    const completionByDay = {};
    tasks.forEach(t => {
      if (t.status === 'Done' && t.completedAt) {
        const dayKey = new Date(t.completedAt).toDateString();
        completionByDay[dayKey] = (completionByDay[dayKey] || 0) + (t.estimatedHours || 1);
      }
    });

    const dataPoints = [];
    let effortCompleted = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      effortCompleted += completionByDay[d.toDateString()] || 0;
      dataPoints.push({
        date: new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        remainingEffort: Math.max(0, totalEffort - effortCompleted)
      });
    }

    res.status(200).json({ success: true, data: dataPoints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

