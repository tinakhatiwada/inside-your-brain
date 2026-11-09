// Inside Your Brain: API server (and, in production, the static site too).
import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { replayRoute } from './routes/replay.js';
import { askRoute } from './routes/ask.js';
import { rateLimit } from './lib/http.js';
import { PROMPT_VERSION } from './prompts/index.js';

const env = process.env;
const config = {
  port: Number(env.PORT || 8787),
  modelReplay: env.MODEL_REPLAY || 'claude-sonnet-5-5',
  modelAsk: env.MODEL_ASK || 'claude-haiku-5-5',
  ratePerMin: Number(env.RATE_LIMIT_PER_MIN || 20),
  maxChars: Number(env.MAX_INPUT_CHARS || 600),
  maxTurns: Number(env.MAX_TURNS || 12),
  maxTokens: Number(env.MAX_OUTPUT_TOKENS || 700),
  mock: env.MOCK_AI === 'true',
  allowedOrigins: (env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean),
};

const client = env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const aiOn = Boolean(client) || config.mock;

const app = express();
app.disable('x-powered-by');
if (env.TRUST_PROXY && env.TRUST_PROXY !== 'false') app.set('trust proxy', Number(env.TRUST_PROXY) || env.TRUST_PROXY);
app.use(express.json({ limit: '32kb' }));

// Cross-origin calls are only needed if the site and API live on different domains.
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && config.allowedOrigins.includes(origin)) {
    res.set({ 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ai: aiOn, demo: config.mock, prompts: PROMPT_VERSION });
});

const limit = rateLimit({ perMinute: config.ratePerMin });
app.post('/api/replay', limit, replayRoute({ client, model: config.modelReplay, maxChars: config.maxChars, mock: config.mock }));
app.post('/api/ask', limit, askRoute({ client, model: config.modelAsk, maxChars: config.maxChars, maxTurns: config.maxTurns, maxTokens: config.maxTokens, mock: config.mock }));
app.use('/api', (req, res) => res.status(404).json({ error: 'No such API route.', code: 'NOT_FOUND' }));

// Old v1/v2 URLs keep working.
const moved = { '/brain.html': '/', '/thoughts.html': '/replay.html', '/journey.html': '/replay.html', '/departments.html': '/explore.html', '/library.html': '/explore.html', '/quiz.html': '/lab.html' };
for (const [from, to] of Object.entries(moved)) app.get(from, (req, res) => res.redirect(301, to));

// Production: serve the built site from the same process.
const dist = join(import.meta.dirname, '..', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { extensions: ['html'], maxAge: '1h', setHeaders: (res, p) => { if (p.includes('/assets/')) res.set('Cache-Control', 'public, max-age=31536000, immutable'); } }));
  app.use((req, res) => res.status(404).sendFile(join(dist, 'index.html')));
}

app.listen(config.port, () => {
  console.log(`Inside Your Brain API on http://localhost:${config.port}`);
  console.log(config.mock ? 'AI: demo mode (canned answers, no API calls)' : client ? `AI: on (replay ${config.modelReplay}, ask ${config.modelAsk})` : 'AI: off. Add ANTHROPIC_API_KEY to .env to turn it on.');
});
