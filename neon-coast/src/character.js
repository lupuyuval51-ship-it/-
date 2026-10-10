import * as THREE from '../vendor/three.module.min.js';
import { clamp, damp, wrapAngle } from './utils.js';

// ---------------------------------------------------------------------------------------------------------------------
// People are ONE THREE.SkinnedMesh on a shared vertex-coloured material (18 bones), so a person costs 1 draw call, +1 for
// the shadow pass, +2 more when armed. Everything is procedural: unit shapes (cached) are placed, tinted and bound to a
// bone by emit(), and mergeSkinned() welds the pieces into a single indexed geometry.
// ---------------------------------------------------------------------------------------------------------------------
const charMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.02 });
const gunMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.5 });
const TAU = Math.PI * 2, HALF_PI = Math.PI / 2;
const col = c => (c && c.isColor ? c : new THREE.Color(c));
const mix = (a, b, t) => col(a).clone().lerp(col(b), t);
const shade = (a, k) => col(a).clone().multiplyScalar(k);

export const SKINS = [0xf1c7a8, 0xd9a47e, 0xb97c55, 0x8a5a3c, 0x5c3a25, 0xffd9b8, 0xe8b894];
export const SHIRTS = [0xffffff, 0x1c2540, 0xd1345b, 0x2aa198, 0xf5c542, 0x7b4fbf, 0x2f2f2f, 0xff7f50, 0x8fd18b, 0xe8e0d0, 0xff4fa3, 0x3ce8f5, 0xff9a3c, 0x9ad0ff];
export const PANTS = [0x22304a, 0x1a1a1a, 0x7a6a55, 0x3a3f4a, 0x50607a, 0xc9c1b1, 0x5a3a2a, 0x2f3b6a];
export const HAIRS = [0x1a120e, 0x3b2716, 0x6b4a2b, 0xd9b27a, 0x2b2b2b, 0xa33a2a, 0xffffff, 0xff4fa3, 0x3ce8f5];
const EYES = [0x3b78c4, 0x3f9a5c];
const pick = a => a[Math.floor(Math.random() * a.length)];

// Level of detail of newly built people. game.js calls setCharacterQuality(settings.quality); until it does, the saved
// setting is read once so the first people already match the player's choice.
let QUALITY = 'high';
try { const s = JSON.parse(localStorage.getItem('neoncoast.settings') || '{}'); if (s.quality === 'low' || s.quality === 'med' || s.quality === 'high') QUALITY = s.quality; } catch (e) { /* no storage: stay on high */ }
export function setCharacterQuality(q) { if (q === 'low' || q === 'med' || q === 'high') QUALITY = q; }

// ---------- wardrobe ----------
// Garment enums a look may set (all optional; looks written before them keep working, see garments()):
//   top     tee | longsleeve | tank | hoodie | shirt | jacket | blazer | dress | bare (bare torso, swimwear)
//   bottom  jeans | chinos | shorts | skirt | sweatpants | trunks            shoeType  sneakers | boots | dress | sandals
//   cap (+ capBack) | beanie | headphones | glasses | sunglasses | backpack | chain | watch | hoodUp | bandana | tie | vestStripe | sleeves ('short' | 'long')
//   build   slim | average | heavy (body width 0.86 / 1 / 1.2, the heavy build gets a belly)        elder (stoops, grey hair)
const BUILD_W = { slim: 0.86, average: 1, heavy: 1.2 };
const TOPS = ['tee', 'longsleeve', 'tank', 'hoodie', 'shirt', 'jacket', 'blazer', 'dress', 'bare'];
const BOTTOMS = ['jeans', 'chinos', 'shorts', 'skirt', 'sweatpants', 'trunks'];
const SHOE_TYPES = ['sneakers', 'boots', 'dress', 'sandals'];
// 14 curated palettes: [main top, second layer / contrast top, accent (cap, bag, shoes, tie), spare]
const PALETTES = [
  [0xf5f0e6, 0x1c2540, 0xd1345b, 0x2f2f2f], [0xff7f50, 0x2b2f3a, 0xf5c542, 0xffffff], [0x2aa198, 0xe8e0d0, 0x1c2540, 0xff9a3c], [0x7b4fbf, 0x2f2f2f, 0xf5f0e6, 0xff4fa3],
  [0x8fd18b, 0x3d5a80, 0xffffff, 0x1a1a1a], [0xff4fa3, 0x14161c, 0x3ce8f5, 0xffffff], [0x1c2540, 0xd9d4c7, 0xa33a2a, 0xf5c542], [0xf5c542, 0x2b2b2b, 0xffffff, 0x2aa198],
  [0x3ce8f5, 0x1c2540, 0xff9a3c, 0xffffff], [0xd1345b, 0xf2efe6, 0x2f2f2f, 0x8fd18b], [0x9ad0ff, 0x3d5a80, 0xe8e0d0, 0xff7f50], [0x2f2f2f, 0x7a7a82, 0xff4fa3, 0x3ce8f5],
  [0xe8e0d0, 0x5a3a2a, 0x2aa198, 0xf5c542], [0xff9a3c, 0x1c2540, 0xf2efe6, 0x7b4fbf],
];
const DENIM = [0x2b3a5c, 0x3d5a80], KHAKI = 0xb8a67e, GREY_PANTS = 0x5a5f6a, BLACK_PANTS = 0x1a1a1a, ELDER_HAIR = [0xe8e8e8, 0xffffff, 0xbdbdbd, 0x9a9a9a, 0xcfcfcf];
const wpick = list => { let t = 0; for (const e of list) t += e[1]; let r = Math.random() * t; for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; } return list[0][0]; };
const dark = (c, k) => shade(c, k).getHex();

// A random pedestrian. ctx = { zone ('beach' ...), hour (0..24), rain (bool) } shapes the wardrobe: a beach zone mostly gives tank tops, shorts and sandals (or swim trunks) with sunglasses,
// hours 20-05 add jackets and hoodies and darker colours, rain gives jackets and hoodies with the hood up 30 % of the time. No child models.
export function randomLook(ctx) {
  ctx = ctx || {};
  const hour = Number.isFinite(ctx.hour) ? ctx.hour : 12, night = hour >= 20 || hour < 5, rain = !!ctx.rain, beachZone = ctx.zone === 'beach';
  const female = Math.random() < 0.46, elder = Math.random() < 0.12, build = wpick([['slim', 0.3], ['average', 0.5], ['heavy', 0.2]]);
  const beachOutfit = beachZone && !rain && Math.random() < 0.7, pal = pick(PALETTES), dim = night ? 0.62 : 1, bright = beachOutfit ? 1 : dim;
  const P0 = dark(pal[0], bright), P1 = dark(pal[1], dim), P2 = dark(pal[2], bright), P3 = dark(pal[3], bright);
  // ----- top -----
  let top = female ? wpick([['tee', 0.2], ['longsleeve', 0.1], ['tank', 0.08], ['hoodie', 0.1], ['shirt', 0.1], ['jacket', 0.1], ['dress', 0.32]]) : wpick([['tee', 0.32], ['longsleeve', 0.14], ['tank', 0.05], ['hoodie', 0.15], ['shirt', 0.15], ['jacket', 0.14], ['blazer', 0.05]]);
  if (elder && top === 'tank') top = 'shirt';
  if (night && top !== 'jacket' && top !== 'hoodie' && Math.random() < 0.4) top = Math.random() < 0.5 ? 'jacket' : 'hoodie';
  if (rain) top = Math.random() < 0.5 ? 'jacket' : 'hoodie';
  if (beachOutfit) top = !female && Math.random() < 0.35 ? 'bare' : 'tank';
  // ----- bottom -----
  let bottom = top === 'dress' ? 'skirt' : female ? wpick([['jeans', 0.4], ['chinos', 0.15], ['skirt', 0.18], ['shorts', 0.1], ['sweatpants', 0.1], ['jeans', 0.07]]) : wpick([['jeans', 0.5], ['chinos', 0.2], ['shorts', 0.17], ['sweatpants', 0.13]]);
  if (beachOutfit) bottom = top === 'bare' ? 'trunks' : 'shorts'; else if (rain || night) { if (bottom === 'shorts' || bottom === 'skirt' && top !== 'dress') bottom = 'jeans'; }
  if (top === 'blazer') bottom = 'chinos';
  const neutral = Math.random() < 0.7; let pants;
  if (bottom === 'jeans') pants = neutral ? wpick([[DENIM[0], 0.4], [DENIM[1], 0.3], [BLACK_PANTS, 0.2], [GREY_PANTS, 0.1]]) : P3 === 0xffffff ? DENIM[0] : P3;
  else if (bottom === 'chinos') pants = neutral ? wpick([[KHAKI, 0.5], [GREY_PANTS, 0.2], [0x6b5b3e, 0.15], [0x2b2f3a, 0.15]]) : P1;
  else if (bottom === 'shorts') pants = beachOutfit ? pick([P2, P0, 0x3ce8f5, 0xff7f50, KHAKI]) : neutral ? wpick([[KHAKI, 0.4], [DENIM[0], 0.3], [BLACK_PANTS, 0.3]]) : P2;
  else if (bottom === 'trunks') pants = pick([P2, 0x3ce8f5, 0xff4fa3, 0xf5c542, 0x2aa198]);
  else if (bottom === 'sweatpants') pants = neutral ? wpick([[GREY_PANTS, 0.4], [BLACK_PANTS, 0.35], [0x2b2f3a, 0.25]]) : P1;
  else pants = top === 'dress' ? P1 : neutral ? wpick([[BLACK_PANTS, 0.4], [DENIM[0], 0.3], [KHAKI, 0.3]]) : P2; // skirt
  // ----- the colours of the top -----
  const jacketTop = top === 'jacket' || top === 'blazer', shirt = jacketTop ? (top === 'blazer' ? pick([0xf2efe6, 0xffffff, 0xcfe3f5]) : P0) : (Math.random() < 0.5 ? P0 : P1);
  const jacket = top === 'blazer' ? pick([0x1c2540, 0x2f2f2f, 0x3a3f4a, 0x5a3a2a, 0x7a7a82]) : jacketTop ? (Math.random() < 0.45 ? P1 : pick([0x2f3b6a, 0x3a3f4a, 0x5a3a2a, 0x7a6a55, 0x1c2540, 0x2f2f2f, 0x4a5a3a])) : undefined;
  const topColour = top === 'dress' ? (Math.random() < 0.5 ? P0 : P2) : shirt;
  // ----- people -----
  const hairStyle = elder ? (female ? pick(['bun', 'short', 'short', 'curly']) : pick(['short', 'bald', 'bald', 'buzz', 'short'])) : female ? pick(['long', 'long', 'pony', 'bun', 'short', 'curly', 'afro']) : pick(['short', 'short', 'buzz', 'buzz', 'bald', 'mohawk', 'long', 'curly', 'afro']);
  // ----- headwear and accessories -----
  const warm = !rain && !night, hoodUp = top === 'hoodie' && rain && Math.random() < 0.3;
  const capP = hoodUp ? 0 : beachOutfit ? 0.2 : night ? 0.08 : 0.14, cap = Math.random() < capP, beanie = !cap && !hoodUp && !beachOutfit && Math.random() < (night || rain ? 0.12 : 0.05);
  const headphones = !cap && !beanie && !hoodUp && Math.random() < 0.08, sunglasses = Math.random() < (beachOutfit ? 0.5 : night ? 0.02 : rain ? 0.02 : 0.1), glasses = !sunglasses && Math.random() < (elder ? 0.4 : 0.14);
  // ----- shoes -----
  let shoeType = beachOutfit ? 'sandals' : top === 'blazer' ? 'dress' : wpick([['sneakers', 0.55], ['boots', night || rain ? 0.35 : 0.15], ['dress', top === 'shirt' ? 0.2 : 0.08], ['sandals', warm && (bottom === 'shorts' || bottom === 'skirt') ? 0.2 : 0]]);
  const shoes = shoeType === 'sneakers' ? wpick([[0xffffff, 0.45], [0x1a1a1a, 0.2], [P2, 0.35]]) : shoeType === 'boots' ? pick([0x5a3a2a, 0x1a1a1a, 0x8a6a42]) : shoeType === 'dress' ? pick([0x15110e, 0x15110e, 0x4a2a1a]) : pick([0x5a3a2a, 0x8a6a42]);
  const w = BUILD_W[build] * (0.97 + Math.random() * 0.06), height = (elder ? 0.92 : 0.93) + Math.random() * (elder ? 0.07 : 0.14);
  return { skin: pick(SKINS), shirt: topColour, pants, hair: elder ? pick(ELDER_HAIR) : pick(HAIRS), hairStyle, female, elder, build, top, bottom, shoeType, jacket,
    sleeves: Math.random() < 0.3 ? 'long' : 'short', tie: top === 'blazer' ? pick([0xb0122a, 0x1c2540, 0x2f2f2f, P2]) : undefined,
    cap: cap ? pick([P2, P1, 0x1a1a1a, 0xffffff, 0xd1345b]) : null, capBack: Math.random() < 0.3, beanie: beanie ? pick([P1, P2, 0x2f2f2f]) : null, hoodUp, headphones: headphones ? pick([0x1a1a1a, 0xffffff, P2]) : null,
    glasses, sunglasses, beard: !female && Math.random() < (elder ? 0.15 : 0.28), shorts: bottom === 'shorts', skirt: top === 'dress' ? topColour : bottom === 'skirt' ? pants : null,
    backpack: Math.random() < 0.14 ? pick([P1, P2, 0x2f2f2f, 0x5a3a2a]) : null, chain: !female && Math.random() < 0.06 || female && Math.random() < 0.05, watch: Math.random() < 0.18, shoes,
    eye: Math.random() < 0.15 ? pick(EYES) : 0x1c1612, brow: -0.15 + Math.random() * 0.35, lipstick: female && Math.random() < 0.3, width: w, height };
}
export const LOOKS = {
  player: { skin: 0xd9a47e, shirt: 0xff4fa3, pants: 0x1c2540, hair: 0x1a120e, hairStyle: 'short', shoes: 0xffffff, brow: 0.04 }, // outfits (config.js OUTFITS) add their own jacket
  cop: { skin: 0xd9a47e, shirt: 0x1f3a7a, pants: 0x14213d, hair: 0x2b2b2b, hat: 0x14213d, badge: true, hairStyle: 'short', glasses: true, brow: 0.12, top: 'shirt', shoeType: 'dress', shoes: 0x15110e },
  swat: { skin: 0xb97c55, shirt: 0x1a1d24, pants: 0x1a1d24, hair: 0x111111, hat: 0x0e0f12, armor: 0x2a2e38, vestStripe: 0xffd34e, hairStyle: 'short', brow: 0.18, shoeType: 'boots', shoes: 0x15110e },
  gang: { skin: 0x8a5a3c, shirt: 0x2e8b57, pants: 0x1a1a1a, hair: 0x1a120e, band: 0x2eff7a, hairStyle: 'short', beard: true, brow: 0.15 },
  bodyguard: { skin: 0xf1c7a8, shirt: 0xffffff, pants: 0x101318, jacket: 0x101318, tie: 0x101318, top: 'blazer', shoeType: 'dress', shoes: 0x15110e, hair: 0x2b2b2b, glasses: true, sunglasses: true, hairStyle: 'bald', brow: 0.1 },
  target: { skin: 0xe8b894, shirt: 0xffd34e, pants: 0xf0f0f0, jacket: 0xffd34e, hair: 0xd9b27a, glasses: true, hairStyle: 'short', brow: -0.05 },
};
// A uniform with variations for one person: cops with or without the cap, short or long sleeves, some women; a SWAT officer with or without the helmet; a gang member in a
// green-dominant outfit with a bandana. Looks that are not one of these uniforms come back unchanged.
export function crewLook(base) {
  if (base === LOOKS.cop) {
    const f = Math.random() < 0.25;
    return { ...base, skin: pick(SKINS), hair: pick([0x1a120e, 0x2b2b2b, 0x3b2716, 0x6b4a2b, 0xd9b27a]), hairStyle: f ? pick(['bun', 'pony', 'short']) : pick(['short', 'short', 'buzz', 'bald']), female: f,
      hat: Math.random() < 0.55 ? base.hat : undefined, sleeves: Math.random() < 0.35 ? 'long' : 'short', glasses: Math.random() < 0.15, sunglasses: Math.random() < 0.18, beard: !f && Math.random() < 0.1, build: wpick([['slim', 0.2], ['average', 0.55], ['heavy', 0.25]]),
      width: undefined, height: 0.96 + Math.random() * 0.1, brow: Math.random() * 0.25 };
  }
  if (base === LOOKS.swat) {
    return { ...base, skin: pick(SKINS), hair: pick([0x111111, 0x2b2b2b, 0x3b2716]), hat: Math.random() < 0.75 ? base.hat : undefined, sunglasses: Math.random() < 0.25, beard: Math.random() < 0.2, female: Math.random() < 0.1,
      build: wpick([['average', 0.5], ['heavy', 0.5]]), height: 0.98 + Math.random() * 0.09 };
  }
  if (base === LOOKS.gang) {
    const g = [0x2e8b57, 0x1f6b3f, 0x3cb371, 0x145a32, 0x2eff7a], top = pick(['tank', 'tee', 'tee', 'hoodie', 'longsleeve']);
    return { ...base, skin: pick(SKINS), shirt: Math.random() < 0.8 ? pick(g) : pick([0xf2efe6, 0x1a1a1a]), top, pants: pick([0x1a1a1a, DENIM[0], KHAKI, 0x2f2f2f]), bottom: pick(['jeans', 'jeans', 'chinos', 'sweatpants']), shoeType: pick(['sneakers', 'sneakers', 'boots']),
      shoes: pick([0xffffff, 0x1a1a1a, 0x2e8b57]), hairStyle: pick(['short', 'buzz', 'bald', 'curly', 'afro']), hair: pick([0x1a120e, 0x2b2b2b, 0x3b2716]), band: undefined, bandana: pick([0x2eff7a, 0x2e8b57, 0x3cb371]), beard: Math.random() < 0.5,
      sunglasses: Math.random() < 0.2, chain: Math.random() < 0.4, build: wpick([['slim', 0.3], ['average', 0.45], ['heavy', 0.25]]), height: 0.95 + Math.random() * 0.12 };
  }
  return base;
}

