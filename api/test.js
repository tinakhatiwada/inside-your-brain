import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash'];

export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ ok: false, error: 'No GEMINI_API_KEY set' });
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const errors = [];
  for (const name of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent('Say hello in one word.');
      const text = result.response.text();
      return res.json({ ok: true, model: name, response: text, node: process.version });
    } catch (err) {
      errors.push({ model: name, error: err.message.slice(0, 200) });
    }
  }
  return res.json({ ok: false, errors, node: process.version });
}