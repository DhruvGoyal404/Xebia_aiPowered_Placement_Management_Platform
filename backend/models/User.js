const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    isApproved: {
      type: Boolean,
      default: false, // Pending admin approval
    },
    isActive: {
      type: Boolean,
      default: false, // Not active until admin approves
    },

    // ---- Placement profile (students) ----
    branch: {
      type: String,
      default: '',
      trim: true,
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    cgpa: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    resumeText: {
      type: String,
      default: '',
    },
    resumeLink: {
      type: String,
      default: '',
    },
    placementStatus: {
      type: String,
      enum: ['unplaced', 'placed'],
      default: 'unplaced',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
