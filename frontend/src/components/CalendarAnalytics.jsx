import React, { useMemo } from "react";
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
  CheckCircle,
  CalendarDays,
  Target,
  TrendingUp,
  BarChart2,
  Clock,
} from "lucide-react";
import { Progress } from "../components/ui/progress";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const CalendarAnalytics = ({ tasks }) => {
  // --- Data Calculations ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to get week start and end
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Helper to get month start and end
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const stats = useMemo(() => {
    let weekTasks = 0;
    let monthTasks = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;
    const typeCount = {
      deadline: 0,
      lab: 0,
      meeting: 0,
      exam: 0,
    };

    tasks.forEach((task) => {
      const taskDate = new Date(task.date);
      // Week
      if (taskDate >= startOfWeek && taskDate <= endOfWeek) {
        weekTasks++;
      }
      // Month
      if (taskDate >= startOfMonth && taskDate <= endOfMonth) {
        monthTasks++;
      }
      // Type
      if (typeCount[task.type] !== undefined) {
        typeCount[task.type]++;
      } else {
        typeCount[task.type] = 1; // fallbacks
      }
      
      // Completion and Status
      if (task.status === "Done") {
        completedCount++;
      } else if (taskDate < today) {
        overdueCount++;
      } else {
        pendingCount++;
      }
    });

    const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    return {
      weekTasks,
      monthTasks,
      typeCount,
      completedCount,
      pendingCount,
      overdueCount,
      total: tasks.length,
      completionRate,
    };
  }, [tasks, today, startOfWeek, endOfWeek, startOfMonth, endOfMonth]);

  // --- Chart Configurations ---

  const pieData = {
    labels: ["Deadline", "Lab", "Meeting", "Exam"],
    datasets: [
      {
        data: [
          stats.typeCount.deadline,
          stats.typeCount.lab,
          stats.typeCount.meeting,
          stats.typeCount.exam,
        ],
        backgroundColor: [
          "rgba(244, 63, 94, 0.8)", // Rose (Deadline)
          "rgba(59, 130, 246, 0.8)", // Blue (Lab)
          "rgba(168, 85, 247, 0.8)", // Purple (Meeting)
          "rgba(245, 158, 11, 0.8)", // Amber (Exam)
        ],
        borderColor: [
          "rgba(244, 63, 94, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(245, 158, 11, 1)",
        ],
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          font: { family: "'Inter', sans-serif", weight: "bold", size: 12 },
          color: "#475569",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 14, family: "'Inter', sans-serif" },
        bodyFont: { size: 14, family: "'Inter', sans-serif", weight: "bold" },
        padding: 12,
        cornerRadius: 8,
      },
    },
    cutout: "70%",
  };

  const barData = {
    labels: ["Status Breakdown"],
    datasets: [
      {
        label: "Done",
        data: [stats.completedCount],
        backgroundColor: "rgba(16, 185, 129, 0.8)", // Emerald
        borderRadius: 8,
        barPercentage: 0.8,
      },
      {
        label: "Pending/In Progress",
        data: [stats.pendingCount],
        backgroundColor: "rgba(99, 102, 241, 0.8)", // Indigo
        borderRadius: 8,
        barPercentage: 0.8,
      },
      {
        label: "Overdue",
        data: [stats.overdueCount],
        backgroundColor: "rgba(239, 68, 68, 0.8)", // Red
        borderRadius: 8,
        barPercentage: 0.8,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: "'Inter', sans-serif", weight: "bold" }, color: "#475569" },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif", weight: "bold" },
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { stacked: true, display: false },
      y: { stacked: true, display: false },
    },
  };

  return (
    <div className="h-full w-full bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-100/50 border border-white/20 overflow-y-auto p-6 md:p-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <BarChart2 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Calendar Analytics</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aggregate Insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Tasks (Month) Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500"><CalendarDays size={100} /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 mb-2">This Month</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black">{stats.monthTasks}</span>
              <span className="pb-1 text-sm font-bold text-blue-100">Tasks</span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm font-semibold">
              <span className="text-blue-200">{stats.weekTasks} this week</span>
            </div>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute -bottom-4 -right-4 p-4 opacity-20 transform group-hover:-translate-y-2 transition-transform duration-500"><CheckCircle size={100} /></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-2">Completion Rate</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black">{stats.completionRate}</span>
                <span className="text-2xl font-black pb-1">%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-xs font-bold text-emerald-100 mb-2">
                <span>Completed</span>
                <span>{stats.completedCount} / {stats.total}</span>
              </div>
              <Progress value={stats.completionRate} className="h-2 bg-emerald-700/30 [&>div]:bg-white" />
            </div>
          </div>
        </div>

        {/* Action Highlights Card */}
        <div className="bg-white rounded-[2rem] p-6 border-2 border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-indigo-100 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500"><TrendingUp size={100} /></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Task Activity</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500"><Clock size={16} /></div>
                <span className="text-sm font-black text-slate-700">Pending</span>
              </div>
              <span className="text-xl font-black text-slate-800">{stats.pendingCount}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-500"><Target size={16} /></div>
                <span className="text-sm font-black text-slate-700">Overdue</span>
              </div>
              <span className="text-xl font-black text-red-600">{stats.overdueCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown Chart */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md shadow-slate-100 w-full flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-black text-slate-800">Task Breakdown</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By Event Category</p>
          </div>
          <div className="flex-1 min-h-[250px] relative w-full flex items-center justify-center">
             {stats.total === 0 ? (
               <div className="text-slate-400 font-medium text-sm flex flex-col items-center">
                 <Target size={32} className="mb-2 opacity-50"/>
                 No tasks to breakdown
               </div>
             ) : (
              <Pie data={pieData} options={pieOptions} />
             )}
          </div>
        </div>

        {/* Global Progress Chart */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md shadow-slate-100 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-800">Overall Progress</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Distribution</p>
          </div>
          <div className="flex-1 min-h-[150px] max-h-[150px] relative w-full flex flex-col justify-center">
             {stats.total === 0 ? (
                <div className="text-slate-400 font-medium text-sm text-center">No active tasks.</div>
             ) : (
                <>
                  <div className="w-full h-12 flex relative rounded-xl overflow-hidden shadow-inner bg-slate-100">
                    <Bar data={barData} options={barOptions} />
                  </div>
                  <div className="mt-8 grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-2xl font-black text-emerald-500">{stats.completedCount}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Done</div>
                    </div>
                    <div className="text-center border-l border-r border-slate-100">
                      <div className="text-2xl font-black text-indigo-500">{stats.pendingCount}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-red-500">{stats.overdueCount}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overdue</div>
                    </div>
                  </div>
                </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarAnalytics;
