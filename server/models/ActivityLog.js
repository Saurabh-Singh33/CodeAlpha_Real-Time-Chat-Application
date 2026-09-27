const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user_signup', 'meeting_start', 'meeting_end', 'user_joined_meeting', 'user_left_meeting', 'admin_action'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    default: null,
  },
  userEmail: {
    type: String,
    default: null,
  },
  roomId: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
