/**
 * SM-2 Spaced Repetition Algorithm
 * Based on Piotr Wozniak's SuperMemo 2 algorithm.
 *
 * Quality ratings:
 *   0 = complete blackout
 *   1 = incorrect, but recognized answer
 *   2 = incorrect, but easy to recall after seeing answer
 *   3 = correct with significant difficulty
 *   4 = correct with some hesitation
 *   5 = perfect, instant recall
 */

/** Default card state for a new question */
export function createCard(questionId) {
  return {
    id: questionId,
    easeFactor: 2.5,  // Starting ease factor
    interval: 0,       // Days until next review
    repetition: 0,     // Number of consecutive correct reviews
    nextReview: Date.now(), // When to show next
    lastReview: null,
    totalReviews: 0,
    correctCount: 0,
    streak: 0,
  };
}

/**
 * Process a review and return updated card state
 * @param {Object} card - Current card state
 * @param {number} quality - Rating 0-5
 * @returns {Object} Updated card state
 */
export function reviewCard(card, quality) {
  var updated = Object.assign({}, card);
  updated.totalReviews++;
  updated.lastReview = Date.now();

  if (quality >= 3) {
    // Correct response
    updated.correctCount++;
    updated.streak++;

    if (updated.repetition === 0) {
      updated.interval = 1;
    } else if (updated.repetition === 1) {
      updated.interval = 6;
    } else {
      updated.interval = Math.round(updated.interval * updated.easeFactor);
    }
    updated.repetition++;
  } else {
    // Incorrect — reset
    updated.repetition = 0;
    updated.interval = 0;
    updated.streak = 0;
  }

  // Update ease factor (never below 1.3)
  updated.easeFactor = Math.max(1.3,
    updated.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Set next review time
  updated.nextReview = Date.now() + updated.interval * 24 * 60 * 60 * 1000;

  return updated;
}

/**
 * Get cards due for review
 * @param {Array} cards - All card states
 * @returns {Array} Cards due now, sorted by priority
 */
export function getDueCards(cards) {
  var now = Date.now();
  return cards
    .filter(function(c) { return c.nextReview <= now; })
    .sort(function(a, b) {
      // Priority: new cards first, then overdue, then by ease (harder first)
      if (a.repetition === 0 && b.repetition > 0) return -1;
      if (b.repetition === 0 && a.repetition > 0) return 1;
      return a.easeFactor - b.easeFactor;
    });
}

/**
 * Calculate overall mastery percentage
 * @param {Array} cards - All card states
 * @returns {number} 0-100 mastery percentage
 */
export function calculateMastery(cards) {
  if (cards.length === 0) return 0;
  var mastered = cards.filter(function(c) { return c.repetition >= 3 && c.easeFactor >= 2.0; }).length;
  var learning = cards.filter(function(c) { return c.repetition > 0 && c.repetition < 3; }).length;
  return Math.round(((mastered * 1.0 + learning * 0.4) / cards.length) * 100);
}

/**
 * Get learning stats
 */
export function getStats(cards) {
  var now = Date.now();
  return {
    total: cards.length,
    new: cards.filter(function(c) { return c.repetition === 0 && c.totalReviews === 0; }).length,
    learning: cards.filter(function(c) { return c.repetition > 0 && c.repetition < 3; }).length,
    mastered: cards.filter(function(c) { return c.repetition >= 3; }).length,
    due: cards.filter(function(c) { return c.nextReview <= now; }).length,
    mastery: calculateMastery(cards),
    totalReviews: cards.reduce(function(sum, c) { return sum + c.totalReviews; }, 0),
    longestStreak: Math.max.apply(null, cards.map(function(c) { return c.streak; }).concat([0])),
  };
}
