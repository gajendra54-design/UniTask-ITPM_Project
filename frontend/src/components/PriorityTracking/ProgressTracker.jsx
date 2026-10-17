import { CheckCircle2, Circle, Clock } from "lucide-react";

/**
 * ProgressTracker Component
 * Shows progress of subtasks with status indicators
 */
export const ProgressTracker = ({ subtasks = [] }) => {
  if (!subtasks || subtasks.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
        No subtasks created yet
      </div>
    );
  }

  const completedCount = subtasks.filter((st) => st.completed).length;
  const inProgressCount = subtasks.filter(
    (st) => st.status === "In Progress"
  ).length;
  const totalCount = subtasks.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Calculate hours
  const completedHours = subtasks
    .filter((st) => st.completed)
    .reduce((sum, st) => sum + (st.estimatedHours || 0), 0);
  const totalHours = subtasks.reduce((sum, st) => sum + (st.estimatedHours || 0), 0);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Task Progress</h4>
          <span className="text-xs font-bold text-indigo-600">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {completedCount} of {totalCount} subtasks completed · {completedHours}h of{" "}
          {totalHours}h done
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 p-2 rounded-lg text-center">
          <p className="text-xs text-gray-600">Completed</p>
          <p className="text-lg font-bold text-green-600">{completedCount}</p>
        </div>
        <div className="bg-blue-50 p-2 rounded-lg text-center">
          <p className="text-xs text-gray-600">In Progress</p>
          <p className="text-lg font-bold text-blue-600">{inProgressCount}</p>
        </div>
        <div className="bg-yellow-50 p-2 rounded-lg text-center">
          <p className="text-xs text-gray-600">Pending</p>
          <p className="text-lg font-bold text-yellow-600">
            {totalCount - completedCount - inProgressCount}
          </p>
        </div>
      </div>

      {/* Subtask List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {subtasks.map((subtask) => (
          <div
            key={subtask._id}
            className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
          >
            {/* Status Icon */}
            {subtask.completed ? (
              <CheckCircle2 size={16} className="text-green-600 mt-1 flex-shrink-0" />
            ) : subtask.status === "In Progress" ? (
              <Clock size={16} className="text-blue-600 mt-1 flex-shrink-0" />
            ) : (
              <Circle size={16} className="text-gray-400 mt-1 flex-shrink-0" />
            )}

            {/* Subtask Details */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  subtask.completed
                    ? "line-through text-gray-500"
                    : subtask.status === "In Progress"
                      ? "text-blue-700"
                      : "text-gray-800"
                }`}
              >
                {subtask.title}
              </p>
              <div className="flex gap-2 mt-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {subtask.estimatedHours}h
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${
                    subtask.difficultyLevel === "High"
                      ? "bg-red-50 text-red-700"
                      : subtask.difficultyLevel === "Medium"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-green-50 text-green-700"
                  }`}
                >
                  {subtask.difficultyLevel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTracker;
