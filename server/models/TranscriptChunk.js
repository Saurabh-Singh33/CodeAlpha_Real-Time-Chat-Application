const mongoose = require('mongoose');

const transcriptChunkSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    index: true
  },
  chunkNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: Number, // Start time in seconds or ms
    default: 0
  },
  endTime: {
    type: Number, // End time in seconds or ms
    default: 0
  },
  transcript: {
    type: String,
    required: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 432000 // 5 days TTL index in MongoDB Atlas (432,000 seconds)
  }
});

// Composite index to avoid duplicate chunk processing
transcriptChunkSchema.index({ meetingId: 1, chunkNumber: 1 }, { unique: true });

module.exports = mongoose.model('TranscriptChunk', transcriptChunkSchema);
