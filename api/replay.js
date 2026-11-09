// Vercel Serverless Function: /api/replay
import { GoogleGenerativeAI } from '@google/generative-ai';
import { replaySystemPrompt } from '../server/prompts/index.js';
import { replayJsonSchema, normaliseReplay } from '../server/lib/replay-schema.js';
import { REPLAYS } from '../server/lib/content.js';
import { retrieve } from '../server/lib/retrieve.js';

const same = (a, b) => a.toLowerCase().replace(/[^a-z]/g, '') === b.toLowerCase().replace(/[^a-z]/g, '');
const maxChars = Number(process.env.MAX_INPUT_CHARS || 600);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only', code: 'METHOD_NOT_ALLOWED' });

  const { moment } = req.body || {};
  if (!moment || typeof moment !== 'string' || moment.trim().length < 3) {
    return res.status(400).json({ error: 'Describe your moment in a few more words.', code: 'INVALID_INPUT' });
  }
  if (moment.length > maxChars) {
    return res.status(400).json({ error: `Keep it under ${maxChars} characters.`, code: 'INVALID_INPUT' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Check for hand-written replay first
  const preset = REPLAYS.find((r) => same(r.moment, moment.trim()));
  if (preset) {
    send({ type: 'done', replay: { safety: 'ok', presetId: preset.id, ...preset } });
    return res.end();
  }

  // Mock mode
  if (process.env.MOCK_AI === 'true') {
    if (/suicid|kill myself|self.?harm|hurt myself|end my life|want to die/i.test(moment)) {
      send({ type: 'done', replay: { safety: 'support', message: '(Demo mode) It sounds like you\'re going through something really hard. Please reach out to someone you trust.' } });
      return res.end();
    }
    const best = retrieve(moment, { kind: 'replay', k: 1 })[0];
    const r = REPLAYS.find((x) => x.id === best?.id) || REPLAYS[0];
    for (let i = 1; i <= r.beats.length; i++) {
      await new Promise((ok) => setTimeout(ok, 250));
      send({ type: 'progress', steps: i });
    }
    const { id, order, sources, ...rest } = r;
    send({ type: 'done', replay: { safety: 'ok', ...rest, moment: moment.trim(), generated: true, demo: true } });
    return res.end();
  }

  // Real AI
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI is not set up on this server.', code: 'AI_DISABLED' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.MODEL_REPLAY || 'gemini-3.5-flash' });

    let lastReason = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      const retryNote = attempt ? `\n\nYour previous answer could not be used (${lastReason}). Return a complete replay that follows every rule.` : '';

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `The person's moment:\n<moment>\n${moment.trim()}\n</moment>${retryNote}` }] }],
        systemInstruction: { parts: [{ text: replaySystemPrompt }] },
        generationConfig: {
          maxOutputTokens: 3000,
          responseMimeType: 'application/json',
          responseSchema: replayJsonSchema,
        },
      });

      const text = result.response.text();
      const stepCount = (text.match(/"structures"/g) || []).length;
      if (stepCount) send({ type: 'progress', steps: stepCount });

      let json;
      try { json = JSON.parse(text); } catch { lastReason = 'not valid JSON'; continue; }
      const validated = normaliseReplay(json);
      if (validated.ok) {
        send({ type: 'done', replay: { ...validated.value, moment: moment.trim(), generated: true } });
        return res.end();
      }
      lastReason = validated.reason;
    }
    send({ type: 'error', code: 'UPSTREAM_ERROR', error: 'The AI\'s replay didn\'t pass our checks. Try again or rephrase your moment.' });
    res.end();
  } catch (err) {
    console.error('[replay]', err?.message);
    send({ type: 'error', code: 'UPSTREAM_ERROR', error: 'The AI could not finish this request. Try again.' });
    res.end();
  }
}

