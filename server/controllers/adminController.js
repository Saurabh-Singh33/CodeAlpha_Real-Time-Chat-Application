const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const Meeting = require('../models/Meeting');
const Room = require('../models/Room');
const Message = require('../models/Message');
const MeetingAIAnalysis = require('../models/MeetingAIAnalysis');
const AdminLog = require('../models/AdminLog');
const ActivityLog = require('../models/ActivityLog');

// Helper to write audit logs
const logAdminAction = async (adminEmail, action, targetId = null, details = '', ipAddress = '') => {
  try {
    await AdminLog.create({
      adminEmail,
      action,
      targetId,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to log admin action:', err.message);
  }
};

// POST /api/admin/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
      return res.status(500).json({ 
        success: false, 
        message: 'Admin credentials not configured in backend .env file. Please check ADMIN_EMAIL and ADMIN_PASSWORD_HASH.' 
      });
    }

    const isEmailMatch = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();
    const isPasswordMatch = await bcrypt.compare(password, adminPasswordHash);

    if (!isEmailMatch || !isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        role: 'admin', 
        email: adminEmail, 
        name: process.env.ADMIN_NAME || 'Saurabh' 
      },
      process.env.JWT_SECRET || 'supersecret_jwt_key',
      { expiresIn: '24h' }
    );

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    await logAdminAction(adminEmail, 'login', null, 'Admin logged in successfully', clientIp);

    return res.json({
      success: true,
      token,
      admin: {
        email: adminEmail,
        name: process.env.ADMIN_NAME || 'Saurabh'
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during admin login' });
  }
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalMeetings = await Meeting.countDocuments({});
    const totalMessages = await Message.countDocuments({});

    // Retrieve active sockets & rooms from express app locals if available
    const getActiveRooms = req.app.get('getActiveRooms') || (() => ({}));
    const getActiveSocketsCount = req.app.get('getActiveSocketsCount') || (() => 0);
    const getAiMeetingStates = req.app.get('getAiMeetingStates') || (() => ({}));

    const activeRooms = getActiveRooms();
    const activeNow = getActiveSocketsCount();

    // Fetch top 5 recent meetings
    const recentMeetingsRaw = await Meeting.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    const recentMeetings = recentMeetingsRaw.map(m => ({
      id: m._id,
      title: m.title,
      roomId: m._id.toString(),
      host: m.user ? m.user.name : 'Unknown Host',
      hostEmail: m.user ? m.user.email : 'N/A',
      date: m.date,
      time: m.time,
      createdAt: m.createdAt,
      participants: activeRooms[m._id.toString()] ? Object.keys(activeRooms[m._id.toString()]).length : 1,
      status: activeRooms[m._id.toString()] ? 'Live' : 'Ended'
    }));

    // Fetch top 5 recent activity events
    let recentActivity = await ActivityLog.find({})
      .sort({ timestamp: -1 })
      .limit(5);

    // If activity log is empty, generate dynamic recent events from recent users & meetings
    if (recentActivity.length < 5) {
      const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(3);
      const userActivity = recentUsers.map(u => ({
        _id: u._id,
        type: 'user_signup',
        description: `${u.name} created an account`,
        userEmail: u.email,
        timestamp: u.createdAt
      }));

      const recentMeetingLogs = recentMeetingsRaw.map(m => ({
        _id: m._id,
        type: 'meeting_start',
        description: `Meeting "${m.title}" was scheduled/started by ${m.user ? m.user.name : 'a user'}`,
        roomId: m._id.toString(),
        timestamp: m.createdAt
      }));

      const combined = [...recentActivity, ...userActivity, ...recentMeetingLogs]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);

      recentActivity = combined;
    }

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalMeetings,
        activeNow,
        totalMessages
      },
      recentMeetings,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const statusFilter = req.query.status || 'All'; // All | Active | Offline

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const getActiveSocketEmails = req.app.get('getActiveSocketEmails') || (() => new Set());
    const activeEmails = getActiveSocketEmails();

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit) || 1;

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-password');

    const formattedUsers = users.map(user => {
      const isOnline = activeEmails.has(user.email.toLowerCase());
      const status = isOnline ? 'Active' : 'Offline';

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        isVerified: user.isVerified,
        mobileNumber: user.mobileNumber,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActive: user.updatedAt || user.createdAt,
        status
      };
    });

    // Filter by status in memory if requested
    let finalUsers = formattedUsers;
    if (statusFilter === 'Active') {
      finalUsers = formattedUsers.filter(u => u.status === 'Active');
    } else if (statusFilter === 'Offline') {
      finalUsers = formattedUsers.filter(u => u.status === 'Offline');
    }

    return res.json({
      success: true,
      users: finalUsers,
      totalUsers,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID format' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const getActiveSocketEmails = req.app.get('getActiveSocketEmails') || (() => new Set());
    const activeEmails = getActiveSocketEmails();
    const isOnline = activeEmails.has(user.email.toLowerCase());

    const totalMeetingsHosted = await Meeting.countDocuments({ user: userId });
    const totalMessagesSent = await Message.countDocuments({ 
      $or: [
        { senderId: userId },
        { sender: user.name }
      ]
    });

    const recentMeetings = await Meeting.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    await logAdminAction(req.admin.email, 'viewed_user_details', userId, `Viewed details for ${user.email}`, clientIp);

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        isVerified: user.isVerified,
        mobileNumber: user.mobileNumber,
        dob: user.dob,
        sex: user.sex,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        status: isOnline ? 'Active' : 'Offline'
      },
      metrics: {
        totalMeetings: totalMeetingsHosted,
        hostedCount: totalMeetingsHosted,
        joinedCount: totalMeetingsHosted, // or combined
        totalMessagesSent
      },
      recentMeetings
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const targetUserEmail = user.email;

    // Delete User document immediately
    await User.findByIdAndDelete(userId);

    // Set flag pendingDeletion: true on messages and AI records for TTL cleanup
    await Message.updateMany(
      { $or: [{ senderId: userId }, { sender: user.name }] },
      { $set: { pendingDeletion: true } }
    );

    await MeetingAIAnalysis.updateMany(
      { meetingId: { $in: await Meeting.find({ user: userId }).distinct('_id') } },
      { $set: { pendingDeletion: true } }
    );

    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    await logAdminAction(
      req.admin.email, 
      'delete_user', 
      userId, 
      `Deleted user ${targetUserEmail} (ID: ${userId}) and set pendingDeletion flag on messages`, 
      clientIp
    );

    return res.json({
      success: true,
      message: `User ${user.name} (${targetUserEmail}) deleted successfully. Associated messages marked pendingDeletion for TTL cleanup.`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// GET /api/admin/meetings
const getMeetings = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';
    const statusFilter = req.query.status || 'All'; // All | Live | Ended

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { team: { $regex: search, $options: 'i' } }
      ];
    }

    const totalMeetings = await Meeting.countDocuments(query);
    const totalPages = Math.ceil(totalMeetings / limit) || 1;

    const rawMeetings = await Meeting.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email');

    const getActiveRooms = req.app.get('getActiveRooms') || (() => ({}));
    const getAiMeetingStates = req.app.get('getAiMeetingStates') || (() => ({}));
    const activeRooms = getActiveRooms();
    const aiMeetingStates = getAiMeetingStates();

    const formattedMeetings = rawMeetings.map(m => {
      const roomIdStr = m._id.toString();
      const liveRoom = activeRooms[roomIdStr];
      const isLive = !!(liveRoom && Object.keys(liveRoom).length > 0);
      const participantCount = isLive ? Object.keys(liveRoom).length : 0;
      const aiEnabled = !!aiMeetingStates[roomIdStr];

      return {
        _id: m._id,
        meetingId: roomIdStr,
        title: m.title,
        host: m.user ? m.user.name : 'Unknown Host',
        hostEmail: m.user ? m.user.email : 'N/A',
        date: m.date,
        time: m.time,
        team: m.team,
        createdAt: m.createdAt,
        participantsCount: participantCount,
        duration: isLive ? 'In progress' : 'Ended',
        status: isLive ? 'Live' : 'Ended',
        aiNotesEnabled: aiEnabled
      };
    });

    let finalMeetings = formattedMeetings;
    if (statusFilter === 'Live') {
      finalMeetings = formattedMeetings.filter(m => m.status === 'Live');
    } else if (statusFilter === 'Ended') {
      finalMeetings = formattedMeetings.filter(m => m.status === 'Ended');
    }

    return res.json({
      success: true,
      meetings: finalMeetings,
      totalMeetings,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch meetings' });
  }
};

// GET /api/admin/meetings/:roomId
const getMeetingById = async (req, res) => {
  try {
    const { roomId } = req.params;

    let meeting = null;
    if (mongoose.Types.ObjectId.isValid(roomId)) {
      meeting = await Meeting.findById(roomId).populate('user', 'name email');
    }

    const getActiveRooms = req.app.get('getActiveRooms') || (() => ({}));
    const getAiMeetingStates = req.app.get('getAiMeetingStates') || (() => ({}));

    const activeRooms = getActiveRooms();
    const aiMeetingStates = getAiMeetingStates();

    const liveRoom = activeRooms[roomId];
    const isLive = !!(liveRoom && Object.keys(liveRoom).length > 0);
    const participants = isLive ? Object.values(liveRoom) : [];

    const aiAnalysis = await MeetingAIAnalysis.findOne({ meetingId: roomId });

    return res.json({
      success: true,
      meetingDetails: {
        meetingId: roomId,
        title: meeting ? meeting.title : `Room ${roomId}`,
        host: meeting && meeting.user ? meeting.user.name : 'N/A',
        hostEmail: meeting && meeting.user ? meeting.user.email : 'N/A',
        date: meeting ? meeting.date : 'N/A',
        time: meeting ? meeting.time : 'N/A',
        status: isLive ? 'Live' : 'Ended',
        aiNotesEnabled: !!aiMeetingStates[roomId],
        participants: participants.map(p => ({
          username: p.username,
          isHost: p.isHost,
          id: p.id
        })),
        aiAnalysisSummary: aiAnalysis ? aiAnalysis.finalSummary : null,
        createdAt: meeting ? meeting.createdAt : new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching meeting detail:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch meeting details' });
  }
};

// GET /api/admin/activity
const getActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    let activities = await ActivityLog.find({})
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // If activity logs are sparse, fallback to synthesizing from User & Meeting collections
    if (activities.length === 0) {
      const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(25);
      const recentMeetings = await Meeting.find({}).sort({ createdAt: -1 }).limit(25).populate('user', 'name');

      const userEvents = recentUsers.map(u => ({
        _id: u._id,
        type: 'user_signup',
        description: `${u.name} created an account`,
        userEmail: u.email,
        timestamp: u.createdAt
      }));

      const meetingEvents = recentMeetings.map(m => ({
        _id: m._id,
        type: 'meeting_start',
        description: `Meeting "${m.title}" was scheduled by ${m.user ? m.user.name : 'User'}`,
        roomId: m._id.toString(),
        timestamp: m.createdAt
      }));

      activities = [...userEvents, ...meetingEvents]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    }

    const totalActivity = activities.length;
    const totalPages = Math.ceil(totalActivity / limit) || 1;

    return res.json({
      success: true,
      activity: activities,
      totalActivity,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity feed' });
  }
};

// GET /api/admin/system/status
const getSystemStatus = async (req, res) => {
  try {
    // 1. Backend status: Online
    const backendStatus = 'Online';

    // 2. Database status: Mongoose connection check
    const dbState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const dbStatus = dbState === 1 ? 'Connected' : 'Disconnected';

    // 3. Socket.IO status
    const getActiveSocketsCount = req.app.get('getActiveSocketsCount');
    const socketStatus = getActiveSocketsCount !== undefined ? 'Connected' : 'Disconnected';

    // 4. Gemini API status
    let geminiStatus = 'Available';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
      geminiStatus = 'Not Configured';
    } else {
      // Basic check
      geminiStatus = 'Available';
    }

    return res.json({
      success: true,
      status: {
        backend: backendStatus,
        database: dbStatus,
        socket: socketStatus,
        gemini: geminiStatus,
        appName: process.env.APP_NAME || 'VartaConnect',
        environment: process.env.NODE_ENV || 'development',
        retention: {
          chatRetention: '24 Hours',
          aiSummaryRetention: '3 Days'
        }
      }
    });
  } catch (error) {
    console.error('Error checking system status:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch system status' });
  }
};

// GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find({})
      .sort({ timestamp: -1 })
      .limit(20);

    return res.json({
      success: true,
      auditLogs: logs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

module.exports = {
  login,
  getStats,
  getUsers,
  getUserById,
  deleteUser,
  getMeetings,
  getMeetingById,
  getActivity,
  getSystemStatus,
  getAuditLogs
};
