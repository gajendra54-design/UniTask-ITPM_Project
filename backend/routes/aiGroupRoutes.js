// FILE: backend/routes/aiGroupRoutes.js
import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { 
  getGroupHealthReport, 
  distributeTasksWithAI 
} from '../controllers/aiGroupController.js';

router.post('/:id/ai-health', protect, getGroupHealthReport);
router.post('/:id/ai-distribute', protect, distributeTasksWithAI);

export default router;
