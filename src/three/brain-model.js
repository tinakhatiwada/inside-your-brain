import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
export function loadBrainModel(scene, regions, onProgress, onLoaded) {
  var dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  var loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.load('/models/brain.glb', function(gltf) {
    var model = gltf.scene; model.scale.set(1.5, 1.5, 1.5);
    var meshes = [];
    model.traverse(function(child) {
      if (child.isMesh) {
        child.material = new THREE.MeshPhysicalMaterial({ color: 0xddbbcc, roughness: 0.5, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5, side: THREE.DoubleSide });
        meshes.push(child);
      }
    });
    var modelBBox = computeBBox(meshes);
    assignVertexColors(meshes, regions, modelBBox);
    scene.add(model);
    onLoaded({ model: model, meshes: meshes, modelBBox: modelBBox });
  }, function(p) { if (p.total > 0) onProgress(Math.round((p.loaded / p.total) * 100)); }, function(err) { console.error('Failed:', err); });
}
function computeBBox(meshes) {
  var bbox = null;
  meshes.forEach(function(m) {
    m.geometry.computeBoundingBox();
    if (!bbox) bbox = m.geometry.boundingBox.clone(); else bbox.union(m.geometry.boundingBox);
  });
  return bbox;
}
export function getLobeFromPoint(point, bbox) {
  var size = new THREE.Vector3(); bbox.getSize(size);
  var ny = (point.y - bbox.min.y) / size.y;
  var nz = (point.z - bbox.min.z) / size.z;
  var nx = (point.x - bbox.min.x) / size.x;
  if (ny < 0.25) { if (nz < 0.4) return 4; if (ny < 0.12) return 5; return 2; }
  else if (ny < 0.55) { if (nz < 0.3) return 3; if (nz > 0.65) return 0; if (Math.abs(nx - 0.5) > 0.35) return 2; return 1; }
  else { if (nz < 0.25) return 3; if (nz > 0.6) return 0; return 1; }
}
function assignVertexColors(meshes, regions, bbox) {
  var lobeColors = regions.map(function(r) { return new THREE.Color(r.color); });
  meshes.forEach(function(mesh) {
    var pos = mesh.geometry.attributes.position;
    var colors = new Float32Array(pos.count * 3);
    for (var i = 0; i < pos.count; i++) {
      var pt = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
      var idx = getLobeFromPoint(pt, bbox);
      var c = lobeColors[idx];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    mesh.material = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.02, clearcoat: 0.15, clearcoatRoughness: 0.4, side: THREE.DoubleSide });
  });
}
