/**
 * Priority Calculation Service
 * Calculates priority scores for assignments based on deadline, workload, and importance
 */

/**
 * Calculate days remaining until deadline
 * @param {Date} deadline - Deadline date
 * @returns {number} Days remaining (0 if past deadline)
 */
export const calculateDaysRemaining = (deadline) => {
  if (!deadline) return 999;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate urgency score based on days remaining
 * Scores higher as deadline approaches
 * @param {number} daysRemaining
 * @returns {number} 0-100 urgency score
 */
export const calculateUrgencyScore = (daysRemaining) => {
  if (daysRemaining <= 0) return 100;
  if (daysRemaining <= 3) return 90;
  if (daysRemaining <= 7) return 70;
  if (daysRemaining <= 14) return 50;
  
  // Formula: decreases as days increase
  return Math.max(0, Math.min(100, 100 - (daysRemaining * 2)));
};

/**
 * Calculate importance/impact score based on estimated hours
 * More hours = higher impact
 * @param {number} totalEstimatedHours
 * @returns {number} 0-100 importance score
 */
export const calculateImportanceScore = (totalEstimatedHours) => {
  if (!totalEstimatedHours) return 30;
  
  // 1-4 hours = 20-40, 5-10 hours = 50-70, 10+ hours = 80-100
  if (totalEstimatedHours <= 2) return 20;
  if (totalEstimatedHours <= 5) return 40;
  if (totalEstimatedHours <= 10) return 60;
  if (totalEstimatedHours <= 15) return 80;
  return 100;
};

/**
 * Calculate workload balance score based on realistic days available
 * Fewer days available = higher pressure = higher score
 * @param {number} realisticDays
 * @returns {number} 0-100 workload score
 */
export const calculateWorkloadScore = (realisticDays) => {
  if (!realisticDays) return 50;
  
  if (realisticDays <= 1) return 100;
  if (realisticDays <= 3) return 80;
  if (realisticDays <= 7) return 60;
  if (realisticDays <= 14) return 40;
  return 20;
};

/**
 * Calculate overall priority score
 * Weighted average of urgency, importance, and workload
 * @param {Object} assignment - Assignment object with deadline, hours, days
 * @returns {Object} Priority data
 */
export const calculatePriorityScore = (assignment) => {
  const deadline = assignment.deadline || assignment.date;
  const hours = assignment.totalEstimatedHours || assignment.estimatedHours || 0;
  const realisticDays = assignment.realisticDays || 3; // Default 3 days for calendar tasks
  
  const daysRemaining = calculateDaysRemaining(deadline);
  
  const urgencyScore = calculateUrgencyScore(daysRemaining);
  const importanceScore = calculateImportanceScore(hours);
  const workloadScore = calculateWorkloadScore(realisticDays);
  
  // Weighted calculation: Urgency has highest weight
  const priorityScore = Math.round(
    urgencyScore * 0.5 + 
    importanceScore * 0.3 + 
    workloadScore * 0.2
  );
  
  // Determine priority band
  let priorityBand = "Low";
  if (priorityScore >= 85) priorityBand = "Critical";
  else if (priorityScore >= 65) priorityBand = "High";
  else if (priorityScore >= 45) priorityBand = "Medium";
  
  return {
    priorityScore: Math.min(100, Math.max(0, priorityScore)),
    urgencyScore,
    importanceScore,
    workloadScore,
    daysRemaining,
    priorityBand,
  };
};

/**
 * Sort assignments by priority (highest first)
 * @param {Array} assignments - Array of assignment objects
 * @returns {Array} Sorted assignments with priority data
 */
export const prioritizeSortAssignments = (assignments) => {
  return assignments
    .map(assignment => ({
      _id: assignment._id,
      title: assignment.title,
      course: assignment.course || assignment.subjectModule || "General Study",
      deadline: assignment.deadline || assignment.date,
      totalEstimatedHours: assignment.totalEstimatedHours || assignment.estimatedHours || 0,
      realisticDays: assignment.realisticDays || 3,
      status: assignment.status,
      aiDescription: assignment.aiDescription || "",
      type: assignment.type || "assignment",
      ...calculatePriorityScore(assignment),
    }))
    .filter(a => a.status !== "Completed" && a.status !== "Archived")
    .sort((a, b) => b.priorityScore - a.priorityScore);
};

/**
 * Get critical tasks for current day/week
 * @param {Array} assignments - Array of assignment objects
 * @param {number} days - Number of days to check ahead (default 7)
 * @returns {Array} Critical assignments in the timeframe
 */
export const getCriticalAssignments = (assignments, days = 7) => {
  return assignments
    .map(assignment => ({
      _id: assignment._id,
      title: assignment.title,
      course: assignment.course,
      deadline: assignment.deadline,
      totalEstimatedHours: assignment.totalEstimatedHours,
      realisticDays: assignment.realisticDays,
      status: assignment.status,
      ...calculatePriorityScore(assignment),
    }))
    .filter(a => 
      a.status !== "Completed" && 
      a.status !== "Archived" &&
      a.daysRemaining <= days &&
      a.priorityScore >= 85
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * Group assignments by priority band
 * @param {Array} assignments
 * @returns {Object} Grouped by band
 */
export const groupByPriorityBand = (assignments) => {
  const prioritized = prioritizeSortAssignments(assignments);
  
  return {
    critical: prioritized.filter(a => a.priorityBand === "Critical"),
    high: prioritized.filter(a => a.priorityBand === "High"),
    medium: prioritized.filter(a => a.priorityBand === "Medium"),
    low: prioritized.filter(a => a.priorityBand === "Low"),
  };
};

/**
 * Calculate average priority score
 * @param {Array} assignments
 * @returns {number} Average score
 */
export const calculateAveragePriority = (assignments) => {
  if (assignments.length === 0) return 0;
  
  const prioritized = prioritizeSortAssignments(assignments);
  const sum = prioritized.reduce((total, a) => total + a.priorityScore, 0);
  
  return Math.round(sum / prioritized.length);
};

/**
 * Get workload analysis
 * @param {Array} assignments
 * @returns {Array} Workload analysis by day
 */
export const analyzeWorkload = (assignments) => {
  const workloadByDay = {};
  
  assignments
    .map(a => ({ ...a, ...calculatePriorityScore(a) }))
    .filter(a => a.status !== "Completed" && a.status !== "Archived")
    .forEach(assignment => {
      if (!assignment.deadline) return;
      
      const deadline = new Date(assignment.deadline);
      const dateKey = deadline.toISOString().split('T')[0];
      
      if (!workloadByDay[dateKey]) {
        workloadByDay[dateKey] = {
          date: dateKey,
          totalHours: 0,
          taskCount: 0,
          criticalCount: 0,
          tasks: [],
        };
      }
      
      workloadByDay[dateKey].totalHours += assignment.totalEstimatedHours || 0;
      workloadByDay[dateKey].taskCount += 1;
      if (assignment.priorityBand === "Critical") {
        workloadByDay[dateKey].criticalCount += 1;
      }
      workloadByDay[dateKey].tasks.push(assignment.title);
    });
  
  return Object.values(workloadByDay).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
};
