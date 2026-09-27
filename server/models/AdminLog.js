const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminEmail: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetId: {
    type: String,
    default: null,
  },
  details: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('AdminLog', adminLogSchema);
