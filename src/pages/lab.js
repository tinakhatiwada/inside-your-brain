import '../ui/shell.js';
import { h, $, $$, structureChip, storage } from '../ui/dom.js';
import { openAsk, setPageContext } from '../ui/ask.js';
import { BrainView } from '../brain/brain-view.js';

const panel = $('#panel');
const caption = $('#brain-caption');
const brain = new BrainView($('#stage'), { autoRotate: true, labels: true, zoom: false, view: [1, 0.25, 0.2], pixelRatio: 1.5 });
brain.ready.catch(() => {});

let results = storage('lab-results') || {};
const save = (patch) => { results = { ...results, ...patch, at: Date.now() }; storage('lab-results', results); renderSummary(); };
const toChips = (ids) => h('div.step-chips', {}, ids.map((id) => structureChip(id, () => (location.href = `/explore.html#${id}`))));
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1);
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
let runToken = 0; // cancels a running experiment when you switch tabs

function light(ids, text, from = []) {
  brain.setActivity(ids.map((id) => ({ id })), { from });
  caption.textContent = text;
}

// ---------------------------------------------------------------- Reaction time
const reaction = {
  id: 'reaction', name: 'Reaction time', time: 'About 30 seconds',
  brain: ['visual-cortex', 'motor-cortex'],
  intro() {
    light(['visual-cortex', 'thalamus'], 'Your visual system is watching for a change.');
    return [
      h('h2.exp-title', {}, 'How fast can you react?'),
      h('p.exp-text', {}, 'When the circle turns gold, click or tap as fast as you can (or press the space bar). Five rounds. If you jump the gun, that round restarts.'),
      h('button.btn.btn-primary', { type: 'button', onclick: () => this.run() }, 'Start'),
    ];
  },
  async run() {
    const token = ++runToken;
    const times = [];
    const arena = h('button.arena', { type: 'button', 'aria-label': 'Reaction area. Press when it turns gold.' }, h('span.arena-dot'), h('span.arena-text', {}, 'Wait for gold'));
    const progress = h('p.exp-progress', { 'aria-live': 'polite' }, 'Round 1 of 5');
    panel.replaceChildren(h('h2.exp-title', {}, 'Wait for gold'), progress, arena);
    arena.focus();
    while (times.length < 5 && token === runToken) {
      arena.className = 'arena is-waiting';
      arena.lastChild.textContent = 'Wait for gold';
      light(['visual-cortex', 'thalamus'], 'Watching and waiting. Your attention is primed.');
      const delay = 1200 + Math.random() * 2300;
      const result = await new Promise((resolve) => {
        let shown = 0;
        const timer = setTimeout(() => {
          shown = performance.now();
          arena.className = 'arena is-go';
          arena.lastChild.textContent = 'Now!';
        }, delay);
        const press = (e) => {
          if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
          e.preventDefault();
          cleanup();
          if (!shown) { clearTimeout(timer); resolve(null); } else resolve(performance.now() - shown);
        };
        const cleanup = () => { arena.removeEventListener('pointerdown', press); window.removeEventListener('keydown', press); };
        arena.addEventListener('pointerdown', press);
        window.addEventListener('keydown', press);
      });
      if (token !== runToken) return;
      if (result === null) {
        arena.className = 'arena is-early';
        arena.lastChild.textContent = 'Too soon! Wait for the gold.';
        light(['prefrontal'], 'Jumping early means your brain predicted the change and acted on the guess.');
        await wait(1300);
        continue;
      }
      times.push(result);
      light(['motor-cortex', 'cerebellum'], 'Signal sent: visual cortex to motor cortex to your finger.', ['visual-cortex']);
      arena.className = 'arena is-done';
      arena.lastChild.textContent = `${Math.round(result)} ms`;
      progress.textContent = times.length < 5 ? `Round ${times.length + 1} of 5` : 'Done';
      await wait(1000);
    }
    if (token !== runToken) return;
    const med = median(times);
    save({ reactionMs: Math.round(med), reactionBest: Math.round(Math.min(...times)) });
    panel.replaceChildren(...this.result());
  },
  result() {
    const ms = results.reactionMs;
    light(['visual-cortex', 'thalamus', 'prefrontal', 'motor-cortex'], 'The path from your eyes to your finger.');
    // A rough, labelled guide to where the time goes. Fixed stages, with "deciding" taking the rest.
    const fixed = [
      { label: 'Eye to thalamus', ms: 40, c: 'var(--sense)' },
      { label: 'Visual cortex spots the change', ms: 50, c: 'var(--sense)' },
      { label: 'Deciding and launching', ms: 0, c: 'var(--think)' },
      { label: 'Nerves and muscles', ms: 30, c: 'var(--act)' },
      { label: 'Screen and mouse lag', ms: 35, c: 'var(--faint)' },
    ];
    fixed[2].ms = Math.max(20, ms - fixed.reduce((a, s) => a + s.ms, 0));
    const total = fixed.reduce((a, s) => a + s.ms, 0);
    return [
      h('h2.exp-title', {}, 'Your reaction time'),
      h('p.big-number', {}, h('span', {}, String(ms)), ' ms'),
      h('p.exp-text', {}, `That’s your middle score of five (best: ${results.reactionBest} ms). Simple reaction times on a computer are often around 200 to 300 milliseconds, and device lag adds a bit.`),
      h('figure.breakdown', {},
        h('div.breakdown-bar', { role: 'img', 'aria-label': fixed.map((s) => `${s.label} about ${s.ms} ms`).join(', ') }, fixed.map((s) => h('span', { style: { flexGrow: s.ms, background: s.c } }))),
        h('ul.breakdown-key', {}, fixed.map((s) => h('li', {}, h('span.dot', { '--c': s.c }), `${s.label}`, h('b', {}, ` ~${Math.round(s.ms)} ms`)))),
        h('figcaption', {}, `Roughly where your ${Math.round(total)} ms went. This is a rough guide based on typical values, not a measurement of your brain.`)),
      h('p.exp-text', {}, 'Most of the time isn’t the signal travelling. It’s your brain recognising the change and deciding to act. That’s why reaction time drops with practice and rises when you’re tired or distracted.'),
      toChips(['thalamus', 'visual-cortex', 'prefrontal', 'motor-cortex']),
      h('div.row', {}, h('button.btn.btn-quiet', { type: 'button', onclick: () => this.run() }, 'Try again'), nextButton('stroop')),
    ];
  },
};

