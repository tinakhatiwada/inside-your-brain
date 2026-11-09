// Tiny DOM helpers. All text goes in through textContent, never innerHTML.
import { BY_ID, GROUPS } from '../brain/anatomy.js';
import chemicals from '../content/chemicals.json';

export const LOBE_NAMES = {
  frontal: 'Frontal lobe',
  parietal: 'Parietal lobe',
  temporal: 'Temporal lobe',
  occipital: 'Occipital lobe',
  cerebellum: 'Cerebellum',
  brainstem: 'Brainstem',
  deep: 'Deep brain',
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** h('div.cls', { attr }, ...children) */
export function h(tag, attrs = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('--')) el.style.setProperty(k, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Render plain text with blank-line paragraphs, "- " lists and **bold**. */
export function renderPlain(text, root = h('div')) {
  root.replaceChildren();
  const blocks = String(text).trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    if (lines.every((l) => /^[-*•]\s+/.test(l))) {
      root.append(h('ul', {}, lines.map((l) => h('li', {}, inline(l.replace(/^[-*•]\s+/, ''))))));
    } else {
      root.append(h('p', {}, inline(lines.join(' '))));
    }
  }
  return root;
}

function inline(s) {
  return s.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part) =>
    part.startsWith('**') && part.endsWith('**') ? h('strong', {}, part.slice(2, -2)) : document.createTextNode(part.replace(/\*\*/g, '')));
}

export function structureChip(id, onClick, { showLobe = false } = {}) {
  const s = BY_ID[id];
  if (!s) return null;
  const color = GROUPS[s.group].color;
  const children = [h('span.dot', { '--c': color, 'aria-hidden': 'true' }), s.name];
  if (showLobe && s.lobe) {
    const lobeName = LOBE_NAMES[s.lobe] || s.lobe;
    children.push(h('span.chip-lobe', {}, ' · ' + lobeName));
  }
  return h(onClick ? 'button.chip.chip-structure' : 'span.chip.chip-structure', { type: onClick ? 'button' : undefined, onclick: onClick, '--c': color },
    ...children);
}

/** One dot per kind of brain work involved (sensing, feeling, thinking, acting), in a fixed order. */
export function dotsFor(ids) {
  const used = new Set(ids.map((id) => BY_ID[id]?.group).filter(Boolean));
  const names = Object.keys(GROUPS).filter((g) => used.has(g));
  return h('span.dots', { title: names.map((g) => GROUPS[g].name).join(', ') }, names.map((g) => h('span.dot', { '--c': GROUPS[g].color })),
    h('span.visually-hidden', {}, 'Involves: ' + names.map((g) => GROUPS[g].name.toLowerCase()).join(', ')));
}

let pop = null;
function closePop() { pop?.remove(); pop = null; }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });
document.addEventListener('click', (e) => { if (pop && !e.target.closest('.chip-chem')) closePop(); });

export function chemicalChip(id) {
  const c = chemicals[id];
  if (!c) return null;
  const btn = h('button.chip.chip-chem', { type: 'button', 'aria-expanded': 'false' }, c.name);
  btn.addEventListener('click', () => {
    const wasMine = pop && pop.dataset.for === id;
    closePop();
    if (wasMine) return;
    pop = h('div.pop', { role: 'status', 'data-for': id }, h('strong', {}, c.name), c.what);
    document.body.append(pop);
    const r = btn.getBoundingClientRect();
    const pw = Math.min(280, window.innerWidth - 32);
    pop.style.left = Math.max(16, Math.min(r.left, window.innerWidth - pw - 16)) + 'px';
    pop.style.top = r.bottom + 8 + 'px';
  });
  return btn;
}

export function storage(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
    localStorage.setItem(key, JSON.stringify(value));
  } catch { return null; }
  return value;
}
