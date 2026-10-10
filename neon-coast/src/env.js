import * as THREE from '../vendor/three.module.min.js';
import { mulberry, clamp } from './utils.js';

// Procedural sky + skyline cubemap -> PMREM environment so paint, glass and wet asphalt reflect the city.
// One CubeTexture and one PMREM render target are reused for every rebuild (no GPU allocation after the first one).

const S = 128;                 // cube face size in px (glass towers need a sharp-enough skyline to mirror)
const MIN_GAP_MS = 500;        // minimum real time between two PMREM rebuilds
const FACES = ['px', 'nx', 'py', 'ny', 'pz', 'nz']; // three.js cube face order
const SIDE_DIR = { px: [1, 0, 0], nx: [-1, 0, 0], pz: [0, 0, 1], nz: [0, 0, -1] };
const NEON = ['255,79,163', '60,232,245', '192,132,252']; // #ff4fa3 #3ce8f5 #c084fc
const BAND_TOP = 0.28, HORIZON = 0.5; // skyline band: building tops between v = 0.28 and the horizon at v = 0.50

const cTop = new THREE.Color(), cHor = new THREE.Color(), cGround = new THREE.Color(), cTmp = new THREE.Color(), cWall = new THREE.Color();
const C_GROUND_DAY = new THREE.Color(0x2a2620), C_GROUND_NIGHT = new THREE.Color(0x0b0d16);
const C_WALL_DAY = new THREE.Color(0x1a1d26), C_WALL_NIGHT = new THREE.Color(0x07080d);
const shades = ['', '', '', ''];

// ---------- per-material reflections ----------
// r180 ignores material.envMapIntensity while material.envMap is null (scene.environment is scaled by
// scene.environmentIntensity instead). Registered materials get the PMREM texture assigned explicitly,
// which restores their own intensity (car paint 0.9, glass 1.0, ...).
const registry = []; // [material, intensity, needsUpdateDone]
let envTex = null;
function applyTo(entry) {
  const m = entry[0]; m.envMapIntensity = entry[1];
  if (envTex) { m.envMap = envTex; if (!entry[2]) { entry[2] = true; m.needsUpdate = true; } }
}
export function envRegister(material, intensity = 1) {
  if (!material) return material;
  let entry = null; for (const r of registry) if (r[0] === material) { entry = r; break; }
  if (entry) entry[1] = intensity; else { entry = [material, intensity, false]; registry.push(entry); }
  applyTo(entry);
  return material;
}
// Drop a material (for example when its owner is disposed) so the registry does not keep it alive.
export function envUnregister(material) { const i = registry.findIndex(r => r[0] === material); if (i >= 0) registry.splice(i, 1); }

// 15-bit colour key: 5 bits per channel of an 0xRRGGBB value
const quant = hex => (((hex >> 19) & 31) << 10) | (((hex >> 11) & 31) << 5) | ((hex >> 3) & 31);

export class EnvMap {
  constructor(renderer, scene) {
    this.renderer = renderer; this.scene = scene; this.pmrem = new THREE.PMREMGenerator(renderer); this.pmrem.compileCubemapShader();
    this.keyColors = -1; this.keyState = -1; this.rt = null; this.lastBuild = 0; this.rebuilds = 0; // rebuilds: public counter for tests
    this.canvases = []; this.ctxs = [];
    for (let i = 0; i < 6; i++) { const c = document.createElement('canvas'); c.width = c.height = S; this.canvases.push(c); this.ctxs.push(c.getContext('2d')); }
    this.cube = new THREE.CubeTexture(this.canvases); this.cube.colorSpace = THREE.SRGBColorSpace;
  }