// ---------------------------------------------------------------- Stroop
const COLOURS = [
  { id: 'red', name: 'Red', hex: '#F2705F', key: 'r' },
  { id: 'blue', name: 'Blue', hex: '#62A2F5', key: 'b' },
  { id: 'green', name: 'Green', hex: '#5DCB7E', key: 'g' },
  { id: 'yellow', name: 'Yellow', hex: '#F2D35B', key: 'y' },
];
const stroop = {
  id: 'stroop', name: 'Colour clash', time: 'About a minute',
  intro() {
    light(['visual-cortex', 'wernicke'], 'Reading is so automatic that it happens whether you want it to or not.');
    return [
      h('h2.exp-title', {}, 'Name the colour, not the word'),
      h('p.exp-text', {}, 'You’ll see colour words like ', h('b', { style: { color: COLOURS[1].hex } }, 'RED'), '. Pick the colour of the ink, not what the word says. Go as fast as you can without mistakes. Use the buttons, or the keys R, B, G and Y.'),
      h('p.exp-note', {}, 'If you have colour blindness, this one may be hard or impossible. That says nothing about your brain’s control system.'),
      h('button.btn.btn-primary', { type: 'button', onclick: () => this.run() }, 'Start'),
    ];
  },
  async run() {
    const token = ++runToken;
    const trials = [];
    for (let i = 0; i < 20; i++) {
      const word = COLOURS[i % 4];
      const congruent = i < 10;
      let ink = word;
      if (!congruent) { const others = COLOURS.filter((c) => c !== word); ink = others[Math.floor(Math.random() * 3)]; }
      trials.push({ word, ink, congruent });
    }
    trials.sort(() => Math.random() - 0.5);
    const wordEl = h('p.stroop-word', { 'aria-live': 'off' });
    const progress = h('p.exp-progress', {}, '');
    const buttons = COLOURS.map((c) => h('button.colour-btn', { type: 'button', 'data-id': c.id, '--c': c.hex }, h('span.dot', { '--c': c.hex }), c.name, h('kbd', {}, c.key.toUpperCase())));
    panel.replaceChildren(h('h2.exp-title', {}, 'Pick the ink colour'), progress, wordEl, h('div.colour-btns', {}, buttons));
    for (const n of ['3', '2', '1']) { if (token !== runToken) return; wordEl.textContent = n; wordEl.style.color = 'var(--ivory)'; await wait(600); }
    const out = [];
    for (let i = 0; i < trials.length && token === runToken; i++) {
      const t = trials[i];
      progress.textContent = `${i + 1} of ${trials.length}`;
      wordEl.textContent = '';
      await wait(350);
      wordEl.textContent = t.word.name.toUpperCase();
      wordEl.style.color = t.ink.hex;
      light(t.congruent ? ['visual-cortex', 'wernicke'] : ['wernicke', 'cingulate', 'prefrontal'], t.congruent ? 'Word and colour agree. Easy.' : 'Word and colour clash. Your conflict monitor fires and your planner overrides the urge to read.');
      const start = performance.now();
      const answer = await new Promise((resolve) => {
        const click = (e) => { const b = e.target.closest('.colour-btn'); if (b) { done(); resolve(b.dataset.id); } };
        const key = (e) => { const c = COLOURS.find((x) => x.key === e.key.toLowerCase()); if (c) { e.preventDefault(); done(); resolve(c.id); } };
        const done = () => { panel.removeEventListener('click', click); window.removeEventListener('keydown', key); };
        panel.addEventListener('click', click);
        window.addEventListener('keydown', key);
      });
      out.push({ ...t, rt: performance.now() - start, correct: answer === t.ink.id });
    }
    if (token !== runToken) return;
    const ok = out.filter((t) => t.correct);
    const cong = mean(ok.filter((t) => t.congruent).map((t) => t.rt));
    const incong = mean(ok.filter((t) => !t.congruent).map((t) => t.rt));
    save({ stroopCong: Math.round(cong), stroopIncong: Math.round(incong), stroopCostMs: Math.max(0, Math.round(incong - cong)), stroopErrors: out.length - ok.length });
    panel.replaceChildren(...this.result());
  },
  result() {
    light(['cingulate', 'prefrontal', 'wernicke'], 'The clash between reading and naming colours.');
    const cost = results.stroopCostMs;
    return [
      h('h2.exp-title', {}, 'Your colour clash'),
      h('p.big-number', {}, h('span', {}, String(cost)), ' ms slower'),
      h('p.exp-text', {}, `When the word and ink matched, you took about ${results.stroopCong} ms. When they clashed, about ${results.stroopIncong} ms. ${results.stroopErrors ? `You made ${results.stroopErrors} mistake${results.stroopErrors > 1 ? 's' : ''}.` : 'No mistakes.'} A slowdown of roughly 50 to 150 ms is common.`),
      h('p.exp-text', {}, 'You’ve read so many words that reading happens automatically. When the word says one thing and the ink another, your anterior cingulate cortex notices the conflict and your prefrontal cortex steps in to override the automatic answer. That override is what costs you time. It’s called the Stroop effect, first described in 1935.'),
      toChips(['wernicke', 'cingulate', 'prefrontal']),
      h('div.row', {}, h('button.btn.btn-quiet', { type: 'button', onclick: () => this.run() }, 'Try again'), nextButton('span')),
    ];
  },
};

