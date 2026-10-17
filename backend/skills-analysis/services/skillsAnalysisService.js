import SkillsAnalysis from '../models/SkillsAnalysisModel.js';
import Assignment from '../../models/Assignment.js';

// Generate AI-based suggestions based on user behavior
export const generateAISuggestions = (analysisData) => {
  const suggestions = [];
  const { procrastinationBehavior, consistencyLevel, onTimeCompletion, skillsImprovement } =
    analysisData;

  // Time Management Suggestion
  if (procrastinationBehavior === 'High' || onTimeCompletion.percentage < 40) {
    suggestions.push({
      id: 'tm-1',
      title: 'Improve Time Management',
      description:
        'You have a high tendency to procrastinate. Try breaking tasks into smaller pieces and setting daily goals.',
      priority: 'High',
    });
  }

  // Consistency Suggestion
  if (consistencyLevel === 'Low') {
    suggestions.push({
      id: 'cs-1',
      title: 'Build Consistent Work Habits',
      description:
        'Maintain a consistent schedule by working on assignments regularly. Aim for at least 2-3 hours daily.',
      priority: 'High',
    });
  }

  // Research Skills Suggestion
  if (skillsImprovement.researchSkills.score < 50) {
    suggestions.push({
      id: 'rs-1',
      title: 'Enhance Research Skills',
      description:
        'Dedicate time to improve research skills. Use academic databases and practice critical analysis.',
      priority: 'Medium',
    });
  }

  // Technical Skills Suggestion
  if (skillsImprovement.technicalSkills.score < 50) {
    suggestions.push({
      id: 'ts-1',
      title: 'Strengthen Technical Skills',
      description:
        'Practice coding exercises regularly. Focus on data structures and algorithms for better problem-solving.',
      priority: 'Medium',
    });
  }

  // On-time Completion Suggestion
  if (onTimeCompletion.percentage > 70) {
    suggestions.push({
      id: 'ot-1',
      title: 'Maintain Your Momentum',
      description:
        'Great job! You are completing most tasks on time. Keep up this excellent habit and help peers.',
      priority: 'Low',
    });
  }

  return suggestions;
};

// Calculate consistency score and level based on task patterns
export const calculateConsistency = (weeklyData) => {
  if (!weeklyData || weeklyData.length === 0) {
    return { score: 0, level: 'Low' };
  }

  const completionRates = weeklyData.map((week) => {
    if (week.tasksCompleted === 0) return 0;
    const completionRate = (week.onTimeCount / week.tasksCompleted) * 100;
    return completionRate;
  });

  const averageCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

  // Calculate variance for consistency
  const variance =
    completionRates.reduce((sum, rate) => sum + Math.pow(rate - averageCompletion, 2), 0) /
    completionRates.length;
  const stdDev = Math.sqrt(variance);

  // Lower std deviation = higher consistency
  let consistencyScore = Math.max(0, 100 - stdDev);
  let level = 'Low';

  if (consistencyScore >= 70) {
    level = 'High';
  } else if (consistencyScore >= 40) {
    level = 'Medium';
  }

  return { score: Math.round(consistencyScore), level };
};

// Analyze procrastination behavior
export const analyzeProcrastination = (lateSubmissions, totalTasks) => {
  if (totalTasks === 0) {
    return { behavior: 'Low', avgDaysLate: 0, percentage: 0 };
  }

  const percentage = (lateSubmissions.count / totalTasks) * 100;
  let behavior = 'Low';

  if (percentage > 50) {
    behavior = 'High';
  } else if (percentage > 30) {
    behavior = 'Medium';
  }

  return {
    behavior,
    percentage: Math.round(percentage),
    count: lateSubmissions.count,
  };
};

