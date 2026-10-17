import SkillsAnalysis from '../models/SkillsAnalysisModel.js';

/**
 * Generate dummy skills analysis data for testing
 * Creates realistic-looking data with various consistency and behavior patterns
 */
export const generateDummyAnalysis = async (userId) => {
  try {
    // Generate random but realistic data
    const tasksCompleted = Math.floor(Math.random() * 20) + 5; // 5-25 tasks
    const totalTasks = Math.floor(tasksCompleted / 0.7); // 70% completion rate
    const overallProgress = Math.round((tasksCompleted / totalTasks) * 100);

    const onTimeCount = Math.floor(tasksCompleted * (Math.random() * 0.4 + 0.3)); // 30-70% on time
    const lateCount = tasksCompleted - onTimeCount;

    // Generate weekly progress data (4 weeks)
    const weeklyProgressData = [];
    for (let week = 1; week <= 4; week++) {
      const weekTasks = Math.floor(Math.random() * 6) + 2;
      const weekOnTime = Math.floor(weekTasks * (Math.random() * 0.5 + 0.3));
      weeklyProgressData.push({
        week,
        tasksCompleted: weekTasks,
        onTimeCount: weekOnTime,
        lateCount: weekTasks - weekOnTime,
        date: new Date(),
      });
    }

    // Calculate consistency
    const onTimePercentage = tasksCompleted > 0 ? Math.round((onTimeCount / tasksCompleted) * 100) : 0;
    let consistencyScore = 0;
    let consistencyLevel = 'Low';

    if (onTimePercentage >= 70) {
      consistencyScore = 80 + Math.floor(Math.random() * 20);
      consistencyLevel = 'High';
    } else if (onTimePercentage >= 40) {
      consistencyScore = 50 + Math.floor(Math.random() * 30);
      consistencyLevel = 'Medium';
    } else {
      consistencyScore = Math.floor(Math.random() * 50);
      consistencyLevel = 'Low';
    }

    // Procrastination behavior
    const procrastinationPercentage = tasksCompleted > 0 ? Math.round((lateCount / tasksCompleted) * 100) : 0;
    let procrastinationBehavior = 'Low';

    if (procrastinationPercentage > 50) {
      procrastinationBehavior = 'High';
    } else if (procrastinationPercentage > 30) {
      procrastinationBehavior = 'Medium';
    }

    const avgDaysLate = lateCount > 0 ? Math.floor(Math.random() * 5) + 1 : 0;

    // Skills improvement (random scores with some correlation to consistency)
    const baseSkillScore = consistencyScore + Math.floor(Math.random() * 20 - 10);
    const skillsImprovement = {
      timeManagement: {
        level: onTimePercentage >= 70 ? 'Advanced' : onTimePercentage >= 40 ? 'Intermediate' : 'Beginner',
        score: Math.min(100, Math.max(0, onTimePercentage + Math.floor(Math.random() * 20 - 10))),
      },
      researchSkills: {
        level: 'Intermediate',
        score: Math.min(100, Math.max(0, baseSkillScore + Math.floor(Math.random() * 20 - 10))),
      },
      technicalSkills: {
        level: 'Intermediate',
        score: Math.min(100, Math.max(0, baseSkillScore + Math.floor(Math.random() * 20 - 10))),
      },
      communicationSkills: {
        level: 'Intermediate',
        score: Math.min(100, Math.max(0, baseSkillScore + Math.floor(Math.random() * 20 - 10))),
      },
    };

    // Generate AI suggestions
    const aiSuggestions = [
      {
        id: 'tm-1',
        title: 'Improve Time Management',
        description: 'Try using the Pomodoro technique to manage your time more effectively.',
        priority: procrastinationBehavior === 'High' ? 'High' : 'Medium',
      },
      {
        id: 'cs-1',
        title: 'Build Consistent Work Habits',
        description: 'Set daily study goals and stick to a regular schedule.',
        priority: consistencyLevel === 'Low' ? 'High' : 'Low',
      },
      {
        id: 'rs-1',
        title: 'Enhance Research Skills',
        description: 'Practice using academic databases and improve your research methodology.',
        priority: skillsImprovement.researchSkills.score < 50 ? 'Medium' : 'Low',
      },
    ];

    // Create or update analysis
    let analysis = await SkillsAnalysis.findOne({ userId });

    if (!analysis) {
      analysis = new SkillsAnalysis({ userId });
    }

    analysis.overallProgress = overallProgress;
    analysis.tasksCompleted = tasksCompleted;
    analysis.totalTasks = totalTasks;
    analysis.onTimeCompletion = {
      count: onTimeCount,
      percentage: onTimePercentage,
    };
    analysis.lateSubmissions = {
      count: lateCount,
      percentage: 100 - onTimePercentage,
    };
    analysis.consistencyLevel = consistencyLevel;
    analysis.consistencyScore = consistencyScore;
    analysis.procrastinationBehavior = procrastinationBehavior;
    analysis.avgDaysLate = avgDaysLate;
    analysis.skillsImprovement = skillsImprovement;
    analysis.aiSuggestions = aiSuggestions;
    analysis.weeklyProgressData = weeklyProgressData;
    analysis.updatedAt = new Date();

    await analysis.save();
    return analysis;
  } catch (error) {
    console.error('Error generating dummy analysis:', error);
    throw error;
  }
};

export default {
  generateDummyAnalysis,
};
