const Drive = require('../models/Drive');
const Application = require('../models/Application');
const User = require('../models/User');
const { computeMatch } = require('../utils/aiMatch');

const toList = (val) => {
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string')
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

// List drives. Admins see everything; students see active drives with their own
// AI match score and application status merged in (so cards render instantly).
exports.getDrives = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin ? {} : { isActive: true };
    const drives = await Drive.find(filter).sort({ createdAt: -1 });

    if (isAdmin) return res.json(drives);

    const [student, myApps] = await Promise.all([
      User.findById(req.user.id),
      Application.find({ student: req.user.id }),
    ]);

    const appByDrive = {};
    myApps.forEach((a) => {
      appByDrive[a.drive.toString()] = a;
    });

    const withMatch = drives.map((d) => {
      const match = computeMatch(student, d);
      const app = appByDrive[d._id.toString()];
      return {
        ...d.toObject(),
        match, // { score, skillsMatched, skillsMissing, cgpaEligible, branchEligible, eligible }
        myApplication: app
          ? { id: app._id, status: app.status, matchScore: app.matchScore }
          : null,
      };
    });
    res.json(withMatch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDrive = async (req, res) => {
  try {
    const {
      company,
      role,
      description,
      requiredSkills,
      minCgpa,
      eligibleBranches,
      ctc,
      location,
      type,
      deadline,
    } = req.body;

    if (!company || !role || !description) {
      return res
        .status(400)
        .json({ message: 'Company, role and description are required' });
    }

    const drive = await Drive.create({
      company,
      role,
      description,
      requiredSkills: toList(requiredSkills),
      minCgpa: minCgpa ? Number(minCgpa) : 0,
      eligibleBranches: toList(eligibleBranches),
      ctc: ctc || '',
      location: location || 'Remote',
      type: type || 'full-time',
      deadline: deadline || null,
      createdBy: req.user.id,
    });
    res.status(201).json(drive);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDrive = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.requiredSkills !== undefined)
      update.requiredSkills = toList(update.requiredSkills);
    if (update.eligibleBranches !== undefined)
      update.eligibleBranches = toList(update.eligibleBranches);

    const drive = await Drive.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    res.json(drive);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDrive = async (req, res) => {
  try {
    const drive = await Drive.findByIdAndDelete(req.params.id);
    if (!drive) return res.status(404).json({ message: 'Drive not found' });
    await Application.deleteMany({ drive: req.params.id });
    res.json({ message: 'Drive deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