// ---------- skeleton (bind pose, metres, H = 1; x of the arms/legs is multiplied by the build width W) ----------
const BONES = [ // name, parent index, x, y, z (absolute)
  ['hips', -1, 0, 0.94, 0], ['spine', 0, 0, 1.08, 0], ['chest', 1, 0, 1.28, 0], ['neck', 2, 0, 1.47, 0], ['head', 3, 0, 1.56, 0],
  ['upperArm.L', 2, 0.20, 1.42, 0], ['foreArm.L', 5, 0.20, 1.13, 0], ['hand.L', 6, 0.20, 0.88, 0],
  ['upperArm.R', 2, -0.20, 1.42, 0], ['foreArm.R', 8, -0.20, 1.13, 0], ['hand.R', 9, -0.20, 0.88, 0], ['prop', 10, -0.20, 0.83, 0],
  ['thigh.L', 0, 0.095, 0.92, 0], ['shin.L', 12, 0.095, 0.50, 0], ['foot.L', 13, 0.095, 0.08, 0],
  ['thigh.R', 0, -0.095, 0.92, 0], ['shin.R', 15, -0.095, 0.50, 0], ['foot.R', 16, -0.095, 0.08, 0],
];
const [HIPS, SPINE, CHEST, NECK, HEAD, UA_L, FA_L, HD_L, UA_R, FA_R, HD_R, PROP, TH_L, SH_L, FT_L, TH_R, SH_R, FT_R] = BONES.map((b, i) => i);
const REST_HIPS_Y = 0.94, ARM_OUT = 0.10;

// ---------- unit shapes, built once ----------
const _unit = new Map();
function unit(key, make) {
  let u = _unit.get(key);
  if (!u) { const g = make(); u = { pos: g.attributes.position.array, nor: g.attributes.normal.array, idx: g.index.array, n: g.attributes.position.count }; g.dispose(); _unit.set(key, u); }
  return u;
}
const uSphere = (ws, hs, ps, pl, ts, tl) => unit(`s${ws},${hs},${ps},${pl},${ts},${tl}`, () => new THREE.SphereGeometry(1, ws, hs, ps, pl, ts, tl));
const uBox = () => unit('b', () => new THREE.BoxGeometry(1, 1, 1));
const uCyl = (seg, open, ts, tl) => unit(`c${seg},${open},${ts},${tl}`, () => new THREE.CylinderGeometry(1, 1, 1, seg, 1, open, ts, tl));
// A torus lying in the xz plane with elliptical radii (rx, rz); not cached, only hats and collars use it.
function ringUnit(rx, rz, tube, rs, ts, arc) {
  const n = (rs + 1) * (ts + 1), pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new Uint16Array(rs * ts * 6); let k = 0;
  for (let i = 0; i <= ts; i++) {
    const u = (arc ? arc[0] + i / ts * arc[1] : i / ts * TAU), cu = Math.cos(u), su = Math.sin(u);
    for (let j = 0; j <= rs; j++) { const v = j / rs * TAU, cv = Math.cos(v), sv = Math.sin(v); pos[k * 3] = cu * (rx + tube * cv); pos[k * 3 + 1] = tube * sv; pos[k * 3 + 2] = su * (rz + tube * cv); nor[k * 3] = cu * cv; nor[k * 3 + 1] = sv; nor[k * 3 + 2] = su * cv; k++; }
  }
  let q = 0; for (let i = 0; i < ts; i++) for (let j = 0; j < rs; j++) { const a = i * (rs + 1) + j, b = a + rs + 1; idx[q++] = a; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b; idx[q++] = a + 1; idx[q++] = b + 1; }
  return { pos, nor, idx, n };
}

// ---------- placement scratch (module level: building a person allocates no matrices) ----------
const _xm = new THREE.Matrix4(), _xq = new THREE.Quaternion(), _xe = new THREE.Euler(), _xp = new THREE.Vector3(), _xs = new THREE.Vector3();
const _nm = new THREE.Matrix3(), _bm = new THREE.Matrix4(), _sm = new THREE.Matrix4(), _tm = new THREE.Matrix4();
const _fm = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fe = new THREE.Euler(), _fp = new THREE.Vector3(), _fs = new THREE.Vector3(1, 1, 1);
function xf(x, y, z, rx, ry, rz, sx, sy, sz) { _xe.set(rx, ry, rz, 'XYZ'); _xq.setFromEuler(_xe); return _xm.compose(_xp.set(x, y, z), _xq, _xs.set(sx, sy, sz)); }

// Places a unit shape, tints it and binds every vertex to one bone (skinIndex [bone,0,0,0], skinWeight [1,0,0,0]).
//   fr   frustum {rbx,rbz,rtx,rtz,h}: reshapes a unit cylinder into an elliptical frustum before the placement matrix
//   o    {sh:[yLow,yHigh,mulLow,mulHigh] vertical tint, dbl:true for a two-sided shell, skin:(x,y,z,idx,wgt,k)=>void for blended weights}
function emit(u, M, c, bone, o, fr) {
  c = col(c); const dbl = !!(o && o.dbl), n = u.n, tot = dbl ? n * 2 : n, e = M.elements, ne = _nm.getNormalMatrix(M).elements;
  const P = new Float32Array(tot * 3), N = new Float32Array(tot * 3), K = new Float32Array(tot * 3), SI = new Uint16Array(tot * 4), SW = new Float32Array(tot * 4);
  const sh = o && o.sh, skin = o && o.skin, ip = u.pos, inr = u.nor;
  for (let i = 0; i < n; i++) {
    let x = ip[i * 3], y = ip[i * 3 + 1], z = ip[i * 3 + 2], nx = inr[i * 3], ny = inr[i * 3 + 1], nz = inr[i * 3 + 2];
    if (fr) {
      const t = y + 0.5, rx = fr.rbx + (fr.rtx - fr.rbx) * t, rz = fr.rbz + (fr.rtz - fr.rbz) * t;
      if (Math.abs(ny) < 0.5) { // side wall: normal of the elliptical frustum (cap normals stay +-y)
        const dx = fr.rtx - fr.rbx, dz = fr.rtz - fr.rbz; const sn = nx, cs = nz;
        nx = rz * fr.h * sn; ny = -(rz * dx * sn * sn + rx * dz * cs * cs); nz = rx * fr.h * cs; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      }
      x *= rx; z *= rz; y *= fr.h;
    }
    const X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
    let NX = ne[0] * nx + ne[3] * ny + ne[6] * nz, NY = ne[1] * nx + ne[4] * ny + ne[7] * nz, NZ = ne[2] * nx + ne[5] * ny + ne[8] * nz; const nl = Math.hypot(NX, NY, NZ) || 1; NX /= nl; NY /= nl; NZ /= nl;
    let k = 1; if (sh) k = sh[2] + (sh[3] - sh[2]) * clamp((Y - sh[0]) / (sh[1] - sh[0]), 0, 1);
    P[i * 3] = X; P[i * 3 + 1] = Y; P[i * 3 + 2] = Z; N[i * 3] = NX; N[i * 3 + 1] = NY; N[i * 3 + 2] = NZ;
    K[i * 3] = c.r * k; K[i * 3 + 1] = c.g * k; K[i * 3 + 2] = c.b * k;
    SI[i * 4] = bone; SW[i * 4] = 1; if (skin) skin(X, Y, Z, SI, SW, i * 4);
  }
  let idx = u.idx;
  if (dbl) { // second copy with flipped normals and reversed winding
    P.copyWithin(n * 3, 0, n * 3); K.copyWithin(n * 3, 0, n * 3); SI.copyWithin(n * 4, 0, n * 4); SW.copyWithin(n * 4, 0, n * 4);
    for (let i = 0; i < n * 3; i++) N[n * 3 + i] = -N[i];
    const m = u.idx.length; idx = new Uint16Array(m * 2); idx.set(u.idx);
    for (let i = 0; i < m; i += 3) { idx[m + i] = u.idx[i] + n; idx[m + i + 1] = u.idx[i + 2] + n; idx[m + i + 2] = u.idx[i + 1] + n; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(K, 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// Welds skinned pieces into one indexed geometry; copies position, normal, color, skinIndex and skinWeight.
function mergeSkinned(geos) {
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), K = new Float32Array(nv * 3), SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), I = new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const g of geos) {
    const a = g.attributes, c = a.position.count, ix = g.index.array;
    P.set(a.position.array, vo * 3); N.set(a.normal.array, vo * 3); K.set(a.color.array, vo * 3); SI.set(a.skinIndex.array, vo * 4); SW.set(a.skinWeight.array, vo * 4);
    for (let i = 0; i < ix.length; i++) I[io + i] = ix[i] + vo;
    vo += c; io += ix.length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('color', new THREE.BufferAttribute(K, 3));
  out.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); out.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4)); out.setIndex(new THREE.BufferAttribute(I, 1));
  out.computeBoundingSphere();
  return out;
}

