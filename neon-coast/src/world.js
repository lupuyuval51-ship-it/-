import * as THREE from '../vendor/three.module.min.js';
import { CITY } from './config.js';
import { GeoBuilder, StaticGrid, mulberry, clamp, xform, M4, mergeGeometries } from './utils.js';
import { FACADES, facadeTextures, asphaltTex, sidewalkTex, sandTex, grassTex, roofTex, plankTex, neonAtlas, bladeLetters, bladeLayout, NEON_CELL, NEON_ASPECT, billboardAtlas, crossTex, storefrontTextures, shadowTex, AWNINGS, facadeNormal, facadeORM, storefrontNormal, storefrontORM, asphaltNormal, sidewalkNormal, plankNormal, sandNormal, lightPoolTex } from './textures.js';
import { envRegister } from './env.js';
import { Flora, Lamps } from './flora.js';
import { Shops } from './shops.js';
import { Buildings } from './buildings.js';

const { road, sidewalk, pitch, gridX, gridZ } = CITY;
const HALF = road / 2;
// Module colour constants: updateTrafficLights runs every frame and must not allocate.
// Light-state colours (index 0 = lit, 1 = dark) for red / yellow / green lamps
const TL_RED = [new THREE.Color(0xff2a2a).multiplyScalar(2.2), new THREE.Color(0x2a0a0a)], TL_YEL = [new THREE.Color(0xffc21a).multiplyScalar(2.2), new THREE.Color(0x2a1f05)], TL_GRN = [new THREE.Color(0x2aff5a).multiplyScalar(2.2), new THREE.Color(0x062a10)];

// ---------- per-window night lighting ----------
// Every facade material is patched once so each window of each building decides for itself whether it is lit, in which colour and how
// brightly. The emissive texture is only a MASK of the panes (textures.js facadeTextures). The per-building seed arrives as the vertex
// attribute aBld (written by addBuilding through the GeoBuilder.box colour, renamed in buildBlocks) and the side of the building as vFace.
// A window is one 2 m x 3.5 m cell of the facade, so cell = floor(uv * 4). litFrac and time are shared uniform objects (World.winU).
const glslColor = hex => { const c = new THREE.Color(hex); return `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`; }; // sRGB hex -> linear GLSL colour
const WIN_GAIN = '0.55'; // calibrates the emissive output so about 15 % of the lit windows exceed the bloom threshold of post.js (1.02)
function patchWindowShader(mat, uniforms, isLow) {
  // The shader strings are built when a program is compiled (isLow() is read then), so a quality change followed by material.needsUpdate
  // switches to the other variant (the low tier drops blinds, tint bands and the TV flicker).
  mat.onBeforeCompile = shader => {
    const low = isLow();
    const pars = `
varying vec3 vBld; varying float vFace; uniform float litFrac; uniform float time;
float winHash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
const vec3 WIN_WARM = ${glslColor(0xffcf8a)}, WIN_NEUTRAL = ${glslColor(0xfff0d8)}, WIN_COOL = ${glslColor(0xd8f0ff)}, WIN_TV = ${glslColor(0x7fa8ff)}, WIN_MAGENTA = ${glslColor(0xff6ad5)}, WIN_BLIND = ${glslColor(0xd9d2c3)};`;
    // Building seed and side are quantised first: a constant varying may carry 1 ulp of interpolation noise and the hash would amplify it.
    const mapFrag = `#include <map_fragment>
  vec2 wCell = floor(vEmissiveMapUv * 4.0);
  float wHb = mod(floor(vBld.x * 1024.0 + 0.5) * 0.0947 + floor(vFace + 0.5) * 13.0, 97.0);
  float wMask = texture2D(emissiveMap, vEmissiveMapUv).r;
  float wIn = smoothstep(0.12, 0.4, wMask);
  float wBlind = ${low ? '0.0' : 'wIn * step(winHash(wCell + wHb + 13.0), 0.3)'};
  diffuseColor.rgb = mix(diffuseColor.rgb, WIN_BLIND, wBlind * 0.6);
  diffuseColor.rgb *= 1.0 + (1.0 - wIn) * (vBld.x - 0.5) * 0.16;`;
    const emisFrag = `{
    float wH = winHash(wCell + wHb);
    float wFloor = winHash(vec2(wCell.y, wHb));
    float wLit = step(wH, litFrac * (0.55 + 0.9 * wFloor));
    float wT = winHash(wCell + wHb + 3.0);
    vec3 wTint = WIN_WARM; float wFlick = 1.0;
    ${low ? 'if (wT > 0.75) wTint = WIN_NEUTRAL;' : `if (wT > 0.98) wTint = WIN_MAGENTA;
    else if (wT > 0.93) { wTint = WIN_TV; wFlick = 0.7 + 0.3 * sin(time * 9.0 + wH * 40.0); }
    else if (wT > 0.80) wTint = WIN_COOL;
    else if (wT > 0.60) wTint = WIN_NEUTRAL;`}
    float wBright = 0.8 + 1.4 * winHash(wCell + wHb + 7.0);
    totalEmissiveRadiance *= wMask * wLit * wTint * wBright * wFlick * ${WIN_GAIN};
  }`;
    shader.uniforms.litFrac = uniforms.litFrac; shader.uniforms.time = uniforms.time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', () => '#include <common>\nattribute vec3 aBld; varying vec3 vBld; varying float vFace;')
      .replace('#include <begin_vertex>', () => '#include <begin_vertex>\n  vBld = aBld; vFace = dot(normal, vec3(1.0, 2.0, 3.0));');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', () => '#include <common>' + pars)
      .replace('#include <map_fragment>', () => mapFrag)
      .replace('#include <roughnessmap_fragment>', () => '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.6, wBlind);')
      .replace('#include <metalnessmap_fragment>', () => '#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, 0.05, wBlind);') // a blind is matte cloth, not a metal mirror
      .replace('#include <emissivemap_fragment>', () => emisFrag);
  };
  mat.customProgramCacheKey = () => isLow() ? 'win-low' : 'win';
}
// ---------- wet streets ----------
// Asphalt and pavement get patchy puddles when it rains. All of it is driven by the shared uniforms `wet` (= rain, written once per frame by
// setNight) and `time`. In a puddle the roughness drops to 0.04 (mirror), the bumps flatten out, the image-based reflection is boosted and
// raindrop rings run over the surface. The low tier keeps the cheap part (wet roughness) and compiles with NO_PUDDLES: no noise, no ripples.
function patchWetShader(mat, uniforms, isLow) {
  mat.onBeforeCompile = shader => {
    const low = isLow();
    shader.uniforms.wet = uniforms.wet; shader.uniforms.time = uniforms.time;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', () => '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', () => '#include <begin_vertex>\n  vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', () => `${low ? '#define NO_PUDDLES\n' : ''}#include <common>
varying vec3 vWPos; uniform float wet; uniform float time;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), f.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), f.x), f.y); }`)
      .replace('#include <roughnessmap_fragment>', () => `#include <roughnessmap_fragment>
  float wPud = 0.0;
  #ifndef NO_PUDDLES
  if (wet > 0.001) { vec2 wq = vWPos.xz * 0.11; float wn = 0.65 * wNoise(wq) + 0.35 * wNoise(wq * 2.3 + 11.0); wPud = smoothstep(0.55, 0.7, wn) * wet; }
  #endif
  roughnessFactor = mix(mix(roughnessFactor, 0.35, wet), 0.04, wPud);`)
      .replace('#include <normal_fragment_maps>', () => `#include <normal_fragment_maps>
  #ifndef NO_PUDDLES
  if (wPud > 0.002) {
    normal = normalize(mix(normal, nonPerturbedNormal, wPud * 0.9)); // standing water is flat
    vec2 wg = vWPos.xz / 1.5; vec2 wid = floor(wg); vec2 wf = fract(wg) - 0.5;      // one possible drop per 1.5 m cell
    float wh = wHash(wid); vec2 wc = (vec2(wHash(wid + 3.1), wHash(wid + 7.7)) - 0.5) * 0.5; vec2 wd = wf - wc; float wr = length(wd);
    float wp = fract(time * 0.8 + wh); float wamp = step(0.4, wh) * (1.0 - wp) * (1.0 - wp);
    float warg = 30.0 * wr - time * 12.0; float wring = (30.0 * cos(warg) - 6.0 * sin(warg)) * exp(-wr * 6.0); // slope of sin(30r - 12t) * exp(-6r)
    vec3 wdir = (viewMatrix * vec4(wd.x, 0.0, wd.y, 0.0)).xyz / max(wr, 0.02);
    normal = normalize(normal - wdir * wring * wamp * wPud * 0.018);
  }
  #endif`)
      .replace('#include <lights_fragment_end>', () => `#include <lights_fragment_end>
  #ifndef NO_PUDDLES
  reflectedLight.indirectSpecular *= 1.0 + wPud * 2.0; // puddles mirror the sky and the neon
  #endif`);
  };
  mat.customProgramCacheKey = () => isLow() ? 'wet-low' : 'wet';
}
// Fraction of the windows that are lit: 0.62 for 19-23 h, falling linearly to 0.22 at 03 h and rising to 0.35 at 06 h (by day it is irrelevant).
function litFractionAt(hours) {
  const h = hours < 12 ? hours + 24 : hours;
  if (h <= 23) return 0.62;
  if (h <= 27) return 0.62 + (0.22 - 0.62) * (h - 23) / 4;
  if (h <= 30) return 0.22 + (0.35 - 0.22) * (h - 27) / 3;
  return 0.35;
}
const C_SHOP = new THREE.Color(0xffd9a0); // shop-window light-pool colour (sRGB hex -> linear)

