import * as THREE from 'three';
import { getLobeFromPoint } from './brain-model.js';
export function initRegionPicker(renderer, camera, meshes, modelBBox, onSelect, onHover) {
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var canvas = renderer.domElement;
  var ptrStart = { x: 0, y: 0 }, ptrMoved = false;
  canvas.addEventListener('pointerdown', function(e) { ptrStart = { x: e.clientX, y: e.clientY }; ptrMoved = false; });
  canvas.addEventListener('pointermove', function(e) {
    if (!ptrMoved && Math.hypot(e.clientX - ptrStart.x, e.clientY - ptrStart.y) > 5) ptrMoved = true;
    var rect = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(meshes);
    if (hits.length > 0) { onHover(getLobeFromPoint(hits[0].point.clone(), modelBBox)); canvas.style.cursor = 'pointer'; }
    else { onHover(-1); canvas.style.cursor = 'grab'; }
  });
  canvas.addEventListener('pointerup', function(e) {
    if (ptrMoved) return;
    var rect = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(meshes);
    if (hits.length > 0) onSelect(getLobeFromPoint(hits[0].point.clone(), modelBBox));
  });
}
