import '../main.js';
import { createCard, reviewCard, getDueCards, getStats } from '../learning/srs.js';
import { getAllCards, saveCard, saveCards, saveSession } from '../learning/progress.js';
import { exportJSON, exportMarkdown, importJSON } from '../learning/export.js';

// Load all questions
var questionModules = import.meta.glob('../content/questions/*.json', { eager: true });
var allQuestions = [];
Object.values(questionModules).forEach(function(m) {
  var qs = m.default || m;
  if (Array.isArray(qs)) allQuestions = allQuestions.concat(qs);
});

var container = document.getElementById('quiz-container');
var state = { cards: [], currentQ: null, currentCard: null, answered: false, sessionCorrect: 0, sessionTotal: 0, mode: 'menu' };

async function init() {
  state.cards = await getAllCards();
  // Initialize cards for any new questions
  var existingIds = {};
  state.cards.forEach(function(c) { existingIds[c.id] = true; });
  var newCards = [];
  allQuestions.forEach(function(q) {
    if (!existingIds[q.id]) {
      var card = createCard(q.id);
      newCards.push(card);
      state.cards.push(card);
    }
  });
  if (newCards.length > 0) await saveCards(newCards);
  showMenu();
}

function getQuestion(id) {
  return allQuestions.find(function(q) { return q.id === id; });
}

function showMenu() {
  state.mode = 'menu';
  var stats = getStats(state.cards);
  var due = getDueCards(state.cards);
  container.innerHTML = [
    '<div class="quiz-menu">',
    '  <div class="quiz-stats-grid">',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--plum-300)">' + stats.mastery + '%</span><span class="quiz-stat-label">Mastery</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--teal)">' + stats.mastered + '</span><span class="quiz-stat-label">Mastered</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--gold-300)">' + stats.learning + '</span><span class="quiz-stat-label">Learning</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--text-muted)">' + stats.new + '</span><span class="quiz-stat-label">New</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--coral)">' + stats.due + '</span><span class="quiz-stat-label">Due Now</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--sky)">' + stats.totalReviews + '</span><span class="quiz-stat-label">Reviews</span></div>',
    '  </div>',
    '  <div class="quiz-mastery-bar"><div class="quiz-mastery-fill" style="width:' + stats.mastery + '%"></div></div>',
    '  <div class="quiz-actions">',
    due.length > 0 ? '    <button class="btn-primary" id="q-review">Review Due (' + due.length + ') ⚡</button>' : '    <button class="btn-primary" id="q-review" disabled style="opacity:0.5">No Cards Due ✓</button>',
    '    <button class="btn-outline" id="q-practice">Practice All 🧠</button>',
    '    <button class="btn-outline" id="q-new">New Cards Only 🆕</button>',
    '  </div>',
    '  <div class="quiz-tools">',
    '    <button class="quiz-tool-btn" id="q-export-json">Export JSON</button>',
    '    <button class="quiz-tool-btn" id="q-export-md">Export Markdown</button>',
    '    <label class="quiz-tool-btn" id="q-import-label">Import<input type="file" accept=".json" id="q-import" style="display:none"></label>',
    '  </div>',
    '</div>',
  ].join('\n');

  var reviewBtn = document.getElementById('q-review');
  if (reviewBtn && due.length > 0) reviewBtn.addEventListener('click', function() { startQuiz('due'); });
  var practiceBtn = document.getElementById('q-practice');
  if (practiceBtn) practiceBtn.addEventListener('click', function() { startQuiz('all'); });
  var newBtn = document.getElementById('q-new');
  if (newBtn) newBtn.addEventListener('click', function() { startQuiz('new'); });

  document.getElementById('q-export-json').addEventListener('click', exportJSON);
  document.getElementById('q-export-md').addEventListener('click', exportMarkdown);
  document.getElementById('q-import').addEventListener('change', async function(e) {
    if (e.target.files[0]) {
      try {
        var result = await importJSON(e.target.files[0]);
        alert('Imported ' + result.imported + ' cards from ' + result.date);
        state.cards = await getAllCards();
        showMenu();
      } catch(err) { alert('Import failed: ' + err.message); }
    }
  });
}

function startQuiz(mode) {
  state.sessionCorrect = 0;
  state.sessionTotal = 0;
  var pool;
  if (mode === 'due') {
    pool = getDueCards(state.cards);
  } else if (mode === 'new') {
    pool = state.cards.filter(function(c) { return c.repetition === 0 && c.totalReviews === 0; });
  } else {
    pool = state.cards.slice();
    // Shuffle
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = pool[i]; pool[i] = pool[j]; pool[j] = temp;
    }
  }
  state.pool = pool;
  state.poolIdx = 0;
  showNextQuestion();
}

