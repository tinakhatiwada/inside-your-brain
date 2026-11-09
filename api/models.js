import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) return res.json({ ok: false, error: 'No key' });
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GEMINI_API_KEY);
    const data = await r.json();
    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''))
      .filter(m => m.includes('flash') || m.includes('pro'));
    return res.json({ ok: true, available: models });
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
}