// ---------------------------------------------------------------- Digit span
const span = {
  id: 'span', name: 'Memory span', time: 'About a minute',
  intro() {
    light(['prefrontal', 'broca'], 'Working memory: your brain’s sticky note.');
    return [
      h('h2.exp-title', {}, 'How much can you hold in mind?'),
      h('p.exp-text', {}, 'Digits will appear one at a time. When they stop, type them back in order. Each time you get it right, the list gets one longer. You get two tries at each length.'),
      h('button.btn.btn-primary', { type: 'button', onclick: () => this.run() }, 'Start'),
    ];
  },
  async run() {
    const token = ++runToken;
    let len = 3;
    let best = 0;
    let misses = 0;
    while (len <= 12 && token === runToken) {
      const digits = [];
      while (digits.length < len) {
        const d = Math.floor(Math.random() * 10);
        if (d !== digits.at(-1)) digits.push(d); // no immediate repeats, so every digit is visibly new
      }
      const show = h('p.span-digit', { 'aria-live': 'assertive' });
      panel.replaceChildren(h('h2.exp-title', {}, `${len} digits`), h('p.exp-progress', {}, 'Watch carefully'), show);
      light(['visual-cortex', 'prefrontal', 'broca'], 'Many people repeat the digits silently. That inner voice uses speech areas.');
      await wait(600);
      for (const d of digits) {
        if (token !== runToken) return;
        show.textContent = String(d);
        await wait(850);
        show.textContent = '';
        await wait(200);
      }
      const input = h('input.span-input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', pattern: '[0-9]*', 'aria-label': 'Type the digits in order', maxlength: '14' });
      const form = h('form.span-form', {}, input, h('button.btn.btn-primary', { type: 'submit' }, 'Check'));
      panel.replaceChildren(h('h2.exp-title', {}, 'Type them in order'), h('p.exp-progress', {}, `${len} digits`), form);
      input.focus();
      light(['prefrontal', 'posterior-parietal'], 'Holding the list and reading it back out of working memory.');
      const answer = await new Promise((resolve) => form.addEventListener('submit', (e) => { e.preventDefault(); resolve(input.value.replace(/\D/g, '')); }, { once: true }));
      if (token !== runToken) return;
      const right = answer === digits.join('');
      panel.replaceChildren(h('h2.exp-title', {}, right ? 'Correct' : 'Not quite'), h('p.exp-progress', {}, right ? `${len} digits held.` : `It was ${digits.join(' ')}.`));
      await wait(1100);
      if (right) { best = len; len++; misses = 0; } else if (++misses >= 2) break;
    }
    if (token !== runToken) return;
    save({ span: best });
    panel.replaceChildren(...this.result());
  },
  result() {
    light(['prefrontal', 'broca', 'posterior-parietal'], 'Your brain’s sticky note.');
    return [
      h('h2.exp-title', {}, 'Your memory span'),
      h('p.big-number', {}, h('span', {}, String(results.span)), ' digits'),
      h('p.exp-text', {}, 'Most adults can repeat about 5 to 8 digits in order. Working memory is small on purpose: it’s a workspace, not storage.'),
      h('p.exp-text', {}, 'You probably stretched it by repeating the digits silently (your speech areas helping) or grouping them into chunks, like 47 81 29. Chunking is why phone numbers are written in groups. Researchers think we can hold only about four chunks at once.'),
      toChips(['prefrontal', 'broca', 'posterior-parietal']),
      h('div.row', {}, h('button.btn.btn-quiet', { type: 'button', onclick: () => this.run() }, 'Try again'), h('a.btn.btn-quiet', { href: '#summary' }, 'See all results')),
    ];
  },
};

