// FILE: backend/routes/resourceSummaryRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateResourceSummary } from '../controllers/resourceSummaryController.js';

const router = express.Router();

router.post(
  '/:id/resources/:resourceId/summarize',
  protect,
  generateResourceSummary
);

export default router;
