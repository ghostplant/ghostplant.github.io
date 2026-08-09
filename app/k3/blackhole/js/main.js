// GARGANTUA — main application.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

import { VERT, FRAG, FINAL_FRAG, GRAIN_FRAG } from './shaders.js';
import { PARAMS, QUALITY, VIEWS, load, save, loadMeta, saveMeta, defaults } from './params.js';
import { buildPanel } from './ui.js';
import { Ambience } from './audio.js';

const $ = (id) => document.getElementById(id);
const canvas = $('c');

// ---------- URL params (screenshot automation) ----------
const url = new URLSearchParams(location.search);
const SHOT = url.get('shot') === '1';
const URLQ = url.get('q');                 // quality
const URLVIEW = url.get('view');           // view index
const URLT = parseFloat(url.get('t') || '0'); // warm-up seconds
const NOHUD = url.get('nohud') === '1';

// ---------- state ----------
const state = load();
// URL param overrides: ?<paramId>=<value>
for (const p of PARAMS) {
  if (p.id && url.has(p.id)) {
    const v = parseFloat(url.get(p.id));
    if (!isNaN(v)) state[p.id] = v;
  }
}
if (url.has('debug')) { /* applied later */ }

const meta = loadMeta();
let qualityName = URLQ && QUALITY[URLQ] ? URLQ : (meta.quality || (isMobile() ? 'standard' : 'high'));
let quality = QUALITY[qualityName];
let debugMode = 0;
let paused = false;
let cinematic = !SHOT;
let time = 0;
let viewIndex = 0;

function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
}

// ---------- renderer ----------
let renderer, composer, bloomPass, finalPass, grainPass, fxaaPass;
let camera, controls, sceneRT, material, camMat3;

function makeRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  return renderer;
}

// fullscreen scene
const fsScene = new THREE.Scene();
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function buildMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
      uCamMat: { value: new THREE.Matrix3() },
      uTanH: { value: 1 },
      uDiskRot: { value: new THREE.Matrix3() },
      uDiskRotInv: { value: new THREE.Matrix3() },
      uGalaxyN: { value: new THREE.Vector3() },
      uGalaxyU: { value: new THREE.Vector3() },
      uGalaxyV: { value: new THREE.Vector3() },
      uSteps: { value: 160 },
      uStepSize: { value: 0.06 },
      uLensing: { value: 1 },
      uDiskIn: { value: 3 },
      uDiskOut: { value: 16 },
      uDiskTemp: { value: 9000 },
      uDiskBright: { value: 1.3 },
      uTurb: { value: 1 },
      uTurbSpeed: { value: 1 },
      uDiskSpeed: { value: 1 },
      uDiskHue: { value: 0 },
      uBeaming: { value: 2.5 },
      uRedshift: { value: 1 },
      uStarBright: { value: 1 },
      uStarDensity: { value: 1 },
      uGalaxyBright: { value: 1 },
      uRingGlow: { value: 0.7 },
      uExposure: { value: 1 },
      uDebug: { value: 0 },
    },
  });
}

function buildComposer() {
  const size = new THREE.Vector2();
  getRenderSize(size);
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  });
  composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(fsScene, fsCam));

  bloomPass = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), state.bloomStrength, state.bloomRadius, state.bloomThreshold);
  composer.addPass(bloomPass);

  finalPass = new ShaderPass(new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FINAL_FRAG,
    uniforms: {
      tDiffuse: { value: null },
      uCA: { value: state.ca },
      uVignette: { value: state.vignette },
    },
  }));
  composer.addPass(finalPass);

  fxaaPass = new ShaderPass(FXAAShader);
  fxaaPass.material.uniforms.resolution.value.set(1 / size.x, 1 / size.y);
  composer.addPass(fxaaPass);

  grainPass = new ShaderPass(new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: GRAIN_FRAG,
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uGrain: { value: state.grain },
    },
  }));
  composer.addPass(grainPass);
}

