import React, { useEffect, useMemo, useState } from "react";
import {
  Flame,
  AlertCircle,
  ArrowUp,
  CheckCircle,
  Clock,
  Filter,
  Lock,
  ChevronDown,
  ChevronUp,
  Target,
  Circle,
  CheckCircle2,
} from "lucide-react";
import api from "../utils/api.js";

const CRITICAL_DAILY_THRESHOLD = 2;
const isResolvedTaskStatus = (status) =>
  status === "Completed" || status === "Done";

// Helper: Calculate Subtask Score
const getSubtaskScore = (st) => {
  let base =
    st.difficultyLevel === "High"
      ? 70
      : st.difficultyLevel === "Medium"
        ? 40
        : 15;
  let score = Math.min(base + (st.estimatedHours || 0) * 3, 99);
  let band =
    score >= 70
      ? "Critical"
      : score >= 40
        ? "High"
        : score >= 20
          ? "Medium"
          : "Low";
  return { score, band };
};

const SmartPriority = () => {
  // Unified State
  const [assignments, setAssignments] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null); // For loading state on checkmarks

  // UI State
  const [activeFilter, setActiveFilter] = useState("All");
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // 1. Fetch All Unified Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // 1. Fetch main assignments and workload
        const [priorityRes, workloadRes] = await Promise.all([
          api.get("/priority/sorted"),
          api
            .get("/priority/workload-analysis")
            .catch(() => ({ data: { workload: [] } })),
        ]);

        const fetchedAssignments = priorityRes.data.assignments || [];
        setSummary(priorityRes.data.summary || {});
        setWorkload(workloadRes.data.workload || []);

        // Only real assignments have subtask detail endpoints. Calendar items
        // are also returned in /priority/sorted, but their ids do not exist in
        // the assignments collection.
        const hydratedAssignments = await Promise.all(
          fetchedAssignments.map(async (assignment) => {
            const isRealAssignment = assignment.type === "assignment";
            const needsSubtasks =
              isRealAssignment &&
              (assignment.status === "Active" ||
                assignment.status === "Overdue");

            if (!needsSubtasks) {
              return { ...assignment, subtasks: assignment.subtasks || [] };
            }

            try {
              const subRes = await api.get(`/priority/${assignment._id}`);
              const subtasks = (subRes.data.subtasks || []).map((st, idx) => ({
                ...st,
                _originalIndex: idx,
              }));

              return { ...assignment, subtasks };
            } catch (err) {
              console.error(
                `Failed to fetch subtasks for assignment ${assignment._id}`,
                err,
              );
              return { ...assignment, subtasks: [] };
            }
          }),
        );

        setAssignments(hydratedAssignments);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 2. Compute Actionable Tasks for "What To Do" Focus Mode
  const courseWorkload = useMemo(() => {
    const totals = {};
    assignments.forEach(a => {
      if (!isResolvedTaskStatus(a.status) && a.course) {
        totals[a.course] = (totals[a.course] || 0) + (a.totalEstimatedHours || 0);
      }
    });
    // Convert to array and sort by most hours
    return Object.entries(totals)
      .map(([course, hours]) => ({ course, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 4); // Top 4 courses
  }, [assignments]);

  const actionableTasks = useMemo(() => {
    let tasks = [];

    assignments.forEach((assignment) => {
      if (isResolvedTaskStatus(assignment.status)) return;

      if (!assignment.subtasks || assignment.subtasks.length === 0) {
        // Manual assignment (No AI breakdown)
        tasks.push({
          type:
            assignment.type === "assignment" ? "assignment" : "calendarTask",
          id: assignment._id,
          title: assignment.title,
          course: assignment.course,
          score: assignment.priorityScore,
          band: assignment.priorityBand,
          estimatedHours: assignment.totalEstimatedHours,
          assignmentId: assignment._id,
          isBlocker: false,
        });
      } else {
        // AI Breakdown: Find the highest priority actionable subtask
        const uncompleted = assignment.subtasks.filter((st) => !st.completed);

        if (uncompleted.length > 0) {
          // Find absolute highest priority uncompleted subtask
          let maxScore = -1;
          let targetSubtask = null;

          uncompleted.forEach((st) => {
            const { score } = getSubtaskScore(st);
            if (score > maxScore) {
              maxScore = score;
              targetSubtask = st;
            }
          });

          // Check for blockers (tasks that come before the target task in order)
          const blockers = uncompleted.filter(
            (st) => st._originalIndex < targetSubtask._originalIndex,
          );

          let immediateAction =
            blockers.length > 0 ? blockers[0] : targetSubtask;
          let isBlocker = blockers.length > 0;
          let { score: actualScore, band: actualBand } =
            getSubtaskScore(immediateAction);

          tasks.push({
            type: "subtask",
            id: immediateAction._id,
            title: immediateAction.title,
            course: assignment.course,
            // Inherit the max score if it's a blocker so it stays at the top of the list!
            score: isBlocker ? maxScore : actualScore,
            actualScore: actualScore,
            band: isBlocker
              ? maxScore >= 70
                ? "Critical"
                : "High"
              : actualBand,
            estimatedHours: immediateAction.estimatedHours,
            assignmentId: assignment._id,
            assignmentTitle: assignment.title,
            isBlocker: isBlocker,
            unlocksTitle: isBlocker ? targetSubtask.title : null,
            blockersCount: blockers.length,
            progress: `${assignment.subtasks.length - uncompleted.length}/${assignment.subtasks.length}`,
            progressPercent:
              ((assignment.subtasks.length - uncompleted.length) /
                assignment.subtasks.length) *
              100,
          });
        }
      }
    });

    // Sort globally by score
    return tasks.sort((a, b) => b.score - a.score);
  }, [assignments]);

  // 3. Mark Done Handler (Optimistic UI Update)
  const handleMarkDone = async (task) => {
    setActioningId(task.id);

    try {
      // Optimistic update of local state
      setAssignments((prev) =>
        prev.map((assign) => {
          if (task.type === "assignment" && assign._id === task.id) {
            return { ...assign, status: "Completed" };
          }
          if (task.type === "calendarTask" && assign._id === task.id) {
            return { ...assign, status: "Done" };
          }
          if (task.type === "subtask" && assign._id === task.assignmentId) {
            return {
              ...assign,
              subtasks: assign.subtasks.map((st) =>
                st._id === task.id ? { ...st, completed: true } : st,
              ),
            };
          }
          return assign;
        }),
      );

      // Fire API Call (Replace with your actual completion endpoints)
      if (task.type === "assignment") {
        await api.put(`/assignments/${task.id}`, { status: "Completed" });
      } else if (task.type === "calendarTask") {
        await api.put(`/calendar/${task.id}`, { status: "Done" });
      } else {
        await api.patch(`/subtasks/${task.id}`, { completed: true });
      }
    } catch (err) {
      console.error("Failed to mark done:", err);
      // Revert state if failed (simplification: reload page)
      window.location.reload();
    } finally {
      setActioningId(null);
    }
  };

  const handleToggleSubtask = async (
    assignmentId,
    subtaskId,
    currentStatus,
  ) => {
    const newStatus = !currentStatus;
    setActioningId(subtaskId);

    try {
      setAssignments((prev) =>
        prev.map((assign) => {
          if (assign._id === assignmentId) {
            return {
              ...assign,
              subtasks: assign.subtasks.map((st) =>
                st._id === subtaskId ? { ...st, completed: newStatus } : st,
              ),
            };
          }
          return assign;
        }),
      );

      await api.patch(`/subtasks/${subtaskId}`, { completed: newStatus });
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      // Revert state if failed
      setAssignments((prev) =>
        prev.map((assign) => {
          if (assign._id === assignmentId) {
            return {
              ...assign,
              subtasks: assign.subtasks.map((st) =>
                st._id === subtaskId ? { ...st, completed: currentStatus } : st,
              ),
            };
          }
          return assign;
        }),
      );
    } finally {
      setActioningId(null);
    }
  };

  const toggleExpand = (id) => {
    const newSet = new Set(expandedTasks);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedTasks(newSet);
  };

  // --- Render Helpers ---
  const getBadgeColor = (band) => {
    switch (band) {
      case "Critical":
        return "bg-red-500 text-white shadow-red-200";
      case "High":
        return "bg-orange-500 text-white shadow-orange-200";
      case "Medium":
        return "bg-yellow-500 text-white shadow-yellow-200";
      default:
        return "bg-green-500 text-white shadow-green-200";
    }
  };

  const topTask = actionableTasks[0];
  const overloadDays = workload.filter(
    (day) => day.criticalCount > CRITICAL_DAILY_THRESHOLD,
  );
  const visibleAssignments =
    activeFilter === "All"
      ? assignments
      : assignments.filter((a) => a.priorityBand === activeFilter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">
          Analyzing priorities...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            Smart Dashboard{" "}
            <Flame className="text-orange-500 fill-orange-500" size={28} />
          </h1>
          <p className="text-slate-500 mt-1">
            Your intelligent priority analysis and tracking.
          </p>
        </div>
      </div>

      {overloadDays.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span className="font-semibold">Workload warning:</span> Critical
          tasks exceed threshold on {overloadDays[0].date}.
        </div>
      )}

      {/* --- TOP SECTION: FOCUS MODE (WHAT TO DO) --- */}
      {topTask ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group pb-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-indigo-50 to-transparent pointer-events-none"></div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              {topTask.isBlocker && (
                <div className="bg-orange-50/80 border-2 border-orange-200 rounded-xl p-4 mb-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400"></div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 bg-orange-100 p-1.5 rounded-lg text-orange-600">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-orange-800 font-bold text-sm tracking-wide uppercase mb-1">
                        Dependencies Unmet
                      </h4>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        You must complete <strong>this current task</strong>
                        {topTask.blockersCount > 1 &&
                          ` and ${topTask.blockersCount - 1} other remaining subtask${topTask.blockersCount - 1 > 1 ? "s" : ""} `}{" "}
                        first to unlock your most important task:
                        <span className="block mt-1 font-black text-orange-900 bg-orange-100/50 p-2 rounded border border-orange-200/50 inline-block w-full">
                          "{topTask.unlocksTitle}"
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-md text-xs uppercase tracking-wider flex items-center gap-1.5 border border-indigo-200">
                  <Target size={14} /> Immediate Action Required
                </span>
                {topTask.isBlocker && (
                  <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-md text-xs tracking-wider flex items-center gap-1.5 border border-orange-200">
                    <Lock size={14} /> Unlocks Priority Task
                  </span>
                )}
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight mb-2">
                {topTask.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600 mb-6 mt-4">
                {topTask.type === "subtask" && (
                  <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    For: {topTask.assignmentTitle}
                  </span>
                )}
                <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  {topTask.course}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Clock size={16} className="text-slate-400" />{" "}
                  {topTask.estimatedHours}h
                </span>
              </div>

              {/* In-Line Action */}
              <button
                onClick={() =>
                  topTask.type === "subtask"
                    ? handleToggleSubtask(
                        topTask.assignmentId,
                        topTask.id,
                        false,
                      )
                    : handleMarkDone(topTask)
                }
                disabled={actioningId === topTask.id}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {actioningId === topTask.id ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle size={20} />
                )}
                Mark as Completed
              </button>
            </div>

            <div className="md:col-span-4 flex justify-center md:justify-end">
              <div
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center shadow-lg ${getBadgeColor(topTask.band)}`}
              >
                <span className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">
                  Score
                </span>
                <span className="text-5xl font-black leading-none drop-shadow-md">
                  {topTask.score}
                </span>
                <span className="text-[10px] uppercase font-bold mt-2 bg-white/20 px-2 py-0.5 rounded shadow-sm">
                  {topTask.band}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-700">All caught up!</h2>
          <p className="text-slate-500 mt-2">
            You don't have any pending tasks right now.
          </p>
        </div>
      )}

      {/* --- BOTTOM SECTION: MASTER TRACKING & ANALYTICS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Priority List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-slate-800">
              Master Tracking List
            </h3>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="text-sm font-semibold text-gray-600 bg-white border border-gray-300 px-3 py-2 rounded-lg"
              >
                {["All", "Critical", "High", "Medium", "Low"].map((opt) => (
                  <option key={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {visibleAssignments.filter((a) => !isResolvedTaskStatus(a.status))
              .length > 0 ? (
              visibleAssignments
                .filter((a) => !isResolvedTaskStatus(a.status))
                .map((task) => {
                  const isExpanded = expandedTasks.has(task._id);
                  const hasSubtasks = task.subtasks && task.subtasks.length > 0;

                  // Progress calculation
                  const completedCount = hasSubtasks
                    ? task.subtasks.filter((st) => st.completed).length
                    : 0;
                  const progressPct = hasSubtasks
                    ? (completedCount / task.subtasks.length) * 100
                    : 0;

                  return (
                    <div
                      key={task._id}
                      className="border-b border-gray-100 last:border-0 hover:bg-slate-50 transition"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => hasSubtasks && toggleExpand(task._id)}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-1 flex justify-center">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${getBadgeColor(task.priorityBand)}`}
                            >
                              {task.priorityScore}
                            </div>
                          </div>

                          <div className="col-span-6">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {task.title}
                              {!hasSubtasks && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    task.type === "assignment"
                                      ? "bg-slate-200 text-slate-600"
                                      : "bg-indigo-100 text-indigo-700"
                                  }`}
                                >
                                  {task.type === "assignment"
                                    ? "Manual"
                                    : "Calendar"}
                                </span>
                              )}
                            </h4>

                            {/* Progress Bar for AI Subtasks */}
                            {hasSubtasks && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${progressPct}%` }}
                                  ></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">
                                  {completedCount}/{task.subtasks.length}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="col-span-2 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                              Due in
                            </p>
                            <p
                              className={`text-sm font-bold ${task.daysRemaining <= 2 ? "text-red-600" : "text-slate-700"}`}
                            >
                              {task.daysRemaining} days
                            </p>
                          </div>

                          <div className="col-span-3 flex justify-end items-center gap-3">
                            {!hasSubtasks && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkDone({
                                    type:
                                      task.type === "assignment"
                                        ? "assignment"
                                        : "calendarTask",
                                    id: task._id,
                                  });
                                }}
                                className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded border border-indigo-200 transition"
                                title={
                                  task.type === "assignment"
                                    ? "Mark Assignment Done"
                                    : "Mark Calendar Task Done"
                                }
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {hasSubtasks && (
                              <div className="text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Subtasks Accordion */}
                      {isExpanded && hasSubtasks && (
                        <div className="bg-slate-50/80 border-t border-slate-100 p-4 pt-3 space-y-2">
                          {task.subtasks.map((st, idx) => {
                            const { score, band } = getSubtaskScore(st);
                            const isSequentialDisabled =
                              !st.completed &&
                              idx > 0 &&
                              !task.subtasks[idx - 1].completed;
                            return (
                              <div
                                key={st._id}
                                className={`p-3 rounded-lg border flex items-center gap-3 transition ${st.completed ? "bg-slate-100 border-slate-200 opacity-60" : isSequentialDisabled ? "bg-white border-slate-200 opacity-70" : "bg-white border-slate-200 shadow-sm hover:shadow"}`}
                              >
                                <div
                                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${st.completed ? "bg-slate-300 text-slate-500" : getBadgeColor(band)}`}
                                >
                                  {score}
                                </div>
                                <div className="flex-1">
                                  <p
                                    className={`font-bold text-sm ${st.completed ? "text-slate-500 line-through" : "text-slate-800"}`}
                                  >
                                    {st.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {st.estimatedHours}h · {st.difficultyLevel}
                                  </p>
                                </div>

                                <div
                                  className={`flex-shrink-0 transition-transform ${isSequentialDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer active:scale-75"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSequentialDisabled) {
                                      alert(
                                        "Please complete the previous subtask first.",
                                      );
                                      return;
                                    }
                                    handleToggleSubtask(
                                      task._id,
                                      st._id,
                                      st.completed,
                                    );
                                  }}
                                  title={
                                    st.completed
                                      ? "Uncheck subtask"
                                      : isSequentialDisabled
                                        ? "Complete previous subtask first"
                                        : "Mark as complete"
                                  }
                                >
                                  {actioningId === st._id ? (
                                    <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                                  ) : st.completed ? (
                                    <CheckCircle2 className="w-6 h-6 text-emerald-500 hover:text-emerald-600" />
                                  ) : (
                                    <Circle
                                      className={`w-6 h-6 ${isSequentialDisabled ? "text-slate-300" : "text-slate-300 hover:text-emerald-500"}`}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="p-8 text-center text-slate-500">
                No active tasks found.
              </div>
            )}
          </div>
        </div>

        {/* Right: Analytics & Workload (Sidebar) */}
        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-indigo-200 text-sm font-medium">
                  Avg Priority Score
                </p>
                <h3 className="text-3xl font-bold">
                  {summary.average || 0} pts
                </h3>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <ArrowUp size={20} className="text-white" />
              </div>
            </div>
            <div className="text-xs text-indigo-100 flex items-center gap-1">
              <Target size={14} />{" "}
              {
                assignments.filter((a) => !isResolvedTaskStatus(a.status))
                  .length
              }{" "}
              active assignments
            </div>
          </div>

          {/* Time Investment by Subject */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                <Target size={18} />
                <h3 className="font-bold text-slate-800">Time Investment</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Active estimated hours broken down by subject
              </p>

              <div className="space-y-4">
                {courseWorkload && courseWorkload.length > 0 ? (
                  courseWorkload.map((item, idx) => {
                    const maxHours = Math.max(...courseWorkload.map(c => c.hours));
                    const percentage = Math.min(100, Math.round((item.hours / Math.max(1, maxHours)) * 100));
                    
                    const colors = [
                      "bg-indigo-500",
                      "bg-purple-500",
                      "bg-emerald-500",
                      "bg-orange-500"
                    ];
                    
                    return (
                      <div key={idx} className="relative">
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xs font-bold text-slate-700 truncate pr-2">
                            {item.course}
                          </span>
                          <span className="text-xs font-black text-slate-900 shrink-0">
                            {item.hours}h
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${colors[idx % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-sm font-medium text-slate-500">No active subjects</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">Total Committment</span>
                <span className="font-black text-indigo-600 text-lg">
                  {courseWorkload?.reduce((sum, item) => sum + item.hours, 0) || 0}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPriority;
