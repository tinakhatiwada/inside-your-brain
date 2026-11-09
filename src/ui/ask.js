// "Ask" drawer: a grounded guide that knows what you're looking at.
import { h, $, renderPlain, structureChip } from './dom.js';
import { health, streamPost } from './api.js';
import { BY_ID } from '../brain/anatomy.js';

const FOLLOW_UPS = [
  { style: 'simpler', label: 'Simpler', text: 'Can you explain that more simply?' },
  { style: 'analogy', label: 'Give me an analogy', text: 'Can you give me an analogy?' },
  { style: 'deeper', label: 'Go deeper', text: 'Go one level deeper. What’s really going on?' },
  { style: 'apply', label: 'What can I do with this?', text: 'How can I use this in my everyday life?' },
];

let ui = null;
let state = { context: { page: 'home' }, label: '', suggestions: [], messages: [], key: '' };
let pageDefault = { context: { page: 'home' }, label: '', suggestions: [] };
let controller = null;
let opener = null;

export function setPageContext(ctx) { pageDefault = ctx; }

export async function initAsk() {
  const { ai, demo } = await health();
  document.documentElement.classList.toggle('has-ai', ai);
  if (!ai) return false;
  build(demo);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ask-open]');
    if (t) { e.preventDefault(); openAsk(pageDefault); }
  });
  return true;
}

function build(demo) {
  const close = h('button.btn.btn-quiet.btn-icon.ask-close', { type: 'button', 'aria-label': 'Close' }, icon('close'));
  const context = h('p.ask-context');
  const body = h('div.ask-body', { 'aria-live': 'off' });
  const textarea = h('textarea', { rows: '1', placeholder: 'Ask anything about your brain', 'aria-label': 'Your question', maxlength: '600' });
  const send = h('button.btn.btn-primary.btn-icon', { type: 'submit', 'aria-label': 'Send' }, icon('send'));
  const form = h('form.ask-form', {}, textarea, send);
  const live = h('div.visually-hidden', { 'aria-live': 'polite' });
  const panel = h('aside.ask', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ask-title' },
    h('div.ask-head', {}, h('div', {}, h('h2', { id: 'ask-title' }, 'Ask the guide'), context), close),
    body,
    h('div.ask-foot', {}, form,
      h('p.ask-small', {}, demo ? 'Demo mode: answers are canned examples, not the AI.' : 'Answers are AI-generated from this app’s reviewed notes, and can still be wrong. Don’t share personal or health details.')),
    live,
  );
  const backdrop = h('div.ask-backdrop', { 'aria-hidden': 'true' });
  document.body.append(backdrop, panel);
  ui = { panel, backdrop, close, context, body, textarea, form, send, live };

  close.addEventListener('click', closeAsk);
  backdrop.addEventListener('click', closeAsk);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAsk();
    if (e.key === 'Tab') trapFocus(e);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(textarea.value); });
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(textarea.value); }
  });
  textarea.addEventListener('input', () => autoGrow(textarea));
}

/** Open the drawer for a given context. If `question` is set, ask it straight away. */
export function openAsk({ context = { page: 'home' }, label = '', suggestions = [], question } = {}) {
  if (!ui) return;
  const key = JSON.stringify(context);
  if (key !== state.key) {
    controller?.abort();
    state = { context, label, suggestions, messages: [], key };
    renderIntro();
  }
  opener = document.activeElement;
  document.documentElement.classList.add('ask-open');
  ui.context.replaceChildren(...(label ? ['Asking about ', h('b', {}, label)] : ['Ask about anything you’ve seen here']));
  setTimeout(() => ui.textarea.focus(), 60);
  if (question) ask(question);
}

export function closeAsk() {
  document.documentElement.classList.remove('ask-open');
  if (opener && document.contains(opener)) opener.focus();
}

function renderIntro() {
  const intro = [h('p.ask-intro', {}, 'Ask a question in your own words. The guide answers from the notes behind this app and tells you which brain areas it used.')];
  if (state.suggestions.length) intro.push(h('div.ask-suggest', {}, state.suggestions.map((q) => h('button', { type: 'button', onclick: () => ask(q) }, q))));
  ui.body.replaceChildren(...intro);
}

async function ask(text, style = 'default') {
  text = String(text || '').trim();
  if (!text || ui.send.disabled) return;
  ui.textarea.value = '';
  autoGrow(ui.textarea);
  ui.body.querySelector('.ask-intro')?.remove();
  ui.body.querySelector('.ask-suggest')?.remove();
  ui.body.querySelectorAll('.ask-follow').forEach((el) => el.remove());

  state.messages.push({ role: 'user', content: text });
  ui.body.append(h('div.msg.msg-user', {}, text));
  const out = h('div.msg.msg-ai');
  const thinking = h('p.msg-thinking', {}, 'Thinking');
  out.append(thinking);
  ui.body.append(out);
  scroll();

  ui.send.disabled = true;
  controller = new AbortController();
  let answer = '';
  let sources = [];
  let error = null;
  const textEl = h('div');
  try {
    await streamPost('/api/ask', { messages: state.messages, context: state.context, style }, (ev) => {
      if (ev.type === 'delta') {
        if (!answer) out.replaceChildren(textEl);
        answer += ev.text;
        renderPlain(answer, textEl);
        scroll(true);
      } else if (ev.type === 'done') sources = ev.sources || [];
      else if (ev.type === 'error') error = ev.error;
    }, controller.signal);
  } catch (e) {
    if (e.name === 'AbortError') return;
    error = 'Couldn’t reach the server. Check your connection and try again.';
  } finally {
    ui.send.disabled = false;
  }

  if (error && !answer) {
    out.replaceChildren(h('p.msg-error', {}, error));
    state.messages.pop();
    return;
  }
  state.messages.push({ role: 'assistant', content: answer });
  out.append(h('div.msg-meta', {},
    h('span.ai-tag', {}, icon('spark'), 'AI-generated'),
    sources.length ? ['Based on notes about', ...sources.slice(0, 4).map((s) => BY_ID[s.id] && structureChip(s.id, () => goToStructure(s.id)))] : null,
  ));
  ui.body.append(h('div.ask-follow', {}, FOLLOW_UPS.map((f) => h('button.chip', { type: 'button', onclick: () => ask(f.text, f.style) }, f.label))));
  ui.live.textContent = 'The guide has answered.';
  scroll();
}

function goToStructure(id) {
  if (location.pathname.endsWith('/explore.html') && window.__selectStructure) { window.__selectStructure(id); closeAsk(); return; }
  location.href = `/explore.html#${id}`;
}

function scroll(onlyIfNear = false) {
  const b = ui.body;
  if (onlyIfNear && b.scrollHeight - b.scrollTop - b.clientHeight > 160) return;
  b.scrollTop = b.scrollHeight;
}

function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }

function trapFocus(e) {
  const f = [...ui.panel.querySelectorAll('button, textarea, a[href], [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0]; const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

export function icon(name) {
  const paths = {
    close: 'M6 6l12 12M18 6L6 18',
    send: 'M5 12h13M13 6l6 6-6 6',
    spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
    play: 'M8 5.5v13l10.5-6.5z',
    pause: 'M8 5v14M16 5v14',
    prev: 'M15 6l-6 6 6 6',
    next: 'M9 6l6 6-6 6',
    restart: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4',
    share: 'M12 4v11M7 9l5-5 5 5M5 14v5h14v-5',
    ask: 'M5 5h14v10H9l-4 4z',
  };
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', name === 'play' ? 'currentColor' : 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', name === 'pause' ? '2.6' : '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', paths[name]);
  svg.append(p);
  return svg;
}