  update(top, horizon, sunColor, sunDir, night) {
    this.scene.environmentIntensity = 0.38 + 0.12 * night; // cheap, so it follows the day cycle every frame
    // Quantised key: 5 bits per channel of top/horizon, night in twelfths, sun height in tenths. Numbers, not strings (called every frame).
    const kc = (quant(top.getHex()) << 15) | quant(horizon.getHex());
    const ks = Math.round(night * 12) * 32 + Math.round(sunDir.y * 10) + 10;
    if (kc === this.keyColors && ks === this.keyState) return;
    const now = performance.now(); if (this.rt && now - this.lastBuild < MIN_GAP_MS) return; // stays pending, retried next frame
    this.keyColors = kc; this.keyState = ks; this.lastBuild = now; this.rebuilds++;

    cTop.copy(top); cHor.copy(horizon); cGround.copy(C_GROUND_DAY).lerp(C_GROUND_NIGHT, night);
    const t = '#' + cTop.getHexString(), h = '#' + cHor.getHexString(), g = '#' + cGround.getHexString();
    const gh = '#' + cTmp.copy(cGround).lerp(cHor, 0.3).getHexString();
    cWall.copy(cHor).lerp(C_WALL_DAY, 0.6).lerp(C_WALL_NIGHT, night); // dusk-tinted silhouettes by day, near black at night
    for (let k = 0; k < 4; k++) shades[k] = '#' + cTmp.copy(cWall).multiplyScalar(0.8 + k * 0.13).getHexString(); // four brightness steps so the silhouettes read as separate buildings
    const lightsA = clamp((night - 0.2) / 0.6, 0, 1); // windows and neon fade in as the sun goes down
    const sc = '#' + sunColor.getHexString();

    FACES.forEach((f, i) => {
      const ctx = this.ctxs[i];
      if (f === 'py') { ctx.fillStyle = '#' + cTmp.copy(cTop).lerp(cHor, 0.45).getHexString(); ctx.fillRect(0, 0, S, S); return; }
      const rng = mulberry(i + 1);
      if (f === 'ny') {
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
        for (let p = 0; p < 3; p++) { // soft sodium pools of the street lights
          const x = S * (0.2 + rng() * 0.6), y = S * (0.2 + rng() * 0.6), r = S * 0.3;
          if (night < 0.05) continue;
          const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,176,96,0.85)'); rg.addColorStop(1, 'rgba(255,176,96,0)');
          ctx.globalAlpha = night; ctx.fillStyle = rg; ctx.fillRect(0, 0, S, S); ctx.globalAlpha = 1;
        }
        return;
      }
      // sky -> horizon -> ground
      const grad = ctx.createLinearGradient(0, 0, 0, S); grad.addColorStop(0, t); grad.addColorStop(0.5, h); grad.addColorStop(0.52, gh); grad.addColorStop(1, g); ctx.fillStyle = grad; ctx.fillRect(0, 0, S, S);
      // sun highlight on the face it points to (drawn before the skyline so buildings can occlude it)
      // PMREM flips x for a CubeTexture (world +x samples the 'nx' face), so the highlight is painted at the cube-space direction (-x, y, z)
      const dir = SIDE_DIR[f], cx = -sunDir.x; const d = dir[0] * cx + dir[2] * sunDir.z;
      if (d > 0.3 && sunDir.y > -0.05) { const u = f === 'px' ? (0.5 - sunDir.z * 0.5) : f === 'nx' ? (0.5 + sunDir.z * 0.5) : f === 'pz' ? (0.5 + cx * 0.5) : (0.5 - cx * 0.5); const v = 0.5 - sunDir.y * 0.5; const r = ctx.createRadialGradient(u * S, v * S, 0, u * S, v * S, S * 0.35); r.addColorStop(0, sc); r.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 0.9 * d; ctx.fillStyle = r; ctx.fillRect(0, 0, S, S); ctx.globalAlpha = 1; }
      // skyline band: 40-60 buildings standing on the horizon. All random numbers are drawn every time so the city never changes between rebuilds.
      const n = 40 + Math.floor(rng() * 21), yBase = Math.round(S * (HORIZON + 0.03)), bld = [];
      for (let k = 0; k < n; k++) {
        const w = 3 + Math.floor(rng() * 8), x = Math.floor(rng() * (S - w + 1)), yTop = Math.round(S * (BAND_TOP + rng() * 0.18)), sh = Math.floor(rng() * 4);
        bld.push(x, w, yTop); ctx.fillStyle = shades[sh]; ctx.fillRect(x, yTop, w, yBase - yTop);
      }
      // night: 2x2 px window dots (25 % lit) and neon blobs
      const winRand = [], blobs = []; // kept small; rebuilds are rare
      for (let k = 0; k < n; k++) { const x = bld[k * 3], w = bld[k * 3 + 1], yTop = bld[k * 3 + 2]; for (let wy = yTop + 2; wy < yBase - 2; wy += 4) for (let wx = x + 1; wx + 2 <= x + w; wx += 4) if (rng() < 0.25) winRand.push(wx, wy); }
      const nb = 6 + Math.floor(rng() * 5);
      for (let k = 0; k < nb; k++) blobs.push(rng() * S, S * (BAND_TOP + 0.04) + rng() * S * 0.16, Math.floor(rng() * 3));
      if (lightsA > 0.02) {
        ctx.globalAlpha = lightsA; ctx.fillStyle = '#ffd9a0'; for (let k = 0; k < winRand.length; k += 2) ctx.fillRect(winRand[k], winRand[k + 1], 2, 2);
        for (let k = 0; k < blobs.length; k += 3) { const c = NEON[blobs[k + 2]], x = blobs[k], y = blobs[k + 1]; const rg = ctx.createRadialGradient(x, y, 0, x, y, 6); rg.addColorStop(0, 'rgba(' + c + ',0.95)'); rg.addColorStop(1, 'rgba(' + c + ',0)'); ctx.fillStyle = rg; ctx.fillRect(x - 6, y - 6, 12, 12); }
        ctx.globalAlpha = 1;
      }
    });

    this.cube.needsUpdate = true;
    this.rt = this.pmrem.fromCubemap(this.cube, this.rt); // first call allocates the target, later calls re-render into it
    this.scene.environment = this.rt.texture;
    envTex = this.rt.texture;
    for (const entry of registry) applyTo(entry); // same texture object every time: needsUpdate only happens once per material
  }

}
