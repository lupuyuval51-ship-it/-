'use strict';
/* BlockRealm — WebGL2 renderer: shadow map, normal-mapped lighting, atmospheric sky, water, entities, particles. */

const GLSL_COMMON = `
uniform vec3 uSunDir, uZenith, uHorizon, uSunGlow;
uniform vec3 uLightDir, uLightColor, uAmbSky, uAmbGround;
uniform vec3 uCam;
uniform float uTime, uExposure, uFogStart, uFogEnd, uHaze, uUnderwater, uMinLight, uDesat, uWet;
uniform vec3 uWaterFog;
uniform highp sampler2DShadow uShadow;
uniform mat4 uShadowMat;
uniform float uShadowOn, uShadowTexel, uShadowRange, uShadowBias;
uniform int uPcfTaps;
uniform vec3 uShadowCenter;
uniform vec4 uLights[16];
uniform int uNumLights;

vec3 skyColor(vec3 d) {
  float y = d.y;
  vec3 col = mix(uHorizon, uZenith, pow(max(y, 0.0), 0.5));
  if (y < 0.0) col = mix(uHorizon, uHorizon * 0.55, clamp(-y * 2.5, 0.0, 1.0));
  float sd = max(dot(d, uSunDir), 0.0);
  float band = pow(1.0 - abs(y), 5.0);
  col += uSunGlow * band * (0.2 + 0.8 * pow(sd, 4.0));
  col += uSunGlow * pow(sd, 40.0) * 0.9;
  return col;
}
vec3 nightGrade(vec3 c) { return mix(c, vec3(dot(c, vec3(0.25, 0.6, 0.15))) * vec3(0.78, 0.95, 1.3), uDesat); }
vec3 applyFog(vec3 col, vec3 p) {
  vec3 V = p - uCam;
  float dist = length(V);
  if (uUnderwater > 0.5) return mix(col, uWaterFog, 1.0 - exp(-dist * 0.085));
  float f = smoothstep(uFogStart, uFogEnd, dist);
  f = max(f, (1.0 - exp(-dist * uHaze)) * 0.65);
  return mix(col, nightGrade(skyColor(V / max(dist, 0.001))), f);
}
const vec2 POISSON[8] = vec2[8](vec2(-0.613, 0.617), vec2(0.170, -0.040), vec2(-0.299, -0.792), vec2(0.645, 0.493),
  vec2(-0.651, 0.718)*0.5, vec2(0.421, -0.888), vec2(-0.945, -0.120), vec2(0.866, -0.367));
float shadowAt(vec3 p, vec3 ng) {
  if (uShadowOn < 0.5) return 1.0;
  vec3 sc = (uShadowMat * vec4(p + ng * uShadowBias, 1.0)).xyz;
  if (sc.x <= 0.0 || sc.x >= 1.0 || sc.y <= 0.0 || sc.y >= 1.0 || sc.z >= 1.0) return 1.0;
  float fade = smoothstep(uShadowRange * 0.75, uShadowRange * 0.98, length(p.xz - uShadowCenter.xz));
  float s = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= uPcfTaps) break;
    s += texture(uShadow, vec3(sc.xy + POISSON[i] * uShadowTexel * 1.6, sc.z - 0.0006));
  }
  return mix(s / float(uPcfTaps), 1.0, fade);
}
vec3 blockLights(vec3 p, vec3 n) {
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    if (i >= uNumLights) break;
    vec3 L = uLights[i].xyz - p;
    float d2 = dot(L, L);
    if (d2 > 225.0) continue;
    float att = uLights[i].w / (1.0 + d2 * 0.2) * (1.0 - smoothstep(90.0, 225.0, d2));
    acc += vec3(att * (0.4 + 0.6 * max(dot(n, L * inversesqrt(d2 + 0.0001)), 0.0)));
  }
  return acc * vec3(1.0, 0.6, 0.28);
}
vec3 tonemap(vec3 c) {
  c *= uExposure;
  c = mix(vec3(dot(c, vec3(0.25, 0.6, 0.15))), c, 0.92);
  c = clamp((c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14), 0.0, 1.0);
  return pow(c, vec3(1.0 / 2.2));
}
const vec3 FN[7] = vec3[7](vec3(1,0,0), vec3(-1,0,0), vec3(0,1,0), vec3(0,-1,0), vec3(0,0,1), vec3(0,0,-1), vec3(0,1,0));
const vec3 FT[7] = vec3[7](vec3(0,0,-1), vec3(0,0,1), vec3(1,0,0), vec3(1,0,0), vec3(1,0,0), vec3(-1,0,0), vec3(1,0,0));
const vec3 FB[7] = vec3[7](vec3(0,-1,0), vec3(0,-1,0), vec3(0,0,1), vec3(0,0,1), vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0));
`;

