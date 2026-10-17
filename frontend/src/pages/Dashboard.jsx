import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Flame,
  CalendarDays,
  ArrowRight,
  Target,
  Brain,
  Users,
  BookOpen,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch both assignments and calendar events in parallel
        const [assignmentsRes, calendarRes] = await Promise.all([
          api.get("/assignments"),
          api.get("/calendar"),
        ]);

        setAssignments(assignmentsRes.data || []);
        setCalendarEvents(calendarRes.data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute Stats
  const pendingAssignments = assignments.filter(
    (a) => a.status === "Active" || a.status === "Overdue",
  );
  const overdueAssignments = assignments.filter((a) => a.status === "Overdue");

  const totalSubtasks = assignments.reduce(
    (sum, a) => sum + (a.subtaskCount || 0),
    0,
  );
  const completedSubtasks = assignments.reduce(
    (sum, a) => sum + (a.completed || 0),
    0,
  );
  const completionRate =
    totalSubtasks > 0
      ? Math.floor((completedSubtasks / totalSubtasks) * 100)
      : 0;

  // Process Calendar Events for "Today"
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];
  const todaysEvents = calendarEvents
    .filter((event) => {
      const eventDate = new Date(event.date).toISOString().split("T")[0];
      return eventDate === todayString;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Upcoming priority assignments (High priority or due soon)
  const priorityAssignments = [...pendingAssignments]
    .sort((a, b) => {
      if (a.priority === "High" && b.priority !== "High") return -1;
      if (a.priority !== "High" && b.priority === "High") return 1;
      const dateA = new Date(a.deadline || "9999-12-31").getTime();
      const dateB = new Date(b.deadline || "9999-12-31").getTime();
      return dateA - dateB;
    })
    .slice(0, 3); // Top 3 to fit nice

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">
          Curating your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-10 space-y-6">
      {/* HERO SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-72 h-72 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-indigo-200 text-sm font-medium mb-2">
              <Sparkles size={16} className="text-yellow-400" />
              <span>Ready for productivity?</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Welcome back,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                {user?.name ? user.name.split(" ")[0] : "Student"}
              </span>
              !
            </h1>
            <p className="text-slate-300 text-lg">
              You have{" "}
              <span className="font-bold text-white">
                {pendingAssignments.length} pending assignments
              </span>{" "}
              and{" "}
              <span className="font-bold text-white">
                {todaysEvents.length} events
              </span>{" "}
              today.
            </p>
          </div>

          <div className="mt-4 xl:mt-0 w-full xl:w-auto">
            <button
              onClick={() => navigate("/smart-priority")}
              className="w-full sm:w-auto group relative overflow-hidden bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <Flame
                size={24}
                className="relative z-10 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="relative z-10 text-lg">
                What should I do now?
              </span>
              <ArrowRight
                size={20}
                className="relative z-10 group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ROW 1: ASSIGNMENTS (span 8) & CALENDAR (span 4) */}

        {/* Assignments Widget */}
        <div
          className="md:col-span-12 lg:col-span-8 group cursor-pointer"
          onClick={() => navigate("/assignments")}
        >
          <div className="h-full bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 pointer-events-none">
              <Target size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Target size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      Assignments
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                      Your mission objective
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 text-slate-400 p-2.5 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <ChevronRight size={24} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Progress block */}
                <div className="col-span-1 md:border-r border-slate-100 md:pr-6 flex flex-col justify-center">
                  <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                    Completion Info
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-5xl font-extrabold text-slate-800">
                      {completionRate}%
                    </span>
                    <span className="text-sm font-semibold text-slate-500 pb-1.5">
                      done
                    </span>
                  </div>
                  <Progress
                    value={completionRate}
                    className="h-2.5 bg-slate-100 [&>div]:bg-indigo-500"
                  />
                  <div className="mt-5 flex flex-col sm:flex-row gap-4 text-sm font-medium">
                    <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-slate-600 flex-1 text-center">
                      <span className="text-indigo-600 font-bold block text-lg leading-none mb-1">
                        {pendingAssignments.length}
                      </span>{" "}
                      Active
                    </div>
                    <div className="bg-red-50/50 px-3 py-2 rounded-lg border border-red-50 text-slate-600 flex-1 text-center">
                      <span className="text-red-500 font-bold block text-lg leading-none mb-1">
                        {overdueAssignments.length}
                      </span>{" "}
                      Overdue
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/analytics");
                    }}
                    className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1 uppercase tracking-wider group"
                  >
                    View Detailed Analytics
                    <ArrowRight
                      size={12}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>

                {/* Top priorities */}
                <div className="col-span-1 md:col-span-2 flex flex-col">
                  <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">
                    Top Priorities
                  </div>
                  <div className="space-y-3 flex-1 flex flex-col justify-center">
                    {priorityAssignments.length === 0 ? (
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-3 text-emerald-700 font-medium">
                        <CheckCircle size={24} className="text-emerald-500" />
                        <span>All caught up on high priority tasks!</span>
                      </div>
                    ) : (
                      priorityAssignments.map((task) => (
                        <div
                          key={task._id}
                          className="p-4 rounded-xl bg-slate-50 group/item hover:bg-white transition-all flex items-center justify-between border border-transparent hover:border-slate-200 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3 overflow-hidden mr-4">
                            <div
                              className={`w-2 h-2 shrink-0 rounded-full ${task.priority === "High" ? "bg-red-500" : "bg-orange-500"}`}
                            ></div>
                            <span className="font-bold text-slate-700 truncate group-hover/item:text-indigo-700 transition-colors">
                              {task.title}
                            </span>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 ${task.status === "Overdue" ? "text-red-700 bg-red-100" : "text-slate-600 bg-slate-200/50"}`}
                          >
                            {task.deadline
                              ? new Date(task.deadline).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "numeric" },
                                )
                              : "No date"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Widget */}
        <div
          className="md:col-span-12 lg:col-span-4 group cursor-pointer"
          onClick={() => navigate("/calendar")}
        >
          <div className="h-full bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-[2rem] p-6 md:p-8 text-white shadow-lg overflow-hidden relative transition-all duration-500 hover:shadow-indigo-500/30 lg:hover:-translate-y-1">
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 p-6 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
              <CalendarDays size={100} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
                    <CalendarDays size={24} className="text-blue-200" />
                    Today
                  </h2>
                  <p className="text-blue-200 text-sm font-medium">
                    {today.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-2xl border border-white/20 shadow-inner">
                  {today.getDate()}
                </div>
              </div>

              <div className="flex-1 space-y-3 flex flex-col justify-center">
                {todaysEvents.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center justify-center">
                    <CheckCircle className="text-emerald-400 mb-2" size={32} />
                    <p className="text-white font-bold">Your day is clear!</p>
                    <p className="text-blue-200 text-sm mt-1">
                      Enjoy your free time.
                    </p>
                  </div>
                ) : (
                  todaysEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={event._id || idx}
                      className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 flex items-center gap-4 hover:bg-white/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-400/30 flex justify-center items-center font-extrabold text-white text-xs border border-white/10 shadow-inner shrink-0">
                        {event.startTime.split(" ")[0]}
                      </div>
                      <div className="flex-1 truncate">
                        <div className="font-bold text-white truncate text-[15px]">
                          {event.title}
                        </div>
                        <div className="text-xs font-medium text-blue-200 truncate mt-0.5">
                          {event.subjectModule}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {todaysEvents.length > 3 && (
                  <div className="text-center text-xs font-bold text-blue-200 uppercase tracking-widest pt-3 flex items-center justify-center gap-1">
                    + {todaysEvents.length - 3} more{" "}
                    <ArrowRight size={12} className="inline" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Skills (span 4), Flashcards (span 4), Groups (span 4) */}

        {/* Skills Analysis */}
        <div
          className="md:col-span-6 lg:col-span-4 group cursor-pointer"
          onClick={() => navigate("/skills-analysis")}
        >
          <div className="h-full bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/20 transition-all duration-500 relative overflow-hidden text-white border border-slate-800 hover:border-slate-700">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">Skills Analysis</h3>
                  <p className="text-slate-400 text-sm font-medium">
                    Track your masteries
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
              </div>

              {/* Mock visual for skills */}
              <div className="space-y-5 flex-1 flex flex-col justify-center">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200 tracking-wide uppercase">
                      Analysis
                    </span>
                    <span className="text-emerald-400">Lv. 8</span>
                  </div>
                  <Progress
                    value={80}
                    className="h-1.5 bg-slate-800 [&>div]:bg-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200 tracking-wide uppercase">
                      Design
                    </span>
                    <span className="text-blue-400">Lv. 5</span>
                  </div>
                  <Progress
                    value={50}
                    className="h-1.5 bg-slate-800 [&>div]:bg-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-200 tracking-wide uppercase">
                      Implementation
                    </span>
                    <span className="text-orange-400">Lv. 6</span>
                  </div>
                  <Progress
                    value={60}
                    className="h-1.5 bg-slate-800 [&>div]:bg-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Study Materials */}
        <div
          className="md:col-span-6 lg:col-span-4 group cursor-pointer"
          onClick={() => navigate("/study-materials")}
        >
          <div className="h-full bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-orange-200 transition-all duration-500 relative flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  Study Materials
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  Flashcards & Notes
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Brain size={24} />
              </div>
            </div>

            {/* Mock content */}
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full bg-orange-50/50 border border-orange-100/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group-hover:bg-orange-50 transition-colors h-full">
                <div className="relative">
                  <BookOpen
                    size={32}
                    className="text-orange-500 relative z-10"
                  />
                  <div className="absolute inset-0 bg-orange-400 blur-md opacity-30 mt-2"></div>
                </div>
                <span className="text-[15px] font-bold text-orange-800">
                  Quick Review
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Study Groups */}
        <div
          className="md:col-span-6 md:col-start-4 lg:col-span-4 lg:col-start-9 group cursor-pointer"
          onClick={() => navigate("/groups")}
        >
          <div className="h-full bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-purple-200 transition-all duration-500 relative flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">
                  Study Groups
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  Collaborate & learn
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
            </div>

            {/* Mock content */}
            <div className="flex-1 flex flex-col justify-center gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group-hover:border-purple-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-bold text-slate-700">
                    Active Discussions
                  </span>
                </div>
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs shadow-sm"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center text-xs font-bold text-purple-600 uppercase tracking-widest pb-1 flex items-center justify-center gap-1 group-hover:translate-x-1 transition-transform">
                View Groups <ArrowRight size={12} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
