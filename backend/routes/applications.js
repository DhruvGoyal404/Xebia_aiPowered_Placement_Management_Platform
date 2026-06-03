const express = require('express');
const ctrl = require('../controllers/applicationController');
const {
  authMiddleware,
  adminMiddleware,
  studentMiddleware,
} = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Student actions
router.post('/', studentMiddleware, ctrl.apply);
router.get('/mine', studentMiddleware, ctrl.getMine);
router.delete('/:id', studentMiddleware, ctrl.withdraw);

// Admin review
router.get('/', adminMiddleware, ctrl.getAll);
router.patch('/:id/review', adminMiddleware, ctrl.review);

module.exports = router;
