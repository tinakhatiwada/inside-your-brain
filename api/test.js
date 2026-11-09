import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) return res.json({ ok: false, error: 'No GEMINI_API_KEY set' });
  const model_name = process.env.MODEL_ASK || 'gemini-3.5-flash';
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: model_name });
    const result = await model.generateContent('Say hello in one word.');
    return res.json({ ok: true, model: model_name, response: result.response.text() });
  } catch (err) {
    return res.json({ ok: false, model: model_name, error: err.message });
  }
}