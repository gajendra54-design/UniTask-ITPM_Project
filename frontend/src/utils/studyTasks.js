const TYPE_COLORS = {
  deadline: "bg-red-500",
  lab: "bg-blue-500",
  meeting: "bg-green-500",
  exam: "bg-purple-500",
};

const TYPE_WEIGHTS = {
  deadline: 30,
  lab: 20,
  meeting: 15,
  exam: 25,
};

export const getTypeColor = (type) => TYPE_COLORS[type] || "bg-indigo-500";

export const getTypeWeight = (type) => TYPE_WEIGHTS[type] || 10;

export const isDuplicateTask = (tasks, candidate, excludeTaskId) => {
  return tasks.some(
    (task) =>
      task.id !== excludeTaskId &&
      task.title.trim().toLowerCase() === candidate.title.trim().toLowerCase() &&
      task.date === candidate.date &&
      (task.time || "") === (candidate.time || ""),
  );
};

export const toDateKey = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatTaskTime = (time) => {
  if (!time) return "No time";
  const [hourText = "", minuteText = ""] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return "Invalid time";

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
};
