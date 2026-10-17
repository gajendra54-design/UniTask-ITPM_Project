/**
 * Priority Tracking Utilities
 * Helper functions for priority calculation and analysis
 */

export const calculatePriorityColor = (priorityBand) => {
  switch (priorityBand) {
    case "Critical":
      return "bg-red-50 hover:bg-red-100";
    case "High":
      return "bg-orange-50 hover:bg-orange-100";
    case "Medium":
      return "bg-yellow-50 hover:bg-yellow-100";
    default:
      return "bg-green-50 hover:bg-green-100";
  }
};

export const getPriorityBadgeColor = (priorityBand) => {
  switch (priorityBand) {
    case "Critical":
      return "bg-red-200 text-red-800";
    case "High":
      return "bg-orange-200 text-orange-800";
    case "Medium":
      return "bg-yellow-200 text-yellow-800";
    default:
      return "bg-green-200 text-green-800";
  }
};

export const getScoreBadgeColor = (priorityBand) => {
  switch (priorityBand) {
    case "Critical":
      return "bg-red-500 text-white";
    case "High":
      return "bg-orange-500 text-white";
    case "Medium":
      return "bg-yellow-500 text-white";
    default:
      return "bg-green-500 text-white";
  }
};

export const formatDeadline = (deadline) => {
  return new Date(deadline).toLocaleDateString();
};

export const calculateTotalHours = (subtasks) => {
  if (!subtasks || subtasks.length === 0) return 0;
  return subtasks.reduce((sum, st) => sum + (st.estimatedHours || 0), 0);
};

export const calculateCompletionPercentage = (subtasks) => {
  if (!subtasks || subtasks.length === 0) return 0;
  const completedCount = subtasks.filter((st) => st.completed).length;
  return Math.round((completedCount / subtasks.length) * 100);
};
