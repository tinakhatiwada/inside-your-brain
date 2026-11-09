// Share an AI replay without a database: the replay travels inside the link's #fragment,
// which browsers never send to the server. Compressed when the browser supports it.
import { BY_ID } from '../brain/anatomy.js';

const toB64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function encodeShare(replay) {
  const { safety, generated, demo, moment, question, summary, beats, whyItFelt, tryThis, finePrint } = replay;
  const bytes = new TextEncoder().encode(JSON.stringify({ v: 1, generated: true, demo, moment, question, summary, beats, whyItFelt, tryThis, finePrint }));
  if (typeof CompressionStream === 'function') return 'z' + toB64(await pipe(bytes, new CompressionStream('deflate-raw')));
  return 'j' + toB64(bytes);
}

export async function decodeShare(s) {
  try {
    const kind = s[0];
    let bytes = fromB64(decodeURIComponent(s.slice(1)));
    if (kind === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    const r = JSON.parse(new TextDecoder().decode(bytes));
    if (!r || !Array.isArray(r.beats) || !r.question) return null;
    // Shared links are untrusted: keep only what we render, as strings.
    const str = (x, n = 600) => String(x ?? '').slice(0, n);
    const out = {
      generated: true,
      demo: !!r.demo,
      moment: str(r.moment, 600),
      question: str(r.question, 160),
      summary: str(r.summary, 400),
      beats: r.beats.slice(0, 7).map((b) => ({
        time: str(b.time, 40), title: str(b.title, 60), text: str(b.text),
        structures: (b.structures || []).map(String).filter((id) => BY_ID[id]).slice(0, 4),
        chemicals: (b.chemicals || []).map(String).slice(0, 2),
      })).filter((b) => b.structures.length),
      whyItFelt: str(r.whyItFelt, 900),
      tryThis: (r.tryThis || []).slice(0, 3).map((t) => ({ title: str(t.title, 80), text: str(t.text, 400) })),
      finePrint: (r.finePrint || []).slice(0, 3).map((f) => str(f, 300)),
    };
    return out.beats.length ? out : null;
  } catch {
    return null;
  }
}