// ---------- primitive helpers (they append to the person being built, B) ----------
const FULL_SPH = [0, TAU, 0, Math.PI], FULL_CYL = [0, TAU], ZERO3 = [0, 0, 0];
let B = { parts: [], hi: true };
const put = g => { B.parts.push(g); };
// ellipsoid / partial sphere. o: seg [w,h], part [phiStart,phiLen,thetaStart,thetaLen], rot [rx,ry,rz] + emit options
function sph(bone, rx, ry, rz, x, y, z, c, o) {
  const sg = (o && o.seg) || (B.hi ? [10, 7] : [7, 4]), pt = (o && o.part) || FULL_SPH, rot = (o && o.rot) || ZERO3;
  put(emit(uSphere(sg[0], sg[1], pt[0], pt[1], pt[2], pt[3]), xf(x, y, z, rot[0], rot[1], rot[2], rx, ry, rz), c, bone, o));
}
const ball = (bone, r, x, y, z, c, o) => sph(bone, r, r, r, x, y, z, c, o);
// elliptical frustum (cylinder with different bottom/top radii). o: seg, open, part [thetaStart,thetaLen], rot + emit options
function cyl(bone, rbx, rbz, rtx, rtz, h, x, y, z, c, o) {
  const seg = (o && o.seg) || (B.hi ? 10 : 7), pt = (o && o.part) || FULL_CYL, rot = (o && o.rot) || ZERO3;
  put(emit(uCyl(seg, !!(o && o.open), pt[0], pt[1]), xf(x, y, z, rot[0], rot[1], rot[2], 1, 1, 1), c, bone, o, { rbx, rbz, rtx, rtz, h }));
}
// tapered limb from y = yTop down: radius r0 (top) -> r1 (bottom), 8 radial segments (6 on low), z scaled 0.9
function limb(bone, r0, r1, len, x, yTop, z, c, pad, o) {
  const k = o && o.k !== undefined ? o.k : B.lk || 1, p = pad || 0, a = r0 * k + p, b = r1 * k + p; // k: radius factor of the build (a heavy person has thicker limbs)
  cyl(bone, b, b * 0.9, a, a * 0.9, len, x, yTop - len / 2, z, c, Object.assign({ open: true, seg: B.hi ? 8 : 6 }, o));
}
// bevelled torso block: 4 radial segments rotated 45 degrees (a box frustum, w0/d0 at y0, w1/d1 at y1); med/high use 8 for a rounder body
function taper(bone, w0, d0, w1, d1, y0, y1, x, z, c, o, four) {
  const k4 = four || !B.hi, k = k4 ? 0.70710678 : 0.5;
  cyl(bone, w0 * k, d0 * k, w1 * k, d1 * k, y1 - y0, x, (y0 + y1) / 2, z, c, Object.assign({ seg: k4 ? 4 : 8, part: [k4 ? Math.PI / 4 : 0, TAU] }, o));
}
const box = (bone, w, h, d, x, y, z, c, o) => { const r = (o && o.rot) || ZERO3; put(emit(uBox(), xf(x, y, z, r[0], r[1], r[2], w, h, d), c, bone, o)); };
// thin box between two points
function bar(bone, x0, y0, z0, x1, y1, z1, thick, c) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; _fe.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 'YXZ'); _fq.setFromEuler(_fe);
  _bm.compose(_fp.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), _fq, _fs.set(thick, thick, Math.hypot(dx, dy, dz)));
  put(emit(uBox(), _bm, c, bone));
}
function ring(bone, rx, rz, tube, x, y, z, c, rot, o) {
  const r = rot || ZERO3; put(emit(ringUnit(rx, rz, tube, (o && o.rs) || (B.hi ? 6 : 4), (o && o.ts) || (B.hi ? 14 : 9), o && o.arc), xf(x, y, z, r[0], r[1], r[2], 1, 1, 1), c, bone, o));
}

// ---------- face: boxes laid on the skull surface, turned to follow its curvature ----------
const HY = 1.62; // skull centre height; the combat head hit sphere (p.y + 1.6, r 0.24) stays centred on it
const SKA = 0.1058, SKB = 0.1265, SKC = 0.115; // skull radii: 0.115 * (0.92, 1.1, 1.0)
// frame on the skull at (x, y) relative to the head centre, z-axis along the surface normal, `lift` outwards, `tilt` about the normal
function faceFrame(x, y, lift, tilt) {
  const z = SKC * Math.sqrt(Math.max(0.05, 1 - (x / SKA) ** 2 - (y / SKB) ** 2));
  const nx = x / (SKA * SKA), ny = y / (SKB * SKB), nz = z / (SKC * SKC);
  _fe.set(-Math.atan2(ny, Math.hypot(nx, nz)), Math.atan2(nx, nz), tilt || 0, 'YXZ'); _fq.setFromEuler(_fe);
  return _fm.compose(_fp.set(x, HY + y, z + lift), _fq, _fs.set(1, 1, 1));
}
function faceBox(w, h, d, x, y, lift, c, tilt) { const G = faceFrame(x, y, lift, tilt); _bm.multiplyMatrices(G, _sm.makeScale(w, h, d)); put(emit(uBox(), _bm, c, HEAD)); }
// box offset (ox, oy) inside the face frame at (x, y) (glasses rims)
function faceBar(x, y, lift, ox, oy, w, h, d, c) { const G = faceFrame(x, y, lift, 0); _bm.multiplyMatrices(G, _tm.makeTranslation(ox, oy, 0)); _bm.multiply(_sm.makeScale(w, h, d)); put(emit(uBox(), _bm, c, HEAD)); }

// Head, hair and headwear, all bound to the head bone (no extra draw calls).
function buildHead(look, fem) {
  const hi = B.hi, skin = col(look.skin), hair = col(look.hair === undefined ? 0x2b2b2b : look.hair), hs = look.hairStyle || 'short';
  const covered = !!(look.hat || look.cap || look.beanie || look.hoodUp || look.bandana);
  // skull, jaw, ears
  sph(HEAD, SKA, SKB, SKC, 0, HY, 0, skin, { seg: hi ? [12, 9] : [8, 6] });
  sph(HEAD, fem ? 0.079 : 0.085, 0.06, fem ? 0.084 : 0.09, 0, HY - 0.06, 0.01, skin, { seg: hi ? [10, 6] : [7, 4] });
  const earC = shade(skin, 0.96);
  for (const s of [1, -1]) sph(HEAD, 0.016, 0.034, 0.024, s * 0.108, HY - 0.005, -0.008, earC, { seg: hi ? [7, 5] : [5, 4], rot: [0, s * 0.35, 0] });
  // eyes, brows, nose, mouth
  const brow = look.brow === undefined ? -0.15 + Math.random() * 0.35 : look.brow; look.brow = brow;
  const eyeC = col(look.eye === undefined ? 0x1c1612 : look.eye);
  for (const s of [1, -1]) {
    faceBox(0.034, 0.02, 0.01, s * 0.04, 0.02, 0, 0xf4efe8);
    faceBox(0.016, 0.018, 0.01, s * 0.04, 0.02, 0.0045, eyeC);
    faceBox(0.045, 0.012, 0.01, s * 0.042, 0.052, 0.002, hair, s * brow);
  }
  faceBox(0.03, 0.05, 0.035, 0, -0.012, 0.008, shade(skin, 0.92));
  faceBox(look.lipstick ? 0.054 : 0.05, look.lipstick ? 0.014 : 0.012, 0.01, 0, -0.055, 0, look.lipstick ? 0xc2185b : mix(skin, 0x7a3a34, 0.5));
  // glasses: thin rims keep the eyes visible; sunglasses are solid dark lenses
  if (look.glasses || look.sunglasses) {
    const fc = 0x14161c;
    for (const s of [1, -1]) {
      if (look.sunglasses) faceBar(s * 0.04, 0.02, 0.011, 0, 0, 0.05, 0.034, 0.008, 0x0b0c12);
      else if (hi) { faceBar(s * 0.04, 0.02, 0.011, 0, 0.016, 0.05, 0.004, 0.006, fc); faceBar(s * 0.04, 0.02, 0.011, 0, -0.016, 0.05, 0.004, 0.006, fc); faceBar(s * 0.04, 0.02, 0.011, 0.025, 0, 0.004, 0.034, 0.006, fc); faceBar(s * 0.04, 0.02, 0.011, -0.025, 0, 0.004, 0.034, 0.006, fc); }
      if (hi) bar(HEAD, s * 0.063, HY + 0.02, 0.099, s * 0.108, HY + 0.02, 0.004, 0.005, fc); // temple
    }
    if (look.sunglasses || hi) faceBar(0, 0.024, 0.012, 0, 0, 0.03, 0.005, 0.006, fc); else faceBar(0, 0.02, 0.011, 0, 0, 0.115, 0.01, 0.006, fc); // low: one bar across the eyes
  }
  // beard: front half of a lower spherical band
  if (look.beard) {
    sph(HEAD, 0.093, 0.072, 0.099, 0, HY - 0.06, 0.012, hair, { seg: hi ? [12, 4] : [8, 3], part: [0, Math.PI, 0.6 * Math.PI, 0.3 * Math.PI] });
    if (hi) faceBox(0.055, 0.011, 0.012, 0, -0.043, 0.004, hair);
  }
  // ----- hair -----
  const buzzC = mix(hair, skin, 0.45);
  const dome = (c, thetaLen, tilt, k, dy, dz) => sph(HEAD, 0.124 * k, 0.1376 * k, 0.13 * k, 0, HY + dy, dz, c, { seg: hi ? [12, 6] : [8, 4], part: [0, TAU, 0, thetaLen], rot: [tilt, 0, 0], sh: [HY - 0.1, HY + 0.14, 0.8, 1] });
  if (hs === 'buzz' && !covered) dome(buzzC, 0.42 * Math.PI, -0.35, 0.965, 0, 0);
  else if (hs === 'mohawk') {
    if (!covered) { dome(buzzC, 0.42 * Math.PI, -0.35, 0.965, 0, 0); taper(HEAD, 0.05, 0.22, 0.022, 0.09, HY + 0.1, HY + 0.2, 0, -0.01, hair, null, true); }
  } else if (hs === 'afro') {
    if (!covered) sph(HEAD, 0.17, 0.17, 0.17, 0, HY + 0.04, -0.02, hair, { seg: hi ? [12, 8] : [8, 5], part: [0, TAU, 0, 2.18], rot: [-0.873, 0, 0], dbl: true, sh: [HY - 0.12, HY + 0.2, 0.78, 1] });
  } else if (hs === 'bald') { /* nothing on top: the skull is the head */
  } else if (hs !== 'buzz') {
    if (!covered) dome(hair, 0.42 * Math.PI, -0.35, 1, 0, 0);
    if (look.hoodUp) { /* the hood hides the hair */ } else if (hs === 'long') { cyl(HEAD, 0.14, 0.14, 0.123, 0.123, 0.34, 0, HY - 0.07, -0.015, hair, { open: true, dbl: true, seg: hi ? 10 : 7, part: [0.62 * Math.PI, 0.76 * Math.PI], sh: [HY - 0.25, HY + 0.1, 0.78, 1] }); }
    else if (hs === 'pony') {
      cyl(HEAD, 0.028, 0.028, 0.036, 0.036, 0.15, 0, HY + 0.01, -0.158, hair, { seg: hi ? 8 : 5, rot: [0.61, 0, 0] });
      if (hi) cyl(HEAD, 0.012, 0.012, 0.028, 0.028, 0.14, 0, HY - 0.13, -0.218, hair, { seg: 8, rot: [0.17, 0, 0] }); else ball(HEAD, 0.02, 0, HY - 0.1, -0.2, hair);
      if (!covered) ball(HEAD, 0.032, 0, HY + 0.062, -0.122, shade(hair, 0.55));
    } else if (hs === 'bun') { if (!covered) ball(HEAD, 0.06, 0, HY + 0.1, -0.085, hair); }
    else if (hs === 'curly' && !covered) {
      // six curls around the crown (azimuth from the front, elevation above the horizontal)
      const curls = [[0.9, 0.62], [-0.9, 0.62], [1.9, 0.38], [-1.9, 0.38], [3.14, 0.5], [0, 1.2]];
      for (const [az, el] of curls) ball(HEAD, 0.04, 0.132 * Math.cos(el) * Math.sin(az), HY + 0.01 + 0.145 * Math.sin(el), 0.136 * Math.cos(el) * Math.cos(az), hair, { seg: hi ? [6, 4] : [5, 3] });
    }
  }
  // ----- headwear -----
  if (look.cap) { // baseball cap: dome + half-disc brim (turned round when look.capBack)
    const cb = look.capBack ? Math.PI : 0;
    sph(HEAD, 0.1255, 0.1395, 0.1335, 0, HY - 0.002, 0, look.cap, { seg: hi ? [12, 6] : [8, 4], part: [0, TAU, 0, 0.47 * Math.PI], rot: [-0.45, 0, 0], sh: [HY - 0.1, HY + 0.14, 0.85, 1] });
    _bm.makeRotationY(cb).multiply(xf(0, HY + 0.058, 0.086, 0.14, 0, 0, 0.118, 0.012, 0.095));
    put(emit(uCyl(hi ? 10 : 7, false, -HALF_PI, Math.PI), _bm, shade(look.cap, 0.8), HEAD));
  }
  if (look.beanie) { // knitted cap pulled down: dome + rim ring
    sph(HEAD, 0.128, 0.141, 0.1345, 0, HY, 0, look.beanie, { seg: hi ? [12, 7] : [8, 4], part: [0, TAU, 0, 0.5 * Math.PI], rot: [-0.62, 0, 0], sh: [HY - 0.1, HY + 0.15, 0.85, 1] });
    ring(HEAD, 0.128, 0.1345, hi ? 0.014 : 0.012, 0, HY, 0, shade(look.beanie, 0.72), [-0.62, 0, 0]);
  }
  if (look.hat && look.armor) { // SWAT helmet
    sph(HEAD, 0.136, 0.149, 0.141, 0, HY + 0.004, 0, look.hat, { seg: hi ? [12, 7] : [8, 4], part: [0, TAU, 0, 0.5 * Math.PI], rot: [-0.55, 0, 0], sh: [HY - 0.1, HY + 0.16, 0.8, 1] });
    ring(HEAD, 0.136, 0.141, 0.01, 0, HY + 0.004, 0, shade(look.hat, 1.7), [-0.55, 0, 0]);
    _bm.copy(xf(0, HY + 0.07, 0.115, 0.1, 0, 0, 0.09, 0.012, 0.05)); put(emit(uCyl(hi ? 10 : 7, false, -HALF_PI, Math.PI), _bm, shade(look.hat, 1.3), HEAD));
  } else if (look.hat) { // peaked cap: flared crown, hat band, visor, optional badge
    cyl(HEAD, 0.123, 0.127, 0.136, 0.14, 0.078, 0, HY + 0.094, -0.004, look.hat, { seg: hi ? 12 : 8, rot: [-0.08, 0, 0] });
    cyl(HEAD, 0.1245, 0.1285, 0.1245, 0.1285, 0.02, 0, HY + 0.07, -0.004, shade(look.hat, 0.55), { seg: hi ? 12 : 8, rot: [-0.08, 0, 0] });
    _bm.copy(xf(0, HY + 0.062, 0.1, 0.2, 0, 0, 0.1, 0.012, 0.078)); put(emit(uCyl(hi ? 10 : 7, false, -HALF_PI, Math.PI), _bm, shade(look.hat, 0.45), HEAD));
    if (look.badge) box(HEAD, 0.034, 0.034, 0.01, 0, HY + 0.1, 0.133, 0xffd34e, { rot: [-0.1, 0, 0] });
  }
  if (look.band) ring(HEAD, 0.098, 0.106, 0.0075, 0, HY + 0.058, -0.003, look.band, ZERO3);
  if (look.hoodUp) { // hood pulled over the head: a dome with a rim round the face
    const hc = col(look.shirt);
    sph(HEAD, 0.143, 0.158, 0.152, 0, HY + 0.006, -0.016, hc, { seg: hi ? [12, 7] : [8, 4], part: [0, TAU, 0, 0.56 * Math.PI], rot: [-0.66, 0, 0], sh: [HY - 0.1, HY + 0.16, 0.8, 1] });
    ring(HEAD, 0.141, 0.152, 0.015, 0, HY + 0.006, -0.016, shade(hc, 0.8), [-0.66, 0, 0], { rs: 4, ts: hi ? 12 : 8 });
  }
  if (look.bandana) { // head wrap: a skull cap of cloth, a knot at the back with two tails
    const bc = col(look.bandana);
    sph(HEAD, 0.1255, 0.1395, 0.1335, 0, HY - 0.002, 0, bc, { seg: hi ? [12, 6] : [8, 4], part: [0, TAU, 0, 0.44 * Math.PI], rot: [-0.4, 0, 0], sh: [HY - 0.1, HY + 0.14, 0.85, 1] });
    ring(HEAD, 0.123, 0.13, 0.007, 0, HY + 0.042, -0.002, shade(bc, 0.78), [-0.4, 0, 0], { rs: 4, ts: hi ? 12 : 8 });
    ball(HEAD, 0.026, 0, HY + 0.03, -0.138, bc, { seg: hi ? [7, 5] : [5, 3] });
    for (const s of [1, -1]) box(HEAD, 0.024, 0.09, 0.008, s * 0.018, HY - 0.02, -0.15, shade(bc, 0.9), { rot: [0.25, 0, s * 0.18] });
  }
  if (look.headphones) { // band over the head and two ear cups
    const hc = col(look.headphones);
    ring(HEAD, 0.126, 0.155, 0.0085, 0, HY - 0.012, 0, hc, [HALF_PI, 0, 0], { arc: [Math.PI, Math.PI], rs: hi ? 5 : 4, ts: hi ? 9 : 6 });
    for (const s of [1, -1]) put(emit(uCyl(hi ? 8 : 6, false, 0, TAU), xf(s * 0.121, HY - 0.012, 0, 0, 0, HALF_PI, 0.044, 0.034, 0.044), shade(hc, 0.85), HEAD));
  }
}

