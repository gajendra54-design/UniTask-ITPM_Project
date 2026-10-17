import Notification from '../models/Notification.js';
import { runTaskCheckingLogic } from '../cron/taskCron.js';

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 for performance

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger test notifications for the current user
// @route   POST /api/notifications/trigger-test
// @access  Private
export const triggerTestNotifications = async (req, res) => {
  try {
    // We pass req.user._id to run the logic only for this user
    await runTaskCheckingLogic(req.user._id);
    
    // Fetch the notifications just created (if any)
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({ 
      success: true, 
      message: 'Test notification check completed',
      recent: notifications 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user's notifications as read
// @route   PATCH /api/notifications/mark-read
// @access  Private
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
        userId: req.user._id, 
        isRead: false 
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