// ---------- camera ----------
function buildCamera() {
  camera = new THREE.PerspectiveCamera(state.fov, innerWidth / innerHeight, 0.01, 1000);
  const v = VIEWS[viewIndex];
  setCamFromView(v);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 1.6;
  controls.maxDistance = 80;
  controls.target.set(0, 0, 0);
  controls.addEventListener('start', () => { if (cinematic) setCinematic(false); });
}

function setCamFromView(v) {
  const pol = v.pol * Math.PI / 180, az = v.az * Math.PI / 180;
  camera.position.set(
    v.r * Math.sin(pol) * Math.cos(az),
    v.r * Math.cos(pol),
    v.r * Math.sin(pol) * Math.sin(az)
  );
  camera.lookAt(0, 0, 0);
}

// camera tween
let tween = null;
function goToView(i) {
  viewIndex = i;
  const v = VIEWS[i];
  const pol = v.pol * Math.PI / 180, az = v.az * Math.PI / 180;
  const to = new THREE.Vector3(
    v.r * Math.sin(pol) * Math.cos(az),
    v.r * Math.cos(pol),
    v.r * Math.sin(pol) * Math.sin(az)
  );
  tween = { from: camera.position.clone(), to, t: 0, dur: 1.6 };
  document.querySelectorAll('.view-btn').forEach((b, j) => b.classList.toggle('active', j === i));
}

// ---------- cinematic path ----------
function cinematicPos(t, out) {
  const w = t * 0.12;
  const r = 9.0 + 2.2 * Math.sin(w * 0.5);
  const pol = 1.15 + 0.55 * Math.sin(w * 0.25 + 1.0);
  const az = w * 0.5;
  out.set(r * Math.sin(pol) * Math.cos(az), r * Math.cos(pol), r * Math.sin(pol) * Math.sin(az));
}

// ---------- sizing ----------
function getRenderSize(out) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  out.set(Math.floor(innerWidth * dpr * quality.scale), Math.floor(innerHeight * dpr * quality.scale));
}
function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  const size = new THREE.Vector2();
  getRenderSize(size);
  renderer.setSize(size.x, size.y, false);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  composer.setSize(size.x, size.y);
  material.uniforms.uResolution.value.set(size.x, size.y);
  fxaaPass.material.uniforms.resolution.value.set(1 / size.x, 1 / size.y);
  bloomPass.setSize(size.x, size.y);
}

// ---------- params -> uniforms ----------
const diskRotM = new THREE.Matrix4();
function applyParams() {
  const u = material.uniforms;
  u.uSteps.value = Math.round(state.steps);
  u.uStepSize.value = state.stepSize;
  u.uLensing.value = state.lensing;
  u.uDiskIn.value = state.diskIn;
  u.uDiskOut.value = state.diskOut;
  u.uDiskTemp.value = state.diskTemp;
  u.uDiskBright.value = state.diskBright;
  u.uTurb.value = state.turb;
  u.uTurbSpeed.value = state.turbSpeed;
  u.uDiskSpeed.value = state.diskSpeed;
  u.uDiskHue.value = state.diskHue;
  u.uBeaming.value = state.beaming;
  u.uRedshift.value = state.redshift;
  u.uStarBright.value = state.starBright;
  u.uStarDensity.value = state.starDensity;
  u.uGalaxyBright.value = state.galaxyBright;
  u.uRingGlow.value = state.ringGlow;
  u.uExposure.value = state.exposure;
  u.uDebug.value = debugMode;

  // disk tilt
  const tilt = state.diskTilt * Math.PI / 180;
  diskRotM.makeRotationX(tilt);
  u.uDiskRot.value.setFromMatrix4(diskRotM);
  u.uDiskRotInv.value.setFromMatrix4(diskRotM.clone().invert());

  // galaxy basis
  const gt = state.galaxyTilt * Math.PI / 180;
  const n = new THREE.Vector3(0, Math.cos(gt), Math.sin(gt)).normalize();
  const up = Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const uu = new THREE.Vector3().crossVectors(up, n).normalize();
  const vv = new THREE.Vector3().crossVectors(n, uu).normalize();
  u.uGalaxyN.value.copy(n);
  u.uGalaxyU.value.copy(uu);
  u.uGalaxyV.value.copy(vv);

  // post
  bloomPass.strength = state.bloomStrength;
  bloomPass.radius = state.bloomRadius;
  bloomPass.threshold = state.bloomThreshold;
  finalPass.material.uniforms.uCA.value = state.ca;
  finalPass.material.uniforms.uVignette.value = state.vignette;
  grainPass.material.uniforms.uGrain.value = state.grain;

  camera.fov = state.fov;
  camera.updateProjectionMatrix();
}