const CHUNK_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aNL;
layout(location=2) in vec4 aUVL;
layout(location=3) in vec4 aTint;
uniform mat4 uViewProj, uModel;
uniform float uTime, uWind;
out vec3 vWorld, vUV, vTint;
out vec2 vLight;
flat out int vFace, vFlags;
void main() {
  int flags = int(aTint.a * 255.0 + 0.5);
  vec4 w = uModel * vec4(aPos / 16.0, 1.0);
  if ((flags & 1) != 0) {
    float ph = uTime * 1.6 + w.x * 0.37 + w.z * 0.29 + w.y * 0.21;
    w.xyz += vec3(sin(ph) * 0.035, sin(ph * 0.7) * 0.012, cos(ph * 1.13) * 0.03) * uWind;
  }
  if ((flags & 2) != 0) {
    float ph = uTime * 2.1 + w.x * 0.8 + w.z * 0.6;
    w.x += sin(ph) * 0.09 * uWind; w.z += cos(ph * 0.9) * 0.07 * uWind;
  }
  if ((flags & 8) != 0) w.y += (sin(uTime * 1.3 + w.x * 0.9 + w.z * 0.3) + sin(uTime * 1.7 - w.z * 0.8 + w.x * 0.2)) * 0.018 - 0.03;
  vWorld = w.xyz;
  vUV = vec3(aUVL.xy / 16.0, aNL.y);
  vLight = aUVL.zw / 255.0;
  vTint = aTint.rgb * 2.0;
  vFace = int(aNL.x + 0.5);
  vFlags = flags;
  gl_Position = uViewProj * w;
}`;

const CHUNK_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec3 vWorld, vUV, vTint;
in vec2 vLight;
flat in int vFace, vFlags;
uniform sampler2DArray uTex, uNrm;
uniform mat3 uNormalMat;
uniform float uSkyMul;
${GLSL_COMMON}
out vec4 outColor;
void main() {
  vec3 uv = vUV;
  if ((vFlags & 16) != 0) uv.xy += vec2(uTime * 0.021, uTime * 0.013);
  vec4 alb = texture(uTex, uv);
  if (alb.a < 0.5) discard;
  vec3 albedo = alb.rgb * vTint;
  vec3 Ng = normalize(uNormalMat * FN[vFace]);
  vec3 N = Ng;
  float spec = 0.0;
  if (vFace < 6) {
    vec4 nm = texture(uNrm, uv);
    vec3 tn = nm.xyz * 2.0 - 1.0;
    N = normalize(uNormalMat * (FT[vFace] * tn.x + FB[vFace] * tn.y + FN[vFace] * tn.z));
    spec = nm.a;
  }
  float sky = clamp(vLight.x * uSkyMul, 0.0, 1.0);
  float aoF = 0.3 + 0.7 * vLight.y;
  float ndl = vFace == 6 ? 0.45 + 0.55 * max(uLightDir.y, 0.0) : max(dot(N, uLightDir), 0.0);
  float sunVis = smoothstep(0.55, 0.95, sky);
  float sh = ndl > 0.0 && sunVis > 0.0 && (vFace == 6 || dot(Ng, uLightDir) > -0.05) ? shadowAt(vWorld, Ng) * sunVis : 0.0;
  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5) * (sky * sky);
  vec3 col = nightGrade(albedo * (uLightColor * ndl * sh + (amb + uMinLight) * aoF)) + albedo * blockLights(vWorld, N) * aoF;
  if (spec > 0.0) {
    vec3 V = normalize(uCam - vWorld), H = normalize(uLightDir + V);
    col += uLightColor * pow(max(dot(N, H), 0.0), 64.0) * spec * sh * 0.6;
  }
  if (uWet > 0.0 && Ng.y > 0.5 && vFace < 6) {
    float exposed = uWet * smoothstep(0.86, 1.0, sky);
    vec3 V = normalize(uCam - vWorld);
    float fr = pow(1.0 - max(dot(N, V), 0.0), 5.0);
    col = col * (1.0 - 0.22 * exposed) + nightGrade(skyColor(reflect(-V, N))) * fr * exposed * 0.14;
  }
  if ((vFlags & 4) != 0) {
    float lum = dot(albedo, vec3(0.3, 0.55, 0.15));
    float e = (vFlags & 16) != 0 ? 1.0 : smoothstep(0.3, 0.55, lum);
    col = mix(col, albedo * 2.4, e);
  }
  outColor = vec4(tonemap(applyFog(col, vWorld)), 1.0);
}`;

const WATER_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec3 vWorld, vUV, vTint;
in vec2 vLight;
flat in int vFace, vFlags;
uniform sampler2DArray uTex;
${GLSL_COMMON}
out vec4 outColor;
vec2 waveGrad(vec2 p) {
  vec2 g = vec2(0.0);
  vec2 d1 = vec2(0.8, 0.6), d2 = vec2(-0.5, 0.86), d3 = vec2(0.96, -0.28), d4 = vec2(-0.2, -0.98);
  g += d1 * cos(dot(d1, p) * 1.1 + uTime * 1.4) * 0.11;
  g += d2 * cos(dot(d2, p) * 1.9 + uTime * 1.9) * 0.08;
  g += d3 * cos(dot(d3, p) * 3.7 + uTime * 2.6) * 0.05;
  g += d4 * cos(dot(d4, p) * 6.3 + uTime * 3.4) * 0.035;
  return g;
}
void main() {
  vec3 Ng = FN[vFace];
  vec3 N = Ng;
  if (vFace == 2) { vec2 g = waveGrad(vWorld.xz); N = normalize(vec3(-g.x, 1.0, -g.y)); }
  if (!gl_FrontFacing) { N = -N; Ng = -Ng; }
  vec3 V = normalize(uCam - vWorld);
  float sky = vLight.x;
  float sh = shadowAt(vWorld, Ng) * smoothstep(0.55, 0.95, sky);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 refl = skyColor(R) * (0.2 + 0.8 * sky * sky);
  float t = texture(uTex, vUV).b;
  float deep = smoothstep(0.5, 9.0, vLight.y * 15.0);
  vec3 body = mix(vec3(0.05, 0.2, 0.21), vec3(0.008, 0.045, 0.09), deep) * (0.85 + 0.3 * t);
  vec3 lit = nightGrade(body * (uLightColor * max(uLightDir.y, 0.0) * sh * 0.7 + mix(uAmbGround, uAmbSky, 0.8) * sky * sky * 1.4 + uMinLight)) + body * blockLights(vWorld, Ng) * 0.6;
  vec3 col = mix(lit, nightGrade(refl), fres);
  vec3 H = normalize(uLightDir + V);
  col += uLightColor * pow(max(dot(N, H), 0.0), 240.0) * 4.0 * sh;
  float alpha = vFace == 2 ? mix(mix(0.42, 0.9, deep), 0.97, fres) : 0.72;
  if (!gl_FrontFacing) { alpha = 0.55; col = mix(col, uWaterFog, 0.5); }
  outColor = vec4(tonemap(applyFog(col, vWorld)), alpha);
}`;

const SHADOW_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aNL;
layout(location=2) in vec4 aUVL;
uniform mat4 uLightVP, uModel;
out vec3 vUV;
void main() { vUV = vec3(aUVL.xy / 16.0, aNL.y); gl_Position = uLightVP * uModel * vec4(aPos / 16.0, 1.0); }`;
const SHADOW_FS = `#version 300 es
precision mediump float;
precision highp sampler2DArray;
in vec3 vUV;
uniform sampler2DArray uTex;
void main() { if (texture(uTex, vUV).a < 0.5) discard; }`;

