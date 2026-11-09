// POST /api/replay  { moment }  ->  Server-Sent Events
//   { type: 'progress', steps }   while the model writes (steps drafted so far)
//   { type: 'done', replay }      a validated replay, or { safety: 'support' | 'off_topic', message }
//   { type: 'error', code, error }
import { z } from 'zod';
import { replaySystemPrompt } from '../prompts/index.js';
import { replayJsonSchema, normaliseReplay } from '../lib/replay-schema.js';
import { HttpError, sendError, sse, upstreamError } from '../lib/http.js';
import { REPLAYS } from '../lib/content.js';
import { retrieve } from '../lib/retrieve.js';

const same = (a, b) => a.toLowerCase().replace(/[^a-z]/g, '') === b.toLowerCase().replace(/[^a-z]/g, '');

export function replayRoute({ model, maxChars, mock }) {
  const body = z.object({ moment: z.string().trim().min(3, 'Describe your moment in a few more words.').max(maxChars, `Keep it under ${maxChars} characters.`) });

  return async (req, res) => {
    const parsed = body.safeParse(req.body);
    if (!parsed.success) return sendError(res, new HttpError(400, 'INVALID_INPUT', parsed.error.issues[0].message));
    const moment = parsed.data.moment;

    // A hand-written replay beats a generated one, and costs nothing.
    const preset = REPLAYS.find((r) => same(r.moment, moment));
    const out = sse(res);
    if (preset) {
      out.send({ type: 'done', replay: { safety: 'ok', presetId: preset.id, ...preset } });
      return res.end();
    }
    if (mock) return mockReplay(moment, out, res);
    if (!model) return sendError(res, new HttpError(503, 'AI_DISABLED', 'AI is not set up on this server.'));

    let clientGone = false;
    res.on('close', () => { if (!res.writableEnded) clientGone = true; });

    let lastReason = '';
    try {
      for (let attempt = 0; attempt < 2 && !clientGone; attempt++) {
        const retryNote = attempt ? `\n\nYour previous answer could not be used (${lastReason}). Return a complete replay that follows every rule.` : '';

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `The person's moment:\n<moment>\n${moment}\n</moment>${retryNote}` }] }],
          systemInstruction: { parts: [{ text: replaySystemPrompt }] },
          generationConfig: {
            maxOutputTokens: 3000,
            responseMimeType: 'application/json',
            responseSchema: replayJsonSchema,
          },
        });

        const text = result.response.text();
        // Send progress based on structure mentions
        const stepCount = (text.match(/"structures"/g) || []).length;
        if (stepCount) out.send({ type: 'progress', steps: stepCount });

        let json;
        try { json = JSON.parse(text); } catch { lastReason = 'it was not valid JSON'; continue; }
        const validated = normaliseReplay(json);
        if (validated.ok) {
          out.send({ type: 'done', replay: { ...validated.value, moment, generated: true } });
          return res.end();
        }
        lastReason = validated.reason;
      }
      if (!clientGone) sendError(res, new HttpError(502, 'UPSTREAM_ERROR', 'The AI\'s replay didn\'t pass our checks. Try again or rephrase your moment.'));
    } catch (err) {
      if (clientGone) return res.end();
      console.error('[replay]', err?.status || '', err?.message);
      sendError(res, upstreamError(err));
    }
  };
}

// Demo mode (MOCK_AI=true): answers with the closest hand-written replay so the whole
// flow can be tried without an API key.
async function mockReplay(moment, out, res) {
  if (/suicid|kill myself|self.?harm|hurt myself|end my life|want to die/i.test(moment)) {
    out.send({ type: 'done', replay: { safety: 'support', message: '(Demo mode) It sounds like you\'re going through something really hard. You don\'t have to deal with it alone. Please reach out to someone you trust.' } });
    return res.end();
  }
  const best = retrieve(moment, { kind: 'replay', k: 1 })[0];
  const r = REPLAYS.find((x) => x.id === best?.id) || REPLAYS[0];
  for (let i = 1; i <= r.beats.length; i++) {
    await new Promise((ok) => setTimeout(ok, 250));
    out.send({ type: 'progress', steps: i });
  }
  const { id, order, sources, ...rest } = r;
  out.send({ type: 'done', replay: { safety: 'ok', ...rest, moment, generated: true, demo: true } });
  res.end();
}
