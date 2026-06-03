const express = require('express');
const ctrl = require('../controllers/aiController');
const { authMiddleware, studentMiddleware } = require('../middleware/auth');

const router = express.Router();

// All AI assist features are for authenticated students.
router.use(authMiddleware, studentMiddleware);

router.get('/match/:driveId', ctrl.match);
router.get('/interview-prep/:driveId', ctrl.interviewPrep);
router.get('/skill-gap/:driveId', ctrl.skillGap);
router.post('/resume-feedback', ctrl.resumeFeedback);

module.exports = router;
