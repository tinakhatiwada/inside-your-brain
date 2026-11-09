import { GoogleGenerativeAI } from '@google/generative-ai';

// All available flash models, ordered by preference
const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
];

export function getGenAI() {
  if (!process.env.GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/** Try each model until one works. Returns { model, result }. */
export async function generateWithFallback(genAI, request) {
  const primary = process.env.MODEL_REPLAY || 'gemini-3.5-flash';
  const models = [primary, ...FALLBACK_MODELS.filter(m => m !== primary)];
  const errors = [];

  for (const name of models) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent(request);
      return { modelUsed: name, result };
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('429') || msg.includes('404') || msg.includes('no longer')) {
        errors.push(name);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All AI models are busy right now. Please try again in a minute. Models tried: ' + errors.join(', '));
}

/** Try each model for streaming chat. Returns { modelUsed, stream }. */
export async function streamWithFallback(genAI, chatConfig, message) {
  const primary = process.env.MODEL_ASK || 'gemini-3.5-flash';
  const models = [primary, ...FALLBACK_MODELS.filter(m => m !== primary)];
  const errors = [];

  for (const name of models) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const chat = model.startChat(chatConfig);
      const result = await chat.sendMessageStream(message);
      return { modelUsed: name, stream: result.stream };
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('503') || msg.includes('high demand') || msg.includes('429') || msg.includes('404') || msg.includes('no longer')) {
        errors.push(name);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All AI models are busy right now. Please try again in a minute. Models tried: ' + errors.join(', '));
}

