import { aiReady } from '../ui/shell.js';
import { h, $, dotsFor } from '../ui/dom.js';
import { GROUPS } from '../brain/anatomy.js';
import { BrainView } from '../brain/brain-view.js';
import { REPLAYS, structuresOf } from '../content/replays.js';

// Hero brain with quiet background activity.
const brain = new BrainView($('#hero-brain'), { ambient: true, autoRotate: true, zoom: false, labels: false, view: [1, 0.2, 0.25], pixelRatio: 1.75 });
brain.ready.catch(() => {});

// Example chips: the four most relatable replays.
$('#examples').append(...['procrastination', 'doorway', 'stage-nerves', 'tickle']
  .map((id) => REPLAYS.find((r) => r.id === id))
  .map((r) => h('a.example', { href: `/replay.html?r=${r.id}` }, r.question)));

// The full list of hand-written replays.
$('#mystery-list').append(...REPLAYS.map((r) => h('li', {},
  h('a.mystery', { href: `/replay.html?r=${r.id}` },
    h('span.mystery-q', {}, r.question),
    h('span.mystery-moment', {}, `“${r.moment}”`),
    dotsFor(structuresOf(r)),
  ))));

$('#group-key').append(...Object.values(GROUPS).map((g) => h('li', {}, h('span.dot', { '--c': g.color, 'aria-hidden': 'true' }), g.name)));

// Composer: send the moment to the replay page.
const form = $('#composer');
const input = $('#moment');
const hint = $('#composer-hint');
const hintText = hint.textContent;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (text.length < 8) {
    hint.textContent = 'Add a few more words about what happened.';
    hint.classList.add('is-error');
    input.focus();
    return;
  }
  location.href = `/replay.html?m=${encodeURIComponent(text)}`;
});
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
input.addEventListener('input', () => {
  hint.textContent = hintText; hint.classList.remove('is-error');
  input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 160) + 'px';
});

// Cycle the placeholder through real-feeling moments (skipped for reduced motion).
const ideas = [
  'I forgot someone’s name the second they told me',
  'I keep checking my phone even when nothing is new',
  'I got goosebumps during a song',
  'I said “you too” when the waiter said enjoy your meal',
  'I can remember lyrics from years ago but not what I ate yesterday',
  'I laughed so hard I couldn’t breathe',
];
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let i = 0;
  setInterval(() => {
    if (document.activeElement === input || input.value) return;
    i = (i + 1) % ideas.length;
    input.setAttribute('placeholder', ideas[i]);
  }, 3600);
}

aiReady.then((on) => {
  if (!on) $('#try-label').textContent = 'Start with one of these';
});