// ---------- body ----------
// What a look actually wears: the new garment fields where given, otherwise worked out from the old ones (jacket, tie, armor, skirt, shorts, hat ...).
function garments(look) {
  const hasJ = look.jacket !== undefined && look.jacket !== null;
  let top = look.top; if (!TOPS.includes(top)) top = look.skirt ? 'dress' : hasJ ? (look.tie ? 'blazer' : 'jacket') : look.armor || look.sleeves === 'long' ? 'longsleeve' : 'tee';
  let bottom = look.bottom; if (!BOTTOMS.includes(bottom)) bottom = look.skirt ? 'skirt' : look.shorts ? 'shorts' : 'jeans';
  if (top === 'dress') bottom = 'skirt';
  const layered = top === 'jacket' || top === 'blazer';
  const skirtOn = bottom === 'skirt', skirtC = skirtOn ? (look.skirt !== undefined && look.skirt !== null ? look.skirt : top === 'dress' ? look.shirt : look.pants) : null;
  return { top, bottom, layered, outer: layered ? (hasJ ? look.jacket : look.shirt) : null, inner: layered && hasJ ? look.shirt : 0xe8e0d0, skirtC,
    sleeves: layered || top === 'longsleeve' || top === 'hoodie' || look.armor ? 'long' : top === 'tank' || top === 'bare' ? 'none' : look.sleeves === 'long' ? 'long' : 'short',
    shoeType: SHOE_TYPES.includes(look.shoeType) ? look.shoeType : layered && top === 'blazer' ? 'dress' : 'sneakers', shoeC: SHOE_TYPES.includes(look.shoeType) || top !== 'blazer' ? null : 0x15110e, belly: look.build === 'heavy' }; // a suit gets dress shoes
}

function buildBody(look, W, fem, gm) {
  const hi = B.hi, lk = B.lk, skin = col(look.skin), shirt = col(look.shirt), pants = col(look.pants), vest = look.armor ? col(look.armor) : null;
  const shoes = col(gm.shoeC !== null ? gm.shoeC : look.shoes === undefined ? 0x1a1a1a : look.shoes), { top, bottom, shoeType } = gm, layered = gm.layered, outer = layered ? col(gm.outer) : null, sl = gm.sleeves;
  const topC = layered ? outer : top === 'bare' ? skin : shirt, sleeveC = layered ? outer : shirt, lowerC = gm.skirtC !== null ? col(gm.skirtC) : pants;
  // torso blocks (y0..y1 with the widths at each end); neighbours overlap 4 cm so bending never opens a gap
  const T = fem ? { p: [0.38, 0.345, 0.215, 0.21], a: [0.275, 0.335, 0.185, 0.205], c: [0.338, 0.38, 0.21, 0.23] } : { p: [0.34, 0.318, 0.2, 0.205], a: [0.295, 0.364, 0.19, 0.215], c: [0.356, 0.44, 0.22, 0.245] };
  const half = y => (T.c[2] + (T.c[3] - T.c[2]) * clamp((y - 1.2) / 0.24, 0, 1)) / 2; // chest half depth at height y (without clothing padding)
  const cw = y => T.c[0] + (T.c[1] - T.c[0]) * clamp((y - 1.2) / 0.24, 0, 1), cd = y => T.c[2] + (T.c[3] - T.c[2]) * clamp((y - 1.2) / 0.24, 0, 1); // chest width / depth at y
  taper(HIPS, T.p[0] * W, T.p[2], T.p[1] * W, T.p[3], 0.86, 1.04, 0, 0, lowerC);
  if (gm.skirtC === null && bottom !== 'sweatpants' && bottom !== 'trunks' && top !== 'hoodie') taper(HIPS, (T.p[1] + 0.017) * W, T.p[3] + 0.007, (T.p[1] + 0.017) * W, T.p[3] + 0.007, 0.985, 1.035, 0, 0, col(look.belt === undefined ? 0x15171a : look.belt));
  let chestFront = 0; // z of the clothing surface at chest height, for decals
  if (layered) { // jacket / blazer: open front showing the shirt (a blazer is longer)
    const lo = top === 'blazer' ? 0.9 : 0.96;
    taper(SPINE, (T.a[0] + 0.022) * W, T.a[2] + 0.024, (T.a[1] + 0.022) * W, T.a[3] + 0.024, lo, 1.25, 0, 0, outer);
    taper(CHEST, (T.c[0] + 0.02) * W, T.c[2] + 0.026, (T.c[1] + 0.02) * W, T.c[3] + 0.026, 1.2, 1.445, 0, 0, outer);
    chestFront = half(1.3) + 0.013;
    box(CHEST, 0.1 * W, 0.34, 0.012, 0, 1.27, chestFront - 0.004, col(gm.inner)); // shirt showing through the open front
    if (top === 'blazer') for (const s of [1, -1]) bar(CHEST, s * 0.055 * W, 1.435, chestFront + 0.002, s * 0.012 * W, 1.2, chestFront + 0.002, 0.02, shade(outer, 0.8)); // lapels
  } else if (top === 'tank') { // bare shoulders: shirt up to 1.37 with two straps over the shoulders, skin above
    taper(SPINE, T.a[0] * W, T.a[2], T.a[1] * W, T.a[3], 1.0, 1.24, 0, 0, shirt, { sh: [0.98, 1.24, 0.9, 1] });
    taper(CHEST, cw(1.2) * W, cd(1.2), cw(1.37) * W, cd(1.37), 1.2, 1.37, 0, 0, shirt);
    taper(CHEST, (cw(1.36) - 0.004) * W, cd(1.36) - 0.004, (cw(1.445) - 0.004) * W, cd(1.445) - 0.004, 1.36, 1.445, 0, 0, skin);
    for (const s of [1, -1]) box(CHEST, 0.05, 0.1, cd(1.4) + 0.012, s * 0.115 * W, 1.405, 0, shirt);
    chestFront = half(1.3);
  } else if (top === 'bare') { // swimwear: the torso is skin
    taper(SPINE, T.a[0] * W, T.a[2], T.a[1] * W, T.a[3], 1.0, 1.24, 0, 0, skin, { sh: [0.98, 1.24, 0.92, 1] });
    taper(CHEST, T.c[0] * W, T.c[2], T.c[1] * W, T.c[3], 1.2, 1.44, 0, 0, skin);
    chestFront = half(1.3);
  } else if (top === 'hoodie') { // thick, with the hood draped behind the neck, a pocket band and drawstrings
    taper(SPINE, (T.a[0] + 0.016) * W, T.a[2] + 0.02, (T.a[1] + 0.016) * W, T.a[3] + 0.02, 0.95, 1.25, 0, 0, shirt);
    taper(CHEST, (T.c[0] + 0.014) * W, T.c[2] + 0.02, (T.c[1] + 0.014) * W, T.c[3] + 0.02, 1.2, 1.445, 0, 0, shirt);
    chestFront = half(1.3) + 0.01;
    box(SPINE, 0.2 * W, 0.1, 0.014, 0, 1.03, half(1.1) + 0.022, shade(shirt, 0.8)); // pocket band
    ring(CHEST, 0.105, 0.1, 0.03, 0, 1.462, -0.03, shade(shirt, 0.9), [-0.35, 0, 0], { arc: [Math.PI, Math.PI] }); // hood hanging behind the neck
    if (hi) for (const s of [1, -1]) bar(CHEST, s * 0.032, 1.43, chestFront + 0.003, s * 0.036, 1.27, chestFront + 0.003, 0.009, 0xe8e0d0);
  } else { // tee, long sleeve, shirt, dress top
    taper(SPINE, T.a[0] * W, T.a[2], T.a[1] * W, T.a[3], 1.0, 1.24, 0, 0, shirt, { sh: [0.98, 1.24, 0.9, 1] });
    taper(CHEST, T.c[0] * W, T.c[2], T.c[1] * W, T.c[3], 1.2, 1.44, 0, 0, shirt);
    chestFront = half(1.3);
    if (top === 'shirt') box(CHEST, 0.014, 0.4, 0.006, 0, 1.22, chestFront + 0.003, shade(shirt, 0.82)); // button placket
  }
  if (vest) { // SWAT vest, pouches, reflective stripe
    taper(SPINE, (T.a[0] + 0.04) * W, T.a[2] + 0.034, (T.a[1] + 0.04) * W, T.a[3] + 0.034, 1.02, 1.25, 0, 0, vest);
    taper(CHEST, (T.c[0] + 0.036) * W, T.c[2] + 0.036, (T.c[1] + 0.03) * W, T.c[3] + 0.036, 1.2, 1.42, 0, 0, vest);
    chestFront = half(1.3) + 0.018;
    if (hi) for (const px of [-0.09, 0, 0.09]) box(SPINE, 0.06, 0.075, 0.032, px * W, 1.1, half(1.1) + 0.03, shade(vest, 0.7));
    if (look.vestStripe !== undefined && look.vestStripe !== null) { const vs = col(look.vestStripe); for (const f of [1, -1]) box(CHEST, (cw(1.3) + 0.05) * W * 0.72, 0.034, 0.012, 0, 1.31, f * (chestFront + 0.002), vs); }
  }
  if (gm.skirtC !== null) { // flared skirt / dress hem; its lower vertices follow the thighs so legs do not poke through (the whole flare lies outside the thigh volume)
    const skirtSkin = (x, y, z, si, sw, k) => {
      const t = clamp((1.03 - y) / 0.4, 0, 1), s = clamp(x / (0.3 * W), -1, 1), wl = t * 0.62 * (0.5 + 0.5 * s), wr = t * 0.62 * (0.5 - 0.5 * s);
      si[k] = HIPS; sw[k] = 1 - wl - wr; si[k + 1] = TH_L; sw[k + 1] = wl; si[k + 2] = TH_R; sw[k + 2] = wr; si[k + 3] = 0; sw[k + 3] = 0;
    };
    const hem = top === 'dress' ? 0.58 : 0.68, run = 1.04 - hem;
    taper(HIPS, (0.36 + 0.667 * run) * W, 0.225 + 0.4167 * run, 0.36 * W, 0.225, hem, 1.04, 0, 0, lowerC, { open: true, dbl: true, skin: skirtSkin, sh: [hem - 0.02, 1.0, 0.82, 1] });
  }
  if (look.tie || top === 'blazer') { const tc = col(look.tie === undefined ? 0xb0122a : look.tie); box(CHEST, 0.04, 0.3, 0.01, 0, 1.25, chestFront + 0.002, tc); box(CHEST, 0.05, 0.045, 0.02, 0, 1.4, chestFront + 0.004, shade(tc, 1.1)); }
  if (look.stripe) { // side stripes: thin-depth copies of the torso blocks, only their flanks poke out
    const sc = col(look.stripe);
    taper(SPINE, (T.a[0] + 0.012) * W, 0.09, (T.a[1] + 0.012) * W, 0.09, 1.0, 1.24, 0, 0, sc); taper(CHEST, (T.c[0] + 0.01) * W, 0.09, (T.c[1] + 0.008) * W, 0.09, 1.2, 1.44, 0, 0, sc);
  }
  if (look.badge) box(CHEST, 0.05, 0.062, 0.012, 0.085 * W, 1.31, chestFront + 0.003, 0xffd34e, { rot: [0, 0, 0.1] });
  if (fem && top !== 'bare') for (const s of [1, -1]) sph(CHEST, 0.048, 0.046, 0.044, s * 0.068 * W, 1.31, chestFront - 0.036, top === 'tank' ? shirt : topC, { seg: hi ? [8, 5] : [6, 4] });
  if (gm.belly) sph(SPINE, 0.185, 0.17, 0.115, 0, 1.075, 0.035, topC, { seg: hi ? [10, 6] : [7, 4], sh: [0.88, 1.25, 0.9, 1] }); // heavy build: a belly (radius 0.17) pushes the front of the top out
  if (look.backpack) {
    const bc = col(look.backpack);
    taper(CHEST, 0.3 * W, 0.12, 0.33 * W, 0.15, 1.04, 1.4, 0, -0.2, bc, { sh: [1.04, 1.4, 0.82, 1] });
    box(CHEST, 0.2 * W, 0.12, 0.05, 0, 1.12, -0.29, shade(bc, 0.8));
    for (const s of [1, -1]) bar(CHEST, s * 0.095 * W, 1.43, 0.02, s * 0.095 * W, 1.2, chestFront + 0.004, 0.03, shade(bc, 0.7));
  }
  // neck, collar, chain
  limb(NECK, 0.052, 0.05, 0.11, 0, 1.545, 0, skin, 0, { k: 1 });
  if (top === 'shirt') { // collar band and the two wings of an open collar
    ring(NECK, 0.06, 0.058, hi ? 0.014 : 0.012, 0, 1.455, 0, shirt, ZERO3);
    for (const s of [1, -1]) bar(NECK, s * 0.02, 1.475, 0.056, s * 0.07, 1.43, 0.052, 0.016, shade(shirt, 0.94));
  } else if (hi && (top === 'tee' || top === 'longsleeve' || top === 'dress')) ring(NECK, 0.058, 0.056, 0.013, 0, 1.448, 0, shirt, ZERO3);
  if (look.chain) { ring(CHEST, 0.118, 0.136, 0.0055, 0, 1.446, -0.005, 0xf0c040, [0.4, 0, 0], { rs: 4, ts: hi ? 12 : 8 }); box(CHEST, 0.022, 0.03, 0.01, 0, 1.352, cd(1.35) / 2 + (layered ? 0.026 : 0.004), 0xf0c040); }
  // shoulders and arms (+1 = character left, which is +x)
  for (const s of [1, -1]) {
    const x = s * 0.2 * W, ua = s > 0 ? UA_L : UA_R, fa = s > 0 ? FA_L : FA_R, hd = s > 0 ? HD_L : HD_R;
    sph(CHEST, 0.063, 0.066, 0.06, x + s * 0.003, 1.408, 0, sl === 'none' ? skin : sleeveC);
    const rAt = f => 0.055 + (0.046 - 0.055) * f; // upper arm radius at fraction f of its length
    if (sl === 'long') {
      limb(ua, 0.055, 0.046, 0.29, x, 1.42, 0, sleeveC, 0.004); sph(fa, 0.047 * lk, 0.047 * lk, 0.042 * lk, x, 1.13, 0, sleeveC); limb(fa, 0.046, 0.037, 0.25, x, 1.13, 0, sleeveC, 0.003);
      if (top === 'hoodie') limb(fa, 0.041, 0.04, 0.035, x, 0.915, 0, shade(sleeveC, 0.72), 0.005); // ribbed cuff
      else if (top === 'blazer') limb(fa, 0.04, 0.039, 0.03, x, 0.915, 0, col(gm.inner), 0.005); // shirt cuff
    } else if (sl === 'short') {
      limb(ua, 0.055, rAt(0.6), 0.174, x, 1.42, 0, sleeveC, 0.006); limb(ua, rAt(0.6), 0.046, 0.116, x, 1.246, 0, skin);
      sph(fa, 0.046 * lk, 0.046 * lk, 0.041 * lk, x, 1.13, 0, skin); limb(fa, 0.046, 0.037, 0.25, x, 1.13, 0, skin);
    } else { limb(ua, 0.055, 0.046, 0.29, x, 1.42, 0, skin); sph(fa, 0.046 * lk, 0.046 * lk, 0.041 * lk, x, 1.13, 0, skin); limb(fa, 0.046, 0.037, 0.25, x, 1.13, 0, skin); }
    if (look.watch && s > 0) { limb(fa, 0.043, 0.042, 0.026, x, 0.94, 0, 0x2a2d33, 0.003); box(fa, 0.012, 0.034, 0.034, x + 0.044, 0.94, 0, 0xd8d8e0); } // wristwatch on the left wrist
    sph(hd, 0.03, 0.06, 0.045, x, 0.83, 0, skin); // hand: palm faces the thigh, thin axis is x
    box(hd, 0.017, 0.045, 0.022, x - s * 0.028, 0.855, 0.03, skin, { rot: [0.25, 0, 0] });
  }
  // legs and shoes
  const bareLegs = bottom === 'shorts' || bottom === 'trunks' || gm.skirtC !== null, thC = bareLegs ? skin : pants, shC = bareLegs ? skin : bottom === 'jeans' ? shade(pants, 0.9) : pants;
  const soleC = shoeType === 'sneakers' ? col(0xf2f2f2) : shoeType === 'boots' ? col(0x2a2420) : shoeType === 'dress' ? col(0x15110e) : shade(shoes, 0.6);
  for (const s of [1, -1]) {
    const x = s * 0.095 * W, th = s > 0 ? TH_L : TH_R, sh = s > 0 ? SH_L : SH_R, ft = s > 0 ? FT_L : FT_R;
    limb(th, 0.085, 0.066, 0.42, x, 0.92, 0, thC);
    if (bottom === 'shorts') limb(th, 0.085, 0.067, 0.4, x, 0.92, 0, pants, 0.011); // hem at the knee
    else if (bottom === 'trunks') limb(th, 0.085, 0.0741, 0.24, x, 0.92, 0, pants, 0.011);
    sph(sh, 0.064 * lk, 0.064 * lk, 0.059 * lk, x, 0.5, 0, shC);
    limb(sh, 0.062, 0.047, 0.42, x, 0.5, 0, shC);
    if (bottom === 'sweatpants') limb(sh, 0.052, 0.05, 0.055, x, 0.135, 0, shade(pants, 0.7), 0.003); // cuff band
    if (shoeType === 'sandals') { // sole, a bare foot and two straps
      box(ft, 0.116, 0.02, 0.272, x, 0.01, 0.065, soleC); box(ft, 0.1, 0.036, 0.24, x, 0.038, 0.06, skin);
      put(emit(uCyl(hi ? 8 : 6, false, -HALF_PI, Math.PI), xf(x, 0.038, 0.18, 0, 0, 0, 0.05, 0.036, 0.05), skin, ft));
      box(ft, 0.108, 0.014, 0.03, x, 0.062, 0.03, shoes); box(ft, 0.108, 0.014, 0.03, x, 0.056, 0.125, shoes);
    } else {
      box(ft, 0.116, 0.02, 0.272, x, 0.01, 0.065, soleC); // sole band (bottom at y = 0)
      put(emit(uCyl(hi ? 10 : 6, false, -HALF_PI, Math.PI), xf(x, 0.01, 0.201, 0, 0, 0, 0.058, 0.02, 0.058), soleC, ft));
      const uh = shoeType === 'boots' ? 0.11 : shoeType === 'dress' ? 0.075 : 0.09, uw = shoeType === 'dress' ? 0.1 : 0.11, tr = shoeType === 'dress' ? 0.048 : 0.055;
      box(ft, uw, uh, 0.27, x, 0.02 + uh / 2, 0.065, shoes, { sh: [0.02, 0.11, 0.82, 1] });
      put(emit(uCyl(hi ? 10 : 6, false, -HALF_PI, Math.PI), xf(x, 0.02 + uh / 2, 0.2, 0, 0, 0, tr, uh, tr), shoes, ft));
      if (shoeType === 'boots') limb(sh, 0.059, 0.057, 0.16, x, 0.24, 0, shoes); // shaft
      else if (shoeType === 'sneakers' && hi) box(ft, 0.05, 0.012, 0.1, x, 0.113, 0.12, 0xf2f2f2); // laces
    }
  }
}

