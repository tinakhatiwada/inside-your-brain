// "Ask" drawer: a grounded guide that knows what you're looking at.
// Conversations are saved to localStorage so you can revisit them.
import { h, $, renderPlain, structureChip } from './dom.js';
import { health, streamPost } from './api.js';
import { BY_ID } from '../brain/anatomy.js';

const FOLLOW_UPS = [
  { style: 'simpler', label: 'Simpler', text: 'Can you explain that more simply?' },
  { style: 'analogy', label: 'Give me an analogy', text: 'Can you give me an analogy?' },
  { style: 'deeper', label: 'Go deeper', text: "Go one level deeper. What's really going on?" },
  { style: 'apply', label: 'What can I do with this?', text: 'How can I use this in my everyday life?' },
];

const STORAGE_KEY = 'iyb-conversations';
const MAX_SAVED = 30;

let ui = null;
let state = { context: { page: 'home' }, label: '', suggestions: [], messages: [], key: '' };
let pageDefault = { context: { page: 'home' }, label: '', suggestions: [] };
let controller = null;
let opener = null;
let showingHistory = false;

// --- localStorage helpers ---
function loadConversations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function saveConversation() {
  if (state.messages.length < 2) return; // need at least 1 Q&A
  const convos = loadConversations();
  const title = state.messages[0]?.content?.slice(0, 80) || 'Untitled';
  const existing = convos.findIndex((c) => c.key === state.key);
  const entry = {
    key: state.key,
    title,
    context: state.context,
    label: state.label,
    messages: state.messages,
    updatedAt: Date.now(),
  };
  if (existing >= 0) convos[existing] = entry;
  else convos.unshift(entry);
  // Keep only the most recent conversations
  while (convos.length > MAX_SAVED) convos.pop();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

function deleteConversation(key) {
  const convos = loadConversations().filter((c) => c.key !== key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

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
  const historyBtn = h('button.btn.btn-quiet.btn-icon.ask-history-btn', { type: 'button', 'aria-label': 'Conversation history', title: 'History' }, icon('history'));
  const context = h('p.ask-context');
  const body = h('div.ask-body', { 'aria-live': 'off' });
  const textarea = h('textarea', { rows: '1', placeholder: 'Ask anything about your brain', 'aria-label': 'Your question', maxlength: '600' });
  const send = h('button.btn.btn-primary.btn-icon', { type: 'submit', 'aria-label': 'Send' }, icon('send'));
  const form = h('form.ask-form', {}, textarea, send);
  const live = h('div.visually-hidden', { 'aria-live': 'polite' });
  const panel = h('aside.ask', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ask-title' },
    h('div.ask-head', {}, h('div', {}, h('h2', { id: 'ask-title' }, 'Ask the guide'), context), h('div.ask-head-actions', {}, historyBtn, close)),
    body,
    h('div.ask-foot', {}, form,
      h('p.ask-small', {}, demo ? 'Demo mode: answers are canned examples, not the AI.' : 'Answers are AI-generated from this app\u2019s reviewed notes, and can still be wrong. Don\u2019t share personal or health details.')),
    live,
  );
  const backdrop = h('div.ask-backdrop', { 'aria-hidden': 'true' });
  document.body.append(backdrop, panel);
  ui = { panel, backdrop, close, historyBtn, context, body, textarea, form, send, live };

  close.addEventListener('click', closeAsk);
  backdrop.addEventListener('click', closeAsk);
  historyBtn.addEventListener('click', toggleHistory);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (showingHistory) toggleHistory(); else closeAsk(); }
    if (e.key === 'Tab') trapFocus(e);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(textarea.value); });
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(textarea.value); }
  });
  textarea.addEventListener('input', () => autoGrow(textarea));
}

// --- History view ---
function toggleHistory() {
  showingHistory = !showingHistory;
  if (showingHistory) renderHistory();
  else restoreChat();
}

function renderHistory() {
  const convos = loadConversations();
  const items = [];

  // "New conversation" button
  items.push(h('button.ask-history-item.ask-history-new', { type: 'button', onclick: () => { startNewConversation(); } },
    h('span.ask-history-icon', {}, '+'),
    h('span', {}, 'New conversation'),
  ));

  if (convos.length === 0) {
    items.push(h('p.ask-history-empty', {}, 'No saved conversations yet. Your chats will appear here.'));
  } else {
    for (const c of convos) {
      const time = timeAgo(c.updatedAt);
      const msgCount = c.messages.filter((m) => m.role === 'user').length;
      const del = h('button.btn.btn-quiet.btn-icon.ask-history-delete', { type: 'button', 'aria-label': 'Delete', onclick: (e) => {
        e.stopPropagation();
        deleteConversation(c.key);
        renderHistory();
      }}, icon('close'));
      items.push(h('button.ask-history-item', { type: 'button', onclick: () => { loadConversation(c); } },
        h('div.ask-history-text', {},
          h('span.ask-history-title', {}, c.title),
          h('span.ask-history-meta', {}, `${msgCount} question${msgCount !== 1 ? 's' : ''} · ${time}`),
        ),
        del,
      ));
    }
  }

  ui.body.replaceChildren(
    h('div.ask-history', {},
      h('h3.ask-history-heading', {}, 'Your conversations'),
      ...items,
    )
  );
}

