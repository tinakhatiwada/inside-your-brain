import { GoogleGenerativeAI } from '@google/generative-ai';

const MODELS = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];

export default async function handler(req, res) {
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ ok: false, error: 'No GEMINI_API_KEY set' });
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  for (const name of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const result = await model.generateContent('Say hello in one word.');
      const text = result.response.text();
      return res.json({ ok: true, model: name, response: text, node: process.version });
    } catch (err) {
      if (name === MODELS.at(-1)) return res.json({ ok: false, error: err.message, triedModels: MODELS, node: process.version });
    }
  }
}