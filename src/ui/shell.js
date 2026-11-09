// Shared page setup: styles, current nav link, and the Ask drawer.
import '../styles/base.css';
import '../styles/components.css';
import '../styles/pages.css';
import { initAsk } from './ask.js';

const here = location.pathname.replace(/\/$/, '/index.html');
document.querySelectorAll('.nav-links a').forEach((a) => {
  if (new URL(a.href).pathname === here) a.setAttribute('aria-current', 'page');
});

export const aiReady = initAsk();
