const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Meeting Service Abstraction
 * Configured to use Google Gemini API to analyze transcript chunks and synthesize
 * structured meeting notes, section summaries, key points, decisions, and action items.
 */
class AIMeetingService {
  constructor() {
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const err = new Error('GEMINI_API_KEY is not configured in environment variables');
      err.statusCode = 500;
      throw err;
    }
    return new GoogleGenerativeAI(apiKey);
  }

  /**
   * Group 5-minute transcript chunks into 20-minute section blocks (configurable via env)
   * @param {Array} chunks - Array of TranscriptChunk documents
   * @returns {Array} Array of grouped section objects
   */
  groupChunksIntoSections(chunks) {
    const summaryWindowMinutes = parseInt(process.env.AI_SUMMARY_CHUNK_MINUTES || '20', 10);
    const chunkWindowMinutes = parseInt(process.env.TRANSCRIPTION_CHUNK_MINUTES || '5', 10);
    
    // Number of 5-min chunks per section (e.g. 20 / 5 = 4 chunks per section)
    const chunksPerSection = Math.max(1, Math.floor(summaryWindowMinutes / chunkWindowMinutes));
    
    const sections = [];
    for (let i = 0; i < chunks.length; i += chunksPerSection) {
      const group = chunks.slice(i, i + chunksPerSection);
      const startSec = group[0].startTime || (i * chunkWindowMinutes * 60);
      const endSec = group[group.length - 1].endTime || ((i + group.length) * chunkWindowMinutes * 60);
      
      const combinedText = group
        .map(c => `[Chunk ${c.chunkNumber} | ${this.formatTimestamp(c.startTime)} - ${this.formatTimestamp(c.endTime)}]: ${c.transcript}`)
        .join('\n\n');

      sections.push({
        sectionIndex: sections.length + 1,
        timeRange: `${this.formatTimestamp(startSec)} - ${this.formatTimestamp(endSec)}`,
        transcriptText: combinedText,
        chunkCount: group.length
      });
    }

    return sections;
  }

  formatTimestamp(totalSeconds) {
    if (typeof totalSeconds !== 'number' || isNaN(totalSeconds)) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Analyzes grouped sections and generates a comprehensive structured JSON meeting analysis
   * @param {Array} chunks - Array of sorted TranscriptChunk documents
   * @returns {Promise<Object>} Structured JSON matching MeetingAIAnalysis schema
   */
  async generateAnalysis(chunks) {
    if (!chunks || chunks.length === 0) {
      return {
        summary: 'No transcripts were recorded for this meeting.',
        keyPoints: [],
        decisions: [],
        actionItems: [],
        sectionSummaries: []
      };
    }

    const sections = this.groupChunksIntoSections(chunks);
    const fullTranscript = chunks
      .map(c => `[Chunk #${c.chunkNumber} (${this.formatTimestamp(c.startTime)} - ${this.formatTimestamp(c.endTime)})]\n${c.transcript}`)
      .join('\n\n');

    const prompt = `You are an expert executive AI Meeting Assistant for VartaConnect.
Analyze the following meeting transcript and produce a high quality, structured meeting summary in JSON format.

CRITICAL RULES:
1. Return ONLY a valid JSON object matching the JSON schema below. No markdown wrapping (do not use \`\`\`json wrappers), no explanatory text outside the JSON.
2. For action items, do NOT invent person names if the transcript does not explicitly identify them. Use "Unassigned" if unclear or unknown.
3. Keep the summary concise, objective, and professional.

JSON SCHEMA:
{
  "summary": "Short 2-4 sentence executive meeting summary.",
  "keyPoints": [
    "Key discussion point 1",
    "Key discussion point 2"
  ],
  "decisions": [
    "Decision reached 1",
    "Decision reached 2"
  ],
  "actionItems": [
    {
      "person": "Name or Unassigned",
      "task": "Description of assigned task",
      "deadline": "Target deadline or N/A",
      "timestamp": "HH:MM:SS"
    }
  ],
  "sectionSummaries": [
    {
      "sectionIndex": 1,
      "title": "Short title describing this section",
      "timeRange": "00:00:00 - 00:20:00",
      "summary": "Summary of this 20-minute section"
    }
  ]
}

TRANSCRIPT DATA:
Total Chunks: ${chunks.length}
Grouped Sections: ${sections.length}

${fullTranscript}`;

    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text().trim();

      // Clean markdown code blocks if returned
      const cleanJsonStr = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      const parsedData = JSON.parse(cleanJsonStr);

      // Validate structure & set defaults
      return {
        summary: parsedData.summary || 'Summary unavailable.',
        keyPoints: Array.isArray(parsedData.keyPoints) ? parsedData.keyPoints : [],
        decisions: Array.isArray(parsedData.decisions) ? parsedData.decisions : [],
        actionItems: Array.isArray(parsedData.actionItems) ? parsedData.actionItems.map(item => ({
          person: item.person || 'Unassigned',
          task: item.task || '',
          deadline: item.deadline || 'N/A',
          timestamp: item.timestamp || '00:00:00'
        })) : [],
        sectionSummaries: Array.isArray(parsedData.sectionSummaries) ? parsedData.sectionSummaries : []
      };
    } catch (error) {
      console.error('[AIMeetingService] Error generating meeting analysis:', error);

      if (error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('quota'))) {
        const quotaError = new Error('AI quota reached. Please try again later.');
        quotaError.statusCode = 429;
        throw quotaError;
      }

      throw new Error(`AI Meeting Analysis failed: ${error.message}`);
    }
  }
}

module.exports = new AIMeetingService();
