import './styles/components.css';
import './styles/quiz.css';
import './styles/tutor.css';
import { initNav } from './components/nav.js';
import { initTutorDrawer } from './components/tutor-drawer.js';

initNav();

// Tutor drawer (all pages)
initTutorDrawer();

// Reveal-on-scroll
var observer = new IntersectionObserver(
  function(entries) { entries.forEach(function(e) {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  }); },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });

// Check AI availability
fetch('/api/health').then(function(r) { return r.json(); }).then(function(d) {
  if (!d.ai) document.querySelectorAll('[data-ai]').forEach(function(el) { el.style.display = 'none'; });
}).catch(function() {
  document.querySelectorAll('[data-ai]').forEach(function(el) { el.style.display = 'none'; });
});
