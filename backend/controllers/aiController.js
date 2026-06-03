const Drive = require('../models/Drive');
const User = require('../models/User');
const { computeMatch, skillGap } = require('../utils/aiMatch');
const {
  isAIConfigured,
  analyzeFit,
  interviewPrep,
  resumeFeedback,
  skillGapAdvice,
} = require('../utils/aiClient');

// Helper: load the calling student + a drive by id.
const loadStudentAndDrive = async (userId, driveId) => {
  const [student, drive] = await Promise.all([
    User.findById(userId),
    Drive.findById(driveId),
  ]);
  return { student, drive };
};

// GET /api/ai/match/:driveId — detailed fit score + (optional AI) narrative.
exports.match = async (req, res) => {
  try {
    const { student, drive } = await loadStudentAndDrive(
      req.user.id,
      req.params.driveId
    );
    if (!drive) return res.status(404).json({ message: 'Drive not found' });

    const match = computeMatch(student, drive);
    const { analysis, ai } = await analyzeFit(student, drive, match);
    res.json({ match, analysis, ai, aiEnabled: isAIConfigured() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ai/interview-prep/:driveId — likely questions + prep tips.
exports.interviewPrep = async (req, res) => {
  try {
    const { student, drive } = await loadStudentAndDrive(
      req.user.id,
      req.params.driveId
    );
    if (!drive) return res.status(404).json({ message: 'Drive not found' });

    const prep = await interviewPrep(drive, student);
    res.json({ ...prep, aiEnabled: isAIConfigured() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/ai/skill-gap/:driveId — missing skills + what to learn next.
exports.skillGap = async (req, res) => {
  try {
    const { student, drive } = await loadStudentAndDrive(
      req.user.id,
      req.params.driveId
    );
    if (!drive) return res.status(404).json({ message: 'Drive not found' });

    const gap = skillGap(student, drive);
    const { advice, ai } = await skillGapAdvice(gap.missing, drive.role);
    res.json({ ...gap, advice, ai, aiEnabled: isAIConfigured() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/ai/resume-feedback — improvement suggestions for a pasted resume.
exports.resumeFeedback = async (req, res) => {
  try {
    let { resumeText, targetRole } = req.body;

    // Fall back to the resume saved on the student's profile.
    if (!resumeText) {
      const student = await User.findById(req.user.id);
      resumeText = student?.resumeText || '';
    }
    if (!resumeText) {
      return res
        .status(400)
        .json({ message: 'Add some resume text (or save it on your profile) first.' });
    }

    const { suggestions, ai } = await resumeFeedback(resumeText, targetRole || '');
    res.json({ suggestions, ai, aiEnabled: isAIConfigured() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