function showNextQuestion() {
  if (state.poolIdx >= state.pool.length) {
    showResults();
    return;
  }
  state.answered = false;
  state.currentCard = state.pool[state.poolIdx];
  state.currentQ = getQuestion(state.currentCard.id);

  if (!state.currentQ) {
    state.poolIdx++;
    showNextQuestion();
    return;
  }

  var q = state.currentQ;
  var progress = (state.poolIdx + 1) + ' / ' + state.pool.length;
  var diffStars = '';
  for (var d = 0; d < q.difficulty; d++) diffStars += '★';
  for (var d2 = q.difficulty; d2 < 3; d2++) diffStars += '☆';

  container.innerHTML = [
    '<div class="quiz-card-wrap">',
    '  <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:' + ((state.poolIdx / state.pool.length) * 100) + '%"></div></div>',
    '  <div class="quiz-header-row">',
    '    <span class="quiz-counter">' + progress + '</span>',
    '    <span class="quiz-diff">' + diffStars + '</span>',
    '    <button class="quiz-exit-btn" id="q-exit">✕</button>',
    '  </div>',
    '  <div class="quiz-question">' + q.question + '</div>',
    '  <div class="quiz-options" id="quiz-options">',
    q.options.map(function(opt, i) {
      return '    <button class="quiz-option" data-idx="' + i + '">' + String.fromCharCode(65 + i) + '. ' + opt + '</button>';
    }).join('\n'),
    '  </div>',
    '  <div class="quiz-feedback" id="quiz-feedback" style="display:none"></div>',
    '  <button class="btn-primary quiz-next-btn" id="q-next" style="display:none">Next →</button>',
    '</div>',
  ].join('\n');

  document.querySelectorAll('.quiz-option').forEach(function(btn) {
    btn.addEventListener('click', function() { handleAnswer(parseInt(btn.dataset.idx)); });
  });
  document.getElementById('q-exit').addEventListener('click', function() {
    if (state.sessionTotal > 0) showResults();
    else showMenu();
  });
}

function handleAnswer(selectedIdx) {
  if (state.answered) return;
  state.answered = true;
  state.sessionTotal++;
  var q = state.currentQ;
  var correct = selectedIdx === q.answer;
  if (correct) state.sessionCorrect++;

  // SM-2 quality rating
  var quality = correct ? 4 : 1;
  var updated = reviewCard(state.currentCard, quality);
  // Update in state
  for (var i = 0; i < state.cards.length; i++) {
    if (state.cards[i].id === updated.id) { state.cards[i] = updated; break; }
  }
  saveCard(updated);

  // Highlight options
  document.querySelectorAll('.quiz-option').forEach(function(btn) {
    var idx = parseInt(btn.dataset.idx);
    btn.disabled = true;
    if (idx === q.answer) btn.classList.add('correct');
    else if (idx === selectedIdx && !correct) btn.classList.add('incorrect');
  });

  // Show feedback
  var fb = document.getElementById('quiz-feedback');
  fb.style.display = 'block';
  fb.innerHTML = (correct ? '<strong style="color:var(--sage)">✓ Correct!</strong>' : '<strong style="color:var(--coral)">✗ Incorrect</strong>') + '<p>' + q.explanation + '</p>';

  var nextBtn = document.getElementById('q-next');
  nextBtn.style.display = 'inline-flex';
  nextBtn.addEventListener('click', function() {
    state.poolIdx++;
    showNextQuestion();
  });
}

function showResults() {
  var pct = state.sessionTotal > 0 ? Math.round((state.sessionCorrect / state.sessionTotal) * 100) : 0;
  var stats = getStats(state.cards);

  saveSession({ correct: state.sessionCorrect, total: state.sessionTotal, mastery: stats.mastery });

  var grade = pct >= 90 ? '🌟 Outstanding!' : pct >= 70 ? '👍 Great job!' : pct >= 50 ? '📚 Keep practicing!' : '💪 Don\'t give up!';

  container.innerHTML = [
    '<div class="quiz-results">',
    '  <h2>' + grade + '</h2>',
    '  <div class="quiz-score-ring">',
    '    <svg viewBox="0 0 120 120">',
    '      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>',
    '      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--plum-300)" stroke-width="8" stroke-dasharray="' + (326.7 * pct / 100) + ' 326.7" stroke-linecap="round" transform="rotate(-90 60 60)" style="transition:stroke-dasharray 1s ease"/>',
    '    </svg>',
    '    <span class="quiz-score-text">' + pct + '%</span>',
    '  </div>',
    '  <p>' + state.sessionCorrect + ' correct out of ' + state.sessionTotal + ' questions</p>',
    '  <div class="quiz-stats-grid" style="margin-top:24px">',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--plum-300)">' + stats.mastery + '%</span><span class="quiz-stat-label">Overall Mastery</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--teal)">' + stats.mastered + '</span><span class="quiz-stat-label">Mastered</span></div>',
    '    <div class="quiz-stat"><span class="quiz-stat-num" style="color:var(--coral)">' + stats.due + '</span><span class="quiz-stat-label">Due Now</span></div>',
    '  </div>',
    '  <div class="quiz-actions" style="margin-top:24px">',
    '    <button class="btn-primary" id="q-again">Quiz Again 🔄</button>',
    '    <button class="btn-outline" id="q-menu">Back to Menu</button>',
    '  </div>',
    '</div>',
  ].join('\n');

  document.getElementById('q-again').addEventListener('click', function() { startQuiz('all'); });
  document.getElementById('q-menu').addEventListener('click', showMenu);
}

init();
