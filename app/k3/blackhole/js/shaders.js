// GARGANTUA — Schwarzschild raymarcher shaders (ES module, template strings)
// Units: Schwarzschild radius rs = 1 (horizon r=1, photon sphere r=1.5, ISCO r=3).
// Exact photon geodesic: d^2x/dλ^2 = -1.5 * h^2 * x / r^5  (M = 0.5), h = |x × v| conserved.

export const VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const FRAG = /* glsl */`
precision highp float;

varying vec2 vUv;

uniform vec2  uResolution;
uniform float uTime;
uniform vec3  uCamPos;
uniform mat3  uCamMat;
uniform float uTanH;
uniform mat3  uDiskRot;
uniform mat3  uDiskRotInv;
uniform vec3  uGalaxyN;
uniform vec3  uGalaxyU;
uniform vec3  uGalaxyV;

uniform int   uSteps;
uniform float uStepSize;
uniform float uLensing;
uniform float uDiskIn;
uniform float uDiskOut;
uniform float uDiskTemp;
uniform float uDiskBright;
uniform float uTurb;
uniform float uTurbSpeed;
uniform float uDiskSpeed;
uniform float uDiskHue;
uniform float uBeaming;
uniform float uRedshift;
uniform float uStarBright;
uniform float uStarDensity;
uniform float uGalaxyBright;
uniform float uRingGlow;
uniform float uExposure;
uniform int   uDebug;

#define RMAX 90.0
#define PI 3.14159265359

// ---------- hash / noise ----------
float hash13(vec3 p){
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
vec3 hash33(vec3 p){
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float n000=hash13(i), n100=hash13(i+vec3(1,0,0));
  float n010=hash13(i+vec3(0,1,0)), n110=hash13(i+vec3(1,1,0));
  float n001=hash13(i+vec3(0,0,1)), n101=hash13(i+vec3(1,0,1));
  float n011=hash13(i+vec3(0,1,1)), n111=hash13(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y),
             mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y),f.z);
}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){
    v += a * vnoise(p);
    p = p * 2.03 + vec3(11.5, 7.3, 5.1);
    a *= 0.5;
  }
  return v;
}

// ---------- color ----------
vec3 blackbody(float T){
  T = max(T, 0.0);
  vec3 c;
  c.r = 1.0 / (0.4 + exp(-2.2*T)) + 0.25/(1.0+T*T);
  c.g = 1.0 / (0.6 + exp(-1.6*T)) * (0.85 + 0.15*tanh(T-0.5));
  c.b = 1.0 / (1.2 + exp(-1.1*(T-0.35)));
  c.b *= 0.9 + 0.4*tanh(T-1.0);
  return c;
}
vec3 hueShift(vec3 c, float h){
  const vec3 k = vec3(0.57735);
  float cs = cos(h), sn = sin(h);
  return c*cs + cross(k, c)*sn + k*dot(k, c)*(1.0-cs);
}

// ---------- starfield ----------
vec3 stars(vec3 d, float density, float bright){
  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++){
    float scale = 60.0 + float(i)*70.0;
    vec3 p = d * scale;
    vec3 id = floor(p);
    vec3 f = fract(p) - 0.5;
    vec3 h = hash33(id);
    float star = step(1.0 - 0.03*density, h.x);
    float dist = length(f);
    float tw = 0.7 + 0.3*sin(uTime*2.0 + h.y*40.0);
    float s = star * smoothstep(0.5, 0.0, dist) * tw;
    s = pow(s, 3.0);
    vec3 sc = mix(vec3(0.6,0.7,1.0), vec3(1.0,0.7,0.4), h.z);
    col += s * sc * bright * (0.5 + 1.5*h.y);
  }
  return col;
}

// ---------- galaxy ----------
vec3 galaxy(vec3 d, float bright){
  float dp = dot(d, uGalaxyN);
  vec3 pr = d - uGalaxyN * dp;
  float r = length(pr) + 1e-4;
  vec2 uv = vec2(dot(pr, uGalaxyU), dot(pr, uGalaxyV)) / r;
  float ang = atan(uv.y, uv.x);
  float rr = r;
  float spiral = sin(ang*2.0 - log(rr+0.15)*5.0);
  spiral = smoothstep(0.0, 1.0, spiral*0.5+0.5);
  float dust = fbm(vec3(uv*3.0, rr*4.0));
  float disk = exp(-abs(dp)*6.0) * exp(-rr*1.6) * (0.4 + 0.6*spiral);
  disk *= (0.5 + 0.8*dust);
  float bulge = exp(-(rr*rr + dp*dp*4.0)*6.0);
  vec3 armC = mix(vec3(0.35,0.5,1.0), vec3(1.0,0.6,0.4), spiral*0.5);
  vec3 col = disk * armC * 1.4 + bulge * vec3(1.0,0.85,0.6) * 1.2;
  col *= 1.0 - 0.7*exp(-abs(dp)*14.0)*smoothstep(1.2,0.2,rr);
  return col * bright;
}

// ---------- disk emission ----------
vec3 diskEmission(vec3 hit, vec3 vdir, float hr, out float alpha){
  float vk = sqrt(0.5 / hr);
  float omega = vk / hr;
  float rot = uTime * uDiskSpeed * omega * 1.6;
  float ca = cos(rot), sa = sin(rot);
  vec2 rp = mat2(ca, -sa, sa, ca) * hit.xz;
  float n = fbm(vec3(rp * 1.4, hr * 2.2));
  n = pow(n, 1.6);
  n = mix(1.0, n * 2.2, uTurb);
  float x = uDiskIn / hr;
  float prof = pow(x, 1.7);
  float edge = smoothstep(uDiskIn, uDiskIn*1.18, hr);
  float outer = 1.0 - smoothstep(uDiskOut*0.6, uDiskOut, hr);
  float T = uDiskTemp * pow(x, 0.75) / 9000.0;
  vec3 vDisk = normalize(vec3(-hit.z, 0.0, hit.x)) * vk;
  float b2 = vk*vk;
  float gam = 1.0 / sqrt(max(1.0 - b2, 1e-4));
  float gG = sqrt(max(1.0 - 1.0/hr, 1e-4));
  float g = gG / (gam * (1.0 + dot(vDisk, vdir)));
  g = pow(g, uRedshift);
  vec3 c = blackbody(T * g * 2.4);
  c = hueShift(c, uDiskHue);
  float beam = pow(max(g, 0.0), uBeaming);
  float I = prof * edge * outer * n;
  alpha = clamp(I * uDiskBright * 1.4, 0.0, 1.0);
  return c * I * beam * uDiskBright;
}

// ---------- main ----------
vec3 render(vec3 ro, vec3 rd, out vec4 dbg){
  vec3 p = uDiskRot * ro;
  vec3 v = uDiskRot * rd;
  vec3 h = cross(p, v);
  float h2 = dot(h, h);
  float b0 = sqrt(h2);

  vec3 col = vec3(0.0);
  float trans = 1.0;
  vec3 prevP = p;
  int crossings = 0;
  bool captured = false;
  float glow = 0.0;
  float stepsUsed = 0.0;

  for (int i = 0; i < 1024; i++){
    if (i >= uSteps) break;
    stepsUsed += 1.0;
    float r2 = dot(p, p);
    float r = sqrt(r2);
    if (r < 1.0){ captured = true; break; }
    if (r2 > RMAX*RMAX) break;

    float dt = uStepSize * r2 / (r + 0.4);
    dt = min(dt, 0.6);

    prevP = p;
    vec3 a = (-1.5 * uLensing * h2) * p / (r2 * r2 * r);
    v += a * dt;
    p += v * dt;

    glow += exp(-abs(r - 1.5) * 6.0) * dt * 0.6;

    if (p.y * prevP.y < 0.0 && crossings < 3){
      float t = prevP.y / (prevP.y - p.y);
      vec3 hit = mix(prevP, p, t);
      float hr = length(hit.xz);
      if (hr > uDiskIn && hr < uDiskOut){
        float al;
        vec3 vdir = normalize(v);
        vec3 ec = diskEmission(hit, vdir, hr, al);
        col += trans * ec;
        trans *= (1.0 - al);
        crossings++;
      }
    }
  }

  float bCrit = 2.598;
  float ring = exp(-pow((b0 - bCrit) * 6.0, 2.0));
  ring *= smoothstep(0.9, 1.0, 1.0 - abs(b0 - bCrit));
  col += ring * uRingGlow * vec3(1.0, 0.9, 0.8) * 2.0;
  col += glow * uRingGlow * 0.4 * vec3(1.0, 0.7, 0.5);

  if (!captured){
    vec3 dirW = uDiskRotInv * normalize(v);
    vec3 bg = stars(dirW, uStarDensity, uStarBright);
    bg += galaxy(dirW, uGalaxyBright);
    col += trans * bg;
  }

  if (uDebug == 1) dbg = vec4(normalize(v)*0.5+0.5, 1.0);
  else if (uDebug == 2) dbg = vec4(vec3(stepsUsed / float(uSteps)), 1.0);
  else if (uDebug == 3) dbg = vec4(vec3(float(crossings) / 3.0), 1.0);
  else if (uDebug == 4) dbg = vec4(vec3(b0 / 6.0), 1.0);
  else if (uDebug == 5) dbg = vec4(captured ? vec3(0.0) : (uDiskRotInv*normalize(v))*0.5+0.5, 1.0);
  else if (uDebug == 6) dbg = vec4(vec3(glow), 1.0);
  else if (uDebug == 7) dbg = vec4(vec3(1.0 - trans), 1.0);
  else if (uDebug == 8) dbg = vec4(vec3(ring), 1.0);
  else dbg = vec4(0.0);

  return col;
}

void main(){
  vec2 ndc = vUv * 2.0 - 1.0;
  ndc.x *= uResolution.x / uResolution.y;
  vec3 rd = normalize(uCamMat * vec3(ndc * uTanH, -1.0));
  vec3 ro = uCamPos;

  vec4 dbg;
  vec3 col = render(ro, rd, dbg);

  if (uDebug == 0) {
    gl_FragColor = vec4(col * uExposure, 1.0);
  } else if (uDebug == 9) {
    gl_FragColor = vec4(col * uExposure, 1.0);
  } else {
    gl_FragColor = dbg;
  }
}
`;

// Final composite: chromatic aberration + ACES + sRGB + vignette
export const FINAL_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uCA;
uniform float uVignette;

vec3 aces(vec3 x){
  const float a=2.51, b=0.03, c=2.43, d=0.59, e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}
void main(){
  vec2 uv = vUv;
  vec2 d = (uv - 0.5) * uCA * 0.01;
  vec3 col;
  col.r = texture2D(tDiffuse, uv - d).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv + d).b;
  col = aces(col);
  float v = 1.0 - uVignette * smoothstep(0.4, 1.4, length(uv - 0.5) * 1.6);
  col *= v;
  col = pow(col, vec3(1.0/2.2));
  gl_FragColor = vec4(col, 1.0);
}
`;

// Film grain (after FXAA)
export const GRAIN_FRAG = /* glsl */`
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGrain;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
void main(){
  vec3 col = texture2D(tDiffuse, vUv).rgb;
  float g = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime)*100.0);
  col += (g - 0.5) * uGrain * 0.15;
  gl_FragColor = vec4(col, 1.0);
}
`;