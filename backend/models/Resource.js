import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['file', 'link'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  fileType: {
    type: String
  },
  originalName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  tags: [String],
  description: {
    type: String,
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aiSummary: {
    text: { type: String, default: null },
    generatedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['pending', 'generated', 'failed', 'not_applicable'],
      default: null
    }
  }
}, {
  timestamps: true
});

resourceSchema.index({ group: 1, createdAt: -1 }); // getResources sort
resourceSchema.index({ uploadedBy: 1 });            // Authorization checks

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
