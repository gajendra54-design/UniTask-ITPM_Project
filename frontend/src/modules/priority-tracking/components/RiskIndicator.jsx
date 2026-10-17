import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

/**
 * RiskIndicator Component
 * Shows risk status based on deadline proximity and completion status
 */
export const RiskIndicator = ({ daysRemaining, isCompleted, priorityBand }) => {
  if (isCompleted) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg">
        <CheckCircle size={14} className="text-green-600" />
        <span className="text-xs font-semibold text-green-700">Completed</span>
      </div>
    );
  }

  // Due Soon - within 2 days
  if (daysRemaining <= 2 && daysRemaining > 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-lg">
        <AlertTriangle size={14} className="text-red-600" />
        <span className="text-xs font-semibold text-red-700">Due Soon</span>
      </div>
    );
  }

  // At Risk - overdue
  if (daysRemaining <= 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 rounded-lg animate-pulse">
        <AlertTriangle size={14} className="text-red-700" />
        <span className="text-xs font-semibold text-red-800">Overdue</span>
      </div>
    );
  }

  // At Risk - within 7 days with critical priority
  if (daysRemaining <= 7 && priorityBand === "Critical") {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 rounded-lg">
        <AlertTriangle size={14} className="text-orange-600" />
        <span className="text-xs font-semibold text-orange-700">At Risk</span>
      </div>
    );
  }

  // On Track
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg">
      <Clock size={14} className="text-blue-600" />
      <span className="text-xs font-semibold text-blue-700">On Track</span>
    </div>
  );
};

export default RiskIndicator;
