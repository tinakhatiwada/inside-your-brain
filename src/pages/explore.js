import '../ui/shell.js';
import { h, $, $$, structureChip } from '../ui/dom.js';
import { openAsk, setPageContext, icon } from '../ui/ask.js';
import { BrainView } from '../brain/brain-view.js';
import { STRUCTURES, BY_ID, GROUPS, LOBES } from '../brain/anatomy.js';
import { REPLAYS } from '../content/replays.js';

const list = $('#list');
const detail = $('#detail');
const narrow = matchMedia('(max-width: 900px)');
let mode = 'parts';
let selected = null;
let selectedLobe = -1;

const brain = new BrainView($('#stage'), { markers: true, autoRotate: false, labels: true, zoom: true, view: [1, 0.25, 0.15] });
brain.ready.catch(() => {});
brain.on('select', (id) => { if (mode === 'parts') select(id); });
brain.on('selectLobe', (i) => { if (mode === 'lobes') selectLobe(i); });

// Lobes that each structure belongs to (deep ones are listed with the nearest lobe or as deep).
const LOBE_STRUCTURES = Object.fromEntries(LOBES.map((l) => [l.id, STRUCTURES.filter((s) => s.lobe === l.id).map((s) => s.id)]));

function renderList() {
  if (mode === 'parts') {
    list.replaceChildren(...Object.entries(GROUPS).map(([gid, g]) => h('section.part-group', {},
      h('h2.part-group-title', { '--c': g.color }, h('span.dot', { '--c': g.color, 'aria-hidden': 'true' }), g.name),
      h('ul.part-list', {}, STRUCTURES.filter((s) => s.group === gid).map((s) => h('li', {},
        h('button.part', { type: 'button', 'data-id': s.id, 'aria-pressed': String(selected === s.id), onclick: () => select(s.id, true), onmouseenter: () => brain.hoverId !== s.id && (brain.hoverId = s.id), onmouseleave: () => (brain.hoverId = null) },
          h('span.part-name', {}, s.name), h('span.part-nick', {}, s.nickname))))))));
  } else {
    list.replaceChildren(h('ul.part-list.lobe-list', {}, LOBES.map((l, i) => h('li', {},
      h('button.part', { type: 'button', 'aria-pressed': String(selectedLobe === i), onclick: () => selectLobe(i, true) },
        h('span.part-name', {}, h('span.dot', { '--c': l.color, 'aria-hidden': 'true' }), l.name), h('span.part-nick', {}, l.job))))));
  }
}

function setMode(m) {
  mode = m;
  $$('.seg button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
  brain.setLobeMode(m === 'lobes');
  brain.setMarkers(m === 'parts');
  brain.select(null);
  brain.clearActivity();
  selected = null; selectedLobe = -1;
  $('#hint').textContent = m === 'parts' ? 'Drag to turn the brain. Click a glowing dot, or pick a part from the list.' : 'Drag to turn the brain. Click a lobe, or pick one from the list.';
  renderList();
  showIntro();
  history.replaceState(null, '', location.pathname);
}
$$('.seg button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('.seg').addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { setMode(mode === 'parts' ? 'lobes' : 'parts'); $(`.seg [data-mode="${mode}"]`).focus(); }
});

function showIntro() {
  setPageContext({ context: { page: 'explore' }, suggestions: ['Which part of my brain makes decisions?', 'Do we really only use 10% of our brain?', 'What part of the brain handles emotions?'] });
  if (mode === 'lobes') {
    detail.replaceChildren(h('div.detail-inner', {},
      h('h1.detail-title', {}, 'The four lobes, plus two'),
      h('p.lede', {}, 'Each half of the outer brain is divided into four lobes, named after the skull bones above them. Underneath sit the cerebellum and the brainstem.'),
      h('p.detail-note', {}, 'Lobe borders here follow the main grooves on the brain, drawn as smooth lines. Real borders vary from person to person.'),
    ));
    return;
  }
  detail.replaceChildren(h('div.detail-inner', {},
    h('h1.detail-title', {}, 'Meet the parts'),
    h('p.lede', {}, 'Your brain isn’t one thing doing one job. It’s lots of specialised areas working together. Here are 21 of the ones that come up most in everyday life.'),
    h('ul.group-intro', {}, Object.values(GROUPS).map((g) => h('li', { '--c': g.color },
      h('h2', {}, h('span.dot', { '--c': g.color, 'aria-hidden': 'true' }), g.name), h('p', {}, g.blurb)))),
    h('p.detail-note', {}, 'Nicknames like “the planner” are memory aids. Every area does more than one thing, and nothing works alone.'),
  ));
}

