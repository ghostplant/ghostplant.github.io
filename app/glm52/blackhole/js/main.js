// main.js — Gargantua Schwarzschild Black Hole Raytracer
import * as THREE from '../vendor/three/build/three.module.js';
import { OrbitControls } from '../vendor/three/examples/jsm/controls/OrbitControls.js';
import {
    vertexShader, raytracerFragment,
    brightPassFragment, blurFragment, compositeFragment,
} from './shaders.js';
import {
    DEFAULT_PARAMS, PARAM_META, QUALITY_PRESETS, VIEW_PRESETS, DEBUG_VIEWS,
} from './config.js';
import { HUD } from './hud.js';
import { Controls } from './controls.js';
import { AmbientAudio } from './audio.js';

class Gargantua {
    constructor() {
        this.params = { ...DEFAULT_PARAMS };
        this.quality = 'high';
        this.debugView = 0;
        this.viewPreset = 0;
        this.cinematic = false;
        this.cinematicTime = 0;
        this.paused = false;
        this.startTime = performance.now();
        this.lastTime = this.startTime;
        this.fps = 60;
        this.frameCount = 0;
        this.fpsTime = 0;

        this._init();
    }

    _init() {
        this._loadState();
        this._initRenderer();
        this._initScene();
        this._initPostFX();
        this._initControls();
        this._initHUD();
        this._initAudio();
        this._initEvents();
        this._applyViewPreset(this.viewPreset);
        this._updateUniforms();
        this._animate();
    }

    // ─── state persistence ─────────────────────────────
    _loadState() {
        try {
            const s = localStorage.getItem('gargantua_state');
            if (s) {
                const obj = JSON.parse(s);
                Object.assign(this.params, obj.params || {});
                this.quality = obj.quality || 'high';
                this.debugView = obj.debugView || 0;
                this.viewPreset = obj.viewPreset || 0;
            }
        } catch (e) { /* ignore */ }
    }

    _saveState() {
        try {
            localStorage.setItem('gargantua_state', JSON.stringify({
                params: this.params,
                quality: this.quality,
                debugView: this.debugView,
                viewPreset: this.viewPreset,
            }));
        } catch (e) { /* ignore */ }
    }

