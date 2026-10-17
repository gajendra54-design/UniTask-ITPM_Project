import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import api from "../../utils/api";
import { ProgressTracker } from "./ProgressTracker";
import { RiskIndicator } from "./RiskIndicator";

/**
 * TaskDetailsModal Component
 * Shows full task details with subtasks and progress tracking
 */
export const TaskDetailsModal = ({ task, isOpen, onClose, onUpdate }) => {
  const [, setLinkedSubtasks] = useState([]);
  const [allSubtasks, setAllSubtasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSubtask, setExpandedSubtask] = useState(null);

  useEffect(() => {
    if (isOpen && task) {
      fetchTaskDetails();
    }
  }, [isOpen, task]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch full assignment details
      const response = await api.get(`/priority/${task._id}`);
      const {  subtasks: fetchedSubtasks } = response.data;

      setLinkedSubtasks(fetchedSubtasks || []);
      setAllSubtasks(fetchedSubtasks || []);
    } catch (err) {
      setError("Failed to fetch task details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubtaskStatus = async (subtask, newStatus) => {
    try {
      // This would typically call a backend endpoint to update subtask status
      const updatedSubtasks = allSubtasks.map((st) =>
        st._id === subtask._id
          ? {
              ...st,
              status: newStatus,
              completed: newStatus === "Completed",
            }
          : st
      );
      setAllSubtasks(updatedSubtasks);
      onUpdate && onUpdate();
    } catch (err) {
      console.error("Failed to update subtask:", err);
    }
  };

  if (!isOpen || !task) return null;

  const completedSubtasks = allSubtasks.filter((st) => st.completed).length;
  const totalSubtasks = allSubtasks.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex justify-between items-start sticky top-0 bg-white">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{task.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{task.course}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Task Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <p className="text-xs text-blue-600 font-semibold uppercase">
                Deadline
              </p>
              <p className="text-lg font-bold text-blue-900 mt-1">
                {new Date(task.deadline).toLocaleDateString()}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                {task.daysRemaining} days remaining
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <p className="text-xs text-purple-600 font-semibold uppercase">
                Total Hours
              </p>
              <p className="text-lg font-bold text-purple-900 mt-1">
                {task.totalEstimatedHours}h
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <p className="text-xs text-green-600 font-semibold uppercase">
                Priority
              </p>
              <p className="text-lg font-bold text-green-900 mt-1">
                {task.priorityScore}
              </p>
              <p className="text-xs text-green-700 mt-2 font-medium">
                {task.priorityBand}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
                Status
              </p>
              <RiskIndicator
                daysRemaining={task.daysRemaining}
                isCompleted={task.status === "Completed"}
                priorityBand={task.priorityBand}
              />
            </div>
          </div>

          {/* Description */}
          {task.aiDescription && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-700">{task.aiDescription}</p>
            </div>
          )}

          {/* Progress Summary */}
          {allSubtasks.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-800">
                  Subtasks Progress
                </h3>
                <span className="text-sm font-bold text-indigo-600">
                  {completedSubtasks} / {totalSubtasks} Done
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-indigo-600 h-full transition-all duration-300"
                  style={{
                    width: `${
                      totalSubtasks > 0
                        ? (completedSubtasks / totalSubtasks) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Loading Subtasks */}
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
          ) : allSubtasks.length > 0 ? (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Subtasks</h3>
              {allSubtasks.map((subtask) => (
                <div
                  key={subtask._id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedSubtask(
                        expandedSubtask === subtask._id ? null : subtask._id
                      )
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSubtaskStatus(
                            subtask,
                            e.target.checked ? "Completed" : "Pending"
                          );
                        }}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      />
                      <div className="text-left">
                        <p
                          className={`font-medium ${
                            subtask.completed
                              ? "line-through text-gray-500"
                              : "text-gray-800"
                          }`}
                        >
                          {subtask.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {subtask.estimatedHours}h · {subtask.difficultyLevel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          subtask.completed
                            ? "bg-green-100 text-green-700"
                            : subtask.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {subtask.completed ? "Completed" : subtask.status || "Pending"}
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition ${
                          expandedSubtask === subtask._id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedSubtask === subtask._id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-2">
                      {subtask.subDescription && (
                        <div>
                          <p className="text-xs text-gray-600 font-semibold mb-1">
                            Description
                          </p>
                          <p className="text-sm text-gray-700">
                            {subtask.subDescription}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">
                          Details
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Estimated:</span>{" "}
                            <span className="font-semibold">
                              {subtask.estimatedHours}h
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Difficulty:</span>{" "}
                            <span className="font-semibold">
                              {subtask.difficultyLevel}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>{" "}
                            <span className="font-semibold">
                              {subtask.completed ? "✓ Done" : subtask.status || "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
              <p className="text-sm">No subtasks created for this task yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
