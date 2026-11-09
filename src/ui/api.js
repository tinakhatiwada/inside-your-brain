// Talking to the API server.

let healthPromise = null;

/** Is AI available? Resolves to { ai, demo } and never rejects. */
export function health() {
  if (healthPromise) return healthPromise;
  if (import.meta.env.VITE_AI_ENABLED === 'false') return (healthPromise = Promise.resolve({ ai: false, demo: false }));
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 4000);
  healthPromise = fetch('/api/health', { signal: ctl.signal })
    .then((r) => (r.ok ? r.json() : { ai: false }))
    .then((d) => ({ ai: !!d.ai, demo: !!d.demo }))
    .catch(() => ({ ai: false, demo: false }))
    .finally(() => clearTimeout(timer));
  return healthPromise;
}

/**
 * POST JSON and read a Server-Sent Events response.
 * onEvent is called with each parsed `data:` object. Resolves when the stream ends.
 */
export async function streamPost(url, body, onEvent, signal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  const type = res.headers.get('content-type') || '';
  if (!type.includes('text/event-stream')) {
    let data = {};
    try { data = await res.json(); } catch { /* not JSON */ }
    onEvent({ type: 'error', code: data.code || `HTTP_${res.status}`, error: data.error || messageFor(res.status) });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue;
        try { onEvent(JSON.parse(line.slice(5))); } catch { /* ignore a malformed line */ }
      }
    }
  }
}

function messageFor(status) {
  if (status === 429) return 'Too many requests. Wait a minute and try again.';
  if (status >= 500) return 'The server had a problem. Try again in a moment.';
  return 'Something went wrong. Try again.';
}
