require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  console.log('Testing Gemini API...');
  const key = process.env.GEMINI_API_KEY || process.env.TRANSCRIPTION_API_KEY;
  if (!key) {
    console.log('No Gemini API key found (tried GEMINI_API_KEY and TRANSCRIPTION_API_KEY)');
    return;
  }
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const result = await model.generateContent('Say "pong" and nothing else');
    console.log('Gemini success! Response:', await result.response.text());
  } catch (err) {
    console.error('Gemini error:', err.message);
  }
}

async function testOpenRouter() {
  console.log('Testing OpenRouter API...');
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || key === 'sk-or-v1-testkey') {
    console.log('No valid OpenRouter API key found. Found: ' + key);
    return;
  }
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: 'Say "pong" and nothing else' }]
      })
    });
    const data = await response.json();
    if (data.error) {
      console.error('OpenRouter error:', data.error.message);
    } else {
      console.log('OpenRouter success! Response:', data.choices[0].message.content);
    }
  } catch (err) {
    console.error('OpenRouter error:', err.message);
  }
}

async function main() {
  await testGemini();
  console.log('-----------------');
  await testOpenRouter();
}

main();
