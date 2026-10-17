import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import api from "../../utils/api";

/**
 * TaskBreakdownModal Component
 * Allows users to break down a task into subtasks
 */
export const TaskBreakdownModal = ({ task, isOpen, onClose, onSave }) => {
  const [subtasks, setSubtasks] = useState(
    task?.subtasks || [
      {
        title: "",
        subDescription: "",
        estimatedHours: 1,
        difficultyLevel: "Medium",
        completed: false,
      },
    ]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const addSubtask = () => {
    setSubtasks([
      ...subtasks,
      {
        title: "",
        subDescription: "",
        estimatedHours: 1,
        difficultyLevel: "Medium",
        completed: false,
      },
    ]);
  };

  const updateSubtask = (index, field, value) => {
    const updated = [...subtasks];
    updated[index] = { ...updated[index], [field]: value };
    setSubtasks(updated);
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate
      if (subtasks.some((st) => !st.title.trim())) {
        setError("All subtasks must have a title");
        return;
      }

      // Prepare data
      const totalHours = subtasks.reduce(
        (sum, st) => sum + (st.estimatedHours || 0),
        0
      );

      const payload = {
        title: task.title,
        course: task.course,
        aiDescription: task.aiDescription || `Breaking down ${task.title}`,
        deadline: task.deadline,
        totalEstimatedHours: totalHours,
        realisticDays: task.realisticDays,
        subtasks: subtasks.map((st) => ({
          title: st.title,
          subDescription: st.subDescription,
          estimatedHours: st.estimatedHours,
          difficultyLevel: st.difficultyLevel,
          completed: st.completed || false,
        })),
      };

      await api.post("/priority/save", payload);
      onSave && onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save breakdown");
      console.error("Breakdown save error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Break Down: {task.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{task.course}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Task Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Deadline</p>
                <p className="font-semibold">
                  {new Date(task.deadline).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Est. Days</p>
                <p className="font-semibold">{task.realisticDays} days</p>
              </div>
              <div>
                <p className="text-gray-600">Original Hours</p>
                <p className="font-semibold">{task.totalEstimatedHours}h</p>
              </div>
            </div>
          </div>

          {/* Subtasks List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">
              Subtasks ({subtasks.length})
            </h3>

            {subtasks.map((subtask, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-gray-600">
                    Task {index + 1}
                  </span>
                  <button
                    onClick={() => removeSubtask(index)}
                    className="p-1 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>

                {/* Title */}
                <input
                  type="text"
                  placeholder="Subtask title (e.g., Research topic)"
                  value={subtask.title}
                  onChange={(e) => updateSubtask(index, "title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />

                {/* Description */}
                <textarea
                  placeholder="Description (optional)"
                  value={subtask.subDescription}
                  onChange={(e) =>
                    updateSubtask(
                      index,
                      "subDescription",
                      e.target.value
                    )
                  }
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />

                {/* Estimated Hours */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={subtask.estimatedHours}
                      onChange={(e) =>
                        updateSubtask(
                          index,
                          "estimatedHours",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* Difficulty Level */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={subtask.difficultyLevel}
                      onChange={(e) =>
                        updateSubtask(
                          index,
                          "difficultyLevel",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Subtask Button */}
          <button
            onClick={addSubtask}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border-2 border-dashed border-gray-300 text-gray-700 hover:border-indigo-500 hover:text-indigo-600 rounded-lg transition font-medium"
          >
            <Plus size={18} />
            Add Subtask
          </button>

          {/* Summary */}
          <div className="bg-indigo-50 p-4 rounded-lg text-sm">
            <p className="text-indigo-900">
              <span className="font-semibold">Total Estimated Hours:</span>{" "}
              {subtasks.reduce((sum, st) => sum + (st.estimatedHours || 0), 0)}h
            </p>
            <p className="text-indigo-700 text-xs mt-1">
              Compare with original: {task.totalEstimatedHours}h
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex gap-3 bg-gray-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Breakdown"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskBreakdownModal;
