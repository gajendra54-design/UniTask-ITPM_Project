import mongoose from 'mongoose';

const groupTaskSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['To-Do', 'In Progress', 'Done'],
    default: 'To-Do'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date
  },
  dependsOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GroupTask' }],
  subtasks: [{ title: String, completed: { type: Boolean, default: false } }],
  recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  estimatedHours: { type: Number, default: 0 },
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  aiPrioritized: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false }
}, {
  timestamps: true
});

groupTaskSchema.index({ group: 1, status: 1 });        // Kanban column queries
groupTaskSchema.index({ group: 1, createdAt: -1 });    // getGroupTasks sort
groupTaskSchema.index({ group: 1, completedAt: 1 });   // Burndown chart
groupTaskSchema.index({ assignedTo: 1 });              // Member task assignment

const GroupTask = mongoose.model('GroupTask', groupTaskSchema);
export default GroupTask;
