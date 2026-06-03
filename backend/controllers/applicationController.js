const Application = require('../models/Application');
const Drive = require('../models/Drive');
const User = require('../models/User');
const { computeMatch } = require('../utils/aiMatch');

// Map a review action to the resulting pipeline status.
const ACTION_STATUS = {
  shortlist: 'shortlisted',
  interview: 'interview',
  offer: 'offered',
  reject: 'rejected',
};

// Student applies to a drive. The AI match score is computed and stored at
// apply time so the recruiter's queue can be ranked by fit.
exports.apply = async (req, res) => {
  try {
    const { driveId, coverNote } = req.body;
    if (!driveId) {
      return res.status(400).json({ message: 'Drive is required' });
    }

    const drive = await Drive.findById(driveId);
    if (!drive || !drive.isActive) {
      return res.status(404).json({ message: 'Drive not found or closed' });
    }

    const existing = await Application.findOne({
      drive: driveId,
      student: req.user.id,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'You have already applied to this drive' });
    }

    const student = await User.findById(req.user.id);
    const match = computeMatch(student, drive);

    const application = await Application.create({
      drive: driveId,
      student: req.user.id,
      status: 'applied',
      matchScore: match.score,
      matchBreakdown: {
        skillsMatched: match.skillsMatched,
        skillsMissing: match.skillsMissing,
        cgpaEligible: match.cgpaEligible,
        branchEligible: match.branchEligible,
      },
      coverNote: coverNote || '',
    });

    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: 'You have already applied to this drive' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Student withdraws an application (only before a decision is made).
exports.withdraw = async (req, res) => {
  try {
    const app = await Application.findOne({
      _id: req.params.id,
      student: req.user.id,
    });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (['offered', 'rejected'].includes(app.status)) {
      return res
        .status(400)
        .json({ message: 'This application has already been decided' });
    }
    await app.deleteOne();
    res.json({ message: 'Application withdrawn' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// A student's own applications (with drive details).
exports.getMine = async (req, res) => {
  try {
    const apps = await Application.find({ student: req.user.id })
      .populate('drive', 'company role type ctc location requiredSkills')
      .sort({ updatedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin review queue (optionally filtered by status / drive), ranked by fit.
exports.getAll = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.drive) filter.drive = req.query.drive;
    const apps = await Application.find(filter)
      .populate('drive', 'company role type ctc location')
      .populate('student', 'username email branch cgpa skills')
      .sort({ matchScore: -1, updatedAt: -1 });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin advances an application through the hiring pipeline.
exports.review = async (req, res) => {
  try {
    const { action, feedback } = req.body; // shortlist | interview | offer | reject
    const status = ACTION_STATUS[action];
    if (!status) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const application = await Application.findById(req.params.id);
    if (!application)
      return res.status(404).json({ message: 'Application not found' });

    application.status = status;
    if (feedback !== undefined) application.feedback = feedback;
    application.reviewedBy = req.user.id;
    await application.save();

    // An offer marks the student as placed.
    if (status === 'offered') {
      await User.findByIdAndUpdate(application.student, {
        placementStatus: 'placed',
      });
    }

    res.json({ message: `Application ${status}`, application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
