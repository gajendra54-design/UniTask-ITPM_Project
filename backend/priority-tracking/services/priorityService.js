/**
 * Priority Calculation Service
 * Calculates priority scores for assignments based on deadline, workload, and importance.
 *
 * Scoring philosophy:
 *  - All three component scores use smooth mathematical curves, eliminating
 *    discontinuities caused by hard step-bands.
 *  - A completion factor dampens the score of partially-done assignments so
 *    they don't compete unfairly with untouched ones.
 *  - Effort density (hours ÷ realistic days) surfaces hidden time pressure that
 *    raw deadline distance misses.
 */

// ---------------------------------------------------------------------------
// Constants — change weights and thresholds here, nowhere else
// ---------------------------------------------------------------------------

/** Weights must sum to 1.0 */
export const WEIGHTS = {
  urgency: 0.5,
  importance: 0.3,
  workload: 0.2,
};

export const PRIORITY_BANDS = {
  CRITICAL: { label: "Critical", minScore: 85, color: "#ef4444" },
  HIGH: { label: "High", minScore: 65, color: "#f97316" },
  MEDIUM: { label: "Medium", minScore: 45, color: "#eab308" },
  LOW: { label: "Low", minScore: 0, color: "#22c55e" },
};

/** Statuses that are considered inactive and excluded from scoring */
const INACTIVE_STATUSES = new Set(["Completed", "Archived"]);

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

const isValidDate = (value) => {
  if (!value) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
};

