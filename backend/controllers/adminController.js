const User = require('../models/User');
const RegistrationRequest = require('../models/RegistrationRequest');
const Drive = require('../models/Drive');
const Application = require('../models/Application');
const { sendApprovalEmail } = require('../utils/mailer');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pending registration requests
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await RegistrationRequest.find({ status: 'pending' }).sort({
      createdAt: -1,
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const request = await RegistrationRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'approved';
    request.approvedBy = req.user.id;
    await request.save();

    const user = await User.findById(request.userId);
    if (user) {
      user.isApproved = true;
      user.isActive = true;
      await user.save();

      // Notify the student (non-blocking; no-ops if mail isn't configured).
      sendApprovalEmail({ to: user.email, username: user.username }).catch(
        (mailErr) => console.error('Approval email failed:', mailErr.message)
      );
    }

    res.json({ message: 'Student approved', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const request = await RegistrationRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = 'rejected';
    request.rejectionReason = req.body.reason || 'Not specified';
    await request.save();

    await User.findByIdAndDelete(request.userId);
    res.json({ message: 'Request rejected', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// User management
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Guardrail: don't let an admin deactivate themselves.
    if (user._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({ message: 'You cannot change your own status' });
    }

    user.isActive = !user.isActive;
    await user.save();
    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
      user: { id: user._id, isActive: user.isActive },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = await User.create({
      username,
      email,
      phone,
      password,
      role: 'admin',
      isApproved: true,
      isActive: true,
    });

    res.status(201).json({
      message: 'Admin created',
      admin: { id: admin._id, username: admin.username, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Dashboard / analytics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      activeStudents,
      placedStudents,
      pendingRequests,
      totalDrives,
      activeDrives,
      applications,
      shortlisted,
      interviewing,
      offered,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'student', placementStatus: 'placed' }),
      RegistrationRequest.countDocuments({ status: 'pending' }),
      Drive.countDocuments({}),
      Drive.countDocuments({ isActive: true }),
      Application.countDocuments({}),
      Application.countDocuments({ status: 'shortlisted' }),
      Application.countDocuments({ status: 'interview' }),
      Application.countDocuments({ status: 'offered' }),
    ]);

    res.json({
      totalStudents,
      activeStudents,
      placedStudents,
      pendingRequests,
      totalDrives,
      activeDrives,
      applications,
      shortlisted,
      interviewing,
      offered,
      placementRate: activeStudents
        ? Math.round((placedStudents / activeStudents) * 100)
        : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
