import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteCode: {
    type: String,
    unique: true,
    index: { sparse: true }
  },
  inviteCodeExpires: {
    type: Date
  },
  inviteCodeLimit: {
    type: Number,
    default: null // null means unlimited
  },
  inviteCodeUsedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

groupSchema.index({ 'members.user': 1 }); // For getMyGroups
groupSchema.index({ createdBy: 1 });       // For admin/creator checks

const Group = mongoose.model('Group', groupSchema);
export default Group;
