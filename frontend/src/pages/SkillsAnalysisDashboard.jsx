import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, TrendingUp, Download } from 'lucide-react';
import CircularProgress from '../components/SkillsAnalysis/CircularProgress';
import ConsistencyCard from '../components/SkillsAnalysis/ConsistencyCard';
import BehaviorAnalysis from '../components/SkillsAnalysis/BehaviorAnalysis';
import SkillsImprovement from '../components/SkillsAnalysis/SkillsImprovement';
import AISuggestions from '../components/SkillsAnalysis/AISuggestions';
import ProgressChart from '../components/SkillsAnalysis/ProgressChart';
import SkillsRadarChart from '../components/SkillsAnalysis/SkillsRadarChart';
import {
  getDashboardData,
  getProgressChartData,
  getSkillsBreakdown,
} from '../modules/skills-analysis/skillsAnalysisService';
import { downloadSkillsAnalysisPDF } from '../modules/skills-analysis/utils/skillsAnalysisPdfExport';

const SkillsAnalysisDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [skillsData, setSkillsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period] = useState('weekly');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      fetchProgressChart();
      fetchSkillsBreakdown();
    }
  }, [period, dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error loading dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressChart = async () => {
    try {
      const response = await getProgressChartData(period);
      if (response.success) {
        setProgressData(response.data);
      }
    } catch (err) {
      console.error('Error fetching progress chart:', err);
    }
  };

  const fetchSkillsBreakdown = async () => {
    try {
      const response = await getSkillsBreakdown();
      if (response.success) {
        setSkillsData(response.data);
      }
    } catch (err) {
      console.error('Error fetching skills breakdown:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your skills analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-indigo-600" />
                Skills Analysis Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Track your progress, consistency, and growth</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => downloadSkillsAnalysisPDF(dashboardData, progressData, skillsData)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Generate PDF
              </button>
            </div>
          </div>
        </div>

        {/* Overall Progress and Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <CircularProgress
              percentage={dashboardData?.overallProgress || 0}
              title="Overall Progress"
              subtitle={`${dashboardData?.tasksCompleted || 0} of ${dashboardData?.totalTasks || 0} tasks completed`}
            />
          </div>

          <div className="md:col-span-2">
            <ConsistencyCard
              level={dashboardData?.consistencyLevel || 'Low'}
              score={dashboardData?.consistencyScore || 0}
            />
          </div>
        </div>

        {/* Behavior Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
          <BehaviorAnalysis
            procrastination={dashboardData?.procrastinationBehavior || 'Low'}
            avgDaysLate={dashboardData?.avgDaysLate || 0}
            onTimeCompletion={dashboardData?.onTimeCompletion || { count: 0, percentage: 0 }}
            lateSubmissions={dashboardData?.lateSubmissions || { count: 0, percentage: 0 }}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {progressData && <ProgressChart data={progressData} />}
          {skillsData && <SkillsRadarChart data={skillsData} />}
        </div>

        {/* Skills Improvement */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
          <SkillsImprovement skills={dashboardData?.skillsImprovement || {}} />
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <AISuggestions suggestions={dashboardData?.aiSuggestions || []} />
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-gray-500 text-sm font-medium">Tasks Completed</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {dashboardData?.tasksCompleted || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-gray-500 text-sm font-medium">On-Time Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {dashboardData?.onTimeCompletion?.percentage || 0}%
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-gray-500 text-sm font-medium">Late Submissions</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {dashboardData?.lateSubmissions?.count || 0}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-gray-500 text-sm font-medium">Avg Days Late</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {dashboardData?.avgDaysLate || 0}d
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsAnalysisDashboard;
