export function initTopicCards() {
  document.querySelectorAll('.dept-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var wasExpanded = card.classList.contains('expanded');
      document.querySelectorAll('.dept-card.expanded').forEach(function(c) { c.classList.remove('expanded'); });
      if (!wasExpanded) card.classList.add('expanded');
    });
  });
}
