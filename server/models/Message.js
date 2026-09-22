const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String,
    required: true
  },
  senderId: {
    type: String
  },
  type: {
    type: String,
    enum: ['text', 'file'],
    default: 'text'
  },
  text: {
    type: String
  },
  fileData: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  fileSize: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 432000 // Automatically expire and delete from MongoDB Atlas after 5 days (432,000 seconds)
  }
});

module.exports = mongoose.model('Message', messageSchema);
