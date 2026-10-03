const geminiProvider = require('./geminiProvider');
const openrouterProvider = require('./openrouterProvider');

class AIProviderFactory {
  getProvider() {
    const providerStr = process.env.AI_PROVIDER || 'openrouter';
    if (providerStr.toLowerCase() === 'gemini') {
      return geminiProvider;
    }
    return openrouterProvider;
  }
}

module.exports = new AIProviderFactory();
