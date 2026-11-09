// Vercel Serverless Function: /api/health
import { PROMPT_VERSION } from '../server/prompts/index.js';

export default function handler(req, res) {
  const aiOn = Boolean(process.env.GEMINI_API_KEY) || process.env.MOCK_AI === 'true';
  res.json({ ok: true, ai: aiOn, demo: process.env.MOCK_AI === 'true', prompts: PROMPT_VERSION });
}
