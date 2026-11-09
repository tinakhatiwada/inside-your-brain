import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
export function createScene(container) {
  var w = container.clientWidth, h = container.clientHeight;
  var clock = new THREE.Clock();
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08061a);
  var camera = new THREE.PerspectiveCamera(40, w / h, 0.01, 50);
  camera.position.set(2.0, 1.0, 2.5);
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  container.appendChild(renderer.domElement);
  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.07;
  controls.minDistance = 1.0; controls.maxDistance = 6;
  controls.target.set(0, 0.2, 0);
  controls.autoRotate = true; controls.autoRotateSpeed = 0.6;
  scene.add(new THREE.AmbientLight(0xd0d0e0, 0.5));
  var key = new THREE.DirectionalLight(0xfff5ee, 1.6); key.position.set(3, 5, 4); scene.add(key);
  var fill = new THREE.DirectionalLight(0x8899bb, 0.4); fill.position.set(-3, 2, -2); scene.add(fill);
  var rim = new THREE.DirectionalLight(0xaaccff, 0.3); rim.position.set(0, -1, -4); scene.add(rim);
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);
  return { scene: scene, camera: camera, renderer: renderer, controls: controls, clock: clock, onResize: onResize };
}
