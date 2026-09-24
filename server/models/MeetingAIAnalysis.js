const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema({
  person: {
    type: String,
    default: 'Unassigned'
  },
  task: {
    type: String,
    required: true
  },
  deadline: {
    type: String,
    default: 'N/A'
  },
  timestamp: {
    type: String,
    default: '00:00:00'
  }
}, { _id: false });

const sectionSummarySchema = new mongoose.Schema({
  sectionIndex: Number,
  title: String,
  timeRange: String,
  summary: String
}, { _id: false });

const meetingAIAnalysisSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sectionSummaries: [sectionSummarySchema],
  finalSummary: {
    type: String,
    default: ''
  },
  keyPoints: [{
    type: String
  }],
  decisions: [{
    type: String
  }],
  actionItems: [actionItemSchema],
  duration: {
    type: Number,
    default: 0
  },
  participantCount: {
    type: Number,
    default: 1
  },
  transcriptChunkCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'transcribing', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: parseInt(process.env.AI_TTL_SECONDS || '259200', 10) // 3 days TTL index in MongoDB Atlas (259,200 seconds)
  }
});

module.exports = mongoose.model('MeetingAIAnalysis', meetingAIAnalysisSchema);
