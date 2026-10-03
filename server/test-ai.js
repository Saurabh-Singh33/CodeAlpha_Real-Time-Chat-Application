require('dotenv').config();
const aiMeetingService = require('./services/aiMeetingService');

async function main() {
  const chunks = [
    { chunkNumber: 1, startTime: 0, endTime: 300, transcript: "Hello everyone, let's discuss the new UI redesign. Alice, can you finish the mockup by tomorrow?" },
    { chunkNumber: 2, startTime: 300, endTime: 600, transcript: "Sure. We also decided to use TailwindCSS for styling." }
  ];

  try {
    const analysis = await aiMeetingService.generateAnalysis(chunks);
    console.log("Analysis success! Output:");
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error("Analysis failed:", error.message);
  }
}

main();
