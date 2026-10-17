import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  activities: [{
    action: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Ensure a user has only one contribution document per group
contributionSchema.index({ group: 1, user: 1 }, { unique: true });

const Contribution = mongoose.model('Contribution', contributionSchema);
export default Contribution;
