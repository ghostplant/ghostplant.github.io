// shaders.js — GLSL shader source for the Gargantua black hole raytracer

// ═══════════════════════════════════════════════════
//  Vertex shader (shared by all passes — full-screen quad)
// ═══════════════════════════════════════════════════
export const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// ═══════════════════════════════════════════════════
//  Ray-tracer fragment shader — Schwarzschild geodesic integrator
// ═══════════════════════════════════════════════════
export const raytracerFragment = `
precision highp float;

varying vec2 vUv;

uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uCameraPos;
uniform mat3  uCameraRot;
uniform float uFov;

// Black-hole / disk
uniform float uMass;
uniform float uDiskInner;
uniform float uDiskOuter;
uniform float uDiskBrightness;
uniform float uDiskTempInner;
uniform float uDiskTempOuter;
uniform float uTurbulenceScale;
uniform float uTurbulenceSpeed;
uniform float uDopplerStrength;
uniform float uRedshiftStrength;

// Starfield
uniform float uStarBrightness;
uniform float uMilkyWayBrightness;

// Quality
uniform int   uSteps;
uniform float uStepSize;

// Debug
uniform int   uDebugView;

const float PI  = 3.141592653589793;
const float TAU = 6.283185307179586;

// ─── hash / noise ───────────────────────────────────
float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
}
vec3 hash33(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.xxy + p.yxx) * p.zyx);
}
float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash13(i);
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));
    return mix(
        mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
        mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
        f.z
    );
}
float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise3(p);
        p = p * 2.03 + vec3(1.7, 9.2, 3.3);
        a *= 0.5;
    }
    return v;
}

// ─── blackbody colour ──────────────────────────────
vec3 blackbody(float t) {
    t = clamp(t, 0.0, 1.0);
    vec3 c0 = vec3(1.0, 0.25, 0.05);
    vec3 c1 = vec3(1.0, 0.50, 0.15);
    vec3 c2 = vec3(1.0, 0.80, 0.45);
    vec3 c3 = vec3(1.0, 0.95, 0.80);
    vec3 c4 = vec3(0.75, 0.90, 1.0);
    if (t < 0.25)      return mix(c0, c1, t / 0.25);
    else if (t < 0.5)  return mix(c1, c2, (t - 0.25) / 0.25);
    else if (t < 0.75) return mix(c2, c3, (t - 0.5) / 0.25);
    else               return mix(c3, c4, (t - 0.75) / 0.25);
}

// ─── starfield ─────────────────────────────────────
vec3 starfield(vec3 dir) {
    vec3 col = vec3(0.0);
    col += vec3(0.002, 0.002, 0.004);

    // galactic-plane rotation
    float ga = 0.35;
    float cg = cos(ga), sg = sin(ga);
    vec3 gd = vec3(dir.x * cg - dir.y * sg, dir.x * sg + dir.y * cg, dir.z);
    float lat = gd.y;
    float mw = exp(-lat * lat * 5.5);

    float d1 = fbm(gd * 3.0);
    float d2 = fbm(gd * 7.0 + 11.0);
    vec3 mwCol = mix(vec3(0.35, 0.28, 0.20), vec3(0.55, 0.42, 0.28), d1);
    mwCol *= 0.4 + 0.6 * d2;
    col += mwCol * mw * uMilkyWayBrightness * 0.4;

    float neb = fbm(dir * 2.5 + 17.0);
    vec3 nebCol = mix(vec3(0.08, 0.04, 0.15), vec3(0.15, 0.08, 0.25), neb);
    col += nebCol * smoothstep(0.55, 0.85, neb) * 0.25;

    for (int s = 0; s < 3; s++) {
        float scale = 70.0 * pow(2.0, float(s));
        float density = 0.02 / pow(1.8, float(s));
        vec3 p = dir * scale;
        vec3 cell = floor(p);
        vec3 f = fract(p);
        for (int x = -1; x <= 1; x++) {
            for (int y = -1; y <= 1; y++) {
                for (int z = -1; z <= 1; z++) {
                    vec3 o = vec3(float(x), float(y), float(z));
                    vec3 h = hash33(cell + o);
                    if (h.x < density) {
                        vec3 sp = o + h - 0.5;
                        float d = length(f - sp);
                        float br = exp(-d * d * 90.0) * (h.x / density);
                        float temp = h.y;
                        vec3 sc = mix(vec3(1.0, 0.55, 0.3), vec3(0.65, 0.78, 1.0), temp);
                        float mag = pow(h.z, 4.0);
                        col += sc * br * mag * uStarBrightness * (1.0 + float(s) * 0.3);
                    }
                }
            }
        }
    }
    return col;
}

// ─── accretion-disk sampler ──────────────────────────
vec3 sampleDisk(vec3 pos, vec3 dir, out float oDoppler, out float oRedshift) {
    float rs = 2.0 * uMass;
    float r = length(pos.xz);
    float rIn = uDiskInner * rs;
    float rOut = uDiskOuter * rs;
    float tNorm = clamp((r - rIn) / (rOut - rIn), 0.0, 1.0);

    // Shakura–Sunyaev temperature  T ∝ r^{-3/4}
    float tempRatio = pow(rIn / max(r, rIn * 0.5), 0.75);
    float tempEmit = mix(uDiskTempOuter, uDiskTempInner, tempRatio);

    // Keplerian velocity  v = sqrt(rs / 2r)
    float v = sqrt(rs / (2.0 * r));
    v = clamp(v, 0.0, 0.95);
    vec3 velDir = normalize(vec3(-pos.z, 0.0, pos.x));
    float gamma = 1.0 / sqrt(1.0 - v * v);
    float betaN = dot(velDir * v, -dir);
    float doppler = 1.0 / (gamma * (1.0 - betaN));
    doppler = clamp(doppler, 0.05, 12.0);
    oDoppler = doppler;

    // gravitational redshift
    float gShift = sqrt(max(0.01, 1.0 - rs / r));
    oRedshift = gShift;

    // observed temperature shifts colour
    float tempObs = tempEmit * doppler * gShift;
    vec3 col = blackbody(tempObs);

    // Doppler beaming δ³ + Stefan–Boltzmann T⁴
    float brightness = pow(tempEmit, 4.0) * pow(doppler, 3.0 + uDopplerStrength);
    brightness *= pow(gShift, 4.0 + uRedshiftStrength);

    // turbulence — differential Keplerian rotation
    float phi = atan(pos.z, pos.x);
    float omega = sqrt(rs / (2.0 * r * r * r));
    vec3 tp = vec3(
        log(r + 1.0) * uTurbulenceScale,
        phi * 1.5 + omega * uTime * uTurbulenceSpeed * 15.0,
        uTime * 0.08
    );
    float turb = fbm(tp);
    float density = smoothstep(0.18, 0.72, turb);
    float fine = fbm(tp * 4.5 + 3.1);
    density *= 0.45 + 0.55 * fine;

    // radial density profile (soft edges)
    float radial = smoothstep(0.0, 0.06, tNorm) * smoothstep(1.0, 0.82, tNorm);

    // spiral arms
    float spiral = sin(phi * 2.0 + log(r) * 3.0 + uTime * 0.3) * 0.5 + 0.5;
    density *= 0.6 + 0.4 * spiral;

    return col * brightness * density * radial * uDiskBrightness;
}

// ─── debug globals ──────────────────────────────────
float gDepth;
int   gCrossings;
float gDoppler;
float gRedshift;
int   gSteps;

// ─── Schwarzschild geodesic integrator ──────────────
vec3 traceRay(vec3 ro, vec3 rd) {
    vec3 pos = ro;
    vec3 dir = rd;
    vec3 col = vec3(0.0);
    float trans = 1.0;

    float rs = 2.0 * uMass;
    vec3 L = cross(pos, dir);
    float L2 = dot(L, L);

    float prevY = pos.y;
    gDepth = 0.0;
    gCrossings = 0;
    gDoppler = 1.0;
    gRedshift = 1.0;
    gSteps = 0;

    for (int i = 0; i < 400; i++) {
        if (i >= uSteps) break;
        gSteps++;

        float r = length(pos);

        // event horizon
        if (r < rs * 1.001) {
            gDepth += uStepSize * r;
            break;
        }

        // adaptive step
        float dt = uStepSize * clamp(r / rs, 0.25, 5.0);

        // gravitational acceleration  d²r/dλ² = -3/2 · rs · L² / r⁵ · r
        float r2 = r * r;
        float r5 = r2 * r2 * r;
        vec3 acc = -1.5 * rs * L2 / r5 * pos;

        dir += acc * dt;
        dir = normalize(dir);
        vec3 newPos = pos + dir * dt;
        gDepth += dt;

        // disk-plane crossing (y = 0)
        if (prevY * newPos.y < 0.0) {
            float tc = -prevY / (newPos.y - prevY);
            vec3 cp = mix(pos, newPos, tc);
            float cr = length(cp.xz);
            if (cr > uDiskInner * rs && cr < uDiskOuter * rs) {
                float dopp, rsft;
                vec3 dc = sampleDisk(cp, dir, dopp, rsft);
                col += trans * dc;
                trans *= 1.0 - clamp(length(dc) * 0.35, 0.0, 0.92);
                gCrossings++;
                gDoppler = max(gDoppler, dopp);
                gRedshift = min(gRedshift, rsft);
            }
        }

        prevY = newPos.y;
        pos = newPos;

        // escape
        if (r > 60.0 * rs) {
            col += trans * starfield(dir);
            break;
        }
    }

    // ran out of steps — sample starfield as fallback
    if (length(pos) > rs * 1.01 && length(pos) < 60.0 * rs) {
        col += trans * starfield(dir);
    }

    return col;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
    float halfH = tan(uFov * 0.5);
    vec3 rd = normalize(uCameraRot * vec3(uv.x * 2.0 * halfH, uv.y * 2.0 * halfH, -1.0));

    vec3 col = traceRay(uCameraPos, rd);

    // debug views
    if (uDebugView == 2) {
        col = vec3(gDepth * 0.013);
    } else if (uDebugView == 3) {
        col = vec3(float(gCrossings) * 0.25, 0.0, 0.0);
    } else if (uDebugView == 4) {
        col = starfield(rd);
    } else if (uDebugView == 5) {
        col = vec3(clamp((gDoppler - 1.0) * 0.5, 0.0, 1.0));
    } else if (uDebugView == 6) {
        col = vec3(clamp(1.0 - gRedshift, 0.0, 1.0));
    } else if (uDebugView == 7) {
        col = vec3(float(gCrossings) / 4.0);
    } else if (uDebugView == 8) {
        col = vec3(float(gSteps) / float(uSteps));
    } else if (uDebugView == 9) {
        col = vec3(gDepth * 0.003, gDepth * 0.002, gDepth * 0.001);
    }

    gl_FragColor = vec4(col, 1.0);
}
`;