// ---------- held items: one shared geometry per kind, never disposed with a person ----------
const _gunGeos = {};
function gunGeo(kind) {
  if (_gunGeos[kind]) return _gunGeos[kind];
  const saved = B; B = { parts: [], hi: true }; // gun-local frame: the barrel points along -y (down the forearm), "up" is +z, the palm is the origin
  if (kind === 'long') {
    box(0, 0.04, 0.27, 0.07, 0, 0.19, 0.02, 0x2a2d33); box(0, 0.05, 0.3, 0.075, 0, -0.05, 0.045, 0x1d2026); box(0, 0.036, 0.05, 0.09, 0, 0.03, -0.03, 0x141619, { rot: [0.2, 0, 0] });
    box(0, 0.034, 0.05, 0.11, 0, -0.1, -0.045, 0x15171a); box(0, 0.05, 0.2, 0.06, 0, -0.31, 0.04, 0x2a2d33); cyl(0, 0.012, 0.012, 0.012, 0.012, 0.26, 0, -0.5, 0.045, 0x101114, { seg: 8 });
    box(0, 0.012, 0.012, 0.012, 0, -0.62, 0.062, 0x101114); box(0, 0.012, 0.03, 0.012, 0, 0.07, 0.092, 0x101114);
  } else if (kind === 'bat') {
    cyl(0, 0.04, 0.04, 0.018, 0.018, 0.86, 0, -0.38, 0, 0xb98a56, { seg: 8 }); cyl(0, 0.02, 0.02, 0.02, 0.02, 0.2, 0, -0.0, 0, 0x1c1c1f, { seg: 8 }); ball(0, 0.026, 0, 0.1, 0, 0x1c1c1f);
  } else if (kind === 'grenade') {
    ball(0, 0.04, 0, -0.01, 0, 0x3d5a2a); cyl(0, 0.016, 0.016, 0.016, 0.016, 0.02, 0, -0.058, 0, 0x555a50, { seg: 8 }); box(0, 0.01, 0.07, 0.014, 0, -0.03, 0.044, 0x8a8f86); ball(0, 0.012, 0.012, -0.075, 0.03, 0xc9c9c9, { seg: [6, 4] });
  } else { // pistol
    box(0, 0.034, 0.22, 0.042, 0, -0.07, 0.042, 0x2d3138); cyl(0, 0.011, 0.011, 0.011, 0.011, 0.04, 0, -0.19, 0.036, 0x15171a, { seg: 8 }); box(0, 0.034, 0.05, 0.1, 0, 0.02, -0.022, 0x17191d, { rot: [0.2, 0, 0] });
    box(0, 0.01, 0.045, 0.012, 0, -0.01, -0.017, 0x17191d); box(0, 0.01, 0.01, 0.008, 0, -0.165, 0.068, 0x101114); box(0, 0.01, 0.01, 0.008, 0, 0.03, 0.068, 0x101114);
  }
  const geo = mergeSkinned(B.parts); geo.deleteAttribute('skinIndex'); geo.deleteAttribute('skinWeight'); B = saved;
  _gunGeos[kind] = geo; return geo;
}
// where the item sits in the prop (palm) frame
const GUN_POSE = { pistol: [0, 0, 0, 0, 0, 0], long: [0, 0.02, 0, 0, 0, 0], bat: [0, 0.0, 0, 0, 0, 0], grenade: [0, -0.01, 0, 0, 0, 0] };