// ---------- quality ----------
function setQuality(name) {
  qualityName = name;
  quality = QUALITY[name];
  state.steps = quality.steps;
  $('btnQuality').textContent = quality.label;
  panel && panel.refresh();
  applyParams();
  if (url.has('debug')) setDebug(parseInt(url.get('debug'))||0);
  onResize();
  meta.quality = name; saveMeta(meta);
}

// ---------- UI wiring ----------
let panel = null;
const ambience = new Ambience();

function setCinematic(on) {
  cinematic = on;
  controls.enabled = !on;
  $('btnCinematic').classList.toggle('active', on);
}

function wireUI() {
  panel = buildPanel(state, (id) => { applyParams(); save(state); });

  $('panel-close').onclick = () => $('panel').classList.add('hidden');
  $('btnPanel').onclick = () => $('panel').classList.toggle('hidden');
  $('btnQuality').onclick = () => {
    const keys = Object.keys(QUALITY);
    setQuality(keys[(keys.indexOf(qualityName) + 1) % keys.length]);
  };
  $('btnCinematic').onclick = () => setCinematic(!cinematic);
  $('btnMusic').onclick = () => { const p = ambience.toggle(); $('btnMusic').classList.toggle('active', p); };
  $('btnShot').onclick = () => downloadShot();
  $('btnFull').onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  };
  $('btnHelp').onclick = () => $('help').classList.toggle('hidden');
  $('help').onclick = () => $('help').classList.add('hidden');
  $('btnReset').onclick = () => {
    Object.assign(state, defaults());
    panel.refresh(); applyParams(); save(state);
  };
  document.querySelectorAll('.view-btn').forEach((b) => {
    b.onclick = () => { setCinematic(false); goToView(parseInt(b.dataset.view)); };
  });

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = e.key;
    if (k >= '0' && k <= '9') { setDebug(parseInt(k)); return; }
    switch (k) {
      case ' ': paused = !paused; e.preventDefault(); break;
      case 'c': case 'C': setCinematic(!cinematic); break;
      case 'q': case 'Q': $('btnQuality').click(); break;
      case 'm': case 'M': $('btnMusic').click(); break;
      case 's': case 'S': downloadShot(); break;
      case 'f': case 'F': $('btnFull').click(); break;
      case 'g': case 'G': $('panel').classList.toggle('hidden'); break;
      case 'h': case 'H': $('help').classList.toggle('hidden'); break;
      case 'r': case 'R': $('btnReset').click(); break;
      case 'F1': setCinematic(false); goToView(0); e.preventDefault(); break;
      case 'F2': setCinematic(false); goToView(1); e.preventDefault(); break;
      case 'F3': setCinematic(false); goToView(2); e.preventDefault(); break;
      case 'F4': setCinematic(false); goToView(3); e.preventDefault(); break;
    }
  });

  if (NOHUD) {
    ['hud', 'buttons', 'viewbar', 'vignette-overlay'].forEach((i) => $(i).style.display = 'none');
  }
}

