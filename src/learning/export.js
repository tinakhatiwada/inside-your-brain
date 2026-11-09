/**
 * Export/Import learning progress as JSON or Markdown
 */
import { getAllCards, saveCards, getAllSessions, clearAll } from './progress.js';
import { getStats } from './srs.js';

/** Export progress as JSON */
export async function exportJSON() {
  var cards = await getAllCards();
  var sessions = await getAllSessions();
  var stats = getStats(cards);
  var data = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    stats: stats,
    cards: cards,
    sessions: sessions,
  };
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, 'brain-progress-' + formatDate(new Date()) + '.json');
}

/** Export progress as Markdown report */
export async function exportMarkdown() {
  var cards = await getAllCards();
  var sessions = await getAllSessions();
  var stats = getStats(cards);
  var lines = [
    '# Inside the Brain — Learning Progress',
    '',
    'Exported: ' + new Date().toISOString(),
    '',
    '## Stats',
    '- Total questions: ' + stats.total,
    '- Mastered: ' + stats.mastered,
    '- Learning: ' + stats.learning,
    '- New: ' + stats.new,
    '- Due for review: ' + stats.due,
    '- Mastery: ' + stats.mastery + '%',
    '- Total reviews: ' + stats.totalReviews,
    '- Longest streak: ' + stats.longestStreak,
    '',
    '## Card Details',
    '| Question ID | Ease | Interval (days) | Reps | Streak |',
    '|---|---|---|---|---|',
  ];
  cards.forEach(function(c) {
    lines.push('| ' + c.id + ' | ' + c.easeFactor.toFixed(2) + ' | ' + c.interval + ' | ' + c.repetition + ' | ' + c.streak + ' |');
  });
  var blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  downloadBlob(blob, 'brain-progress-' + formatDate(new Date()) + '.md');
}

/** Import progress from JSON file */
export async function importJSON(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = async function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data.cards || !Array.isArray(data.cards)) {
          reject(new Error('Invalid progress file'));
          return;
        }
        await clearAll();
        await saveCards(data.cards);
        resolve({ imported: data.cards.length, date: data.exportDate });
      } catch (err) { reject(err); }
    };
    reader.onerror = function() { reject(reader.error); };
    reader.readAsText(file);
  });
}

function downloadBlob(blob, filename) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
