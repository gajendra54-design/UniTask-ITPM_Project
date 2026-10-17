import cron from 'node-cron';
import GroupTask from '../models/GroupTask.js';
import Notification from '../models/Notification.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Assignment from '../models/Assignment.js';
import CalendarTask from '../models/CalendarTask.js';
import { prioritizeSortAssignments } from '../services/priorityService.js';
import { sendEmail } from '../utils/emailService.js';

export const runTaskCheckingLogic = async (targetUserId = null) => {
  try {
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const userFilter = targetUserId ? { assignedTo: targetUserId } : { assignedTo: { $exists: true } };
    const assignmentUserFilter = targetUserId ? { userId: targetUserId } : { userId: { $exists: true } };

    // --- 1. REMINDERS (Group Tasks) ---
    const upcomingTasks = await GroupTask.find({
      ...userFilter,
      status: { $ne: 'Done' },
      dueDate: { $gte: now, $lte: next24h },
      reminderSent: false,
    }).populate('assignedTo').populate('group');

    for (const task of upcomingTasks) {
      if (!task.assignedTo || !task.group) continue;
      await Notification.create({
        userId: task.assignedTo._id,
        title: 'Task Due Soon',
        message: `Reminder: Task "${task.title}" in group "${task.group.name}" is due in less than 24 hours.`,
        groupId: task.group._id,
        type: 'Task'
      });
      await sendEmail({
        to: task.assignedTo.email, 
        subject: `Task Reminder: ${task.title}`, 
        text: `Hi ${task.assignedTo.name},\nYour task "${task.title}" is due by ${new Date(task.dueDate).toLocaleString()}.`
      });
      task.reminderSent = true;
      await task.save();
    }

    // --- 1b. INDIVIDUAL ASSIGNMENT REMINDERS ---
    const upcomingAssignments = await Assignment.find({
      ...assignmentUserFilter,
      status: { $ne: 'Completed' },
      deadline: { $gte: now, $lte: next24h },
      reminderSent: false,
    }).populate('userId');

    for (const assignment of upcomingAssignments) {
      if (!assignment.userId) continue;
      await Notification.create({
        userId: assignment.userId._id,
        title: 'Assignment Due Soon',
        message: `Your assignment "${assignment.title}" is due in less than 24 hours.`,
        type: 'Task'
      });
      await sendEmail({
        to: assignment.userId.email, 
        subject: `Assignment Reminder: ${assignment.title}`,
        text: `Hi ${assignment.userId.name},\nYour assignment "${assignment.title}" for ${assignment.course} is due by ${new Date(assignment.deadline).toLocaleString()}.`
      });
      assignment.reminderSent = true;
      await assignment.save();
    }

    // --- 1c. CALENDAR TASK REMINDERS ---
    const upcomingCalendarTasks = await CalendarTask.find({
      ...assignmentUserFilter,
      status: { $ne: 'Done' },
      date: { $gte: now, $lte: next24h },
      reminderSent: false,
    }).populate('userId');

    for (const cTask of upcomingCalendarTasks) {
      if (!cTask.userId) continue;
      await Notification.create({
        userId: cTask.userId._id,
        title: `${cTask.type.toUpperCase()} Reminder`,
        message: `You have a ${cTask.type} "${cTask.title}" starting at ${cTask.startTime} today.`,
        type: 'Task'
      });
      await sendEmail({
        to: cTask.userId.email, 
        subject: `Event Reminder: ${cTask.title}`,
        text: `Hi ${cTask.userId.name},\nReminder for your ${cTask.type}: "${cTask.title}" at ${cTask.startTime}.`
      });
      cTask.reminderSent = true;
      await cTask.save();
    }

    // --- 1d. PRIORITY ALERTS (Critical & At Risk) ---
    const allActiveAssignments = await Assignment.find({
      ...assignmentUserFilter,
      status: 'Active',
      reminderSent: false 
    }).populate('userId').lean();

    if (allActiveAssignments.length > 0) {
      const userGroups = allActiveAssignments.reduce((acc, current) => {
        const uid = current.userId?._id?.toString();
        if (uid) {
          if (!acc[uid]) acc[uid] = [];
          acc[uid].push(current);
        }
        return acc;
      }, {});

      for (const uid in userGroups) {
        const prioritized = prioritizeSortAssignments(userGroups[uid]);
        
        for (const task of prioritized) {
          const daysToDeadline = (new Date(task.deadline) - now) / (1000 * 60 * 60 * 24);
          
          if (task.priorityBand === 'Critical' && daysToDeadline <= 7) {
            await Notification.create({
              userId: uid,
              title: 'Critical Priority Alert',
              message: `Task "${task.title}" is marked as CRITICAL priority. Please start working on it now.`,
              type: 'Task'
            });
            await sendEmail({
              to: userGroups[uid][0].userId.email, 
              subject: `CRITICAL: ${task.title}`,
              text: `Hi ${userGroups[uid][0].userId.name},\n"${task.title}" is now CRITICAL priority. Due in ${Math.round(daysToDeadline)} days.`
            });
            const originalTask = await Assignment.findById(task._id);
            if (originalTask) { originalTask.reminderSent = true; await originalTask.save(); }
          }
          else if (task.priorityBand === 'High' && daysToDeadline <= 2) {
            await Notification.create({
              userId: uid,
              title: 'At Risk Alert',
              message: `Task "${task.title}" is at risk. It is due in less than 48 hours and has high priority.`,
              type: 'Task'
            });
            const originalTask = await Assignment.findById(task._id);
            if (originalTask) { originalTask.reminderSent = true; await originalTask.save(); }
          }
        }
      }
    }

    // --- 2. RECURRENCES ---
    const recurringTasks = await GroupTask.find({
      ...userFilter,
      status: 'Done',
      recurrence: { $in: ['daily', 'weekly', 'monthly'] },
    });

    for (const task of recurringTasks) {
      let nextDue = new Date(task.dueDate || new Date());
      if (task.recurrence === 'daily') nextDue.setDate(nextDue.getDate() + 1);
      else if (task.recurrence === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else if (task.recurrence === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

      const currentRecurrence = task.recurrence;
      task.recurrence = 'none';
      await task.save();

      await GroupTask.create({
        group: task.group,
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        priority: task.priority,
        dueDate: nextDue,
        estimatedHours: task.estimatedHours,
        recurrence: currentRecurrence, 
        subtasks: task.subtasks.map(s => ({ title: s.title, completed: false })),
        createdBy: task.createdBy
      });
    }
  } catch (error) {
    console.error('Task Job Error:', error);
  }
};

export const initTaskCronJobs = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('Running Task Cron Job...');
    await runTaskCheckingLogic();
  });
  console.log('Task cron jobs initialized.');
};