const SKY_VS = `#version 300 es
out vec2 vNdc;
void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0; vNdc = p; gl_Position = vec4(p, 1.0, 1.0); }`;
const SKY_FS = `#version 300 es
precision highp float;
in vec2 vNdc;
uniform mat4 uInvViewProj;
uniform vec3 uMoonDir, uSunDisk, uCloudLit, uCloudShade;
uniform float uNight, uClouds, uCloudCover;
${GLSL_COMMON}
out vec4 outColor;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float cfbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
void main() {
  vec4 p = uInvViewProj * vec4(vNdc, 1.0, 1.0);
  vec3 d = normalize(p.xyz / p.w - uCam);
  if (uUnderwater > 0.5) { outColor = vec4(tonemap(uWaterFog * (0.7 + 0.5 * max(d.y, 0.0))), 1.0); return; }
  vec3 col = skyColor(d);
  col += uSunDisk * smoothstep(0.99962, 0.99985, dot(d, uSunDir));
  float md = dot(d, uMoonDir);
  float moon = smoothstep(0.99915, 0.9994, md);
  float crater = vnoise(d.xy * 900.0) * 0.25;
  col += vec3(0.85, 0.9, 1.0) * moon * (1.1 - crater) * max(uNight, 0.15) + vec3(0.04, 0.05, 0.09) * pow(max(md, 0.0), 300.0) * uNight;
  if (uNight > 0.0 && d.y > -0.05) {
    vec3 sp = d * 170.0, cell = floor(sp);
    float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    if (h > 0.9972) {
      float s = smoothstep(0.38, 0.0, length(fract(sp) - 0.5));
      col += vec3(0.85, 0.92, 1.0) * s * (0.6 + 0.4 * sin(uTime * (1.5 + h * 4.0) + h * 70.0)) * uNight * 1.6;
    }
  }
  if (uClouds > 0.0 && d.y > 0.0) {
    float t = (200.0 - uCam.y) / max(d.y, 0.015);
    vec2 cp = (uCam.xz + d.xz * t) * 0.0032 + vec2(uTime * 0.0045, uTime * 0.0016);
    float n = cfbm(cp);
    float cov = smoothstep(uCloudCover, uCloudCover + 0.29, n);
    if (cov > 0.0) {
      float n2 = cfbm(cp + uSunDir.xz * 0.035);
      vec3 cc = mix(uCloudShade, uCloudLit, clamp((n - n2) * 5.0 + 0.55, 0.0, 1.0));
      col = mix(col, cc, cov * smoothstep(0.0, 0.16, d.y) * exp(-t * 0.00022) * 0.94);
    }
  }
  outColor = vec4(tonemap(nightGrade(col)), 1.0);
}`;