function loadConversation(convo) {
  showingHistory = false;
  controller?.abort();
  state = { context: convo.context, label: convo.label || '', suggestions: [], messages: [...convo.messages], key: convo.key };
  ui.context.replaceChildren(...(convo.label ? ['Asking about ', h('b', {}, convo.label)] : ['Ask about anything you\u2019ve seen here']));
  replayMessages();
}

function startNewConversation() {
  showingHistory = false;
  controller?.abort();
  state = { context: pageDefault.context || { page: 'home' }, label: pageDefault.label || '', suggestions: pageDefault.suggestions || [], messages: [], key: JSON.stringify(pageDefault.context || { page: 'home' }) + '-' + Date.now() };
  ui.context.replaceChildren('Ask about anything you\u2019ve seen here');
  renderIntro();
}

function restoreChat() {
  if (state.messages.length > 0) replayMessages();
  else renderIntro();
}

function replayMessages() {
  // Rebuild the chat UI from saved messages
  const els = [];
  for (const msg of state.messages) {
    if (msg.role === 'user') {
      els.push(h('div.msg.msg-user', {}, msg.content));
    } else {
      const textEl = h('div');
      renderPlain(msg.content, textEl);
      const out = h('div.msg.msg-ai', {}, textEl);
      if (msg.sources?.length) {
        out.append(h('div.msg-meta', {},
          h('span.ai-tag', {}, icon('spark'), 'AI-generated'),
          ['Based on notes about', ...msg.sources.slice(0, 4).map((s) => BY_ID[s.id] && structureChip(s.id, () => goToStructure(s.id)))],
        ));
      }
      els.push(out);
    }
  }
  // Add follow-up buttons after the last message
  els.push(h('div.ask-follow', {}, FOLLOW_UPS.map((f) => h('button.chip', { type: 'button', onclick: () => ask(f.text, f.style) }, f.label))));
  ui.body.replaceChildren(...els);
  scroll();
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/** Open the drawer for a given context. If `question` is set, ask it straight away. */
export function openAsk({ context = { page: 'home' }, label = '', suggestions = [], question } = {}) {
  if (!ui) return;
  showingHistory = false;
  const key = JSON.stringify(context);
  if (key !== state.key) {
    controller?.abort();
    // Check if there's a saved conversation for this context
    const saved = loadConversations().find((c) => c.key === key);
    if (saved) {
      state = { context, label, suggestions, messages: [...saved.messages], key };
      replayMessages();
    } else {
      state = { context, label, suggestions, messages: [], key };
      renderIntro();
    }
  }
  opener = document.activeElement;
  document.documentElement.classList.add('ask-open');
  ui.context.replaceChildren(...(label ? ['Asking about ', h('b', {}, label)] : ['Ask about anything you\u2019ve seen here']));
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
  // Show recent conversations hint
  const convos = loadConversations();
  if (convos.length > 0) {
    intro.push(h('p.ask-history-hint', {}, h('button.btn-link', { type: 'button', onclick: toggleHistory }, `View ${convos.length} saved conversation${convos.length !== 1 ? 's' : ''}`)));
  }
  ui.body.replaceChildren(...intro);
}

async function ask(text, style = 'default') {
  text = String(text || '').trim();
  if (!text || ui.send.disabled) return;
  showingHistory = false;
  ui.textarea.value = '';
  autoGrow(ui.textarea);
  ui.body.querySelector('.ask-intro')?.remove();
  ui.body.querySelector('.ask-suggest')?.remove();
  ui.body.querySelectorAll('.ask-follow').forEach((el) => el.remove());
  ui.body.querySelector('.ask-history-hint')?.remove();

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
    error = 'Couldn\u2019t reach the server. Check your connection and try again.';
  } finally {
    ui.send.disabled = false;
  }

  if (error && !answer) {
    out.replaceChildren(h('p.msg-error', {}, error));
    state.messages.pop();
    return;
  }
  state.messages.push({ role: 'assistant', content: answer, sources });
  out.append(h('div.msg-meta', {},
    h('span.ai-tag', {}, icon('spark'), 'AI-generated'),
    sources.length ? ['Based on notes about', ...sources.slice(0, 4).map((s) => BY_ID[s.id] && structureChip(s.id, () => goToStructure(s.id)))] : null,
  ));
  ui.body.append(h('div.ask-follow', {}, FOLLOW_UPS.map((f) => h('button.chip', { type: 'button', onclick: () => ask(f.text, f.style) }, f.label))));
  ui.live.textContent = 'The guide has answered.';
  scroll();

  // Save after each answer
  saveConversation();
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
    history: 'M12 8v4l3 3M3 12a9 9 0 1 0 3-6.7M3 3v4h4',
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
