const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Every admin route requires a valid token AND the admin role.
router.use(authMiddleware, adminMiddleware);

router.get('/pending-requests', adminController.getPendingRequests);
router.post('/approve-request/:requestId', adminController.approveRequest);
router.post('/reject-request/:requestId', adminController.rejectRequest);

router.get('/all-users', adminController.getAllUsers);
router.post('/toggle-user-status/:userId', adminController.toggleUserStatus);
router.post('/create-admin', adminController.createAdmin);

router.get('/dashboard-stats', adminController.getDashboardStats);

module.exports = router;
