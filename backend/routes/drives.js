const express = require('express');
const ctrl = require('../controllers/driveController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Any authenticated user can list drives.
router.get('/', ctrl.getDrives);

// Mutations are admin-only.
router.post('/', adminMiddleware, ctrl.createDrive);
router.put('/:id', adminMiddleware, ctrl.updateDrive);
router.delete('/:id', adminMiddleware, ctrl.deleteDrive);

module.exports = router;
