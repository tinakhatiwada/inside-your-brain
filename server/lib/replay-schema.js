// The JSON shape the model must return for a replay, plus a validator/normaliser.
// The JSON schema is sent to the API (structured outputs), which guarantees the shape
// and that structure/chemical IDs come from our lists. Zod then enforces the limits the
// schema language can't express (lengths, counts) and we tidy anything slightly off.
import { z } from 'zod';
import { STRUCTURE_IDS, CHEMICAL_IDS } from './content.js';

export const replayJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['safety', 'message', 'question', 'summary', 'beats', 'whyItFelt', 'tryThis', 'finePrint'],
  properties: {
    safety: {
      type: 'string',
      enum: ['ok', 'support', 'off_topic'],
      description: 'ok = make a replay. support = the person may be at risk or describing harm; reply kindly and make no replay. off_topic = not a moment someone experienced.',
    },
    message: { type: 'string', description: 'Empty when safety is ok. Otherwise a short, kind message to show instead of a replay.' },
    question: { type: 'string', description: 'The moment rephrased as the question the person is really asking, starting with Why or How.' },
    summary: { type: 'string', description: 'One or two sentences answering the question in plain language.' },
    beats: {
      type: 'array',
      description: '3 to 6 steps in time order.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['time', 'title', 'structures', 'chemicals', 'text'],
        properties: {
          time: { type: 'string', description: 'Approximate time since the moment started, e.g. "0 s", "~200 ms", "minutes".' },
          title: { type: 'string', description: 'Two to five words.' },
          structures: { type: 'array', items: { type: 'string', enum: STRUCTURE_IDS }, description: '1 to 4 structure IDs most active in this step.' },
          chemicals: { type: 'array', items: { type: 'string', enum: CHEMICAL_IDS }, description: '0 to 2 chemicals, only if clearly relevant.' },
          text: { type: 'string', description: 'Two or three short sentences in second person, plain language.' },
        },
      },
    },
    whyItFelt: { type: 'string', description: 'A short paragraph on why the experience felt the way it did.' },
    tryThis: {
      type: 'array',
      description: '1 to 3 practical, safe suggestions.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'text'],
        properties: { title: { type: 'string' }, text: { type: 'string' } },
      },
    },
    finePrint: { type: 'array', items: { type: 'string' }, description: '1 to 3 honest caveats: what is simplified or uncertain.' },
  },
};

const ids = new Set(STRUCTURE_IDS);
const chems = new Set(CHEMICAL_IDS);
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const str = (n) => z.string().transform((s) => clip(s.trim(), n));

const beatSchema = z.object({
  time: str(40),
  title: str(60),
  structures: z.array(z.string()).transform((a) => [...new Set(a.map((x) => x.toLowerCase().trim()).filter((x) => ids.has(x)))].slice(0, 4)),
  chemicals: z.array(z.string()).transform((a) => [...new Set(a.map((x) => x.toLowerCase().trim()).filter((x) => chems.has(x)))].slice(0, 2)),
  text: str(600),
});

const raw = z.object({
  safety: z.string().transform((s) => s.toLowerCase().trim()).pipe(z.enum(['ok', 'support', 'off_topic'])),
  message: str(600),
  question: str(160),
  summary: str(400),
  beats: z.array(beatSchema),
  whyItFelt: str(900),
  tryThis: z.array(z.object({ title: str(80), text: str(400) })),
  finePrint: z.array(str(300)),
});

/**
 * Validate and tidy a model response.
 * Returns { ok: true, value } or { ok: false, reason }.
 */
export function normaliseReplay(input) {
  const parsed = raw.safeParse(input);
  if (!parsed.success) return { ok: false, reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  const r = parsed.data;
  if (r.safety !== 'ok') {
    return { ok: true, value: { safety: r.safety, message: r.message || defaultMessage(r.safety) } };
  }
  const beats = r.beats.filter((b) => b.structures.length && b.text).slice(0, 7);
  if (beats.length < 3) return { ok: false, reason: `only ${beats.length} usable steps (need at least 3)` };
  return {
    ok: true,
    value: {
      safety: 'ok',
      question: r.question,
      summary: r.summary,
      beats,
      whyItFelt: r.whyItFelt,
      tryThis: r.tryThis.filter((t) => t.title && t.text).slice(0, 3),
      finePrint: r.finePrint.filter(Boolean).slice(0, 3),
    },
  };
}

function defaultMessage(safety) {
  return safety === 'support'
    ? 'It sounds like you might be going through something hard. You don’t have to handle it alone. Please talk to someone you trust, or contact a local helpline or emergency service if you’re in danger.'
    : 'Describe a moment from your own life, like something you felt, noticed, forgot or did, and I’ll replay what your brain was doing.';
}
