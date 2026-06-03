// Seeds a default admin (placement officer) and a couple of starter drives so
// you can log in immediately. Run once: `npm run seed`.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Drive = require('./models/Drive');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Seeding...');

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@placeiq.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';

  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      username: process.env.SEED_ADMIN_USERNAME || 'admin',
      email,
      phone: process.env.SEED_ADMIN_PHONE || '9999999999',
      password,
      role: 'admin',
      isApproved: true,
      isActive: true,
    });
    console.log(`Admin created: ${email} / ${password}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  const count = await Drive.countDocuments();
  if (count === 0) {
    await Drive.insertMany([
      {
        company: 'Xebia',
        role: 'Software Engineer',
        description:
          'Full-stack role on the MERN stack. Build and ship customer-facing products.',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        minCgpa: 7,
        eligibleBranches: ['CSE', 'IT'],
        ctc: '12 LPA',
        location: 'Gurugram',
        type: 'full-time',
        createdBy: admin._id,
      },
      {
        company: 'CloudScale',
        role: 'Backend Intern',
        description:
          'Work on scalable REST APIs and cloud infrastructure for a fast-growing SaaS.',
        requiredSkills: ['Node.js', 'SQL', 'AWS', 'Docker'],
        minCgpa: 6.5,
        eligibleBranches: ['CSE', 'IT', 'ECE'],
        ctc: '40k/month',
        location: 'Remote',
        type: 'internship',
        createdBy: admin._id,
      },
    ]);
    console.log('Seeded 2 starter drives.');
  }

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