// Generate or update skills analysis for a user
export const generateSkillsAnalysis = async (userId) => {
  try {
    // Get all assignments for the user
    const assignments = await Assignment.find({ userId }).lean();

    if (!assignments || assignments.length === 0) {
      // Create initial analysis if no assignments
      let analysis = await SkillsAnalysis.findOne({ userId });
      if (!analysis) {
        analysis = new SkillsAnalysis({ userId });
        await analysis.save();
      }
      return analysis;
    }

    // Calculate metrics
    const tasksCompleted = assignments.filter((a) => a.status === 'Completed').length;
    const totalTasks = assignments.length;
    const overallProgress = Math.round((tasksCompleted / totalTasks) * 100) || 0;

    // Count on-time and late submissions
    const now = new Date();
    let onTimeCount = 0;
    let lateCount = 0;

    assignments.forEach((assignment) => {
      if (assignment.status === 'Completed') {
        const submittedDate = assignment.updatedAt || new Date();
        const dueDate = assignment.deadline;

        if (dueDate && submittedDate <= dueDate) {
          onTimeCount++;
        } else if (dueDate) {
          lateCount++;
        }
      } else if (assignment.deadline && assignment.deadline < now) {
        lateCount++;
      }
    });

    const onTimePercentage = tasksCompleted > 0 ? Math.round((onTimeCount / tasksCompleted) * 100) : 0;
    const latePercentage = tasksCompleted > 0 ? Math.round((lateCount / tasksCompleted) * 100) : 0;

    // Generate weekly progress data
    const weeklyProgressData = generateWeeklyProgress(assignments);

    // Calculate consistency
    const consistencyData = calculateConsistency(weeklyProgressData);

    // Analyze procrastination
    const procrastinationData = analyzeProcrastination({ count: lateCount }, totalTasks);

    // Initialize skills improvement
    const skillsImprovement = {
      timeManagement: {
        level: procrastinationData.behavior === 'Low' ? 'Advanced' : 'Beginner',
        score: onTimePercentage,
      },
      researchSkills: {
        level: 'Intermediate',
        score: Math.round(Math.random() * 100),
      },
      technicalSkills: {
        level: 'Intermediate',
        score: Math.round(Math.random() * 100),
      },
      communicationSkills: {
        level: 'Intermediate',
        score: Math.round(Math.random() * 100),
      },
    };

    // Generate AI suggestions
    const suggestionData = {
      procrastinationBehavior: procrastinationData.behavior,
      consistencyLevel: consistencyData.level,
      onTimeCompletion: { percentage: onTimePercentage },
      skillsImprovement,
    };

    const aiSuggestions = generateAISuggestions(suggestionData);

    // Find or create skills analysis
    let analysis = await SkillsAnalysis.findOne({ userId });

    if (!analysis) {
      analysis = new SkillsAnalysis({ userId });
    }

    // Update analysis data
    analysis.overallProgress = overallProgress;
    analysis.tasksCompleted = tasksCompleted;
    analysis.totalTasks = totalTasks;
    analysis.onTimeCompletion = {
      count: onTimeCount,
      percentage: onTimePercentage,
    };
    analysis.lateSubmissions = {
      count: lateCount,
      percentage: latePercentage,
    };
    analysis.consistencyLevel = consistencyData.level;
    analysis.consistencyScore = consistencyData.score;
    analysis.procrastinationBehavior = procrastinationData.behavior;
    analysis.avgDaysLate = calculateAverageDaysLate(assignments);
    analysis.skillsImprovement = skillsImprovement;
    analysis.aiSuggestions = aiSuggestions;
    analysis.weeklyProgressData = weeklyProgressData;
    analysis.updatedAt = new Date();

    await analysis.save();
    return analysis;
  } catch (error) {
    console.error('Error generating skills analysis:', error);
    throw error;
  }
};

// Generate weekly progress data
const generateWeeklyProgress = (assignments) => {
  const weeklyData = {};
  const now = new Date();

  assignments.forEach((assignment) => {
    const assignmentDate = assignment.createdAt || new Date();
    const week = getWeekNumber(assignmentDate);
    const year = assignmentDate.getFullYear();
    const key = `${year}-W${week}`;

    if (!weeklyData[key]) {
      weeklyData[key] = {
        week,
        tasksCompleted: 0,
        onTimeCount: 0,
        lateCount: 0,
        date: new Date(assignmentDate.getFullYear(), assignmentDate.getMonth(), assignmentDate.getDate()),
      };
    }

    if (assignment.status === 'Completed') {
      weeklyData[key].tasksCompleted++;
      const submittedDate = assignment.updatedAt || new Date();
      if (assignment.deadline && submittedDate <= assignment.deadline) {
        weeklyData[key].onTimeCount++;
      } else if (assignment.deadline) {
        weeklyData[key].lateCount++;
      }
    }
  });

  return Object.values(weeklyData).sort((a, b) => a.week - b.week);
};

// Get week number from date
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

// Calculate average days late
const calculateAverageDaysLate = (assignments) => {
  const lateAssignments = assignments.filter((a) => {
    const submittedDate = a.updatedAt || new Date();
    return a.deadline && submittedDate > a.deadline;
  });

  if (lateAssignments.length === 0) return 0;

  const totalDaysLate = lateAssignments.reduce((sum, assignment) => {
    const submittedDate = new Date(assignment.updatedAt);
    const dueDate = new Date(assignment.deadline);
    const daysLate = Math.ceil((submittedDate - dueDate) / (1000 * 60 * 60 * 24));
    return sum + (daysLate > 0 ? daysLate : 0);
  }, 0);

  return Math.round(totalDaysLate / lateAssignments.length);
};

export default {
  generateSkillsAnalysis,
  generateAISuggestions,
  calculateConsistency,
  analyzeProcrastination,
};
