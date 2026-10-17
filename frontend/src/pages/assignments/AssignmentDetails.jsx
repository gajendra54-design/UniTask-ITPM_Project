import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Edit2,
  Flag,
  Lock,
  Route,
  Target,
} from "lucide-react";

const DEFAULT_DATE_OPTIONS = {
  weekday: "short",
  month: "long",
  day: "numeric",
  year: "numeric",
};

const formatDate = (value, options = DEFAULT_DATE_OPTIONS) => {
  if (!value) return "No deadline";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";

  return date.toLocaleDateString(undefined, options);
};

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const getStatusMeta = (assignment, completedCount, totalSubtasks) => {
  const status = assignment?.status;
  const deadlineDate = assignment?.deadline
    ? toStartOfDay(assignment.deadline)
    : null;
  const today = toStartOfDay(new Date());
  const isCompleted =
    totalSubtasks > 0
      ? completedCount === totalSubtasks
      : status === "Completed";

  if (status === "Archived") {
    return {
      label: "Archived",
      badgeClass: "bg-slate-200/85 text-slate-700",
      chipClass: "border-slate-200 bg-slate-50 text-slate-600",
    };
  }

  if (isCompleted) {
    return {
      label: "Completed",
      badgeClass: "bg-emerald-100/85 text-emerald-700 hover:bg-primary/35",
      chipClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (deadlineDate && deadlineDate < today) {
    return {
      label: "Overdue",
      badgeClass: "bg-red-100/85 text-red-700 hover:bg-primary/35",
      chipClass: "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    label: "In Progress",
    badgeClass: "bg-blue-100/75 text-blue-700 hover:bg-primary/35",
    chipClass: "border-blue-200 bg-blue-50 text-blue-700",
  };
};

const getDeadlineMeta = (deadline, statusLabel) => {
  if (!deadline) {
    return {
      label: "No deadline set",
      detail: "Add a due date from the edit page.",
      toneClass: "border-slate-200 bg-white text-slate-600 hover:bg-primary/35",
    };
  }

  const due = toStartOfDay(deadline);
  if (Number.isNaN(due.getTime())) {
    return {
      label: "Invalid deadline",
      detail: "Update the date from the edit page.",
      toneClass: "border-slate-200 bg-white text-slate-600 hover:bg-primary/35",
    };
  }

  if (statusLabel === "Completed") {
    return {
      label: "All milestones done",
      detail: formatDate(deadline),
      toneClass:
        "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-primary/35",
    };
  }

  const today = toStartOfDay(new Date());
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} overdue`,
      detail: formatDate(deadline),
      toneClass: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (diffDays === 0) {
    return {
      label: "Due today",
      detail: formatDate(deadline),
      toneClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: `${diffDays} day${diffDays === 1 ? "" : "s"} left`,
    detail: formatDate(deadline),
    toneClass: "border-blue-200 bg-blue-50 text-blue-700",
  };
};

const getMilestoneMeta = (task, index, subtasks) => {
  const isLocked =
    !task.completed && index > 0 && !subtasks[index - 1]?.completed;

  if (task.completed) {
    return {
      label: "Completed",
      cardClass:
        "border-emerald-100 bg-white/95 shadow-lg shadow-emerald-100/60",
      nodeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-600 shadow-emerald-100/70",
      badgeClass: "bg-emerald-100/85 text-emerald-700 hover:bg-primary/35",
      lineClass: "border-emerald-200",
      helperText: "Milestone cleared. You can revisit the notes anytime.",
      isLocked,
      isActive: false,
    };
  }

  if (isLocked) {
    return {
      label: "Locked",
      cardClass: "border-slate-200 bg-slate-50/95 opacity-85",
      nodeClass: "border-slate-200 bg-white text-slate-400 shadow-slate-200/60",
      badgeClass: "bg-slate-200/85 text-slate-600 hover:bg-primary/35",
      lineClass: "border-slate-200",
      helperText: "Finish the previous milestone to unlock this step.",
      isLocked,
      isActive: false,
    };
  }

  return {
    label: "Active",
    cardClass: "border-blue-200 bg-white shadow-xl shadow-blue-100/70",
    nodeClass: "border-blue-200 bg-blue-50 text-blue-600 shadow-blue-100/80",
    badgeClass: "bg-blue-100/85 text-blue-700 hover:bg-primary/35",
    lineClass: "border-blue-200",
    helperText: "This is the next action point on your roadmap.",
    isLocked,
    isActive: true,
  };
};

export default function AssignmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set());

  useEffect(() => {
    let isMounted = true;

    const loadAssignment = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/assignments/${id}`);

        if (!isMounted) return;

        setAssignment(res.data.assignment);
        setSubtasks(res.data.subtasks || []);
      } catch (fetchError) {
        console.error("Failed to fetch assignment", fetchError);

        if (!isMounted) return;

        setError("Failed to load assignment details.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAssignment();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const toggleDescription = (subtaskId) => {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(subtaskId)) {
        next.delete(subtaskId);
      } else {
        next.add(subtaskId);
      }
      return next;
    });
  };

  const toggleSubtask = async (subtaskId, currentStatus) => {
    const newStatus = !currentStatus;

    setSubtasks((prevSubtasks) =>
      prevSubtasks.map((task) =>
        task._id === subtaskId ? { ...task, completed: newStatus } : task,
      ),
    );

    try {
      await api.patch(`/subtasks/${subtaskId}`, { completed: newStatus });
    } catch (patchError) {
      console.error("Failed to update subtask status", patchError);
      setSubtasks((prevSubtasks) =>
        prevSubtasks.map((task) =>
          task._id === subtaskId ? { ...task, completed: currentStatus } : task,
        ),
      );
    }
  };

  const completedCount = subtasks.filter((task) => task.completed).length;
  const totalSubtasks = subtasks.length;
  const progressPercent =
    totalSubtasks > 0 ? Math.floor((completedCount / totalSubtasks) * 100) : 0;
  const statusMeta = getStatusMeta(assignment, completedCount, totalSubtasks);
  const deadlineMeta = getDeadlineMeta(assignment?.deadline, statusMeta.label);
  const activeMilestone =
    subtasks.find(
      (task, index) =>
        !task.completed && !getMilestoneMeta(task, index, subtasks).isLocked,
    ) || null;
  const activeMilestoneIndex = activeMilestone
    ? subtasks.findIndex((task) => task._id === activeMilestone._id)
    : -1;
  const remainingMilestones = Math.max(totalSubtasks - completedCount, 0);
  const totalMilestoneHours = subtasks.reduce(
    (sum, task) => sum + (Number(task.estimatedHours) || 0),
    0,
  );
  const completedMilestoneHours = subtasks.reduce(
    (sum, task) =>
      task.completed ? sum + (Number(task.estimatedHours) || 0) : sum,
    0,
  );
  const journeyItems = subtasks.map((task, index) => ({
    task,
    index,
    milestoneMeta: getMilestoneMeta(task, index, subtasks),
    isExpanded: expandedSubtasks.has(task._id),
  }));

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
        <p className="animate-pulse font-medium text-slate-500">
          Loading assignment data...
        </p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <Card className="rounded-3xl border border-red-200 bg-white shadow-xl shadow-red-100/40">
          <CardContent className="space-y-5 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Flag className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Assignment unavailable
              </h1>
              <p className="text-sm leading-6 text-slate-500">
                {error || "We couldn't find this assignment right now."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/assignments")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 transition-all hover:border-blue-300 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assignments
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Due Date",
      value: formatDate(assignment.deadline, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      detail: deadlineMeta.label,
      icon: Calendar,
      iconClass: "bg-blue-100 text-blue-600",
    },
    {
      label: "Completion",
      value: `${completedCount} / ${totalSubtasks || 0}`,
      detail: `${progressPercent}% of milestones finished`,
      icon: CheckCircle2,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Est. Hours",
      value: `${assignment.totalEstimatedHours || totalMilestoneHours || 0} hrs`,
      detail: `${totalSubtasks || 0} milestone${totalSubtasks === 1 ? "" : "s"} planned`,
      icon: Clock,
      iconClass: "bg-blue-100 text-blue-600",
    },
    {
      label: "Suggested Pace",
      value: assignment.realisticDays
        ? `${assignment.realisticDays} day${assignment.realisticDays === 1 ? "" : "s"}`
        : "Flexible",
      detail:
        remainingMilestones > 0
          ? `${remainingMilestones} checkpoint${remainingMilestones === 1 ? "" : "s"} left`
          : "Roadmap fully cleared",
      icon: Route,
      iconClass: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate("/assignments")}
          className="group flex w-fit items-center gap-2 font-medium text-slate-500 transition-colors hover:text-blue-600"
        >
          <div className="rounded-full bg-slate-100 p-2 transition-colors group-hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to Assignments
        </button>

        <button
          type="button"
          onClick={() => navigate(`/assignments/edit/${id}`)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-medium text-blue-600 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 active:scale-95"
        >
          <Edit2 className="h-4 w-4" />
          Edit Assignment
        </button>
      </div>

      <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-emerald-50/70 shadow-xl shadow-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(129,140,248,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_28%)]" />
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-start">
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-sky-600">
                {assignment.course || "Course not added"}
              </p>
              <Badge
                className={` border-0 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] backdrop-blur-xl shadow-sm shadow-slate-300/40 ring-1 ring-white/70 ${statusMeta.badgeClass}`}
              >
                {statusMeta.label}
              </Badge>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-900 md:text-6xl">
                {assignment.title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {assignment.aiDescription ||
                  "Follow the roadmap below to move through each milestone in order and keep your assignment on track."}
              </p>
            </div>
          </div>

          <div className="relative rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-lg shadow-slate-200/60 backdrop-blur">
            <div className="flex h-full min-h-[280px] flex-col justify-between">
              <div className="rounded-[24px] bg-slate-50 p-6">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  <Target className="h-3.5 w-3.5 text-sky-500" />
                  Progress Percentage
                </p>
                <div className="mt-6 flex items-center justify-center">
                  <div
                    className="flex h-36 w-36 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#38bdf8 ${progressPercent}%, rgba(148,163,184,0.2) ${progressPercent}% 100%)`,
                    }}
                  >
                    <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-slate-900 shadow-inner shadow-slate-200">
                      <span className="text-3xl font-black">
                        {progressPercent}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-800 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Hours Closed
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {completedMilestoneHours}/
                    {totalMilestoneHours || assignment.totalEstimatedHours || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Sequence
                  </p>
                  <p className="mt-1 text-lg font-black">
                    {activeMilestoneIndex >= 0
                      ? `Step ${activeMilestoneIndex + 1}`
                      : "Done"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 pt-0 md:grid-cols-2 md:p-8 md:pt-0 xl:grid-cols-4">
          {summaryCards.map(({ label, value, detail }) => (
            <div
              key={label}
              className="rounded-[22px] border border-white/80 bg-white/80 px-5 py-5 text-slate-900 shadow-md shadow-slate-200/50 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-3 text-xl font-black leading-tight">
                    {value}
                  </p>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                    {detail}
                  </p>
                </div>
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-600">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Route Overview
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  Visual Roadmap
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Follow the journey from first checkpoint to final delivery.
                  Each stop below keeps the sequence logic, notes, and
                  completion controls in one place.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                <Target className="h-3.5 w-3.5 text-blue-500" />
                {totalSubtasks} milestone{totalSubtasks === 1 ? "" : "s"}
              </div>
            </div>

            {totalSubtasks === 0 ? (
              <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <p className="text-base font-semibold text-slate-600">
                  No subtasks generated for this assignment yet.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Add milestones from the edit screen to turn this into a full
                  roadmap.
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <div className="space-y-4">
                  {journeyItems.map(
                    ({ task, index, milestoneMeta, isExpanded }) => {
                      const isDescriptionVisible =
                        isExpanded && task.subDescription;
                      const isLast = index === journeyItems.length - 1;

                      return (
                        <div key={task._id} className="relative pl-16 sm:pl-20">
                          {!isLast && (
                            <div
                              className={`absolute left-[22px] top-14 h-[calc(100%-1rem)] border-l-2 border-dashed ${milestoneMeta.lineClass} sm:left-[30px]`}
                            />
                          )}

                          <div
                            className={`absolute left-0 top-5 flex h-11 w-11 items-center justify-center rounded-2xl border-4 bg-white shadow-lg sm:left-2 sm:h-14 sm:w-14 ${milestoneMeta.nodeClass}`}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : milestoneMeta.isLocked ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <span className="text-sm font-black">
                                {index + 1}
                              </span>
                            )}
                          </div>

                          <div
                            className={`rounded-[28px] border p-5 shadow-lg transition-all sm:p-6 ${milestoneMeta.cardClass}`}
                          >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="border-0 bg-slate-100/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 backdrop-blur-xl shadow-sm shadow-slate-300/30 ring-1 ring-white/70 hover:bg-primary/35">
                                    Checkpoint{" "}
                                    {String(index + 1).padStart(2, "0")}
                                  </Badge>
                                  <Badge
                                    className={`border-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-xl shadow-sm shadow-slate-300/30 ring-1 ring-white/70 ${milestoneMeta.badgeClass}`}
                                  >
                                    {milestoneMeta.label}
                                  </Badge>
                                  {milestoneMeta.isActive && (
                                    <Badge className="border-0 bg-blue-600/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-xl shadow-sm shadow-blue-200/50 ring-1 ring-white/60">
                                      You Are Here
                                    </Badge>
                                  )}
                                  {task.estimatedHours > 0 && (
                                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                                      {task.estimatedHours}{" "}
                                      {task.estimatedHours === 1 ? "hr" : "hrs"}
                                    </div>
                                  )}
                                </div>

                                <h3
                                  className={`mt-4 text-lg font-black leading-7 transition-colors sm:text-xl ${
                                    task.completed
                                      ? "text-slate-500 line-through"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {task.title}
                                </h3>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                  {milestoneMeta.helperText}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 lg:max-w-[260px] lg:justify-end">
                                <button
                                  type="button"
                                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                                    milestoneMeta.isLocked
                                      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                                      : task.completed
                                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  }`}
                                  onClick={() => {
                                    if (milestoneMeta.isLocked) {
                                      window.alert(
                                        "Please complete the previous subtask first.",
                                      );
                                      return;
                                    }

                                    toggleSubtask(task._id, task.completed);
                                  }}
                                  aria-label={
                                    task.completed
                                      ? `Mark ${task.title} as incomplete`
                                      : `Mark ${task.title} as complete`
                                  }
                                >
                                  {task.completed ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : milestoneMeta.isLocked ? (
                                    <Lock className="h-4 w-4" />
                                  ) : (
                                    <Circle className="h-4 w-4" />
                                  )}
                                  {task.completed
                                    ? "Completed"
                                    : milestoneMeta.isLocked
                                      ? "Locked"
                                      : "Mark Complete"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleDescription(task._id)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-all hover:border-blue-200 hover:text-blue-700"
                                >
                                  {isExpanded ? "Hide Notes" : "Show Notes"}
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {isDescriptionVisible && (
                              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 animate-in slide-in-from-top-2 duration-200">
                                {task.subDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
            <CardContent className="p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Roadmap Notes
              </p>
              <div className="mt-4 space-y-4">
                <div
                  className={`rounded-2xl border px-4 py-4 ${statusMeta.chipClass}`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.18em]">
                    Status Snapshot
                  </p>
                  <p className="mt-2 text-lg font-black">{statusMeta.label}</p>
                  <p className="mt-1 text-sm opacity-80">
                    {statusMeta.label === "Completed"
                      ? "Every milestone has been checked off."
                      : statusMeta.label === "Overdue"
                        ? "The deadline has passed, so prioritize the active step next."
                        : "The roadmap is still in motion."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    How this roadmap works
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                    <p>Complete milestones in order to unlock the next stop.</p>
                    <p>Click a milestone card to expand the step notes.</p>
                    <p>
                      Use the edit screen anytime to change the plan details.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {assignment.aiDescription && (
            <Card className="rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
              <CardContent className="p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Brief
                </p>
                <blockquote className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm italic leading-7 text-slate-600">
                  "{assignment.aiDescription}"
                </blockquote>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
