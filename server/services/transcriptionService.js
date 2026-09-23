const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Transcription Service Abstraction
 * Handles Speech-to-Text conversion for audio chunks.
 * Pluggable architecture allowing swap of transcription engines (Gemini multimodal audio STT, Whisper, Deepgram, etc.)
 */
class TranscriptionService {
  constructor() {
    this.apiKey = process.env.TRANSCRIPTION_API_KEY || process.env.GEMINI_API_KEY;
  }

  /**
   * Transcribes an audio chunk buffer or processes raw text
   * @param {Object} params
   * @param {Buffer} [params.audioBuffer] - Raw binary audio chunk
   * @param {string} [params.mimeType] - Audio mime type (e.g. 'audio/webm', 'audio/wav')
   * @param {string} [params.textTranscript] - Direct text fallback if available
   * @param {number} params.chunkNumber - Index of the chunk
   * @returns {Promise<string>} Transcribed text string
   */
  async transcribeChunk({ audioBuffer, mimeType = 'audio/webm', textTranscript }) {
    // If raw transcript text was directly submitted (e.g. Web Speech API client fallback)
    if (textTranscript && textTranscript.trim()) {
      return textTranscript.trim();
    }

    if (!audioBuffer) {
      throw new Error('No audio buffer or text transcript provided to transcriptionService');
    }

    const apiKey = process.env.TRANSCRIPTION_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[TranscriptionService] No API key set. Returning fallback transcript marker.');
      return `[Chunk Audio Recording received - Transcription API Key pending]`;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Use standard Gemini flash model capable of audio processing
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });

      const audioPart = {
        inlineData: {
          mimeType: mimeType.split(';')[0], // Extract clean mime type e.g. audio/webm
          data: audioBuffer.toString('base64')
        }
      };

      const prompt = `Transcribe the audio accurately into clear text. 
If speaker names or identifiers are spoken in the meeting, include them like "Name: spoken content". 
Do not add metadata, summary, or introductory text. Return ONLY the transcribed text.`;

      const result = await model.generateContent([audioPart, prompt]);
      const response = await result.response;
      const transcriptText = response.text().trim();

      return transcriptText || '[Silence or un-transcribeable audio segment]';
    } catch (error) {
      console.error('[TranscriptionService] Error transcribing audio chunk:', error.message);
      
      // Handle rate limits or quota errors explicitly
      if (error.status === 429 || (error.message && error.message.includes('429'))) {
        const quotaErr = new Error('AI transcription rate limit reached. Please try again later.');
        quotaErr.statusCode = 429;
        throw quotaErr;
      }
      
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }
}

module.exports = new TranscriptionService();
