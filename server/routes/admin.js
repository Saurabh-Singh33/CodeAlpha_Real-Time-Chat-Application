const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');
const { adminLoginLimiter } = require('../middleware/rateLimiter');

// Public routes for admin authentication and password recovery (rate limited)
router.post('/login', adminLoginLimiter, adminController.login);
router.post('/forgot-password', adminLoginLimiter, adminController.forgotPassword);
router.post('/verify-reset-otp', adminLoginLimiter, adminController.verifyResetOtp);
router.post('/reset-password', adminLoginLimiter, adminController.resetPassword);

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
router.get('/stats/today', adminController.getTodayStats);
router.get('/meetings/live', adminController.getLiveMeetings);
router.get('/gemini-status', adminController.getGeminiStatus);

module.exports = router;
