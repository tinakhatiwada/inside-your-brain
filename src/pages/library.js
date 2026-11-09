import '../main.js';
import { initTopicCards } from '../components/topic-card.js';
var topicModules = import.meta.glob('../content/topics/*.json', { eager: true });
var topics = Object.values(topicModules).map(function(m) { return m.default; });
var accentMap = { 'neural-communication': 'coral', 'sensory-perception': 'amber', 'memory-learning': 'lavender', 'emotions-cognition': 'rose', 'reasoning-behavior': 'sky', 'brain-networks': 'teal' };
var grid = document.getElementById('dept-grid');
if (grid) {
  grid.innerHTML = topics.map(function(t) {
    var accent = accentMap[t.id] || 'plum';
    var sections = t.sections.map(function(s) { return '<h4>' + s.heading + '</h4><p>' + s.content + '</p>'; }).join('');
    return '<div class="dept-card" data-accent="' + accent + '">' +
      '<style>.dept-card[data-accent="' + accent + '"]::before{background:var(--' + accent + ')}.dept-card[data-accent="' + accent + '"] h3{color:var(--' + accent + ')}</style>' +
      '<span class="dept-icon">' + t.icon + '</span><h3>' + t.name + '</h3><p>' + t.summary + '</p>' +
      '<div class="dept-detail"><div class="dept-detail-inner">' + sections + '</div></div></div>';
  }).join('');
  initTopicCards();
}
