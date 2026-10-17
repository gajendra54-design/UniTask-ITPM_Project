import express from 'express';
import {
  getSkillsAnalysis,
  getDashboardData,
  getAISuggestions,
  getProgressChartData,
  getSkillsBreakdown,
  getDemoData,
  sendSkillsReports,
} from '../controllers/skillsAnalysisController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get overall skills analysis
router.get('/analysis', getSkillsAnalysis);

// Get dashboard data
router.get('/dashboard', getDashboardData);

// Get AI suggestions
router.get('/suggestions', getAISuggestions);

// Get progress chart data
router.get('/progress-chart', getProgressChartData);

// Get skills breakdown for radar/bar chart
router.get('/skills-breakdown', getSkillsBreakdown);

// Demo endpoint - generates sample data for testing
router.post('/demo', getDemoData);

// Manual trigger to send skills analysis reports to all users
router.post('/send-reports', sendSkillsReports);

export default router;
