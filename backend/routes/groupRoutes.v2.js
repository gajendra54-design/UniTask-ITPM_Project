import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { protect } from '../middleware/authMiddleware.js';

import {
  createGroup,
  getMyGroups,
  getGroupById,
  inviteMember,
  removeMember,
  leaveGroup,
  deleteGroup,
  searchUsers,
  generateInviteCode,
  revokeInviteCode,
  joinGroupByCode
} from '../controllers/groupController.js';

import {
  createTask,
  getGroupTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
  addComment,
  uploadAttachment,
  getBurndownData
} from '../controllers/groupTaskController.js';

import { 
  prioritizeTasks, 
  getGroupHealthReport, 
  distributeTasksWithAI 
} from '../controllers/aiGroupController.js';

import {
  uploadResource,
  getResources,
  deleteResource
} from '../controllers/resourceController.js';

import {
  getGroupContributions,
  getGroupActivity
} from '../controllers/contributionController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// -- AI & ANALYTICS (Highest Priority) --
router.post('/ai/health/:id', protect, getGroupHealthReport);
router.post('/ai/distribute/:id', protect, distributeTasksWithAI);
router.post('/ai/prioritize/:id', protect, prioritizeTasks);
router.get('/:id/analytics/burndown', protect, getBurndownData);

// -- GROUP CORE --
router.route('/')
  .post(protect, createGroup)
  .get(protect, getMyGroups);

router.get('/search-users', protect, searchUsers);
router.post('/join-by-code', protect, joinGroupByCode);

router.route('/:id')
  .get(protect, getGroupById)
  .delete(protect, deleteGroup);

router.post('/:id/invite', protect, inviteMember);
router.route('/:id/invite-code')
  .post(protect, generateInviteCode)
  .delete(protect, revokeInviteCode);
router.delete('/:id/members/:userId', protect, removeMember);
router.delete('/:id/leave', protect, leaveGroup);

// -- TASKS --
router.route('/:id/tasks')
  .post(protect, createTask)
  .get(protect, getGroupTasks);

router.route('/:id/tasks/:taskId')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.patch('/:id/tasks/:taskId/status', protect, updateTaskStatus);
router.post('/:id/tasks/:taskId/comments', protect, addComment);
router.post('/:id/tasks/:taskId/attachments', upload.single('file'), uploadAttachment);

// -- ACTIVITY --
router.get('/:id/contributions', protect, getGroupContributions);
router.get('/:id/activity', protect, getGroupActivity);

export default router;
