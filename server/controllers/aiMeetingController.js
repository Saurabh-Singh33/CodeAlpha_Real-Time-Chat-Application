const TranscriptChunk = require('../models/TranscriptChunk');
const MeetingAIAnalysis = require('../models/MeetingAIAnalysis');
const Room = require('../models/Room');
const transcriptionService = require('../services/transcriptionService');
const aiMeetingService = require('../services/aiMeetingService');

/**
 * Handle individual transcript chunk submission or audio upload
 * POST /api/ai-meeting/chunk
 */
const uploadChunk = async (req, res) => {
  try {
    const { meetingId, chunkNumber, startTime, endTime, textTranscript } = req.body;
    
    if (!meetingId || chunkNumber === undefined) {
      return res.status(400).json({ success: false, message: 'meetingId and chunkNumber are required' });
    }

    const chunkNum = parseInt(chunkNumber, 10);
    const startSec = parseFloat(startTime || 0);
    const endSec = parseFloat(endTime || 0);

    // 1. Avoid duplicate processing if chunk already exists
    const existingChunk = await TranscriptChunk.findOne({ meetingId, chunkNumber: chunkNum });
    if (existingChunk) {
      return res.json({
        success: true,
        message: 'Chunk already exists. Skipping duplicate processing.',
        chunk: existingChunk
      });
    }

    let finalTranscript = textTranscript || '';

    // 2. If audio file uploaded via multer, send through transcriptionService
    if (req.file) {
      finalTranscript = await transcriptionService.transcribeChunk({
        audioBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        chunkNumber: chunkNum,
        startTime: startSec,
        endTime: endSec
      });
    } else if (!finalTranscript.trim()) {
      return res.status(400).json({ success: false, message: 'Neither audio file nor text transcript provided' });
    }

    // 3. Save transcript chunk in MongoDB Atlas with 5-day TTL index
    const newChunk = await TranscriptChunk.create({
      meetingId,
      chunkNumber: chunkNum,
      startTime: startSec,
      endTime: endSec,
      transcript: finalTranscript.trim()
    });

    res.status(201).json({
      success: true,
      message: `Chunk #${chunkNum} saved successfully`,
      chunk: newChunk
    });
  } catch (error) {
    console.error('[AI Controller] Error uploading chunk:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to process transcript chunk'
    });
  }
};

const aiJobQueue = require('../services/aiJobQueue');

/**
 * Trigger Post-Meeting Processing to generate AI Summary
 * POST /api/ai-meeting/process/:meetingId
 */
const processMeetingSummary = async (req, res) => {
  const { meetingId } = req.params;
  const { duration, participantCount } = req.body;

  if (!meetingId) {
    return res.status(400).json({ success: false, message: 'meetingId parameter is required' });
  }

  try {
    // 1. Check MongoDB Atlas Cache first. If completed, return instantly!
    const existingAnalysis = await MeetingAIAnalysis.findOne({ meetingId });
    if (existingAnalysis && existingAnalysis.status === 'completed') {
      return res.json({
        success: true,
        message: 'Summary fetched from MongoDB Atlas cache.',
        analysis: existingAnalysis,
        cached: true
      });
    }

    // 2. Delegate to AIJobQueue for sequential, rate-limited processing
    const queueResult = await aiJobQueue.addJob({
      meetingId,
      duration: duration || 0,
      participantCount: participantCount || 1
    });

    res.json(queueResult);
  } catch (error) {
    console.error('[AI Controller] Error processing meeting summary:', error);
    const isQuotaError = error.statusCode === 429 || error.message?.includes('quota') || error.message?.includes('429');
    const userErrMsg = isQuotaError ? 'AI is busy processing other meetings. Your summary will be ready shortly.' : error.message;

    res.status(error.statusCode || 500).json({
      success: false,
      message: userErrMsg,
      isQuotaError
    });
  }
};

/**
 * Fetch Post-Meeting Summary & Transcript for a specific meetingId
 * GET /api/ai-meeting/summary/:meetingId
 */
const getMeetingSummary = async (req, res) => {
  const { meetingId } = req.params;

  if (!meetingId) {
    return res.status(400).json({ success: false, message: 'meetingId is required' });
  }

  try {
    const analysis = await MeetingAIAnalysis.findOne({ meetingId });
    const chunks = await TranscriptChunk.find({ meetingId }).sort({ chunkNumber: 1 });

    // Handle Expired Data (older than 3 days / deleted by MongoDB Atlas TTL)
    if (!analysis && chunks.length === 0) {
      return res.json({
        success: false,
        expired: true,
        message: 'Summary for this meeting has expired.'
      });
    }

    res.json({
      success: true,
      analysis: analysis || {
        meetingId,
        status: 'pending',
        finalSummary: '',
        keyPoints: [],
        decisions: [],
        actionItems: [],
        transcriptChunkCount: chunks.length
      },
      chunks
    });
  } catch (error) {
    console.error('[AI Controller] Error fetching meeting summary:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching AI meeting summary' });
  }
};

/**
 * Fetch list of recent AI meeting summaries for user dashboard
 * GET /api/ai-meeting/list
 */
const getMeetingList = async (req, res) => {
  try {
    const summaries = await MeetingAIAnalysis.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, summaries });
  } catch (error) {
    console.error('[AI Controller] Error listing summaries:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch AI meeting summaries' });
  }
};

module.exports = {
  uploadChunk,
  processMeetingSummary,
  getMeetingSummary,
  getMeetingList
};
