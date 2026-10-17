import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  AlertCircle,
  ArrowUp,
  CheckCircle,
  Clock,
  Filter,
  Zap,
  FileText,
} from "lucide-react";
import api from "../../utils/api.js";
import {
  RiskIndicator,
  ProgressTracker,
  TaskBreakdownModal,
  TaskDetailsModal,
} from "../components/index.js";

const CRITICAL_DAILY_THRESHOLD = 2;

const PriorityTrackingPage = () => {
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});
  
  // Modal states
  const [breakdownModal, setBreakdownModal] = useState({
    isOpen: false,
    task: null,
  });
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    task: null,
  });

  // Fetch priority data from backend
  useEffect(() => {
    const fetchPriorityData = async () => {
      try {
        setLoading(true);

        // Check if authenticated
        const authData = localStorage.getItem("auth");
        if (!authData) {
          throw new Error("Not authenticated. Please log in.");
        }

        // Fetch sorted assignments using api instance (already has token)
        const response = await api.get("/priority/sorted");

        setTasks(response.data.assignments || []);
        setSummary(response.data.summary || {});

        // Fetch workload analysis
        try {
          const workloadResponse = await api.get("/priority/workload-analysis");
          setWorkload(workloadResponse.data.workload || []);
        } catch (workloadErr) {
          console.warn("Could not fetch workload:", workloadErr.message);
        }
      } catch (err) {
        console.error("Error fetching priority data:", err);
        setError(err.message || "Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchPriorityData();
  }, []);

  const visibleTasks = useMemo(() => {
    if (activeFilter === "All") return tasks;
    return tasks.filter((task) => task.priorityBand === activeFilter);
  }, [tasks, activeFilter]);

  const overloadDays = useMemo(() => {
    return workload.filter(
      (day) => day.criticalCount > CRITICAL_DAILY_THRESHOLD,
    );
  }, [workload]);

  const filterOptions = ["All", "Critical", "High", "Medium", "Low"];

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-2">Loading priority data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle size={20} />
          <div>
            <h3 className="font-semibold">Error loading assignments</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* --- LEFT: SMART PRIORITY LIST --- */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Smart Priority{" "}
              <Flame className="text-orange-500 fill-orange-500" />
            </h1>
            <p className="text-gray-500">
              Tasks automatically sorted by urgency and impact.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className="text-sm font-semibold text-gray-600 bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              {filterOptions.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {overloadDays.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
            <div className="font-semibold flex items-center gap-2">
              <AlertCircle size={16} /> Workload overload warning
            </div>
            <p className="mt-1">
              Critical tasks exceed the daily threshold on{" "}
              {overloadDays[0].date} ({overloadDays[0].criticalCount} tasks).
              Consider rescheduling.
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Task List */}
          {visibleTasks.length > 0 ? (
            visibleTasks.map((task) => {
              
              const getPriorityColor = (band) => {
                switch (band) {
                  case "Critical":
                    return "bg-red-50 hover:bg-red-100";
                  case "High":
                    return "bg-orange-50 hover:bg-orange-100";
                  case "Medium":
                    return "bg-yellow-50 hover:bg-yellow-100";
                  default:
                    return "bg-green-50 hover:bg-green-100";
                }
              };

              return (
                <div
                  key={task._id}
                  className={`border-b border-gray-100 transition cursor-pointer group ${getPriorityColor(
                    task.priorityBand
                  )}`}
                  onClick={() =>
                    setDetailsModal({ isOpen: true, task })
                  }
                >
                  <div className="p-4 space-y-3">
                    {/* Top Row: Score, Title, Risk */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Score Badge */}
                      <div className="col-span-1 flex justify-center">
                        <div
                          className={`
                          w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
                          ${
                            task.priorityBand === "Critical"
                              ? "bg-red-500 text-white"
                              : task.priorityBand === "High"
                                ? "bg-orange-500 text-white"
                                : task.priorityBand === "Medium"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-green-500 text-white"
                          }
                        `}
                        >
                          {task.priorityScore}
                        </div>
                      </div>

                      {/* Task Title */}
                      <div className="col-span-5">
                        <h3 className="font-bold text-gray-800 text-base">
                          {task.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">{task.course}</p>
                      </div>

                      {/* Due Date */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 font-semibold">
                          Due Date
                        </p>
                        <p
                          className={`text-sm font-bold flex items-center gap-1 ${
                            task.daysRemaining <= 2
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          <Clock size={14} />
                          {task.daysRemaining} days
                        </p>
                      </div>

                      {/* Hours */}
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 font-semibold">
                          Est. Hours
                        </p>
                        <p className="text-sm font-bold text-indigo-600">
                          {task.totalEstimatedHours}h
                        </p>
                      </div>

                      {/* Priority Badge */}
                      <div className="col-span-2 flex justify-end">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            task.priorityBand === "Critical"
                              ? "bg-red-200 text-red-800"
                              : task.priorityBand === "High"
                                ? "bg-orange-200 text-orange-800"
                                : task.priorityBand === "Medium"
                                  ? "bg-yellow-200 text-yellow-800"
                                  : "bg-green-200 text-green-800"
                          }`}
                        >
                          {task.priorityBand}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Risk & Actions */}
                    <div className="grid grid-cols-12 gap-4 items-center pt-2 border-t border-gray-200">
                      <div className="col-span-1"></div>

                      {/* Risk Status */}
                      <div className="col-span-4">
                        <RiskIndicator
                          daysRemaining={task.daysRemaining}
                          isCompleted={task.status === "Completed"}
                          priorityBand={task.priorityBand}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="col-span-7 flex gap-2 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBreakdownModal({ isOpen: true, task });
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                          title="Break down into subtasks"
                        >
                          <Zap size={14} />
                          Breakdown
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailsModal({ isOpen: true, task });
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
                          title="View details"
                        >
                          <FileText size={14} />
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-sm text-gray-500">
              No tasks found for selected filter.
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT: ANALYTICS & BURNDOWN --- */}
      <div className="space-y-6">
        {/* Stats Card */}
        <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-200 text-sm font-medium">
                Average Priority
              </p>
              <h3 className="text-3xl font-bold">{summary.average || 0} pts</h3>
            </div>
            <div className="bg-white/20 p-2 rounded-lg">
              <ArrowUp size={20} className="text-white" />
            </div>
          </div>
          <div className="text-xs text-indigo-100 flex items-center gap-1">
            <CheckCircle size={12} /> {summary.total || 0} active tasks
          </div>
        </div>

        {/* Workload Chart Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-2">7-Day Workload</h3>
          <p className="text-xs text-gray-500 mb-6">Hours per day</p>

          <div className="space-y-3">
            {workload.slice(0, 7).map((day, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-600 w-20">
                  {day.date}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (day.totalHours / 8) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 font-semibold w-10 text-right">
                  {day.totalHours}h
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-indigo-600">
                  {workload.reduce((sum, d) => sum + d.totalHours, 0)}h
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg/Day</p>
                <p className="font-bold text-indigo-600">
                  {workload.length > 0
                    ? Math.round(
                        workload.reduce((sum, d) => sum + d.totalHours, 0) /
                          workload.length,
                      )
                    : 0}
                  h
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TaskBreakdownModal
        task={breakdownModal.task}
        isOpen={breakdownModal.isOpen}
        onClose={() => setBreakdownModal({ isOpen: false, task: null })}
        onSave={() => {
          setBreakdownModal({ isOpen: false, task: null });
          // Refresh data
          window.location.reload();
        }}
      />

      <TaskDetailsModal
        task={detailsModal.task}
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, task: null })}
        onUpdate={() => {
          // Could refresh just the task or the whole list
        }}
      />
    </div>
  );
};

export default PriorityTrackingPage;