// ═══════════════════════════════════════════════════
//  Bright-pass fragment shader
// ═══════════════════════════════════════════════════
export const brightPassFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uThreshold;
uniform float uSoftKnee;
void main() {
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    float b = max(c.r, max(c.g, c.b));
    float contrib = max(b - uThreshold, 0.0);
    contrib = contrib / (contrib + uSoftKnee);
    gl_FragColor = vec4(c * contrib, 1.0);
}
`;

// ═══════════════════════════════════════════════════
//  Gaussian blur fragment shader
// ═══════════════════════════════════════════════════
export const blurFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 uTexelSize;
uniform vec2 uDirection;
void main() {
    vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227027;
    sum += texture2D(tDiffuse, vUv + uDirection * uTexelSize * 1.0).rgb * 0.1945946;
    sum += texture2D(tDiffuse, vUv - uDirection * uTexelSize * 1.0).rgb * 0.1945946;
    sum += texture2D(tDiffuse, vUv + uDirection * uTexelSize * 2.0).rgb * 0.1216216;
    sum += texture2D(tDiffuse, vUv - uDirection * uTexelSize * 2.0).rgb * 0.1216216;
    sum += texture2D(tDiffuse, vUv + uDirection * uTexelSize * 3.0).rgb * 0.054054;
    sum += texture2D(tDiffuse, vUv - uDirection * uTexelSize * 3.0).rgb * 0.054054;
    sum += texture2D(tDiffuse, vUv + uDirection * uTexelSize * 4.0).rgb * 0.016216;
    sum += texture2D(tDiffuse, vUv - uDirection * uTexelSize * 4.0).rgb * 0.016216;
    gl_FragColor = vec4(sum, 1.0);
}
`;

