// POST /api/ask  { messages, context, style }  ->  Server-Sent Events
//   { type: 'delta', text }   streamed answer text
//   { type: 'done', sources } the reviewed notes the answer was grounded on
//   { type: 'error', code, error }
import { z } from 'zod';
import { askSystemPrompt } from '../prompts/index.js';
import { HttpError, sendError, sse, upstreamError } from '../lib/http.js';
import { BY_ID, REPLAY_BY_ID, STRUCTURE_IDS, structureNotes } from '../lib/content.js';
import { retrieve } from '../lib/retrieve.js';

const num = z.number().finite().min(0).max(100000);

export function askRoute({ client, model, maxChars, maxTurns, maxTokens, mock }) {
  const body = z.object({
    messages: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().trim().min(1).max(4000),
    })).min(1).max(40),
    context: z.object({
      page: z.enum(['home', 'replay', 'explore', 'lab']).default('home'),
      structureId: z.enum(STRUCTURE_IDS).optional(),
      replayId: z.string().max(60).optional(),
      replay: z.object({
        question: z.string().max(200),
        structures: z.array(z.enum(STRUCTURE_IDS)).max(12),
      }).optional(),
      lab: z.object({
        reactionMs: num.optional(),
        stroopCostMs: num.optional(),
        stroopErrors: num.optional(),
        span: num.optional(),
      }).optional(),
    }).default({}),
    style: z.enum(['default', 'simpler', 'analogy', 'deeper', 'apply']).default('default'),
  });

  return async (req, res) => {
    const parsed = body.safeParse(req.body);
    if (!parsed.success) return sendError(res, new HttpError(400, 'INVALID_INPUT', 'That request was not in the expected format.'));
    const { context, style } = parsed.data;
    // Keep the last N turns, and make sure the conversation starts with the user and ends with a question.
    let messages = parsed.data.messages.slice(-maxTurns);
    while (messages.length && messages[0].role !== 'user') messages = messages.slice(1);
    const last = messages.at(-1);
    if (!last || last.role !== 'user') return sendError(res, new HttpError(400, 'INVALID_INPUT', 'Ask a question first.'));
    if (last.content.length > maxChars) return sendError(res, new HttpError(400, 'INVALID_INPUT', `Keep your question under ${maxChars} characters.`));

    // Ground the answer: what the person is looking at, plus the best keyword matches.
    const ids = new Set();
    if (context.structureId) ids.add(context.structureId);
    const preset = context.replayId && REPLAY_BY_ID[context.replayId];
    const replayStructures = preset ? preset.beats.flatMap((b) => b.structures) : context.replay?.structures || [];
    replayStructures.slice(0, 4).forEach((id) => ids.add(id));
    retrieve(last.content, { kind: 'structure', k: 3 }).forEach((r) => ids.add(r.id));
    const used = [...ids].slice(0, 6).map((id) => BY_ID[id]);
    const notes = used.map(structureNotes).join('\n\n');
    const contextLine = describeContext(context, preset);

    const out = sse(res);
    if (mock) return mockAnswer(used, out, res);
    if (!client) return sendError(res, new HttpError(503, 'AI_DISABLED', 'AI is not set up on this server.'));

    let stream = null;
    let clientGone = false;
    res.on('close', () => { if (!res.writableEnded) { clientGone = true; stream?.abort(); } });
    try {
      stream = client.messages.stream({
        model,
        max_tokens: style === 'deeper' ? Math.max(maxTokens, 900) : maxTokens,
        system: askSystemPrompt({ notes, contextLine, style }),
        messages,
      });
      stream.on('text', (text) => out.send({ type: 'delta', text }));
      await stream.finalMessage();
      out.send({ type: 'done', sources: used.map((s) => ({ id: s.id, name: s.name })) });
      res.end();
    } catch (err) {
      if (clientGone) return res.end();
      console.error('[ask]', err?.status || '', err?.message);
      sendError(res, upstreamError(err));
    }
  };
}

function describeContext(ctx, preset) {
  if (ctx.page === 'explore' && ctx.structureId) return `Looking at the ${BY_ID[ctx.structureId].name} in the 3D explorer.`;
  if (ctx.page === 'replay' && preset) return `Watching the replay “${preset.question}” (moment: “${preset.moment}”).`;
  if (ctx.page === 'replay' && ctx.replay) return `Watching an AI-generated replay titled “${ctx.replay.question}”.`;
  if (ctx.page === 'lab' && ctx.lab) {
    const l = ctx.lab;
    const parts = [];
    if (l.reactionMs) parts.push(`reaction time median ${Math.round(l.reactionMs)} ms (simple visual reaction times for adults are often around 200–300 ms)`);
    if (l.stroopCostMs !== undefined) parts.push(`Stroop cost ${Math.round(l.stroopCostMs)} ms slower on mismatched colour words${l.stroopErrors ? `, ${l.stroopErrors} errors` : ''} (a cost of roughly 50–150 ms is common)`);
    if (l.span) parts.push(`digit span ${l.span} (forward digit spans of about 5–8 are typical)`);
    return `Just did the Lab experiments in a web browser, so timings include some device lag. Their results: ${parts.join('; ')}. Never treat these as a diagnosis or a measure of intelligence.`;
  }
  return `On the ${ctx.page} page.`;
}

async function mockAnswer(used, out, res) {
  const s = used[0] || BY_ID['prefrontal'];
  const text = `(Demo mode: this is a canned answer, not the AI.)\n\n${s.oneLiner} ${s.explain[0]}\n\n${s.explain[1] || ''}`;
  for (const word of text.split(/(?<=\s)/)) {
    out.send({ type: 'delta', text: word });
    await new Promise((ok) => setTimeout(ok, 12));
  }
  out.send({ type: 'done', sources: used.map((x) => ({ id: x.id, name: x.name })) });
  res.end();
}
