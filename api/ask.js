// Vercel Serverless Function: /api/ask
import { getGenAI, streamWithFallback } from './lib/gemini.js';
import { askSystemPrompt } from '../server/prompts/index.js';
import { BY_ID, REPLAY_BY_ID, STRUCTURE_IDS, structureNotes } from '../server/lib/content.js';
import { retrieve } from '../server/lib/retrieve.js';

const maxChars = Number(process.env.MAX_INPUT_CHARS || 600);
const maxTurns = Number(process.env.MAX_TURNS || 12);
const maxTokens = Number(process.env.MAX_OUTPUT_TOKENS || 700);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only', code: 'METHOD_NOT_ALLOWED' });

  const { messages: rawMessages, context = {}, style = 'default' } = req.body || {};
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return res.status(400).json({ error: 'Ask a question first.', code: 'INVALID_INPUT' });
  }

  let messages = rawMessages.slice(-maxTurns);
  while (messages.length && messages[0].role !== 'user') messages = messages.slice(1);
  const last = messages.at(-1);
  if (!last || last.role !== 'user') return res.status(400).json({ error: 'Ask a question first.', code: 'INVALID_INPUT' });
  if (last.content.length > maxChars) return res.status(400).json({ error: `Keep your question under ${maxChars} characters.`, code: 'INVALID_INPUT' });

  // Ground the answer
  const ids = new Set();
  if (context.structureId && BY_ID[context.structureId]) ids.add(context.structureId);
  const preset = context.replayId && REPLAY_BY_ID[context.replayId];
  const replayStructures = preset ? preset.beats.flatMap((b) => b.structures) : context.replay?.structures || [];
  replayStructures.slice(0, 4).forEach((id) => ids.add(id));
  retrieve(last.content, { kind: 'structure', k: 3 }).forEach((r) => ids.add(r.id));
  const used = [...ids].slice(0, 6).map((id) => BY_ID[id]).filter(Boolean);
  const notes = used.map(structureNotes).join('\n\n');
  const contextLine = describeContext(context, preset);

  // Mock mode
  if (process.env.MOCK_AI === 'true') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    const s = used[0] || BY_ID['prefrontal'];
    const text = `(Demo mode) ${s.oneLiner} ${s.explain[0]}`;
    send({ type: 'delta', text });
    send({ type: 'done', sources: used.map((x) => ({ id: x.id, name: x.name })) });
    return res.end();
  }

  const genAI = getGenAI();
  if (!genAI) return res.status(503).json({ error: 'AI is not set up on this server.', code: 'AI_DISABLED' });

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const geminiHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const { stream } = await streamWithFallback(genAI, {
      history: geminiHistory,
      systemInstruction: { parts: [{ text: askSystemPrompt({ notes, contextLine, style }) }] },
      generationConfig: {
        maxOutputTokens: style === 'deeper' ? Math.max(maxTokens, 900) : maxTokens,
      },
    }, last.content);

    for await (const chunk of stream) {
      const text = chunk.text();
      if (text) send({ type: 'delta', text });
    }
    send({ type: 'done', sources: used.map((s) => ({ id: s.id, name: s.name })) });
    res.end();
  } catch (err) {
    console.error('[ask]', err.message);
    send({ type: 'error', code: 'UPSTREAM_ERROR', error: err.message });
    res.end();
  }
}

function describeContext(ctx, preset) {
  if (ctx.page === 'explore' && ctx.structureId && BY_ID[ctx.structureId]) return `Looking at the ${BY_ID[ctx.structureId].name} in the 3D explorer.`;
  if (ctx.page === 'replay' && preset) return `Watching the replay "${preset.question}".`;
  if (ctx.page === 'replay' && ctx.replay) return `Watching an AI-generated replay titled "${ctx.replay.question}".`;
  if (ctx.page === 'lab' && ctx.lab) {
    const l = ctx.lab;
    const parts = [];
    if (l.reactionMs) parts.push(`reaction time ${Math.round(l.reactionMs)} ms`);
    if (l.stroopCostMs !== undefined) parts.push(`Stroop cost ${Math.round(l.stroopCostMs)} ms`);
    if (l.span) parts.push(`digit span ${l.span}`);
    return `Lab results: ${parts.join('; ')}.`;
  }
  return `On the ${ctx.page || 'home'} page.`;
}
