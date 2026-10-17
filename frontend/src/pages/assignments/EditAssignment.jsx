import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  Route,
  Save,
  Target,
  Trash2,
} from "lucide-react";



const InsertionZone = ({ onInsert, label }) => {
  return (
    <div className="group relative my-2 flex h-8 items-center justify-center transition-all duration-300">
      <div className="absolute inset-0 cursor-pointer" onClick={onInsert} />
      <div className="flex h-[3px] w-full items-center justify-center bg-transparent transition-colors duration-300 group-hover:bg-blue-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInsert();
          }}
          className="z-10 flex -translate-y-0 items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold text-white opacity-0 shadow-lg shadow-blue-200 transition-all duration-300 group-hover:opacity-100 hover:scale-110 active:scale-95"
        >
          <Plus className="h-3 w-3" strokeWidth={3} />
          {label || "Add Subtask"}
        </button>
      </div>
    </div>
  );
};

export default function EditAssignment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [deadline, setDeadline] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [totalEstimatedHours, setTotalEstimatedHours] = useState(0);
  const [realisticDays, setRealisticDays] = useState(0);
  const [subtasks, setSubtasks] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadAssignment = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/assignments/${id}`);
        const data = res.data;
        const assignment = data.assignment;

        if (!isMounted) return;

        setTitle(assignment.title || "");
        setCourse(assignment.course || "");
        setDeadline(
          assignment.deadline
            ? new Date(assignment.deadline).toISOString().slice(0, 10)
            : "",
        );
        setAiDescription(assignment.aiDescription || "");
        setTotalEstimatedHours(assignment.totalEstimatedHours || 0);
        setRealisticDays(assignment.realisticDays || 0);
        setSubtasks(data.subtasks || []);
      } catch (err) {
        console.error("Failed to fetch assignment", err);
        if (isMounted) {
          setError("Failed to load assignment details.");
        }
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

  const handleSubtaskChange = (index, field, value) => {
    const updated = [...subtasks];
    updated[index][field] = value;
    setSubtasks(updated);
  };

  const handleInsertSubtask = (index) => {
    const updated = [...subtasks];
    updated.splice(index, 0, {
      title: "",
      subDescription: "",
      estimatedHours: 1,
      difficultyLevel: "Medium",
      completed: false,
    });
    setSubtasks(updated);
  };

  const handleRemoveSubtask = (index) => {
    const updated = subtasks.filter((_, i) => i !== index);
    setSubtasks(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const cleanedSubtasks = subtasks.filter((subtask) =>
        subtask.title.trim(),
      );

      await api.put(`/assignments/${id}`, {
        title,
        course,
        deadline,
        aiDescription,
        totalEstimatedHours,
        realisticDays,
        subtasks: cleanedSubtasks,
      });

      navigate(`/assignments/${id}`);
    } catch (err) {
      console.error("Save failed", err);
      setError(
        err.response?.data?.message || "Failed to save assignment details.",
      );
    } finally {
      setSaving(false);
    }
  };

  
  const totalSubtasks = subtasks.length;
  
  

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate(`/assignments/${id}`)}
          className="group flex w-fit items-center gap-2 font-medium text-slate-500 transition-colors hover:text-blue-600"
        >
          <div className="rounded-full bg-slate-100 p-2 transition-colors group-hover:bg-blue-100">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Cancel and Return
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          <CardContent className="p-6 md:p-8">
            <div className="border-b border-slate-100 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Assignment Setup
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                Core Details
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Update the foundation of the assignment before adjusting the
                milestone roadmap below.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Final Physics Report"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Course
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., PHY101"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Due Date
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Total Estimated Hours
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalEstimatedHours}
                  onChange={(e) =>
                    setTotalEstimatedHours(parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">
                  AI Description / Notes
                </label>
                <textarea
                  rows={4}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description or AI-generated summary..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Realistic Days Remaining
                </label>
                <input
                  type="number"
                  min="0"
                  value={realisticDays}
                  onChange={(e) =>
                    setRealisticDays(parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          <CardContent className="p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Planner Tips
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Best results
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Keep each subtask focused on one concrete action so the
                  roadmap stays easy to follow and easier to complete.
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-700">
                <p className="text-xs font-bold uppercase tracking-[0.18em]">
                  Save behavior
                </p>
                <p className="mt-2 text-sm leading-6">
                  Empty task rows are ignored automatically when you save, so
                  you can sketch freely while editing.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 rounded-[30px] border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Roadmap Builder
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                Edit Milestones
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Rework the assignment path by adding, removing, or refining the
                subtasks that make up the roadmap.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
              <Route className="h-3.5 w-3.5 text-blue-500" />
              {totalSubtasks} milestone{totalSubtasks === 1 ? "" : "s"}
            </div>
          </div>

          <div className="mt-8 space-y-0">
            <InsertionZone
              onInsert={() => handleInsertSubtask(0)}
              label={
                subtasks.length === 0
                  ? "Add your first milestone"
                  : "Insert at top"
              }
            />

            {subtasks.length === 0 ? (
              <div className="mb-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 py-12 text-center text-slate-500">
                <p className="text-base font-semibold">No subtasks found.</p>
                <p className="mt-2 text-sm">
                  Use the insert line above to create the first roadmap
                  milestone.
                </p>
              </div>
            ) : (
              subtasks.map((task, index) => (
                <div key={index}>
                  <div className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 sm:p-6">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-slate-200 to-emerald-400 opacity-70" />

                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(index)}
                      className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Remove Subtask"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="mb-5 flex flex-wrap items-center gap-2 pr-12">
                      <Badge className="border-0 bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Step {String(index + 1).padStart(2, "0")}
                      </Badge>
                      <Badge
                        className={`border-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                          task.completed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {task.completed ? "Completed" : "Active"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Task Title *
                          </label>
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) =>
                              handleSubtaskChange(
                                index,
                                "title",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., Research references"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Description
                          </label>
                          <textarea
                            rows={4}
                            value={task.subDescription}
                            onChange={(e) =>
                              handleSubtaskChange(
                                index,
                                "subDescription",
                                e.target.value,
                              )
                            }
                            placeholder="Add notes, deliverables, or what success looks like for this milestone..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Est. Hours
                          </label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={task.estimatedHours}
                            onChange={(e) =>
                              handleSubtaskChange(
                                index,
                                "estimatedHours",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Status
                          </p>
                          <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) =>
                                handleSubtaskChange(
                                  index,
                                  "completed",
                                  e.target.checked,
                                )
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Mark Completed
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <InsertionZone
                    onInsert={() => handleInsertSubtask(index + 1)}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
