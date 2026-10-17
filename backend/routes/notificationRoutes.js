import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMyNotifications,
  markAllRead,
  getUnreadCount,
  triggerTestNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.patch('/mark-read', protect, markAllRead);
router.get('/unread-count', protect, getUnreadCount);
router.post('/trigger-test', protect, triggerTestNotifications);

export default router;
