// Small HTTP helpers: errors, Server-Sent Events and a per-IP rate limiter.

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function sendError(res, err) {
  const status = err.status || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = err.status ? err.message : 'Something went wrong on the server.';
  if (res.headersSent) {
    sse(res).send({ type: 'error', code, error: message });
    return res.end();
  }
  res.status(status).json({ error: message, code });
}

export function sse(res) {
  if (!res.headersSent) {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
  }
  return { send: (data) => res.write(`data: ${JSON.stringify(data)}\n\n`) };
}

/** Fixed-window limiter. In-memory, so use your host's limiter if you run many instances. */
export function rateLimit({ perMinute = 20 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start > 60_000) hits.delete(k);
  }, 60_000).unref();
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    let h = hits.get(key);
    if (!h || now - h.start > 60_000) { h = { start: now, n: 0 }; hits.set(key, h); }
    h.n++;
    if (h.n > perMinute) {
      res.set('Retry-After', String(Math.ceil((h.start + 60_000 - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Wait a minute and try again.', code: 'RATE_LIMITED' });
    }
    next();
  };
}

/** Map Gemini SDK errors to something safe to show. */
export function upstreamError(err) {
  const status = err?.status || err?.httpStatusCode;
  const msg = err?.message || '';
  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED')) return new HttpError(503, 'BUSY', 'The AI is busy right now. Try again in a moment.');
  if (status === 401 || status === 403 || msg.includes('API_KEY_INVALID')) return new HttpError(503, 'AI_MISCONFIGURED', 'The AI key on the server was rejected. Check GEMINI_API_KEY.');
  if (status === 404 || msg.includes('not found')) return new HttpError(503, 'AI_MISCONFIGURED', 'The AI model name on the server was not found. Check MODEL_REPLAY and MODEL_ASK.');
  return new HttpError(502, 'UPSTREAM_ERROR', 'The AI could not finish this request. Try again.');
}
