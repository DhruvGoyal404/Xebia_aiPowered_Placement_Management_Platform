const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    minCgpa: {
      type: Number,
      default: 0,
    },
    eligibleBranches: {
      type: [String],
      default: [], // empty = open to all branches
    },
    ctc: {
      type: String,
      default: '', // e.g. "12 LPA"
    },
    location: {
      type: String,
      default: 'Remote',
    },
    type: {
      type: String,
      enum: ['full-time', 'internship'],
      default: 'full-time',
    },
    deadline: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Drive', driveSchema);
