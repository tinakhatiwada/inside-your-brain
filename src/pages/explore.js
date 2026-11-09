import '../main.js';
import { createScene } from '../three/scene.js';
import { loadBrainModel } from '../three/brain-model.js';
import { initRegionPicker } from '../three/region-picker.js';
import { highlightRegion, resetHighlight } from '../three/highlight.js';
import { showRegionPanel, hideRegionPanel } from '../components/region-panel.js';
import frontal from '../content/regions/frontal.json';
import parietal from '../content/regions/parietal.json';
import temporal from '../content/regions/temporal.json';
import occipital from '../content/regions/occipital.json';
import cerebellum from '../content/regions/cerebellum.json';
import brainstem from '../content/regions/brainstem.json';

var regions = [frontal, parietal, temporal, occipital, cerebellum, brainstem];
var panel = document.getElementById('brain-info-panel');
var meshesArr = [], modelBBox = null, brainModel = null, selectedIdx = -1;
var container = document.getElementById('brain-canvas');
var result = createScene(container);
var scene = result.scene, camera = result.camera, renderer = result.renderer, controls = result.controls, clock = result.clock;

var legendEl = document.getElementById('brain-legend');
legendEl.innerHTML = regions.map(function(r, i) {
  return '<div class="brain-legend-item" data-i="' + i + '"><div class="brain-legend-dot" style="background:' + r.color + '"></div>' + r.name.split('(')[0].trim() + '</div>';
}).join('');
legendEl.querySelectorAll('.brain-legend-item').forEach(function(el) {
  el.addEventListener('click', function() { selectLobe(+el.dataset.i); });
});

var loadingEl = document.getElementById('loading-text');
loadBrainModel(scene, regions,
  function(pct) { if (loadingEl) loadingEl.textContent = 'Loading... ' + pct + '%'; },
  function(res) {
    brainModel = res.model; meshesArr = res.meshes; modelBBox = res.modelBBox;
    if (loadingEl) loadingEl.style.display = 'none';
    initRegionPicker(renderer, camera, meshesArr, modelBBox,
      function(idx) { selectLobe(idx); },
      function(idx) {}
    );
  }
);

function selectLobe(idx) {
  if (idx < 0 || idx >= regions.length) return;
  selectedIdx = idx; controls.autoRotate = false;
  highlightRegion(meshesArr, regions, idx, modelBBox);
  showRegionPanel(regions[idx], panel);
}
function resetView() {
  resetHighlight(meshesArr, regions, modelBBox);
  selectedIdx = -1; controls.autoRotate = true;
  hideRegionPanel(panel);
}
document.getElementById('brain-back-btn').addEventListener('click', resetView);

function tick() {
  requestAnimationFrame(tick);
  var t = clock.getElapsedTime();
  if (selectedIdx < 0 && brainModel) {
    var s = 1 + Math.sin(t * 0.8) * 0.004;
    brainModel.scale.setScalar(1.5 * s);
  }
  controls.update();
  renderer.render(scene, camera);
}
tick();