// ═══════════════════════════════════════════════════
//  Composite fragment shader — bloom + ACES + vignette + grain + CA
// ═══════════════════════════════════════════════════
export const compositeFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2  uResolution;
uniform float uTime;
uniform float uBloom;
uniform float uExposure;
uniform float uVignette;
uniform float uGrain;
uniform float uCA;
uniform int   uDebugView;

vec3 ACESFilm(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
    vec2 uv = vUv;

    // debug views: bypass post-processing
    if (uDebugView == 1) {
        vec3 raw = texture2D(tScene, uv).rgb;
        raw = ACESFilm(raw * uExposure);
        gl_FragColor = vec4(raw, 1.0);
        return;
    }
    if (uDebugView >= 2) {
        gl_FragColor = vec4(texture2D(tScene, uv).rgb, 1.0);
        return;
    }

    // chromatic aberration
    vec2 dir = (uv - 0.5) * 2.0;
    float caAmt = uCA * 0.004;
    vec3 scene;
    scene.r = texture2D(tScene, uv + dir * caAmt).r;
    scene.g = texture2D(tScene, uv).g;
    scene.b = texture2D(tScene, uv - dir * caAmt).b;

    // bloom
    vec3 bloom = texture2D(tBloom, uv).rgb;
    vec3 col = scene + bloom * uBloom;

    // exposure + ACES
    col *= uExposure;
    col = ACESFilm(col);

    // gamma
    col = pow(col, vec3(1.0 / 2.2));

    // vignette
    float vig = 1.0 - uVignette * dot(dir, dir);
    col *= clamp(vig, 0.0, 1.0);

    // film grain
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
    col += (g - 0.5) * uGrain * 0.06;

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
}
`;
