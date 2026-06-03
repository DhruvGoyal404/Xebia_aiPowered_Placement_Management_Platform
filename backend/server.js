const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// CORS: allow the configured client origin(s) in prod, fall back to open in dev.
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, true); // permissive for the MVP; tighten if needed
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: '6mb' }));

connectDB();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/drives', require('./routes/drives'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/ai', require('./routes/ai'));

app.get('/', (req, res) => {
  res.json({ message: 'PlaceIQ API — AI-powered placement management platform' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
