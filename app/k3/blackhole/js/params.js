// Parameter definitions, quality & view presets, persistence.
export const PARAMS = [
  { section: 'Black Hole' },
  { id: 'mass',        label: 'Mass',            min: 0.4,  max: 3.0,  step: 0.01, def: 1.0 },
  { id: 'lensing',     label: 'Lensing',         min: 0.3,  max: 2.0,  step: 0.01, def: 1.0 },
  { id: 'ringGlow',    label: 'Photon Ring',     min: 0.0,  max: 2.0,  step: 0.01, def: 0.7 },
  { section: 'Accretion Disk' },
  { id: 'diskIn',      label: 'Inner Radius',    min: 1.0,  max: 6.0,  step: 0.01, def: 3.0 },
  { id: 'diskOut',     label: 'Outer Radius',    min: 6.0,  max: 30.0, step: 0.1,  def: 16.0 },
  { id: 'diskTemp',    label: 'Temperature',     min: 2000, max: 20000,step: 50,   def: 9000 },
  { id: 'diskBright',  label: 'Brightness',      min: 0.0,  max: 4.0,  step: 0.01, def: 0.75 },
  { id: 'turb',        label: 'Turbulence',      min: 0.0,  max: 2.0,  step: 0.01, def: 1.0 },
  { id: 'turbSpeed',   label: 'Turb Speed',      min: 0.0,  max: 3.0,  step: 0.01, def: 1.0 },
  { id: 'diskSpeed',   label: 'Rotation',        min: 0.0,  max: 2.0,  step: 0.01, def: 1.0 },
  { id: 'diskTilt',    label: 'Tilt (deg)',      min: 0.0,  max: 90.0, step: 0.5,  def: 12.0 },
  { id: 'diskHue',     label: 'Hue Shift',       min: -1.5, max: 1.5,  step: 0.01, def: 0.0 },
  { id: 'beaming',     label: 'Doppler Beam',    min: 0.0,  max: 5.0,  step: 0.01, def: 2.5 },
  { id: 'redshift',    label: 'Redshift',        min: 0.0,  max: 2.0,  step: 0.01, def: 1.0 },
  { section: 'Environment' },
  { id: 'starBright',  label: 'Star Bright',     min: 0.0,  max: 3.0,  step: 0.01, def: 1.0 },
  { id: 'starDensity', label: 'Star Density',    min: 0.0,  max: 2.0,  step: 0.01, def: 1.0 },
  { id: 'galaxyBright',label: 'Galaxy Bright',   min: 0.0,  max: 2.0,  step: 0.01, def: 1.0 },
  { id: 'galaxyTilt',  label: 'Galaxy Tilt',     min: 0.0,  max: 90.0, step: 0.5,  def: 62.0 },
  { section: 'Post' },
  { id: 'exposure',    label: 'Exposure',        min: 0.1,  max: 3.0,  step: 0.01, def: 0.95 },
  { id: 'bloomStrength',label:'Bloom Strength',  min: 0.0,  max: 3.0,  step: 0.01, def: 0.45 },
  { id: 'bloomRadius', label: 'Bloom Radius',    min: 0.0,  max: 1.0,  step: 0.01, def: 0.5 },
  { id: 'bloomThreshold',label:'Bloom Thresh',   min: 0.0,  max: 1.0,  step: 0.01, def: 0.6 },
  { id: 'vignette',    label: 'Vignette',        min: 0.0,  max: 1.0,  step: 0.01, def: 0.35 },
  { id: 'grain',       label: 'Film Grain',      min: 0.0,  max: 1.0,  step: 0.01, def: 0.25 },
  { id: 'ca',          label: 'Chromatic Aber',  min: 0.0,  max: 2.0,  step: 0.01, def: 0.5 },
  { section: 'Raymarch' },
  { id: 'steps',       label: 'Steps',           min: 32,   max: 512,  step: 8,    def: 160 },
  { id: 'stepSize',    label: 'Step Size',       min: 0.01, max: 0.2,  step: 0.005,def: 0.06 },
  { section: 'Camera' },
  { id: 'fov',         label: 'FOV',             min: 30,   max: 100,  step: 0.5,  def: 60 },
  { id: 'timeScale',   label: 'Time Scale',      min: 0.0,  max: 2.0,  step: 0.01, def: 1.0 },
];

export const QUALITY = {
  standard:  { label: 'Standard',  scale: 0.7,  steps: 128, bloom: true,  fxaa: true  },
  high:      { label: 'High',      scale: 1.0,  steps: 192, bloom: true,  fxaa: true  },
  cinematic: { label: 'Cinematic', scale: 1.4,  steps: 288, bloom: true,  fxaa: true  },
};

// 4 view presets: [radius, polarDeg, azimuthDeg]
export const VIEWS = [
  { name: 'Edge On',  r: 10.0, pol: 82, az: 0 },
  { name: 'Top Down', r: 15.0, pol: 22, az: 40 },
  { name: 'Close',    r: 4.6,  pol: 66, az: -30 },
  { name: 'Far',      r: 24.0, pol: 55, az: 120 },
];

const LS_KEY = 'gargantua_v1';

export function defaults() {
  const o = {};
  for (const p of PARAMS) if (p.id) o[p.id] = p.def;
  return o;
}

export function load() {
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) return { ...defaults(), ...JSON.parse(s) };
  } catch (e) {}
  return defaults();
}

export function save(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
}

export function loadMeta() {
  try { return JSON.parse(localStorage.getItem(LS_KEY + '_meta') || '{}'); } catch (e) { return {}; }
}
export function saveMeta(m) {
  try { localStorage.setItem(LS_KEY + '_meta', JSON.stringify(m)); } catch (e) {}
}