const EXPERIMENTS = [reaction, stroop, span];
const done = { reaction: () => results.reactionMs, stroop: () => results.stroopCostMs !== undefined, span: () => results.span !== undefined };

function nextButton(id) {
  const e = EXPERIMENTS.find((x) => x.id === id);
  return h('button.btn.btn-primary', { type: 'button', onclick: () => select(id, true) }, `Next: ${e.name.toLowerCase()}`);
}

const tabs = $('#tabs');
tabs.append(...EXPERIMENTS.map((e, i) => h('button.lab-tab', { type: 'button', role: 'tab', id: `tab-${e.id}`, 'aria-controls': 'panel', 'aria-selected': 'false', tabindex: '-1', 'data-id': e.id },
  h('span.lab-tab-n', {}, String(i + 1)), h('span.lab-tab-name', {}, e.name), h('span.lab-tab-time', {}, e.time))));
tabs.addEventListener('click', (e) => { const t = e.target.closest('.lab-tab'); if (t) select(t.dataset.id, true); });
tabs.addEventListener('keydown', (e) => {
  const i = EXPERIMENTS.findIndex((x) => x.id === current);
  if (e.key === 'ArrowRight') { select(EXPERIMENTS[(i + 1) % 3].id, true); $(`#tab-${current}`).focus(); }
  if (e.key === 'ArrowLeft') { select(EXPERIMENTS[(i + 2) % 3].id, true); $(`#tab-${current}`).focus(); }
});