const DEBUG_NAMES = ['Normal', 'Ray Dir', 'Steps', 'Crossings', 'Impact b', 'Sky', 'Glow', 'Disk Alpha', 'Ring', 'Raw HDR'];
function setDebug(m) {
  debugMode = m;
  material.uniforms.uDebug.value = m;
  const el = $('debug');
  if (m === 0) el.classList.add('hidden');
  else { el.classList.remove('hidden'); el.textContent = 'DEBUG ' + m + ' · ' + DEBUG_NAMES[m]; }
  // bypass post for debug views
  const bypass = m !== 0;
  bloomPass.enabled = !bypass;
  finalPass.enabled = !bypass;
  fxaaPass.enabled = !bypass;
  grainPass.enabled = !bypass;
}

// ---------- screenshot ----------
function downloadShot() {
  composer.render();
  const url = renderer.domElement.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gargantua_' + Date.now() + '.png';
  a.click();
}

// ---------- error handling ----------
function showError(msg) {
  $('error').classList.remove('hidden');
  $('err-msg').textContent = msg;
  $('loading').classList.add('hidden');
}
$('err-reload').onclick = () => location.reload();
addEventListener('error', (e) => { if (e.message) showError(e.message); });

// WebGL context loss
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  showError('WebGL context lost. Click Reload to restart.');
});
canvas.addEventListener('webglcontextrestored', () => location.reload());

// ---------- main loop ----------
let lastT = performance.now();
let fpsAcc = 0, fpsN = 0, fpsT = 0;
let framesRendered = 0;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastT) / 1000, 0.1);
  lastT = now;

  if (!paused) time += dt * state.timeScale;

  // camera
  if (tween) {
    tween.t += dt / tween.dur;
    const k = tween.t >= 1 ? 1 : (1 - Math.pow(1 - tween.t, 3));
    camera.position.lerpVectors(tween.from, tween.to, k);
    camera.lookAt(0, 0, 0);
    if (tween.t >= 1) tween = null;
  } else if (cinematic) {
    cinematicPos(time, camera.position);
    camera.lookAt(0, 0, 0);
  } else {
    controls.update();
  }

  // uniforms
  const u = material.uniforms;
  u.uTime.value = time;
  u.uCamPos.value.copy(camera.position).divideScalar(state.mass);
  camera.updateMatrixWorld();
  camMat3.setFromMatrix4(camera.matrixWorld);
  u.uCamMat.value.copy(camMat3);
  u.uTanH.value = Math.tan(camera.fov * Math.PI / 360);

  grainPass.material.uniforms.uTime.value = time;

  composer.render();
  framesRendered++;

  // fps
  fpsAcc += dt; fpsN++; fpsT += dt;
  if (fpsT > 0.5) {
    const fps = Math.round(fpsN / fpsAcc);
    $('fps').textContent = fps + ' fps';
    const r = camera.position.length();
    $('info').textContent = 'r=' + r.toFixed(1) + ' · ' + quality.label + ' · ' + Math.round(state.steps) + ' steps';
    fpsAcc = 0; fpsN = 0; fpsT = 0;
  }

  // screenshot automation
  if (SHOT && framesRendered === 2) {
    // warm-up done after a couple frames + URLT handled by rAF timing
  }
  if (SHOT && !window.__READY__) {
    if (time >= URLT && framesRendered > 5) {
      window.__READY__ = true;
      document.title = 'GARGANTUA_READY';
      if (url.get('dl') === '1') downloadShot();
    }
  }
}

// ---------- boot ----------
function boot() {
  try {
    makeRenderer();
  } catch (e) {
    showError('WebGL unavailable: ' + e.message);
    return;
  }
  material = buildMaterial();
  camMat3 = new THREE.Matrix3();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  fsScene.add(quad);

  buildCamera();
  buildComposer();
  wireUI();
  setQuality(qualityName);
  if (URLVIEW !== null && VIEWS[+URLVIEW]) { setCinematic(false); goToView(+URLVIEW); tween = null; const v = VIEWS[+URLVIEW]; setCamFromView(v); }
  applyParams();
  onResize();
  addEventListener('resize', onResize);

  // music autoplay (needs gesture on most browsers; try anyway)
  if (meta.music) { ambience.start(); $('btnMusic').classList.add('active'); }

  $('loading').classList.add('hidden');
  window.__READY__ = false;
  animate();
}

boot();