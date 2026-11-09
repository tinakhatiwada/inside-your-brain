// BrainView: a translucent 3D brain with glowing structures and travelling signals.
// One class drives the home hero, the replay player and the explorer.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STRUCTURES, BY_ID, GROUPS, LOBES, lobeOf, normalisedPoints } from './anatomy.js';

const MAX_HOT = 12;
const MODEL_URL = '/models/brain.glb';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let geometryPromise = null;
function loadGeometry() {
  if (geometryPromise) return geometryPromise;
  geometryPromise = new Promise((resolve, reject) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(
      MODEL_URL,
      (gltf) => {
        let mesh = null;
        gltf.scene.traverse((c) => { if (c.isMesh && !mesh) mesh = c; });
        if (!mesh) return reject(new Error('Brain model has no mesh'));
        const geo = mesh.geometry;
        geo.computeBoundingBox();
        if (!geo.attributes.normal) geo.computeVertexNormals();
        // Per-vertex lobe index, used by the "lobes" view.
        const bb = geo.boundingBox;
        const size = bb.getSize(new THREE.Vector3());
        const pos = geo.attributes.position;
        const lobe = new Float32Array(pos.count);
        for (let i = 0; i < pos.count; i++) {
          lobe[i] = lobeOf(
            (pos.getX(i) - bb.min.x) / size.x,
            (pos.getY(i) - bb.min.y) / size.y,
            (pos.getZ(i) - bb.min.z) / size.z,
          );
        }
        geo.setAttribute('aLobe', new THREE.BufferAttribute(lobe, 1));
        resolve(geo);
      },
      undefined,
      reject,
    );
  });
  return geometryPromise;
}

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.85)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.22)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const vertexShader = /* glsl */ `
  attribute float aLobe;
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vView;
  varying float vLobe;
  void main() {
    vLocal = position;
    vLobe = aLobe;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    vN = normalMatrix * normal;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  #define MAX_HOT ${MAX_HOT}
  uniform vec3 uHotPos[MAX_HOT];
  uniform vec3 uHotCol[MAX_HOT];
  uniform float uHotI[MAX_HOT];
  uniform float uHotR[MAX_HOT];
  uniform int uHotN;
  uniform vec3 uShell;
  uniform vec3 uRim;
  uniform float uOpacity;
  uniform float uFace;
  uniform float uLobeMode;
  uniform float uLobeSel;
  uniform vec3 uLobeCol[6];
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vView;
  varying float vLobe;
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vView);
    if (!gl_FrontFacing) n = -n;
    float ndv = clamp(dot(n, v), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.4);
    vec3 L = normalize(vec3(0.35, 0.85, 0.4));
    float lam = 0.5 + 0.5 * dot(n, L);

    vec3 glow = vec3(0.0);
    float gsum = 0.0;
    for (int i = 0; i < MAX_HOT; i++) {
      if (i >= uHotN) break;
      float d = distance(vLocal, uHotPos[i]);
      float r = uHotR[i];
      float g = uHotI[i] * exp(-(d * d) / (r * r));
      glow += uHotCol[i] * g;
      gsum += g;
    }

    vec3 col = uShell * (0.22 + 0.32 * lam) + uRim * fres;
    float a = uOpacity + fres * 0.5;
    col += glow * 1.25;
    a += clamp(gsum, 0.0, 1.0) * 0.5;

    if (uLobeMode > 0.001) {
      vec3 lc = uLobeCol[0];
      for (int k = 1; k < 6; k++) { if (abs(vLobe - float(k)) < 0.5) lc = uLobeCol[k]; }
      float sel = uLobeSel < -0.5 ? 1.0 : (abs(vLobe - uLobeSel) < 0.5 ? 1.15 : 0.16);
      vec3 lobeCol = lc * (0.28 + 0.8 * lam) * sel + uRim * fres * 0.25 + glow;
      col = mix(col, lobeCol, uLobeMode);
      a = mix(a, 0.96, uLobeMode);
    }
    gl_FragColor = vec4(col * uFace, clamp(a * uFace, 0.0, 1.0));
  }
`;

