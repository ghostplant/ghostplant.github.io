// config.js — parameters, quality presets, and view presets

export const DEFAULT_PARAMS = {
    // Black hole
    mass:               1.0,    // 1  — Schwarzschild radius = 2*mass
    // Accretion disk
    diskInner:          3.0,    // 2  — inner radius (× rs)  [ISCO � 3]
    diskOuter:          12.0,   // 3  — outer radius (× rs)
    diskBrightness:     1.8,    // 4  — disk emissivity scale
    diskTempInner:      1.0,    // 5  — inner edge temperature (0-1)
    diskTempOuter:      0.25,   // 6  — outer edge temperature (0-1)
    turbulenceScale:    2.5,    // 7  — turbulence spatial frequency
    turbulenceSpeed:    1.0,    // 8  — turbulence time scale
    // Physics
    dopplerStrength:    1.0,    // 9  — Dop Doppler beaming exponent
    redshiftStrength:   1.0,    // 10 — extra gravitational redshift exponent
    // Starfield
    starBrightness:     1.0,    // 11 — star brightness multiplier
    milkyWayBrightness: 1.0,    // 12 — Milky Way brightness multiplier
    // Camera
    fov:                1.0,    // 13 — field of view (radians)
    // Quality
    steps:              200,    // 14 — ray-march steps (int)
    stepSize:           0.15,   // 15 — base step size (× rs)
    // Post-processing
    bloom:              0.8,    // 16 — bloom intensity
    exposure:           1.2,    // 17 — ACES exposure
    vignette:           0.35,   // 18 — vignette strength
    grain:              0.5,    // 19 — film grain amount
    chromaticAberration:0.5,    // 20 — chromatic aberration amount
    bloomThreshold:     0.8,    // 21 — bloom threshold
};

export const PARAM_META = [
    { key: 'mass',               label: 'BH Mass',            min: 0.3,  max: 3.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'diskInner',          label: 'Disk Inner R',       min: 1.5,  max: 6.0,  step: 0.1,  fmt: v => v.toFixed(1) + ' rs' },
    { key: 'diskOuter',          label: 'Disk Outer R',       min: 6.0,  max: 30.0, step: 0.5,  fmt: v => v.toFixed(1) + ' rs' },
    { key: 'diskBrightness',     label: 'Disk Brightness',    min: 0.0,  max: 5.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'diskTempInner',      label: 'Disk Temp Inner',    min: 0.0,  max: 1.0,  step: 0.01, fmt: v => v.toFixed(2) },
    { key: 'diskTempOuter',      label: 'Disk Temp Outer',    min: 0.0,  max: 1.0,  step: 0.01, fmt: v => v.toFixed(2) },
    { key: 'turbulenceScale',    label: 'Turbulence Scale',   min: 0.5,  max: 10.0, step: 0.1,  fmt: v => v.toFixed(1) },
    { key: 'turbulenceSpeed',    label: 'Turbulence Speed',   min: 0.0,  max: 5.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'dopplerStrength',    label: 'Doppler Strength',   min: 0.0,  max: 3.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'redshiftStrength',   label: 'Redshift Strength',  min: 0.0,  max: 3.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'starBrightness',     label: 'Star Brightness',    min: 0.0,  max: 3.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'milkyWayBrightness', label: 'Milky Way',          min: 0.0,  max: 3.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'fov',                label: 'FOV',                min: 0.3,  max: 2.5,  step: 0.02, fmt: v => (v * 180 / Math.PI).toFixed(0) + '°' },
    { key: 'steps',              label: 'Ray Steps',          min: 32,   max: 400,  step: 8,    fmt: v => v.toFixed(0), int: true },
    { key: 'stepSize',           label: 'Step Size',          min: 0.05, max: 0.5,  step: 0.01, fmt: v => v.toFixed(2) },
    { key: 'bloom',              label: 'Bloom',              min: 0.0,  max: 3.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'exposure',           label: 'Exposure',           min: 0.1,  max: 4.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'vignette',           label: 'Vignette',           min: 0.0,  max: 1.0,  step: 0.02, fmt: v => v.toFixed(2) },
    { key: 'grain',              label: 'Film Grain',          min: 0.0,  max: 2.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'chromaticAberration',label: 'Chromatic Aberr.',   min: 0.0,  max: 2.0,  step: 0.05, fmt: v => v.toFixed(2) },
    { key: 'bloomThreshold',     label: 'Bloom Threshold',    min: 0.0,  max: 3.0,  step: 0.05, fmt: v => v.toFixed(2) },
];

export const QUALITY_PRESETS = {
    standard: {
        steps: 100,
        stepSize: 0.2,
        pixelRatio: 1.0,
        bloomIterations: 2,
    },
    high: {
        steps: 200,
        stepSize: 0.15,
        pixelRatio: 1.5,
        bloomIterations: 4,
    },
    cinematic: {
        steps: 300,
        stepSize: 0.1,
        pixelRatio: 2.0,
        bloomIterations: 6,
    },
};

export const VIEW_PRESETS = [
    {
        name: 'Cinematic',
        pos: [18, 5, 22],
        target: [0, 0, 0],
        fov: 0.9,
    },
    {
        name: 'Edge-on',
        pos: [0, 0.5, 20],
        target: [0, 0, 0],
        fov: 1.0,
    },
    {
        name: 'Top-down',
        pos: [0, 25, 0.1],
        target: [0, 0, 0],
        fov: 0.8,
    },
    {
        name: 'Close-up',
        pos: [6, 2, 6],
        target: [0, 0, 0],
        fov: 1.2,
    },
];

export const DEBUG_VIEWS = [
    'Final Composite',
    'Raw Ray-traced',
    'Ray Depth',
    'Disk Crossings',
    'Starfield Only',
    'Doppler Factor',
    'Redshift Factor',
    'Crossing Count',
    'Step Ratio',
    'Depth Colour',
];
