// Vercel Serverless Function: /api/test — quick check that Gemini works
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ ok: false, error: 'No GEMINI_API_KEY set' });
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.MODEL_ASK || 'gemini-2.0-flash' });
    const result = await model.generateContent('Say hello in one word.');
    const text = result.response.text();
    return res.json({ ok: true, response: text, node: process.version });
  } catch (err) {
    return res.json({ ok: false, error: err.message, node: process.version });
  }
}
