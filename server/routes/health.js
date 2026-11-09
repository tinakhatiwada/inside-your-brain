export function healthRoute(req, res) {
  res.json({ ok: true, ai: !!process.env.ANTHROPIC_API_KEY, version: '2.0.0' });
}
