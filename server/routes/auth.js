const express = require('express');
const router = express.Router();
const { signup, verifyOtp, resendOtp, login, googleAuth, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

router.post('/signup', otpLimiter, signup);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtp);
router.post('/login', loginLimiter, login);
router.post('/google', googleAuth);
router.post('/logout', logout);
router.get('/me', protect, getMe);

module.exports = router;
