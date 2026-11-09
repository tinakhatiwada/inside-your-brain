import '../main.js';
import { initStageStepper } from '../components/stage-stepper.js';
var stageModules = import.meta.glob('../content/stages/*.json', { eager: true });
var stages = Object.values(stageModules).map(function(m) { return m.default; }).sort(function(a, b) { return a.order - b.order; });
var timeline = document.getElementById('journey-timeline');
if (timeline) {
  timeline.innerHTML = stages.map(function(s, i) {
    var cls = i === 0 ? ' active' : '';
    var structs = s.structures.map(function(st) { return '<span>' + st + '</span>'; }).join('');
    return '<div class="journey-stage' + cls + '" data-stage="' + i + '">' +
      '<div class="stage-marker" style="border-color:' + s.color + ';color:' + s.color + '">' + s.icon + '</div>' +
      '<div class="stage-content"><h3 style="color:' + s.color + '">' + s.order + '. ' + s.name + '</h3>' +
      '<p>' + s.summary + '</p>' +
      '<div class="stage-detail"><p>' + s.description + '</p>' +
      '<div class="stage-regions">' + structs + '</div></div></div></div>';
  }).join('');
  initStageStepper(stages);
}
