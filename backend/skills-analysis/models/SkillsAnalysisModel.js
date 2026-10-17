import mongoose from 'mongoose';

const skillsAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  tasksCompleted: {
    type: Number,
    default: 0,
  },
  totalTasks: {
    type: Number,
    default: 0,
  },
  onTimeCompletion: {
    count: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  lateSubmissions: {
    count: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
  },
  consistencyLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low',
  },
  consistencyScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  procrastinationBehavior: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  avgDaysLate: {
    type: Number,
    default: 0,
  },
  skillsImprovement: {
    timeManagement: {
      level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
      },
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    researchSkills: {
      level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
      },
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    technicalSkills: {
      level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
      },
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    communicationSkills: {
      level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
      },
      score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
  },
  aiSuggestions: [
    {
      id: String,
      title: String,
      description: String,
      priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  weeklyProgressData: [
    {
      week: Number,
      tasksCompleted: Number,
      onTimeCount: Number,
      lateCount: Number,
      date: Date,
    },
  ],
  monthlyProgressData: [
    {
      month: Number,
      tasksCompleted: Number,
      onTimeCount: Number,
      lateCount: Number,
      date: Date,
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('SkillsAnalysis', skillsAnalysisSchema);
