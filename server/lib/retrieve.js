// Small keyword retrieval over the reviewed content. The corpus is tiny, so a BM25-style
// score over structures and replays is fast, free and predictable.
import { STRUCTURES, REPLAYS, structureNotes } from './content.js';

const STOP = new Set('a an the and or but of to in on at for with is are was were be been it its this that i me my you your we our they them he she his her do does did why how what when where who which can could would should just so very really about into from than then there their as by if not no yes'.split(' '));

export function tokenize(text) {
  return String(text).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem);
}

function stem(w) {
  return w.replace(/(ing|ed|es|s|ly)$/, '') || w;
}

const docs = [
  ...STRUCTURES.map((s) => ({ kind: 'structure', id: s.id, text: structureNotes(s) + ' ' + s.name + ' ' + s.nickname })),
  ...REPLAYS.map((r) => ({
    kind: 'replay', id: r.id,
    text: [r.moment, r.question, r.summary, r.whyItFelt, ...r.beats.map((b) => b.title + ' ' + b.text)].join(' '),
  })),
].map((d) => {
  const toks = tokenize(d.text);
  const tf = new Map();
  toks.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
  return { ...d, tf, len: toks.length };
});

const avgLen = docs.reduce((a, d) => a + d.len, 0) / docs.length;
const df = new Map();
for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);

export function retrieve(query, { k = 4, kind } = {}) {
  const q = [...new Set(tokenize(query))];
  const N = docs.length;
  return docs
    .filter((d) => !kind || d.kind === kind)
    .map((d) => {
      let score = 0;
      for (const t of q) {
        const f = d.tf.get(t);
        if (!f) continue;
        const idf = Math.log(1 + (N - df.get(t) + 0.5) / (df.get(t) + 0.5));
        score += idf * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (d.len / avgLen))));
      }
      return { kind: d.kind, id: d.id, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