let current = null;
function select(id, focusPanel = false) {
  runToken++;
  current = id;
  const e = EXPERIMENTS.find((x) => x.id === id);
  $$('.lab-tab').forEach((t) => {
    const on = t.dataset.id === id;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    t.classList.toggle('is-done', Boolean(done[t.dataset.id]()));
  });
  panel.setAttribute('aria-labelledby', `tab-${id}`);
  panel.replaceChildren(...e.intro());
  if (focusPanel) {
    panel.focus({ preventScroll: true });
    if ($('#tabs').getBoundingClientRect().top < 0) $('#tabs').scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

function renderSummary() {
  $$('.lab-tab').forEach((t) => t.classList.toggle('is-done', Boolean(done[t.dataset.id]())));
  const items = [];
  if (results.reactionMs) items.push(['Reaction time', `${results.reactionMs} ms`, 'Typical: about 200 to 300 ms']);
  if (results.stroopCostMs !== undefined) items.push(['Colour clash', `${results.stroopCostMs} ms slower`, 'Typical: about 50 to 150 ms']);
  if (results.span !== undefined) items.push(['Memory span', `${results.span} digits`, 'Typical: about 5 to 8']);
  $('#summary').hidden = !items.length;
  $('#results').replaceChildren(...items.map(([k, v, t]) => h('div.result', {}, h('dt', {}, k), h('dd.result-v', {}, v), h('dd.result-t', {}, t))));
  setPageContext({ context: { page: 'lab', lab: labContext() }, label: 'your Lab results', suggestions: ['What do my results say about how my brain works?', 'How could I improve my reaction time?', 'Why is working memory so small?'] });
}

function labContext() {
  const { reactionMs, stroopCostMs, stroopErrors, span: s } = results;
  return Object.fromEntries(Object.entries({ reactionMs, stroopCostMs, stroopErrors, span: s }).filter(([, v]) => typeof v === 'number'));
}

$('#explain').addEventListener('click', () => openAsk({ context: { page: 'lab', lab: labContext() }, label: 'your Lab results', question: 'What do my results say about how my brain works?' }));
$('#clear').addEventListener('click', () => { results = {}; storage('lab-results', {}); renderSummary(); select(current); });

// Coming back to a finished experiment shows your last result.
for (const e of EXPERIMENTS) {
  const intro = e.intro;
  e.intro = function () {
    return done[e.id]() ? [...this.result(), h('p.exp-note', {}, 'This is your last result. Press Try again to run it again.')] : intro.call(this);
  };
}

renderSummary();
select(location.hash.slice(1) && EXPERIMENTS.some((e) => e.id === location.hash.slice(1)) ? location.hash.slice(1) : 'reaction');