// Points of interest: block index, which lot corner, look and map colour
export const POI_DEFS = [
  { id: 'safehouse', block: [1, 1], facade: 'deco', floors: 5, sign: ['THE PALMS', '#7cff8a'], color: '#7cff8a', label: 'safehouse', type: 'safehouse' },
  { id: 'guns',      block: [3, 5], facade: 'tower', floors: 2, sign: ['NEON ARMS', '#ff4fa3'], color: '#ff4fa3', label: 'shopGuns', type: 'guns' },
  { id: 'guns2',     block: [7, 6], facade: 'brick', floors: 3, sign: ['COAST GUNS', '#ff4fa3'], color: '#ff4fa3', label: 'shopGuns2', type: 'guns' },
  { id: 'guns3',     block: [0, 3], facade: 'concrete', floors: 2, sign: ['BIG IRON', '#ff4fa3'], color: '#ff4fa3', label: 'shopGuns3', type: 'guns' },
  { id: 'spray',     block: [7, 2], facade: 'concrete', floors: 2, sign: ['SPRAY & GO', '#c084fc'], color: '#c084fc', label: 'shopSpray', type: 'spray', garage: true },
  { id: 'spray2',    block: [3, 0], facade: 'brick', floors: 2, sign: ['AUTO STAR', '#c084fc'], color: '#c084fc', label: 'shopSpray2', type: 'spray', garage: true },
  { id: 'hospital',  block: [2, 6], facade: 'white', floors: 7, sign: ['SUNRISE HOSPITAL', '#ff5a5a'], color: '#ff5a5a', label: 'shopHospital', type: 'hospital', cross: true },
  { id: 'hospital2', block: [8, 3], facade: 'white', floors: 5, sign: ['PALM MEDICAL', '#ff5a5a'], color: '#ff5a5a', label: 'shopHospital2', type: 'hospital', cross: true },
  { id: 'police',    block: [6, 6], facade: 'concrete', floors: 3, sign: ['POLICE', '#4d8cff'], color: '#4d8cff', label: 'police', type: 'police' },
  { id: 'police2',   block: [1, 4], facade: 'concrete', floors: 4, sign: ['POLICE', '#4d8cff'], color: '#4d8cff', label: 'police2', type: 'police' },
  { id: 'dealer',    block: [8, 4], facade: 'glass', floors: 2, sign: ['COAST MOTORS', '#3ce8f5'], color: '#3ce8f5', label: 'shopCars', type: 'dealer' },
  { id: 'bank',      block: [5, 3], facade: 'white', floors: 9, sign: ['SOLARA BANK', '#ffd34e'], color: '#ffd34e', label: 'bank', type: 'bank', noMarker: true },
  { id: 'taxi',      block: [4, 1], facade: 'brick', floors: 3, sign: ['TAXI', '#ffd34e'], color: '#ffd34e', label: 'taxi', type: 'giver', mission: 'taxi' },
  { id: 'ricky',     block: [2, 1], facade: 'pink', floors: 4, sign: ["RICKY'S", '#ff9a3c'], color: '#ffd34e', label: 'race', type: 'giver', mission: 'ricky' },
  { id: 'dana',      block: [8, 1], facade: 'mint', floors: 3, sign: ['GARAGE 8', '#3ce8f5'], color: '#ffd34e', label: 'race', type: 'giver', mission: 'dana' },
  { id: 'burger',    block: [5, 1], facade: 'pink', floors: 2, sign: ['NEON BURGER', '#ff9a3c'], color: '#ff9a3c', label: 'shopBurger', type: 'burger' },
  { id: 'burger2',   block: [4, 6], facade: 'mint', floors: 2, sign: ['NEON BURGER', '#ff9a3c'], color: '#ff9a3c', label: 'shopBurger2', type: 'burger' },
  { id: 'clothes',   block: [6, 3], facade: 'white', floors: 3, sign: ['SUNSET', '#ff9ad5'], color: '#ff9ad5', label: 'shopClothes', type: 'clothes' },
  { id: 'casino',    block: [9, 2], facade: 'glass', floors: 6, sign: ['CASINO', '#ffd34e'], color: '#ffd34e', label: 'casino', type: 'casino' },
];
export const PARKS = [[2, 3], [6, 1]];
const SIGN_TEXTS = [['מלון', '#ff4fa3'], ['CLUB', '#3ce8f5'], ['BAR', '#ff9a3c'], ['סושי', '#7cff8a'], ['24/7', '#ffd34e'], ['NEON', '#ff4fa3'], ['קפה', '#ffb347'], ['PIZZA', '#ff5a5a'], ['DISCO', '#c084fc'], ['מסעדה', '#3ce8f5'], ['HOTEL', '#ffd34e'], ['ספא', '#7cff8a'], ['CASINO', '#ff9a3c'], ['LIVE', '#ff4fa3'], ['ביטוח', '#3ce8f5'], ['SUSHI', '#7cff8a'], ['GYM', '#ff5a5a'], ['פרחים', '#ff9ad5'], ['TATTOO', '#c084fc'], ['VINYL', '#ffd34e']];
const BOX_POI_TYPES = new Set(['hospital', 'police', 'bank']); // these points of interest get a lightbox sign, everything else glass tubes
const SIGN_OFFSET = 0.2; // distance of a wall sign from the facade; its raceway (0.15 m) sits behind it
const BILLBOARDS = [['SOLARA', 'the drink of the coast', '#ff4fa3', '#ff9a3c'], ['COAST MOTORS', 'drive tomorrow today', '#3ce8f5', '#1f4e9b'], ['NEON FM', '98.6 – all night long', '#c084fc', '#ff4fa3'], ['סאנרייז', 'בית חולים – פתוח 24/7', '#ff5a5a', '#ffb347'], ['PALM SPA', 'relax. repeat.', '#7cff8a', '#3ce8f5'], ['SOLARA BANK', 'your money, our vault', '#ffd34e', '#ff9a3c']];

export class World {
  constructor(scene, quality = 'high') {
    this.scene = scene; this.quality = quality; this.grid = new StaticGrid(24); this.rng = mulberry(20240915);
    this.pois = {}; this.parkingSpots = []; this.lampPositions = []; this.signs = []; this.lights = []; this.markers = [];
    this.lamps = null; this.flora = null; this.bld = new Buildings(this); this.shops = new Shops(this); this.lots = []; this.lotGrid = new Map(); this.parks = []; this.treeSpots = []; // lots: parking lots {x0,z0,x1,z1} (0.17 m high); parks: {x0,z0,x1,z1,cx,cz}
    this.winU = { litFrac: { value: 0.62 }, time: { value: 0 } }; // shared by every facade material (window shader)
    this.isLowTier = () => this.quality === 'low'; // read by the window shader whenever a program is compiled
    this.seedRng = mulberry(90210); // building seeds; a separate stream so the city layout (this.rng) stays exactly as before
    this.parkRng = mulberry(5551); this.storeSpill = []; this.signSpill = []; // light-pool sources recorded by addStorefront*/addSign* for buildLightPools
    // Signage: addSign / addSignX / addBladeSign only RECORD a sign (this.signs); buildSigns turns them all into one atlas mesh, one dark prop mesh and one
    // billboard mesh. signRng is its own stream, so the layout (this.rng) and the building seeds (this.seedRng) do not change.
    this.signRng = mulberry(7351); this.flickN = 0; this.lastSign = null; this.darkB = new GeoBuilder(); this.billboardDefs = [];
    this.signU = { level: { value: 0.42 }, time: { value: 0 } }; // shared by the sign shader: brightness (setNight) and flicker clock (update)
    this.wetU = { wet: { value: 0 }, time: { value: 0 } }; // shared by the asphalt / pavement shader: rain amount and ripple clock
    this.buildGraph(); this.buildGround(); this.buildBlocks(); this.buildRoadMarkings(); this.buildProps(); this.buildStreetProps(); this.buildTrafficLights(); this.buildBeach(); this.bld.finalize(); this.buildSigns(); this.buildBeachExtras(); this.buildShops(); this.buildLamps(); this.buildFlora(); this.buildLightPools(); this.buildOutskirts(); this.buildMapImage();
  }

  // ---------------- road graph ----------------
  buildGraph() {
    this.nodes = []; this.segments = [];
    for (let j = 0; j <= gridZ; j++) for (let i = 0; i <= gridX; i++) this.nodes.push({ i, j, x: CITY.roadX(i), z: CITY.roadZ(j), out: [], idx: this.nodes.length });
    const N = (i, j) => this.nodes[j * (gridX + 1) + i];
    for (let j = 0; j <= gridZ; j++) for (let i = 0; i <= gridX; i++) {
      if (i < gridX) this.addSeg(N(i, j), N(i + 1, j), true);
      if (j < gridZ) this.addSeg(N(i, j), N(i, j + 1), false);
    }
    this.nodeAt = N;
  }
  addSeg(a, b, horizontal) {
    const s = { a, b, horizontal, idx: this.segments.length, len: Math.abs(b.x - a.x + b.z - a.z) };
    this.segments.push(s); a.out.push({ seg: s, dir: 1, to: b }); b.out.push({ seg: s, dir: -1, to: a });
  }
  // lane centre-line for a segment direction. dir=+1 a->b. lane 0 inner, 1 outer (right-hand traffic)
  lane(seg, dir, lane) {
    const A = dir > 0 ? seg.a : seg.b, B = dir > 0 ? seg.b : seg.a;
    const fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx, off = 1.75 + lane * 3.5;
    return { sx: A.x + fx * HALF + rx * off, sz: A.z + fz * HALF + rz * off, ex: B.x - fx * HALF + rx * off, ez: B.z - fz * HALF + rz * off, fx, fz, rx, rz, len: seg.len - road, from: A, to: B };
  }
  // Closest lane centre-line to (x, z). With a heading (hx, hz) a lane that runs against it costs 400 m² extra, so a car
  // sitting on the yellow line picks the lane it is actually facing. Returns a fresh object (callers may keep it).
  nearestLane(x, z, hx = 0, hz = 0) {
    const segs = this.segments, hasHeading = hx !== 0 || hz !== 0;
    let bd = Infinity, bSeg = null, bDir = 1, bLane = 0, bt = 0, bpx = 0, bpz = 0;
    for (let si = 0; si < segs.length; si++) {
      const seg = segs[si], len = seg.len - road;
      for (let dir = 1; dir >= -1; dir -= 2) {
        const A = dir > 0 ? seg.a : seg.b, B = dir > 0 ? seg.b : seg.a, fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx;
        const penalty = hasHeading && fx * hx + fz * hz < -0.2 ? 400 : 0;
        for (let l = 0; l < 2; l++) {
          const off = 1.75 + l * 3.5, sx = A.x + fx * HALF + rx * off, sz = A.z + fz * HALF + rz * off; // same maths as lane()
          const t = clamp(((x - sx) * fx + (z - sz) * fz) / len, 0, 1);
          const px = sx + fx * t * len, pz = sz + fz * t * len, d = (px - x) ** 2 + (pz - z) ** 2 + penalty;
          if (d < bd) { bd = d; bSeg = seg; bDir = dir; bLane = l; bt = t; bpx = px; bpz = pz; }
        }
      }
    }
    return { seg: bSeg, dir: bDir, lane: bLane, t: bt, px: bpx, pz: bpz, L: this.lane(bSeg, bDir, bLane) };
  }
  // Height of the walkable ground at (x, z): road 0, sidewalk/park 0.15, parking lot 0.17, beach 0.02, pier ramp 0 -> pier.y, pier deck pier.y.
  groundY(x, z) {
    const pier = this.pier;
    if (pier && Math.abs(z - pier.z) < 4.5) {
      if (x >= pier.x0 && x <= pier.x1) return pier.y;
      if (x >= pier.x0 - 6 && x < pier.x0) return pier.y * (x - (pier.x0 - 6)) / 6;
    }
    if (this.flora && Math.abs(x - (CITY.maxX - HALF)) < 0.6) { const m = this.flora.medianAt(x, z); if (m) return m; } // raised planter median of the coast road
    if (x > CITY.beachX - 1) return 0.02;
    const u = x - (CITY.roadX(0) + HALF), v = z - (CITY.roadZ(0) + HALF), bi = Math.floor(u / pitch), bj = Math.floor(v / pitch);
    if (bi < 0 || bj < 0 || bi >= gridX || bj >= gridZ) return 0; // same block range as buildBlocks
    if (u - bi * pitch >= CITY.block || v - bj * pitch >= CITY.block) return 0; // road
    const lots = this.lotGrid.get(bj * 64 + bi);
    if (lots) for (let i = 0; i < lots.length; i++) { const L = lots[i]; if (x >= L.x0 && x <= L.x1 && z >= L.z0 && z <= L.z1) return 0.17; }
    return 0.15;
  }
  randomLanePoint() { const seg = this.segments[Math.floor(Math.random() * this.segments.length)], dir = Math.random() < 0.5 ? 1 : -1, lane = Math.random() < 0.6 ? 0 : 1, L = this.lane(seg, dir, lane), t = 0.1 + Math.random() * 0.8; return { seg, dir, lane, t, x: L.sx + L.fx * t * L.len, z: L.sz + L.fz * t * L.len, heading: Math.atan2(-L.fz, L.fx), L }; }
  randomSidewalkPoint(list) { // any sidewalk of the city, or of the given segments (game.js nearSegments)
    const L = list && list.length ? list : this.segments, seg = L[Math.floor(Math.random() * L.length)], side = Math.random() < 0.5 ? 1 : -1; const A = seg.a, B = seg.b;
    const fx = Math.sign(B.x - A.x), fz = Math.sign(B.z - A.z), rx = -fz, rz = fx, t = 0.1 + Math.random() * 0.8, off = side * (HALF + sidewalk / 2);
    return { x: A.x + fx * (HALF + t * (seg.len - road)) + rx * off, z: A.z + fz * (HALF + t * (seg.len - road)) + rz * off, seg, side };
  }
  // sidewalk waypoint graph: corners of every block (used by pedestrians)
  sidewalkCorner(bi, bj, cx, cz) { // block bi,bj corner cx,cz in {0,1}
    return { x: CITY.roadX(bi + cx) + (cx ? -1 : 1) * (HALF + sidewalk / 2), z: CITY.roadZ(bj + cz) + (cz ? -1 : 1) * (HALF + sidewalk / 2) };
  }
  isRoad(x, z) { const fx = ((x - CITY.roadX(0) + HALF) % pitch + pitch) % pitch, fz = ((z - CITY.roadZ(0) + HALF) % pitch + pitch) % pitch; return fx < road || fz < road; }