// ---------- animation ----------
// A pose is a damped BASE layer (everything that depends on the state: stance, aim, carry, punches, reload, idle life, lean)
// plus an undamped GAIT overlay (periodic leg, arm and pelvis motion). The overlay weights come from the smooth ground speed, so a
// state switch only ever moves base targets, which are damped (no pop), while damping the periodic part itself would flatten it at
// sprint cadence. Both layers live in module-level scratch arrays, so animate() allocates nothing.
const NB = BONES.length, HPX = NB * 3; // x, y, z rotation per bone, then the hips offset (x, y, z) at HPX
const TG = new Float32Array(HPX + 3), OV = new Float32Array(HPX + 3);
const LEGS = [[TH_L, SH_L, FT_L], [TH_R, SH_R, FT_R]];
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const mixn = (a, b, t) => a + (b - a) * t;
const g3 = (t, wr, ws) => mixn(mixn(t[0], t[1], wr), t[2], ws); // walk / run / sprint blend
const tset = (i, x, y, z) => { const k = i * 3; TG[k] = x; TG[k + 1] = y; TG[k + 2] = z; };
const tadd = (i, x, y, z) => { const k = i * 3; TG[k] += x; TG[k + 1] += y; TG[k + 2] += z; };
const oadd = (i, x, y, z) => { const k = i * 3; OV[k] += x; OV[k + 1] += y; OV[k + 2] += z; };
// gait table: walk, run, sprint. thigh = swing amplitude, bias = forward shift of the swing centre (hips flex further than they extend)
const GT = {
  thigh: [0.42, 0.66, 0.7], bias: [0, 0.1, 0.15], flight: [0, 0.025, 0.05], kSw: [0.65, 1.5, 1.9], kSt: [0.08, 0.35, 0.4], arm: [0.32, 0.85, 1.15], elbow: [0.25, 1.35, 1.5],
  lean: [0.04, 0.16, 0.28], twist: [0.08, 0.15, 0.18], roll: [0.03, 0.04, 0.05],
};
// leg geometry from the bind pose: thigh 0.42, shin 0.42, ankle 0.08 above the sole; the heel is 0.07 behind and the toe cap 0.25 in front of the ankle
const LEG_A = 0.42, LEG_B = 0.42, ANKLE_H = 0.08, HEEL_Z = -0.07, TOE_Z = 0.25, HIP_DROP = REST_HIPS_Y - 0.92;
// vertical reach from the thigh pivot down to the lowest sole point, for the world pitch of thigh (a), shin (s) and foot (w)
function legReach(a, s, w) { const n = Math.sin(w); return LEG_A * Math.cos(a) + LEG_B * Math.cos(s) + ANKLE_H * Math.cos(w) + Math.max(HEEL_Z * n, TOE_Z * n); }
// ---------- dying, ragdoll limbs, getting up ----------
// The collapse is carried by the pelvis: ROOT is a rotation applied to the hips bone (the whole body pivots about the feet), so the group stays upright and
// every caller keeps writing group.position / rotation.y as before. A launched ragdoll instead turns the group itself (Ped owns that rigid body).
const ROOT = { on: false, solveW: 1, q: new THREE.Quaternion() };
const _ra = new THREE.Vector3(), _rq = new THREE.Quaternion(), Y_AXIS = new THREE.Vector3(0, 1, 0), _lm = new THREE.Matrix4(), _ly = new Float32Array(18 * 4);
const T_FALL = 0.45; // time for the body to topple from upright to lying
// Settled poses of a body lying on the ground, bone targets in the body's own frame: ual / uar upper arm [x, z], fal / far fore arm x, thl / thr thigh [x, z],
// shl / shr shin x, sp spine x, hd head [x, y, z], ft foot x, roll turns the body about its long axis (0 keeps it on its back / front)
const SPRAWL = [
  { ual: [0.1, 1.35], fal: -0.12, uar: [0, -1.5], far: -0.1, thl: [0.0, 0.3], shl: 0.05, thr: [-0.03, -0.36], shr: 0.08, sp: -0.05, hd: [0.1, 0.4, 0.1], ft: 0.3, roll: 0 },        // arms out, legs apart
  { ual: [0.15, 1.1], fal: -0.2, uar: [-2.85, -0.35], far: -0.25, thl: [-0.03, 0.2], shl: 0.1, thr: [-0.02, -0.22], shr: 0.1, sp: 0.04, hd: [0.05, -0.5, -0.1], ft: 0.25, roll: 0 }, // one arm out, the other thrown up over the head
  { ual: [-0.7, 0.05], fal: -1.0, uar: [-0.9, -0.05], far: -1.2, thl: [-1.05, 0.05], shl: 1.3, thr: [-0.75, -0.05], shr: 1.0, sp: 0.28, hd: [0.25, 0.1, 0.3], ft: 0.2, roll: 1.4 }, // on the side, knees drawn up
  { ual: [-2.45, 0.55], fal: -0.5, uar: [-1.5, -1.0], far: -1.25, thl: [0.08, 0.25], shl: 0.15, thr: [-0.2, -0.25], shr: 0.6, sp: -0.12, hd: [-0.15, 1.05, 0], ft: 0.4, roll: 0 },    // face down, arms up by the head
];
// presets by how the body lies; a body that was launched is always rolled onto its back or belly first (flat: no preset that turns it onto its side)
const SPRAWL_BY = { supine: [0, 0, 1, 2], prone: [3, 3, 1, 2], side: [2] }, SPRAWL_FLAT = { supine: [0, 0, 1], prone: [3, 3, 1] };

// left-arm poses of a reload, [upper x, upper z, fore x, fore z], solved so the hand sits at the magazine well / at the belt
const RL_GUN = [-1.25, -0.5, -0.45, 0.15], RL_BELT = [0.11, -0.07, -0.78, -0.43];
// left-hand channel i of a reload: base pose -> gun (s1) -> belt (s2) -> gun (s4) -> base pose (s5)
const rlMix = (i, base, s1, s2, s4, s5) => mixn(mixn(mixn(mixn(base, RL_GUN[i], s1), RL_BELT[i], s2), RL_GUN[i], s4), base, s5);

