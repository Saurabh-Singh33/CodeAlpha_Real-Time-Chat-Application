const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');
const { verifyGoogleToken } = require('../utils/googleAuth');

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const signup = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  
  try {
    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new unverified user or update existing unverified user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    if (user) {
      user.name = name;
      user.password = hashedPassword;
      user.provider = 'local';
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        provider: 'local',
        isVerified: false
      });
    }

    // Generate 6-digit OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    
    // Invalidate previous OTPs for this email
    await Otp.deleteMany({ email });
    
    await Otp.create({
      email,
      hashedOtp
    });

    const emailText = `Hello ${name},\n\nYour verification OTP is:\n\n${rawOtp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, you can ignore this email.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1A73E8; text-align: center;">VartaConnect</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your verification OTP is:</p>
        <div style="background-color: #F8F9FA; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
          ${rawOtp}
        </div>
        <p style="color: #5F6368; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #80868B; font-size: 12px; text-align: center;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;
    await sendEmail({
      to: email,
      subject: 'Verify Your Account - VartaConnect',
      text: emailText,
      html: emailHtml
    });

    res.status(200).json({ success: true, message: 'OTP sent to email. Please verify.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required' });
  }

  try {
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.hashedOtp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark user as verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();
    await Otp.deleteMany({ email });
    
    generateToken(res, user._id);
    res.status(200).json({ success: true, message: 'Email verified successfully', user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Account is already verified' });
    }

    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    
    await Otp.deleteMany({ email });
    await Otp.create({ email, hashedOtp });

    const emailText = `Hello ${user.name},\n\nYour new verification OTP is:\n\n${rawOtp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, you can ignore this email.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1A73E8; text-align: center;">VartaConnect</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Your new verification OTP is:</p>
        <div style="background-color: #F8F9FA; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
          ${rawOtp}
        </div>
        <p style="color: #5F6368; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #80868B; font-size: 12px; text-align: center;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;
    await sendEmail({
      to: email,
      subject: 'Verify Your Account - VartaConnect',
      text: emailText,
      html: emailHtml
    });

    res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error while resending OTP' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    if (user.provider !== 'local') {
      return res.status(401).json({ success: false, message: 'Please login using Google' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in', needsVerification: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    generateToken(res, user._id);
    res.status(200).json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

const googleAuth = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Google Token required' });
  }

  try {
    const payload = await verifyGoogleToken(idToken);
    if (!payload) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }

    const { sub: googleId, email, name } = payload;
    let user = await User.findOne({ email });

    if (user) {
      if (user.provider === 'local') {
        // Link account to google if they signed up with email initially but now use Google
        user.googleId = googleId;
        user.provider = 'google';
        user.isVerified = true;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        provider: 'google',
        isVerified: true
      });
    }

    generateToken(res, user._id);
    res.status(200).json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google Authentication' });
  }
};

const logout = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        mobileNumber: user.mobileNumber,
        dob: user.dob,
        sex: user.sex
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // For security, do not reveal if email exists
      return res.status(200).json({ success: true, message: 'If the email exists, a reset OTP has been sent.' });
    }

    if (user.provider === 'google' && !user.password) {
      return res.status(400).json({ success: false, message: 'This account uses Google Login. Please sign in with Google.' });
    }

    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    
    await Otp.deleteMany({ email });
    await Otp.create({ email, hashedOtp });

    const emailText = `Hello ${user.name},\n\nYour password reset OTP is:\n\n${rawOtp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request a password reset, please ignore this email.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1A73E8; text-align: center;">VartaConnect</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Your password reset OTP is:</p>
        <div style="background-color: #F8F9FA; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
          ${rawOtp}
        </div>
        <p style="color: #5F6368; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="color: #80868B; font-size: 12px; text-align: center;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;
    await sendEmail({
      to: email,
      subject: 'Password Reset - VartaConnect',
      text: emailText,
      html: emailHtml
    });

    res.status(200).json({ success: true, message: 'If the email exists, a reset OTP has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyResetOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

  try {
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const isValid = await bcrypt.compare(otp, otpRecord.hashedOtp);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    res.status(200).json({ success: true, message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;
  if (!email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const isValid = await bcrypt.compare(otp, otpRecord.hashedOtp);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid OTP' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    await Otp.deleteMany({ email });

    res.status(200).json({ success: true, message: 'Password reset successful. Please login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { name, mobileNumber, dob, sex } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
    if (dob !== undefined) user.dob = dob;
    if (sex !== undefined) user.sex = sex;

    await user.save();
    
    res.status(200).json({ 
      success: true, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        mobileNumber: user.mobileNumber,
        dob: user.dob,
        sex: user.sex
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { signup, verifyOtp, resendOtp, login, googleAuth, logout, getMe, forgotPassword, verifyResetOtp, resetPassword, updateProfile };
