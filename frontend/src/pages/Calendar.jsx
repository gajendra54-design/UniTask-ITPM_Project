import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pencil,
  Plus,
  Calendar as CalendarIcon,
  X,
  Target,
  BarChart2,
  Search,
} from "lucide-react";
import { Progress } from "../components/ui/progress";
import {
  formatTaskTime,
  getTypeColor,
  getTypeWeight,
  isDuplicateTask,
  toDateKey,
} from "../utils/studyTasks";
import calendarApi from "../api/calendarApi";
import assignmentApi from "../api/assignmentApi";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Toast from "../components/ui/Toast";
import CalendarAnalytics from "../components/CalendarAnalytics";

const taskTypes = ["deadline", "lab", "meeting", "exam"];

const ItemTypes = {
  TASK: "task",
};



const getAssignmentDeadlineKey = (deadline) => {
  if (!deadline) return "";

  if (typeof deadline === "string") {
    const matchedDate = deadline.match(/^\d{4}-\d{2}-\d{2}/);
    if (matchedDate) return matchedDate[0];
  }

  return toDateKey(deadline);
};

const getDefaultFormData = (dateValue) => ({
  title: "",
  date: toDateKey(dateValue),
  time: "",
  type: "deadline",
  status: "Pending",
  estimatedHours: 2,
  repeat: "None",
});

const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

const getTaskDisplayHours = (task) =>
  task.isIntegrated
    ? Number(task.totalEstimatedHours) || 0
    : Number(task.estimatedHours) || 0;

const getTaskProgressPercent = (task) => {
  if (!task.isIntegrated) return null;

  const totalSubtasks = Number(task.subtaskCount) || 0;
  const completedSubtasks = Number(task.completedSubtasks) || 0;

  if (totalSubtasks <= 0) return 0;
  return Math.floor((completedSubtasks / totalSubtasks) * 100);
};

const getTaskProgressLabel = (task) => {
  if (!task.isIntegrated) return "";

  const totalSubtasks = Number(task.subtaskCount) || 0;
  const completedSubtasks = Number(task.completedSubtasks) || 0;

  return `${completedSubtasks}/${totalSubtasks} subtasks`;
};

