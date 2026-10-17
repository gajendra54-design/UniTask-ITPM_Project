import { useState, useEffect } from "react";
import api from "../utils/api";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
  Calendar,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  BookOpen,
  Brain,
  ListTodo,
  AlertCircle,
  RefreshCw,
  Download,
  Zap,
  Target,
  Award,
  ArrowRight,
} from "lucide-react";

import CircularProgress from "../components/SkillsAnalysis/CircularProgress";
import ConsistencyCard from "../components/SkillsAnalysis/ConsistencyCard";
import BehaviorAnalysis from "../components/SkillsAnalysis/BehaviorAnalysis";
import SkillsImprovement from "../components/SkillsAnalysis/SkillsImprovement";
import AISuggestions from "../components/SkillsAnalysis/AISuggestions";
import ProgressChart from "../components/SkillsAnalysis/ProgressChart";
import SkillsRadarChart from "../components/SkillsAnalysis/SkillsRadarChart";
import {
  getDashboardData,
  getProgressChartData,
  getSkillsBreakdown,
} from "../modules/skills-analysis/skillsAnalysisService";
import { downloadSkillsAnalysisPDF } from "../modules/skills-analysis/utils/skillsAnalysisPdfExport";
import { downloadTaskAnalyticsPDF } from "../modules/task-analytics/utils/taskAnalyticsPdfExport";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// ─── TAB IDs ────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "tasks",
    label: "Task Analytics",
    icon: <ListTodo size={18} />,
  },
  {
    id: "skills",
    label: "Skills Analysis",
    icon: <Brain size={18} />,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// TASK ANALYTICS SECTION
// ══════════════════════════════════════════════════════════════════════════════
const TaskAnalyticsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/assignments/analytics/summary");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch analytics stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">
          Analyzing your productivity…
        </p>
      </div>
    );
  }

  if (!stats)
    return (
      <div className="text-center p-10 text-slate-400 font-medium">
        No task data available.
      </div>
    );

  const completionData = {
    labels: ["Completed", "Pending"],
    datasets: [
      {
        data: [stats.completionRate.completed, stats.completionRate.pending],
        backgroundColor: ["#10b981", "#6366f1"],
        borderColor: ["#059669", "#4f46e5"],
        borderWidth: 1,
      },
    ],
  };

  const typeLabels = Object.keys(stats.typeBreakdown).filter(
    (l) => stats.typeBreakdown[l] > 0
  );
  const typeData = {
    labels: typeLabels.map((l) => l.charAt(0).toUpperCase() + l.slice(1)),
    datasets: [
      {
        label: "Tasks by Category",
        data: typeLabels.map((l) => stats.typeBreakdown[l]),
        backgroundColor: [
          "#6366f1",
          "#f43f5e",
          "#3b82f6",
          "#a855f7",
          "#f59e0b",
          "#94a3b8",
        ],
        borderColor: "rgba(255, 255, 255, 0.5)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const courseLabels = Object.keys(stats.courseBreakdown);
  const courseData = {
    labels: courseLabels,
    datasets: [
      {
        label: "Assignments by Subject",
        data: courseLabels.map((l) => stats.courseBreakdown[l]),
        backgroundColor: "rgba(99, 102, 241, 0.5)",
        borderColor: "rgb(99, 102, 241)",
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { weight: "600", family: "Inter" },
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
  };

  const efficiency =
    stats.totalTasks > 0
      ? Math.round((stats.completionRate.completed / stats.totalTasks) * 100)
      : 0;

  const sortedCourses = Object.entries(stats.courseBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-10">
      {/* Action bar and Productivity Score */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white shadow-lg overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div>
              <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs mb-1">Overall Productivity</p>
              <h2 className="text-4xl font-black">{efficiency}%</h2>
              <p className="text-indigo-100/80 text-sm mt-1 font-medium">Your output is {efficiency > 70 ? 'excellent' : efficiency > 40 ? 'steady' : 'improving'}. Keep it up!</p>
            </div>
            <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                style={{ width: `${efficiency}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadTaskAnalyticsPDF(stats)}
            className="px-6 py-3.5 bg-white text-slate-800 border-2 border-slate-100 rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center gap-2 text-sm font-bold shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<LayoutDashboard size={28} />}
          color="indigo"
          label="Total Actions"
          value={stats.totalTasks}
        />
        <StatCard
          icon={<CheckCircle2 size={28} />}
          color="emerald"
          label="Completed"
          value={stats.completionRate.completed}
        />
        <StatCard
          icon={<Calendar size={20} />}
          color="blue"
          label="Activity (7d)"
          value={stats.thisWeek.total}
          sub={`${stats.thisWeek.completed} completed`}
        />
        <StatCard
          icon={<Clock size={24} />}
          color="purple"
          label="Activity (30d)"
          value={stats.thisMonth.total}
          sub={`${stats.thisMonth.completed} completed`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Completion Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PieChartIcon size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Status</h3>
            </div>
          </div>
          <div className="h-64 relative mb-4">
            {stats.totalTasks > 0 ? (
              <Pie data={completionData} options={chartOptions} />
            ) : (
              <EmptyChart label="No completion data yet" />
            )}
          </div>
          <div className="mt-auto pt-6 border-t border-slate-50 grid grid-cols-2 gap-4 text-center">
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Success</p>
                <p className="text-lg font-black text-emerald-600">{stats.completionRate.completed}</p>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
                <p className="text-lg font-black text-indigo-600">{stats.completionRate.pending}</p>
             </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart2 size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Task Breakdown
            </h3>
          </div>
          <div className="h-80">
            {typeLabels.length > 0 ? (
              <Bar data={typeData} options={barOptions} />
            ) : (
              <EmptyChart label="No activity data yet" />
            )}
          </div>
        </div>

        {/* Course Focus */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Target size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Course Volume</h3>
          </div>
          <div className="space-y-5">
            {sortedCourses.length > 0 ? (
              sortedCourses.map(([course, count]) => (
                <div key={course} className="group cursor-default">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-700">{course}</span>
                    <span className="text-xs font-black text-slate-400">{count} Tasks</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-700 group-hover:bg-indigo-600" 
                      style={{ width: `${(count / stats.totalTasks) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyChart label="No subject data" />
            )}
          </div>
          <div className="mt-8 pt-6 border-t border-slate-50">
             <div className="flex items-center gap-3 text-indigo-600">
                <Award size={20} />
                <span className="text-sm font-bold">Top Performing Category</span>
             </div>
             <p className="text-xs text-slate-500 mt-2 font-medium">You are currently most active in <span className="font-bold text-slate-800">{sortedCourses[0]?.[0] || 'your courses'}</span>.</p>
          </div>
        </div>

        {/* Subjects Bar Chart — full width */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Subject Distribution
            </h3>
          </div>
          <div className="h-80">
            {courseLabels.length > 0 ? (
              <Bar data={courseData} options={barOptions} />
            ) : (
              <EmptyChart label="No subject data yet" />
            )}
          </div>
        </div>
      </div>

      {/* MONTHLY MOMENTUM BANNER */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-black mb-4">Monthly Momentum</h2>
            <p className="text-slate-300 text-lg leading-relaxed font-medium">
              You managed <span className="text-white font-bold">{stats.thisMonth.total} items</span> this month.
              Your current momentum is <span className="text-indigo-400 font-bold">{efficiency}%</span>. 
              {efficiency > 50 ? ' Consistency is key to your success!' : ' Focus on clearing pending items to boost your score.'}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex-1 min-w-[140px]">
                <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Weekly Focus</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black">{stats.thisWeek.total}</p>
                  <p className="text-xs text-slate-400 mb-1">Actions</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex-1 min-w-[140px]">
                <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest mb-1">Success Rate</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-black">{efficiency}%</p>
                  <p className="text-xs text-slate-400 mb-1">Efficiency</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center justify-center">
            <div className="w-56 h-56 rounded-full border-[12px] border-indigo-500/10 flex items-center justify-center relative">
              <div className="text-center">
                <p className="text-6xl font-black">{efficiency}%</p>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] mt-2">Efficiency</p>
              </div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 100}
                  strokeDashoffset={
                    2 *
                    Math.PI *
                    100 *
                    (1 -
                      (stats.totalTasks > 0
                        ? stats.completionRate.completed / stats.totalTasks
                        : 0))
                  }
                  className="text-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SKILLS ANALYSIS SECTION
// ══════════════════════════════════════════════════════════════════════════════
const SkillsAnalysisTab = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [skillsData, setSkillsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period] = useState("weekly");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (dashboardData) {
      fetchProgressChart();
      fetchSkillsBreakdown();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError("Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Error loading dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgressChart = async () => {
    try {
      const response = await getProgressChartData(period);
      if (response.success) setProgressData(response.data);
    } catch (err) {
      console.error("Error fetching progress chart:", err);
    }
  };

  const fetchSkillsBreakdown = async () => {
    try {
      const response = await getSkillsBreakdown();
      if (response.success) setSkillsData(response.data);
    } catch (err) {
      console.error("Error fetching skills breakdown:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">
          Loading your skills analysis…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-4">
        <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-red-800">
            Error Loading Skills Data
          </h3>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action bar */}
      <div className="flex justify-end gap-3">
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={() =>
            downloadSkillsAnalysisPDF(dashboardData, progressData, skillsData)
          }
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
        >
          <Download className="w-4 h-4" />
          Generate PDF
        </button>
      </div>

      {/* Overall Progress + Consistency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <CircularProgress
            percentage={dashboardData?.overallProgress || 0}
            title="Overall Progress"
            subtitle={`${dashboardData?.tasksCompleted || 0} of ${
              dashboardData?.totalTasks || 0
            } tasks completed`}
          />
        </div>
        <div className="md:col-span-2">
          <ConsistencyCard
            level={dashboardData?.consistencyLevel || "Low"}
            score={dashboardData?.consistencyScore || 0}
          />
        </div>
      </div>

      {/* Behavior Analysis */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <BehaviorAnalysis
          procrastination={dashboardData?.procrastinationBehavior || "Low"}
          avgDaysLate={dashboardData?.avgDaysLate || 0}
          onTimeCompletion={
            dashboardData?.onTimeCompletion || { count: 0, percentage: 0 }
          }
          lateSubmissions={
            dashboardData?.lateSubmissions || { count: 0, percentage: 0 }
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {progressData && <ProgressChart data={progressData} />}
        {skillsData && <SkillsRadarChart data={skillsData} />}
      </div>

      {/* Skills Improvement */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <SkillsImprovement skills={dashboardData?.skillsImprovement || {}} />
      </div>

      {/* AI Suggestions */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <AISuggestions suggestions={dashboardData?.aiSuggestions || []} />
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <FooterStat
          label="Tasks Completed"
          value={dashboardData?.tasksCompleted || 0}
          color="slate"
        />
        <FooterStat
          label="On-Time Rate"
          value={`${dashboardData?.onTimeCompletion?.percentage || 0}%`}
          color="green"
        />
        <FooterStat
          label="Late Submissions"
          value={dashboardData?.lateSubmissions?.count || 0}
          color="red"
        />
        <FooterStat
          label="Avg Days Late"
          value={`${dashboardData?.avgDaysLate || 0}d`}
          color="yellow"
        />
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SHARED SMALL COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
const colorMap = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
};

const StatCard = ({ icon, color, label, value, sub }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div
      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${colorMap[color]}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </p>
      <h3 className="text-2xl font-black text-slate-800">{value}</h3>
      {sub && (
        <p className="text-[10px] font-bold text-emerald-600">{sub}</p>
      )}
    </div>
  </div>
);

const EmptyChart = ({ label }) => (
  <div className="flex items-center justify-center h-full text-slate-400 font-medium italic">
    {label}
  </div>
);

const footerColorMap = {
  slate: "text-slate-900",
  green: "text-green-600",
  red: "text-red-600",
  yellow: "text-yellow-600",
};

const FooterStat = ({ label, value, color }) => (
  <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-4 text-center">
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${footerColorMap[color]}`}>
      {value}
    </p>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMBINED PAGE
// ══════════════════════════════════════════════════════════════════════════════
const Analytics = () => {
  const [activeTab, setActiveTab] = useState("tasks");

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-500 pb-10">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <TrendingUp className="text-indigo-600" size={32} />
            Analytics Dashboard
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Unified view of your productivity, tasks, and skill growth.
          </p>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`analytics-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 shadow-sm shadow-indigo-100"
                  : "text-slate-500 hover:text-slate-800"
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div key={activeTab} className="animate-in fade-in duration-300">
        {activeTab === "tasks" ? <TaskAnalyticsTab /> : <SkillsAnalysisTab />}
      </div>
    </div>
  );
};

export default Analytics;
