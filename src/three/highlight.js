import * as THREE from 'three';
import { getLobeFromPoint } from './brain-model.js';
export function highlightRegion(meshes, regions, selectedIdx, modelBBox) {
  var lobeColors = regions.map(function(r) { return new THREE.Color(r.color); });
  meshes.forEach(function(mesh) {
    var pos = mesh.geometry.attributes.position;
    var colAttr = mesh.geometry.attributes.color;
    if (!colAttr) return;
    for (var i = 0; i < pos.count; i++) {
      var pt = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      var vertIdx = getLobeFromPoint(pt, modelBBox);
      var c = vertIdx === selectedIdx ? lobeColors[vertIdx] : lobeColors[vertIdx].clone().multiplyScalar(0.12);
      colAttr.setXYZ(i, c.r, c.g, c.b);
    }
    colAttr.needsUpdate = true;
  });
}
export function resetHighlight(meshes, regions, modelBBox) {
  var lobeColors = regions.map(function(r) { return new THREE.Color(r.color); });
  meshes.forEach(function(mesh) {
    var pos = mesh.geometry.attributes.position;
    var colAttr = mesh.geometry.attributes.color;
    if (!colAttr) return;
    for (var i = 0; i < pos.count; i++) {
      var pt = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      var c = lobeColors[getLobeFromPoint(pt, modelBBox)];
      colAttr.setXYZ(i, c.r, c.g, c.b);
    }
    colAttr.needsUpdate = true;
  });
}
