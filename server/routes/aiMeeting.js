const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadChunk,
  processMeetingSummary,
  getMeetingSummary,
  getMeetingList
} = {
  ...require('../controllers/aiMeetingController')
};

// Multer memory storage for parsing audio chunk uploads (max 25MB per chunk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Post individual audio or text transcript chunk
router.post('/chunk', protect, upload.single('audioChunk'), uploadChunk);

// Trigger post-meeting processing to generate Gemini AI summary
router.post('/process/:meetingId', protect, processMeetingSummary);

// Fetch summary and transcripts for a meeting
router.get('/summary/:meetingId', protect, getMeetingSummary);

// List recent AI meeting summaries
router.get('/list', protect, getMeetingList);

module.exports = router;