    // ─── renderer ──────────────────────────────────────
    _initRenderer() {
        const canvas = document.getElementById('canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.setPixelRatio(1); // we manage pixel ratio manually
        this._setQuality(this.quality);

        // WebGL context loss recovery
        this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost');
            document.getElementById('error-overlay').style.display = 'flex';
        });
        this.renderer.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored');
            document.getElementById('error-overlay').style.display = 'none';
            this._initScene();
            this._initPostFX();
        });
    }

    _setQuality(q) {
        this.quality = q;
        const preset = QUALITY_PRESETS[q];
        this.params.steps = preset.steps;
        this.params.stepSize = preset.stepSize;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, preset.pixelRatio);
        this.bloomIterations = preset.bloomIterations;
        this.renderer.setPixelRatio(this.pixelRatio);
        this._resize();
        this._saveState();
    }

    _resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.width = w;
        this.height = h;
        if (this.camera) {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        }
        // Resize render targets
        const pw = Math.floor(w * this.pixelRatio);
        const ph = Math.floor(h * this.pixelRatio);
        if (this.rtScene) this.rtScene.setSize(pw, ph);
        if (this.rtBright) this.rtBright.setSize(Math.floor(pw / 2), Math.floor(ph / 2));
        if (this.rtBlurA) this.rtBlurA.setSize(Math.floor(pw / 2), Math.floor(ph / 2));
        if (this.rtBlurB) this.rtBlurB.setSize(Math.floor(pw / 2), Math.floor(ph / 2));
        if (this.compositeUniforms) this.compositeUniforms.uResolution.value.set(pw, ph);
    }

    // ─── scene ─────────────────────────────────────────
    _initScene() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.geo = new THREE.PlaneGeometry(2, 2);

        // ray-tracer material
        this.rtUniforms = {
            uResolution:       { value: new THREE.Vector2(1, 1) },
            uTime:             { value: 0 },
            uCameraPos:        { value: new THREE.Vector3(18, 5, 22) },
            uCameraRot:        { value: new THREE.Matrix3() },
            uFov:              { value: this.params.fov },
            uMass:             { value: this.params.mass },
            uDiskInner:        { value: this.params.diskInner },
            uDiskOuter:        { value: this.params.diskOuter },
            uDiskBrightness:   { value: this.params.diskBrightness },
            uDiskTempInner:    { value: this.params.diskTempInner },
            uDiskTempOuter:    { value: this.params.diskTempOuter },
            uTurbulenceScale:  { value: this.params.turbulenceScale },
            uTurbulenceSpeed:  { value: this.params.turbulenceSpeed },
            uDopplerStrength:  { value: this.params.dopplerStrength },
            uRedshiftStrength: { value: this.params.redshiftStrength },
            uStarBrightness:   { value: this.params.starBrightness },
            uMilkyWayBrightness:{ value: this.params.milkyWayBrightness },
            uSteps:            { value: this.params.steps },
            uStepSize:         { value: this.params.stepSize },
            uDebugView:        { value: this.debugView },
        };

        this.rtMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: raytracerFragment,
            uniforms: this.rtUniforms,
        });

        this.rtMesh = new THREE.Mesh(this.geo, this.rtMaterial);
        this.scene.add(this.rtMesh);

        // orbit camera (for, for controls)
        this.orbitCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.orbitCamera.position.set(18, 5, 22);
        this.orbitCamera.lookAt(0, 0, 0);

        this._resize();
    }

    // ─── post-processing ───────────────────────────────
    _initPostFX() {
        const pw = Math.floor(this.width * this.pixelRatio);
        const ph = Math.floor(this.height * this.pixelRatio);
        const hw = Math.floor(pw / 2);
        const hh = Math.floor(ph / 2);

        const rtOpts = {
            type: THREE.HalfFloatType,
            format: THREE.RGBAFormat,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
        };

        this.rtScene  = new THREE.WebGLRenderTarget(pw, ph, rtOpts);
        this.rtBright = new THREE.WebGLRenderTarget(hw, hh, rtOpts);
        this.rtBlurA  = new THREE.WebGLRenderTarget(hw, hh, rtOpts);
        this.rtBlurB  = new THREE.WebGLRenderTarget(hw, hh, rtOpts);

        // bright-pass material
        this.brightUniforms = {
            tDiffuse:  { value: this.rtScene.texture },
            uThreshold:{ value: this.params.bloomThreshold },
            uSoftKnee: { value: 0.4 },
        };
        this.brightMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: brightPassFragment,
            uniforms: this.brightUniforms,
        });

        // blur material
        this.blurUniforms = {
            tDiffuse:   { value: null },
            uTexelSize: { value: new THREE.Vector2(1, 1) },
            uDirection: { value: new THREE.Vector2(1, 0) },
        };
        this.blurMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: blurFragment,
            uniforms: this.blurUniforms,
        });

        // composite material
        this.compositeUniforms = {
            tScene:      { value: this.rtScene.texture },
            tBloom:      { value: this.rtBlurA.texture },
            uResolution: { value: new THREE.Vector2(pw, ph) },
            uTime:       { value: 0 },
            uBloom:      { value: this.params.bloom },
            uExposure:   { value: this.params.exposure },
            uVignette:   { value: this.params.vignette },
            uGrain:      { value: this.params.grain },
            uCA:         { value: this.params.chromaticAberration },
            uDebugView:  { value: this.debugView },
        };
        this.compositeMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader: compositeFragment,
            uniforms: this.compositeUniforms,
        });

        this.postScene = new THREE.Scene();
        this.postMesh = new THREE.Mesh(this.geo, this.compositeMaterial);
        this.postScene.add(this.postMesh);

        this.blurScene = new THREE.Scene();
        this.blurMesh = new THREE.Mesh(this.geo, this.blurMaterial);
        this.blurScene.add(this.blurMesh);

        this.brightScene = new THREE.Scene();
        this.brightMesh = new THREE.Mesh(this.geo, this.brightMaterial);
        this.brightScene.add(this.brightMesh);
    }

    // ─── controls ──────────────────────────────────────
    _initControls() {
        this.controls = new OrbitControls(this.orbitCamera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 100;
        this.controls.target.set(0, 0, 0);
    }

    // ─── HUD ───────────────────────────────────────────
    _initHUD() {
        this.hud = new HUD(this);
    }

    // ─── audio ─────────────────────────────────────────
    _initAudio() {
        this.audio = new AmbientAudio();
    }

    // ─── events ────────────────────────────────────────
    _initEvents() {
        this.controlsMgr = new Controls(this);
        window.addEventListener('resize', () => this._resize());
    }

    // ─── uniforms presets ──────────────────────────────────
    _applyViewPreset(idx) {
        this.viewPreset = idx;
        const p = VIEW_PRESETS[idx];
        this.orbitCamera.position.set(p.pos[0], p.pos[1], p.pos[2]);
        this.controls.target.set(p.target[0], p.target[1], p.target[2]);
        this.controls.update();
        this.params.fov = p.fov;
        this._saveState();
    }

    // ─── uniform update ────────────────────────────────
    _updateUniforms() {
        const u = this.rtUniforms;
        u.uResolution.value.set(this.width * this.pixelRatio, this.height * this.pixelRatio);
        u.uTime.value = (performance.now() - this.startTime) * 0.001;
        u.uFov.value = this.params.fov;
        u.uMass.value = this.params.mass;
        u.uDiskInner.value = this.params.diskInner;
        u.uDiskOuter.value = this.params.diskOuter;
        u.uDiskBrightness.value = this.params.diskBrightness;
        u.uDiskTempInner.value = this.params.diskTempInner;
        u.uDiskTempOuter.value = this.params.diskTempOuter;
        u.uTurbulenceScale.value = this.params.turbulenceScale;
        u.uTurbulenceSpeed.value = this.params.turbulenceSpeed;
        u.uDopplerStrength.value = this.params.dopplerStrength;
        u.uRedshiftStrength.value = this.params.redshiftStrength;
        u.uStarBrightness.value = this.params.starBrightness;
        u.uMilkyWayBrightness.value = this.params.milkyWayBrightness;
        u.uSteps.value = this.params.steps;
        u.uStepSize.value = this.params.stepSize;
        u.uDebugView.value = this.debugView;

        // camera
        if (this.cinematic) {
            this._updateCinematicCamera();
        }
        this.controls.update();
        this.orbitCamera.updateMatrixWorld();
        const pos = this.orbitCamera.position;
        u.uCameraPos.value.copy(pos);
        // build rotation matrix from camera (world direction)
        const m = this.orbitCamera.matrixWorld;
        const r = new THREE.Matrix3();
        r.setFromMatrix4(m);
        u.uCameraRot.value.copy(r);

        // post uniforms
        this.brightUniforms.uThreshold.value = this.params.bloomThreshold;
        this.compositeUniforms.uTime.value = u.uTime.value;
        this.compositeUniforms.uBloom.value = this.params.bloom;
        this.compositeUniforms.uExposure.value = this.params.exposure;
        this.compositeUniforms.uVignette.value = this.params.vignette;
        this.compositeUniforms.uGrain.value = this.params.grain;
        this.compositeUniforms.uCA.value = this.params.chromaticAberration;
        this.compositeUniforms.uDebugView.value = this.debugView;
    }

    _updateCinematicCamera() {
        const t = this.cinematicTime;
        const r = 16 + 6 * Math.sin(t * 0.08);
        const theta = t * 0.12;
        const phi = Math.PI * 0.35 + 0.25 * Math.sin(t * 0.05);
        this.orbitCamera.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
        this.controls.target.set(0, 0, 0);
    }

    // ─── render ────────────────────────────────────────
    _render() {
        // 1. ray-trace to HDR target
        this.renderer.setRenderTarget(this.rtScene);
        this.renderer.render(this.scene, this.camera);

        // 2. bright pass + blur (always rendered; debug views bypass in composite shader)
            // 2. bright pass
            this.brightUniforms.tDiffuse.value = this.rtScene.texture;
            this.renderer.setRenderTarget(this.rtBright);
            this.renderer.render(this.brightScene, this.camera);

            // 3. blur (ping-pong)
            this.blurUniforms.uTexelSize.value.set(
                1 / this.rtBright.width, 1 / this.rtBright.height
            );
            let src = this.rtBright;
            for (let i = 0; i < this.bloomIterations; i++) {
                // horizontal
                this.blurUniforms.tDiffuse.value = src.texture;
                this.blurUniforms.uDirection.value.set(1, 0);
                this.renderer.setRenderTarget(this.rtBlurB);
                this.renderer.render(this.blurScene, this.camera);
                // vertical
                this.blurUniforms.tDiffuse.value = this.rtBlurB.texture;
                this.blurUniforms.uDirection.value.set(0, 1);
                this.renderer.setRenderTarget(this.rtBlurA);
                this.renderer.render(this.blurScene, this.camera);
                src = this.rtBlurA;
            }
            this.compositeUniforms.tBloom.value = this.rtBlurA.texture;

        // 4. composite to screen
        this.compositeUniforms.tScene.value = this.rtScene.texture;
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.camera);
    }

    // ─── animation loop ────────────────────────────────
    _animate() {
        requestAnimationFrame(() => this._animate());

        if (this.paused) return;

        // hide loading screen on first frame
        if (!this._firstFrameDone) {
            this._firstFrameDone = true;
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.opacity = '0';
                setTimeout(() => { loading.style.display = 'none'; }, 1000);
            }
        }

        const now = performance.now();
        const dt = (now - this.lastTime) * 0.001;
        this.lastTime = now;

        // FPS
        this.frameCount++;
        this.fpsTime += dt;
        if (this.fpsTime >= 0.5) {
            this.fps = Math.round(this.frameCount / this.fpsTime);
            this.frameCount = 0;
            this.fpsTime = 0;
        }

        if (this.cinematic) {
            this.cinematicTime += dt;
        }

        this._updateUniforms();
        this._render();
        this.hud.update();
    }

    // ─── public API ────────────────────────────────────
    setParam(key, value) {
        this.params[key] = value;
        this._saveState();
    }

    setDebugView(v) {
        this.debugView = v;
        this._saveState();
    }

    setQuality(q) {
        this._setQuality(q);
    }

    toggleCinematic() {
        this.cinematic = !this.cinematic;
        if (this.cinematic) {
            this.cinematicTime = 0;
            this.controls.enabled = false;
        } else {
            this.controls.enabled = true;
        }
    }

    cycleViewPreset() {
        this._applyViewPreset((this.viewPreset + 1) % VIEW_PRESETS.length);
    }

    setViewPreset(idx) {
        this._applyViewPreset(idx);
    }

    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) this.lastTime = performance.now();
    }

    toggleAudio() {
        this.audio.toggle();
    }

    resetParams() {
        this.params = { ...DEFAULT_PARAMS };
        this._saveState();
    }

    screenshot() {
        this._render();
        const data = this.renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `gargantua_${Date.now()}.png`;
        link.href = data;
        link.click();
    }

    getCameraInfo() {
        const p = this.orbitCamera.position;
        return {
            x: p.x.toFixed(2),
            y: p.y.toFixed(2),
            z: p.z.toFixed(2),
            dist: p.length().toFixed(2),
        };
    }
}

// ─── bootstrap ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    try {
        window.gargantua = new Gargantua();
    } catch (e) {
        console.error(e);
        const overlay = document.getElementById('error-overlay');
        if (overlay) {
            overlay.querySelector('p').textContent = 'WebGL initialization failed: ' + e.message;
            overlay.style.display = 'flex';
        }
    }

    // URL screenshot automation
    const params = new URLSearchParams(window.location.search);
    if (params.has('screenshot')) {
        setTimeout(() => {
            if (window.gargantua) {
                window.gargantua.screenshot();
            }
        }, 2000);
    }
});
