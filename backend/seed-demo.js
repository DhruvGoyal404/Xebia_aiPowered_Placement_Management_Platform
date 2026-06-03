// Rich demo seed — populates ALL FOUR collections with realistic data so the
// dashboards, review queue and analytics look alive.
//   users, registrationrequests, drives, applications
// Run: `npm run seed:demo`  (reads MONGODB_URI from .env — point it at prod first)
//
// WARNING: this WIPES the four collections before reseeding (safe on an empty DB).
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const RegistrationRequest = require('./models/RegistrationRequest');
const Drive = require('./models/Drive');
const Application = require('./models/Application');
const { computeMatch } = require('./utils/aiMatch');

const STUDENT_PASSWORD = 'student123';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  await Promise.all([
    User.deleteMany({}),
    RegistrationRequest.deleteMany({}),
    Drive.deleteMany({}),
    Application.deleteMany({}),
  ]);
  console.log('Cleared the 4 collections.');

  // --- Admin (placement officer) ---
  const admin = await User.create({
    username: process.env.SEED_ADMIN_USERNAME || 'admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@placeiq.com',
    phone: process.env.SEED_ADMIN_PHONE || '9999999999',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
    isApproved: true,
    isActive: true,
  });

  // --- Drives ---
  const driveDefs = [
    {
      company: 'Xebia',
      role: 'Software Engineer',
      description: 'Full-stack MERN role building customer-facing products.',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      minCgpa: 7,
      eligibleBranches: ['CSE', 'IT'],
      ctc: '12 LPA',
      location: 'Gurugram',
      type: 'full-time',
    },
    {
      company: 'CloudScale',
      role: 'Backend Intern',
      description: 'Scalable REST APIs and cloud infra for a SaaS platform.',
      requiredSkills: ['Node.js', 'SQL', 'AWS', 'Docker'],
      minCgpa: 6.5,
      eligibleBranches: ['CSE', 'IT', 'ECE'],
      ctc: '40k/month',
      location: 'Remote',
      type: 'internship',
    },
    {
      company: 'DataForge',
      role: 'Data Analyst',
      description: 'Turn raw product data into dashboards and insights.',
      requiredSkills: ['Python', 'SQL', 'Pandas', 'Statistics'],
      minCgpa: 7.5,
      eligibleBranches: ['CSE', 'IT', 'ECE', 'MATH'],
      ctc: '9 LPA',
      location: 'Bengaluru',
      type: 'full-time',
    },
    {
      company: 'PixelWorks',
      role: 'Frontend Engineer',
      description: 'Craft polished, accessible UIs with React and Tailwind.',
      requiredSkills: ['JavaScript', 'React', 'CSS', 'Tailwind'],
      minCgpa: 6,
      eligibleBranches: [], // open to all branches
      ctc: '10 LPA',
      location: 'Pune',
      type: 'full-time',
    },
  ];
  const D = {};
  for (const def of driveDefs) {
    D[def.company] = await Drive.create({ ...def, createdBy: admin._id });
  }
  console.log(`Created ${driveDefs.length} drives.`);

  // --- Students ---
  const makeStudent = async ({ username, email, phone, branch, cgpa, skills, resumeText }) => {
    const user = await User.create({
      username,
      email,
      phone,
      password: STUDENT_PASSWORD,
      role: 'student',
      isApproved: true,
      isActive: true,
      branch,
      graduationYear: 2026,
      cgpa,
      skills,
      resumeText: resumeText || '',
    });
    await RegistrationRequest.create({
      userId: user._id,
      username,
      email,
      phone,
      status: 'approved',
      approvedBy: admin._id,
    });
    return user;
  };

  const aarav = await makeStudent({
    username: 'aarav_sharma', email: 'aarav@example.com', phone: '9000000001',
    branch: 'CSE', cgpa: 8.6,
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'CSS', 'Tailwind'],
    resumeText: 'Built a MERN e-commerce app and a real-time chat application. Internship at a startup building React dashboards.',
  });
  const isha = await makeStudent({
    username: 'isha_verma', email: 'isha@example.com', phone: '9000000002',
    branch: 'IT', cgpa: 7.8,
    skills: ['Python', 'SQL', 'Pandas', 'Statistics', 'JavaScript'],
    resumeText: 'Data analytics projects using Python and Pandas. Built Power BI dashboards for a campus club.',
  });
  const rohan = await makeStudent({
    username: 'rohan_gupta', email: 'rohan@example.com', phone: '9000000003',
    branch: 'ECE', cgpa: 6.9,
    skills: ['Node.js', 'SQL', 'Docker', 'JavaScript'],
    resumeText: 'Backend APIs in Node.js, containerized with Docker. Hackathon finalist.',
  });
  const neha = await makeStudent({
    username: 'neha_singh', email: 'neha@example.com', phone: '9000000004',
    branch: 'CSE', cgpa: 7.2,
    skills: ['React', 'JavaScript', 'CSS'],
    resumeText: 'Frontend-focused: several React + Tailwind UI projects.',
  });
  const karan = await makeStudent({
    username: 'karan_mehta', email: 'karan@example.com', phone: '9000000005',
    branch: 'MECH', cgpa: 6.4,
    skills: ['Python', 'C++'],
    resumeText: 'Interested in switching to software; learning Python and DSA.',
  });

  // --- Applications across the pipeline ---
  // Helper that recomputes & stores the match score, like the apply controller.
  const applyTo = async (student, drive, status, feedback = '') => {
    const m = computeMatch(student, drive);
    await Application.create({
      drive: drive._id,
      student: student._id,
      status,
      matchScore: m.score,
      matchBreakdown: {
        skillsMatched: m.skillsMatched,
        skillsMissing: m.skillsMissing,
        cgpaEligible: m.cgpaEligible,
        branchEligible: m.branchEligible,
      },
      coverNote: 'Excited about this role and a strong fit for the stack.',
      feedback,
      reviewedBy: status === 'applied' ? null : admin._id,
    });
    if (status === 'offered') {
      await User.findByIdAndUpdate(student._id, { placementStatus: 'placed' });
    }
  };

  await applyTo(aarav, D.Xebia, 'offered', 'Outstanding full-stack fundamentals.');
  await applyTo(aarav, D.PixelWorks, 'interview');
  await applyTo(isha, D.DataForge, 'shortlisted');
  await applyTo(isha, D.Xebia, 'applied');
  await applyTo(rohan, D.CloudScale, 'interview');
  await applyTo(neha, D.PixelWorks, 'applied');
  await applyTo(neha, D.Xebia, 'rejected', 'Strengthen Node.js / backend basics and reapply next cycle.');
  await applyTo(karan, D.CloudScale, 'applied');

  // --- Pending students (show up in the admin Approvals tab) ---
  for (const [username, email, phone, branch, cgpa] of [
    ['tanvi_rao', 'tanvi@example.com', '9000000006', 'CSE', 7.5],
    ['vikram_jain', 'vikram@example.com', '9000000007', 'IT', 8.1],
  ]) {
    const u = await User.create({
      username, email, phone, password: STUDENT_PASSWORD,
      role: 'student', isApproved: false, isActive: false,
      branch, graduationYear: 2026, cgpa, skills: ['JavaScript', 'React'],
    });
    await RegistrationRequest.create({ userId: u._id, username, email, phone, status: 'pending' });
  }

  const [users, reqs, drives, apps] = await Promise.all([
    User.countDocuments(),
    RegistrationRequest.countDocuments(),
    Drive.countDocuments(),
    Application.countDocuments(),
  ]);
  console.log('Document counts ->', { users, registrationrequests: reqs, drives, applications: apps });
  console.log('\nLogins:');
  console.log(`  Admin    : ${admin.email} / ${process.env.SEED_ADMIN_PASSWORD || 'Admin@123'}`);
  console.log(`  Students : aarav@, isha@, rohan@, neha@, karan@example.com  (password: ${STUDENT_PASSWORD})`);
  console.log(`  Pending  : tanvi@, vikram@example.com  (awaiting approval)`);
  console.log('\nDemo seed complete.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
