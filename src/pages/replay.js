import { aiReady } from '../ui/shell.js';
import { h, $, structureChip, chemicalChip, dotsFor, storage } from '../ui/dom.js';
import { streamPost } from '../ui/api.js';
import { openAsk, setPageContext, icon } from '../ui/ask.js';
import { BrainView } from '../brain/brain-view.js';
import { BY_ID, GROUPS } from '../brain/anatomy.js';
import { REPLAYS, REPLAY_BY_ID, structuresOf } from '../content/replays.js';
import { encodeShare, decodeShare } from '../ui/share.js';

const panel = $('#panel');
const caption = $('#caption');
const player = $('#player');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const brain = new BrainView($('#stage'), { autoRotate: false, ambient: false, labels: true, zoom: true, view: [1, 0.22, 0.2] });
brain.ready.catch(() => {});

$('#stage-key').append(...Object.values(GROUPS).map((g) => h('li', {}, h('span.dot', { '--c': g.color, 'aria-hidden': 'true' }), g.name)));
$('#prev').append(icon('prev'));
$('#next').append(icon('next'));

// ---------- routing ----------
const params = new URLSearchParams(location.search);
const shared = location.hash.startsWith('#s=') ? location.hash.slice(3) : null;


// ---------- start screen ----------
function showStart(error) {
  stopPlayback();
  player.hidden = true;
  caption.replaceChildren();
  brain.setAmbient(true);
  brain.ready.then(() => brain.setAutoRotate(true)).catch(() => {});
  setPageContext({ context: { page: 'replay' }, suggestions: ['Why do we dream?', 'What happens in my brain when I laugh?', 'Why do I get bored?'] });
  document.title = 'Replay a moment · Inside Your Brain';

  const composer = buildComposer();
  const recent = (storage('recent-replays') || []).filter((r) => r && r.question);
  panel.replaceChildren(
    h('div.panel-inner', {},
      h('h1.replay-title', {}, 'Replay a moment'),
      h('p.lede', {}, 'Pick an everyday mystery, or describe something that happened to you. You’ll see which parts of your brain did what, in order.'),
      error ? h('p.notice', { role: 'alert' }, error) : null,
      h('div', { 'data-ai-only': true }, composer),
      recent.length ? h('section.start-section', {},
        h('h2.section-title', {}, 'Your recent replays'),
        h('ul.start-list', {}, recent.slice(0, 5).map((r) => h('li', {}, h('a.start-item', { href: '#', onclick: (e) => { e.preventDefault(); history.pushState(null, '', '/replay.html?m=' + encodeURIComponent(r.moment)); showReplay(r); } },
          h('span.start-q', {}, r.question), dotsFor(structuresOf(r))))))) : null,
      h('section.start-section', {},
        h('h2.section-title', {}, 'Everyday mysteries'),
        h('ul.start-list', {}, REPLAYS.map((r) => h('li', {}, h('a.start-item', { href: `/replay.html?r=${r.id}` },
          h('span.start-q', {}, r.question), dotsFor(structuresOf(r))))))),
    ),
  );
}

function buildComposer(initial = '') {
  const textarea = h('textarea', { id: 'moment', rows: '2', maxlength: '600', placeholder: 'I laughed so hard I couldn’t breathe', autocomplete: 'off' });
  textarea.value = initial;
  const hint = h('p.composer-hint', {}, 'Don’t include names or personal details.');
  const form = h('form.composer', { novalidate: true },
    h('label.visually-hidden', { for: 'moment' }, 'Describe a moment'),
    h('div.composer-field', {}, textarea, h('button.btn.btn-primary', { type: 'submit' }, 'Replay it')),
    hint);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (text.length < 8) { hint.textContent = 'Add a few more words about what happened.'; hint.classList.add('is-error'); textarea.focus(); return; }
    history.pushState(null, '', '/replay.html?m=' + encodeURIComponent(text));
    generate(text);
  });
  textarea.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  return form;
}