  // ---------------- ground ----------------
  buildGround() {
    const mats = this.mats = {
      asphalt: new THREE.MeshStandardMaterial({ map: asphaltTex(), normalMap: asphaltNormal(), normalScale: new THREE.Vector2(0.7, 0.7), roughness: 0.92, metalness: 0.02 }),
      sidewalk: new THREE.MeshStandardMaterial({ map: sidewalkTex(), normalMap: sidewalkNormal(), normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.95 }),
      grass: new THREE.MeshStandardMaterial({ map: grassTex(), roughness: 1 }),
      sand: new THREE.MeshStandardMaterial({ map: sandTex(), normalMap: sandNormal(), normalScale: new THREE.Vector2(0.5, 0.5), roughness: 1 }),
      roof: new THREE.MeshStandardMaterial({ map: roofTex(), roughness: 0.95 }),
      plank: new THREE.MeshStandardMaterial({ map: plankTex(), normalMap: plankNormal(), normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.9 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.8 }),
      white: new THREE.MeshBasicMaterial({ color: 0xf2f2f2, side: THREE.DoubleSide }),
      yellow: new THREE.MeshBasicMaterial({ color: 0xf2c230, side: THREE.DoubleSide }),
      prop: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.1 }),
      leaf: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
    };
    patchWetShader(mats.asphalt, this.wetU, this.isLowTier); patchWetShader(mats.sidewalk, this.wetU, this.isLowTier); // roads, parking lots (same material) and pavements
    const g = new GeoBuilder(); g.plane(CITY.minX - 6, CITY.minZ - 6, CITY.maxX, CITY.maxZ + 6, 0, 6);
    const ground = new THREE.Mesh(g.build(), mats.asphalt); ground.receiveShadow = true; this.scene.add(ground);
    // outskirts ground: a frame around the city rectangle, never overlapping the asphalt
    const o = new GeoBuilder(); const X0 = CITY.minX - 6, X1 = CITY.maxX, Z0 = CITY.minZ - 6, Z1 = CITY.maxZ + 6, F = 900;
    o.plane(X0 - F, Z0 - F, X1 + F, Z0, -0.04, 12); o.plane(X0 - F, Z1, X1 + F, Z1 + F, -0.04, 12);
    o.plane(X0 - F, Z0, X0, Z1, -0.04, 12); o.plane(X1, Z0, X1 + F, Z1, -0.04, 12);
    const outer = new THREE.Mesh(o.build(), mats.grass); outer.receiveShadow = true; this.scene.add(outer);
    // invisible boundary walls
    const B = 30, big = 1000;
    this.grid.add({ x0: CITY.minX - B - 5, x1: CITY.minX - B, z0: -big, z1: big, y0: 0, y1: 50, type: 'wall' });
    this.grid.add({ x0: CITY.oceanX + 14, x1: CITY.oceanX + 19, z0: -big, z1: big, y0: 0, y1: 50, type: 'wall' });
    this.grid.add({ x0: -big, x1: big, z0: CITY.minZ - B - 5, z1: CITY.minZ - B, y0: 0, y1: 50, type: 'wall' });
    this.grid.add({ x0: -big, x1: big, z0: CITY.maxZ + B, z1: CITY.maxZ + B + 5, y0: 0, y1: 50, type: 'wall' });
    this.bounds = { minX: CITY.minX - B + 1, maxX: CITY.oceanX + 13, minZ: CITY.minZ - B + 1, maxZ: CITY.maxZ + B - 1 };
  }

  // ---------------- blocks, lots and buildings ----------------
  buildBlocks() {
    const rng = this.rng; const facadeBuilders = new Map(); const roofB = new GeoBuilder(), walkB = new GeoBuilder(), grassB = new GeoBuilder(), lotB = new GeoBuilder(), lineB = new GeoBuilder();
    const fb = id => { if (!facadeBuilders.has(id)) facadeBuilders.set(id, new GeoBuilder()); return facadeBuilders.get(id); };
    this.storeBuilders = [new GeoBuilder(), new GeoBuilder(), new GeoBuilder(), new GeoBuilder(), new GeoBuilder()]; this.awningB = new GeoBuilder(); this.shadowB = new GeoBuilder();
    const cx = (gridX - 1) / 2, cz = (gridZ - 1) / 2, maxD = Math.hypot(cx, cz);
    this.buildings = [];
    const poiByBlock = new Map(POI_DEFS.map(p => [p.block.join(','), p])); const dist0 = (bi, bj, d) => this.bld.district(bi, bj, d);
    for (let bj = 0; bj < gridZ; bj++) for (let bi = 0; bi < gridX; bi++) {
      const x0 = CITY.roadX(bi) + HALF, z0 = CITY.roadZ(bj) + HALF, x1 = x0 + CITY.block, z1 = z0 + CITY.block;
      const isPark = PARKS.some(p => p[0] === bi && p[1] === bj);
      if (isPark) { grassB.box(x0, 0, z0, x1, 0.15, z1, { uvU: 8, uvV: 8 }); walkB.box(x0, 0, z0, x1, 0.14, z1, { uvU: 4, uvV: 4 }); this.buildPark(x0, z0, x1, z1, walkB); continue; }
      walkB.box(x0, 0, z0, x1, 0.15, z1, { uvU: 4, uvV: 4 });
      const d = Math.hypot(bi - cx, bj - cz) / maxD, tall = Math.pow(1 - d, 2.2);
      const poi = poiByBlock.get(bi + ',' + bj);
      const cols = d < 0.35 ? 2 : (rng() < 0.5 ? 2 : 3), rows = d < 0.35 ? 2 : (rng() < 0.5 ? 2 : 3);
      const inner0x = x0 + sidewalk, inner0z = z0 + sidewalk, lw = (CITY.block - 2 * sidewalk) / cols, lh = (CITY.block - 2 * sidewalk) / rows;
      if (poi) this.bld.markers.push({ x: inner0x + lw / 2, z: z0 + 1.5 }); // the marker of this point of interest (the centre of its lot, see pois below): canopy posts keep off it
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const lx0 = inner0x + c * lw, lz0 = inner0z + r * lh, lx1 = lx0 + lw, lz1 = lz0 + lh; const isPoiLot = poi && r === 0 && c === 0;
        if (!isPoiLot && d > 0.4 && rng() < 0.13) { if (!this.bld.garage(bi, bj, r, c, lx0, lz0, lx1, lz1, dist0(bi, bj, d))) this.buildParking(lx0, lz0, lx1, lz1, lotB, lineB); continue; }
        const gap = 1 + rng() * 1.6;
        let bx0 = lx0 + gap, bz0 = lz0 + gap, bx1 = lx1 - gap, bz1 = lz1 - gap;
        let floors = Math.round(2 + tall * 34 + rng() * 5 + (rng() < 0.08 ? 10 : 0)); let style = FACADES[Math.floor(rng() * FACADES.length)];
        if (d > 0.55 && style.id === 'tower') style = FACADES[1]; if (d < 0.25 && rng() < 0.5) style = rng() < 0.5 ? FACADES[0] : FACADES[6];
        const dist = this.bld.district(bi, bj, d); // downtown / beach / old / industrial / mixed: the facade ids follow the district (own random stream, the city layout rng is untouched)
        if (isPoiLot) { floors = poi.floors; style = FACADES.find(f => f.id === poi.facade); bx0 = lx0 + 1; bz0 = lz0 + 1; bx1 = lx1 - 1; bz1 = lz1 - 1; } else style = this.bld.pickStyle(dist, style, bi, bj, r, c);
        const s0 = this.signs.length, k0 = this.storeSpill.length;
        const rec = this.addBuilding(fb(style.id), roofB, bx0, bz0, bx1, bz1, floors, style, rng, isPoiLot ? poi : null, { bi, bj, r, c, rows, cols, dist, d, gap: isPoiLot ? 1 : gap });
        const h = rec.h, F = rec.front; // F[side] = { a0, a1, face, hMax }: the straight stretch of wall on that side (signs and shop fronts keep to it) and its height below the first set-back
        // signs on the street-facing side(s)
        const frontZ = r === 0, frontX = c === 0; this.lastSign = null;
        if (isPoiLot) { this.addSign(F.S.a0, F.S.a1, F.S.face, poi.sign[0], poi.sign[1], 'south', h, 1.3, poi); this.pois[poi.id] = { ...poi, x: (bx0 + bx1) / 2, z: z0 + 1.5, bx0, bx1, bz0, bz1, h, blockX0: x0, blockZ0: z0 }; }
        else if (floors <= 14 && rng() < 0.42) { const s = SIGN_TEXTS[Math.floor(rng() * SIGN_TEXTS.length)]; if (frontZ) this.addSign(F.S.a0, F.S.a1, F.S.face, s[0], s[1], 'south', F.S.hMax, 1); else if (r === rows - 1) this.addSign(F.N.a0, F.N.a1, F.N.face, s[0], s[1], 'north', F.N.hMax, 1); else if (frontX) this.addSignX(F.W.face, F.W.a0, F.W.a1, s[0], s[1], 'west', F.W.hMax); else if (c === cols - 1) this.addSignX(F.E.face, F.E.a0, F.E.a1, s[0], s[1], 'east', F.E.hMax); }
        if (!isPoiLot && floors >= 3 && floors <= 14 && this.signRng() < 0.3) { // a vertical blade sign on one of the street-facing sides
          const sides = []; if (frontZ) sides.push(0); if (r === rows - 1) sides.push(1); if (frontX) sides.push(2); if (c === cols - 1) sides.push(3);
          const side = sides[Math.floor(this.signRng() * sides.length)], t = SIGN_TEXTS[Math.floor(this.signRng() * SIGN_TEXTS.length)];
          if (side !== undefined) this.placeBlade(side, F, t[0], t[1]);
        }
        if (floors <= 6 && !isPoiLot && rng() < 0.2 && this.bld.billboardOk(rec)) { const bb = this.addBillboard((bx0 + bx1) / 2, h, (bz0 + bz1) / 2, rng); this.bld.noteBillboard(rec, bb); }
        if (floors <= 16 && rng() < 0.75) { const var_ = Math.floor(rng() * 5); if (frontZ && !(isPoiLot && this.shops.hasInterior(poi.id))) this.addStorefront(F.S.a0, F.S.a1, F.S.face, 'south', var_); if (r === rows - 1) this.addStorefront(F.N.a0, F.N.a1, F.N.face, 'north', var_); if (frontX) this.addStorefrontX(F.W.face, F.W.a0, F.W.a1, 'west', var_); if (c === cols - 1) this.addStorefrontX(F.E.face, F.E.a0, F.E.a1, 'east', var_); }
        this.bld.finishLot(rec, this.signs.slice(s0), this.storeSpill.slice(k0));
      }
    }
    // materials + meshes
    this.facadeMats = [];
    for (const [id, b] of facadeBuilders) {
      const style = FACADES.find(f => f.id === id), tex = facadeTextures(style); const orm = facadeORM(style);
      const m = new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, normalMap: facadeNormal(style), normalScale: new THREE.Vector2(0.85, 0.85), roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, envMapIntensity: 1.1 });
      m.userData.glow = tex.glow; this.facadeMats.push(m); patchWindowShader(m, this.winU, this.isLowTier);
      if (style.id === 'glass' || style.id === 'tower') envRegister(m, 1.0); // mirror-like glass panes: explicit PMREM so envMapIntensity applies
      const mesh = new THREE.Mesh(this.seedAttribute(b.build()), m); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh);
    }
    const roofs = new THREE.Mesh(roofB.build(), this.mats.roof); roofs.castShadow = true; roofs.receiveShadow = true; this.scene.add(roofs);
    this.storeMats = [];
    this.storeBuilders.forEach((b, i) => { if (!b.count) return; const tex = storefrontTextures(i); const orm = storefrontORM(i); const m = new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, normalMap: storefrontNormal(i), normalScale: new THREE.Vector2(0.8, 0.8), roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, envMapIntensity: 1.2 }); this.storeMats.push(m); envRegister(m, 1.0); const mesh = new THREE.Mesh(b.build(), m); mesh.castShadow = true; mesh.receiveShadow = true; this.scene.add(mesh); });
    if (this.awningB.count) { const aw = new THREE.Mesh(this.awningB.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide })); aw.castShadow = true; this.scene.add(aw); }
    if (this.shadowB.count) this.scene.add(new THREE.Mesh(this.shadowB.build(), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, color: 0x000000, opacity: 0.55, side: THREE.DoubleSide })));
    const walks = new THREE.Mesh(walkB.build(), this.mats.sidewalk); walks.receiveShadow = true; this.scene.add(walks);
    if (grassB.count) { const gr = new THREE.Mesh(grassB.build(), this.mats.grass); gr.receiveShadow = true; this.scene.add(gr); }
    if (lotB.count) { const lot = new THREE.Mesh(lotB.build(), this.mats.asphalt); lot.receiveShadow = true; this.scene.add(lot); }
    if (lineB.count) this.scene.add(new THREE.Mesh(lineB.build(), this.mats.white));
    this.bld.decorateAll(); // roof furniture, facade relief and their colliders (before the beach, shops, lamps and flora, which keep clear of everything in the grid)
  }
  // The per-building seed travels in the vertex colour of the facade box (r = random, g = floors / 60, b = style / 8); buildBlocks and buildBeach
  // rename that attribute to aBld, which the window shader reads (see patchWindowShader).
  seedAttribute(geo) { const c = geo.getAttribute('color'); if (c) { geo.setAttribute('aBld', c); geo.deleteAttribute('color'); } return geo; }
  // One building: the plan (silhouette archetype, set-backs, roof kind) comes from buildings.js, the walls go into the facade builder of the style, the roof surfaces into
  // roofB, the solid masses into the collision grid. Points of interest keep their exact box: shops.js owns their walls and ground floor (hollow), only the roof and crown are ours.
  addBuilding(fb, roofB, x0, z0, x1, z1, floors, style, rng, poi, info) {
    const seed = new THREE.Color(this.seedRng(), floors / 60, FACADES.indexOf(style) / 8);
    const rec = this.bld.plan({ ...info, x0, z0, x1, z1, floors, style, poi, seed });
    const hollow = !!poi && this.shops.shell(poi, fb, seed, x0, z0, x1, z1, rec.parts[0].y1); // shops: a hollow, enterable ground floor (shops.js); everything else is solid
    if (poi && !hollow) rec.parts[0].poi = false;
    this.bld.cur = rec; this.bld.emit(rec, fb, roofB);
    if (poi?.garage && !hollow) { // dark garage opening on the south face
      const m = new THREE.Mesh(new THREE.PlaneGeometry((x1 - x0) * 0.6, 4.2), new THREE.MeshBasicMaterial({ color: 0x08090c })); m.position.set((x0 + x1) / 2, 2.1, z0 - 0.05); m.rotation.y = Math.PI; this.scene.add(m);
    }
    if (poi?.cross) { const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: crossTex() })); m.position.set((x0 + x1) / 2, rec.parts[0].y1 - 3, z0 - 0.06); m.rotation.y = Math.PI; this.scene.add(m); }
    return rec;
  }
  addStorefront(x0, x1, z, side, v) {
    const b = this.storeBuilders[v]; const w = x1 - x0; if (w < 7) return; if (this.bld.wantShutter(this.bld.cur, x0, x1, z, side, true)) return; const d = 0.22; const zz0 = side === 'south' ? z - d : z - 0.02, zz1 = side === 'south' ? z + 0.02 : z + d;
    b.box(x0 + 0.3, 0, zz0, x1 - 0.3, 4.4, zz1, { uvU: 6, uvV: 4.4, top: true });
    const col = new THREE.Color(AWNINGS[v % AWNINGS.length]); const az = side === 'south' ? z - d : z + d; const dir = side === 'south' ? -1 : 1;
    this.storeSpill.push({ x0, x1, z, side, alongX: true, a0: x0 + 0.3, a1: x1 - 0.3, face: az, dir }); // shop-window light on the pavement, see buildLightPools
    this.awningB.quad([x0 + 0.5, 3.35, az], [x1 - 0.5, 3.35, az], [x1 - 0.5, 2.85, az + dir * 1.3], [x0 + 0.5, 2.85, az + dir * 1.3], [0, 0.9, dir * 0.4], null, col);
  }
  addStorefrontX(x, z0, z1, side, v) {
    const b = this.storeBuilders[v]; const w = z1 - z0; if (w < 7) return; if (this.bld.wantShutter(this.bld.cur, z0, z1, x, side, false)) return; const d = 0.22; const xx0 = side === 'west' ? x - d : x - 0.02, xx1 = side === 'west' ? x + 0.02 : x + d;
    b.box(xx0, 0, z0 + 0.3, xx1, 4.4, z1 - 0.3, { uvU: 6, uvV: 4.4, top: true });
    const col = new THREE.Color(AWNINGS[v % AWNINGS.length]); const ax = side === 'west' ? x - d : x + d; const dir = side === 'west' ? -1 : 1;
    this.storeSpill.push({ x, z0, z1, side, alongX: false, a0: z0 + 0.3, a1: z1 - 0.3, face: ax, dir });
    this.awningB.quad([ax, 3.35, z1 - 0.5], [ax, 3.35, z0 + 0.5], [ax + dir * 1.3, 2.85, z0 + 0.5], [ax + dir * 1.3, 2.85, z1 - 0.5], [dir * 0.4, 0.9, 0], null, col);
  }
  // ---------------- signage ----------------
  // Nothing here creates a Mesh or a Material: a sign is only recorded in this.signs, and buildSigns() (called once after buildBlocks and buildBeach)
  // builds ONE mesh for all neon signs (atlas texture, alpha-tested), ONE for the billboard faces and ONE merged dark mesh for raceways, blade
  // cabinets, brackets, billboard frames and posts. Sign fields: kind 'wall' { alongX, a (centre along the wall), face (wall plane), dir (outward),
  // y, w, hh } or 'blade' { alongX, a, face, dir, yb, H, W, c (distance of its centre line from the wall) }, plus text, color, style, flick.
  // Height of a wall sign's centre: not below the storefront band (4.4 m) and the sign stays under the roof line.
  signHeight(h, hh, y) { return Math.max(4.55 + hh / 2, Math.min(y, h - 0.3 - hh / 2)); }
  pushSign(sg) {
    sg.flick = this.signRng() < 0.08 ? ++this.flickN : 0; // 8 % of the signs flicker (ids 1..n); 0 = steady
    this.signs.push(sg); this.lastSign = sg;
    if (sg.kind === 'wall' && sg.style === 'tube') { // raceway: the dark channel the tubes are mounted on, 0.15 m deep, behind the lower part of the lettering
      const y = sg.y - sg.hh * 0.2, a0 = sg.a - sg.w * 0.46, a1 = sg.a + sg.w * 0.46, f0 = Math.min(sg.face - sg.dir * 0.03, sg.face + sg.dir * 0.15), f1 = Math.max(sg.face - sg.dir * 0.03, sg.face + sg.dir * 0.15);
      if (sg.alongX) this.darkB.box(a0, y - 0.11, f0, a1, y + 0.11, f1, { uvU: 1, uvV: 1 }); else this.darkB.box(f0, y - 0.11, a0, f1, y + 0.11, a1, { uvU: 1, uvV: 1 });
    }
  }
  addSign(x0, x1, z, text, color, side, h, scale = 1, poi) {
    const w = Math.min(10 * scale, (x1 - x0) * 0.8), hh = w / NEON_ASPECT, a = (x0 + x1) / 2, dir = side === 'south' ? -1 : 1;
    const y = this.signHeight(h, hh, poi ? 7.5 : 4.8 + this.signRng() * 2);
    this.pushSign({ kind: 'wall', alongX: true, a, face: z, dir, y, w, hh, text, color, style: poi && BOX_POI_TYPES.has(poi.type) ? 'box' : 'tube' });
    this.signSpill.push({ alongX: true, a, face: z, dir, color });
  }
  addSignX(x, z0, z1, text, color, side, h) {
    const w = Math.min(10, (z1 - z0) * 0.8), hh = w / NEON_ASPECT, a = (z0 + z1) / 2, dir = side === 'west' ? -1 : 1;
    const y = this.signHeight(h, hh, 4.8 + this.signRng() * 2);
    this.pushSign({ kind: 'wall', alongX: false, a, face: x, dir, y, w, hh, text, color, style: 'tube' });
    this.signSpill.push({ alongX: false, a, face: x, dir, color });
  }
  // Vertical blade sign: 1.4 m wide, 4 to 5.9 m tall (it depends on the number of letters), double sided, perpendicular to the facade, its centre line 1.0 to
  // 2.4 m out over the pavement, bottom edge at 4.6 to 11 m. (x, z) is the point on the wall the bracket is fixed to; side is the facade it hangs from.
  // The letters are stacked top to bottom in logical order (Array.from), which reads correctly for Hebrew and for English. It adds a dark cabinet between its
  // two faces, two brackets and a collision box (overhead: bullets and the camera ray hit it, walkers and cars pass under it).
  addBladeSign(x, z, side, text, color, h) {
    const alongX = side === 'south' || side === 'north', dir = side === 'south' || side === 'west' ? -1 : 1, W = 1.4;
    const n = bladeLetters(text).length; if (!n) return;
    const H = bladeLayout(n).used / (NEON_CELL.h - 2 * NEON_CELL.pad) * W, yMax = Math.min(11, h - H - 0.4); if (yMax < 4.6) return; // does not fit under the roof line
    const yb = 4.6 + this.signRng() * (yMax - 4.6), c = 1.0 + this.signRng() * 1.4, a = alongX ? x : z, face = alongX ? z : x;
    this.pushSign({ kind: 'blade', alongX, a, face, dir, yb, H, W, c, text, color, style: 'blade' });
    const f0 = face + dir * (c - W / 2), f1 = face + dir * (c + W / 2), lo = Math.min(f0, f1), hi = Math.max(f0, f1), w0 = Math.min(face - dir * 0.02, f0), w1 = Math.max(face - dir * 0.02, f0);
    const box = (an0, an1, y0, y1, o0, o1) => { if (alongX) this.darkB.box(an0, y0, o0, an1, y1, o1, { uvU: 1, uvV: 1 }); else this.darkB.box(o0, y0, an0, o1, y1, an1, { uvU: 1, uvV: 1 }); }; // an = along the wall, o = across it
    box(a - 0.05, a + 0.05, yb, yb + H, lo, hi); // cabinet
    for (const yy of [yb + 0.3, yb + H - 0.3]) box(a - 0.04, a + 0.04, yy - 0.04, yy + 0.04, w0, w1); // brackets back to the wall
    if (alongX) this.grid.add({ x0: a - 0.06, x1: a + 0.06, z0: lo, z1: hi, y0: yb, y1: yb + H, type: 'prop' }); else this.grid.add({ x0: lo, x1: hi, z0: a - 0.06, z1: a + 0.06, y0: yb, y1: yb + H, type: 'prop' });
  }
  // picks where on a facade a blade sign goes (side 0..3 = south, north, west, east) and keeps clear of the wall sign recorded last
  placeBlade(si, F, text, color) {
    const sp = F['SNWE'[si]], alongX = si < 2, face = sp.face, lo = sp.a0 + 1.6, hi = sp.a1 - 1.6, ls = this.lastSign;
    let a0 = lo, a1 = hi;
    if (ls && ls.kind === 'wall' && ls.alongX === alongX && ls.face === face) { const left = ls.a - ls.w / 2 - 1, right = ls.a + ls.w / 2 + 1; if (left - lo >= hi - right) a1 = left; else a0 = right; }
    if (a1 - a0 < 0.5) return;
    const a = a0 + this.signRng() * (a1 - a0);
    this.addBladeSign(alongX ? a : face, alongX ? face : a, ['south', 'north', 'west', 'east'][si], text, color, sp.hMax);
  }
  // Billboard: only the face is textured (atlas); frame, posts and back plate are merged into the dark prop mesh. rng() is called exactly as before (layout unchanged).
  addBillboard(x, h, z, rng) {
    const idx = Math.floor(rng() * BILLBOARDS.length), rot = Math.floor(rng() * 4) * Math.PI / 2, c = Math.cos(rot), s = Math.sin(rot);
    this.billboardDefs.push({ x, h, z, idx, rot });
    const box = (x0, y0, z0, x1, y1, z1) => { // local box -> world box (rot is a multiple of 90 degrees, so it stays axis-aligned)
      const ax = x + x0 * c + z0 * s, az = z - x0 * s + z0 * c, bx = x + x1 * c + z1 * s, bz = z - x1 * s + z1 * c;
      this.darkB.box(Math.min(ax, bx), h + y0, Math.min(az, bz), Math.max(ax, bx), h + y1, Math.max(az, bz), { uvU: 1, uvV: 1 });
    };
    box(-4.2, 5.05, -0.15, 4.2, 5.35, 0.15); // spine
    for (const px of [-3.6, 3.6]) box(px - 0.125, 0, -0.125, px + 0.125, 3.2, 0.125); // posts
    box(-4.15, 7.2, -0.22, 4.15, 7.35, 0.26); box(-4.15, 3.05, -0.22, 4.15, 3.2, 0.26); box(-4.15, 3.2, -0.22, -4.0, 7.2, 0.26); box(4.0, 3.2, -0.22, 4.15, 7.2, 0.26); // frame around the face
    const P = (lx, ly, lz) => [x + lx * c + lz * s, h + ly, z - lx * s + lz * c];
    this.darkB.quad(P(4, 3.2, -0.2), P(-4, 3.2, -0.2), P(-4, 7.2, -0.2), P(4, 7.2, -0.2), [-s, 0, -c]); // back plate, facing away from the face
    return { x, z, rot };
  }
  // One draw call each for the neon signs, the billboard faces and the dark prop geometry.
  buildSigns() {
    const atlas = neonAtlas(this.signs.map(sg => ({ text: sg.text, color: sg.color, style: sg.style })));
    const g = new GeoBuilder(), flick = [];
    // a quad of width w and height hh centred on (cx, cy, cz), facing (nx, nz), readable from the front (reading direction r = (nz, -nx))
    const face = (cx, cy, cz, nx, nz, w, hh, uvs, f) => {
      const rx = nz, rz = -nx, hw = w / 2, hy = hh / 2;
      g.quad([cx - rx * hw, cy - hy, cz - rz * hw], [cx + rx * hw, cy - hy, cz + rz * hw], [cx + rx * hw, cy + hy, cz + rz * hw], [cx - rx * hw, cy + hy, cz - rz * hw], [nx, 0, nz], uvs);
      for (let i = 0; i < 6; i++) flick.push(f);
    };
    for (const sg of this.signs) {
      const r = atlas.rect(sg);
      if (sg.kind === 'blade') { // the cell holds the stack rotated by 90 degrees (see textures.js): the sign's top is the cell's left, its left edge the cell's bottom
        const uU = r.u0 + bladeLayout(bladeLetters(sg.text).length).used * r.texel, uvs = [[uU, r.vB], [uU, r.vT], [r.u0, r.vT], [r.u0, r.vB]]; // bottom-left, bottom-right, top-right, top-left
        const tx = sg.alongX ? 1 : 0, tz = sg.alongX ? 0 : 1, cl = sg.face + sg.dir * sg.c, cx = sg.alongX ? sg.a : cl, cz = sg.alongX ? cl : sg.a, cy = sg.yb + sg.H / 2;
        face(cx + tx * 0.07, cy, cz + tz * 0.07, tx, tz, sg.W, sg.H, uvs, sg.flick); face(cx - tx * 0.07, cy, cz - tz * 0.07, -tx, -tz, sg.W, sg.H, uvs, sg.flick); // one face per side of the cabinet
      } else {
        const off = sg.face + sg.dir * SIGN_OFFSET;
        face(sg.alongX ? sg.a : off, sg.y, sg.alongX ? off : sg.a, sg.alongX ? 0 : sg.dir, sg.alongX ? sg.dir : 0, sg.w, sg.hh, [[r.u0, r.vB], [r.u1, r.vB], [r.u1, r.vT], [r.u0, r.vT]], sg.flick);
      }
    }
    if (g.count) {
      const geo = g.build(); geo.setAttribute('aFlick', new THREE.Float32BufferAttribute(flick, 1));
      const mat = this.signMat = new THREE.MeshBasicMaterial({ map: atlas.texture, alphaTest: 0.3, side: THREE.DoubleSide });
      // level (day 0.42 .. night 3.0, written once per frame by setNight) scales the colour; signs with aFlick > 0 go dark for 0.06-0.2 s every 2-7 s and buzz at 7 Hz
      mat.onBeforeCompile = shader => {
        shader.uniforms.level = this.signU.level; shader.uniforms.time = this.signU.time;
        shader.vertexShader = shader.vertexShader.replace('#include <common>', () => '#include <common>\nattribute float aFlick; varying float vFlick;').replace('#include <begin_vertex>', () => '#include <begin_vertex>\n  vFlick = aFlick;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', () => '#include <common>\nvarying float vFlick; uniform float level; uniform float time;\nfloat sgHash(float n) { return fract(sin(n * 12.9898) * 43758.5453); }')
          .replace('#include <alphatest_fragment>', () => `#include <alphatest_fragment>
  {
    float sgF = 1.0;
    if (vFlick > 0.5) {
      float sgId = floor(vFlick + 0.5), sgP = 2.0 + 5.0 * sgHash(sgId), sgD = 0.06 + 0.14 * sgHash(sgId + 17.0);
      float sgPh = mod(time + sgP * sgHash(sgId + 31.0), sgP), sgSlot = sgHash(floor(time * 7.0) + sgId * 3.7);
      sgF = sgPh < sgD ? 0.04 + 0.5 * step(0.7, sgSlot) : 0.94 + 0.06 * sgSlot;
    }
    diffuseColor.rgb *= level * sgF;
  }`);
      };
      mat.customProgramCacheKey = () => 'sign';
      this.signMesh = new THREE.Mesh(geo, mat); this.scene.add(this.signMesh);
    }
    // billboard faces
    const bb = billboardAtlas(BILLBOARDS), bg = new GeoBuilder();
    for (const b of this.billboardDefs) {
      const c = Math.cos(b.rot), s = Math.sin(b.rot), P = (lx, ly, lz) => [b.x + lx * c + lz * s, b.h + ly, b.z - lx * s + lz * c], r = bb.rect(b.idx);
      bg.quad(P(-4, 3.2, 0.2), P(4, 3.2, 0.2), P(4, 7.2, 0.2), P(-4, 7.2, 0.2), [s, 0, c], [[r.u0, r.vB], [r.u1, r.vB], [r.u1, r.vT], [r.u0, r.vT]]);
    }
    if (bg.count) { this.billMat = new THREE.MeshBasicMaterial({ map: bb.texture }); this.billMesh = new THREE.Mesh(bg.build(), this.billMat); this.scene.add(this.billMesh); }
    if (this.darkB.count) { this.darkMesh = new THREE.Mesh(this.darkB.build(), this.mats.dark); this.scene.add(this.darkMesh); }
  }
  buildParking(x0, z0, x1, z1, lotB, lineB) {
    lotB.box(x0, 0.15, z0, x1, 0.17, z1, { uvU: 6, uvV: 6, sides: false });
    const lot = { x0, z0, x1, z1 }; this.lots.push(lot); // groundY: 0.17 inside a lot
    const key = Math.floor(((z0 + z1) / 2 - (CITY.roadZ(0) + HALF)) / pitch) * 64 + Math.floor(((x0 + x1) / 2 - (CITY.roadX(0) + HALF)) / pitch); let arr = this.lotGrid.get(key); if (!arr) this.lotGrid.set(key, arr = []); arr.push(lot);
    const n = Math.floor((x1 - x0 - 4) / 3.2); const zc = (z0 + z1) / 2;
    for (let i = 0; i < n; i++) { const x = x0 + 2 + i * 3.2; lineB.strip(x, zc - 4, Math.PI / 2, 5.5, 0.15, 0.18); if (i < n - 1 && this.parkRng() < 0.55) this.parkingSpots.push({ x: x + 1.6, z: zc - 4, heading: Math.PI / 2 }); }
    lineB.strip(x0 + 2 + n * 3.2, zc - 4, Math.PI / 2, 5.5, 0.15, 0.18);
  }
  buildPark(x0, z0, x1, z1, walkB) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; walkB.box(cx - 2, 0.14, z0, cx + 2, 0.17, z1, { uvU: 4, uvV: 4, sides: false }); walkB.box(x0, 0.14, cz - 2, x1, 0.17, cz + 2, { uvU: 4, uvV: 4, sides: false });
    const f = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.4, 0.8, 24), this.mats.sidewalk); f.position.set(cx, 0.4, cz); this.scene.add(f); this.grid.add({ x0: cx - 4, x1: cx + 4, z0: cz - 4, z1: cz + 4, y0: 0, y1: 1, type: 'prop' });
    const water = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x3aa0c8, roughness: 0.2, metalness: 0.3 })); water.position.set(cx, 0.75, cz); this.scene.add(water);
    this.parks = this.parks || []; this.parks.push({ x0, z0, x1, z1, cx, cz });
    // trees, shrubs, hedges and lawn of the parks are placed by flora.js
  }

  // ---------------- road markings ----------------
  buildRoadMarkings() {
    const w = new GeoBuilder(), y = new GeoBuilder(); const Y = 0.012;
    for (const seg of this.segments) {
      const A = seg.a, B = seg.b, ang = seg.horizontal ? 0 : Math.PI / 2, len = seg.len - road, cx = (A.x + B.x) / 2, cz = (A.z + B.z) / 2, fx = seg.horizontal ? 1 : 0, fz = seg.horizontal ? 0 : 1, rx = -fz, rz = fx;
      y.strip(cx + rx * 0.18, cz + rz * 0.18, ang, len, 0.12, Y); y.strip(cx - rx * 0.18, cz - rz * 0.18, ang, len, 0.12, Y);
      w.strip(cx + rx * 6.85, cz + rz * 6.85, ang, len, 0.12, Y); w.strip(cx - rx * 6.85, cz - rz * 6.85, ang, len, 0.12, Y);
      for (let s = -len / 2 + 3; s < len / 2 - 3; s += 6) for (const side of [3.5, -3.5]) w.strip(cx + fx * s + rx * side, cz + fz * s + rz * side, ang, 3, 0.12, Y);
    }
    for (const n of this.nodes) for (const o of n.out) { // crosswalk + stop line at each approach
      const fx = Math.sign(o.to.x - n.x), fz = Math.sign(o.to.z - n.z), rx = -fz, rz = fx, ang = fx ? 0 : Math.PI / 2;
      const bx = n.x + fx * (HALF + 1.6), bz = n.z + fz * (HALF + 1.6);
      for (let k = -6; k <= 6; k++) w.strip(bx + rx * k * 1.1, bz + rz * k * 1.1, ang, 2.4, 0.55, Y);
      w.strip(n.x + fx * (HALF + 3.4) + rx * 3.5, n.z + fz * (HALF + 3.4) + rz * 3.5, ang, 0.35, 6.6, Y);
      // lane arrows for traffic arriving at this node (they travel along -f): straight in the inner lane, right turn in the outer lane
      const ax = n.x + fx * (HALF + 13), az = n.z + fz * (HALF + 13); const tf = [-fx, -fz]; const tr = [-tf[1], tf[0]]; // right of travel
      const arrow = (cx, cz, dir, turn) => { const [dx, dz] = dir; const [px, pz] = [-dz, dx];
        w.strip(cx - dx * 1.0, cz - dz * 1.0, Math.atan2(-dz, dx), 2.4, 0.3, Y);
        w.tri([cx + dx * 0.3 + px * 0.65, Y, cz + dz * 0.3 + pz * 0.65], [cx + dx * 1.6, Y, cz + dz * 1.6], [cx + dx * 0.3 - px * 0.65, Y, cz + dz * 0.3 - pz * 0.65]);
        if (turn) { const [qx, qz] = turn; w.strip(cx - dx * 0.4 + qx * 0.6, cz - dz * 0.4 + qz * 0.6, Math.atan2(-qz, qx), 1.2, 0.3, Y); w.tri([cx - dx * 0.4 + qx * 1.1 + dx * 0.55, Y, cz - dz * 0.4 + qz * 1.1 + dz * 0.55], [cx - dx * 0.4 + qx * 2.0, Y, cz - dz * 0.4 + qz * 2.0], [cx - dx * 0.4 + qx * 1.1 - dx * 0.55, Y, cz - dz * 0.4 + qz * 1.1 - dz * 0.55]); } };
      arrow(ax + tr[0] * 1.75, az + tr[1] * 1.75, tf, null); arrow(ax + tr[0] * 5.25, az + tr[1] * 5.25, tf, tr);
    }
    this.scene.add(new THREE.Mesh(w.build(), this.mats.white)); this.scene.add(new THREE.Mesh(y.build(), this.mats.yellow));
  }

  // ---------------- props: lamps, palms, trees ----------------
  // Everything green and every street light lives in flora.js. The two systems are created here and built once the beach, the pier and the signs exist (buildLamps, buildFlora).
  buildProps() { this.lamps = new Lamps(this); this.flora = new Flora(this); }
  buildLamps() { this.lamps.build(); this.lampPositions = this.lamps.lampList; this.lampHeads = null; } // lampPositions: the lamps the PointLight pool may pick; each has x, y, z, color (hex), lit (0..1, live), fam
  buildShops() { this.shops.build(); } // storefronts and hollow interiors of the points of interest; before lamps and flora, which keep clear of everything in the grid
  interiorAt(x, z) { return this.shops ? this.shops.interiorAt(x, z) : null; } // id of the point of interest whose shop interior contains (x, z), else null
  buildFlora() { this.flora.build(); } // last of the geometry builders: placement keeps clear of everything already in the collision grid

  // ---------------- street furniture ----------------
  buildStreetProps() {
    const col = h => new THREE.Color(h); const B = (w, h, d, x, y, z, c) => xform(new THREE.BoxGeometry(w, h, d), M4(x, y, z), col(c)); const CY = (r0, r1, h, x, y, z, c, seg = 10) => xform(new THREE.CylinderGeometry(r0, r1, h, seg), M4(x, y, z), col(c));
    const kinds = {
      bench: { geo: mergeGeometries([B(1.8, 0.08, 0.5, 0, 0.45, 0, 0x8a5a34), B(1.8, 0.4, 0.06, 0, 0.72, -0.24, 0x8a5a34), B(0.08, 0.45, 0.5, -0.8, 0.22, 0, 0x2a2d33), B(0.08, 0.45, 0.5, 0.8, 0.22, 0, 0x2a2d33)]), every: 44, offset: 2.3, rot: 0, box: 0.9 },
      bin: { geo: mergeGeometries([CY(0.3, 0.26, 0.9, 0, 0.45, 0, 0x2f5f3a, 8), CY(0.32, 0.32, 0.06, 0, 0.93, 0, 0x1e1e22, 8)]), every: 31, offset: 2.4, rot: 0, box: 0.35, shadow: false },
      hydrant: { geo: mergeGeometries([CY(0.14, 0.16, 0.7, 0, 0.35, 0, 0xd8322a, 8), CY(0.18, 0.18, 0.08, 0, 0.72, 0, 0xd8322a, 8), B(0.5, 0.1, 0.12, 0, 0.45, 0, 0xd8322a)]), every: 57, offset: 1.0, rot: 0, box: 0.2, shadow: false },
      mailbox: { geo: mergeGeometries([B(0.5, 0.5, 0.45, 0, 1.0, 0, 0x2b4fa8), B(0.5, 0.15, 0.45, 0, 1.3, 0, 0x2b4fa8), B(0.1, 0.8, 0.1, 0, 0.4, 0, 0x2a2d33)]), every: 83, offset: 2.4, rot: 0, box: 0.3, shadow: false },
      busstop: { geo: mergeGeometries([B(0.12, 2.6, 0.12, -1.4, 1.3, -0.5, 0x4a4d55), B(0.12, 2.6, 0.12, 1.4, 1.3, -0.5, 0x4a4d55), B(3.2, 0.1, 1.4, 0, 2.6, 0, 0x2a2d33), B(3.0, 1.3, 0.08, 0, 1.6, -0.5, 0x5fa8cc), B(2.4, 0.06, 0.4, 0, 0.5, -0.2, 0x8a5a34), B(0.6, 0.5, 0.06, -0.9, 2.2, -0.55, 0xffd34e)]), every: 156, offset: 2.2, rot: 0, box: 1.6 },
    };
    const spots = {}; for (const k in kinds) spots[k] = [];
    const roadWidth = HALF; let phase = 0;
    for (const seg of this.segments) {
      const A = seg.a, B_ = seg.b, fx = Math.sign(B_.x - A.x), fz = Math.sign(B_.z - A.z), rx = -fz, rz = fx; phase++;
      for (const k in kinds) { const K = kinds[k]; const start = 12 + ((phase * 13 + k.length * 7) % K.every);
        for (let sdist = start; sdist < seg.len - road - 8; sdist += K.every) { const side = ((phase + Math.floor(sdist / K.every)) % 2) ? 1 : -1;
          const x = A.x + fx * (HALF + sdist) + rx * side * (roadWidth + K.offset), z = A.z + fz * (HALF + sdist) + rz * side * (roadWidth + K.offset);
          const rot = Math.atan2(rx * side, rz * side) + Math.PI; // face the road
          spots[k].push({ x, z, rot }); this.grid.add({ x0: x - K.box, x1: x + K.box, z0: z - K.box, z1: z + K.box, y0: 0, y1: 2, type: 'pole' }); } }
    }
    const m = new THREE.Matrix4();
    for (const k in kinds) { const list = spots[k]; if (!list.length) continue; const mesh = new THREE.InstancedMesh(kinds[k].geo, this.mats.prop, list.length); mesh.castShadow = kinds[k].shadow !== false; mesh.receiveShadow = true; // small clutter (bins, hydrants, mailboxes, planters) stays out of the shadow pass
      list.forEach((p, i) => { m.compose(new THREE.Vector3(p.x, 0.15, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, 0)), new THREE.Vector3(1, 1, 1)); mesh.setMatrixAt(i, m); }); this.scene.add(mesh); }
  }
  buildBeachExtras() {
    const col = h => new THREE.Color(h); const m = new THREE.Matrix4(); const rng = mulberry(4242);
    const umb = c => mergeGeometries([xform(new THREE.CylinderGeometry(0.04, 0.05, 2.3, 6), M4(0, 1.15, 0), col(0xf0f0f0)), xform(new THREE.ConeGeometry(1.5, 0.55, 10, 1, true), M4(0, 2.35, 0), col(c))]);
    const towel = c => xform(new THREE.BoxGeometry(1.0, 0.03, 1.9), M4(0, 0.03, 0), col(c));
    const sets = [[umb(0xff4fa3), 'u1'], [umb(0xffd34e), 'u2'], [umb(0x3ce8f5), 'u3'], [towel(0xff9ad5), 't1'], [towel(0x9ad0ff), 't2'], [towel(0xfff1c8), 't3']];
    const spots = sets.map(() => []);
    for (let z = CITY.minZ + 20; z < CITY.maxZ - 20; z += 9) { if (Math.abs(z) < 22 || Math.abs(z + 200) < 14) continue; if (rng() < 0.55) { const x = CITY.beachX + 14 + rng() * 22; const u = Math.floor(rng() * 3); spots[u].push({ x, z, rot: rng() * 6.28 }); const t = 3 + Math.floor(rng() * 3); spots[t].push({ x: x + 1.2, z: z + 1.4, rot: rng() * 0.6 }); if (rng() < 0.5) spots[3 + Math.floor(rng() * 3)].push({ x: x - 1.4, z: z + 0.8, rot: rng() * 0.6 }); } }
    sets.forEach(([geo], i) => { const list = spots[i]; if (!list.length) return; const mesh = new THREE.InstancedMesh(geo, this.mats.leaf, list.length); mesh.castShadow = true; list.forEach((p, k) => { m.compose(new THREE.Vector3(p.x, 0.02, p.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rot, 0)), new THREE.Vector3(1, 1, 1)); mesh.setMatrixAt(k, m); if (i < 3) this.grid.add({ x0: p.x - 0.1, x1: p.x + 0.1, z0: p.z - 0.1, z1: p.z + 0.1, y0: 0, y1: 2, type: 'pole' }); }); this.scene.add(mesh); });
    // boats
    const boatMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 });
    for (const [x, z, c] of [[CITY.oceanX + 60, 60, 0xf4f4f4], [CITY.oceanX + 110, -90, 0x2b4fa8], [CITY.oceanX + 85, 250, 0xff4fa3], [CITY.oceanX + 140, 160, 0xf4f4f4]]) {
      const geo = mergeGeometries([xform(new THREE.BoxGeometry(7, 1.2, 2.6), M4(0, 0.4, 0), col(c)), xform(new THREE.BoxGeometry(2.6, 1.1, 2.0), M4(-0.5, 1.5, 0), col(0xf4f4f4)), xform(new THREE.BoxGeometry(2.4, 0.6, 1.8), M4(-0.5, 2.3, 0), col(0x0f1c2c)), xform(new THREE.BoxGeometry(0.1, 4, 0.1), M4(1.5, 3, 0), col(0x8a8f99))]);
      const b = new THREE.Mesh(geo, boatMat); b.position.set(x, -0.1, z); b.rotation.y = Math.random() * 6.28; b.castShadow = true; this.scene.add(b); this.boats = this.boats || []; this.boats.push(b);
    }
  }
  // ---------------- traffic lights ----------------
  buildTrafficLights() {
    const heads = []; this.lightNodes = [];
    const poleGeo = mergeGeometries([
      xform(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 6), M4(0, 2.6, 0), new THREE.Color(0x35383f)),
      xform(new THREE.BoxGeometry(0.34, 1.0, 0.3), M4(0, 4.7, 0), new THREE.Color(0x1d1f24)),
    ]);
    for (const n of this.nodes) {
      if (n.i === 0 || n.i === gridX || n.j === 0 || n.j === gridZ) continue;
      const rec = { node: n, offset: Math.random() * 20, heads: [], ns: null, ew: null }; this.lightNodes.push(rec); n.light = rec; // ns / ew: last applied light state per axis
      for (const o of n.out) { // a head facing traffic arriving FROM o.to
        const fx = Math.sign(o.to.x - n.x), fz = Math.sign(o.to.z - n.z); // direction toward the neighbour; incoming traffic travels -f
        const rx = fz, rz = -fx; // right side of incoming traffic (which travels along -f): right = (-(-fz), (-fx)) = (fz, -fx)
        const x = n.x + fx * (HALF + 0.9) + rx * (HALF + 0.9), z = n.z + fz * (HALF + 0.9) + rz * (HALF + 0.9);
        const rot = Math.atan2(fx, fz); // face toward incoming cars (looking along +f from the stop line means facing them)
        heads.push({ x, z, rot, axis: o.seg.horizontal ? 'ew' : 'ns', rec });
        this.grid.add({ x0: x - 0.15, x1: x + 0.15, z0: z - 0.15, z1: z + 0.15, y0: 0, y1: 5, type: 'pole' });
      }
    }
    const poles = new THREE.InstancedMesh(poleGeo, this.mats.prop, heads.length);
    this.lightLamps = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.22, 0.22), new THREE.MeshBasicMaterial({ color: 0xffffff }), heads.length * 3);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    heads.forEach((h, i) => {
      q.setFromEuler(new THREE.Euler(0, h.rot, 0)); m.compose(new THREE.Vector3(h.x, 0, h.z), q, one); poles.setMatrixAt(i, m);
      for (let k = 0; k < 3; k++) { const ly = 5.02 - k * 0.3, off = new THREE.Vector3(0, ly, 0.16).applyQuaternion(q); m.compose(new THREE.Vector3(h.x + off.x, ly, h.z + off.z), q, one); this.lightLamps.setMatrixAt(i * 3 + k, m); this.lightLamps.setColorAt(i * 3 + k, new THREE.Color(0x222222)); }
      h.rec.heads.push({ base: i * 3, axis: h.axis });
    });
    this.scene.add(poles); this.scene.add(this.lightLamps); this.lightLamps.instanceColor.needsUpdate = true;
  }
  // phase: 0-8 NS green, 8-10 NS yellow, 10-18 EW green, 18-20 EW yellow
  lightState(node, axis, t) {
    if (!node.light) return 'g'; const p = (t + node.light.offset) % 20;
    if (axis === 'ns') return p < 8 ? 'g' : p < 10 ? 'y' : 'r'; return p < 10 ? 'r' : p < 18 ? 'g' : 'y';
  }
  updateTrafficLights(t) {
    let dirty = false;
    for (const rec of this.lightNodes) {
      const ns = this.lightState(rec.node, 'ns', t), ew = this.lightState(rec.node, 'ew', t); // 'g' | 'y' | 'r'
      if (ns === rec.ns && ew === rec.ew) continue; rec.ns = ns; rec.ew = ew; dirty = true;
      for (const h of rec.heads) { const st = h.axis === 'ns' ? ns : ew;
        this.lightLamps.setColorAt(h.base, TL_RED[st === 'r' ? 0 : 1]); this.lightLamps.setColorAt(h.base + 1, TL_YEL[st === 'y' ? 0 : 1]); this.lightLamps.setColorAt(h.base + 2, TL_GRN[st === 'g' ? 0 : 1]); }
    }
    if (dirty) this.lightLamps.instanceColor.needsUpdate = true;
  }

  // ---------------- night light pools ----------------
  // Street surfaces get warm pools without a single PointLight: one additive mesh of soft ground quads (lamps, shop windows, neon signs)
  // and, on med/high, one instanced mesh of faint volumetric lamp cones. That is 2 draw calls at night, both hidden by day (setNight).
  buildLightPools() {
    const b = new GeoBuilder(), shop = C_SHOP.clone().multiplyScalar(0.55), tint = new THREE.Color(); // lamp pools are neutral grey here: the colour comes from the lamp's state texel (lamps.js)
    // a flat quad between (x0,z0) and (x1,z1) at height y facing up; uv(x, z) gives the texture coordinate of a corner (same winding as GeoBuilder.plane)
    const ground = (x0, z0, x1, z1, y, col, uv) => b.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], [uv(x0, z1), uv(x1, z1), uv(x1, z0), uv(x0, z0)], col);
    // a pool under every working lamp head (edge L.pool m, 14 m for a street light), cut at the kerb into a road part (y 0.03) and a pavement part; uv from world xz so the gradient is continuous across the cut.
    // Park posts, bollards, pier lanterns and masts on the sand are single quads on the ground. lampOf remembers which vertices belong to which lamp (attribute aLamp).
    const lampOf = [];
    for (const L of this.lamps.list) {
      if (!L.pool || L.broken) continue; const S = L.pool, R = S / 2, qx0 = L.x - R, qz0 = L.z - R, uv = (x, z) => [(x - qx0) / S, (z - qz0) / S], v0 = b.count; tint.setScalar(L.k);
      if (L.road && L.curb !== undefined) {
        const lo = L.horizontal ? qz0 : qx0, hi = lo + S, cuts = L.curb > lo + 0.01 && L.curb < hi - 0.01 ? [lo, L.curb, hi] : [lo, hi];
        for (let k = 0; k + 1 < cuts.length; k++) {
          const a = cuts[k], c = cuts[k + 1], m = (a + c) / 2, onRoad = Math.abs(m - L.rc) < HALF, y = onRoad ? 0.03 : (L.horizontal ? this.groundY(L.x, m) : this.groundY(m, L.z)) + 0.015;
          if (L.horizontal) ground(qx0, a, qx0 + S, c, y, tint, uv); else ground(a, qz0, c, qz0 + S, y, tint, uv);
        }
      } else ground(qx0, qz0, qx0 + S, qz0 + S, this.groundY(L.x, L.z) + 0.015, tint, uv);
      lampOf.push([v0, b.count - v0, L.idx]);
    }
    // Glow strip along a wall: face = coordinate of the wall plane, dir = outward, depth = how far it reaches. The wall edge sits on the texture's centre
    // line (v = 0.5) and the outer edge on v = 1, so the glow is brightest at the wall. Along the wall u runs from u0 to u1.
    const spill = (alongX, a0, a1, face, dir, depth, u0, u1, y, col) => {
      const o0 = Math.min(face, face + dir * depth), o1 = Math.max(face, face + dir * depth);
      const uv = (x, z) => { const along = alongX ? x : z, out = alongX ? z : x; return [u0 + (along - a0) / (a1 - a0) * (u1 - u0), 0.5 + 0.5 * dir * (out - face) / depth]; };
      if (alongX) ground(a0, o0, a1, o1, y, col, uv); else ground(o0, a0, o1, a1, y, col, uv);
    };
    // Shop front: rounded caps at both ends and a constant middle (u fixed on the centre column), so a long shop gets one even band of light
    const shopStrip = (alongX, a0, a1, face, dir, depth, y, col) => {
      const cap = Math.min(depth, (a1 - a0) / 2), ue = 0.5 * cap / depth;
      spill(alongX, a0, a0 + cap, face, dir, depth, 0.5 - ue, 0.5, y, col);
      if (a1 - a0 - 2 * cap > 0.01) spill(alongX, a0 + cap, a1 - cap, face, dir, depth, 0.5, 0.5, y, col);
      spill(alongX, a1 - cap, a1, face, dir, depth, 0.5, 0.5 + ue, y, col);
    };
    for (const sp of this.storeSpill) { // (width - 0.6) x 3.2 m outward, #ffd9a0 x 0.55
      const mid = (sp.a0 + sp.a1) / 2, out = sp.face + sp.dir * 1.6;
      shopStrip(sp.alongX, sp.a0, sp.a1, sp.face, sp.dir, 3.2, (sp.alongX ? this.groundY(mid, out) : this.groundY(out, mid)) + 0.012, shop);
    }
    for (const sg of this.signSpill) { // 6 x 3 m on the pavement below the sign, in the sign colour x 0.4
      tint.set(sg.color).multiplyScalar(0.4); const out = sg.face + sg.dir * 1.5;
      spill(sg.alongX, sg.a - 3, sg.a + 3, sg.face, sg.dir, 3, 0, 1, (sg.alongX ? this.groundY(sg.a, out) : this.groundY(out, sg.a)) + 0.012, tint);
    }
    // fog: false because three's fog would blend the glow towards the (bright, at dusk) fog colour; the far fade is done in the shader instead
    this.poolMat = new THREE.MeshBasicMaterial({ map: lightPoolTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, opacity: 0.8, fog: false });
    this.poolFog = { fogNear: { value: 100 }, fogFar: { value: 800 } }; this.poolU = { uState: { value: this.lamps.stateTex }, uShop: { value: 0 } }; // uShop: night level of the shop and sign pools (lamp pools follow their own lamp)
    // The real lamp PointLights already light the ground right at the player, so the pools fade in between 6 and 22 m from the camera
    // (smoothstep(6, 22, vFogDepth); the old 14 to 36 m range hid the road under a lamp 12 m away) and fade out again with the scene fog.
    this.poolMat.onBeforeCompile = shader => {
      shader.uniforms.fogNear = this.poolFog.fogNear; shader.uniforms.fogFar = this.poolFog.fogFar; shader.uniforms.uState = this.poolU.uState; shader.uniforms.uShop = this.poolU.uShop;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', () => '#include <common>\nvarying float vFogDepth; attribute float aLamp; uniform sampler2D uState; uniform float uShop; varying vec3 vPC;').replace('#include <project_vertex>', () => '#include <project_vertex>\n  vFogDepth = -mvPosition.z; vPC = aLamp < -0.5 ? vec3(uShop) : texelFetch(uState, ivec2(int(aLamp) & 1023, int(aLamp) >> 10), 0).rgb;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', () => '#include <common>\nvarying float vFogDepth; uniform float fogNear, fogFar; varying vec3 vPC;').replace('#include <color_fragment>', () => '#include <color_fragment>\n  diffuseColor.rgb *= vPC;')
        .replace('#include <opaque_fragment>', () => 'diffuseColor.a *= smoothstep(6.0, 22.0, vFogDepth) * (1.0 - smoothstep(fogNear, fogFar, vFogDepth));\n#include <opaque_fragment>');
    };
    this.poolMat.customProgramCacheKey = () => 'pool';
    const pg = b.build(), al = new Float32Array(pg.attributes.position.count).fill(-1); for (const [v0, n, idx] of lampOf) al.fill(idx, v0, v0 + n); pg.setAttribute('aLamp', new THREE.Float32BufferAttribute(al, 1));
    this.poolMesh = new THREE.Mesh(pg, this.poolMat); this.poolMesh.visible = false; this.scene.add(this.poolMesh);
    if (this.quality !== 'low') this.buildLampCones();
  }
  // Volumetric cones under the lamp heads (med/high only): one instanced open cone, alpha fades from the lamp (vUv.y = 1) to the ground and
  // towards the silhouette. Built lazily so a switch from low to med/high at run time (World.setQuality) can still create it.
  buildLampCones() {
    if (this.coneMesh || !this.lamps) return; const L = this.lamps.lampList; if (!L.length) return;
    this.coneMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { uState: { value: this.lamps.stateTex }, uOpacity: { value: 0 }, fogNear: { value: 100 }, fogFar: { value: 800 } },
      vertexShader: `attribute float iIdx; uniform sampler2D uState; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vD; varying vec3 vC;
        void main(){ vUv = uv; vC = texelFetch(uState, ivec2(int(iIdx) & 1023, int(iIdx) >> 10), 0).rgb; vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * mat3(instanceMatrix) * normal); vV = normalize(-mv.xyz); vD = -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform float uOpacity, fogNear, fogFar; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vD; varying vec3 vC;
        void main(){ float a = pow(vUv.y, 1.5) * pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
          a *= (1.0 - smoothstep(fogNear, fogFar, vD)) * smoothstep(2.5, 9.0, vD); // fog fade as in fx.js ParticlePool; no glare when the camera is inside a cone
          gl_FragColor = vec4(vC, a * uOpacity); }` });
    const cg = new THREE.CylinderGeometry(0.3, 3.0, 6.6, 16, 1, true); cg.setAttribute('iIdx', new THREE.InstancedBufferAttribute(new Float32Array(L.map(e => e.idx)), 1));
    this.coneMesh = new THREE.InstancedMesh(cg, this.coneMat, L.length); const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), KX = { led: 1, sodium: 1, classic: 0.62, mast: 1.7 };
    L.forEach((e, i) => { const h = e.hy - 0.15, k = KX[e.fam] || 1; m.compose(ps.set(e.x, 0.15 + h / 2, e.z), q, sc.set(k, h / 6.6, k)); this.coneMesh.setMatrixAt(i, m); }); // spans y 0.15 .. the lamp head
    this.coneMesh.computeBoundingSphere(); this.coneMesh.visible = false; this.scene.add(this.coneMesh);
  }
  // Quality tier change at run time. The caller should flag the materials for recompilation afterwards (Game.setQuality already does).
  setQuality(q) { this.quality = q; if (q !== 'low') this.buildLampCones(); this.lamps?.setQuality(q); this.flora?.setQuality(q); this.shops.setQuality(q); this.bld.setQuality(q); }

  // ---------------- beach, pier, ocean ----------------
  buildBeach() {
    const g = new GeoBuilder(); g.plane(CITY.beachX - 1, CITY.minZ - 300, CITY.oceanX + 8, CITY.maxZ + 300, 0.02, 8);
    const sand = new THREE.Mesh(g.build(), this.mats.sand); sand.receiveShadow = true; this.scene.add(sand);
    // kerb between the coast road and the sand: a 14 cm pavement-coloured edge (the sand plane starts at beachX - 1), so the beach ends in a line, not a flat cut
    const kb = new GeoBuilder(); kb.box(CITY.beachX - 1.5, 0, CITY.minZ, CITY.beachX - 1.0, 0.2, CITY.maxZ, { uvU: 4, uvV: 4 });
    const kerb = new THREE.Mesh(kb.build(), this.mats.sidewalk); kerb.receiveShadow = true; this.scene.add(kerb);
    // ocean shader
    this.oceanMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, skyColor: { value: new THREE.Color(0x7fc4e8) }, deep: { value: new THREE.Color(0x0b3d63) }, shallow: { value: new THREE.Color(0x2fa8c9) }, night: { value: 0 }, fogColor: { value: new THREE.Color(0x000000) }, fogNear: { value: 100 }, fogFar: { value: 800 } },
      vertexShader: `uniform float time; varying vec3 vPos; varying vec3 vNorm; varying float vFog;
        void main(){ vec3 p=position; float w=sin(p.x*0.08+time*1.3)*0.25+sin(p.z*0.11-time*0.9)*0.2+sin((p.x+p.z)*0.05+time*0.6)*0.3; p.y+=w;
        float dx=cos(p.x*0.08+time*1.3)*0.02+cos((p.x+p.z)*0.05+time*0.6)*0.015; float dz=-cos(p.z*0.11-time*0.9)*0.022+cos((p.x+p.z)*0.05+time*0.6)*0.015;
        vNorm=normalize(vec3(-dx,1.0,-dz)); vPos=p; vec4 mv=modelViewMatrix*vec4(p,1.0); vFog=-mv.z; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 sunDir,skyColor,deep,shallow,fogColor; uniform float night,fogNear,fogFar,time; varying vec3 vPos; varying vec3 vNorm; varying float vFog;
        void main(){ vec3 V=normalize(cameraPosition-vPos); float fres=pow(1.0-max(dot(V,vNorm),0.0),3.0); float shore=smoothstep(0.0,60.0,vPos.x-${CITY.oceanX.toFixed(1)});
        vec3 col=mix(shallow,deep,shore); col=mix(col,skyColor,fres*0.7); vec3 H=normalize(V+sunDir); float spec=pow(max(dot(H,vNorm),0.0),180.0)*(1.0-night)*1.6; col+=vec3(spec);
        float foam=smoothstep(0.85,1.0,sin(vPos.x*0.5-time*1.5+sin(vPos.z*0.2)*2.0))*(1.0-shore)*0.35; col+=vec3(foam); col*=mix(1.0,0.28,night);
        float f=smoothstep(fogNear,fogFar,vFog); col=mix(col,fogColor,f); gl_FragColor=vec4(col,1.0); }`,
    });
    const geo = new THREE.PlaneGeometry(1200, 1800, 120, 120); geo.rotateX(-Math.PI / 2);
    const ocean = new THREE.Mesh(geo, this.oceanMat); ocean.position.set(CITY.oceanX + 600, -0.35, 0); this.scene.add(ocean); this.ocean = ocean;
    // pier
    const pz = -200, px0 = CITY.oceanX - 10, px1 = CITY.oceanX + 90; const pb = new GeoBuilder(); pb.box(px0, 0.6, pz - 4.5, px1, 1.0, pz + 4.5, { uvU: 3, uvV: 3 });
    for (let x = px0 + 4; x < px1; x += 8) for (const zz of [pz - 3.6, pz + 3.6]) pb.box(x - 0.25, -1, zz - 0.25, x + 0.25, 0.7, zz + 0.25, { uvU: 1, uvV: 1 });
    for (let x = px0; x < px1; x += 2.5) for (const zz of [pz - 4.5, pz + 4.5]) pb.box(x, 1.0, zz - 0.08, x + 0.12, 2.0, zz + 0.08, { uvU: 1, uvV: 1 });
    const pier = new THREE.Mesh(pb.build(), this.mats.plank); pier.castShadow = true; pier.receiveShadow = true; this.scene.add(pier);
    const hut = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 5), new THREE.MeshStandardMaterial({ color: 0xd94f4f, roughness: 0.8 })); hut.position.set(px1 - 5, 2.6, pz); hut.castShadow = true; this.scene.add(hut);
    this.grid.add({ x0: px1 - 8, x1: px1 - 2, z0: pz - 2.5, z1: pz + 2.5, y0: 0, y1: 5, type: 'building' });
    this.grid.add({ x0: px0, x1: px1, z0: pz - 4.7, z1: pz - 4.4, y0: 0, y1: 3, type: 'pole' }); this.grid.add({ x0: px0, x1: px1, z0: pz + 4.4, z1: pz + 4.7, y0: 0, y1: 3, type: 'pole' });
    // pier ramp so cars can drive on
    // The top face climbs from the sand at x0-6 to the deck height 1.0 at x0 (slope 1:6); groundY follows the same line.
    const rampAng = Math.atan(1 / 6); const ramp = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(6, 1), 1, 9), this.mats.plank);
    ramp.position.set(px0 - 3, 0.5 - 0.5 / Math.cos(rampAng), pz); ramp.rotation.z = rampAng; ramp.receiveShadow = true; this.scene.add(ramp);
    this.pier = { x0: px0, x1: px1, z: pz, y: 1.0 };
    this.pois.docks = { id: 'docks', x: px1 - 14, z: pz, color: '#ffd34e', label: 'docks', noMarker: true, y: 1.0 };
    this.pois.fixer = { id: 'fixer', x: px1 - 10, z: pz + 3.2, color: '#e0e0e0', label: 'fixer', type: 'giver', mission: 'fixer', y: 1.0 };
    // beach club at z=0
    const cb = new GeoBuilder(); const cx0 = CITY.beachX + 6, cx1 = CITY.beachX + 30, cz0 = -14, cz1 = 14;
    const fb = new GeoBuilder(); fb.box(cx0, 0, cz0, cx1, 7, cz1, { uvU: 8, uvV: 14, top: false, color: new THREE.Color(0.43, 2 / 60, 2 / 8) }); cb.box(cx0, 6.99, cz0, cx1, 7.3, cz1, { uvU: 4, uvV: 4 });
    const style = FACADES[2], tex = facadeTextures(style), corm = facadeORM(style); const mat = new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, normalMap: facadeNormal(style), normalScale: new THREE.Vector2(0.85, 0.85), roughnessMap: corm, metalnessMap: corm, roughness: 1, metalness: 1 }); mat.userData.glow = tex.glow; this.facadeMats.push(mat); patchWindowShader(mat, this.winU, this.isLowTier);
    const club = new THREE.Mesh(this.seedAttribute(fb.build()), mat); club.castShadow = true; club.receiveShadow = true; this.scene.add(club); this.scene.add(new THREE.Mesh(cb.build(), this.mats.roof));
    this.grid.add({ x0: cx0, x1: cx1, z0: cz0, z1: cz1, y0: 0, y1: 7, type: 'building' });
    const sg0 = this.signs.length; this.addSignX(cx0, cz0, cz1, 'BEACH CLUB', '#ff4fa3', 'west', 7); this.bld.club(cx0, cz0, cx1, cz1, 7, style, this.signs.slice(sg0));
    this.pois.club = { id: 'club', x: cx0 - 4, z: 0, color: '#ffd34e', label: 'beachClub', mission: 'lior' };
    // lifeguard towers
    for (const z of [-120, 90, 220]) { const t = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 3), new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })); t.position.set(CITY.oceanX - 12, 3.8, z); t.castShadow = true; this.scene.add(t); for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), this.mats.dark); l.position.set(CITY.oceanX - 12 + dx, 1.3, z + dz); this.scene.add(l); } this.grid.add({ x0: CITY.oceanX - 13.5, x1: CITY.oceanX - 10.5, z0: z - 1.5, z1: z + 1.5, y0: 0, y1: 5, type: 'building' }); }
  }
  buildOutskirts() {
    const hr = mulberry(6006); const hillMat = new THREE.MeshStandardMaterial({ color: 0x3c5a3a, roughness: 1 }); const geo = new THREE.SphereGeometry(1, 16, 12);
    const spots = []; for (let i = 0; i < 14; i++) spots.push({ x: CITY.minX - 260 - hr() * 300, z: CITY.minZ - 200 + hr() * (CITY.maxZ - CITY.minZ + 400) });
    for (let i = 0; i < 8; i++) { spots.push({ x: CITY.minX + hr() * (CITY.maxX - CITY.minX), z: CITY.minZ - 260 - hr() * 250 }); spots.push({ x: CITY.minX + hr() * (CITY.maxX - CITY.minX), z: CITY.maxZ + 260 + hr() * 250 }); }
    const hills = new THREE.InstancedMesh(geo, hillMat, spots.length); const m = new THREE.Matrix4();
    spots.forEach((s, i) => { const r = 120 + hr() * 200, h = 40 + hr() * 90; m.compose(new THREE.Vector3(s.x, -h * 0.5, s.z), new THREE.Quaternion(), new THREE.Vector3(r, h, r * (0.6 + hr() * 0.6))); hills.setMatrixAt(i, m); });
    this.scene.add(hills);
  }

  // ---------------- minimap image ----------------
  buildMapImage() {
    const pad = 40; this.mapX0 = CITY.minX - pad; this.mapZ0 = CITY.minZ - pad; this.mapScale = 1.25; // px per metre
    const W = Math.ceil((CITY.oceanX + 120 - this.mapX0) * this.mapScale), H = Math.ceil((CITY.maxZ + pad - this.mapZ0) * this.mapScale);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'); const S = this.mapScale, X = x => (x - this.mapX0) * S, Z = z => (z - this.mapZ0) * S;
    // dark neon palette: reads well under the HUD glow and keeps the player blip and POI markers on top
    ctx.fillStyle = '#0e1428'; ctx.fillRect(0, 0, W, H); // ground
    ctx.fillStyle = '#3d3626'; ctx.fillRect(X(CITY.beachX), 0, W, H); ctx.fillStyle = '#0c3560'; ctx.fillRect(X(CITY.oceanX), 0, W, H); // beach, ocean
    ctx.fillStyle = '#6a74a3'; ctx.fillRect(X(CITY.minX), Z(CITY.minZ), (CITY.maxX - CITY.minX) * S, (CITY.maxZ - CITY.minZ) * S); // roads (blocks are laid over them)
    for (let bj = 0; bj < gridZ; bj++) for (let bi = 0; bi < gridX; bi++) { const x0 = CITY.roadX(bi) + HALF, z0 = CITY.roadZ(bj) + HALF; const park = PARKS.some(p => p[0] === bi && p[1] === bj); ctx.fillStyle = park ? '#1d4a36' : '#161c36'; ctx.fillRect(X(x0), Z(z0), CITY.block * S, CITY.block * S); }
    ctx.fillStyle = '#222a4a'; for (const b of this.buildings) ctx.fillRect(X(b.x0), Z(b.z0), (b.x1 - b.x0) * S, (b.z1 - b.z0) * S);
    ctx.fillStyle = '#6a5236'; ctx.fillRect(X(this.pier.x0), Z(this.pier.z - 4.5), (this.pier.x1 - this.pier.x0) * S, 9 * S);
    ctx.fillStyle = '#222a4a'; ctx.fillRect(X(CITY.beachX + 6), Z(-14), 24 * S, 28 * S); // beach club
    // 1 px centre line along every road segment, snapped to pixel centres so it stays crisp
    const snap = v => Math.round(v) + 0.5; ctx.strokeStyle = '#8f99c9'; ctx.lineWidth = 1; ctx.beginPath();
    for (const seg of this.segments) { ctx.moveTo(snap(X(seg.a.x)), snap(Z(seg.a.z))); ctx.lineTo(snap(X(seg.b.x)), snap(Z(seg.b.z))); }
    ctx.stroke();
    this.mapCanvas = c;
  }
  mapPx(x, z) { return [(x - this.mapX0) * this.mapScale, (z - this.mapZ0) * this.mapScale]; }

  // ---------------- per-frame ----------------
  // hours: time of day 0..24 (integration passes clock / 60); it sets the fraction of lit windows. Without it the evening value is used.
  setNight(f, sunDir, skyColor, fogColor, fogNear, fogFar, sunColor, rain = 0, hours) {
    this.winU.litFrac.value = typeof hours === 'number' && hours >= 0 ? litFractionAt(hours % 24) : 0.62;
    for (const m of this.facadeMats) m.emissiveIntensity = f * 1.1; // per-window brightness and colour come from the window shader
    for (const m of this.storeMats) m.emissiveIntensity = f * 1.05;
    // Wet streets: the shader (patchWetShader) does the wetting - roughness, puddles, ripples - from the one `wet` uniform. Here only the albedo darkens and the bumps flatten.
    this.mats.asphalt.normalScale.setScalar(0.7 - rain * 0.45); this.mats.asphalt.color.setScalar(1 - rain * 0.45); this.mats.asphalt.roughness = 0.92 - 0.2 * f; // dry tarmac takes a faint sheen after dark, so the lamp light shows on the road; by day it stays matte this.mats.sidewalk.color.setScalar(1 - rain * 0.3); this.wetU.wet.value = rain;
    this.signU.level.value = 0.42 + (3.0 - 0.42) * f; // every neon sign at once: dim by day, blooming at night
    if (this.billMat) this.billMat.color.setScalar(1 + 0.4 * f); // billboards glow a little after dark
    const lamps = f >= 0.05; // street-light pools and cones only exist at night
    if (this.poolMesh) { this.poolMesh.visible = lamps; this.poolU.uShop.value = f; this.poolFog.fogNear.value = fogNear; this.poolFog.fogFar.value = fogFar; }
    this.lamps?.setNight(f, rain, fogNear, fogFar); this.flora?.setEnv(f, sunDir, sunColor, rain); this.shops.setNight(f, rain); this.bld.setNight(f, sunDir, skyColor, fogColor, fogNear, fogFar, sunColor, rain);
    if (this.coneMesh) { this.coneMesh.visible = lamps && this.quality !== 'low'; const u = this.coneMat.uniforms; u.uOpacity.value = f * (0.04 + 0.1 * rain); u.fogNear.value = fogNear; u.fogFar.value = fogFar; }
    this.oceanMat.uniforms.night.value = f; this.oceanMat.uniforms.sunDir.value.copy(sunDir); this.oceanMat.uniforms.skyColor.value.copy(skyColor); this.oceanMat.uniforms.fogColor.value.copy(fogColor); this.oceanMat.uniforms.fogNear.value = fogNear; this.oceanMat.uniforms.fogFar.value = fogFar;
  }
  update(dt, t) { this.oceanMat.uniforms.time.value = t; this.winU.time.value = this.signU.time.value = this.wetU.time.value = t % 600; /* window TV flicker, sign flicker, rain ripples */ this.updateTrafficLights(t); this.flora?.update(dt, t); this.lamps?.update(dt, t); this.shops?.update(dt, t); this.bld.update(dt, t); if (this.boats) for (const b of this.boats) { b.position.y = -0.1 + Math.sin(t * 0.9 + b.position.x) * 0.15; b.rotation.z = Math.sin(t * 0.7 + b.position.z) * 0.04; } }
}
