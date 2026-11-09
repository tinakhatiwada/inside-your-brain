/**
 * AI Tutor Drawer — Ask questions grounded in course content.
 * Only visible when VITE_AI_ENABLED=true and server has API key.
 */

export function initTutorDrawer() {
  var fab = document.createElement('button');
  fab.className = 'tutor-fab';
  fab.setAttribute('data-ai', 'true');
  fab.setAttribute('aria-label', 'Open AI Tutor');
  fab.innerHTML = '\ud83e\udde0';
  fab.title = 'Ask the AI Tutor';
  document.body.appendChild(fab);

  var drawer = document.createElement('div');
  drawer.className = 'tutor-drawer';
  drawer.setAttribute('data-ai', 'true');
  drawer.innerHTML = [
    '<div class="tutor-header">',
    '  <h3>\ud83e\udde0 AI Tutor</h3>',
    '  <span class="tutor-badge">Grounded in course content</span>',
    '  <button class="tutor-close" id="tutor-close">\u2715</button>',
    '</div>',
    '<div class="tutor-messages" id="tutor-messages">',
    '  <div class="tutor-msg tutor-msg-ai">Hi! I can answer questions about neuroscience based on the course material. What would you like to know?</div>',
    '</div>',
    '<form class="tutor-input-form" id="tutor-form">',
    '  <input type="text" class="tutor-input" id="tutor-input" placeholder="Ask about the brain..." maxlength="1000" autocomplete="off">',
    '  <button type="submit" class="tutor-send">\u2192</button>',
    '</form>',
  ].join('\n');
  document.body.appendChild(drawer);

  var isOpen = false;
  fab.addEventListener('click', function() { isOpen = !isOpen; drawer.classList.toggle('open', isOpen); fab.classList.toggle('active', isOpen); });
  document.getElementById('tutor-close').addEventListener('click', function() { isOpen = false; drawer.classList.remove('open'); fab.classList.remove('active'); });

  var form = document.getElementById('tutor-form');
  var input = document.getElementById('tutor-input');
  var messagesEl = document.getElementById('tutor-messages');

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Add user message
    var userMsg = document.createElement('div');
    userMsg.className = 'tutor-msg tutor-msg-user';
    userMsg.textContent = text;
    messagesEl.appendChild(userMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Add loading
    var loadingMsg = document.createElement('div');
    loadingMsg.className = 'tutor-msg tutor-msg-ai tutor-loading';
    loadingMsg.textContent = 'Thinking...';
    messagesEl.appendChild(loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      var res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      var data = await res.json();
      loadingMsg.classList.remove('tutor-loading');
      loadingMsg.textContent = data.reply || data.message || 'AI features are not yet configured. Set ANTHROPIC_API_KEY in your .env file to enable the tutor.';
    } catch (err) {
      loadingMsg.classList.remove('tutor-loading');
      loadingMsg.textContent = 'Could not reach the AI server. Make sure the API server is running (npm run dev:api).';
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });
}
