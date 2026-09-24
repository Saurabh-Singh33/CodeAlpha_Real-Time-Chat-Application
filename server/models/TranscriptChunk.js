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
    expires: parseInt(process.env.AI_TTL_SECONDS || '259200', 10) // 3 days TTL index in MongoDB Atlas (259,200 seconds)
  }
});

// Composite index to avoid duplicate chunk processing
transcriptChunkSchema.index({ meetingId: 1, chunkNumber: 1 }, { unique: true });

module.exports = mongoose.model('TranscriptChunk', transcriptChunkSchema);
