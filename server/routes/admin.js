const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

// Public route for admin authentication with strict rate limiting
router.post('/login', adminLoginLimiter, adminController.login);

// Protected admin routes requiring valid JWT
router.use(adminAuth);

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.delete('/users/:id', adminController.deleteUser);
router.get('/meetings', adminController.getMeetings);
router.get('/meetings/:roomId', adminController.getMeetingById);
router.get('/activity', adminController.getActivity);
router.get('/system/status', adminController.getSystemStatus);
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
