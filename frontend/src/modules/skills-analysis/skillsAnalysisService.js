import api from '../../utils/api';

// Get dashboard data
export const getDashboardData = async () => {
  try {
    const response = await api.get('/skills-analysis/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Get skills analysis
export const getSkillsAnalysis = async () => {
  try {
    const response = await api.get('/skills-analysis/analysis');
    return response.data;
  } catch (error) {
    console.error('Error fetching skills analysis:', error);
    throw error;
  }
};

// Get AI suggestions
export const getAISuggestions = async () => {
  try {
    const response = await api.get('/skills-analysis/suggestions');
    return response.data;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw error;
  }
};

// Get progress chart data
export const getProgressChartData = async (period = 'weekly') => {
  try {
    const response = await api.get(`/skills-analysis/progress-chart?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching progress chart data:', error);
    throw error;
  }
};

// Get skills breakdown
export const getSkillsBreakdown = async () => {
  try {
    const response = await api.get('/skills-analysis/skills-breakdown');
    return response.data;
  } catch (error) {
    console.error('Error fetching skills breakdown:', error);
    throw error;
  }
};

export default {
  getDashboardData,
  getSkillsAnalysis,
  getAISuggestions,
  getProgressChartData,
  getSkillsBreakdown,
};