const clamp = (value, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

// ---------------------------------------------------------------------------
// Component score functions — all return 0-100
// ---------------------------------------------------------------------------

/**
 * Calculate days remaining until deadline.
 * Returns 999 when no deadline is set (treat as far future).
 * Returns 0 when the deadline has already passed.
 *
 * @param {Date|string|null} deadline
 * @returns {number}
 */
export const calculateDaysRemaining = (deadline) => {
  if (!isValidDate(deadline)) return 999;

  const diffMs = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate urgency score using exponential decay.
 * Produces a smooth curve with no discontinuities:
 *   0 days  → 100
 *   3 days  →  86
 *   7 days  →  70
 *  14 days  →  50
 *  30 days  →  22
 *  50 days  →   8
 *
 * Formula: 100 × e^(−0.05 × days)
 *
 * @param {number} daysRemaining
 * @returns {number} 0-100
 */
export const calculateUrgencyScore = (daysRemaining) => {
  if (daysRemaining <= 0) return 100;
  return clamp(Math.round(100 * Math.exp(-0.05 * daysRemaining)));
};

/**
 * Calculate importance score using a square-root curve.
 * More hours = higher impact, but with diminishing returns:
 *   1 hr  → 20   4 hrs  → 40
 *   9 hrs → 60  16 hrs  → 80
 *  25 hrs → 100
 *
 * Formula: 20 × √hours, capped at 100
 * Falls back to 30 when hours are unknown.
 *
 * @param {number|null} totalEstimatedHours
 * @returns {number} 0-100
 */
export const calculateImportanceScore = (totalEstimatedHours) => {
  if (!totalEstimatedHours || totalEstimatedHours <= 0) return 30;
  return clamp(Math.round(20 * Math.sqrt(totalEstimatedHours)));
};

/**
 * Calculate workload pressure score using exponential decay on realistic days.
 * Fewer days = more pressure = higher score:
 *   0 days  → 100
 *   1 day   →  90
 *   3 days  →  74
 *   7 days  →  50
 *  14 days  →  25
 *
 * Formula: 100 × e^(−0.1 × days)
 * Falls back to 50 when realisticDays is unknown.
 *
 * @param {number|null} realisticDays
 * @returns {number} 0-100
 */
export const calculateWorkloadScore = (realisticDays) => {
  if (!realisticDays || realisticDays < 0) return 50;
  if (realisticDays === 0) return 100;
  return clamp(Math.round(100 * Math.exp(-0.1 * realisticDays)));
};

/**
 * Calculate effort density — hours of work per available day.
 * A task with 10 hours and only 2 days is far more pressured than
 * one with 10 hours and 10 days, even if their urgency scores look similar.
 *
 * @param {number} totalEstimatedHours
 * @param {number} realisticDays
 * @returns {number} hours/day, or null if inputs are invalid
 */
export const calculateEffortDensity = (totalEstimatedHours, realisticDays) => {
  if (!totalEstimatedHours || !realisticDays || realisticDays <= 0) return null;
  return Math.round((totalEstimatedHours / realisticDays) * 10) / 10;
};

/**
 * Calculate a completion factor that dampens the priority score.
 * A fully untouched task (0%) has factor 1.0.
 * A 90% done task has factor 0.1, so it naturally sinks in the list.
 *
 * @param {number} completionPercentage - 0 to 100
 * @returns {number} 0.0-1.0 multiplier
 */
export const calculateCompletionFactor = (completionPercentage) => {
  if (!completionPercentage || completionPercentage <= 0) return 1.0;
  if (completionPercentage >= 100) return 0.0;
  return parseFloat((1 - completionPercentage / 100).toFixed(2));
};

// ---------------------------------------------------------------------------
// Priority band helper
// ---------------------------------------------------------------------------

/**
 * Return the priority band object for a given score.
 *
 * @param {number} score
 * @returns {{ label: string, minScore: number, color: string }}
 */
export const getPriorityBand = (score) => {
  if (score >= PRIORITY_BANDS.CRITICAL.minScore) return PRIORITY_BANDS.CRITICAL;
  if (score >= PRIORITY_BANDS.HIGH.minScore) return PRIORITY_BANDS.HIGH;
  if (score >= PRIORITY_BANDS.MEDIUM.minScore) return PRIORITY_BANDS.MEDIUM;
  return PRIORITY_BANDS.LOW;
};

// ---------------------------------------------------------------------------
// Core scoring function
// ---------------------------------------------------------------------------

/**
 * Calculate the overall priority score for a single assignment.
 *
 * Weighted formula:
 *   score = urgency × 0.5 + importance × 0.3 + workload × 0.2
 *
 * The raw score is then multiplied by a completion factor so partially-done
 * tasks naturally fall behind fresh ones.
 *
 * @param {Object} assignment
 * @param {Date|string}  assignment.deadline
 * @param {number}       assignment.totalEstimatedHours
 * @param {number}       assignment.realisticDays
 * @param {number}       [assignment.completionPercentage] - 0-100, defaults to 0
 * @returns {{
 *   priorityScore: number,
 *   urgencyScore: number,
 *   importanceScore: number,
 *   workloadScore: number,
 *   daysRemaining: number,
 *   effortDensity: number|null,
 *   completionFactor: number,
 *   priorityBand: string,
 *   priorityColor: string,
 * }}
 */
export const calculatePriorityScore = (assignment) => {
  const daysRemaining = calculateDaysRemaining(assignment.deadline);
  const urgencyScore = calculateUrgencyScore(daysRemaining);
  const importanceScore = calculateImportanceScore(
    assignment.totalEstimatedHours,
  );
  const workloadScore = calculateWorkloadScore(assignment.realisticDays);
  const effortDensity = calculateEffortDensity(
    assignment.totalEstimatedHours,
    assignment.realisticDays,
  );
  const completionFactor = calculateCompletionFactor(
    assignment.completionPercentage,
  );

  const rawScore =
    urgencyScore * WEIGHTS.urgency +
    importanceScore * WEIGHTS.importance +
    workloadScore * WEIGHTS.workload;

  const priorityScore = clamp(Math.round(rawScore * completionFactor));
  const band = getPriorityBand(priorityScore);

  return {
    priorityScore,
    urgencyScore,
    importanceScore,
    workloadScore,
    daysRemaining,
    effortDensity,
    completionFactor,
    priorityBand: band.label,
    priorityColor: band.color,
  };
};

// ---------------------------------------------------------------------------
// Collection-level functions
// ---------------------------------------------------------------------------

/**
 * Enrich a single assignment with priority data and spread its fields.
 * Internal helper to avoid repeating the same map pattern everywhere.
 */
const enrichAssignment = (assignment) => ({
  _id: assignment._id,
  title: assignment.title,
  course: assignment.course,
  deadline: assignment.deadline,
  totalEstimatedHours: assignment.totalEstimatedHours,
  realisticDays: assignment.realisticDays,
  completionPercentage: assignment.completionPercentage ?? 0,
  status: assignment.status,
  aiDescription: assignment.aiDescription,
  ...calculatePriorityScore(assignment),
});

const isActive = (assignment) => !INACTIVE_STATUSES.has(assignment.status);

/**
 * Sort all active assignments by priority score (highest first).
 *
 * @param {Array} assignments
 * @returns {Array} Enriched and sorted assignments
 */
export const prioritizeSortAssignments = (assignments) =>
  assignments
    .map(enrichAssignment)
    .filter(isActive)
    .sort((a, b) => b.priorityScore - a.priorityScore);

/**
 * Get urgent assignments within a time window, at or above a minimum priority band.
 *
 * The original implementation required BOTH a tight time window AND score ≥ 85,
 * meaning a High-priority task due in 8 days would be silently dropped with the
 * default 7-day window. This version decouples the two filters so you get
 * everything that is urgent enough within the window you care about.
 *
 * @param {Array}  assignments
 * @param {number} [days=7]              - How many days ahead to look
 * @param {string} [minBand="High"]      - Minimum band: "Low"|"Medium"|"High"|"Critical"
 * @returns {Array} Sorted by soonest deadline first
 */
export const getCriticalAssignments = (
  assignments,
  days = 7,
  minBand = "High",
) => {
  const bandOrder = { Low: 0, Medium: 1, High: 2, Critical: 3 };
  const minScore = bandOrder[minBand] ?? 2;

  return assignments
    .map(enrichAssignment)
    .filter(
      (a) =>
        isActive(a) &&
        a.daysRemaining <= days &&
        bandOrder[a.priorityBand] >= minScore,
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * Group all active assignments by their priority band.
 *
 * @param {Array} assignments
 * @returns {{ critical: Array, high: Array, medium: Array, low: Array }}
 */
export const groupByPriorityBand = (assignments) => {
  const prioritized = prioritizeSortAssignments(assignments);
  return {
    critical: prioritized.filter((a) => a.priorityBand === "Critical"),
    high: prioritized.filter((a) => a.priorityBand === "High"),
    medium: prioritized.filter((a) => a.priorityBand === "Medium"),
    low: prioritized.filter((a) => a.priorityBand === "Low"),
  };
};

/**
 * Calculate the average priority score across all active assignments.
 *
 * @param {Array} assignments
 * @returns {number}
 */
export const calculateAveragePriority = (assignments) => {
  const active = assignments.filter(isActive);
  if (active.length === 0) return 0;

  const sum = active.reduce(
    (total, a) => total + calculatePriorityScore(a).priorityScore,
    0,
  );
  return Math.round(sum / active.length);
};

/**
 * Analyse workload by grouping assignments under their deadline date.
 *
 * Includes an `isOverloaded` flag when a single day's total effort exceeds
 * a configurable threshold (default 8 hours), making it easy to highlight
 * problem days in a UI calendar.
 *
 * @param {Array}  assignments
 * @param {number} [dailyHourLimit=8] - Hours per day before a day is flagged
 * @returns {Array} Sorted by date ascending
 */
export const analyzeWorkload = (assignments, dailyHourLimit = 8) => {
  const workloadByDay = {};

  assignments
    .map((a) => ({ ...a, ...calculatePriorityScore(a) }))
    .filter(isActive)
    .forEach((assignment) => {
      if (!isValidDate(assignment.deadline)) return;

      const dateKey = new Date(assignment.deadline).toISOString().split("T")[0];

      if (!workloadByDay[dateKey]) {
        workloadByDay[dateKey] = {
          date: dateKey,
          totalHours: 0,
          taskCount: 0,
          criticalCount: 0,
          highCount: 0,
          tasks: [],
          isOverloaded: false,
        };
      }

      const day = workloadByDay[dateKey];
      day.totalHours += assignment.totalEstimatedHours || 0;
      day.taskCount += 1;
      day.tasks.push({
        title: assignment.title,
        priorityBand: assignment.priorityBand,
      });

      if (assignment.priorityBand === "Critical") day.criticalCount += 1;
      if (assignment.priorityBand === "High") day.highCount += 1;
    });

  // Compute isOverloaded after all tasks are aggregated
  Object.values(workloadByDay).forEach((day) => {
    day.isOverloaded = day.totalHours > dailyHourLimit;
  });

  return Object.values(workloadByDay).sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );
};

/**
 * Get assignments with deadlines in the next N days, sorted soonest first.
 * Useful for dashboard "upcoming" widgets regardless of priority band.
 *
 * @param {Array}  assignments
 * @param {number} [days=14]
 * @returns {Array}
 */
export const getUpcomingAssignments = (assignments, days = 14) =>
  assignments
    .map(enrichAssignment)
    .filter((a) => isActive(a) && a.daysRemaining <= days)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