// Character faces local +z. Pivot at the feet. Returns { group, parts, bones, look, mesh, skeleton, gun, phase, steps, setGun, animate, kick, fall, flinch, setShadow, dispose }.
export function makeCharacter(look) {
  const q = look.quality || QUALITY, W = look.width || BUILD_W[look.build] || 1, H = look.height || 1, gm = garments(look), fem = !!(look.female || gm.skirtC !== null), stoop = look.elder ? 1 : 0;
  B = { parts: [], hi: q !== 'low', lk: 1 + (W - 1) * 0.6 };
  buildBody(look, W, fem, gm); buildHead(look, fem);
  const geo = mergeSkinned(B.parts); B = { parts: [], hi: true };
  // bones: positions are relative to the parent, so the parent's absolute position is subtracted
  const list = BONES.map(b => { const bone = new THREE.Bone(); bone.name = b[0]; return bone; }), abs = BONES.map(b => [b[2] * W, b[3], b[4]]);
  BONES.forEach((b, i) => { const bone = list[i]; if (b[1] < 0) bone.position.set(abs[i][0], abs[i][1], abs[i][2]); else { const p = abs[b[1]]; bone.position.set(abs[i][0] - p[0], abs[i][1] - p[1], abs[i][2] - p[2]); list[b[1]].add(bone); } });
  const bones = {}; list.forEach(b => { bones[b.name] = b; });
  list[HIPS].rotation.order = 'YXZ'; // yaw outermost: strafing, turn lean and pitch compose the way a pelvis does
  const mesh = new THREE.SkinnedMesh(geo, charMat); mesh.name = 'character'; mesh.add(list[HIPS]); list[HIPS].updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(list));
  mesh.castShadow = true; mesh.frustumCulled = true;
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 2.0); // fixed: three would otherwise freeze the bind-pose sphere and cull lying poses
  const g = new THREE.Group(); g.add(mesh); g.scale.set(H, H, H);
  const gun = new THREE.Mesh(gunGeo('pistol'), gunMat); gun.visible = false; gun.castShadow = true;
  const hips = bones.hips;
  const parts = { legL: list[TH_L], legR: list[TH_R], torso: list[SPINE], head: list[HEAD], armL: list[UA_L], armR: list[UA_R], gun, hips, chest: list[CHEST], neck: list[NECK], foreArmL: list[FA_L], foreArmR: list[FA_R], handL: list[HD_L], handR: list[HD_R], shinL: list[SH_L], shinR: list[SH_R], footL: list[FT_L], footR: list[FT_R], prop: list[PROP] };
  let gunKind = 'pistol', disposed = false, flT = 9, flX = 0, flZ = 0, flHead = false;
  const seed = Math.random() * 6.28;
  const cur = new Float32Array(HPX + 3); // the damped base pose of this person
  const ovKeep = new Float32Array(HPX + 3); // the gait overlay of the last living frame; it fades out over a few frames when the pose changes to dead / ragdoll, so a runner does not freeze its legs with a pop
  // per-person animation state: airborne / landing, arm weights, punch combo, idle weight shift
  const S = { init: false, init2: false, vw: 0, fly: 0, airT: 0, minVy: 0, wasAir: false, landT: 9, airW: 0, back: false, frL: 1, frR: 1, aw: 0, combo: 0, pPrev: 0, lastPunch: -9, side: 1, nextShift: 3 + Math.random() * 3, ovFade: 0, flail: 0 };
  // collapse: direction of the fall in the body's own frame (unit vector, x = the character's left), spring of the lagging head / arms, headshot flag
  let fLX = 0, fLZ = -1, fSp = 0, fSv = 0, fHead = false, fRoll = 0;

  // adds a settled lying pose (weight w) to the base targets
  function addSprawl(w) {
    if (w <= 0) return;
    const P = SPRAWL[ch.spr];
    tadd(UA_L, P.ual[0] * w, 0, P.ual[1] * w); tadd(FA_L, P.fal * w, 0, 0); tadd(UA_R, P.uar[0] * w, 0, P.uar[1] * w); tadd(FA_R, P.far * w, 0, 0);
    tadd(TH_L, P.thl[0] * w, 0, P.thl[1] * w); tadd(SH_L, P.shl * w, 0, 0); tadd(TH_R, P.thr[0] * w, 0, P.thr[1] * w); tadd(SH_R, P.shr * w, 0, 0);
    tadd(SPINE, P.sp * w, 0, 0); tadd(HEAD, P.hd[0] * w, P.hd[1] * w, P.hd[2] * w); const ft = (P.ft + (ch.sprProne ? 0.85 : 0)) * w; tadd(FT_L, ft, 0, 0); tadd(FT_R, ft, 0, 0); // face down the toes point away along the ground
  }
  // the gait overlay of the last living frame, fading out
  function fadeOverlay(dt) { S.ovFade *= Math.exp(-14 * dt); if (S.ovFade > 0.004) for (let i = 0; i < HPX + 3; i++) OV[i] += ovKeep[i] * S.ovFade; }

  // starts the collapse; (dx, dz) is the world direction the hit travelled (the body falls that way); with none the person goes down backwards
  function startFall(dx, dz, head, deadDir) {
    const yaw = g.rotation.y; let lx, lz;
    if (dx || dz) { lx = dx * Math.cos(yaw) - dz * Math.sin(yaw); lz = dx * Math.sin(yaw) + dz * Math.cos(yaw); } else { lx = (deadDir || 1) * 0.35; lz = -1; }
    const l = Math.hypot(lx, lz) || 1; fLX = lx / l; fLZ = lz / l; fSp = 0; fSv = 0; fHead = !!head;
    ch.dying = true; ch.fallT = 0; ch.fallDir = fLX > 0 ? 1 : -1;
    const mode = Math.abs(fLZ) >= 0.5 ? (fLZ > 0 ? 'prone' : 'supine') : 'side'; ch.setSprawl(mode);
    // Pitching about the axis (lz, 0, -lx) leaves the front of a diagonal fall half turned to the side; the body also rolls about its own long axis (its local y, applied before the
    // pitch) so that it ends exactly on its belly (front down), on its back or on its side. Derived from the pitched front vector (-lx lz, -lz, lx^2).
    let roll = mode === 'prone' ? Math.atan2(fLX, fLZ) : mode === 'supine' ? Math.atan2(-fLX, -fLZ) : Math.atan(-fLZ / (Math.abs(fLX) > 1e-3 ? fLX : 1e-3));
    if (mode !== 'side' && SPRAWL[ch.spr].roll) roll += (Math.random() < 0.5 ? -1 : 1) * HALF_PI; // the 'on its side' pose
    fRoll = roll + (Math.random() - 0.5) * 0.1;
  }

  // Dying: 0 - 0.15 s the knees buckle and the pelvis sinks, then the whole body pitches about the feet away from the hit, theta = (pi/2)(t / 0.45)^2 with a 0.06 rad
  // bounce at contact; head and arms lag on a damped spring (k 60, zeta 0.35); the limbs end in one of four sprawl poses (damped, k = 8 in applyPose).
  function poseDead(dt, state) {
    if (!ch.dying) startFall(0, 0, false, state.deadDir);
    const t = (ch.fallT += dt), tm = Math.min(1, t / T_FALL), tb = t - T_FALL;
    const th = HALF_PI * tm * tm - (tb > 0 ? 0.06 * Math.exp(-4 * tb) * Math.abs(Math.sin(tb * 15.7)) : 0);
    ch.lie = Math.sin(th);
    for (let n = dt > 0.03 ? 3 : 1, h = dt / n; n-- > 0;) { fSv += (60 * (th - fSp) - 5.4161 * fSv) * h; fSp += fSv * h; }
    const lag = (fSp - th) * (1 - sstep(0.8, 1.3, t)), ax = fLZ, az = -fLX, wb = 1 - sstep(0.16, 0.42, t), ws = sstep(0.3, 0.62, t), wa = sstep(0, 0.18, t) * (1 - ws);
    fadeOverlay(dt);
    tadd(TH_L, -0.72 * wb, 0, 0); tadd(TH_R, -0.72 * wb, 0, 0); tadd(SH_L, 1.4 * wb, 0, 0); tadd(SH_R, 1.4 * wb, 0, 0); tadd(SPINE, 0.12 * wb, 0, 0); // knees buckle
    tadd(UA_L, -0.45 * wa, 0, 0.35 * wa); tadd(UA_R, -0.45 * wa, 0, -0.35 * wa); tadd(FA_L, -0.5 * wa, 0, 0); tadd(FA_R, -0.5 * wa, 0, 0); // a reflex reach as the ground comes up
    addSprawl(ws);
    if (fHead) tadd(HEAD, -0.6 * Math.exp(-5 * t), 0, 0); // a head shot throws the head back
    oadd(HEAD, lag * ax, 0, lag * az); oadd(NECK, 0.5 * lag * ax, 0, 0.5 * lag * az); // lag < 0 while the body accelerates: the head stays behind
    oadd(UA_L, 1.5 * lag * ax, 0, 1.5 * lag * az - 0.7 * Math.abs(lag)); oadd(UA_R, 1.5 * lag * ax, 0, 1.5 * lag * az + 0.7 * Math.abs(lag)); oadd(FA_L, 0.8 * lag * ax, 0, 0); oadd(FA_R, 0.8 * lag * ax, 0, 0);
    ROOT.on = true; ROOT.solveW = 1 - sstep(0.15, 0.45, t); ROOT.q.setFromAxisAngle(_ra.set(ax, 0, az), th);
    if (fRoll) ROOT.q.multiply(_rq.setFromAxisAngle(Y_AXIS, fRoll * sstep(0.25, 0.85, t)));
  }

  // Ragdoll limbs (the rigid body itself is the caller's): state.rag 1 = in the air, the limbs flail (upper arms +-1.2 rad with 7 Hz noise, thighs +-0.5); 2 = settled, limp (a sprawl pose).
  function poseRag(dt, state) {
    const fly = state.rag === 1; S.flail = damp(S.flail, fly ? 1 : 0, 9, dt); fadeOverlay(dt);
    if (fly) {
      tadd(UA_L, -0.3, 0, 0.7); tadd(UA_R, -0.3, 0, -0.7); tadd(FA_L, -0.5, 0, 0); tadd(FA_R, -0.5, 0, 0); tadd(TH_L, -0.2, 0, 0.12); tadd(TH_R, 0.1, 0, -0.12); tadd(SH_L, 0.5, 0, 0); tadd(SH_R, 0.3, 0, 0);
      tadd(SPINE, -0.2, 0, 0); tadd(HEAD, -0.25, 0, 0);
    } else addSprawl(1);
    const fw = S.flail; if (fw < 0.01) return;
    const w = ch.t * 44, sd = seed;
    const n0 = Math.sin(w + sd) * 0.65 + Math.sin(w * 1.63 + sd * 2.1) * 0.35, n1 = Math.sin(w * 1.12 + sd * 1.7 + 2) * 0.65 + Math.sin(w * 0.71 + sd * 0.6) * 0.35;
    const n2 = Math.sin(w * 0.93 + sd * 2.9 + 4) * 0.65 + Math.sin(w * 1.41 + sd * 1.3) * 0.35, n3 = Math.sin(w * 1.27 + sd * 0.8 + 1) * 0.65 + Math.sin(w * 0.57 + sd * 2.2) * 0.35;
    oadd(UA_L, 1.2 * fw * n0, 0, 0.3 * fw * n2); oadd(UA_R, 1.2 * fw * n1, 0, -0.3 * fw * n3); oadd(FA_L, -0.35 * fw * (1 + n1), 0, 0); oadd(FA_R, -0.35 * fw * (1 + n0), 0, 0);
    oadd(TH_L, 0.5 * fw * n3, 0, 0); oadd(TH_R, 0.5 * fw * n2, 0, 0); oadd(SH_L, 0.3 * fw * (1 + n2), 0, 0); oadd(SH_R, 0.3 * fw * (1 + n3), 0, 0); oadd(HEAD, 0.15 * fw * n1, 0, 0.12 * fw * n0);
  }

  // Getting up (state.getUp 0..1; the caller turns the group from lying to upright about the pelvis): the limp sprawl gathers into a crouch, then stands.
  function poseGetUp(dt, state) {
    const u = clamp(state.getUp, 0, 1), s1 = sstep(0, 0.45, u), s2 = sstep(0.4, 1, u), cr = s1 * (1 - s2);
    fadeOverlay(dt); addSprawl(1 - s1);
    tadd(UA_L, -1.1 * cr + 0, 0, (ARM_OUT + 0.15) * s1 * (1 - s2) + ARM_OUT * s2); tadd(UA_R, -1.1 * cr, 0, -(ARM_OUT + 0.15) * s1 * (1 - s2) - ARM_OUT * s2);
    tadd(FA_L, -0.5 * cr - 0.12 * s2, 0, 0); tadd(FA_R, -0.5 * cr - 0.12 * s2, 0, 0);
    tadd(TH_L, -1.25 * cr, 0, 0.1 * cr); tadd(TH_R, -1.25 * cr, 0, -0.1 * cr); tadd(SH_L, 2.0 * cr, 0, 0); tadd(SH_R, 2.0 * cr, 0, 0);
    tadd(SPINE, 0.45 * cr, 0, 0); tadd(HEAD, -0.5 * cr, 0, 0);
  }

  // Fills the base targets (TG) and the gait overlay (OV) for a living person. Returns true when the pelvis height is solved from the feet.
  function poseLive(dt, state) {
    if (state.sitting) {
      tset(TH_L, -1.4, 0, 0.05); tset(TH_R, -1.4, 0, -0.05); tset(SH_L, 1.4, 0, 0); tset(SH_R, 1.4, 0, 0);
      tset(UA_L, -0.9, 0, ARM_OUT); tset(UA_R, -1.0, 0, -ARM_OUT); tset(FA_L, -0.5, 0, 0); tset(FA_R, -0.6, 0, 0);
      return false;
    }
    const grounded = state.grounded !== false, vy = state.vy || 0;
    let v = state.v; if (v === undefined) v = state.moving ? (state.speed || 0) * 5.6 : 0; if (!(v > 0)) v = 0;
    const aimP = clamp((state.aimPitch !== undefined ? state.aimPitch : -(state.pitch || 0)) || 0, -1.3, 1.3); // radians, positive = up (a NaN would poison the damped pose for good, so inputs are sanitised)
    const armed = gun.visible, bat = state.melee === 'bat' || (armed && gunKind === 'bat'), gren = armed && gunKind === 'grenade', gunned = armed && !bat && !gren;
    const long = state.long !== undefined ? !!state.long : gunKind === 'long', aim = !!state.aiming, aimGun = aim && gunned, punch = state.punch || 0;
    const reload = gunned && state.reload >= 0 ? state.reload : -1, rec = ch.rec;
    S.vw = S.init2 ? damp(S.vw, v, 20, dt) : v; S.init2 = true; // the blend weights follow a slightly smoothed speed, so even a speed that jumps (teleport, vehicle exit) cannot pop the pose
    const vw = S.vw, wr = sstep(2.2, 5, vw), ws = sstep(6.6, 8.4, vw), idle = 1 - sstep(0.1, 0.6, vw), gw = 1 - idle;

    // ----- airborne and landing -----
    if (grounded) { if (S.wasAir && S.minVy < -4) S.landT = 0; S.airT = 0; S.minVy = 0; } else { S.airT += dt; if (vy < S.minVy) S.minVy = vy; }
    const air = !grounded && (S.airT > 0.15 || vy < -3); S.wasAir = air;
    S.airW = damp(S.airW, air ? 1 : 0, 16, dt); S.landT = Math.min(9, S.landT + dt);
    const lf = S.landT < 0.12 ? S.landT / 0.12 : clamp(1 - (S.landT - 0.12) / 0.22, 0, 1); // landing absorb: knees give 0.12 s, then recover
    const gaitW = gw * (1 - S.airW);

    // ----- gait phase: distance driven (one step per stepLen metres), reversed when backpedalling while aiming -----
    let dirSign = 1, hyaw = 0;
    if (aim && v > 0.3 && state.moveYaw !== undefined && state.yaw !== undefined) {
      const al = wrapAngle(state.moveYaw - state.yaw) || 0; S.back = Math.abs(al) > (S.back ? 1.75 : 2.05); // about 1.9 rad with hysteresis
      if (S.back) { hyaw = wrapAngle(al - Math.PI); dirSign = -1; } else hyaw = clamp(al, -1, 1);
    } else S.back = false;
    ch.phase += dirSign * v * dt / (0.45 + 0.17 * v) * Math.PI; ch.steps = Math.floor(ch.phase / Math.PI);
    const cs = Math.cos(ch.phase), sn = Math.sin(ch.phase);
    S.aw = damp(S.aw, aim ? 1 : 0, 20, dt); S.fly = gaitW * g3(GT.flight, wr, ws) * cs * cs; // running: the pelvis rises as the legs scissor (flight), the stance foot may lift a few cm

    // ----- legs (overlay): the left thigh is furthest forward at phase 0, pi, 2 pi... = a foot contact -----
    const A = g3(GT.thigh, wr, ws), bias = g3(GT.bias, wr, ws), kSw = g3(GT.kSw, wr, ws), kSt = g3(GT.kSt, wr, ws);
    const swL = Math.max(0, -sn), swR = Math.max(0, sn);
    oadd(TH_L, gaitW * (-bias - A * cs), 0, 0); oadd(TH_R, gaitW * (-bias + A * cs), 0, 0);
    oadd(SH_L, gaitW * (kSt + (kSw - kSt) * swL), 0, 0); oadd(SH_R, gaitW * (kSt + (kSw - kSt) * swR), 0, 0);
    if (lf > 0) { oadd(TH_L, -0.5 * lf, 0, 0); oadd(TH_R, -0.5 * lf, 0, 0); oadd(SH_L, lf, 0, 0); oadd(SH_R, lf, 0, 0); }
    // ----- pelvis (overlay): twist with the stride, weight shift to the stance side, small roll; the chest counter-twists (fully while aiming) -----
    const tw = gaitW * g3(GT.twist, wr, ws);
    oadd(HIPS, 0, -tw * cs, gaitW * g3(GT.roll, wr, ws) * sn); OV[HPX] += (fem ? 0.035 : 0.02) * gaitW * sn;
    const cTw = tw * cs * (1 + 0.6 * (1 - S.aw)) * 0.5; oadd(SPINE, 0, cTw, 0); oadd(CHEST, 0, cTw, 0);

    // ----- arms: free arms swing against the legs; arms holding something or aiming stay in their pose -----
    let fl = 1, fr = 1;
    if ((aim && !gren) || punch > 0 || reload >= 0) fl = fr = 0; else if (armed) { if (long) fl = fr = 0.12; else if (bat) fr = 0.25; else if (gren) fr = 0.5; else fr = 0.25; }
    S.frL = damp(S.frL, fl, 16, dt); S.frR = damp(S.frR, fr, 16, dt);
    const aA = g3(GT.arm, wr, ws) * gaitW, aB = -0.15 * wr * gaitW, eG = (g3(GT.elbow, wr, ws) - 0.12) * gaitW, tuck = 0.06 * wr * gaitW;
    const swl = S.frL * (aA * cs + aB), swr = S.frR * (-aA * cs + aB);
    oadd(UA_L, swl, 0, -S.frL * tuck); oadd(UA_R, swr, 0, S.frR * tuck);
    oadd(FA_L, -(S.frL * eG + 0.3 * Math.max(0, -swl)), 0, 0); oadd(FA_R, -(S.frR * eG + 0.3 * Math.max(0, -swr)), 0, 0);

    // ----- hips base: strafe yaw, turn lean (the pelvis moves into the turn so the planted feet stay put), idle weight shift -----
    const roll = grounded ? -clamp((state.yawRate || 0) * v * 0.035, -0.22, 0.22) : 0; // turning left (yaw rate > 0) drops the left side
    const idleW = idle * (1 - S.airW) * (1 - 0.8 * S.aw);
    if (ch.t >= S.nextShift) { S.side = -S.side; S.nextShift = ch.t + 4 + Math.random() * 4; }
    const sh = S.side * idleW;
    tset(HIPS, 0, hyaw, roll); TG[HPX] = -0.92 * Math.sin(roll) + 0.03 * sh;
    const unL = Math.max(0, -sh), unR = Math.max(0, sh); // the leg opposite the loaded side relaxes: thigh forward, knee 0.12
    tadd(TH_L, -0.06 * unL, 0, 0.02 - 0.033 * sh); tadd(TH_R, -0.06 * unR, 0, -0.02 - 0.033 * sh); // both thighs cancel the pelvis shift so the feet stay put
    tadd(SH_L, 0.12 * unL, 0, 0); tadd(SH_R, 0.12 * unR, 0, 0);

    // ----- torso and head base -----
    const lean = gw * g3(GT.lean, wr, ws) * (1 - 0.5 * S.airW);
    let spx = 0.6 * lean, chx = 0.4 * lean + idle * (1 - S.aw) * 0.02 * Math.sin(ch.t * 1.5708 + seed), hdx = -0.55 * lean; // the chest breathes at 0.25 Hz
    spx += 0.15 * stoop; hdx -= 0.12 * stoop; // an elderly person stoops (spine 0.15 rad) and lifts the head to look ahead
    const spy = -0.5 * hyaw; let chy = spy; // spine and chest each take half of the hips' strafe yaw back, so the upper body keeps facing the aim direction
    if (aimGun) { chx -= 0.4 * aimP; hdx -= 0.5 * aimP; }
    const tp = spx + chx; // torso pitch the arm has to compensate
    flT += dt; const fe = flT < 0.7 ? Math.exp(-10 * flT) : 0;
    spx += flZ * 0.14 * fe - rec * 0.1; chx += flZ * 0.21 * fe - rec * 0.25; hdx += (flHead ? 0.5 : 0.12) * flZ * fe; // chest pitch away from the hit: 0.35 * e^(-10 t) in total
    let hdy = idleW * 0.05 * Math.sin(ch.t * 0.5 + seed * 2), nky = 0; const la = state.lookAt;
    if (la && !aim) { // look at the point, up to 1 rad (a point behind the person is ignored)
      const rel = wrapAngle(Math.atan2(la.x - g.position.x, la.z - g.position.z) - (state.yaw !== undefined ? state.yaw : g.rotation.y));
      if (Math.abs(rel) < 2.4) { const hy = clamp(rel, -1, 1); nky = hy * 0.3; hdy = hy * 0.7; }
    }

    // ----- arm targets: rest, carried item, aim, punch / swing, air, reload -----
    let ulx = 0, ulz = ARM_OUT, flx = -0.12, flz = 0, urx = 0, urz = -ARM_OUT, frx = -0.12, frz = 0, tilt = 0;
    if (armed) {
      if (bat) { urx = -0.5; frx = -0.9; urz = -0.04; } else if (gren) { urx = -0.25; frx = -0.8; urz = -0.06; }
      else if (long) { urx = -0.55; frx = -1; urz = 0.04; ulx = -0.9; ulz = -0.55; flx = -0.85; } else { urx = -0.4; frx = -0.8; urz = 0.04; }
    }
    if (air) { // free arms go out for balance (upper arms out on z +-0.5)
      if (!(armed && long)) { ulx = -0.25; ulz = 0.5; flx = -0.35; }
      if (!armed) { urx = -0.25; urz = -0.5; frx = -0.35; }
    }
    if (aimGun) { // gun arm bent so the support hand can reach the gun (hand positions solved against the skeleton); the body is bladed, left shoulder forward
      const f0 = long ? -0.5 : -0.35;
      chy += long ? -0.3 : -0.25;
      urx = -HALF_PI - aimP - tp - f0 - rec * 0.5; urz = long ? 0.35 : 0.3; frx = f0 - rec * 0.25; frz = 0;
      ulx = urx + (long ? -0.28 : -0.15); ulz = long ? -0.23 : -0.28; flx = -0.05; flz = 0;
    } else if (aim && bat) { urx = -0.9; frx = -1.6; urz = -0.1; ulx = -1.14; ulz = -0.78; flx = -0.57; flz = -0.25; } // bat held ready at the shoulder, two-handed
    if (punch > 0) {
      const p = punch;
      if (bat) { // horizontal swing, right to left: wind up on the right side, whip across the front, follow through
        const w = sstep(0, 0.15, p) * (1 - sstep(0.62, 1, p));
        chy += mixn(mixn(mixn(0, -0.9, sstep(0, 0.15, p)), 0.9, sstep(0.15, 0.58, p)), 0, sstep(0.58, 1, p)); spx += 0.12 * w;
        const sw = sstep(0.15, 0.58, p);
        urx = mixn(urx, mixn(-1, -1.35, sw), w); urz = mixn(urz, mixn(-0.25, 0.1, sw), w); frx = mixn(frx, mixn(-0.9, -0.3, sw), w);
        ulx = mixn(ulx, mixn(-1.41, -1.48, sw), w); ulz = mixn(ulz, mixn(-0.84, -0.6, sw), w); flx = mixn(flx, -0.05, w); flz = mixn(flz, 0, w); // off hand on the grip (solved per pose)
      } else if (gren) { // overhand throw (the grenade leaves the hand as the throw starts): the arm snaps up and forward, follows through, recovers
        const up = sstep(0, 0.12, p), fw = sstep(0.12, 0.34, p), rc = sstep(0.34, 1, p), w = up * (1 - rc);
        chy += mixn(0.1, 0.35, up) * w; spx += mixn(0, 0.12, fw) * w;
        urx = mixn(urx, mixn(-2.4, -1.1, fw), w); frx = mixn(frx, mixn(-0.4, -0.2, fw), w); urz = mixn(urz, -0.15, w); ulx = mixn(ulx, -1, w); ulz = mixn(ulz, -0.5, w);
      } else { // jab: chamber (0 - 0.12), extend (0.12 - 0.22), recover; the arms alternate, the other one guards
        const R = S.combo === 0, c1 = sstep(0, 0.12, p), ex = sstep(0.12, 0.22, p), rc = sstep(0.22, 1, p), gw2 = c1 * (1 - rc);
        const bu = R ? urx : ulx, bf = R ? frx : flx, bz = R ? urz : ulz, gu = R ? ulx : urx, gf = R ? flx : frx, gz = R ? ulz : urz;
        const pu = mixn(mixn(mixn(bu, -1.2, c1), -1.55, ex), bu, rc), pf = mixn(mixn(mixn(bf, -1.6, c1), -0.1, ex), bf, rc), pz = mixn(bz, R ? 0.05 : -0.05, gw2);
        const au = mixn(gu, -0.9, gw2), af = mixn(gf, -1.3, gw2), az = mixn(gz, R ? -0.25 : 0.25, gw2);
        if (R) { urx = pu; frx = pf; urz = pz; ulx = au; flx = af; ulz = az; } else { ulx = pu; flx = pf; ulz = pz; urx = au; frx = af; urz = az; }
        chy += mixn(mixn(0, R ? -0.2 : 0.2, c1), R ? 0.45 : -0.45, ex) * (1 - rc); spx += 0.08 * gw2; // the punching shoulder drives forward
      }
    }
    if (reload >= 0) { // pistol / long gun: tilt the gun in, left hand to the magazine, down to the belt for a new one, back to the gun, away
      const r = reload; tilt = sstep(0, 0.15, r) * (1 - sstep(0.82, 1, r));
      const s1 = sstep(0.05, 0.25, r), s2 = sstep(0.25, 0.5, r), s4 = sstep(0.55, 0.78, r), s5 = sstep(0.82, 1, r);
      ulx = rlMix(0, ulx, s1, s2, s4, s5); ulz = rlMix(1, ulz, s1, s2, s4, s5); flx = rlMix(2, flx, s1, s2, s4, s5); flz = rlMix(3, flz, s1, s2, s4, s5);
      urx = mixn(urx, -1, tilt); urz = mixn(urz, 0.5, tilt); frx = mixn(frx, -1.1, tilt); frz = mixn(frz, 0, tilt); spx += 0.06 * tilt; // the gun comes in to the chest, canted
    }
    tset(UA_L, ulx, 0, ulz); tset(FA_L, flx, 0, flz); tset(UA_R, urx, 0, urz); tset(FA_R, frx, 0, frz);
    tset(PROP, 0, (aimGun ? (long ? 0.15 : 0.1) : 0) + tilt * 0.6, 0); // roll: cancels the tilt the bladed arm puts on an aimed gun; canted in a reload
    // fold the torso and head targets in (spine/chest yaw also carries the counter-rotation of the hips)
    tadd(SPINE, spx, spy, 0); tadd(CHEST, chx, chy, 0); tset(NECK, 0, nky, 0); tset(HEAD, hdx, hdy, 0);
    tadd(SPINE, 0, 0, -flX * 0.14 * fe); tadd(CHEST, 0, 0, -flX * 0.21 * fe); if (flHead) tadd(HEAD, 0, 0, -flX * 0.25 * fe); tadd(TH_L, -0.1 * fe, 0, 0); tadd(TH_R, -0.1 * fe, 0, 0); tadd(SH_L, 0.2 * fe, 0, 0); tadd(SH_R, 0.2 * fe, 0, 0); // roll away from the hit, a head shot also rolls the head; the knees dip (the pelvis follows the feet)
    // stance legs when airborne: one knee up, one trailing
    if (air) { tset(TH_L, -0.5, 0, 0.02); tset(TH_R, 0.15, 0, -0.02); tset(SH_L, 1, 0, 0); tset(SH_R, 0.4, 0, 0); }
    return true;
  }

  // Damps the base pose toward TG, adds the gait overlay, writes the bones, levels the feet and (when `solve`) puts the pelvis where the lowest foot touches y = 0.
  function applyPose(dt, kU, kL, snap, solve, autoFoot) {
    const fU = snap ? 1 : 1 - Math.exp(-kU * dt), fL = snap ? 1 : 1 - Math.exp(-kL * dt);
    for (let i = 0; i < NB; i++) {
      const k = i * 3, f = i >= SPINE && i <= PROP ? fU : fL;
      cur[k] += (TG[k] - cur[k]) * f; cur[k + 1] += (i === HIPS ? wrapAngle(TG[k + 1] - cur[k + 1]) : TG[k + 1] - cur[k + 1]) * f; cur[k + 2] += (TG[k + 2] - cur[k + 2]) * f;
      list[i].rotation.set(cur[k] + OV[k], cur[k + 1] + OV[k + 1], cur[k + 2] + OV[k + 2]);
    }
    for (let c = 0; c < 3; c++) cur[HPX + c] += (TG[HPX + c] - cur[HPX + c]) * fL;
    const hx = cur[HIPS * 3] + OV[HIPS * 3], hz = cur[HIPS * 3 + 2] + OV[HIPS * 3 + 2]; let reach = 0;
    for (let l = 0; l < 2; l++) { // feet stay level with the ground (80 % of the leg tilt is cancelled; the toes drop at push-off), reach = how far the sole hangs below the hip
      const L = LEGS[l], kt = L[0] * 3, ks = L[1] * 3, kf = L[2] * 3, a = hx + cur[kt] + OV[kt], s = a + cur[ks] + OV[ks];
      const fx = autoFoot ? -0.8 * s : cur[kf] + OV[kf]; if (autoFoot) { list[L[2]].rotation.x = fx; cur[kf] = fx - OV[kf]; } // the damped state follows the levelled foot, so a death / ragdoll / get-up pose starts from the real angle
      if (solve) reach = Math.max(reach, legReach(a, s, s + fx));
    }
    let hy = solve ? mixn(reach * Math.cos(hz) + HIP_DROP + S.fly, REST_HIPS_Y, S.airW) : REST_HIPS_Y;
    if (ROOT.on) hy = mixn(REST_HIPS_Y, hy, ROOT.solveW); // dying: the feet carry the pelvis only while the knees buckle
    hips.position.set(cur[HPX] + OV[HPX], hy + cur[HPX + 1] + OV[HPX + 1], cur[HPX + 2] + OV[HPX + 2]);
    if (ROOT.on) { hips.quaternion.premultiply(ROOT.q); hips.position.applyQuaternion(ROOT.q); hips.position.y += 0.13 * ch.lie; } // the whole body pivots about the feet (the origin of the group); a lying body's thickness lifts it off the ground
  }

  const ch = { group: g, parts, bones, look, mesh, skeleton: mesh.skeleton, gun, phase: 0, steps: 0, t: 0, rec: 0, dying: false, fallT: 0, fallDir: 1, lie: 0, spr: 0, sprProne: false,
    setGun(v, kind) {
      gun.visible = !!v; if (v) { if (!gun.parent) bones.prop.add(gun); } else if (gun.parent) gun.parent.remove(gun); // a hidden item leaves the hierarchy (no matrix updates, and it never counts in a bounding box)
      const k = GUN_POSE[kind] ? kind : 'pistol'; gunKind = k; gun.geometry = gunGeo(k);
      const p = GUN_POSE[k]; gun.position.set(p[0], p[1], p[2]); gun.rotation.set(p[3], p[4], p[5]);
    },
    // recoil impulse in radians: raises the muzzle and rocks the torso back, decays by itself (k = 14)
    kick(a) { ch.rec = Math.min(0.6, ch.rec + (a === undefined ? 0.1 : a)); },
    // Start the collapse. (dx, dz) is the world direction the hit travelled: the body pitches about the feet that way (knees buckle first, head and arms lag on a spring,
    // then one of four sprawl poses; the lag rings out by about 1.3 s). A head shot throws the head back. Without a direction the person goes down backwards. animate({ dead: true }) continues it.
    fall(dx, dz, head) { if (!ch.dying) startFall(dx, dz, head, 1); },
    // Brief hit reaction on a standing person: chest pitch / roll away from the hit of 0.35 * e^(-10 t) rad, a head snap (0.5 rad on a head shot) and a small knee dip.
    // (The 0.15 m stagger is a position change and belongs to the caller.)
    flinch(dx, dz, headShot) { const yaw = g.rotation.y, lx = (dx || 0) * Math.cos(yaw) - (dz || 0) * Math.sin(yaw), lz = (dx || 0) * Math.sin(yaw) + (dz || 0) * Math.cos(yaw), l = Math.hypot(lx, lz) || 1; flX = lx / l; flZ = lz / l; flHead = !!headShot; flT = 0; },
    // chooses the settled lying pose for a body that ended 'supine' (on its back), 'prone' (face down) or on its 'side' ('flat' leaves out the poses that roll the body onto its side)
    setSprawl(mode, flat) { ch.sprProne = mode === 'prone'; const l = (flat ? SPRAWL_FLAT : SPRAWL_BY)[mode] || SPRAWL_BY.supine; ch.spr = l[Math.floor(Math.random() * l.length)]; },
    // the lowest world y of the posed mesh (every vertex, skinned; one pass over ~2.5k vertices, meant to be called once when a body has come to rest)
    lowestY() {
      g.updateMatrixWorld(true); const bi = mesh.skeleton.boneInverses;
      for (let i = 0; i < NB; i++) { _lm.multiplyMatrices(list[i].matrixWorld, bi[i]); const e = _lm.elements; _ly[i * 4] = e[1]; _ly[i * 4 + 1] = e[5]; _ly[i * 4 + 2] = e[9]; _ly[i * 4 + 3] = e[13]; }
      const A = geo.attributes, P = A.position.array, SI = A.skinIndex.array, SW = A.skinWeight.array, n = A.position.count; let lo = Infinity;
      for (let v = 0; v < n; v++) {
        const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2]; let Y = 0;
        for (let k = 0; k < 4; k++) { const w = SW[v * 4 + k]; if (w > 0) { const b = SI[v * 4 + k] * 4; Y += w * (_ly[b] * x + _ly[b + 1] * y + _ly[b + 2] * z + _ly[b + 3]); } }
        if (Y < lo) lo = Y;
      }
      if (gun.parent) { const e = gun.matrixWorld.elements, GP = gun.geometry.attributes.position.array; for (let v = 0; v < GP.length; v += 3) { const Y = e[1] * GP[v] + e[5] * GP[v + 1] + e[9] * GP[v + 2] + e[13]; if (Y < lo) lo = Y; } } // a held item counts too
      return lo;
    },
    setShadow(on) { mesh.castShadow = !!on; gun.castShadow = !!on; },
    // state: { v (m/s, absolute), grounded, vy, moveYaw, yaw, yawRate, aiming, aimPitch (rad, positive = up), long, punch 0..1, melee 'fist'|'bat',
    //          reload 0..1 or -1, dead, deadDir, sitting, lookAt {x, z}, rag (0 none, 1 flying ragdoll, 2 limp ragdoll), getUp (0..1 while rising from the ground) }.
    //          The old keys { moving, speed (0..1), pitch } still work when v / aimPitch are absent.
    animate(dt, state) {
      dt = dt > 0 ? Math.min(dt, 0.1) : 0; ch.t += dt; TG.fill(0); OV.fill(0); ROOT.on = false; ch.rec *= Math.exp(-14 * dt);
      let snap = false; if (!S.init) { S.init = true; snap = true; }
      if (state.dead && !state.rag) { poseDead(dt, state); applyPose(dt, 8, 8, snap, true, false); return; } // the collapse is damped with k = 8
      if (state.rag) { if (state.dead && !ch.dying) ch.dying = true; poseRag(dt, state); applyPose(dt, state.rag === 1 ? 12 : 8, 12, snap, false, false); return; }
      if (ch.dying) { ch.dying = false; ch.lie = 0; fSp = 0; fSv = 0; snap = true; } // back from the dead: stand up at once
      if (state.getUp > 0) { poseGetUp(dt, state); applyPose(dt, 14, 14, snap, false, false); return; }
      const solve = poseLive(dt, state), fast = state.aiming || ch.rec > 0.02 || state.punch > 0 || state.reload >= 0;
      ovKeep.set(OV); S.ovFade = 1; applyPose(dt, fast ? 28 : 16, 16, snap, solve, true); // k = 16 normally, 28 for aim and recoil
    },
    dispose() {
      if (disposed) return; disposed = true;
      geo.dispose(); if (mesh.skeleton) mesh.skeleton.dispose(); // never the shared materials or the shared gun geometries
    } };
  ch.setGun(false, 'pistol');
  return ch;
}
