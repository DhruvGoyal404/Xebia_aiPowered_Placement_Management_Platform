const jwt = require('jsonwebtoken');

// Verify JWT and attach the decoded payload to req.user
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Restrict a route to a specific role (e.g. roleMiddleware('admin'))
const roleMiddleware = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ message: `${role} access required` });
  }
  next();
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  adminMiddleware: roleMiddleware('admin'),
  studentMiddleware: roleMiddleware('student'),
};
