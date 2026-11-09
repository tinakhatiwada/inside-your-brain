import express from 'express';
import cors from 'cors';
import { healthRoute } from './routes/health.js';
var app = express();
var PORT = process.env.PORT || 8787;
var ALLOWED = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({ origin: ALLOWED }));
app.use(express.json({ limit: '10kb' }));
app.get('/api/health', healthRoute);
app.post('/api/tutor', function(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI not configured', code: 'AI_DISABLED' });
  res.json({ message: 'Tutor endpoint coming in v2.0' });
});
app.post('/api/trace', function(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI not configured', code: 'AI_DISABLED' });
  res.json({ message: 'Trace endpoint coming in v2.0' });
});
app.post('/api/quiz', function(req, res) {
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'AI not configured', code: 'AI_DISABLED' });
  res.json({ message: 'Quiz endpoint coming in v2.0' });
});
app.listen(PORT, function() {
  console.log('API server on http://localhost:' + PORT);
  console.log('AI: ' + (process.env.ANTHROPIC_API_KEY ? 'enabled' : 'disabled'));
});
