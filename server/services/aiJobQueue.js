const MeetingAIAnalysis = require('../models/MeetingAIAnalysis');
const TranscriptChunk = require('../models/TranscriptChunk');
const aiMeetingService = require('./aiMeetingService');

class AIJobQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.activeMeetingId = null;
  }

  /**
   * Add a meeting summary generation job to the queue
   * @param {Object} jobData { meetingId, duration, participantCount }
   */
  async addJob(jobData) {
    const { meetingId, duration = 0, participantCount = 1 } = jobData;

    // 1. Check if analysis is already completed in MongoDB Atlas
    let analysis = await MeetingAIAnalysis.findOne({ meetingId });
    if (analysis && analysis.status === 'completed') {
      return { success: true, analysis, cached: true };
    }

    // 2. Prevent duplicate queuing
    const isAlreadyQueued = this.queue.some(job => job.meetingId === meetingId);
    if (isAlreadyQueued || this.activeMeetingId === meetingId) {
      return { 
        success: true, 
        message: 'AI summary job is already queued or processing.', 
        analysis 
      };
    }

    // 3. Create or update analysis status to pending/transcribing
    if (!analysis) {
      analysis = await MeetingAIAnalysis.create({
        meetingId,
        status: 'transcribing',
        duration,
        participantCount
      });
    } else {
      analysis.status = 'transcribing';
      analysis.errorMessage = '';
      if (duration) analysis.duration = duration;
      if (participantCount) analysis.participantCount = participantCount;
      await analysis.save();
    }

    // 4. Push to queue and trigger processing loop
    this.queue.push({ meetingId, duration, participantCount, retryCount: 0 });
    this.processNext();

    return { 
      success: true, 
      message: 'Summary request added to job queue.', 
      analysis 
    };
  }

  /**
   * Process the next job in the queue sequentially
   */
  async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const currentJob = this.queue.shift();
    const { meetingId } = currentJob;
    this.activeMeetingId = meetingId;

    console.log(`[AI Job Queue] Starting AI processing for meeting: ${meetingId} (Queue size: ${this.queue.length})`);

    try {
      const analysis = await MeetingAIAnalysis.findOne({ meetingId });
      if (!analysis) {
        this.finishCurrentJob();
        return;
      }

      analysis.status = 'transcribing';
      await analysis.save();

      // Fetch transcript chunks for this meeting
      const chunks = await TranscriptChunk.find({ meetingId }).sort({ chunkNumber: 1 });
      analysis.transcriptChunkCount = chunks.length;

      if (chunks.length === 0) {
        analysis.status = 'completed';
        analysis.finalSummary = 'No transcripts were recorded for this meeting.';
        await analysis.save();
        console.log(`[AI Job Queue] No transcripts found for ${meetingId}. Marked as completed.`);
        this.finishCurrentJob();
        return;
      }

      // Update state to analyzing before Gemini API call
      analysis.status = 'analyzing';
      await analysis.save();

      // Call Gemini AI service
      const aiResult = await aiMeetingService.generateAnalysis(chunks);

      // Save output to MongoDB Atlas
      analysis.finalSummary = aiResult.summary;
      analysis.keyPoints = aiResult.keyPoints;
      analysis.decisions = aiResult.decisions;
      analysis.actionItems = aiResult.actionItems;
      analysis.sectionSummaries = aiResult.sectionSummaries;
      analysis.status = 'completed';
      analysis.errorMessage = '';
      await analysis.save();

      console.log(`[AI Job Queue] Successfully generated AI summary for meeting: ${meetingId}`);
    } catch (error) {
      console.error(`[AI Job Queue] Error processing meeting ${meetingId}:`, error);

      const isQuotaError = error.statusCode === 429 || 
                           error.message?.includes('quota') || 
                           error.message?.includes('429') ||
                           error.status === 429;

      const userErrMsg = isQuotaError
        ? 'AI is busy processing other meetings. Your summary will be ready shortly.'
        : (error.message || 'Failed to generate AI summary.');

      if (isQuotaError && currentJob.retryCount < 3) {
        // Retry quota errors with exponential backoff
        currentJob.retryCount += 1;
        console.log(`[AI Job Queue] 429 Rate limit encountered for ${meetingId}. Re-queuing retry #${currentJob.retryCount} in 5s...`);
        
        await MeetingAIAnalysis.findOneAndUpdate(
          { meetingId },
          { status: 'analyzing', errorMessage: userErrMsg }
        );

        setTimeout(() => {
          this.queue.push(currentJob);
        }, 5000);
      } else {
        await MeetingAIAnalysis.findOneAndUpdate(
          { meetingId },
          { status: 'failed', errorMessage: userErrMsg }
        );
      }
    } finally {
      this.finishCurrentJob();
    }
  }

  finishCurrentJob() {
    this.activeMeetingId = null;
    this.isProcessing = false;
    // Process next job if present
    setImmediate(() => this.processNext());
  }

  /**
   * Get current queue status for a meeting
   */
  getJobStatus(meetingId) {
    if (this.activeMeetingId === meetingId) return 'processing';
    const queuePosition = this.queue.findIndex(j => j.meetingId === meetingId);
    if (queuePosition !== -1) return `queued_position_${queuePosition + 1}`;
    return 'idle';
  }
}

// Singleton instance
module.exports = new AIJobQueue();
