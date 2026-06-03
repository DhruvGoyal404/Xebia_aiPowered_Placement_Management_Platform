const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware, studentMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.put('/profile', authMiddleware, studentMiddleware, authController.updateProfile);

module.exports = router;
