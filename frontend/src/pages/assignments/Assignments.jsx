import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import calendarApi from "../../api/calendarApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Trash2,
  Plus,
  Search,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const ASSIGNMENTS_COLLAPSE_STORAGE_KEY = "assignmentsCollapsedSections";

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [open, setOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [collapsedSections, setCollapsedSections] = useState(() => {
    if (typeof window === "undefined") {
      return { Completed: false, Archived: false };
    }

    try {
      const savedState = localStorage.getItem(ASSIGNMENTS_COLLAPSE_STORAGE_KEY);

      if (!savedState) {
        return { Completed: false, Archived: false };
      }

      const parsedState = JSON.parse(savedState);
      return {
        Completed: parsedState.Completed ?? false,
        Archived: parsedState.Archived ?? false,
      };
    } catch (err) {
      console.error("Failed to restore collapsed assignment sections", err);
      return { Completed: false, Archived: false };
    }
  });

  const [description, setDescription] = useState("");
  const [workHoursPerDay, setWorkHoursPerDay] = useState(4);

  const [pdfFile, setPdfFile] = useState(null);
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPageData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ASSIGNMENTS_COLLAPSE_STORAGE_KEY,
        JSON.stringify(collapsedSections),
      );
    } catch (err) {
      console.error("Failed to persist collapsed assignment sections", err);
    }
  }, [collapsedSections]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const [assignmentsResult, calendarTasksResult] = await Promise.allSettled(
        [api.get("/assignments"), calendarApi.getTasks()],
      );

      if (assignmentsResult.status === "fulfilled") {
        setAssignments(assignmentsResult.value.data);
      } else {
        console.error("Failed to load assignments", assignmentsResult.reason);
      }

      if (calendarTasksResult.status === "fulfilled") {
        setCalendarTasks(calendarTasksResult.value);
      } else {
        console.error(
          "Failed to load calendar tasks",
          calendarTasksResult.reason,
        );
      }
    } catch (err) {
      console.error("Failed to load page data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    try {
      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        const res = await api.post("/assignments/upload-pdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setAiData(res.data);
      } else if (description.trim()) {
        const res = await api.post("/assignments/ai-breakdown", {
          description,
          workHoursPerDay,
        });
        setAiData(res.data);
      } else {
        setError("Please enter instructions or upload a PDF.");
      }
    } catch (err) {
      console.error("Analysis failed", err);
      setError(
        pdfFile
          ? "PDF Analysis failed. Please try again."
          : "AI Breakdown failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const saveAssignment = async () => {
    if (!aiData.deadline) {
      setError("Deadline is required to save the assignment.");
      return;
    }
    setError("");

    const payload = {
      title: aiData.title,
      course: aiData.course,
      aiDescription: aiData.aiDescription,
      deadline: aiData.deadline,
      totalEstimatedHours: aiData.totalEstimatedHours,
      realisticDays: aiData.realisticDays,
      subtasks: aiData.subtasks,
    };

    setLoading(true);
    try {
      await api.post("/assignments/save", payload);
      await fetchPageData();
      setOpen(false);
      setAiData(null);
      setDescription("");
      setPdfFile(null);
      setError("");
    } catch (err) {
      console.error("Failed to save assignment", err);
      setError("Failed to save assignment. Please check inputs or try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAssignment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assignment and all its subtasks?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/assignments/${id}`);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Failed to delete assignment", err);
      alert("Failed to delete assignment");
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  const filteredAssignments = assignments.filter((a) => {
    let statusDisplay = "In Progress";
    if (a.status === "Completed") statusDisplay = "Completed";
    else if (a.status === "Archived") statusDisplay = "Archived";
    else if (a.status === "Overdue") statusDisplay = "Overdue";

    const matchesSearch =
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.course?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || statusDisplay === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredCalendarTasks = calendarTasks.filter((task) => {
    const searchValue = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchValue) ||
      task.subjectModule?.toLowerCase().includes(searchValue) ||
      task.type?.toLowerCase().includes(searchValue)
    );
  });

  const renderAssignmentCard = (a) => {
    const progressPercent =
      a.subtaskCount > 0
        ? Math.floor(((a.completed || 0) / a.subtaskCount) * 100)
        : 0;

    let statusDisplay = "In Progress";
    let statusColor = "bg-blue-50 text-blue-700";

    if (a.status === "Completed") {
      statusDisplay = "Completed";
      statusColor = "bg-emerald-100 text-emerald-700";
    } else if (a.status === "Archived") {
      statusDisplay = "Archived";
      statusColor = "bg-slate-200 text-slate-700";
    } else if (a.status === "Overdue") {
      statusDisplay = "Overdue";
      statusColor = "bg-red-100 text-red-700";
    }

    const isRedDate = a.status === "Overdue" || a.status === "Archived";

    return (
      <Card
        key={a._id}
        onClick={() => navigate(`/assignments/${a._id}`)}
        className="group relative overflow-hidden border border-slate-200 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 flex flex-col cursor-pointer"
      >
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteAssignment(a._id);
            }}
            className="p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors shadow-sm"
            title="Delete Assignment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <CardHeader className="pb-2 pt-4 px-4">
          <div className="pr-6">
            <CardTitle className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-blue-700 transition-colors">
              {a.title}
            </CardTitle>
            <p className="text-xs font-medium text-slate-500 mt-0.5 line-clamp-1">
              {a.course}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between mt-1">
            <Badge
              variant="secondary"
              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 ${statusColor}`}
            >
              {statusDisplay}
            </Badge>

            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              <Calendar
                className={`h-3 w-3 ${isRedDate ? "text-red-500" : "text-blue-500"}`}
              />
              <span>
                {a.deadline
                  ? new Date(a.deadline).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "No Date"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="flex justify-between items-end text-[10px] font-bold mb-1.5">
              <span className="text-slate-500 uppercase tracking-wider">
                Progress
              </span>
              <span className="text-blue-700">{progressPercent}%</span>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5 bg-slate-100 [&>div]:bg-blue-600"
            />
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              {a.completed || 0} of {a.subtaskCount} subtasks
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAssignmentGroup = (
    title,
    statusDisplay,
    colorClass,
    dotColor,
    isCollapsible = false,
  ) => {
    const group = filteredAssignments.filter((a) => {
      let sd = "In Progress";
      if (a.status === "Completed") sd = "Completed";
      else if (a.status === "Archived") sd = "Archived";
      else if (a.status === "Overdue") sd = "Overdue";
      return sd === statusDisplay;
    });

    if (group.length === 0) return null;

    const isCollapsed = collapsedSections[statusDisplay] ?? false;

    return (
      <div className="mb-8 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-4">
          <div
            className={`flex items-center gap-2 ${
              isCollapsible ? "cursor-pointer select-none" : ""
            }`}
            onClick={
              isCollapsible
                ? () =>
                    setCollapsedSections((prev) => ({
                      ...prev,
                      [statusDisplay]: !prev[statusDisplay],
                    }))
                : undefined
            }
          >
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
            <h2 className={`text-lg font-bold ${colorClass}`}>{title}</h2>
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              {group.length}
            </Badge>
            {isCollapsible && (
              <>
                <div className="h-px flex-1 bg-slate-200" />
                <div className="flex items-center justify-center text-slate-500">
                  {isCollapsed ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {!isCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.map(renderAssignmentCard)}
          </div>
        )}
      </div>
    );
  };

  const renderCalendarTaskCard = (task) => {
    const typeColorMap = {
      deadline: "bg-rose-100 text-rose-700",
      lab: "bg-amber-100 text-amber-700",
      meeting: "bg-violet-100 text-violet-700",
      exam: "bg-indigo-100 text-indigo-700",
    };

    const statusColorMap = {
      Pending: "bg-slate-100 text-slate-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Done: "bg-emerald-100 text-emerald-700",
    };

    return (
      <Card
        key={task._id}
        onClick={() => navigate("/calendar")}
        className="group overflow-hidden border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 cursor-pointer"
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                {task.title}
              </CardTitle>
              <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-1">
                {task.subjectModule || "Added from Calendar"}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`shrink-0 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 ${
                typeColorMap[task.type] || "bg-slate-100 text-slate-700"
              }`}
            >
              {task.type || "task"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Badge
              variant="secondary"
              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 ${
                statusColorMap[task.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {task.status || "Pending"}
            </Badge>
            <div className="text-[10px] font-semibold text-indigo-600">
              Manage in Calendar
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-indigo-100/70">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>
                {task.date
                  ? new Date(task.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No Date"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              <span>{task.startTime || "No Time"}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Estimated effort: {task.estimatedHours ?? 0}h
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <button
          onClick={() => {
            setOpen(true);
            setError("");
          }}
          className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-md group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-4 h-4" strokeWidth={3} />
          </div>
          Add Assignment
        </button>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search assignments and calendar tasks..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              className="appearance-none w-full sm:w-auto pl-9 pr-8 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Archived">Archived</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
          {(searchQuery || statusFilter !== "All") && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors text-sm font-semibold shadow-sm w-full sm:w-auto shrink-0"
              title="Reset Filters"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Assignment Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium animate-pulse">
            Loading assignments...
          </p>
        </div>
      ) : assignments.length === 0 && calendarTasks.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">
            No assignments or calendar tasks yet. Time to relax or create one!
          </p>
        </div>
      ) : (
        <div className="space-y-10 mt-4">
          <div className="space-y-4">
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500 font-medium">
                  No assignments match your filters.
                </p>
              </div>
            ) : (
              <>
                {renderAssignmentGroup(
                  "Overdue",
                  "Overdue",
                  "text-red-700",
                  "bg-red-500",
                )}
                {renderAssignmentGroup(
                  "In Progress",
                  "In Progress",
                  "text-blue-700",
                  "bg-blue-500",
                )}
                {renderAssignmentGroup(
                  "Completed",
                  "Completed",
                  "text-emerald-700",
                  "bg-emerald-500",
                  true,
                )}
                {renderAssignmentGroup(
                  "Archived",
                  "Archived",
                  "text-slate-700",
                  "bg-slate-400",
                  true,
                )}
              </>
            )}
          </div>

          {calendarTasks.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h2 className="text-lg font-bold text-indigo-700">
                  Calendar Tasks
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  {filteredCalendarTasks.length}
                </Badge>
              </div>

              {filteredCalendarTasks.length === 0 ? (
                <div className="text-center py-12 bg-indigo-50/40 rounded-2xl border border-dashed border-indigo-100">
                  <p className="text-slate-500 font-medium">
                    No calendar tasks match your search.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredCalendarTasks.map(renderCalendarTaskCard)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Header */}
            <div className="px-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-semibold text-slate-800">
                New Assignment
              </h2>
              <button
                onClick={() => {
                  setOpen(false);
                  setError("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Unified Input Section */}
              <div className="space-y-4">
                <div
                  className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${
                    pdfFile
                      ? "border-indigo-400 bg-indigo-50/30"
                      : "border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-slate-100/50"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(
                      "border-blue-500",
                      "bg-blue-50/50",
                    );
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-blue-500",
                      "bg-blue-50/50",
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-blue-500",
                      "bg-blue-50/50",
                    );
                    const file = e.dataTransfer.files[0];
                    if (file && file.type === "application/pdf") {
                      setPdfFile(file);
                    }
                  }}
                >
                  <textarea
                    className="w-full p-6 bg-transparent outline-none min-h-[180px] text-slate-700 placeholder:text-slate-400 resize-none"
                    placeholder="Paste your assignment instructions here OR drop a PDF file..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!!pdfFile}
                  />

                  {/* File Chip / Overlay */}
                  {pdfFile && (
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between p-3 bg-white border border-indigo-100 rounded-xl shadow-sm animate-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                          </svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {pdfFile.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            PDF Document •{" "}
                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setPdfFile(null)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  {/* Upload Trigger (hidden input) */}
                  {!pdfFile && (
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                      <label className="cursor-pointer group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm">
                        <input
                          type="file"
                          className="hidden"
                          accept="application/pdf"
                          onChange={(e) => setPdfFile(e.target.files[0])}
                        />
                        <Plus
                          size={14}
                          className="group-hover:rotate-90 transition-transform"
                        />
                        Attach PDF
                      </label>
                    </div>
                  )}
                </div>

                {/* ── Work Hours Divider + Picker ── */}
                <div className="mx-4 mb-4 mt-1 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="text-xs font-medium text-slate-500">
                        Focused hours per day
                      </span>
                    </div>
                    {/* Live badge showing selected value */}
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {workHoursPerDay}h / day
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-2">
                    {[
                      { label: "1.5h", value: 1.5, hint: "Light" },
                      { label: "3h", value: 3, hint: "Normal" },
                      { label: "5h", value: 5, hint: "Focused" },
                      { label: "8h", value: 8, hint: "Intense" },
                    ].map(({ label, value, hint }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setWorkHoursPerDay(value)}
                        className={`flex-1 flex flex-col items-center py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${
                          workHoursPerDay === value
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
                            : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {label}
                        <span
                          className={`text-[9px] font-normal mt-0.5 ${
                            workHoursPerDay === value
                              ? "text-indigo-400"
                              : "text-slate-400"
                          }`}
                        >
                          {hint}
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    💡 Focused = uninterrupted work. Most students realistically
                    do <span className="font-medium text-slate-500">2–4h</span>{" "}
                    of deep work daily.
                  </p>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading || (!description.trim() && !pdfFile)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing insights...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Generate AI Breakdown</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Output Section */}
              {aiData && (
                <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Title
                      </label>
                      <input
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={aiData.title}
                        onChange={(e) =>
                          setAiData({ ...aiData, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Course
                      </label>
                      <input
                        className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={aiData.course}
                        onChange={(e) =>
                          setAiData({ ...aiData, course: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Quick Stats & Deadline Picker */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-center md:text-left">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">
                        Est. Hours
                      </p>
                      <p className="text-lg font-bold text-slate-800">
                        {aiData.totalEstimatedHours}
                      </p>
                    </div>

                    <div className="text-center md:text-left md:border-x md:border-slate-200 md:px-4">
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">
                        Realistic Days
                      </p>
                      <p className="text-lg font-bold text-slate-800">
                        {aiData.realisticDays}
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-slate-500 font-medium uppercase tracking-tight mb-1">
                        Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        className={`bg-transparent text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 rounded px-1 transition-all cursor-pointer ${
                          !aiData.deadline
                            ? "text-red-500 border border-red-300"
                            : "text-slate-800"
                        }`}
                        value={aiData.deadline || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAiData({ ...aiData, deadline: val });
                        }}
                      />
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      Task Breakdown
                    </h3>
                    <div className="space-y-2">
                      {aiData.subtasks.map((task, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg group hover:border-blue-200 transition-colors"
                        >
                          <input
                            className="flex-1 text-sm bg-transparent outline-none"
                            value={task.title}
                            onChange={(e) => {
                              const updated = [...aiData.subtasks];
                              updated[idx].title = e.target.value;
                              setAiData({ ...aiData, subtasks: updated });
                            }}
                          />
                          <span className="px-2 py-1 bg-slate-100 text-[10px] font-bold rounded uppercase text-slate-500">
                            {task.difficultyLevel}
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              className="w-12 text-sm font-semibold text-slate-700 bg-transparent outline-none"
                              value={task.estimatedHours}
                              onChange={(e) => {
                                const updated = [...aiData.subtasks];
                                updated[idx].estimatedHours = e.target.value;
                                setAiData({ ...aiData, subtasks: updated });
                              }}
                            />
                            <span className="text-xs text-slate-400">hrs</span>
                          </div>
                          <button
                            onClick={() => {
                              const updated = aiData.subtasks.filter(
                                (_, i) => i !== idx,
                              );
                              setAiData({ ...aiData, subtasks: updated });
                            }}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-col gap-2 mt-10 pt-6 border-t border-slate-100">
                {error && (
                  <div className="flex justify-end w-full">
                    <p className="text-sm text-red-500 font-medium bg-red-50 px-3 py-1.5 rounded-md border border-red-100">
                      {error}
                    </p>
                  </div>
                )}
                <div className="flex justify-end items-center gap-4">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setError("");
                    }}
                    className="text-sm font-medium text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  {aiData && (
                    <button
                      onClick={saveAssignment}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-200 transition-all active:scale-95"
                    >
                      Save Assignment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