// ---------- generating ----------
let genController = null;
async function generate(moment) {
  moment = moment.slice(0, 600);
  stopPlayback();
  player.hidden = true;
  const cached = sessionCache(moment);
  if (cached) return showReplay(cached);

  const on = await aiReady;
  if (!on) {
    showStart('AI replays aren’t switched on for this site, so you can’t replay your own moment yet. Try one of the everyday mysteries below.');
    return;
  }
  brain.setAmbient(true);
  brain.setAutoRotate(true);
  const status = h('p.gen-status', { role: 'status' }, 'Reading your moment');
  const bar = h('div.gen-bar', {}, h('span'));
  panel.replaceChildren(h('div.panel-inner.gen', {},
    h('p.moment', {}, `“${moment}”`),
    h('h1.replay-title', {}, 'Replaying your moment'),
    status, bar,
    h('button.link', { type: 'button', onclick: () => { genController?.abort(); showStart(); history.pushState(null, '', '/replay.html'); } }, 'Cancel')));
  caption.replaceChildren();

  genController?.abort();
  genController = new AbortController();
  let result = null;
  let error = null;
  try {
    await streamPost('/api/replay', { moment }, (ev) => {
      if (ev.type === 'progress') {
        status.textContent = `Tracing it through your brain: step ${ev.steps} drafted`;
        bar.firstChild.style.width = Math.min(92, 18 + ev.steps * 14) + '%';
      } else if (ev.type === 'done') result = ev.replay;
      else if (ev.type === 'error') error = ev.error;
    }, genController.signal);
  } catch (e) {
    if (e.name === 'AbortError') return;
    error = 'Couldn’t reach the server. Check your connection and try again.';
  }
  brain.setAmbient(false);
  if (error || !result) return showError(moment, error || 'The replay didn’t come back. Try again.');
  if (result.safety !== 'ok') return showMessage(moment, result);
  result.moment = moment;
  sessionCache(moment, result);
  const recent = (storage('recent-replays') || []).filter((r) => r.moment !== moment);
  storage('recent-replays', [result, ...recent].slice(0, 5));
  showReplay(result);
}