const isTaskCompleted = (task) =>
  task.isIntegrated
    ? task.assignmentStatus === "Completed" || task.assignmentStatus === "Archived"
    : task.status === "Done";

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("month"); // "month", "week", "day"
  const [tasks, setTasks] = useState([]);
  const [, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState(getDefaultFormData(new Date()));
  const [errors, setErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [toast, setToast] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const [calendarData, assignmentData] = await Promise.all([
        calendarApi.getTasks(),
        assignmentApi.getAssignments().catch(() => []),
      ]);

      const mappedCalendarTasks = calendarData.map((t) => ({
        ...t,
        id: t._id,
        date: toDateKey(t.date),
        time: t.startTime || t.time,
        color: getTypeColor(t.type),
        weight: getTypeWeight(t.type),
      }));

      const mappedAssignments = assignmentData
        .filter((assignment) => getAssignmentDeadlineKey(assignment.deadline))
        .map((a) => ({
          id: `a-${a._id}`,
          assignmentId: a._id,
          title: a.title,
          date: getAssignmentDeadlineKey(a.deadline),
          time: "",
          type: "deadline",
          status: a.status === "Completed" ? "Done" : "Pending",
          assignmentStatus: a.status || "Active",
          estimatedHours: 0,
          totalEstimatedHours: Number(a.totalEstimatedHours) || 0,
          subtaskCount: Number(a.subtaskCount) || 0,
          completedSubtasks: Number(a.completed) || 0,
          color: "bg-rose-600",
          weight: getTypeWeight("deadline"),
          isIntegrated: true,
        }));

      setTasks([...mappedCalendarTasks, ...mappedAssignments]);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setFormBannerError("Failed to load tasks from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const tasksByDate = useMemo(() => {
    return tasks.reduce((accumulator, task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || (task.type || "").toLowerCase() === filterType.toLowerCase();

      if (!matchesSearch || !matchesType) return accumulator;

      const key = task.date;
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(task);
      return accumulator;
    }, {});
  }, [tasks, searchQuery, filterType]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const resetFormState = (dateValue = selectedDate) => {
    setErrors({});
    setFormBannerError("");
    setFormData(getDefaultFormData(dateValue));
  };

  const openAddModal = (dateValue = selectedDate) => {
    resetFormState(dateValue);
    setIsEditOpen(false);
    setEditingTaskId(null);
    setIsAddOpen(true);
  };

  const closeAddModal = () => {
    setIsAddOpen(false);
    resetFormState(selectedDate);
  };

  const openEditModal = (task) => {
    if (task.isIntegrated) return; // Prevent editing integrated assignments directly
    setErrors({});
    setFormBannerError("");
    setIsAddOpen(false);
    setEditingTaskId(task.id);
    setFormData({
      title: task.title,
      date: task.date,
      time: task.time || "",
      type: task.type,
      status: task.status,
      estimatedHours: task.estimatedHours || 2,
      repeat: task.repeat || "None",
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingTaskId(null);
    resetFormState(selectedDate);
  };

  const validateForm = (mode) => {
    const nextErrors = {};
    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      nextErrors.title = "Task title is required.";
    } else if (trimmedTitle.length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    } else {
      const uniqueChars = new Set(trimmedTitle.toLowerCase().replace(/\s/g, '')).size;
      if (uniqueChars < 3) {
        nextErrors.title = "Title must contain at least 3 unique characters.";
      }
    }
    if (!formData.date || Number.isNaN(new Date(formData.date).getTime())) {
      nextErrors.date = "A valid due date is required.";
    }
    if (!formData.time) {
      nextErrors.time = "Start time is required.";
    } else if (!isValidTime(formData.time)) {
      nextErrors.time = "Please provide a valid time (HH:mm).";
    }
    if (!formData.type) nextErrors.type = "Please select a task type.";
    
    const hoursNum = parseFloat(formData.estimatedHours) || 0;
    if (hoursNum < 0 || hoursNum > 8) {
      nextErrors.estimatedHours = "Duration must be between 0 and 8 hours.";
    }

    if (Object.keys(nextErrors).length === 0) {
      if (isDuplicateTask(tasks, formData, mode === "edit" ? editingTaskId : undefined)) {
        nextErrors.duplicate = "Duplicate task detected for same title, date, and time.";
      }
      
      const dateKey = toDateKey(formData.date);
      const dayTasks = tasksByDate[dateKey] || [];
      const tasksOnDate = mode === "edit" 
        ? dayTasks.filter(t => t.id !== editingTaskId)
        : dayTasks;

      const currentTotalHours = tasksOnDate.reduce((sum, t) => sum + (parseFloat(t.estimatedHours) || 0), 0);
      
      if (tasksOnDate.length >= 3) {
        nextErrors.banner = `Daily Limit Exceeded: Max 3 assignments allowed per day.`;
      } else if (currentTotalHours + hoursNum > 8) {
        nextErrors.banner = `Workload Exceeded: Total daily hours would be ${currentTotalHours + hoursNum}h (Max 8h).`;
      }
    }

    setErrors(nextErrors);
    if (nextErrors.banner) setFormBannerError(nextErrors.banner);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateTask = async () => {
    if (!validateForm("create")) return;
    try {
      const taskData = {
        title: formData.title.trim(),
        date: formData.date,
        startTime: formData.time || "00:00",
        endTime: formData.time || "00:00",
        type: formData.type,
        status: "Pending",
        estimatedHours: Number(formData.estimatedHours),
        repeat: formData.repeat,
      };
      await calendarApi.createTask(taskData);
      await fetchTasks();
      setToast({ message: "ASSIGNMENT SCHEDULED SUCCESSFULLY!", type: "success" });
      closeAddModal();
    } catch (error) {
      setToast({ message: error.response?.data?.message || "FAILED TO CREATE TASK.", type: "error" });
    }
  };

  const handleUpdateTask = async () => {
    if (!validateForm("edit")) return;
    try {
      const taskData = {
        title: formData.title.trim(),
        date: formData.date,
        startTime: formData.time,
        endTime: formData.time,
        type: formData.type,
        status: formData.status,
        estimatedHours: Number(formData.estimatedHours),
        repeat: formData.repeat,
      };
      await calendarApi.updateTask(editingTaskId, taskData);
      await fetchTasks();
      setToast({ message: "GREAT! YOUR ASSIGNMENT HAS BEEN UPDATED SUCCESSFULLY.", type: "success" });
      closeEditModal();
    } catch (error) {
      setToast({ message: error.response?.data?.message || "FAILED TO UPDATE TASK.", type: "error" });
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS ASSIGNMENT?")) return;
    try {
      await calendarApi.deleteTask(id);
      await fetchTasks();
      setToast({ message: "ASSIGNMENT DELETED SUCCESSFULLY!", type: "success" });
      closeEditModal();
    } catch  {
      setToast({ message: "FAILED TO DELETE TASK.", type: "error" });
    }
  };

  const handleSeedDemo = async () => {
    try {
      setLoading(true);
      await calendarApi.seedDemoData();
      await fetchTasks();
      setToast({ message: "DEMO DATA SEEDED! READY FOR PRESENTATION.", type: "success" });
    } catch  {
      setToast({ message: "FAILED TO SEED DEMO DATA.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const onFormChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, duplicate: undefined }));
    setFormBannerError("");
  };

  const handleDateClick = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const handleTaskClick = (task) => {
    if (task.isIntegrated && task.assignmentId) {
      navigate(`/assignments/${task.assignmentId}`);
      return;
    }

    openEditModal(task);
  };

  const moveTask = async (task, targetDateKey) => {
    if (task.isIntegrated) {
      setToast({ message: "CANNOT MOVE INTEGRATED ASSIGNMENTS.", type: "error" });
      return;
    }
    if (task.date === targetDateKey) return;

    const dayTasks = tasksByDate[targetDateKey] || [];
    const totalHours = dayTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const taskHours = task.estimatedHours || 0;

    if (dayTasks.length >= 3) {
      setToast({ message: "Cannot move: Max 3 assignments allowed per day.", type: "error" });
      return;
    }

    if (totalHours + taskHours > 8) {
      setToast({ message: `Cannot move: Exceeds 8h daily limit (Total: ${totalHours + taskHours}h).`, type: "error" });
      return;
    }

    try {
      await calendarApi.updateTask(task.id, { ...task, date: targetDateKey });
      await fetchTasks();
      setToast({ message: "ASSIGNMENT RESCHEDULED SUCCESSFULLY!", type: "success" });
    } catch  {
      setToast({ message: "FAILED TO UPDATE TASK LOCATION.", type: "error" });
    }
  };

  // variant: "month" (compact pill) | "week" (medium card) | "day" (full tile) | "panel" (detail card)
  const DraggableTask = ({ task, onClick, className, variant = "month" }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.TASK,
      item: task,
      canDrag: !task.isIntegrated,
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }), [task]);

    const progressPercent = getTaskProgressPercent(task);
    const displayHours = getTaskDisplayHours(task);
    const showIntegratedProgress = task.isIntegrated;
    const showTime = !task.isIntegrated && task.time;
    const interactionClass = task.isIntegrated
      ? "cursor-pointer"
      : isDragging
        ? "cursor-grabbing"
        : "cursor-grab";

    // --- MONTH VIEW: compact coloured pill ---
    if (variant === "month") {
      return (
        <div
          ref={drag}
          onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
          title={task.title}
          className={`${task.color} text-white rounded px-1.5 py-1 min-w-0 w-full ${isDragging ? "opacity-50" : ""} ${interactionClass} hover:brightness-110 transition-all`}
        >
          <div className="flex items-center gap-1 min-w-0 w-full">
            <span className="text-[9px] font-bold truncate leading-none flex-1">{task.title}</span>
            {task.isIntegrated && <span className="text-[7px] font-black bg-white/30 px-1 rounded shrink-0">SYNC</span>}
          </div>
          {task.isIntegrated && (
            <div className="mt-1 flex items-center gap-1 text-[7px] font-black text-white/90">
              <span className="bg-black/20 px-1 py-px rounded shrink-0">{progressPercent}%</span>
              {displayHours > 0 && <span className="bg-black/20 px-1 py-px rounded shrink-0">{displayHours}h</span>}
            </div>
          )}
        </div>
      );
    }

    // --- WEEK VIEW: medium card with time ---
    if (variant === "week") {
      return (
        <div
          ref={drag}
          onClick={onClick}
          title={task.title}
          className={`${task.color} text-white rounded-xl p-2.5 flex flex-col gap-1 w-full ${isDragging ? "opacity-50" : ""} ${interactionClass} hover:brightness-110 transition-all shadow-sm`}
        >
          {showTime && <p className="text-[9px] font-black opacity-80 uppercase tracking-widest">{task.time}</p>}
          <p className="text-xs font-bold truncate leading-tight">{task.title}</p>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[7px] font-black bg-black/20 px-1.5 py-0.5 rounded uppercase tracking-wide">{task.type}</span>
            {displayHours > 0 && <span className="text-[7px] font-black bg-black/20 px-1.5 py-0.5 rounded">{displayHours}h</span>}
            {task.isIntegrated && <span className="text-[7px] font-black bg-white/30 px-1 rounded">SYNC</span>}
          </div>
          {showIntegratedProgress && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-white/85">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-1 bg-white/20 [&>div]:bg-white" />
              <p className="text-[8px] font-bold text-white/80">{getTaskProgressLabel(task)}</p>
            </div>
          )}
        </div>
      );
    }

    // --- DAY VIEW: full tile with time block ---
    if (variant === "day") {
      return (
        <div
          ref={drag}
          onClick={onClick}
          title={task.title}
          className={`group/task ${task.color} text-white rounded-2xl p-4 flex items-center gap-4 w-full ${isDragging ? "opacity-50" : ""} ${interactionClass} hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg border border-white/10`}
        >
          {showTime ? (
            <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center justify-center shrink-0 min-w-[52px]">
              <span className="text-sm font-black leading-none">{task.time.split(":")[0]}</span>
              <span className="text-[9px] font-bold opacity-70">:{task.time.split(":")[1]}</span>
            </div>
          ) : (
            <div className="bg-black/20 rounded-xl p-3 flex flex-col items-center justify-center shrink-0 min-w-[74px]">
              <span className="text-[8px] font-black uppercase tracking-[0.18em] opacity-70">All Day</span>
              <span className="text-[10px] font-black">AI Sync</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black leading-tight truncate">{task.title}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="bg-black/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">{task.type}</span>
              {displayHours > 0 && <span className="bg-black/20 px-2 py-0.5 rounded-md text-[9px] font-black">{displayHours}h</span>}
              {isTaskCompleted(task) && <span className="bg-emerald-500/30 border border-emerald-300/30 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">DONE</span>}
              {task.isIntegrated && <span className="bg-white/20 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">DETAILS</span>}
            </div>
            {showIntegratedProgress && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-white/85">
                  <span>Progress</span>
                  <span>{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-white/20 [&>div]:bg-white" />
                <p className="text-[9px] font-bold text-white/80">{getTaskProgressLabel(task)}</p>
              </div>
            )}
          </div>
          <div className="bg-white/20 p-2 rounded-xl opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0">
            {task.isIntegrated ? <Target size={13} /> : <Pencil size={13} />}
          </div>
        </div>
      );
    }

    // --- SIDE PANEL: full detail card ---
    return (
      <div
        ref={drag}
        onClick={onClick}
        title={task.title}
        className={`${className} ${isDragging ? "opacity-50" : ""} ${interactionClass}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className={`px-3 py-1 rounded-lg text-[8px] font-black text-white uppercase tracking-widest ${task.color}`}>{task.type}</div>
          <button className="text-slate-300 hover:text-indigo-600 transition-colors p-1" onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>{task.isIntegrated ? <Target size={13} /> : <Pencil size={13} />}</button>
        </div>
        <h4 className="font-black text-slate-800 text-sm leading-snug mb-3">{task.title}</h4>
        <div className="flex items-center gap-4 text-slate-400 text-[10px] font-bold">
          {showTime && <div className="flex items-center gap-1.5"><div className="p-1 bg-slate-100 rounded-md"><Clock size={11} /></div>{formatTaskTime(task.time)}</div>}
          {displayHours > 0 && <div className="flex items-center gap-1.5"><div className="p-1 bg-slate-100 rounded-md"><BarChart2 size={11} /></div>{displayHours}h</div>}
        </div>
        {showIntegratedProgress && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span>Progress</span>
              <span className="text-indigo-600">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 bg-slate-100 [&>div]:bg-indigo-600" />
            <p className="text-[10px] font-semibold text-slate-400">{getTaskProgressLabel(task)}</p>
          </div>
        )}
        {isTaskCompleted(task) && <div className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full font-bold"><Check size={10} /> Completed</div>}
        {task.isIntegrated && <div className="mt-2 inline-flex items-center gap-1 text-[9px] text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full font-bold ml-1">SYNCED • OPEN DETAILS</div>}
      </div>
    );
  };

  const DroppableDay = ({ dateObj, isSelected, isToday, day, dayTasks }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.TASK,
      drop: (item) => moveTask(item, toDateKey(dateObj)),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }), [dateObj]);

    const visibleTasks = dayTasks.slice(0, 3);
    const hiddenCount = dayTasks.length - visibleTasks.length;

    return (
      <div
        ref={drop}
        onClick={() => handleDateClick(day)}
        className={`border border-slate-100 p-1.5 cursor-pointer transition-all relative group flex flex-col overflow-hidden ${
          isSelected ? "bg-indigo-50 border-indigo-300 shadow-sm" : "hover:bg-slate-50/80 bg-white"
        } ${isOver ? "bg-indigo-100 ring-2 ring-indigo-400 ring-inset scale-[0.98]" : ""}`}
      >
        <div className="flex justify-between items-start shrink-0">
          <span
            className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
              isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {day}
          </span>
          {dayTasks.length > 0 && (
            <span className={`text-[8px] font-black px-1 py-px rounded-full ${
              dayTasks.length >= 3 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
            }`}>
              {dayTasks.length}/3
            </span>
          )}
        </div>
        <div className="mt-0.5 flex-1 space-y-0.5 min-h-0 overflow-hidden">
          {visibleTasks.map((task) => (
            <DraggableTask
              key={task.id}
              task={task}
              variant="month"
              onClick={() => handleTaskClick(task)}
            />
          ))}
          {hiddenCount > 0 && (
            <div className="text-[9px] font-black text-slate-400 pl-1 pt-0.5">+{hiddenCount} more...</div>
          )}
        </div>
      </div>
    );
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-slate-50/50 border border-slate-100"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const isSelected = selectedDate.toDateString() === dateObj.toDateString();
      const dayTasks = tasksByDate[toDateKey(dateObj)] || [];

      days.push(
        <DroppableDay
          key={day}
          dateObj={dateObj}
          isSelected={isSelected}
          isToday={isToday}
          day={day}
          dayTasks={dayTasks}
        />
      );
    }
    return days;
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      const isToday = new Date().toDateString() === dateObj.toDateString();
      const dayTasks = tasksByDate[toDateKey(dateObj)] || [];

      const DroppableWeekDay = ({ dateObj, isToday, dayTasks }) => {
        const [{ isOver }, drop] = useDrop(() => ({
          accept: ItemTypes.TASK,
          drop: (item) => moveTask(item, toDateKey(dateObj)),
          collect: (monitor) => ({
            isOver: !!monitor.isOver(),
          }),
        }), [dateObj]);

        return (
          <div ref={drop} className={`min-h-[400px] border-r border-slate-100 flex flex-col group transition-colors ${isOver ? "bg-indigo-100" : "hover:bg-indigo-50/10"}`}>
            <div className={`p-3 text-center border-b ${isToday ? "bg-indigo-50" : "bg-slate-50"}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{dateObj.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <p className={`text-lg font-black ${isToday ? "text-indigo-600" : "text-slate-700"}`}>{dateObj.getDate()}</p>
            </div>
            <div className="p-2 flex-1 space-y-2 overflow-y-auto">
              {dayTasks.map((task) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  variant="week"
                  onClick={() => handleTaskClick(task)}
                />
              ))}
              <button onClick={() => openAddModal(dateObj)} className="w-full py-2 border-2 border-dashed border-slate-100 rounded-lg text-slate-300 hover:border-indigo-200 hover:text-indigo-300 transition-all flex justify-center items-center opacity-0 group-hover:opacity-100"><Plus size={14} /></button>
            </div>
          </div>
        );
      };

      days.push(<DroppableWeekDay key={i} dateObj={dateObj} isToday={isToday} dayTasks={dayTasks} />);
    }
    return <div className="grid grid-cols-7 h-full bg-slate-50/50 divide-x divide-slate-100">{days}</div>;
  };

  const renderDayView = () => {
    const dayTasks = tasksByDate[toDateKey(selectedDate)] || [];
    const allDayTasks = dayTasks.filter((task) => !task.time);
    const timedTasks = dayTasks.filter((task) => task.time);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const DroppableHour = ({ hour, children }) => {
      const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.TASK,
        drop: (item) => moveTask({ ...item, time: `${hour.toString().padStart(2, "0")}:00` }, toDateKey(selectedDate)),
        collect: (monitor) => ({
          isOver: !!monitor.isOver(),
        }),
      }), [hour]);

      return (
        <div ref={drop} className={`flex border-b border-slate-200/60 min-h-[100px] group transition-all ${isOver ? "bg-indigo-100" : "hover:bg-indigo-500/[0.03]"}`}>
          <div className="w-20 p-3 text-[10px] font-black text-slate-400 border-r border-slate-100 flex justify-center items-start pt-4 bg-slate-50/30">{hour.toString().padStart(2, "0")}:00</div>
          <div className="flex-1 p-3 relative flex flex-col gap-2">
            {children}
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full overflow-y-auto bg-slate-50/50 backdrop-blur-md">
        <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex justify-between items-center sticky top-0 z-10 shadow-lg border-b border-indigo-500/30">
          <div>
            <h3 className="text-xl font-black tracking-tight">{selectedDate.toLocaleDateString("en-US", { weekday: "long" })}</h3>
            <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter">{dayTasks.length} Scheduled</div>
        </div>
        {allDayTasks.length > 0 && (
          <div className="p-4 border-b border-slate-200/70 bg-white/60">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">All-Day Assignments</h4>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">{allDayTasks.length}</span>
            </div>
            <div className="space-y-2">
              {allDayTasks.map((task) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  variant="day"
                  onClick={() => handleTaskClick(task)}
                />
              ))}
            </div>
          </div>
        )}
        <div className="relative">
          {hours.map((hour) => (
            <DroppableHour key={hour} hour={hour}>
              {timedTasks.filter((t) => parseInt(t.time?.split(":")[0] || "0") === hour).map((task) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  variant="day"
                  onClick={() => handleTaskClick(task)}
                />
              ))}
            </DroppableHour>
          ))}
        </div>
      </div>
    );
  };

  const renderTaskModal = (mode) => {
    const isEditMode = mode === "edit";
    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-7 bg-gradient-to-br from-indigo-50/80 to-violet-50/80 border-b border-indigo-100/50 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{isEditMode ? "MANAGE ASSIGNMENT" : "SCHEDULE NEW TASK"}</h3>
            <button onClick={isEditMode ? closeEditModal : closeAddModal} className="text-slate-500 hover:text-slate-700 p-2 hover:bg-white/50 rounded-full transition-colors"><X size={20} /></button>
          </div>
          <div className="p-5 space-y-4">
            {formBannerError && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3"><AlertCircle size={16} /> {formBannerError}</div>}
            {errors.duplicate && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{errors.duplicate}</div>}
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Task Title</label>
              <input type="text" value={formData.title} onChange={(e) => onFormChange("title", e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-slate-300" placeholder="Enter task title" />
              {errors.title && <p className="text-[10px] text-red-500 font-bold mt-1.5 pl-1 uppercase tracking-tight">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Due Date</label>
                <input type="date" value={formData.date} onChange={(e) => onFormChange("date", e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all appearance-none" />
                {errors.date && <p className="text-[10px] text-red-500 font-bold mt-1.5 pl-1 uppercase tracking-tight">{errors.date}</p>}
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Time</label>
                <input type="time" value={formData.time} onChange={(e) => onFormChange("time", e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all appearance-none" />
                {errors.time && <p className="text-[10px] text-red-500 font-bold mt-1.5 pl-1 uppercase tracking-tight">{errors.time}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Task Type</label>
                <select value={formData.type} onChange={(e) => onFormChange("type", e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold capitalize focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all">
                  {taskTypes.map((type) => (<option value={type} key={type} className="capitalize">{type}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Repeat Task</label>
                <select value={formData.repeat || "None"} onChange={(e) => onFormChange("repeat", e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all">
                  <option value="None">No Repeat</option>
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>
              {isEditMode && (
                <div>
                  <label className="text-sm font-semibold text-slate-700">Status</label>
                  <select value={formData.status} onChange={(e) => onFormChange("status", e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all">
                    <option value="Pending">PENDING</option>
                    <option value="In Progress">IN PROGRESS</option>
                    <option value="Done">COMPLETED</option>
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Estimated Duration (Hours)</label>
                <input type="number" min="0" max="8" step="0.5" value={formData.estimatedHours} onChange={(e) => onFormChange("estimatedHours", e.target.value)} className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all font-mono" />
                <div className="flex justify-between mt-1.5 px-1">
                  <p className="text-[10px] text-slate-400 font-bold tracking-tight">Max 8 hours/day.</p>
                  {errors.estimatedHours && <p className="text-[10px] text-red-500 font-black uppercase">{errors.estimatedHours}</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="p-7 bg-slate-50/80 border-t border-slate-100 flex justify-between gap-3">
            {isEditMode ? (
              <button onClick={() => handleDeleteTask(editingTaskId)} className="px-6 py-3 rounded-2xl border-2 border-red-100 text-red-600 font-black text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-200 transition-all active:scale-95">DELETE</button>
            ) : <div />}
            <div className="flex gap-3">
              <button onClick={isEditMode ? closeEditModal : closeAddModal} className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">CANCEL</button>
              <button onClick={isEditMode ? handleUpdateTask : handleCreateTask} className="px-8 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95">
                {isEditMode ? "SAVE CHANGES" : "CREATE TASK"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const selectedTasks = tasksByDate[toDateKey(selectedDate)] || [];

  return (
    <div className="flex flex-col lg:flex-row h-full gap-2">
      <div className="flex-1 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-100/50 border border-white/20 flex flex-col overflow-hidden transition-all duration-500">
        <div className="flex flex-col border-b border-slate-100 bg-white/40">
          {/* Row 1: Title and Navigation Navigation */}
          <div className="px-4 py-1 flex justify-between items-center border-b border-slate-100/50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tighter">
              <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200"><CalendarIcon className="text-white" size={20} /></div>
              <span>{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronLeft size={20} /></button>
              <button onClick={() => { const today = new Date(); setCurrentDate(today); setSelectedDate(today); }} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">TODAY</button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><ChevronRight size={20} /></button>
            </div>
          </div>
          
          {/* Row 2: Search, Filter, and Views */}
          <div className="px-4 py-1 flex flex-col sm:flex-row justify-between items-center gap-2 bg-slate-50/50">
            <div className="w-full sm:flex-1 max-w-md relative group">
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl py-1 pl-10 pr-8 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 transition-all shadow-sm group-hover:border-slate-400"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <Search size={18} strokeWidth={3} />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-all"
                  title="Clear search"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto pb-1 sm:pb-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 focus:outline-none focus:border-indigo-400 shadow-sm"
              >
                <option value="all">All Types</option>
                {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              
              <div className="flex bg-slate-200/60 p-1 rounded-xl shadow-inner min-w-[200px] justify-between">
                {["month", "week", "day", "analytics"].map((v) => (
                  <button 
                    key={v} 
                    onClick={() => setView(v)} 
                    className={`flex-1 py-1.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                      view === v 
                      ? "bg-white text-indigo-700 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {view !== "day" && view !== "analytics" && (
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (<div key={day} className="py-0.5 text-center text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{day}</div>))}
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-hidden">
          {view === "month" && <div className="grid grid-cols-7 h-full" style={{ gridAutoRows: '1fr' }}>{renderCalendarDays()}</div>}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
          {view === "analytics" && <CalendarAnalytics tasks={tasks} />}
        </div>
      </div>
      <div className="w-full lg:w-80 bg-white/60 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-indigo-100/40 border border-white/20 transition-all duration-500 border-l-0 lg:border-l border-indigo-50/50 grid grid-rows-[auto_1fr_auto]">
        <div className="p-6 border-b border-indigo-50/50 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 rounded-t-[2rem]">
          <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-1">{selectedDate.toLocaleDateString("en-US", { weekday: "long" })}</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">{selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
          <p className="text-slate-500 text-sm mt-1">{selectedTasks.length} {selectedTasks.length === 1 ? 'event' : 'events'} scheduled</p>
          
          <div className="mt-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 px-1">Daily Overview</h4>
            <div className="space-y-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm">
              <div>
                <div className="flex justify-between text-[9px] font-black tracking-[0.15em] mb-2 uppercase"><span className="text-slate-500 flex items-center gap-1.5"><Clock size={12} className="text-indigo-400"/> WORKLOAD</span><span className={`px-2 py-0.5 rounded-md ${selectedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) > 8 ? "bg-red-100 text-red-600" : "bg-indigo-100 text-indigo-600"}`}>{selectedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0)} / 8 HR</span></div>
                <Progress value={(selectedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) / 8) * 100} className="h-2 bg-indigo-50/50 border border-indigo-100/30 shadow-inner" />
              </div>
              <div className="h-px w-full bg-indigo-100/50"></div>
              <div>
                <div className="flex justify-between text-[9px] font-black tracking-[0.15em] mb-2 uppercase"><span className="text-slate-500 flex items-center gap-1.5"><BarChart2 size={12} className="text-violet-400"/> TASK LIMIT</span><span className={`px-2 py-0.5 rounded-md ${selectedTasks.length > 3 ? "bg-red-100 text-red-600" : "bg-violet-100 text-violet-600"}`}>{selectedTasks.length} / 3</span></div>
                <Progress value={(selectedTasks.length / 3) * 100} className="h-2 bg-violet-50/50 border border-violet-100/30 shadow-inner" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto min-h-[180px]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}>
          <div className="flex items-center justify-between mb-3 px-1 sticky top-0 py-1.5 bg-white/80 backdrop-blur-md z-10 rounded-lg">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Scheduled Tasks</h4>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${selectedTasks.length > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              {selectedTasks.length} {selectedTasks.length === 1 ? 'TASK' : 'TASKS'}
            </span>
          </div>
          <div className="space-y-3 pb-2">
            {selectedTasks.length > 0 ? (
              selectedTasks.map((task) => (
                <DraggableTask
                  key={task.id}
                  task={task}
                  variant="panel"
                  onClick={() => handleTaskClick(task)}
                  className="p-4 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-md shadow-indigo-50/50 hover:shadow-xl hover:shadow-indigo-100/40 hover:-translate-y-0.5 transition-all duration-300 relative group"
                />
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 bg-white/40 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><CalendarIcon size={20} /></div>
                <p className="text-sm font-semibold">No events for this day.</p>
                <p className="text-[10px] mt-1 text-slate-300">Click below to add a new task</p>
                <button onClick={() => openAddModal(selectedDate)} className="mt-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">+ ADD EVENT</button>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem] shrink-0">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 px-1">Quick Actions</h4>
          <div className="space-y-3">
            {selectedTasks.length < 3 ? (
              <button onClick={() => openAddModal(selectedDate)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <Plus size={18} strokeWidth={3} /> ADD NEW TASK
              </button>
            ) : (
              <button disabled className="w-full py-3 bg-slate-300 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 opacity-70">
                <AlertCircle size={16} strokeWidth={3} /> DAILY LIMIT REACHED (3/3)
              </button>
            )}
            <button 
              onClick={handleSeedDemo} 
              className="w-full py-2.5 bg-slate-200/50 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 group"
            >
              <Target size={16} className="group-hover:rotate-12 transition-transform" /> 
              LOAD SAMPLE TASKS
            </button>
          </div>
        </div>
      </div>
      {isAddOpen && renderTaskModal("create")}
      {isEditOpen && renderTaskModal("edit")}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

const CalendarWithDnd = () => (
  <DndProvider backend={HTML5Backend}>
    <Calendar />
  </DndProvider>
);

export default CalendarWithDnd;