export class BrainView {
  constructor(container, opts = {}) {
    this.container = container;
    this.opts = {
      autoRotate: true,
      interactive: true,
      zoom: true,
      markers: false, // show every structure as a small dot (explorer)
      labels: true, // HTML labels for active structures
      ambient: false, // random background activity (hero)
      view: [1, 0.18, 0.12], // camera direction: +x is the left hemisphere, front faces left
      distance: 4.7,
      pixelRatio: 2,
      ...opts,
    };
    this.listeners = {};
    this.hot = new Map(); // id -> { target, value }
    this.selectedId = null;
    this.hoverId = null;
    this.pulses = [];
    this.lobeMode = 0;
    this.lobeModeTarget = 0;
    this.lobeSel = -1;
    this.visible = true;
    this.running = false;
    this.ready = this.#init().catch((err) => {
      container.classList.add('brain-failed');
      this.#emit('error', err);
      throw err;
    });
  }

  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); return this; }
  #emit(evt, ...args) { (this.listeners[evt] || []).forEach((fn) => fn(...args)); }

  async #init() {
    const c = this.container;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      throw new Error('WebGL is not available');
    }
    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.opts.pixelRatio));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.classList.add('brain-canvas');
    renderer.domElement.setAttribute('aria-hidden', 'true');
    c.appendChild(renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.05, 50);
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.labelLayer = document.createElement('div');
    this.labelLayer.className = 'brain-labels';
    this.labelLayer.setAttribute('aria-hidden', 'true');
    c.appendChild(this.labelLayer);
    this.labels = new Map();

    this.#resize();
    this.resizeObserver = new ResizeObserver(() => this.#resize());
    this.resizeObserver.observe(c);

    const geo = await loadGeometry();
    this.geo = geo;
    const bb = geo.boundingBox;
    this.bbox = bb;
    this.size = bb.getSize(new THREE.Vector3());
    const center = bb.getCenter(new THREE.Vector3());
    const scale = 2 / Math.max(this.size.x, this.size.y, this.size.z);
    this.root.scale.setScalar(scale);
    this.root.position.copy(center).multiplyScalar(-scale);
    this.root.position.y += 0.04;
    this.unit = this.size.length(); // local units used for glow radii

    this.uniforms = {
      uHotPos: { value: Array.from({ length: MAX_HOT }, () => new THREE.Vector3()) },
      uHotCol: { value: Array.from({ length: MAX_HOT }, () => new THREE.Color()) },
      uHotI: { value: new Array(MAX_HOT).fill(0) },
      uHotR: { value: new Array(MAX_HOT).fill(0.1) },
      uHotN: { value: 0 },
      uShell: { value: new THREE.Color('#B9A3CB') },
      uRim: { value: new THREE.Color('#E6D7F2') },
      uOpacity: { value: 0.05 },
      uFace: { value: 1 },
      uLobeMode: { value: 0 },
      uLobeSel: { value: -1 },
      uLobeCol: { value: LOBES.map((l) => new THREE.Color(l.color)) },
    };
    const make = (side, face) => {
      const m = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { ...this.uniforms, uFace: { value: face } },
        transparent: true,
        depthWrite: false,
        side,
      });
      return m;
    };
    this.backMat = make(THREE.BackSide, 0.55);
    this.frontMat = make(THREE.FrontSide, 1);
    this.backMesh = new THREE.Mesh(geo, this.backMat);
    this.frontMesh = new THREE.Mesh(geo, this.frontMat);
    this.backMesh.renderOrder = 1;
    this.frontMesh.renderOrder = 2;
    this.root.add(this.backMesh, this.frontMesh);

    // Structure markers: glowing sprites inside the glass, plus invisible pick spheres.
    this.tex = glowTexture();
    this.markerGroup = new THREE.Group();
    this.root.add(this.markerGroup);
    this.pickables = [];
    this.points = new Map(); // id -> [Vector3 local]
    const pickGeo = new THREE.SphereGeometry(this.unit * 0.035, 10, 8);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    for (const s of STRUCTURES) {
      const pts = normalisedPoints(s).map(([x, y, z]) => new THREE.Vector3(
        bb.min.x + x * this.size.x, bb.min.y + y * this.size.y, bb.min.z + z * this.size.z,
      ));
      this.points.set(s.id, pts);
      const color = new THREE.Color(GROUPS[s.group].color);
      s._sprites = pts.map((p) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this.tex, color, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
        }));
        sp.position.copy(p);
        sp.renderOrder = 5;
        this.markerGroup.add(sp);
        const pick = new THREE.Mesh(pickGeo, pickMat);
        pick.position.copy(p);
        pick.userData.id = s.id;
        this.markerGroup.add(pick);
        this.pickables.push(pick);
        return sp;
      });
    }

    // Pool of sprites for travelling signals.
    this.pulseGroup = new THREE.Group();
    this.root.add(this.pulseGroup);
    this.pulsePool = [];
    for (let i = 0; i < 90; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.tex, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0,
      }));
      sp.visible = false;
      sp.renderOrder = 6;
      this.pulseGroup.add(sp);
      this.pulsePool.push(sp);
    }

    // Camera and controls.
    this.target = new THREE.Vector3(0, 0, 0);
    this.setView(this.opts.view, false);
    if (this.opts.interactive) {
      const ctl = new OrbitControls(this.camera, renderer.domElement);
      ctl.enableDamping = true;
      ctl.dampingFactor = 0.08;
      ctl.enablePan = false;
      ctl.enableZoom = this.opts.zoom;
      ctl.minDistance = 2.6;
      ctl.maxDistance = 7;
      ctl.rotateSpeed = 0.7;
      ctl.target.copy(this.target);
      ctl.addEventListener('start', () => { this.tween = null; this.userTouched = true; });
      this.controls = ctl;
      this.#bindPointer();
    }
    this.autoRotate = this.opts.autoRotate && !reduceMotion();

    // Only animate while on screen.
    this.io = new IntersectionObserver((entries) => {
      this.visible = entries.some((e) => e.isIntersecting);
      if (this.visible) this.#start();
    }, { threshold: 0.01 });
    this.io.observe(c);
    this.onVis = () => { if (!document.hidden) this.#start(); };
    document.addEventListener('visibilitychange', this.onVis);

    this.clock = new THREE.Clock();
    this.nextAmbient = 0;
    c.classList.add('brain-ready');
    this.#start();
    this.#emit('ready');
  }

  #resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + 'px';
    this.renderer.domElement.style.height = h + 'px';
    this.camera.aspect = w / h;
    // Keep the whole brain in frame on narrow screens.
    const aspect = w / h;
    this.fit = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
    this.camera.updateProjectionMatrix();
    this.w = w; this.h = h;
  }

  #bindPointer() {
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down = null;
    const pick = (e) => {
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      if (this.opts.markers) {
        const hits = ray.intersectObjects(this.pickables, false);
        if (hits.length) return { id: hits[0].object.userData.id };
      }
      if (this.lobeModeTarget > 0) {
        const hits = ray.intersectObject(this.frontMesh, false);
        if (hits.length) {
          const p = this.frontMesh.worldToLocal(hits[0].point.clone());
          const bb = this.bbox; const s = this.size;
          return { lobe: lobeOf((p.x - bb.min.x) / s.x, (p.y - bb.min.y) / s.y, (p.z - bb.min.z) / s.z) };
        }
      }
      return null;
    };
    el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const hit = pick(e);
      const id = hit?.id || null;
      if (id !== this.hoverId) { this.hoverId = id; this.#emit('hover', id); }
      el.style.cursor = hit ? 'pointer' : 'grab';
    });
    el.addEventListener('pointerleave', () => { if (this.hoverId) { this.hoverId = null; this.#emit('hover', null); } });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const hit = pick(e);
      if (hit?.id) this.#emit('select', hit.id);
      else if (hit && hit.lobe !== undefined) this.#emit('selectLobe', hit.lobe);
      else this.#emit('select', null);
    });
  }

  // ---------- public API ----------

  /** Light up structures. items: [{ id, intensity? }]. Others fade out. */
  setActivity(items = [], { pulses = true, from = [] } = {}) {
    const next = new Map(items.map((it) => [it.id, it.intensity ?? 1]));
    for (const [id, h] of this.hot) if (!next.has(id)) h.target = 0;
    for (const [id, v] of next) {
      if (!BY_ID[id]) continue;
      const h = this.hot.get(id) || { value: 0, target: 0, born: performance.now() };
      h.target = v;
      if (h.value < 0.05) h.born = performance.now();
      this.hot.set(id, h);
    }
    if (pulses && from.length && !reduceMotion()) {
      for (const a of from) for (const b of next.keys()) if (a !== b) this.firePulse(a, b);
    }
  }

  clearActivity() { this.setActivity([]); }

  firePulse(fromId, toId, opts = {}) {
    const A = this.points?.get(fromId); const B = this.points?.get(toId);
    if (!A || !B) return;
    const color = new THREE.Color(GROUPS[BY_ID[toId].group].color);
    // Pair each source point with its nearest destination point (stay in one hemisphere when possible).
    for (const a of A) {
      let best = B[0];
      for (const b of B) if (b.distanceTo(a) < best.distanceTo(a)) best = b;
      const mid = a.clone().add(best).multiplyScalar(0.5);
      const c = this.bbox.getCenter(new THREE.Vector3());
      const ctrl = mid.clone().lerp(c, 0.25);
      ctrl.y += this.size.y * 0.08;
      const curve = new THREE.QuadraticBezierCurve3(a.clone(), ctrl, best.clone());
      this.pulses.push({ curve, color, t: -(opts.delay || Math.random() * 0.15), speed: 1.2 + Math.random() * 0.5, len: curve.getLength() });
    }
  }

  /** Point the camera at a set of structures. */
  focusOn(ids = [], animate = true) {
    const pts = ids.flatMap((id) => this.points?.get(id) || []);
    if (!pts.length) return;
    const c = new THREE.Vector3();
    pts.forEach((p) => c.add(p));
    c.divideScalar(pts.length);
    const bc = this.bbox.getCenter(new THREE.Vector3());
    const off = c.sub(bc);
    // Lateral structures: look from their side. Midline and deep ones: oblique left view.
    const hemis = off.x / (this.size.x * 0.5);
    const dir = new THREE.Vector3(
      Math.abs(hemis) > 0.15 ? Math.sign(hemis) : 1,
      0.22 + (off.y / this.size.y) * 0.8,
      (off.z / this.size.z) * 1.4 + 0.1,
    );
    this.setView(dir.toArray(), animate);
  }

  setView(dir, animate = true) {
    const d = new THREE.Vector3(...dir).normalize();
    const dist = this.opts.distance * (this.fit || 1);
    const to = d.multiplyScalar(dist).add(this.target);
    if (!animate || reduceMotion()) {
      this.camera.position.copy(to);
      this.camera.lookAt(this.target);
      this.tween = null;
      return;
    }
    const from = this.camera.position.clone().sub(this.target);
    this.tween = { from, to: to.clone().sub(this.target), t: 0 };
  }

  resetView() { this.setView(this.opts.view); }

  setAutoRotate(on) { this.autoRotate = on && !reduceMotion(); }
  setAmbient(on) { this.opts.ambient = on; if (!on) this.clearActivity(); }
  setMarkers(on) { this.opts.markers = on; }
  setShowLobes(on) { this.opts.showLobes = !!on; }

  setLobeMode(on) { this.lobeModeTarget = on ? 1 : 0; if (!on) this.selectLobe(-1); }
  selectLobe(i) { this.lobeSel = i; this.uniforms && (this.uniforms.uLobeSel.value = i); }

  select(id) { this.selectedId = id; }

  /** Screen position of a structure (for UI callouts). */
  screenPos(id) {
    const pts = this.points?.get(id);
    if (!pts) return null;
    const p = this.#nearestPoint(pts).clone();
    this.root.localToWorld(p);
    p.project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.w, y: (-p.y * 0.5 + 0.5) * this.h };
  }

  dispose() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    this.controls?.dispose();
    this.renderer?.dispose();
  }

  // ---------- frame loop ----------

  #start() {
    if (this.running || !this.renderer) return;
    this.running = true;
    const loop = () => {
      if (!this.visible || document.hidden) { this.running = false; return; }
      this.raf = requestAnimationFrame(loop);
      this.#frame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  #nearestPoint(pts) {
    if (pts.length === 1) return pts[0];
    const camLocal = this.root.worldToLocal(this.camera.position.clone());
    return pts.reduce((a, b) => (a.distanceTo(camLocal) <= b.distanceTo(camLocal) ? a : b));
  }

  #frame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const still = reduceMotion();

    // Camera tween (slerp-ish on a sphere around the target).
    if (this.tween) {
      this.tween.t = Math.min(1, this.tween.t + dt / 1.1);
      const k = this.tween.t < 0.5 ? 4 * this.tween.t ** 3 : 1 - (-2 * this.tween.t + 2) ** 3 / 2;
      const len = THREE.MathUtils.lerp(this.tween.from.length(), this.tween.to.length(), k);
      const dir = this.tween.from.clone().normalize().lerp(this.tween.to.clone().normalize(), k).normalize();
      this.camera.position.copy(dir.multiplyScalar(len).add(this.target));
      if (this.tween.t >= 1) this.tween = null;
    } else if (this.autoRotate) {
      const off = this.camera.position.clone().sub(this.target);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.12);
      this.camera.position.copy(off.add(this.target));
    }
    if (this.controls) this.controls.update();
    this.camera.lookAt(this.target);

    // Ambient flickers for the hero.
    if (this.opts.ambient && t > this.nextAmbient) {
      this.nextAmbient = t + (still ? 3 : 0.9 + Math.random() * 1.1);
      const pick = () => STRUCTURES[Math.floor(Math.random() * STRUCTURES.length)].id;
      const active = [...this.hot.entries()].filter(([, h]) => h.target > 0).map(([id]) => id);
      const next = [pick(), pick()].filter((v, i, a) => a.indexOf(v) === i);
      const keep = active.slice(-2);
      this.setActivity([...keep.map((id) => ({ id, intensity: 0.55 })), ...next.map((id) => ({ id, intensity: 1 }))], { from: keep.length ? keep : [] });
    }

    // Lobe mode easing.
    this.lobeMode += (this.lobeModeTarget - this.lobeMode) * Math.min(1, dt * 5);
    this.uniforms.uLobeMode.value = this.lobeMode;
    const solid = this.lobeMode > 0.5;
    this.frontMat.depthWrite = solid;
    this.backMesh.visible = !solid;
    this.uniforms.uLobeSel.value = this.lobeSel;

    // Hotspots -> shader uniforms and sprites.
    let n = 0;
    for (const s of STRUCTURES) {
      const h = this.hot.get(s.id);
      if (h) {
        h.value += (h.target - h.value) * Math.min(1, dt * 3.2);
        if (h.target === 0 && h.value < 0.01) { this.hot.delete(s.id); h.value = 0; }
      }
      const v = h ? h.value : 0;
      const isSel = this.selectedId === s.id;
      const isHover = this.hoverId === s.id;
      const pulse = still ? 1 : 0.82 + 0.18 * Math.sin(t * 4.2 + s.pos[2] * 9);
      const base = this.opts.markers ? (isSel ? 1 : isHover ? 0.85 : 0.4) : 0;
      const sprO = Math.max(base * (this.lobeMode > 0.5 ? 0.6 : 1), v * pulse);
      const sprS = this.unit * (0.035 + 0.075 * Math.max(v, isSel ? 0.7 : isHover ? 0.5 : 0.08)) * (0.9 + 0.1 * pulse);
      for (const sp of s._sprites) {
        sp.material.opacity = sprO;
        sp.scale.setScalar(sprS);
      }
      if (v > 0.01 && n < MAX_HOT) {
        const col = new THREE.Color(GROUPS[s.group].color);
        for (const p of this.points.get(s.id)) {
          if (n >= MAX_HOT) break;
          this.uniforms.uHotPos.value[n].copy(p);
          this.uniforms.uHotCol.value[n].copy(col);
          this.uniforms.uHotI.value[n] = v * pulse;
          this.uniforms.uHotR.value[n] = this.unit * (s.depth === 'deep' ? 0.11 : 0.085);
          n++;
        }
      }
      if (isSel && n < MAX_HOT && v < 0.01) {
        const col = new THREE.Color(GROUPS[s.group].color);
        for (const p of this.points.get(s.id)) {
          if (n >= MAX_HOT) break;
          this.uniforms.uHotPos.value[n].copy(p);
          this.uniforms.uHotCol.value[n].copy(col);
          this.uniforms.uHotI.value[n] = 0.75 * pulse;
          this.uniforms.uHotR.value[n] = this.unit * 0.09;
          n++;
        }
      }
    }
    this.uniforms.uHotN.value = n;

    // Travelling signals.
    let used = 0;
    this.pulses = this.pulses.filter((p) => p.t < 1.25);
    for (const p of this.pulses) {
      p.t += dt * p.speed;
      for (let k = 0; k < 5; k++) {
        const tt = p.t - k * 0.035;
        if (tt < 0 || tt > 1 || used >= this.pulsePool.length) continue;
        const sp = this.pulsePool[used++];
        sp.visible = true;
        sp.position.copy(p.curve.getPoint(tt));
        sp.material.color.copy(p.color);
        sp.material.opacity = (1 - k / 5) * (tt > 0.85 ? (1 - tt) / 0.15 : 1);
        sp.scale.setScalar(this.unit * (0.03 - k * 0.004));
      }
    }
    for (let i = used; i < this.pulsePool.length; i++) this.pulsePool[i].visible = false;

    this.renderer.render(this.scene, this.camera);
    if (this.opts.labels) this.#updateLabels();
  }

  #updateLabels() {
    const want = new Set();
    for (const [id, h] of this.hot) if (h.target > 0.6 && !this.opts.ambient) want.add(id);
    if (this.selectedId) want.add(this.selectedId);
    if (this.hoverId) want.add(this.hoverId);
    for (const [id, el] of this.labels) {
      if (!want.has(id)) { el.remove(); this.labels.delete(id); }
    }
    const placed = [];
    for (const id of want) {
      let el = this.labels.get(id);
      const s = BY_ID[id];
      if (!el) {
        el = document.createElement('div');
        el.className = 'brain-label';
        el.style.setProperty('--c', GROUPS[s.group].color);
        el.innerHTML = `<span class="brain-label-name"></span><span class="brain-label-nick"></span><span class="brain-label-lobe"></span>`;
        el.querySelector('.brain-label-name').textContent = s.name;
        el.querySelector('.brain-label-nick').textContent = s.nickname;
        const lobeEl = el.querySelector('.brain-label-lobe');
        if (this.opts.showLobes && s.lobe) {
          const lobeNames = { frontal: 'Frontal lobe', parietal: 'Parietal lobe', temporal: 'Temporal lobe', occipital: 'Occipital lobe', cerebellum: 'Cerebellum', brainstem: 'Brainstem', deep: 'Deep brain' };
          lobeEl.textContent = lobeNames[s.lobe] || s.lobe;
        }
        this.labelLayer.appendChild(el);
        this.labels.set(id, el);
      }
      const pos = this.screenPos(id);
      if (!pos) continue;
      let y = pos.y - 14;
      const x = Math.min(Math.max(pos.x + 16, 8), this.w - 160);
      // Nudge down if overlapping a label already placed.
      for (const q of placed) if (Math.abs(q.x - x) < 150 && Math.abs(q.y - y) < 36) y = q.y + 38;
      placed.push({ x, y });
      el.style.transform = `translate(${x}px, ${y}px)`;
      el.classList.toggle('is-selected', id === this.selectedId);
    }
  }
}