function sessionCache(moment, value) {
  try {
    const key = 'replay:' + moment.toLowerCase();
    if (value === undefined) return JSON.parse(sessionStorage.getItem(key) || 'null');
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch { return null; }
}

function showError(moment, message) {
  panel.replaceChildren(h('div.panel-inner', {},
    h('p.moment', {}, `“${moment}”`),
    h('h1.replay-title', {}, 'That replay didn’t work'),
    h('p.notice', { role: 'alert' }, message),
    h('div.row', {}, h('button.btn.btn-primary', { type: 'button', onclick: () => generate(moment) }, 'Try again'),
      h('a.btn.btn-quiet', { href: '/replay.html' }, 'Pick another moment'))));
}

function showMessage(moment, result) {
  brain.setAutoRotate(true);
  const care = result.safety === 'support';
  panel.replaceChildren(h('div.panel-inner', {},
    h('p.moment', {}, `“${moment}”`),
    h('h1.replay-title', {}, care ? 'Before anything else' : 'Let’s try a different moment'),
    h('div.notice' + (care ? '.notice-care' : ''), { role: care ? 'alert' : 'status' }, h('p', {}, result.message)),
    care ? h('div.care', {},
      h('p', {}, 'If you or someone else is in immediate danger, call your local emergency number now.'),
      h('p', {}, 'To find a free, confidential helpline in your country, visit ', h('a.link', { href: 'https://findahelpline.com', target: '_blank', rel: 'noopener' }, 'findahelpline.com'), '.'),
      h('p', {}, 'Talking to someone you trust, like a friend, family member, teacher or doctor, can help too.')) : null,
    care ? null : h('div', { 'data-ai-only': true }, buildComposer(moment)),
    h('a.link', { href: '/replay.html' }, 'See the everyday mysteries')));
}

// ---------- the replay ----------
let current = null;
let step = -1;
let playing = false;
let timer = null;
let stepStarted = 0;
let stepDuration = 0;
let userPaused = false;

function showReplay(r) {
  current = r;
  userPaused = false;
  stopPlayback();
  brain.setAmbient(false);
  brain.setAutoRotate(false);
  document.title = `${r.question} · Inside Your Brain`;
  const isPreset = Boolean(REPLAY_BY_ID[r.id] && !r.generated);
  const allIds = structuresOf(r);
  setPageContext({
    context: isPreset ? { page: 'replay', replayId: r.id } : { page: 'replay', replay: { question: r.question.slice(0, 200), structures: allIds.slice(0, 12) } },
    label: 'this replay',
    suggestions: suggestionsFor(r, allIds),
  });

  const steps = h('ol.steps', {}, r.beats.map((b, i) => h('li.step', { 'data-i': i },
    h('button.step-head', { type: 'button', 'aria-label': `Play step ${i + 1}: ${b.title}`, onclick: () => { goTo(i); pause(); } },
      h('span.step-time', {}, b.time), h('span.step-title', {}, b.title)),
    h('p.step-text', {}, b.text),
    h('div.step-chips', {},
      b.structures.map((id) => structureChip(id, () => { brain.focusOn([id]); brain.select(id); setTimeout(() => brain.select(null), 2200); })),
      (b.chemicals || []).map(chemicalChip)),
  )));

  const share = h('button.btn.btn-quiet.btn-small', { type: 'button' }, icon('share'), 'Share');
  share.addEventListener('click', async () => {
    const url = isPreset ? `${location.origin}/replay.html?r=${r.id}` : `${location.origin}/replay.html#s=${await encodeShare(r)}`;
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: r.question, url }); } catch { /* cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      share.lastChild.textContent = 'Link copied';
      setTimeout(() => (share.lastChild.textContent = 'Share'), 2200);
    } catch {
      // Clipboard blocked: show the link so it can be copied by hand.
      const field = h('input.share-field', { type: 'text', readonly: true, value: url, 'aria-label': 'Link to this replay' });
      share.parentElement.after(field);
      field.select();
    }
  });

  const askBtn = h('button.btn.btn-quiet.btn-small', { type: 'button', 'data-ai-only': true, onclick: () => openAsk({ context: askContext(r, isPreset, allIds), label: 'this replay', suggestions: suggestionsFor(r, allIds) }) }, icon('ask'), 'Ask about this');

  panel.replaceChildren(h('div.panel-inner', {},
    h('a.back', { href: '/replay.html' }, icon('prev'), 'All replays'),
    h('header.replay-head', {},
      r.moment ? h('p.moment', {}, `“${r.moment}”`) : null,
      h('h1.replay-title', {}, r.question),
      h('p.lede', {}, r.summary),
      h('p.ai-tag', {}, isPreset ? 'Written by hand from published research' : [icon('spark'), r.demo ? 'Demo replay (a hand-written example, not the AI)' : 'AI-generated replay. The brain areas come from reviewed notes.']),
      h('div.row', {}, share, askBtn)),
    h('section.block', { 'aria-labelledby': 'steps-title' }, h('h2.section-title', { id: 'steps-title' }, 'What happened, step by step'), steps),
    h('section.block', { 'aria-labelledby': 'why-title' }, h('h2.section-title', { id: 'why-title' }, 'Why it felt like that'), h('p.why', {}, r.whyItFelt)),
    r.tryThis?.length ? h('section.block', { 'aria-labelledby': 'try-title' }, h('h2.section-title', { id: 'try-title' }, 'Try this'),
      h('ul.tries', {}, r.tryThis.map((t) => h('li', {}, h('h3', {}, t.title), h('p', {}, t.text))))) : null,
    h('section.block.fine', { 'aria-labelledby': 'fine-title' }, h('h2.section-title', { id: 'fine-title' }, 'The fine print'),
      h('ul.fine-list', {}, (r.finePrint || []).map((f) => h('li', {}, f))),
      r.sources?.length ? h('div.sources', {}, h('h3', {}, 'Sources'), h('ul', {}, r.sources.map((s) => h('li', {}, `${s.authors} (${s.year}). ${s.title}.${s.journal ? ' ' + s.journal + '.' : ''}`)))) : null,
      h('div.sources', {}, h('h3', {}, 'Brain areas in this replay'), h('div.step-chips', {}, allIds.map((id) => h('a.chip.chip-structure', { href: `/explore.html#${id}`, '--c': GROUPS[BY_ID[id].group].color }, h('span.dot', { '--c': GROUPS[BY_ID[id].group].color, 'aria-hidden': 'true' }), BY_ID[id].name))))),
    h('section.block.again', { 'data-ai-only': true, 'aria-labelledby': 'again-title' }, h('h2.section-title', { id: 'again-title' }, 'Replay a moment of your own'), buildComposer()),
  ));
  panel.scrollTop = 0;
  window.scrollTo({ top: 0 });

  // Player
  const ticks = $('#ticks');
  ticks.replaceChildren(...r.beats.map((b, i) => h('li', {}, h('button.tick', { type: 'button', 'aria-label': `Step ${i + 1}: ${b.title}`, onclick: () => { goTo(i); pause(); } }, h('span')))));
  player.hidden = false;
  const shownAt = current;
  brain.ready.then(() => {
    if (current !== shownAt) return;
    if (step < 0) goTo(0);
    if (!reduce && !userPaused) play();
  }).catch(() => { if (step < 0) goTo(0); });
}

function askContext(r, isPreset, ids) {
  return isPreset ? { page: 'replay', replayId: r.id } : { page: 'replay', replay: { question: r.question.slice(0, 200), structures: ids.slice(0, 12) } };
}

function suggestionsFor(r, ids) {
  const first = BY_ID[ids.find((id) => BY_ID[id]?.group !== 'sense') || ids[0]];
  const nameQ = first ? (first.name.includes('’s') ? `Why is ${first.name} involved?` : `Why is the ${first.name.charAt(0).toLowerCase() + first.name.slice(1)} involved?`) : null;
  return [nameQ, 'Is this the same for everyone?', 'What makes this better or worse?'].filter(Boolean);
}

function goTo(i) {
  if (!current) return;
  const beats = current.beats;
  i = Math.max(0, Math.min(beats.length - 1, i));
  const prevIds = step >= 0 ? beats[step].structures : [];
  step = i;
  const b = beats[i];
  brain.setActivity(b.structures.map((id) => ({ id })), { from: prevIds });
  brain.focusOn(b.structures);
  panel.querySelectorAll('.step').forEach((el, k) => {
    el.classList.toggle('is-active', k === i);
    el.classList.toggle('is-past', k < i);
  });
  $('#ticks').querySelectorAll('.tick').forEach((el, k) => {
    el.classList.toggle('is-active', k === i);
    el.classList.toggle('is-past', k < i);
    el.setAttribute('aria-current', k === i ? 'step' : 'false');
    el.firstChild.style.transition = 'none';
    el.firstChild.style.width = k < i ? '100%' : '0%';
  });
  $('#count').textContent = `Step ${i + 1} of ${beats.length}`;
  caption.replaceChildren(h('span.caption-time', {}, b.time), h('span.caption-title', {}, b.title));
  caption.classList.remove('is-in'); void caption.offsetWidth; caption.classList.add('is-in');
  stepDuration = Math.min(9500, 4200 + b.text.length * 32);
  if (playing) schedule();
}

function schedule() {
  clearTimeout(timer);
  stepStarted = performance.now();
  const fill = $('#ticks').querySelectorAll('.tick')[step]?.firstChild;
  if (fill) {
    fill.style.transition = 'none'; fill.style.width = '0%'; void fill.offsetWidth;
    fill.style.transition = `width ${stepDuration}ms linear`; fill.style.width = '100%';
  }
  timer = setTimeout(() => {
    if (step < current.beats.length - 1) goTo(step + 1);
    else finish();
  }, stepDuration);
}

function play() {
  if (!current) return;
  if (step >= current.beats.length - 1 && !playing && step !== -1 && player.dataset.ended) { delete player.dataset.ended; goTo(0); }
  playing = true;
  userPaused = false;
  setPlayIcon();
  schedule();
}

function pause() {
  userPaused = true;
  playing = false;
  clearTimeout(timer);
  const fill = $('#ticks').querySelectorAll('.tick')[step]?.firstChild;
  if (fill) { const w = getComputedStyle(fill).width; fill.style.transition = 'none'; fill.style.width = w; }
  setPlayIcon();
}

function finish() {
  playing = false;
  player.dataset.ended = '1';
  setPlayIcon();
  // Show everything that took part, softly.
  const all = structuresOf(current);
  brain.setActivity(all.map((id) => ({ id, intensity: 0.5 })), { pulses: false });
  brain.resetView();
  caption.replaceChildren(h('span.caption-time', {}, 'All together'), h('span.caption-title', {}, `${all.length} brain areas took part`));
}

function stopPlayback() { playing = false; clearTimeout(timer); step = -1; delete player.dataset.ended; setPlayIcon(); }

function setPlayIcon() {
  const btn = $('#play');
  const ended = player.dataset.ended;
  btn.replaceChildren(icon(playing ? 'pause' : ended ? 'restart' : 'play'));
  btn.setAttribute('aria-label', playing ? 'Pause' : ended ? 'Replay from the start' : 'Play');
}

$('#play').addEventListener('click', () => (playing ? pause() : play()));
$('#prev').addEventListener('click', () => { pause(); delete player.dataset.ended; goTo(step - 1); });
$('#next').addEventListener('click', () => { pause(); if (step < (current?.beats.length || 0) - 1) goTo(step + 1); else finish(); });
document.addEventListener('keydown', (e) => {
  if (!current || player.hidden || e.target.closest('textarea, input, .ask')) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); $('#next').click(); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); $('#prev').click(); }
});
window.addEventListener('popstate', () => location.reload());

// Route last, once everything above is defined.
if (params.get('r') && REPLAY_BY_ID[params.get('r')]) {
  showReplay(REPLAY_BY_ID[params.get('r')]);
} else if (shared) {
  decodeShare(shared).then((r) => (r ? showReplay(r) : showStart('That shared link couldn’t be opened. It may have been cut off when it was copied.')));
} else if (params.get('m')) {
  generate(params.get('m'));
} else {
  showStart();
}
