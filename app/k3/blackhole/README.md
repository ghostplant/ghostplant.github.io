# GARGANTUA — Schwarzschild Black Hole Raytracer

A real-time, physically-based Schwarzschild black hole renderer running entirely in the
browser. The image is produced by a full-screen **fragment shader** that integrates
**null geodesics** (light rays) through the Schwarzschild spacetime — no black sprites,
no billboards, no textures, no video, no screenshots.

Built with **Three.js (WebGL2) + GLSL**, ES Modules, no build step.

---

## Run

Any static file server works. From the project root:

```bash
# option A (no dependencies)
python3 -m http.server 8080

# option B
npx serve .
```

Then open **http://localhost:8080**

> A server is required (not `file://`) because the app uses ES Modules and fetches the
> audio file. Everything is local — no internet needed at runtime.

---

## Features

**Physics (all in the fragment shader)**
- Exact Schwarzschild photon geodesic `d²x/dλ² = −1.5 h² x / r⁵` (conserved angular
  momentum `h = |x × v|`), integrated with a leap-frog scheme and adaptive step size.
- **Event horizon** — captured rays return true black.
- **Photon ring** — from the geodesic integration plus an analytic critical-impact-parameter
  (`b_crit = 3√3·M`) enhancement.
- **Gravitational lensing** — the starfield, galaxy and the far side of the disk are
  bent by the spacetime (the far disk appears above/below the hole).
- **Multiple accretion-disk crossings** — up to 3 plane crossings per ray with
  front-to-back alpha blending.
- **Doppler beaming + gravitational redshift** — relativistic `g`-factor
  `g = √(1−1/r) / (γ(1+β·k))` shifts both the color (blackbody) and the intensity.
- **Dynamic disk turbulence** — FBM noise advected by the Keplerian flow
  (`ω ∝ r^(−3/2)`), giving differential-rotation shear.
- **Procedural starfield + spiral galaxy** — hash-based 3D stars and an FBM spiral
  galaxy, both lensed by the black hole.

**Post-processing (HDR pipeline)**
- Half-float HDR render target.
- **UnrealBloom** (HDR bloom).
- **ACES** filmic tonemapping.
- **Chromatic aberration**, **vignette**, **film grain**, **FXAA**.

**Interaction / App**
- Cinematic camera loop (auto-orbit) + **OrbitControls** (drag / wheel / touch).
- **4 view presets** (Edge On / Top Down / Close / Far) with smooth transitions.
- **27 parameters** in a collapsible panel (mass, lensing, disk radii/temperature/
  turbulence/tilt/hue, Doppler, redshift, stars, galaxy, bloom, exposure, grain, …).
- **10 debug views** (keys `0–9`).
- **3 quality presets** — Standard / High / Cinematic (render scale + step count).
- **HUD** (FPS, radius, quality, steps), help overlay, keyboard shortcuts.
- **Ambient music** — `audio/ambience.wav` (seamless loop) with a WebAudio synth fallback.
- **State persistence** (parameters + quality + music) via `localStorage`.
- **Retina / mobile** support (device-pixel-ratio aware, touch controls, responsive UI).
- **WebGL error recovery** — context-lost handling + error overlay.
- **URL screenshot / automation API** (see below).

---

## Keyboard

| Key | Action |
| --- | --- |
| Drag / Wheel / Touch | Orbit / Zoom |
| `Space` | Pause time |
| `C` | Cinematic camera toggle |
| `Q` | Cycle quality (Standard → High → Cinematic) |
| `F1 – F4` | View presets |
| `0 – 9` | Debug views |
| `M` | Music on/off |
| `S` | Screenshot (PNG) |
| `F` | Fullscreen |
| `G` | Parameter panel |
| `H` | Help |
| `R` | Reset parameters |

**Debug views:** `0` normal · `1` ray direction · `2` step count · `3` disk crossings ·
`4` impact parameter · `5` sky · `6` photon-sphere glow · `7` disk alpha · `8` photon ring ·
`9` raw HDR.

---

## URL / Screenshot Automation API

Query parameters control the scene for headless capture and testing:

```
?shot=1            enable automation mode (sets window.__READY__ and document.title)
&t=2               warm-up time in seconds before ready
&view=0..3         view preset
&q=standard|high|cinematic   quality preset
&nohud=1           hide all UI
&debug=0..9        debug view
&dl=1              auto-download a PNG when ready
&<paramId>=<value> override any parameter (e.g. &diskBright=1.2&steps=256&mass=1.5)
```

Example (headless, waits for `window.__READY__`):

```
http://localhost:8080/?shot=1&t=1&view=0&q=high&nohud=1&diskBright=1.0
```

Parameter ids: `mass, lensing, ringGlow, diskIn, diskOut, diskTemp, diskBright, turb,
turbSpeed, diskSpeed, diskTilt, diskHue, beaming, redshift, starBright, starDensity,
galaxyBright, galaxyTilt, exposure, bloomStrength, bloomRadius, bloomThreshold, vignette,
grain, ca, steps, stepSize, fov, timeScale`.

---

## Project structure

```
index.html                  entry point (importmap + UI skeleton)
css/style.css               dark theme, HUD, panel, responsive
js/main.js                  app: renderer, composer, camera, loop, UI wiring, API
js/shaders.js               GLSL: geodesic raymarcher + post shaders
js/params.js                parameter defs, quality & view presets, persistence
js/ui.js                    parameter panel builder
js/audio.js                 ambient music (WAV + WebAudio synth fallback)
vendor/three/               three.module.js + addons (OrbitControls, post-processing)
audio/ambience.wav          generated seamless ambient loop
tools/make_audio.py         regenerates audio/ambience.wav
tools/test.mjs              headless render + console-error test
tools/shot.mjs              headless single-screenshot helper
```

---

## Tests

Headless rendering + console-error check (requires a Chrome/Chromium binary and
`puppeteer-core`):

```bash
npm install                 # installs puppeteer-core (dev only)
# point tools/test.mjs at your Chrome binary if needed, then:
npm test
```

**Latest results (headless, SwiftShader WebGL2):**

| Test | Result |
| --- | --- |
| Page load + shader compile | ✅ no console errors |
| Screenshot automation (`?shot=1`) | ✅ `window.__READY__` + PNG |
| Debug views 0–9 | ✅ render, no errors |
| Quality presets (Standard/High/Cinematic) | ✅ no errors |
| View presets F1–F4 + buttons | ✅ no errors |
| Orbit / keyboard / panel interactions | ✅ no errors |
| Mobile viewport (touch, 390×700) | ✅ no errors |
| 404 / failed requests | ✅ none |

---

## Notes

- Coordinates use `rs = 1` (horizon at `r = 1`, photon sphere `r = 1.5`, ISCO `r = 3`).
- The `mass` parameter scales the whole scene (camera distance in `rs` units).
- The `lensing` parameter scales the deflection strength (1.0 = physical).
- Music starts on first user gesture (browser autoplay policy); it can be toggled with `M`.