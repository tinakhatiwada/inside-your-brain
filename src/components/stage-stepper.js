export function initStageStepper(stages) {
  var stageEls = document.querySelectorAll('.journey-stage');
  var activeIdx = 0, playing = false, timer = null;
  function setActive(idx) {
    activeIdx = idx;
    stageEls.forEach(function(s, i) { s.classList.toggle('active', i === idx); });
    stageEls[idx] && stageEls[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  stageEls.forEach(function(s, i) { s.addEventListener('click', function() { stopAutoPlay(); setActive(i); }); });
  var prevBtn = document.getElementById('j-prev');
  var nextBtn = document.getElementById('j-next');
  var playBtn = document.getElementById('j-play');
  if (prevBtn) prevBtn.addEventListener('click', function() { stopAutoPlay(); setActive(Math.max(0, activeIdx - 1)); });
  if (nextBtn) nextBtn.addEventListener('click', function() { stopAutoPlay(); setActive(Math.min(stageEls.length - 1, activeIdx + 1)); });
  if (playBtn) playBtn.addEventListener('click', function() { playing ? stopAutoPlay() : startAutoPlay(); });
  function startAutoPlay() { playing = true; if (playBtn) { playBtn.textContent = '\u23f8 Pause'; playBtn.classList.add('active-ctrl'); } advance(); }
  function stopAutoPlay() { playing = false; clearTimeout(timer); if (playBtn) { playBtn.textContent = '\u25b6 Auto Play'; playBtn.classList.remove('active-ctrl'); } }
  function advance() { if (!playing) return; setActive((activeIdx + 1) % stageEls.length); timer = setTimeout(advance, 5000); }
  setActive(0);
  return { setActive: setActive, startAutoPlay: startAutoPlay, stopAutoPlay: stopAutoPlay };
}
