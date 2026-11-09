import { getGenAI, generateWithFallback } from './lib/gemini.js';

export default async function handler(req, res) {
  const genAI = getGenAI();
  if (!genAI) return res.json({ ok: false, error: 'No GEMINI_API_KEY set' });
  try {
    const { modelUsed, result } = await generateWithFallback(genAI, {
      contents: [{ role: 'user', parts: [{ text: 'Say hello in one word.' }] }],
    });
    return res.json({ ok: true, model: modelUsed, response: result.response.text() });
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
}
