const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const MeetingAIAnalysis = require('../models/MeetingAIAnalysis');
const TranscriptChunk = require('../models/TranscriptChunk');
const aiMeetingService = require('./aiMeetingService');

class AIJobQueue {
  constructor() {
    this.useRedis = false;
    this.bullQueue = null;
    this.bullWorker = null;

    // In-memory fallback queue for local environments without Redis running
    this.queue = [];
    this.isProcessing = false;
    this.activeMeetingId = null;

    this.initBullMQ();
  }

  initBullMQ() {
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisUrl = process.env.REDIS_URL;

    try {
      const opts = redisUrl
        ? { url: redisUrl, lazyConnect: true, maxRetriesPerRequest: null, retryStrategy: () => null }
        : { host: redisHost, port: redisPort, lazyConnect: true, maxRetriesPerRequest: null, retryStrategy: () => null };

      const connection = new Redis(opts);

      // Disable uncaught error handler spam
      connection.on('error', () => {
        this.useRedis = false;
      });

      connection.connect()
        .then(() => {
          console.log('[AI Job Queue] Connected to Redis. BullMQ active for job processing.');
          this.useRedis = true;

          const workerOpts = redisUrl ? { connection: new Redis(redisUrl, { maxRetriesPerRequest: null }) } : { connection: new Redis({ host: redisHost, port: redisPort, maxRetriesPerRequest: null }) };

          this.bullQueue = new Queue('ai-summary-queue', { connection });
          this.bullWorker = new Worker(
            'ai-summary-queue',
            async (job) => {
              await this.executeJob(job.data);
            },
            {
              ...workerOpts,
              concurrency: 1, // Process AI jobs one at a time to prevent quota exhaustion
              limiter: {
                max: 5,
                duration: 60000 // Max 5 jobs per minute
              }
            }
          );

          this.bullWorker.on('failed', (job, err) => {
            console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
          });
        })
        .catch(() => {
          this.useRedis = false;
          try {
            connection.disconnect();
          } catch (_e) {}
        });
    } catch (_err) {
      this.useRedis = false;
    }
  }

  /**
   * Add a meeting summary generation job to the queue
   * @param {Object} jobData { meetingId, duration, participantCount }
   */
  async addJob(jobData) {
    const { meetingId, duration = 0, participantCount = 1 } = jobData;

    // 1. Check if analysis is already completed in MongoDB Atlas cache
    let analysis = await MeetingAIAnalysis.findOne({ meetingId });
    if (analysis && analysis.status === 'completed') {
      return { success: true, analysis, cached: true };
    }

    // 2. Create or update analysis status to transcribing
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

    // 3. Queue job via BullMQ if Redis connected
    if (this.useRedis && this.bullQueue) {
      try {
        await this.bullQueue.add('process-summary', { meetingId, duration, participantCount }, {
          jobId: `meeting_${meetingId}`,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        });
        return { success: true, message: 'Summary job enqueued via BullMQ + Redis queue.', analysis };
      } catch (err) {
        console.warn('[AI Job Queue] BullMQ enqueue failed, falling back to in-memory queue:', err.message);
      }
    }

    // Fallback: In-memory rate-limited queue
    const isAlreadyQueued = this.queue.some(job => job.meetingId === meetingId);
    if (!isAlreadyQueued && this.activeMeetingId !== meetingId) {
      this.queue.push({ meetingId, duration, participantCount, retryCount: 0 });
      this.processNextInMemory();
    }

    return { success: true, message: 'Summary request added to job queue.', analysis };
  }

  /**
   * Core worker logic: fetches chunks, calls Gemini API, updates MongoDB Atlas
   */
  async executeJob(jobData) {
    const { meetingId } = jobData;
    console.log(`[AI Job Queue] Starting AI processing for meeting: ${meetingId}`);

    const analysis = await MeetingAIAnalysis.findOne({ meetingId });
    if (!analysis) return;

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
      return;
    }

    // Update state to analyzing before calling Gemini
    analysis.status = 'analyzing';
    await analysis.save();

    try {
      const aiResult = await aiMeetingService.generateAnalysis(chunks);

      // Save output permanently in MongoDB Atlas
      analysis.finalSummary = aiResult.summary;
      analysis.keyPoints = aiResult.keyPoints;
      analysis.decisions = aiResult.decisions;
      analysis.actionItems = aiResult.actionItems;
      analysis.sectionSummaries = aiResult.sectionSummaries;
      analysis.status = 'completed';
      analysis.errorMessage = '';
      await analysis.save();

      console.log(`[AI Job Queue] Successfully generated and cached AI summary for meeting: ${meetingId}`);
    } catch (error) {
      console.error(`[AI Job Queue] Error processing meeting ${meetingId}:`, error.message);

      const isQuotaError = error.statusCode === 429 || 
                           error.message?.includes('quota') || 
                           error.message?.includes('429') ||
                           error.status === 429;

      const userErrMsg = isQuotaError
        ? 'AI is busy processing other meetings. Your summary will be ready shortly.'
        : (error.message || 'Failed to generate AI summary.');

      await MeetingAIAnalysis.findOneAndUpdate(
        { meetingId },
        { status: 'failed', errorMessage: userErrMsg }
      );

      throw error;
    }
  }

  /**
   * Process in-memory queue fallback sequentially
   */
  async processNextInMemory() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const currentJob = this.queue.shift();
    this.activeMeetingId = currentJob.meetingId;

    try {
      await this.executeJob(currentJob);
    } catch (error) {
      const isQuotaError = error.statusCode === 429 || 
                           error.message?.includes('quota') || 
                           error.message?.includes('429');

      if (isQuotaError && currentJob.retryCount < 3) {
        currentJob.retryCount += 1;
        console.log(`[AI Job Queue Fallback] 429 Rate limit encountered for ${currentJob.meetingId}. Retrying #${currentJob.retryCount} in 5s...`);
        setTimeout(() => {
          this.queue.push(currentJob);
          this.isProcessing = false;
          this.processNextInMemory();
        }, 5000);
        return;
      }
    } finally {
      this.activeMeetingId = null;
      this.isProcessing = false;
      setImmediate(() => this.processNextInMemory());
    }
  }

  /**
   * Get job status for meeting
   */
  getJobStatus(meetingId) {
    if (this.activeMeetingId === meetingId) return 'processing';
    const queuePosition = this.queue.findIndex(j => j.meetingId === meetingId);
    if (queuePosition !== -1) return `queued_position_${queuePosition + 1}`;
    return 'idle';
  }
}

module.exports = new AIJobQueue();
