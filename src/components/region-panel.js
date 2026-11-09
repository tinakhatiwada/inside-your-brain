export function showRegionPanel(region, panel) {
  panel.querySelector('#info-dot').style.background = region.color;
  panel.querySelector('#info-name').textContent = region.name;
  panel.querySelector('#info-name').style.color = region.color;
  var fns = region.functions.map(function(f) { return '<span class="brain-fn-tag">' + f + '</span>'; }).join('');
  panel.querySelector('#info-fns').innerHTML = fns;
  panel.querySelector('#info-desc').innerHTML = '<p>' + (region.detailedDescription || region.summary) + '</p>';
  panel.querySelector('#info-fact').innerHTML = '<strong>\ud83d\udca1 Fun fact:</strong> ' + (region.facts[0] ? region.facts[0].text : '');
  var connEl = panel.querySelector('#info-conn-text');
  if (connEl && region.connections) {
    connEl.innerHTML = region.connections.map(function(c) { return '<strong>' + c.via + '</strong> \u2192 ' + c.to + ': ' + c.note; }).join('<br>');
  }
  panel.classList.add('active');
}
export function hideRegionPanel(panel) {
  panel.classList.remove('active');
}
