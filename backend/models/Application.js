const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'shortlisted', 'interview', 'offered', 'rejected'],
      default: 'applied',
    },
    // AI match score (0-100), computed at apply time by the match engine.
    matchScore: {
      type: Number,
      default: 0,
    },
    matchBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {}, // { skillsMatched, skillsMissing, cgpaEligible, branchEligible }
    },
    aiAnalysis: {
      type: String,
      default: '', // optional Claude-generated fit narrative
    },
    coverNote: {
      type: String,
      default: '',
    },
    feedback: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// One application per student per drive.
applicationSchema.index({ drive: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