const BOX_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
uniform mat4 uViewProj, uModel;
out vec3 vWorld, vN, vLocal;
void main() { vec4 w = uModel * vec4(aPos, 1.0); vWorld = w.xyz; vN = normalize(mat3(uModel) * aNormal); vLocal = aPos; gl_Position = uViewProj * w; }`;
const BOX_FS = `#version 300 es
precision highp float;
in vec3 vWorld, vN, vLocal;
uniform vec4 uColor, uColor2;
uniform vec3 uBoxSize;
uniform float uMode, uSky, uHurt, uProgress;
${GLSL_COMMON}
out vec4 outColor;
float h3(vec3 q) { return fract(sin(dot(q, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
void main() {
  if (uMode > 1.5) {
    vec3 a = abs(vLocal - 0.5) * 2.0;
    vec3 e = step(vec3(0.965), a);
    float edges = e.x + e.y + e.z;
    float crack = 0.0;
    if (uProgress > 0.0) {
      vec2 fc = a.x > 0.999 ? vLocal.yz : a.y > 0.999 ? vLocal.xz : vLocal.xy;
      vec2 cell = floor(fc * 16.0);
      float n = h3(vec3(cell, 3.0)) * 0.35 + h3(vec3(floor(cell / 4.0), 7.0)) * 0.65;
      crack = step(abs(n - 0.5), uProgress * 0.32);
    }
    if (edges < 2.0 && crack < 0.5) discard;
    outColor = vec4(vec3(0.02), edges >= 2.0 ? 0.6 : 0.55);
    return;
  }
  vec3 base = uColor.rgb;
  vec3 q = floor(vLocal * uBoxSize * 8.0 + 0.001);
  base *= 0.86 + 0.26 * h3(q);
  if (uColor2.a > 0.0) {
    vec3 q2 = floor(vLocal * uBoxSize * 2.0 + 0.001);
    base = mix(base, uColor2.rgb * (0.9 + 0.2 * h3(q)), step(uColor2.a, h3(q2 + 17.0)));
  }
  base = mix(base, vec3(0.9, 0.12, 0.08), uHurt * 0.65);
  vec3 N = normalize(vN);
  float sky = uSky;
  float sh = shadowAt(vWorld, N) * smoothstep(0.55, 0.95, sky);
  vec3 amb = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5) * sky * sky;
  vec3 col = nightGrade(base * (uLightColor * max(dot(N, uLightDir), 0.0) * sh + amb + uMinLight)) + base * blockLights(vWorld, N);
  outColor = vec4(tonemap(applyFog(col, vWorld)), 1.0);
}`;

const PART_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aData;
layout(location=2) in vec4 aColor;
uniform mat4 uViewProj;
uniform float uPointScale;
out vec3 vUV0, vWorld;
out vec4 vColor;
void main() { vec4 p = uViewProj * vec4(aPos, 1.0); gl_Position = p; gl_PointSize = clamp(uPointScale * aData.w / p.w, 1.0, 64.0); vUV0 = aData.xyz; vColor = aColor; vWorld = aPos; }`;
const PART_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec3 vUV0, vWorld;
in vec4 vColor;
uniform sampler2DArray uTex;
${GLSL_COMMON}
out vec4 outColor;
void main() {
  vec4 t = texture(uTex, vec3(vUV0.yz + gl_PointCoord * 0.25, vUV0.x));
  if (t.a < 0.5) discard;
  outColor = vec4(tonemap(applyFog(nightGrade(t.rgb * vColor.rgb), vWorld)), 1.0);
}`;

const RAIN_VS = `#version 300 es
precision highp float;
layout(location=0) in vec4 aPos;
uniform mat4 uViewProj;
uniform float uPointSize;
out float vA;
void main() { vA = aPos.w; vec4 p = uViewProj * vec4(aPos.xyz, 1.0); gl_Position = p; gl_PointSize = clamp(uPointSize / p.w, 1.0, 12.0); }`;
const RAIN_FS = `#version 300 es
precision mediump float;
in float vA;
uniform vec4 uRainColor;
uniform float uSnow;
out vec4 outColor;
void main() {
  if (uSnow > 0.5) { vec2 c = gl_PointCoord - 0.5; if (dot(c, c) > 0.25) discard; }
  outColor = vec4(uRainColor.rgb, uRainColor.a * vA);
}`;

/* ---------- sky / lighting state from time of day ---------- */
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const add3 = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

function skyState(time, rain = 0) {
  const th = time * Math.PI * 2;
  let sx = Math.cos(th), sy = Math.sin(th), sz = 0.3;
  const len = Math.hypot(sx, sy, sz); sx /= len; sy /= len; sz /= len;
  const e = sy;
  const day = smoothstep(-0.04, 0.3, e), night = 1 - smoothstep(-0.22, 0.02, e);
  const sunset = Math.exp(-Math.pow((e - 0.02) / 0.14, 2));
  let zenith = mix3([0.002, 0.0035, 0.011], [0.085, 0.24, 0.68], day);
  let horizon = mix3([0.007, 0.011, 0.024], [0.44, 0.6, 0.9], day);
  horizon = mix3(horizon, [0.95, 0.52, 0.32], sunset * 0.65);
  zenith = mix3(zenith, [0.14, 0.18, 0.4], sunset * 0.35);
  const sunGlow = add3(scale3([1.3, 0.48, 0.14], sunset), [0.1, 0.085, 0.06], day);
  const sunI = smoothstep(0.0, 0.14, e), moonI = smoothstep(0.0, 0.14, -e);
  const sunCol = scale3(mix3([1.5, 0.62, 0.3], [1.6, 1.5, 1.34], smoothstep(0.05, 0.35, e)), sunI * 1.05);
  const moonCol = scale3([0.032, 0.042, 0.075], moonI);
  const useSun = e >= 0;
  const lightDir = useSun ? [sx, sy, sz] : [-sx, -sy, -sz];
  const lightColor = useSun ? sunCol : moonCol;
  let ambSky = mix3([0.008, 0.011, 0.022], [0.3, 0.38, 0.52], day);
  ambSky = mix3(ambSky, [0.36, 0.27, 0.28], sunset * 0.35);
  const ambGround = mix3([0.004, 0.004, 0.007], [0.17, 0.15, 0.12], day);
  const cloudLit = mix3(mix3([0.035, 0.042, 0.07], [1.3, 1.28, 1.24], day), [1.45, 0.72, 0.42], sunset * 0.7);
  const cloudShade = mix3(mix3([0.015, 0.02, 0.035], [0.5, 0.56, 0.68], day), [0.4, 0.27, 0.3], sunset * 0.6);
  let sunDisk = scale3(mix3([3.2, 1.15, 0.3], [9, 8.4, 7.4], smoothstep(0.04, 0.35, e)), smoothstep(-0.06, 0.02, e));
  let lc = lightColor, cl = cloudLit, cs = cloudShade, sg = sunGlow, as = ambSky;
  if (rain > 0) {
    const gray = (c, k, m) => { const l = c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15; return scale3(mix3(c, [l * 0.95, l, l * 1.08], k), m); };
    zenith = gray(zenith, rain * 0.8, 1 - rain * 0.45);
    horizon = gray(horizon, rain * 0.75, 1 - rain * 0.3);
    as = gray(ambSky, rain * 0.5, 1 - rain * 0.2);
    sg = scale3(sunGlow, 1 - rain * 0.9); lc = scale3(lightColor, 1 - rain * 0.72); sunDisk = scale3(sunDisk, 1 - rain);
    cl = gray(cloudLit, rain * 0.6, 1 - rain * 0.5); cs = gray(cloudShade, rain * 0.5, 1 - rain * 0.45);
  }
  return {
    cloudCover: 0.47 - rain * 0.34, wet: rain,
    sunDir: [sx, sy, sz], moonDir: [-sx, -sy, -sz], zenith, horizon, sunGlow: sg, lightDir, lightColor: lc, ambSky: as, ambGround,
    cloudLit: cl, cloudShade: cs, sunDisk, night, day, elevation: e, exposure: lerp(1.6, 1.0, day), lightIntensity: useSun ? sunI : moonI,
  };
}

class Renderer {
  constructor(canvas, opts) {
    const gl = canvas.getContext('webgl2', { antialias: !!opts.antialias, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('webgl2');
    this.gl = gl; this.canvas = canvas;
    this.progs = {
      chunk: this.program(CHUNK_VS, CHUNK_FS), water: this.program(CHUNK_VS, WATER_FS),
      shadow: this.program(SHADOW_VS, SHADOW_FS), sky: this.program(SKY_VS, SKY_FS),
      box: this.program(BOX_VS, BOX_FS), part: this.program(PART_VS, PART_FS), rain: this.program(RAIN_VS, RAIN_FS),
    };
    this.uloc = new Map();
    this.proj = M4.create(); this.view = M4.create(); this.viewProj = M4.create(); this.invViewProj = M4.create(); this.invView = M4.create();
    this.lightVP = M4.create(); this.shadowMat = M4.create(); this.tmp = M4.create(); this.tmp2 = M4.create(); this.model = M4.create();
    this.handProj = M4.create(); this.handVP = M4.create();
    this.planes = new Float32Array(24);
    this.emptyVao = gl.createVertexArray();
    this.ibo = gl.createBuffer(); this.indexQuads = 0;
    this.ensureIndices(1 << 16);
    this.buildTextures();
    this.buildBox();
    this.partBuf = gl.createBuffer(); this.partVao = gl.createVertexArray(); this.partData = new Float32Array(11 * 2048);
    gl.bindVertexArray(this.partVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.partBuf);
    gl.bufferData(gl.ARRAY_BUFFER, this.partData.byteLength, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 44, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 44, 28);
    gl.bindVertexArray(null);
    this.rainBuf = gl.createBuffer(); this.rainVao = gl.createVertexArray();
    gl.bindVertexArray(this.rainVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.rainBuf);
    gl.bufferData(gl.ARRAY_BUFFER, 4 * 24 * 1200, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
    gl.bindVertexArray(null);
    this.shadowSize = 0; this.shadowTex = null; this.shadowFbo = null;
    this.setShadowSize(1);
    this.hand = null;
    this.lights = new Float32Array(64);
    this.numLights = 0;
    this.stats = { chunks: 0, quads: 0 };
  }

  program(vsSrc, fsSrc) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vsSrc)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    p.id = Math.random().toString(36).slice(2);
    return p;
  }
  u(p, name) {
    const k = p.id + name;
    let l = this.uloc.get(k);
    if (l === undefined) { l = this.gl.getUniformLocation(p, name); this.uloc.set(k, l); }
    return l;
  }

  ensureIndices(quads) {
    if (quads <= this.indexQuads) return;
    const n = Math.max(quads, this.indexQuads * 2), idx = new Uint32Array(n * 6);
    for (let q = 0; q < n; q++) { const b = q * 4, o = q * 6; idx[o] = b; idx[o + 1] = b + 1; idx[o + 2] = b + 2; idx[o + 3] = b; idx[o + 4] = b + 2; idx[o + 5] = b + 3; }
    const gl = this.gl;
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    this.indexQuads = n;
  }

  buildTextures() {
    const gl = this.gl, n = TILES.length, levels = Math.log2(TS) + 1;
    const toLin = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const c = i / 255; toLin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    const toSrgb = (l) => { const c = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055; return Math.round(clamp(c, 0, 1) * 255); };
    this.albedo = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.albedo);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.SRGB8_ALPHA8, TS, TS, n);
    let level = TILES.map((t) => t.rgba);
    for (let l = 0, size = TS; l < levels; l++, size >>= 1) {
      const all = new Uint8Array(size * size * 4 * n);
      level.forEach((d, i) => all.set(d, i * size * size * 4));
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, l, 0, 0, 0, size, size, n, gl.RGBA, gl.UNSIGNED_BYTE, all);
      if (size === 1) break;
      const half = size >> 1;
      level = level.map((src, ti) => {
        const dst = new Uint8ClampedArray(half * half * 4);
        const coverage0 = TILES[ti].coverage ?? (TILES[ti].coverage = TILES[ti].rgba.reduce((a, v, k) => (k % 4 === 3 && v > 127 ? a + 1 : a), 0) / (TS * TS));
        for (let y = 0; y < half; y++) for (let x = 0; x < half; x++) {
          let r = 0, g = 0, b = 0, a = 0;
          for (let k = 0; k < 4; k++) {
            const o = (((y * 2 + (k >> 1)) * size) + x * 2 + (k & 1)) * 4, w = src[o + 3] / 255;
            r += toLin[src[o]] * w; g += toLin[src[o + 1]] * w; b += toLin[src[o + 2]] * w; a += w;
          }
          const o = (y * half + x) * 4;
          if (a > 0) { dst[o] = toSrgb(r / a); dst[o + 1] = toSrgb(g / a); dst[o + 2] = toSrgb(b / a); }
          dst[o + 3] = Math.round(a / 4 * 255);
        }
        if (coverage0 < 0.999) {
          let lo = 0.5, hi = 4;
          for (let it = 0; it < 12; it++) {
            const s = (lo + hi) / 2;
            let cov = 0;
            for (let k = 3; k < dst.length; k += 4) if (dst[k] * s > 127) cov++;
            if (cov / (half * half) < coverage0) lo = s; else hi = s;
          }
          for (let k = 3; k < dst.length; k += 4) dst[k] = Math.min(255, dst[k] * hi);
        }
        return dst;
      });
    }
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

    this.normals = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.normals);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, gl.RGBA8, TS, TS, n);
    const nAll = new Uint8Array(TS * TS * 4 * n);
    TILES.forEach((t, ti) => {
      const o0 = ti * TS * TS * 4;
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        const h = (xx, yy) => t.h[(yy & 31) * TS + (xx & 31)];
        let nx = (h(x - 1, y) - h(x + 1, y)) * t.strength, ny = (h(x, y - 1) - h(x, y + 1)) * t.strength, nz = 1;
        const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        const o = o0 + (y * TS + x) * 4;
        nAll[o] = (nx * 0.5 + 0.5) * 255; nAll[o + 1] = (ny * 0.5 + 0.5) * 255; nAll[o + 2] = (nz * 0.5 + 0.5) * 255; nAll[o + 3] = t.spec[y * TS + x] * 255;
      }
    });
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, TS, TS, n, gl.RGBA, gl.UNSIGNED_BYTE, nAll);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
  }

  setShadowSize(size) {
    if (size === this.shadowSize) return;
    const gl = this.gl;
    if (this.shadowTex) gl.deleteTexture(this.shadowTex);
    if (this.shadowFbo) gl.deleteFramebuffer(this.shadowFbo);
    this.shadowTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, size, size);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    this.shadowFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.shadowTex, 0);
    gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.shadowSize = size;
  }

  buildBox() {
    const gl = this.gl, v = [];
    for (const f of FACES) {
      const idx = [0, 1, 2, 0, 2, 3];
      for (const i of idx) v.push(...f.c[i], ...f.n);
    }
    this.boxVao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(this.boxVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindVertexArray(null);
  }

  makeMeshVao(data, quads, old) {
    const gl = this.gl;
    if (!quads) { if (old) { gl.deleteBuffer(old.vbo); gl.deleteVertexArray(old.vao); } return null; }
    this.ensureIndices(quads);
    const m = old || { vbo: gl.createBuffer(), vao: gl.createVertexArray(), quads: 0 };
    gl.bindVertexArray(m.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    if (!old) {
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.SHORT, false, 16, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.UNSIGNED_BYTE, false, 16, 6);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, false, 16, 8);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 16, 12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    }
    gl.bindVertexArray(null);
    m.quads = quads;
    return m;
  }
  uploadChunk(c, mainData, mainQuads, waterData, waterQuads) {
    const g = c.gpu || (c.gpu = { main: null, water: null });
    g.main = this.makeMeshVao(mainData, mainQuads, g.main);
    g.water = this.makeMeshVao(waterData, waterQuads, g.water);
  }
  freeChunk(c) {
    if (!c.gpu) return;
    this.makeMeshVao(null, 0, c.gpu.main);
    this.makeMeshVao(null, 0, c.gpu.water);
    c.gpu = null;
  }
  setHandItem(id, mesher) {
    if (this.handId === id) return;
    this.handId = id;
    if (this.hand) { this.makeMeshVao(null, 0, this.hand); this.hand = null; }
    if (!id) return;
    const m = mesher.buildItem(id);
    this.hand = this.makeMeshVao(m.data, m.quads, null);
    this.handFlat = !(isBlock(id) && (BLOCKS[id].render === RENDER.CUBE || BLOCKS[id].render === RENDER.LIQUID));
  }

  collectLights(world, cam, time) {
    const cand = [];
    const pcx = Math.floor(cam.x / CS), pcz = Math.floor(cam.z / CS);
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const c = world.getChunk(pcx + dx, pcz + dz);
      if (!c) continue;
      for (const e of c.emitters) {
        const d2 = (e[0] - cam.x) ** 2 + (e[1] - cam.y) ** 2 + (e[2] - cam.z) ** 2;
        if (d2 < 900) cand.push([d2, e]);
      }
    }
    cand.sort((a, b) => a[0] - b[0]);
    const n = Math.min(16, cand.length);
    for (let i = 0; i < n; i++) {
      const e = cand[i][1], o = i * 4;
      const flick = e[3] === B.torch ? 0.88 + 0.08 * Math.sin(time * 11 + e[0] * 3.1) + 0.05 * Math.sin(time * 23.7 + e[2] * 1.7) : 1;
      this.lights[o] = e[0]; this.lights[o + 1] = e[1] + (e[3] === B.torch ? 0.2 : 0); this.lights[o + 2] = e[2];
      this.lights[o + 3] = (e[3] === B.torch ? 2.2 : 2.6) * flick;
    }
    this.numLights = n;
  }

  setCommon(p, s, env) {
    const gl = this.gl, u = (n) => this.u(p, n);
    gl.uniform3fv(u('uSunDir'), s.sunDir); gl.uniform3fv(u('uZenith'), s.zenith); gl.uniform3fv(u('uHorizon'), s.horizon);
    gl.uniform3fv(u('uSunGlow'), s.sunGlow); gl.uniform3fv(u('uLightDir'), s.lightDir); gl.uniform3fv(u('uLightColor'), s.lightColor);
    gl.uniform3fv(u('uAmbSky'), s.ambSky); gl.uniform3fv(u('uAmbGround'), s.ambGround);
    gl.uniform3f(u('uCam'), env.cam.x, env.cam.y, env.cam.z);
    gl.uniform1f(u('uTime'), env.clock); gl.uniform1f(u('uExposure'), s.exposure * env.brightnessExp);
    gl.uniform1f(u('uFogStart'), env.fogStart); gl.uniform1f(u('uFogEnd'), env.fogEnd); gl.uniform1f(u('uHaze'), env.haze);
    gl.uniform1f(u('uUnderwater'), env.underwater ? 1 : 0); gl.uniform3fv(u('uWaterFog'), env.waterFog);
    gl.uniform1f(u('uMinLight'), env.minLight);
    gl.uniform1f(u('uDesat'), env.desat);
    gl.uniform1f(u('uWet'), env.wet);
    gl.uniform1i(u('uShadow'), 2);
    gl.uniformMatrix4fv(u('uShadowMat'), false, this.shadowMat);
    gl.uniform1f(u('uShadowOn'), env.shadowOn ? 1 : 0);
    gl.uniform1f(u('uShadowTexel'), 1 / this.shadowSize);
    gl.uniform1f(u('uShadowRange'), env.shadowRange);
    gl.uniform1f(u('uShadowBias'), env.shadowBias);
    gl.uniform1i(u('uPcfTaps'), env.pcfTaps);
    gl.uniform3f(u('uShadowCenter'), env.cam.x, env.cam.y, env.cam.z);
    gl.uniform4fv(u('uLights'), this.lights);
    gl.uniform1i(u('uNumLights'), this.numLights);
  }

  resize(scale) {
    const c = this.canvas, w = Math.max(1, Math.round(c.clientWidth * scale)), h = Math.max(1, Math.round(c.clientHeight * scale));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  }

  render(sc) {
    const gl = this.gl, s = sc.sky, cam = sc.cam, world = sc.world, q = sc.quality;
    const W = this.canvas.width, H = this.canvas.height, aspect = W / H;
    const cy = Math.cos(cam.pitch), fx = -Math.sin(cam.yaw) * cy, fy = Math.sin(cam.pitch), fz = -Math.cos(cam.yaw) * cy;
    M4.perspective(this.proj, cam.fov * Math.PI / 180, aspect, 0.06, world.renderDist * CS * 1.6 + 64);
    M4.lookAt(this.view, cam.x, cam.y, cam.z, cam.x + fx, cam.y + fy, cam.z + fz, 0, 1, 0);
    M4.mul(this.viewProj, this.proj, this.view);
    M4.invert(this.invViewProj, this.viewProj);
    M4.invert(this.invView, this.view);
    frustumPlanes(this.planes, this.viewProj);
    this.collectLights(world, cam, sc.clock);

    const shadowRange = Math.min(world.renderDist * CS, q.shadowRange);
    const env = {
      cam, clock: sc.clock, fogEnd: world.renderDist * CS - 4, fogStart: world.renderDist * CS * 0.72, haze: sc.haze, desat: s.night * 0.55, wet: sc.wet || 0,
      underwater: sc.underwater, waterFog: scale3([0.02, 0.09, 0.13], 0.4 + 0.6 * s.day + 0.05), minLight: sc.minLight,
      shadowOn: q.shadows && s.lightIntensity > 0.001, shadowRange, shadowBias: shadowRange * 2 / Math.max(1, this.shadowSize) * 1.8,
      brightnessExp: sc.brightnessExp, pcfTaps: q.pcfTaps || 4,
    };
    if (sc.underwater) { env.fogStart = 0; env.fogEnd = 28; }

    /* --- shadow pass --- */
    if (env.shadowOn) {
      this.setShadowSize(q.shadowSize);
      const R = shadowRange, ld = s.lightDir;
      const up = Math.abs(ld[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
      const ccx = cam.x, ccy = clamp(cam.y, 20, CH - 20), ccz = cam.z;
      M4.lookAt(this.tmp, ccx + ld[0] * 200, ccy + ld[1] * 200, ccz + ld[2] * 200, ccx, ccy, ccz, up[0], up[1], up[2]);
      M4.ortho(this.tmp2, -R, R, -R, R, 1, 420);
      M4.mul(this.lightVP, this.tmp2, this.tmp);
      const o = M4.transform([0, 0, 0, 0], this.lightVP, 0, 0, 0, 1), half = this.shadowSize / 2;
      this.tmp2[12] += (Math.round(o[0] * half) - o[0] * half) / half;
      this.tmp2[13] += (Math.round(o[1] * half) - o[1] * half) / half;
      M4.mul(this.lightVP, this.tmp2, this.tmp);
      const bias = this.tmp; M4.identity(bias); bias[0] = bias[5] = bias[10] = 0.5; bias[12] = bias[13] = bias[14] = 0.5;
      M4.mul(this.shadowMat, bias, this.lightVP);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFbo);
      gl.viewport(0, 0, this.shadowSize, this.shadowSize);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.6, 3.0);
      const p = this.progs.shadow;
      gl.useProgram(p);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.albedo);
      gl.uniform1i(this.u(p, 'uTex'), 0);
      gl.uniformMatrix4fv(this.u(p, 'uLightVP'), false, this.lightVP);
      const R2 = (R + 24) * (R + 24);
      for (const c of world.chunks.values()) {
        if (!c.gpu || !c.gpu.main) continue;
        const dx = c.cx * CS + 8 - cam.x, dz = c.cz * CS + 8 - cam.z;
        if (dx * dx + dz * dz > R2) continue;
        M4.identity(this.model); this.model[12] = c.cx * CS; this.model[14] = c.cz * CS;
        gl.uniformMatrix4fv(this.u(p, 'uModel'), false, this.model);
        gl.bindVertexArray(c.gpu.main.vao);
        gl.drawElements(gl.TRIANGLES, c.gpu.main.quads * 6, gl.UNSIGNED_INT, 0);
      }
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /* --- main pass --- */
    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.albedo);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.normals);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
    gl.depthMask(true);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    // sky
    let p = this.progs.sky;
    gl.useProgram(p);
    this.setCommon(p, s, env);
    gl.uniformMatrix4fv(this.u(p, 'uInvViewProj'), false, this.invViewProj);
    gl.uniform3fv(this.u(p, 'uMoonDir'), s.moonDir); gl.uniform3fv(this.u(p, 'uSunDisk'), s.sunDisk);
    gl.uniform3fv(this.u(p, 'uCloudLit'), s.cloudLit); gl.uniform3fv(this.u(p, 'uCloudShade'), s.cloudShade);
    gl.uniform1f(this.u(p, 'uNight'), s.night); gl.uniform1f(this.u(p, 'uClouds'), q.clouds ? 1 : 0);
    gl.uniform1f(this.u(p, 'uCloudCover'), s.cloudCover);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.BLEND);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // opaque chunks
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    p = this.progs.chunk;
    gl.useProgram(p);
    this.setCommon(p, s, env);
    gl.uniform1i(this.u(p, 'uTex'), 0); gl.uniform1i(this.u(p, 'uNrm'), 1);
    gl.uniformMatrix4fv(this.u(p, 'uViewProj'), false, this.viewProj);
    gl.uniformMatrix3fv(this.u(p, 'uNormalMat'), false, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    gl.uniform1f(this.u(p, 'uSkyMul'), 1); gl.uniform1f(this.u(p, 'uWind'), sc.wind);
    const visible = [];
    let quads = 0;
    for (const c of world.chunks.values()) {
      if (!c.gpu) continue;
      const x0 = c.cx * CS, z0 = c.cz * CS;
      if (!aabbInFrustum(this.planes, x0, c.meshMinY, z0, x0 + CS, c.meshMaxY + 1, z0 + CS)) continue;
      visible.push(c);
      if (!c.gpu.main) continue;
      M4.identity(this.model); this.model[12] = x0; this.model[14] = z0;
      gl.uniformMatrix4fv(this.u(p, 'uModel'), false, this.model);
      gl.bindVertexArray(c.gpu.main.vao);
      gl.drawElements(gl.TRIANGLES, c.gpu.main.quads * 6, gl.UNSIGNED_INT, 0);
      quads += c.gpu.main.quads;
    }
    this.stats.chunks = visible.length; this.stats.quads = quads;

    // entities
    p = this.progs.box;
    gl.useProgram(p);
    this.setCommon(p, s, env);
    gl.uniformMatrix4fv(this.u(p, 'uViewProj'), false, this.viewProj);
    gl.uniform1f(this.u(p, 'uMode'), 0);
    gl.bindVertexArray(this.boxVao);
    for (const box of sc.boxes) this.drawBox(p, box);

    // particles
    if (sc.particles.length) {
      p = this.progs.part;
      gl.useProgram(p);
      this.setCommon(p, s, env);
      gl.uniform1i(this.u(p, 'uTex'), 0);
      gl.uniformMatrix4fv(this.u(p, 'uViewProj'), false, this.viewProj);
      gl.uniform1f(this.u(p, 'uPointScale'), H / (2 * Math.tan(cam.fov * Math.PI / 360)));
      const n = Math.min(2048, sc.particles.length), d = this.partData;
      for (let i = 0; i < n; i++) {
        const pt = sc.particles[i], o = i * 11;
        d[o] = pt.x; d[o + 1] = pt.y; d[o + 2] = pt.z; d[o + 3] = pt.layer; d[o + 4] = pt.u; d[o + 5] = pt.v; d[o + 6] = pt.size;
        d[o + 7] = pt.r; d[o + 8] = pt.g; d[o + 9] = pt.b; d[o + 10] = 1;
      }
      gl.bindVertexArray(this.partVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.partBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 11);
      gl.drawArrays(gl.POINTS, 0, n);
    }

    // block highlight / crack overlay
    if (sc.highlight) {
      p = this.progs.box;
      gl.useProgram(p);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      gl.uniform1f(this.u(p, 'uMode'), 2);
      gl.uniform1f(this.u(p, 'uProgress'), sc.highlight.progress || 0);
      const h = sc.highlight, e = 0.004;
      M4.identity(this.model); M4.translate(this.model, this.model, h.x - e, h.y - e, h.z - e); M4.scale(this.model, this.model, 1 + 2 * e, 1 + 2 * e, 1 + 2 * e);
      gl.uniformMatrix4fv(this.u(p, 'uModel'), false, this.model);
      gl.bindVertexArray(this.boxVao);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
      gl.uniform1f(this.u(p, 'uMode'), 0);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }

    // water (back to front)
    p = this.progs.water;
    gl.useProgram(p);
    this.setCommon(p, s, env);
    gl.uniform1i(this.u(p, 'uTex'), 0);
    gl.uniformMatrix4fv(this.u(p, 'uViewProj'), false, this.viewProj);
    gl.uniform1f(this.u(p, 'uWind'), sc.wind);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); gl.disable(gl.CULL_FACE);
    const wl = visible.filter((c) => c.gpu.water);
    wl.sort((a, b) => ((b.cx * CS + 8 - cam.x) ** 2 + (b.cz * CS + 8 - cam.z) ** 2) - ((a.cx * CS + 8 - cam.x) ** 2 + (a.cz * CS + 8 - cam.z) ** 2));
    for (const c of wl) {
      M4.identity(this.model); this.model[12] = c.cx * CS; this.model[14] = c.cz * CS;
      gl.uniformMatrix4fv(this.u(p, 'uModel'), false, this.model);
      gl.bindVertexArray(c.gpu.water.vao);
      gl.drawElements(gl.TRIANGLES, c.gpu.water.quads * 6, gl.UNSIGNED_INT, 0);
    }
    gl.disable(gl.BLEND); gl.depthMask(true); gl.enable(gl.CULL_FACE);

    // rain / snow
    const pr = sc.precip;
    if (pr && pr.count && !sc.underwater) {
      p = this.progs.rain;
      gl.useProgram(p);
      gl.uniformMatrix4fv(this.u(p, 'uViewProj'), false, this.viewProj);
      const b = 0.18 + 0.7 * s.day;
      gl.uniform4f(this.u(p, 'uRainColor'), (pr.snow ? 0.95 : 0.74) * b, (pr.snow ? 0.96 : 0.8) * b, (pr.snow ? 1.0 : 0.9) * b, pr.snow ? 0.9 : 0.55);
      gl.uniform1f(this.u(p, 'uSnow'), pr.snow ? 1 : 0);
      gl.uniform1f(this.u(p, 'uPointSize'), H * 0.045);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(this.rainVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.rainBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, pr.verts, 0, pr.count * (pr.snow ? 4 : 24));
      gl.drawArrays(pr.snow ? gl.POINTS : gl.TRIANGLES, 0, pr.count * (pr.snow ? 1 : 6));
      gl.disable(gl.BLEND); gl.depthMask(true); gl.enable(gl.CULL_FACE);
    }

    // first-person hand
    if (sc.hand) this.drawHand(sc, s, env, aspect);
    gl.bindVertexArray(null);
  }

  drawBox(p, box) {
    const gl = this.gl;
    gl.uniformMatrix4fv(this.u(p, 'uModel'), false, box.m);
    gl.uniform4fv(this.u(p, 'uColor'), box.color);
    gl.uniform4fv(this.u(p, 'uColor2'), box.color2 || [0, 0, 0, 0]);
    gl.uniform3fv(this.u(p, 'uBoxSize'), box.size);
    gl.uniform1f(this.u(p, 'uSky'), box.sky);
    gl.uniform1f(this.u(p, 'uHurt'), box.hurt || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }

  drawHand(sc, s, env, aspect) {
    const gl = this.gl, h = sc.hand;
    gl.clear(gl.DEPTH_BUFFER_BIT);
    M4.perspective(this.handProj, 70 * Math.PI / 180, aspect, 0.01, 10);
    M4.mul(this.handVP, this.handProj, this.view);
    const m = this.model;
    M4.copy(m, this.invView);
    const swing = Math.sin(h.swing * Math.PI), sw2 = Math.sin(Math.sqrt(h.swing) * Math.PI);
    M4.translate(m, m, 0.6 - sw2 * 0.22 + h.bobX, -0.56 + h.bobY - swing * 0.18 + h.lower, -0.86 - sw2 * 0.1);
    M4.rotateY(m, m, -sw2 * 0.35);
    M4.rotateX(m, m, -swing * 0.7);
    if (this.hand && sc.hand.id) {
      const p = this.progs.chunk;
      gl.useProgram(p);
      this.setCommon(p, s, env);
      gl.uniformMatrix4fv(this.u(p, 'uViewProj'), false, this.handVP);
      gl.uniform1f(this.u(p, 'uSkyMul'), h.sky);
      gl.uniform1f(this.u(p, 'uWind'), 0);
      if (this.handFlat) {
        M4.rotateY(m, m, -0.35); M4.rotateZ(m, m, 0.25);
        M4.scale(m, m, 0.55, 0.55, 0.55); M4.translate(m, m, -0.5, -0.3, -0.5);
      } else {
        M4.rotateY(m, m, 0.78);
        M4.scale(m, m, 0.32, 0.32, 0.32); M4.translate(m, m, -0.5, -0.5, -0.5);
      }
      gl.uniformMatrix4fv(this.u(p, 'uModel'), false, m);
      const nm = new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
      const inv = Math.hypot(nm[0], nm[1], nm[2]) || 1;
      for (let i = 0; i < 9; i++) nm[i] /= inv;
      gl.uniformMatrix3fv(this.u(p, 'uNormalMat'), false, nm);
      gl.disable(gl.CULL_FACE);
      gl.bindVertexArray(this.hand.vao);
      gl.drawElements(gl.TRIANGLES, this.hand.quads * 6, gl.UNSIGNED_INT, 0);
      gl.enable(gl.CULL_FACE);
    } else {
      const p = this.progs.box;
      gl.useProgram(p);
      this.setCommon(p, s, env);
      gl.uniformMatrix4fv(this.u(p, 'uViewProj'), false, this.handVP);
      gl.uniform1f(this.u(p, 'uMode'), 0);
      M4.rotateX(m, m, -0.35); M4.rotateY(m, m, 0.2);
      M4.translate(m, m, -0.09, -0.12, -0.15); M4.scale(m, m, 0.18, 0.18, 0.62);
      gl.bindVertexArray(this.boxVao);
      this.drawBox(p, { m, color: [0.86, 0.62, 0.48, 1], size: [0.25, 0.25, 0.75], sky: h.sky, hurt: 0 });
    }
  }
}
