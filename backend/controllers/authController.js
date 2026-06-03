const User = require('../models/User');
const RegistrationRequest = require('../models/RegistrationRequest');
const jwt = require('jsonwebtoken');
const { isCloudinaryConfigured, uploadProfilePic } = require('../utils/cloudinary');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Accept skills as an array or a comma-separated string.
const toSkills = (val) => {
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string')
    return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// Student registration -> creates a pending request for placement-cell approval.
exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      phone,
      password,
      confirmPassword,
      profilePic,
      branch,
      graduationYear,
      cgpa,
      skills,
      resumeText,
      resumeLink,
    } = req.body;

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
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'An account with this email/username already exists' });
    }

    // Upload a base64 profile pic to Cloudinary when configured; otherwise
    // accept a plain URL, else store null.
    let profilePicUrl = null;
    if (profilePic) {
      if (profilePic.startsWith('data:image')) {
        if (isCloudinaryConfigured()) {
          try {
            profilePicUrl = await uploadProfilePic(profilePic);
          } catch (uploadErr) {
            console.error('Cloudinary upload error (register):', uploadErr.message);
            return res
              .status(500)
              .json({ message: 'Failed to upload profile picture' });
          }
        }
      } else {
        profilePicUrl = profilePic; // already a URL
      }
    }

    const user = new User({
      username,
      email,
      phone,
      password,
      profilePic: profilePicUrl,
      role: 'student',
      isApproved: false,
      isActive: false,
      branch: branch || '',
      graduationYear: graduationYear ? Number(graduationYear) : null,
      cgpa: cgpa ? Number(cgpa) : 0,
      skills: toSkills(skills),
      resumeText: resumeText || '',
      resumeLink: resumeLink || '',
    });
    await user.save();

    await RegistrationRequest.create({
      userId: user._id,
      username,
      email,
      phone,
      profilePic: profilePicUrl,
      status: 'pending',
    });

    res.status(201).json({
      message: 'Registration submitted. Awaiting placement-cell approval.',
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login -> issues a JWT (with role-based + status gates).
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin' && !user.isApproved) {
      return res
        .status(403)
        .json({ message: 'Your registration is pending admin approval' });
    }
    if (!user.isActive) {
      return res
        .status(403)
        .json({ message: 'Your account has been deactivated' });
    }

    res.json({
      message: 'Login successful',
      token: signToken(user),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Current authenticated user's full profile.
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student updates their placement profile (skills/CGPA/branch/resume).
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { branch, graduationYear, cgpa, skills, resumeText, resumeLink } =
      req.body;

    if (branch !== undefined) user.branch = branch;
    if (graduationYear !== undefined)
      user.graduationYear = graduationYear ? Number(graduationYear) : null;
    if (cgpa !== undefined) user.cgpa = cgpa ? Number(cgpa) : 0;
    if (skills !== undefined) user.skills = toSkills(skills);
    if (resumeText !== undefined) user.resumeText = resumeText;
    if (resumeLink !== undefined) user.resumeLink = resumeLink;

    await user.save();
    const safe = await User.findById(user._id).select('-password');
    res.json({ message: 'Profile updated', user: safe });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
