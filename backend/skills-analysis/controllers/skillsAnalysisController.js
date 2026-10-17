import SkillsAnalysis from '../models/SkillsAnalysisModel.js';
import { generateSkillsAnalysis } from '../services/skillsAnalysisService.js';
import { generateDummyAnalysis } from '../services/dummyDataGenerator.js';
import { sendSkillsAnalysisReportsToAllUsers } from '../../services/skillsAnalysisReportService.js';

// Get skills analysis for a user
export const getSkillsAnalysis = async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate/update analysis
    const analysis = await generateSkillsAnalysis(userId);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Error fetching skills analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skills analysis',
      error: error.message,
    });
  }
};

// Get all skills data (dashboard data)
export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate/update analysis
    const analysis = await generateSkillsAnalysis(userId);

    // Prepare dashboard response
    const dashboardData = {
      overallProgress: analysis.overallProgress,
      tasksCompleted: analysis.tasksCompleted,
      totalTasks: analysis.totalTasks,
      onTimeCompletion: analysis.onTimeCompletion,
      lateSubmissions: analysis.lateSubmissions,
      consistencyLevel: analysis.consistencyLevel,
      consistencyScore: analysis.consistencyScore,
      procrastinationBehavior: analysis.procrastinationBehavior,
      avgDaysLate: analysis.avgDaysLate,
      skillsImprovement: analysis.skillsImprovement,
      aiSuggestions: analysis.aiSuggestions,
      weeklyProgressData: analysis.weeklyProgressData,
      monthlyProgressData: analysis.monthlyProgressData || [],
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message,
    });
  }
};

// Get AI suggestions
export const getAISuggestions = async (req, res) => {
  try {
    const userId = req.user._id;

    const analysis = await SkillsAnalysis.findOne({ userId });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Skills analysis not found',
      });
    }

    res.status(200).json({
      success: true,
      data: analysis.aiSuggestions || [],
    });
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching AI suggestions',
      error: error.message,
    });
  }
};

// Get progress chart data
export const getProgressChartData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = 'weekly' } = req.query; // weekly or monthly

    const analysis = await SkillsAnalysis.findOne({ userId });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Skills analysis not found',
      });
    }

    const progressData = (period === 'monthly' ? analysis.monthlyProgressData : analysis.weeklyProgressData) || [];

    const chartData = {
      labels: progressData.map((item) => {
        if (period === 'monthly') {
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          return months[item.month - 1] || `Month ${item.month}`;
        } else {
          return `Week ${item.week}`;
        }
      }),
      datasets: [
        {
          label: 'Tasks Completed',
          data: progressData.map((item) => item.tasksCompleted),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'On-Time Submissions',
          data: progressData.map((item) => item.onTimeCount),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Late Submissions',
          data: progressData.map((item) => item.lateCount),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Error fetching progress chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress chart data',
      error: error.message,
    });
  }
};

// Get skills breakdown data
export const getSkillsBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;

    const analysis = await SkillsAnalysis.findOne({ userId });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Skills analysis not found',
      });
    }

    const skillsData = {
      labels: ['Time Management', 'Research Skills', 'Technical Skills', 'Communication Skills'],
      datasets: [
        {
          label: 'Skill Levels',
          data: [
            analysis?.skillsImprovement?.timeManagement?.score || 0,
            analysis?.skillsImprovement?.researchSkills?.score || 0,
            analysis?.skillsImprovement?.technicalSkills?.score || 0,
            analysis?.skillsImprovement?.communicationSkills?.score || 0,
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(10, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
          borderColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#a855f7',
          ],
          borderWidth: 2,
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: skillsData,
    });
  } catch (error) {
    console.error('Error fetching skills breakdown:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching skills breakdown',
      error: error.message,
    });
  }
};

export default {
  getSkillsAnalysis,
  getDashboardData,
  getAISuggestions,
  getProgressChartData,
  getSkillsBreakdown,
};

// Demo endpoint for development (returns sample data)
export const getDemoData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate and return dummy data for demo purposes
    const analysis = await generateDummyAnalysis(userId);

    res.status(200).json({
      success: true,
      message: 'Demo data generated successfully',
      data: analysis,
    });
  } catch (error) {
    console.error('Error generating demo data:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating demo data',
      error: error.message,
    });
  }
};

// Trigger sending skills analysis reports to all users
export const sendSkillsReports = async (req, res) => {
  try {
    // Optional: Add role-based authorization check here
    // For now, any authenticated user can trigger this endpoint
    
    console.log('📧 Skills Analysis Report trigger initiated');
    const result = await sendSkillsAnalysisReportsToAllUsers();

    res.status(200).json({
      success: true,
      message: 'Skills analysis reports sent successfully',
      data: {
        successCount: result.success,
        failedCount: result.failed,
        totalAttempted: result.success + result.failed,
      },
    });
  } catch (error) {
    console.error('Error sending skills analysis reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending skills analysis reports',
      error: error.message,
    });
  }
};