function select(id, fromList = false) {
  if (!id || !BY_ID[id]) { selected = null; brain.select(null); brain.clearActivity(); renderList(); showIntro(); history.replaceState(null, '', location.pathname); return; }
  selected = id;
  const s = BY_ID[id];
  const g = GROUPS[s.group];
  brain.select(id);
  brain.focusOn([id]);
  $$('.part', list).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  history.replaceState(null, '', '#' + id);

  const shows = REPLAYS.filter((r) => r.beats.some((b) => b.structures.includes(id)));
  const label = s.name.includes('’s') ? s.name : 'the ' + s.name.charAt(0).toLowerCase() + s.name.slice(1);
  const suggestions = [`What happens if ${label} is damaged?`, `Can I train ${label}?`, `How does ${label} work with other parts?`];
  const ctx = { context: { page: 'explore', structureId: id }, label: s.name, suggestions };
  setPageContext(ctx);

  detail.replaceChildren(h('div.detail-inner', {},
    h('p.detail-group', { '--c': g.color }, h('span.dot', { '--c': g.color, 'aria-hidden': 'true' }), g.name),
    h('header.detail-head', {},
      h('h1.detail-title', {}, s.name),
      h('p.detail-nick', { '--c': g.color }, s.nickname)),
    h('p.lede', {}, s.oneLiner),
    h('section.detail-block', {}, h('h2.detail-h', {}, 'You use it when'), h('ul.uses', {}, s.youUseItWhen.map((u) => h('li', {}, u)))),
    h('section.detail-block', {}, h('h2.detail-h', {}, 'How it works'), ...s.explain.map((p) => h('p.detail-p', {}, p))),
    s.surprising ? h('aside.surprise', {}, h('h2.detail-h', {}, 'Surprising'), h('p', {}, s.surprising)) : null,
    h('div.row', { 'data-ai-only': true }, h('button.btn.btn-quiet.btn-small', { type: 'button', onclick: () => openAsk(ctx) }, icon('ask'), `Ask about ${label}`)),
    shows.length ? h('section.detail-block', {}, h('h2.detail-h', {}, 'See it in action'),
      h('ul.shows', {}, shows.map((r) => h('li', {}, h('a.link', { href: `/replay.html?r=${r.id}` }, r.question))))) : null,
    h('section.detail-block.sources', {}, h('h3', {}, 'Sources'),
      h('ul', {}, s.sources.map((src) => h('li', {}, `${src.authors} (${src.year}). ${src.title}.${src.journal ? ' ' + src.journal + '.' : ''}`)))),
  ));
  detail.scrollTop = 0;
  if (fromList && narrow.matches) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.__selectStructure = (id) => { if (mode !== 'parts') setMode('parts'); select(id, true); };

function selectLobe(i, fromList = false) {
  if (i === undefined || i < 0) return;
  selectedLobe = i;
  const l = LOBES[i];
  brain.selectLobe(i);
  const ids = LOBE_STRUCTURES[l.id] || [];
  brain.setActivity(ids.map((id) => ({ id, intensity: 0.7 })), { pulses: false });
  $$('.part', list).forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
  const label = l.name.toLowerCase();
  setPageContext({ context: { page: 'explore' }, label: l.name, suggestions: [`What does the ${label} do?`, `What happens if the ${label} is damaged?`] });
  detail.replaceChildren(h('div.detail-inner', {},
    h('header.detail-head', {}, h('h1.detail-title', {}, l.name), h('p.detail-nick', { '--c': l.color }, l.job)),
    ids.length ? h('section.detail-block', {}, h('h2.detail-h', {}, 'Areas in this app that sit here'),
      h('div.step-chips', {}, ids.map((id) => structureChip(id, () => window.__selectStructure(id))))) : null,
    h('p.detail-note', {}, 'Lobes are a map of where things are, not a list of jobs. Most abilities depend on areas in several lobes working together.'),
  ));
  if (fromList && narrow.matches) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$('#reset').addEventListener('click', () => brain.resetView());

renderList();
const fromHash = location.hash.slice(1);
if (BY_ID[fromHash]) brain.ready.then(() => select(fromHash)).catch(() => select(fromHash));
else showIntro();
