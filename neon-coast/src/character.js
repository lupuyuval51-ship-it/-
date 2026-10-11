import * as THREE from '../vendor/three.module.min.js';
import { clamp, damp, wrapAngle, mulberry } from './utils.js';

// ---------------------------------------------------------------------------------------------------------------------
// BODY MODEL (release 3, P1). People are ONE THREE.SkinnedMesh on a shared vertex-coloured material (24 bones), so a person costs 1 draw call, +1 for the shadow pass, +2 more when armed.
//   units    metres, +y up, the character faces +z, +x is the character's LEFT. The bind pose is a 1.73 m adult (crown 1.728); look.height scales the whole group (1.55 m = 0.893 .. 1.95 m = 1.124). The head is 7.5 (man) / 7.7 (woman) heads tall.
//   bodies   built from LOFTS (rings swept along the trunk, neck, arms and legs; section "BODY MODEL") from a body spec = sex x build (slim | average | athletic | heavy) x width residual: a man's shoulders : waist : hips are
//            about 1.5 : 0.85 : 1, a woman's 1.2 : 0.65 : 1; bust / pectoral and glute bumps, belly, trapezius line, tapered deltoid / biceps / forearm / thigh / calf / ankle sections (bodySpec(), tables TK0 / AK0 / LK0).
//   joints   skin weights are blended over 12 cm at the elbow, 14 cm at the knee and hip, 9 cm at the shoulder, 6 cm at the wrist and 5.5 cm at the ankle, with extra rings there; the groin follows the thighs (pelvisSkin).
//   hands    palm, four fingers (two phalanges, one curl bone pair per hand), thumb; modelled RELAXED (finger / fingerTip / thumb rotation 0), ch curls them: poseLive -> setHand() (grip, fist, reload). feet: shoes on one last
//            (sole flat on y = 0 from the heel z = -0.07 to the toe z = 0.25, toe cap, heel counter, laces) or a bare foot with toes; sneakers | boots | dress | sandals.
//   skin     vertex colours only: base tone x a per-person nuance (look._tone), shadows shift red and highlights yellow (undertone), blush at knuckles, knees, elbows, toes, 3D value-noise mottling, optional freckles
//            (look.freckles). One material, no textures.
//   layers   skin 0 -> trousers / skirt (LAYER.bottom) -> shirt (LAYER.top) -> jacket (LAYER.outer) -> armour (LAYER.armor): every garment is the SAME ring surface as the skin offset by its layer with the same skin
//            weights, so cloth follows the body through bends, layers never touch (no z-fighting) and skin never shows through at a joint. A new garment = shell(mk, ys, seg, off, colour, opts) with torsoRing /
//            armRing / legRing (exported) and the stations stn(y0, y1, step, joints); decals use frontZ / backZ. Sleeves hug the arm (SLV), a hoodie is baggier.
//   LOD      3 levels from one code path (LOD 0 ~5.5k vertices: fingers, laces, 16 / 10 radial segments; LOD 1 ~3k; LOD 2 ~1.7k), chosen per person by the distance to the camera of the last render (ch.setLod / ch.autoLod to
//            override) and by the quality tier; the body skin of a (sex, build, width, LOD) is built once and shared, a person only adds its clothes, head and vertex colours. Nothing is built until the first animate.
//   anchors  bones hips spine chest neck head, upperArm / foreArm / hand .L / .R, prop (the centre of the fist: held items), finger / fingerTip / thumb .L / .R, thigh / shin / foot .L / .R; ANCHORS lists the points.
// Everything below the head is built here; heads, hair and headwear are in buildHead (bound to the head bone, scaled by HEAD_SCALE about the neck).
// ---------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------
// FACES, HAIR AND CLOTHING (release 3, P2). Sections below, in file order:
//   SURFACES  the shared material is no longer flat: a fragment patch adds FABRIC (a 23-layer tileable texture array, triplanar from the bind-pose position: denim twill, knit ribs, leather grain, ripstop, herringbone,
//             piqué, straw ...) with a roughness swing and a bump, and a FACE ATLAS (canvas, drawn once: 8 expressions x 5 face kinds, 6 eye lid states x 2 sexes, 3 hair strand cells). Still one draw call per person.
//   THE HEAD  a sculpted head grid (jaw, cheekbones, brow ridge, orbits, lips, philtrum, chin), a nose, ears and eyes (sclera, iris, pupil, catch-lights, lids and lashes are painted); expressions and blinks only
//             rewrite the UVs of the face vertices: ch.setExpression('smile' | 'angry' | 'scared' | 'pained' | 'dead' | 'talk' | 'laugh' | 'neutral', holdSeconds), ch.setBlink(bool), ch.expression.
//   HAIR      20 styles as layered shells, curtains, tubes, curls and tapered ribbon locks over the head surface, cached as templates (bald buzz crop fade short sidepart slick quiff pixie balding curly afro long wavy
//             pony bun bob braids locs mohawk), strand textures with roots, highlights and cut-out tips; facial hair (stubble painted; moustache, goatee, short, full beard, chinstrap as shells).
//   WEAR      headwear (cap, beanie, peaked cap, sun hat, hard / fire / moto / SWAT helmets, toque, headband, bandana, hood, headphones), glasses, sunglasses, earrings; a wardrobe of 19 tops and 11 bottoms with hems,
//             collars, plackets, pockets, buttons, zips, folds and quilting, 5 shoe types, and accessories (scarf, bag, backpack / delivery box, apron, hi-vis, reflective bands, duty belt, lanyard, stethoscope ...).
//   DIRECTOR  randomLook(ctx) draws an archetype from place and time (ctx: zone, district, hour, rain, cold, hot, weekend) and builds a coherent outfit; LOOKS holds the player, the law and 17 uniforms
//             (shopkeeper gunsmith cashier chef doctor nurse paramedic firefighter towDriver busDriver courier guard banker tourist clubber jogger mechanic); uniformLook(kind) returns a varied person in one.
// ---------------------------------------------------------------------------------------------------------------------
const charMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.02 });
const gunMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.5 });
const TAU = Math.PI * 2, HALF_PI = Math.PI / 2;
const col = c => (c && c.isColor ? c : new THREE.Color(c));
const mix = (a, b, t) => col(a).clone().lerp(col(b), t);
const shade = (a, k) => col(a).clone().multiplyScalar(k);

export const SKINS = [0xf1c7a8, 0xd9a47e, 0xb97c55, 0x8a5a3c, 0x5c3a25, 0xffd9b8, 0xe8b894, 0xf7d8c4, 0xe3b08a, 0xc99263, 0xa76d48, 0x74452c, 0x4a2d1e, 0xd6a98a]; // Fitzpatrick I..VI with warm, rosy and olive undertones; skinInfo() derives shadow warmth and blush from each
export const SHIRTS = [0xffffff, 0x1c2540, 0xd1345b, 0x2aa198, 0xf5c542, 0x7b4fbf, 0x2f2f2f, 0xff7f50, 0x8fd18b, 0xe8e0d0, 0xff4fa3, 0x3ce8f5, 0xff9a3c, 0x9ad0ff];
export const PANTS = [0x22304a, 0x1a1a1a, 0x7a6a55, 0x3a3f4a, 0x50607a, 0xc9c1b1, 0x5a3a2a, 0x2f3b6a];
export const HAIRS = [0x1a120e, 0x3b2716, 0x6b4a2b, 0xd9b27a, 0x2b2b2b, 0xa33a2a, 0xffffff, 0xff4fa3, 0x3ce8f5];
const EYES = [0x3b78c4, 0x3f9a5c];
const pick = a => a[Math.floor(Math.random() * a.length)];

// Level of detail of newly built people. game.js calls setCharacterQuality(settings.quality); until it does, the saved
// setting is read once so the first people already match the player's choice.
let QUALITY = 'high';
try { const s = JSON.parse(localStorage.getItem('neoncoast.settings') || '{}'); if (s.quality === 'low' || s.quality === 'med' || s.quality === 'high') QUALITY = s.quality; } catch (e) { /* no storage: stay on high */ }
export function setCharacterQuality(q) { if ((q === 'low' || q === 'med' || q === 'high') && q !== QUALITY) { QUALITY = q; charMat.needsUpdate = true; } } // the shader differs on the low tier (no triplanar, no bump)


// ---------- wardrobe vocabulary ----------
// Garment enums a look may set (all optional; looks written before them keep working, see garments() in the clothes section):
//   top     tee | polo | longsleeve | tank | hoodie | shirt | sweater | scrubs | overalls | dress | bare | layered over a shirt: jacket | leather | puffer | blazer | labcoat | chefcoat | turnout | paramedic
//   bottom  jeans | chinos | shorts | skirt | pencil | sweatpants | trunks | cargo | leggings | suit | work         shoeType  sneakers | boots | dress | sandals | heels
//   head    cap (+ capBack) | beanie | hat (peaked) | helmet ('swat' | 'moto' | 'fire' | 'hard') | toque | headband | bandana | band | hoodUp | headphones | glasses | sunglasses (+ frame) | earrings
//   body    chain watch bracelet necklace scarf bag backpack (+ delivery) tie lanyard stethoscope apron (+ apronStripe) hivis reflect dutyBelt armor vestStripe badge stripe belt | sleeves ('short' | 'long' | 'rolled')
//   cloth   plaid (shirt), pinstripe (blazer, suit trousers), satin (dress, skirt), denim (shorts), open (false zips a jacket)
//   person  build slim | average | athletic | heavy, elder, female, height, width, beard ('full' | 'short' | 'goatee' | 'moustache' | 'chinstrap' | 'stubble'), lipstick (true | colour), eye (iris colour), freckles, hairStyle, hair
//   hairStyle  bald buzz crop fade short sidepart slick quiff pixie balding curly afro long wavy pony bun bob braids locs mohawk
const BUILD_W = { slim: 0.86, average: 1, athletic: 1.02, heavy: 1.2 };
const TOPS = ['tee', 'polo', 'longsleeve', 'tank', 'hoodie', 'shirt', 'sweater', 'jacket', 'leather', 'puffer', 'blazer', 'labcoat', 'chefcoat', 'turnout', 'paramedic', 'overalls', 'scrubs', 'dress', 'bare'];
const BOTTOMS = ['jeans', 'chinos', 'shorts', 'skirt', 'sweatpants', 'trunks', 'cargo', 'leggings', 'suit', 'pencil', 'work'];
const SHOE_TYPES = ['sneakers', 'boots', 'dress', 'sandals', 'heels'];
// curated palettes (the last 7 are brighter sets, lime, sky, mustard, violet, rust): [main top, second layer / contrast top, accent (cap, bag, shoes, tie), spare]
const PALETTES = [
  [0xf5f0e6, 0x1c2540, 0xd1345b, 0x2f2f2f], [0xff7f50, 0x2b2f3a, 0xf5c542, 0xffffff], [0x2aa198, 0xe8e0d0, 0x1c2540, 0xff9a3c], [0x7b4fbf, 0x2f2f2f, 0xf5f0e6, 0xff4fa3],
  [0x8fd18b, 0x3d5a80, 0xffffff, 0x1a1a1a], [0xff4fa3, 0x14161c, 0x3ce8f5, 0xffffff], [0x1c2540, 0xd9d4c7, 0xa33a2a, 0xf5c542], [0xf5c542, 0x2b2b2b, 0xffffff, 0x2aa198],
  [0x3ce8f5, 0x1c2540, 0xff9a3c, 0xffffff], [0xd1345b, 0xf2efe6, 0x2f2f2f, 0x8fd18b], [0x9ad0ff, 0x3d5a80, 0xe8e0d0, 0xff7f50], [0x2f2f2f, 0x7a7a82, 0xff4fa3, 0x3ce8f5],
  [0xe8e0d0, 0x5a3a2a, 0x2aa198, 0xf5c542], [0xff9a3c, 0x1c2540, 0xf2efe6, 0x7b4fbf],
  // brighter and louder sets for the street and the beach: lime, sky, mustard, violet, rust
  [0xf5c542, 0x3ce8f5, 0x14161c, 0xffffff], [0x6ec1e4, 0xff7f50, 0x2f2f2f, 0xffffff], [0xa33a2a, 0xe8d9a0, 0x2b6cb0, 0xf5c542], [0x5b3a8c, 0xf5c542, 0x3ce8f5, 0xffffff],
  [0x2b6cb0, 0xff9a3c, 0xf2efe6, 0x8fd18b], [0xd9742a, 0x2aa198, 0x14161c, 0xf2efe6], [0xc4e05a, 0x7b4fbf, 0x1c2540, 0xff4fa3],
];
const NEON = [0xff4fa3, 0x3ce8f5, 0x7b4fbf, 0x2eff7a, 0xffd34e, 0xff5a3c], MUTED = [0x5a6a7a, 0x7a6a55, 0x8a7a6a, 0x4a5a4a, 0x6a5a6a, 0x9a9a8a, 0x3d5a80, 0x7a4a3a, 0xb8a98a];
const DENIM = [0x2b3a5c, 0x3d5a80], KHAKI = 0xb8a67e, GREY_PANTS = 0x5a5f6a, BLACK_PANTS = 0x1a1a1a, ELDER_HAIR = [0xe8e8e8, 0xffffff, 0xbdbdbd, 0x9a9a9a, 0xcfcfcf];
const wpick = list => { let t = 0; for (const e of list) t += e[1]; let r = Math.random() * t; for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; } return list[0][0]; };
const dark = (c, k) => shade(c, k).getHex();
const chance = p => Math.random() < p;
const HAIR_NATURAL = [[0x1a120e, 0.22], [0x2b2b2b, 0.08], [0x3b2716, 0.16], [0x6b4a2b, 0.15], [0xd9b27a, 0.13], [0xc9a46a, 0.08], [0xa33a2a, 0.07], [0x8a6a42, 0.07], [0x7a3b1e, 0.04]], HAIR_DYED = [0xff4fa3, 0x3ce8f5, 0x7b4fbf, 0x2eff7a, 0xff9a3c, 0xffffff];
const STYLES = { // hair styles by sex and archetype (weights)
  m: { casual: [['short', 2], ['crop', 1.4], ['fade', 1.6], ['sidepart', 1.6], ['buzz', 1], ['curly', 2.2], ['quiff', 1], ['slick', 0.8], ['afro', 1], ['long', 1.2], ['locs', 0.9], ['bald', 0.8], ['pony', 0.5]], business: [['sidepart', 3], ['slick', 2], ['short', 2], ['crop', 1.5], ['fade', 1.5], ['buzz', 0.6], ['bald', 0.6]],
    sporty: [['buzz', 2], ['crop', 2], ['fade', 2], ['short', 2], ['curly', 1], ['bald', 0.5], ['pony', 0.3]], night: [['quiff', 2], ['slick', 2], ['mohawk', 0.8], ['fade', 2], ['curly', 1], ['long', 1], ['locs', 0.8], ['crop', 1]], elder: [['short', 3], ['balding', 3], ['bald', 2], ['buzz', 1], ['sidepart', 2]] },
  f: { casual: [['long', 3], ['wavy', 2], ['pony', 2], ['bun', 1.4], ['bob', 1.6], ['pixie', 1], ['curly', 1.2], ['braids', 0.8], ['afro', 0.7], ['short', 0.8]], business: [['bob', 2.5], ['bun', 2], ['long', 2], ['pony', 1.5], ['pixie', 1], ['wavy', 1]], sporty: [['pony', 3], ['bun', 2], ['braids', 1], ['pixie', 1], ['short', 0.6]],
    night: [['long', 3], ['wavy', 2], ['bob', 1.5], ['pixie', 1], ['pony', 1], ['braids', 1], ['curly', 1]], elder: [['bun', 3], ['short', 2.5], ['pixie', 1.5], ['bob', 1.5], ['curly', 1.5]] },
};
// Reads the context: { zone: 'beach' | 'city' | 'park' | 'club' ..., district, hour (0 .. 24), rain, cold, hot, season, weekend }
function readCtx(ctx) {
  ctx = ctx || {}; const hour = Number.isFinite(ctx.hour) ? ctx.hour : 12, night = hour >= 20 || hour < 5, evening = hour >= 17 && hour < 20, beach = ctx.zone === 'beach', rain = !!ctx.rain;
  const cold = !!(ctx.cold || ctx.season === 'winter' || (Number.isFinite(ctx.temp) && ctx.temp < 8)), hot = !cold && !!(ctx.hot || ctx.season === 'summer' || beach || (Number.isFinite(ctx.temp) && ctx.temp > 27));
  return { hour, night, evening, day: hour >= 7 && hour < 17, rain, cold, hot, beach, zone: ctx.zone || 'city', district: ctx.district || '', weekend: !!ctx.weekend, warm: !rain && !night && !cold };
}
function archetype(c, elder) {
  if (elder) return 'elder';
  const w = { casual: 0.30, business: 0.09, sporty: 0.06, street: 0.12, night: 0.03, beach: 0, tourist: 0.05, worker: 0.07, student: 0.08, smart: 0.10 };
  if (c.beach) { w.beach = 0.5; w.tourist = 0.14; w.sporty = 0.12; w.business = 0; w.worker = 0.01; w.smart = 0.02; w.casual *= 0.5; w.street *= 0.4; }
  if (c.zone === 'park') { w.sporty = 0.2; w.student *= 1.3; w.worker *= 0.4; }
  if (c.zone === 'club' || c.district === 'nightlife') w.night += 0.3;
  if (c.district === 'financial' || c.district === 'downtown') { if (c.day && !c.weekend) w.business = 0.36; w.smart += 0.06; }
  if (c.district === 'port' || c.district === 'industrial') { w.worker = 0.3; w.business = 0.02; }
  if (c.night) { w.night += 0.25; w.street += 0.08; w.business *= 0.25; w.beach *= 0.15; w.tourist *= 0.5; w.worker *= 0.3; w.sporty *= 0.3; w.student *= 0.5; } else if (c.evening) { w.night += 0.12; w.smart += 0.05; w.business *= 0.6; }
  if (c.rain) { w.beach = 0; w.sporty *= 0.5; }
  let t = 0; for (const k in w) t += w[k]; let r = Math.random() * t; for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return 'casual';
}
// A random pedestrian. ctx = { zone, district, hour, rain, cold, hot, season, weekend } shapes the wardrobe: an archetype is drawn (casual, smart, business, sporty, street, nightlife, beach, tourist, worker, student, elder) from
// the place and time, and a coherent outfit built from it (a business person wears a blazer, suit trousers or a pencil skirt, dress shoes or heels and carries a bag; a beach goer tank top, shorts, sandals, sunglasses and a
// sun hat; rain and cold bring jackets, puffers, hoods, scarves and beanies; nights bring darker clothes and neon). Hair, beard, make-up, glasses and jewellery follow sex, age and archetype. No child models.
export function randomLook(ctx) {
  const c = readCtx(ctx), female = chance(0.46), elder = chance(0.12), A = archetype(c, elder); let build = wpick([['slim', 0.25], ['average', 0.32], ['athletic', 0.18], ['heavy', 0.25]]); if (elder && build === 'athletic') build = 'average';
  const pal = pick(PALETTES), dim = c.night ? 0.62 : 1, bright = A === 'beach' ? 1 : dim, P0 = dark(pal[0], bright), P1 = dark(pal[1], dim), P2 = dark(pal[2], bright), P3 = dark(pal[3], bright), neon = pick(NEON);
  const o = { female, elder, build }, M = !female;
  const top = (list) => wpick(list), pickC = (...l) => pick(l);
  // ----- garments by archetype -----
  const cool = c.rain || c.cold || (c.night && chance(0.5));
  switch (A) {
    case 'business': {
      const suit = chance(0.78), tie = M && chance(0.85);
      o.top = suit ? 'blazer' : cool ? 'jacket' : 'shirt'; o.jacket = suit || cool ? pick([0x1c2540, 0x2f2f2f, 0x3a3f4a, 0x5a3a2a, 0x7a7a82, 0x14161c]) : undefined; o.shirt = pick([0xffffff, 0xf2efe6, 0xcfe3f5, 0xe8d8e0, 0x9ad0ff]); o.pinstripe = chance(0.25);
      o.bottom = female ? (chance(0.5) ? 'pencil' : 'suit') : 'suit'; o.pants = o.top === 'blazer' && chance(0.7) ? o.jacket : pick([0x1c2540, 0x2f2f2f, 0x3a3f4a, 0x14161c]); if (o.bottom === 'pencil') o.skirt = o.pants;
      o.tie = tie ? pick([0xb0122a, 0x1c2540, 0x2f2f2f, P2, 0x2a6fd6]) : undefined; if (!suit && o.top === 'shirt' && tie) o.top = 'shirt';
      o.shoeType = female && chance(0.55) ? 'heels' : 'dress'; o.shoes = pick([0x15110e, 0x15110e, 0x4a2a1a, 0x14161c]); if (female && chance(0.5)) o.bag = pick([0x15110e, 0x5a3a2a, 0x7a7a82]); else if (M && chance(0.35)) o.bag = pick([0x15110e, 0x5a3a2a]);
      o.watch = chance(0.5); o.glasses = chance(0.2); o.sleeves = 'long'; break; }
    case 'smart': {
      o.top = top([['shirt', 0.34], ['polo', 0.2], ['sweater', c.cold || c.rain ? 0.3 : 0.1], ['blazer', 0.14], ['jacket', cool ? 0.2 : 0.05], ['tee', 0.12]]); o.shirt = pick([P0, P1, 0xf2efe6, 0x3d5a80, 0x9ad0ff, 0xe8d8e0]); o.jacket = o.top === 'blazer' || o.top === 'jacket' ? pick([0x1c2540, 0x3a3f4a, 0x5a3a2a, 0x7a6a55, 0x2f2f2f]) : undefined;
      o.bottom = female ? wpick([['chinos', 0.3], ['jeans', 0.28], ['skirt', 0.18], ['pencil', 0.1], ['suit', 0.14]]) : wpick([['chinos', 0.5], ['jeans', 0.35], ['suit', 0.15]]); o.pants = o.bottom === 'jeans' ? pick(DENIM) : o.bottom === 'chinos' ? pick([KHAKI, GREY_PANTS, 0x6b5b3e, 0x2b2f3a]) : pick([0x1c2540, 0x2f2f2f, 0x3a3f4a]); if (o.bottom === 'pencil') o.skirt = o.pants;
      o.shoeType = wpick([['dress', 0.4], ['sneakers', 0.4], ['boots', 0.15], ['heels', female ? 0.25 : 0]]); o.plaid = o.top === 'shirt' && chance(0.18); o.sleeves = o.top === 'shirt' && chance(0.4) ? 'rolled' : chance(0.3) ? 'long' : 'short'; o.glasses = chance(0.18); o.watch = chance(0.3); if (female && chance(0.3)) o.bag = pick([0x5a3a2a, 0x15110e, P2]); break; }
    case 'sporty': {
      o.top = c.cold ? 'hoodie' : top([['tank', female ? 0.3 : 0.2], ['tee', 0.4], ['longsleeve', 0.12], ['hoodie', 0.14]]); o.shirt = chance(0.6) ? neon : pick([P0, 0xffffff, 0x14161c]); o.bottom = female ? top([['leggings', 0.6], ['shorts', 0.3], ['sweatpants', 0.1]]) : top([['shorts', 0.45], ['sweatpants', 0.3], ['leggings', 0.1], ['jeans', 0.05], ['cargo', 0.1]]); if (c.cold && o.bottom === 'shorts') o.bottom = 'sweatpants';
      o.pants = pick([0x14161c, 0x2b2f3a, GREY_PANTS, neon, 0x2f3b6a]); o.shoeType = 'sneakers'; o.shoes = chance(0.5) ? neon : 0xffffff; o.headband = chance(0.3) ? pick([neon, 0xffffff, 0x14161c]) : null; o.headphones = chance(0.22) ? 0x14161c : null; o.stripe = (o.top === 'hoodie' || o.top === 'tee') && o.bottom === 'sweatpants' && chance(0.4) ? 0xffffff : undefined; o.watch = chance(0.5); if (o.stripe) o.pants = o.shirt; break; }
    case 'street': {
      o.top = c.cold ? top([['puffer', 0.45], ['hoodie', 0.3], ['leather', 0.15], ['sweater', 0.1]]) : c.rain ? top([['hoodie', 0.5], ['jacket', 0.3], ['puffer', 0.2]]) : top([['hoodie', 0.3], ['tee', 0.25], ['leather', 0.12], ['jacket', 0.12], ['longsleeve', 0.1], ['puffer', c.night ? 0.1 : 0.03], ['tank', 0.06]]);
      o.shirt = pick([P0, P1, P2, 0x14161c, 0xf2efe6, 0x555a66, neon]); o.jacket = ['leather', 'puffer', 'jacket'].includes(o.top) ? pick([0x14161c, 0x2f2f2f, 0x3a3f4a, 0x4a5a3a, 0x7a4a2a, 0xd9742a, 0x2f3b6a]) : undefined; if (o.top === 'leather') o.jacket = pick([0x15110e, 0x0c0c0e, 0x4a2a1a]);
      o.bottom = top([['cargo', 0.25], ['jeans', 0.4], ['sweatpants', 0.15], ['chinos', 0.08], ['shorts', c.hot ? 0.4 : 0.04], ['leggings', female ? 0.2 : 0]]); o.pants = o.bottom === 'jeans' ? pick([DENIM[0], BLACK_PANTS, 0x14161c, GREY_PANTS]) : pick([0x4a5a3a, 0x14161c, 0x6b5b3e, GREY_PANTS, 0x2b2f3a]); o.shoeType = wpick([['sneakers', 0.6], ['boots', 0.3], ['dress', 0.05]]); o.shoes = pick([0xffffff, 0x14161c, P2, neon, 0x5a3a2a]);
      o.cap = chance(0.3) ? pick([0x14161c, P2, 0xffffff, 0xd1345b]) : null; o.capBack = chance(0.25); o.beanie = !o.cap && (c.cold ? chance(0.4) : chance(0.1)) ? pick([0x14161c, P1, P2]) : null; o.hoodUp = o.top === 'hoodie' && c.rain && chance(0.35); o.chain = chance(0.28); o.headphones = !o.cap && !o.beanie && !o.hoodUp && chance(0.12) ? pick([0x14161c, 0xffffff]) : null; o.sunglasses = c.day && !c.rain && chance(0.14); o.backpack = chance(0.12) ? pick([0x14161c, P2]) : null; break; }
    case 'night': {
      const f = female;
      o.top = f ? top([['dress', 0.34], ['tank', 0.22], ['leather', 0.16], ['tee', 0.1], ['blazer', 0.1], ['shirt', 0.08]]) : top([['leather', 0.28], ['shirt', 0.22], ['blazer', 0.18], ['tee', 0.2], ['tank', 0.06], ['jacket', 0.06]]); o.shirt = chance(0.5) ? neon : pick([0x14161c, 0xd1345b, 0xf2efe6, 0x7b4fbf, 0x1c2540]); o.satin = chance(0.6);
      o.jacket = ['leather', 'blazer', 'jacket'].includes(o.top) ? (o.top === 'leather' ? pick([0x0c0c0e, 0x15110e, 0x4a1a1a]) : pick([0x14161c, 0x2f2f2f, 0x1c2540])) : undefined; if (o.top === 'dress') o.shirt = pick([0xd1345b, 0x14161c, 0x7b4fbf, 0x2aa198, neon, 0xf2efe6]);
      o.bottom = f ? top([['leggings', 0.28], ['skirt', 0.3], ['pencil', 0.1], ['jeans', 0.25], ['suit', 0.07]]) : top([['jeans', 0.55], ['suit', 0.15], ['chinos', 0.2], ['leggings', 0.02], ['cargo', 0.08]]); o.pants = pick([0x14161c, BLACK_PANTS, 0x1c2540, 0x2f2f2f, 0x4a1a1a]); if (o.bottom === 'skirt') { o.mini = chance(0.6); o.skirt = o.pants; } if (o.bottom === 'pencil') o.skirt = o.pants; if (o.top === 'blazer') o.bottom = M ? 'suit' : o.bottom;
      o.shoeType = f ? wpick([['heels', 0.5], ['boots', 0.3], ['sneakers', 0.2]]) : wpick([['boots', 0.4], ['dress', 0.3], ['sneakers', 0.3]]); o.shoes = pick([0x14161c, 0x15110e, 0xffffff, neon]); o.chain = M ? chance(0.3) : false; o.necklace = f && chance(0.4); o.earrings = f && chance(0.5) ? pick([0xf0c040, 0xe8e8ee]) : undefined; o.bracelet = chance(0.25); o.sunglasses = chance(0.07); o.lipstick = f && chance(0.65); o.dyed = chance(0.14); break; }
    case 'beach': {
      o.top = !female && chance(0.35) ? 'bare' : female ? top([['tank', 0.5], ['tee', 0.2], ['dress', 0.3]]) : top([['tank', 0.5], ['tee', 0.15], ['polo', 0.05], ['shirt', 0.1]]); o.shirt = chance(0.55) ? pick([neon, 0xffffff, 0xff7f50, 0x2aa198, 0xf5c542]) : P0; o.bottom = o.top === 'bare' ? 'trunks' : female ? top([['shorts', 0.6], ['skirt', 0.4]]) : 'shorts'; o.pants = pick([P2, P0, 0x3ce8f5, 0xff7f50, KHAKI, 0xff4fa3, 0xf5c542, 0x2aa198]); o.denim = chance(0.3);
      o.shoeType = 'sandals'; o.shoes = pick([0x5a3a2a, 0x8a6a42, 0xffffff, neon]); o.sunglasses = chance(0.55); const hat = chance(0.28); o.hat = hat ? 0xe8d9a0 : undefined; o.cap = !hat && chance(0.14) ? pick([0xffffff, P2, 0x2a6fd6]) : null; o.bag = chance(0.2) ? pick([0xe8d9a0, P2]) : undefined; o.necklace = female && chance(0.25); o.bracelet = chance(0.2); break; }
    case 'tourist': {
      o.top = top([['shirt', 0.3], ['polo', 0.2], ['tee', 0.3], ['tank', 0.08], ['hoodie', c.cold ? 0.3 : 0.02]]); o.shirt = pick([0xff9a3c, 0x3ce8f5, 0xf5c542, 0x2aa198, 0xff7f50, 0xffffff, 0xd1345b]); o.plaid = o.top === 'shirt' && chance(0.3); o.sleeves = o.top === 'shirt' ? 'short' : undefined; o.bottom = female ? top([['shorts', 0.4], ['chinos', 0.2], ['skirt', 0.25], ['jeans', 0.15]]) : top([['shorts', 0.5], ['chinos', 0.3], ['jeans', 0.2]]); o.pants = pick([KHAKI, 0xe8e0d0, DENIM[0], 0xc9c1b1, P2]); o.shoeType = top([['sneakers', 0.6], ['sandals', 0.4]]); o.shoes = pick([0xffffff, 0x5a3a2a, P2]);
      o.hat = chance(0.3) ? 0xe8d9a0 : undefined; o.cap = !o.hat && chance(0.3) ? pick([0xffffff, P2, 0x2a6fd6]) : null; o.sunglasses = c.day && chance(0.5); o.bag = chance(0.55) ? pick([0x14161c, 0x5a3a2a, P2]) : undefined; o.backpack = !o.bag && chance(0.35) ? pick([0x14161c, 0x3d5a80]) : null; o.watch = chance(0.4); break; }
    case 'worker': {
      o.top = top([['overalls', 0.3], ['tee', 0.3], ['longsleeve', 0.15], ['shirt', 0.1], ['hoodie', 0.1], ['jacket', cool ? 0.2 : 0.05]]); o.shirt = o.top === 'overalls' ? pick([0x2f4a7a, 0x3a4a5a, 0x7a6a55, 0xd9742a, 0x4a5a3a]) : pick([P0, P1, 0x555a66, 0xd9742a, 0x8a7a55]); o.jacket = o.top === 'jacket' ? pick([0x4a5a3a, 0x7a6a55, 0x3a3f4a]) : undefined; o.plaid = o.top === 'shirt' && chance(0.5);
      o.bottom = o.top === 'overalls' ? 'work' : top([['work', 0.3], ['cargo', 0.25], ['jeans', 0.35], ['chinos', 0.1]]); o.pants = o.top === 'overalls' ? o.shirt : pick([DENIM[0], 0x4a5a3a, 0x7a6a55, 0x3a3f4a, BLACK_PANTS]); o.shoeType = 'boots'; o.shoes = pick([0x5a3a2a, 0x14161c, 0x8a6a42]);
      o.helmet = chance(0.22) ? 'hard' : undefined; o.helmetColour = pick([0xf5c542, 0xffffff, 0xd9742a]); o.cap = !o.helmet && chance(0.3) ? pick([0x14161c, P2, 0x2f4a7a]) : null; o.hivis = chance(0.28) ? pick([0xd9ff3a, 0xff8a1c]) : undefined; o.belt = chance(0.3); o.glasses = chance(0.1); break; }
    case 'student': {
      o.top = top([['hoodie', 0.28], ['tee', 0.3], ['shirt', 0.12], ['longsleeve', 0.1], ['sweater', c.cold ? 0.3 : 0.05], ['jacket', cool ? 0.25 : 0.04], ['tank', c.hot ? 0.12 : 0.02]]); o.shirt = pick([P0, P1, P2, 0xffffff, neon, 0x555a66]); o.jacket = o.top === 'jacket' ? pick([0x2f3b6a, 0x3a3f4a, 0x7a4a2a, 0x4a5a3a]) : undefined; o.plaid = o.top === 'shirt' && chance(0.4);
      o.bottom = female ? top([['jeans', 0.4], ['leggings', 0.2], ['skirt', 0.15], ['shorts', c.hot ? 0.3 : 0.05], ['chinos', 0.1]]) : top([['jeans', 0.55], ['chinos', 0.15], ['shorts', c.hot ? 0.35 : 0.05], ['sweatpants', 0.1], ['cargo', 0.1]]); o.pants = o.bottom === 'jeans' ? pick([DENIM[0], DENIM[1], BLACK_PANTS]) : pick([KHAKI, 0x14161c, GREY_PANTS, 0x2f3b6a]); if (o.bottom === 'skirt') o.skirt = o.pants; o.shoeType = 'sneakers'; o.shoes = pick([0xffffff, 0x14161c, P2, neon]);
      o.backpack = chance(0.75) ? pick([0x14161c, P1, P2, 0x2f2f2f, neon]) : null; o.headphones = chance(0.25) ? pick([0x14161c, 0xffffff]) : null; o.beanie = c.cold && chance(0.3) ? pick([P1, P2]) : null; o.glasses = chance(0.2); break; }
    case 'elder': {
      o.top = top([['shirt', 0.3], ['polo', 0.2], ['sweater', 0.2], ['jacket', cool ? 0.4 : 0.1], ['tee', 0.1], ['blazer', 0.06], ['dress', female ? 0.25 : 0]]); o.shirt = pick(MUTED.concat([0xf2efe6, 0xe8e0d0])); o.jacket = o.top === 'jacket' || o.top === 'blazer' ? pick([0x5a6a7a, 0x7a6a55, 0x4a5a4a, 0x3a3f4a, 0x8a7a6a]) : undefined; o.bottom = female ? top([['chinos', 0.4], ['skirt', 0.25], ['suit', 0.15], ['pencil', 0.1], ['jeans', 0.1]]) : top([['chinos', 0.55], ['suit', 0.2], ['jeans', 0.2], ['work', 0.05]]); o.pants = pick([KHAKI, GREY_PANTS, 0x6b5b3e, 0x2b2f3a, 0x4a4a52]); if (o.bottom === 'skirt' || o.bottom === 'pencil') o.skirt = o.pants;
      o.shoeType = top([['dress', 0.45], ['sneakers', 0.45], ['boots', 0.1]]); o.shoes = pick([0x15110e, 0x4a2a1a, 0xffffff, 0x5a5f6a]); o.glasses = chance(0.45); o.cap = chance(0.12) ? pick([0x5a6a7a, 0x7a6a55, 0x3a3f4a]) : null; o.hat = !o.cap && chance(0.08) ? 0xe8d9a0 : undefined; o.scarf = c.cold && chance(0.5) ? pick(MUTED) : undefined; o.bag = female && chance(0.3) ? pick([0x5a3a2a, 0x15110e]) : undefined; o.necklace = female && chance(0.3); o.sleeves = 'long'; break; }
    default: { // casual
      o.top = female ? top([['tee', 0.26], ['longsleeve', 0.1], ['tank', c.hot ? 0.22 : 0.05], ['hoodie', 0.1], ['shirt', 0.1], ['polo', 0.03], ['sweater', c.cold ? 0.3 : 0.05], ['dress', c.hot ? 0.3 : 0.18], ['jacket', cool ? 0.3 : 0.05]]) : top([['tee', 0.34], ['polo', 0.12], ['longsleeve', 0.1], ['hoodie', 0.14], ['shirt', 0.14], ['sweater', c.cold ? 0.3 : 0.04], ['jacket', cool ? 0.3 : 0.06], ['tank', c.hot ? 0.1 : 0.02]]);
      if (c.cold && ['tee', 'tank', 'dress', 'polo'].includes(o.top)) o.top = pick(['sweater', 'jacket', 'hoodie']); if (c.rain && !['jacket', 'hoodie', 'puffer', 'sweater'].includes(o.top)) o.top = chance(0.5) ? 'jacket' : 'hoodie'; if (c.cold && o.top === 'jacket' && chance(0.5)) o.top = 'puffer';
      o.shirt = pick([P0, P1, P0, P2, 0xffffff, 0xf2efe6]); o.jacket = ['jacket', 'puffer'].includes(o.top) ? pick([0x2f3b6a, 0x3a3f4a, 0x5a3a2a, 0x7a6a55, 0x1c2540, 0x2f2f2f, 0x4a5a3a, P1, 0xd9742a]) : undefined; o.plaid = o.top === 'shirt' && chance(0.2); o.sleeves = o.top === 'shirt' && chance(0.35) ? 'rolled' : chance(0.3) ? 'long' : 'short';
      o.bottom = o.top === 'dress' ? 'skirt' : female ? top([['jeans', 0.42], ['chinos', 0.14], ['skirt', c.hot ? 0.28 : 0.14], ['shorts', c.hot ? 0.3 : 0.04], ['sweatpants', 0.07], ['leggings', 0.18], ['pencil', 0.03]]) : top([['jeans', 0.5], ['chinos', 0.2], ['shorts', c.hot ? 0.35 : 0.06], ['sweatpants', 0.08], ['cargo', 0.1]]); if (c.cold || c.rain || c.night) { if (o.bottom === 'shorts' || (o.bottom === 'skirt' && o.top !== 'dress')) o.bottom = 'jeans'; }
      o.pants = o.bottom === 'jeans' ? wpick([[DENIM[0], 0.4], [DENIM[1], 0.3], [BLACK_PANTS, 0.2], [GREY_PANTS, 0.1]]) : o.bottom === 'chinos' ? wpick([[KHAKI, 0.5], [GREY_PANTS, 0.2], [0x6b5b3e, 0.15], [0x2b2f3a, 0.15]]) : o.bottom === 'shorts' ? wpick([[KHAKI, 0.4], [DENIM[0], 0.3], [BLACK_PANTS, 0.15], [P2, 0.15]]) : o.bottom === 'sweatpants' ? wpick([[GREY_PANTS, 0.4], [BLACK_PANTS, 0.35], [0x2b2f3a, 0.25]]) : o.bottom === 'cargo' ? pick([0x4a5a3a, KHAKI, 0x6b5b3e, BLACK_PANTS]) : o.top === 'dress' ? P1 : pick([BLACK_PANTS, DENIM[0], KHAKI, P2]); o.denim = o.bottom === 'shorts' && chance(0.4);
      if (o.bottom === 'skirt' || o.bottom === 'pencil') { o.skirt = o.top === 'dress' ? undefined : o.pants; o.mini = o.top !== 'dress' && chance(0.3); } o.shoeType = wpick([['sneakers', 0.6], ['boots', c.night || c.rain || c.cold ? 0.35 : 0.14], ['dress', 0.05], ['sandals', c.warm && (o.bottom === 'shorts' || o.bottom === 'skirt') ? 0.25 : 0], ['heels', female && o.top === 'dress' ? 0.2 : 0]]); o.shoes = pick([0xffffff, 0x14161c, P2, 0x5a3a2a, 0x8a6a42]);
      o.backpack = chance(0.12) ? pick([P1, P2, 0x2f2f2f, 0x5a3a2a]) : null; o.cap = chance(c.night ? 0.06 : 0.13) ? pick([P2, P1, 0x14161c, 0xffffff, 0xd1345b]) : null; o.capBack = chance(0.25); o.beanie = !o.cap && (c.cold || c.rain ? chance(0.2) : chance(0.04)) ? pick([P1, P2, 0x2f2f2f]) : null; o.hoodUp = o.top === 'hoodie' && c.rain && chance(0.3); o.headphones = !o.cap && !o.beanie && !o.hoodUp && chance(0.07) ? pick([0x14161c, 0xffffff, P2]) : null;
      o.sunglasses = c.day && !c.rain && chance(0.12); o.glasses = !o.sunglasses && chance(0.14); o.scarf = c.cold && chance(0.35) ? pick([P2, P1, 0xd1345b, 0x7a6a55]) : undefined; if (female && chance(0.18)) o.bag = pick([P2, 0x5a3a2a, 0x15110e, 0xe8d9a0]); o.watch = chance(0.18); o.necklace = female && chance(0.15); o.earrings = female && chance(0.22) ? pick([0xf0c040, 0xe8e8ee]) : undefined; o.bracelet = female && chance(0.16); o.chain = M && chance(0.06); break; }
  }
  if (o.top === 'dress' && !o.skirt && o.bottom !== 'skirt') o.bottom = 'skirt'; if (o.top === 'blazer' && M && !o.tie && A !== 'business' && chance(0.3)) o.tie = pick([0xb0122a, 0x1c2540, P2]);
  // ----- the person -----
  const key = A === 'business' || A === 'smart' ? 'business' : A === 'sporty' || A === 'beach' ? 'sporty' : A === 'night' || A === 'street' ? 'night' : A === 'elder' ? 'elder' : 'casual', sty = STYLES[female ? 'f' : 'm'][key];
  o.hairStyle = wpick(sty); o.skin = pick(SKINS); o.hair = elder ? pick(ELDER_HAIR) : o.dyed || (A === 'street' && chance(0.07)) ? pick(HAIR_DYED) : wpick(HAIR_NATURAL); if (!elder && o.hairStyle === 'mohawk' && chance(0.5)) o.hair = pick(HAIR_DYED);
  if (!female && (o.hairStyle === 'pony' || o.hairStyle === 'bun') && chance(0.5)) o.hairStyle = 'short';
  o.beard = !female ? (chance(elder ? 0.18 : A === 'business' ? 0.1 : A === 'worker' || A === 'street' ? 0.3 : 0.2) ? pick(['full', 'short', 'goatee', 'moustache', 'chinstrap', 'short', 'full']) : false) : false;
  const w = BUILD_W[build] * (0.97 + Math.random() * 0.06), height = clamp(((female ? 1.645 : 1.77) + (Math.random() + Math.random() - 1) * 0.11 + (Math.random() < 0.06 ? 0.07 : 0) - (Math.random() < 0.05 ? 0.06 : 0) + (build === 'athletic' ? 0.015 : 0) - (elder ? 0.025 : 0)) / 1.735, 0.893, 1.124); // 1.55 .. 1.95 m (the bind pose is 1.735 m tall with its hair)
  o.lipstick = o.lipstick !== undefined ? o.lipstick : female && chance(c.night ? 0.45 : 0.28); o.eye = chance(0.15) ? pick([0x3b78c4, 0x3f9a5c]) : undefined; o.brow = -0.15 + Math.random() * 0.35; o.width = w; o.height = height;
  o.archetype = A; // what kind of outfit this is (the people chain may read it)
  o.jaw = Math.floor(Math.random() * 3); // 0 narrow and round, 1 average, 2 square: the head shape of this person (headSpec)
  o.restEx = chance(0.2) ? 1 : 0; // the face at rest: neutral, or a faint smile (facePlan)
  // keep the legacy fields other code reads
  o.skirt = o.skirt !== undefined ? o.skirt : o.top === 'dress' ? o.shirt : o.bottom === 'skirt' ? o.pants : null; o.shorts = o.bottom === 'shorts';
  if (o.glasses === undefined) o.glasses = false; if (o.sunglasses === undefined) o.sunglasses = false; if (o.watch === undefined) o.watch = chance(0.18);
  return o;
}

// ---------- looks: the player, the law, the gang, and the uniforms of everyone who works in the city ----------
export const LOOKS = {
  player: { skin: 0xd9a47e, shirt: 0xff4fa3, pants: 0x1c2540, hair: 0x1a120e, hairStyle: 'short', shoes: 0xffffff, brow: 0.04 }, // outfits (config.js OUTFITS) add their own jacket
  cop: { skin: 0xd9a47e, shirt: 0x1f3a7a, pants: 0x14213d, hair: 0x2b2b2b, hat: 0x14213d, badge: true, dutyBelt: true, hairStyle: 'short', glasses: true, brow: 0.12, top: 'shirt', shoeType: 'dress', shoes: 0x15110e },
  swat: { skin: 0xb97c55, shirt: 0x1a1d24, pants: 0x1a1d24, hair: 0x111111, hat: 0x0e0f12, armor: 0x2a2e38, vestStripe: 0xffd34e, hairStyle: 'short', brow: 0.18, shoeType: 'boots', shoes: 0x15110e, dutyBelt: true },
  gang: { skin: 0x8a5a3c, shirt: 0x2e8b57, pants: 0x1a1a1a, hair: 0x1a120e, band: 0x2eff7a, hairStyle: 'short', beard: true, brow: 0.15 },
  bodyguard: { skin: 0xf1c7a8, shirt: 0xffffff, pants: 0x101318, jacket: 0x101318, tie: 0x101318, top: 'blazer', bottom: 'suit', shoeType: 'dress', shoes: 0x15110e, hair: 0x2b2b2b, glasses: true, sunglasses: true, hairStyle: 'bald', brow: 0.1 },
  target: { skin: 0xe8b894, shirt: 0xffd34e, pants: 0xf0f0f0, jacket: 0xffd34e, hair: 0xd9b27a, glasses: true, hairStyle: 'short', brow: -0.05 },
  // ----- uniforms (each is a look makeCharacter accepts; uniformLook(kind) returns a varied copy) -----
  shopkeeper: { skin: 0xd9a47e, top: 'shirt', shirt: 0xf2efe6, bottom: 'chinos', pants: 0x4a4a52, apron: 0x2f5a3a, shoeType: 'dress', shoes: 0x15110e, hair: 0x3b2716, hairStyle: 'short', glasses: true, sleeves: 'rolled', watch: true, beard: 'short' },
  gunsmith: { skin: 0xc99263, top: 'longsleeve', shirt: 0x4a5a3a, bottom: 'cargo', pants: 0x3a3f4a, shoeType: 'boots', shoes: 0x15110e, apron: 0x5a3a2a, cap: 0x14161c, beard: 'full', glasses: true, hairStyle: 'short', hair: 0x2b2b2b, build: 'heavy', watch: true, belt: true },
  cashier: { skin: 0xe8b894, top: 'polo', shirt: 0xd1345b, bottom: 'chinos', pants: 0x1a1a1a, shoeType: 'sneakers', shoes: 0x14161c, apron: 0xf5c542, apronStripe: 0xd1345b, cap: 0xd1345b, hair: 0x3b2716, hairStyle: 'pony', female: true, sleeves: 'short', lanyard: 0xf5c542 },
  chef: { skin: 0xd9a47e, top: 'chefcoat', jacket: 0xf4f4f4, shirt: 0xffffff, bottom: 'work', pants: 0x2a2a2e, shoeType: 'dress', shoes: 0x14161c, toque: 0xffffff, apron: 0xf2f2f2, hair: 0x3b2716, hairStyle: 'short', beard: 'moustache', build: 'heavy' },
  doctor: { skin: 0xf1c7a8, top: 'labcoat', jacket: 0xf4f6f8, shirt: 0x2aa198, bottom: 'chinos', pants: 0x2f3b4a, shoeType: 'dress', shoes: 0x15110e, stethoscope: true, lanyard: 0x2a6fd6, hair: 0x2b2b2b, hairStyle: 'sidepart', glasses: true, watch: true },
  nurse: { skin: 0xe8b894, top: 'scrubs', shirt: 0x2aa198, bottom: 'chinos', pants: 0x2aa198, shoeType: 'sneakers', shoes: 0xffffff, female: true, hair: 0x6b4a2b, hairStyle: 'pony', lanyard: 0x2a6fd6, stethoscope: true, watch: true },
  paramedic: { skin: 0xd9a47e, top: 'paramedic', jacket: 0x1f5a3a, shirt: 0xffffff, bottom: 'work', pants: 0x1b3a2a, reflect: true, shoeType: 'boots', shoes: 0x14161c, cap: 0x1f5a3a, hair: 0x2b2b2b, hairStyle: 'short', build: 'athletic', dutyBelt: true },
  firefighter: { skin: 0xb97c55, top: 'turnout', jacket: 0x8a6a3a, shirt: 0x333333, bottom: 'work', pants: 0x8a6a3a, reflect: true, helmet: 'fire', helmetColour: 0xe8d94a, shoeType: 'boots', shoes: 0x14161c, hair: 0x1a120e, hairStyle: 'buzz', build: 'athletic', beard: 'short' },
  towDriver: { skin: 0xe8b894, top: 'overalls', shirt: 0x2f4a7a, bottom: 'work', pants: 0x2f4a7a, shoeType: 'boots', shoes: 0x14161c, cap: 0x14161c, beard: 'short', hair: 0x3b2716, hairStyle: 'short', build: 'heavy', belt: true },
  busDriver: { skin: 0x8a5a3c, top: 'shirt', shirt: 0x9ad0ff, bottom: 'suit', pants: 0x14213d, tie: 0x14213d, hat: 0x14213d, shoeType: 'dress', shoes: 0x15110e, lanyard: 0x14213d, watch: true, sleeves: 'short', hair: 0x2b2b2b, hairStyle: 'short', glasses: true },
  courier: { skin: 0xd9a47e, top: 'hoodie', shirt: 0xf5c542, bottom: 'jeans', pants: 0x2b3a5c, helmet: 'moto', helmetColour: 0xf5c542, backpack: 0xf5c542, delivery: true, shoeType: 'sneakers', shoes: 0x14161c, hair: 0x1a120e, hairStyle: 'short', build: 'slim' },
  guard: { skin: 0xb97c55, top: 'shirt', shirt: 0x2a2e38, bottom: 'suit', pants: 0x14161c, hat: 0x14161c, badge: true, dutyBelt: true, shoeType: 'boots', shoes: 0x14161c, build: 'heavy', hair: 0x1a120e, hairStyle: 'buzz', sleeves: 'short', sunglasses: true },
  banker: { skin: 0xf1c7a8, top: 'blazer', jacket: 0x1c2540, shirt: 0xffffff, pinstripe: true, bottom: 'suit', pants: 0x1c2540, tie: 0xb0122a, shoeType: 'dress', shoes: 0x15110e, hair: 0x3b2716, hairStyle: 'slick', glasses: true, watch: true, bag: 0x15110e, build: 'slim', sleeves: 'long' },
  tourist: { skin: 0xf1c7a8, top: 'shirt', shirt: 0xff9a3c, plaid: true, sleeves: 'short', bottom: 'shorts', pants: 0xe8e0d0, shoeType: 'sandals', shoes: 0x5a3a2a, hat: 0xe8d9a0, sunglasses: true, bag: 0x14161c, hair: 0xd9b27a, hairStyle: 'short', watch: true, build: 'heavy' },
  clubber: { skin: 0xe8b894, top: 'tank', shirt: 0x3ce8f5, satin: true, bottom: 'leggings', pants: 0x14161c, shoeType: 'boots', shoes: 0x14161c, hair: 0xff4fa3, hairStyle: 'mohawk', chain: true, sunglasses: true, bracelet: true, earrings: 0xf0c040, build: 'slim' },
  jogger: { skin: 0xd9a47e, top: 'tank', shirt: 0x2eff7a, bottom: 'shorts', pants: 0x14161c, shoeType: 'sneakers', shoes: 0xff4fa3, headband: 0xffffff, watch: true, hair: 0x3b2716, hairStyle: 'pony', female: true, build: 'athletic' },
  mechanic: { skin: 0xc99263, top: 'overalls', shirt: 0x3a4a5a, bottom: 'work', pants: 0x3a4a5a, shoeType: 'boots', shoes: 0x5a3a2a, cap: 0xd9742a, beard: 'full', hair: 0x2b2b2b, hairStyle: 'short', belt: true, build: 'athletic' },
};
// per uniform: probability of a woman, build weights, colour alternatives, hair style pool and age
const UNI = {
  shopkeeper: { f: 0.4, shirt: [0xf2efe6, 0xcfe3f5, 0xe8d8e0, 0xf5f0e6], apron: [0x2f5a3a, 0x7a2a2a, 0x2f3b6a, 0x14161c, 0x5a3a2a], elder: 0.25, key: 'casual' },
  gunsmith: { f: 0.12, shirt: [0x4a5a3a, 0x3a3f4a, 0x5a3a2a, 0x2f2f2f], apron: [0x5a3a2a, 0x2f2f2f, 0x4a3a2a], elder: 0.2, key: 'casual', builds: [['heavy', 0.5], ['average', 0.35], ['athletic', 0.15]] },
  cashier: { f: 0.62, shirt: [0xd1345b, 0xd1345b, 0x2a6fd6, 0x2aa198], apron: [0xf5c542, 0xf5c542, 0xff8a1c, 0xffffff], key: 'casual', elder: 0.02 },
  chef: { f: 0.3, elder: 0.12, key: 'casual', builds: [['heavy', 0.4], ['average', 0.4], ['slim', 0.2]] },
  doctor: { f: 0.48, shirt: [0x2aa198, 0xe8d8e0, 0x9ad0ff, 0x3d5a80, 0xf2efe6], pants: [0x2f3b4a, 0x14161c, 0x3a3f4a, 0x6b5b3e], elder: 0.2, key: 'business' },
  nurse: { f: 0.82, shirt: [0x2aa198, 0x3d6fb0, 0xb04a7a, 0x4a8a5a, 0x6a5aa0, 0x1f3a6a, 0xd1345b], elder: 0.08, key: 'sporty' },
  paramedic: { f: 0.3, jacket: [0x1f5a3a, 0x14213d, 0x1f5a3a, 0x2a2e38], elder: 0.03, key: 'sporty' },
  firefighter: { f: 0.12, jacket: [0x8a6a3a, 0x8a6a3a, 0x2b2b2b, 0x4a4030], helmetColour: [0xe8d94a, 0xc43a2a, 0xf2f2f2, 0xe8d94a], elder: 0.02, key: 'sporty', builds: [['athletic', 0.5], ['average', 0.35], ['heavy', 0.15]] },
  towDriver: { f: 0.1, shirt: [0x2f4a7a, 0x4a5a3a, 0x7a6a55, 0xd9742a, 0x3a3f4a], elder: 0.12, key: 'casual', builds: [['heavy', 0.45], ['average', 0.4], ['athletic', 0.15]] },
  busDriver: { f: 0.3, shirt: [0x9ad0ff, 0xf2efe6, 0xcfe3f5], elder: 0.18, key: 'business' },
  courier: { f: 0.3, shirt: [0xf5c542, 0x2aa198, 0xd9742a, 0xd1345b, 0x2a6fd6], elder: 0.0, key: 'sporty', builds: [['slim', 0.45], ['athletic', 0.3], ['average', 0.25]] },
  guard: { f: 0.2, shirt: [0x2a2e38, 0x3a3f4a, 0x1f2a3a, 0xf2efe6], elder: 0.08, key: 'business', builds: [['heavy', 0.4], ['athletic', 0.35], ['average', 0.25]] },
  banker: { f: 0.4, jacket: [0x1c2540, 0x2f2f2f, 0x3a3f4a, 0x14161c, 0x5a6a7a], elder: 0.1, key: 'business', builds: [['slim', 0.4], ['average', 0.4], ['athletic', 0.2]] },
  tourist: { f: 0.5, shirt: [0xff9a3c, 0x3ce8f5, 0xf5c542, 0x2aa198, 0xff7f50, 0xd1345b], elder: 0.2, key: 'casual' },
  clubber: { f: 0.55, shirt: [0x3ce8f5, 0xff4fa3, 0x7b4fbf, 0x2eff7a, 0xffd34e, 0xff5a3c], hair: [0xff4fa3, 0x3ce8f5, 0x7b4fbf, 0x2eff7a, 0x1a120e, 0xffffff], elder: 0.0, key: 'night', builds: [['slim', 0.5], ['athletic', 0.25], ['average', 0.25]] },
  jogger: { f: 0.5, shirt: [0x2eff7a, 0xff4fa3, 0x3ce8f5, 0xffd34e, 0xff5a3c, 0xffffff], elder: 0.04, key: 'sporty', builds: [['athletic', 0.5], ['slim', 0.35], ['average', 0.15]] },
  mechanic: { f: 0.08, shirt: [0x3a4a5a, 0x2f4a7a, 0x4a4a52, 0x7a6a55, 0xd9742a], elder: 0.1, key: 'casual', builds: [['athletic', 0.35], ['average', 0.35], ['heavy', 0.3]] },
};
export const UNIFORM_KINDS = Object.keys(UNI);
// A fresh, varied look for one of the uniform kinds: random skin, hair, build and sex where it fits the job, with the uniform's own garments and colours (a nurse in scrubs, a firefighter in turnout gear ...).
export function uniformLook(kind) {
  const base = LOOKS[kind], r = UNI[kind]; if (!base || !r) return randomLook();
  const female = chance(r.f), elder = chance(r.elder || 0), look = { ...base, female, elder }; delete look._fk; delete look._tone; delete look.freckles; delete look._beard;
  look.skin = pick(SKINS); look.build = wpick(r.builds || [['slim', 0.25], ['average', 0.45], ['athletic', 0.15], ['heavy', 0.15]]); if (elder && look.build === 'athletic') look.build = 'average';
  look.height = clamp(((female ? 1.645 : 1.77) + (Math.random() + Math.random() - 1) * 0.08 - (elder ? 0.025 : 0)) / 1.735, 0.9, 1.12); look.width = undefined;
  look.hair = elder ? pick(ELDER_HAIR) : r.hair ? pick(r.hair) : wpick(HAIR_NATURAL); const pool = STYLES[female ? 'f' : 'm'][elder ? 'elder' : r.key] || STYLES.m.casual; look.hairStyle = wpick(pool); if (kind === 'jogger' || kind === 'nurse') look.hairStyle = female ? pick(['pony', 'bun', 'braids', 'pixie', 'bob']) : look.hairStyle; if (kind === 'clubber' && !elder) look.hairStyle = female ? pick(['wavy', 'long', 'pixie', 'bob', 'braids']) : pick(['mohawk', 'quiff', 'slick', 'fade', 'curly']);
  look.beard = !female && base.beard !== undefined ? (chance(0.7) ? pick(['full', 'short', 'goatee', 'moustache', 'short']) : false) : false; if (!female && !look.beard && chance(0.08)) look.beard = pick(['short', 'moustache']);
  if (r.shirt) look.shirt = pick(r.shirt); if (r.jacket) look.jacket = pick(r.jacket); if (r.apron) look.apron = pick(r.apron); if (r.pants) look.pants = pick(r.pants); if (r.helmetColour) look.helmetColour = pick(r.helmetColour);
  look.glasses = base.glasses ? chance(0.7) : chance(0.1); if (kind === 'doctor') { look.inner = look.shirt; look.shirt = look.shirt; }
  // the garments that depend on the colour that was drawn
  if (kind === 'nurse') { look.pants = chance(0.7) ? look.shirt : pick([0x2f3b6a, 0x14161c, 0x3d5a80]); }
  if (kind === 'paramedic') { look.pants = look.jacket === 0x14213d ? 0x0f1830 : dark(look.jacket, 0.6); look.cap = chance(0.6) ? look.jacket : null; }
  if (kind === 'firefighter') look.pants = look.jacket;
  if (kind === 'towDriver' || kind === 'mechanic') { look.pants = look.shirt; look.cap = chance(0.7) ? pick([0x14161c, 0xd9742a, look.shirt, 0xffffff]) : null; }
  if (kind === 'courier') { look.helmetColour = look.shirt; look.backpack = look.shirt; look.top = pick(['hoodie', 'tee', 'jacket']); if (look.top === 'jacket') look.jacket = look.shirt; look.pants = pick([0x2b3a5c, 0x14161c, 0x4a5a3a]); look.bottom = pick(['jeans', 'cargo', 'jeans']); }
  if (kind === 'cashier') { look.cap = chance(0.8) ? look.shirt : null; look.hairStyle = female ? pick(['pony', 'bun', 'braids', 'long', 'bob']) : pick(['short', 'crop', 'fade', 'buzz']); }
  if (kind === 'busDriver' || kind === 'guard') look.hat = chance(kind === 'guard' ? 0.5 : 0.85) ? base.hat : undefined;
  if (kind === 'guard') { look.sunglasses = chance(0.3); look.glasses = false; if (look.shirt === 0xf2efe6) look.pants = 0x14161c; }
  if (kind === 'banker') { look.pants = look.jacket; look.tie = female ? undefined : pick([0xb0122a, 0x1c2540, 0x2f2f2f, 0x2a6fd6, 0x3d5a80]); look.pinstripe = chance(0.35); look.shirt = pick([0xffffff, 0xcfe3f5, 0xf2efe6]); }
  if (kind === 'doctor') look.shirt = look.shirt;
  if (kind === 'tourist') { look.plaid = chance(0.4); look.pants = pick([0xe8e0d0, 0xb8a67e, 0x2b3a5c, 0xc9c1b1]); look.hat = chance(0.6) ? 0xe8d9a0 : undefined; look.cap = look.hat ? null : pick([0xffffff, 0x2a6fd6, 0xd1345b]); look.bottom = female ? pick(['shorts', 'skirt', 'chinos']) : pick(['shorts', 'chinos', 'shorts']); if (look.bottom === 'skirt') look.skirt = look.pants; }
  if (kind === 'clubber') { look.pants = pick([0x14161c, 0x1c2540, 0x4a1a1a]); look.top = female ? pick(['tank', 'dress', 'leather', 'tank']) : pick(['tank', 'leather', 'shirt']); if (look.top === 'dress' || look.top === 'leather') look.jacket = look.top === 'leather' ? 0x0c0c0e : undefined; look.bottom = female ? pick(['leggings', 'skirt', 'jeans']) : pick(['jeans', 'leggings', 'suit']); if (look.bottom === 'skirt') { look.skirt = look.pants; look.mini = true; } look.shoeType = female ? pick(['heels', 'boots']) : 'boots'; look.lipstick = female && chance(0.7); look.satin = chance(0.6); }
  if (kind === 'jogger') { look.shoes = pick([0xff4fa3, 0x3ce8f5, 0xffffff, 0x2eff7a]); look.headband = chance(0.7) ? pick([0xffffff, 0x14161c, look.shirt]) : null; look.bottom = female ? pick(['leggings', 'shorts', 'leggings']) : pick(['shorts', 'sweatpants']); look.pants = pick([0x14161c, 0x2b2f3a, 0x2f3b6a]); look.top = pick(['tank', 'tee']); }
  if (kind === 'chef') look.hairStyle = female ? pick(['bun', 'pony', 'braids']) : look.hairStyle;
  if (female) { if (kind === 'banker') { look.bottom = chance(0.6) ? 'pencil' : 'suit'; if (look.bottom === 'pencil') look.skirt = look.pants; look.shoeType = 'heels'; look.shoes = 0x15110e; look.earrings = 0xe8e8ee; look.lipstick = true; }
    if (kind === 'doctor' || kind === 'busDriver') look.lipstick = chance(0.3); if (kind === 'cashier') look.lipstick = chance(0.4); if (kind === 'gunsmith' || kind === 'mechanic' || kind === 'towDriver') look.beard = false; }
  look.eye = chance(0.15) ? pick([0x3b78c4, 0x3f9a5c]) : undefined; look.brow = -0.15 + Math.random() * 0.35;
  return look;
}
// A uniform with variations for one person: cops with or without the cap, short or long sleeves, some women; a SWAT officer with or without the helmet; a gang member in a green-dominant outfit with a bandana; a worker's
// uniform (LOOKS.doctor, LOOKS.firefighter ...) as a fresh uniformLook. Looks that are not one of these come back unchanged.
export function crewLook(base) {
  if (base === LOOKS.cop) {
    const f = Math.random() < 0.25;
    return { ...base, skin: pick(SKINS), hair: pick([0x1a120e, 0x2b2b2b, 0x3b2716, 0x6b4a2b, 0xd9b27a]), hairStyle: f ? pick(['bun', 'pony', 'short', 'bob']) : pick(['short', 'short', 'buzz', 'crop', 'bald']), female: f,
      hat: Math.random() < 0.55 ? base.hat : undefined, sleeves: Math.random() < 0.35 ? 'long' : 'short', glasses: Math.random() < 0.15, sunglasses: Math.random() < 0.18, beard: !f && Math.random() < 0.1, build: wpick([['slim', 0.2], ['average', 0.55], ['heavy', 0.25]]),
      width: undefined, height: 0.96 + Math.random() * 0.1, brow: Math.random() * 0.25 };
  }
  if (base === LOOKS.swat) {
    return { ...base, skin: pick(SKINS), hair: pick([0x111111, 0x2b2b2b, 0x3b2716]), hat: Math.random() < 0.75 ? base.hat : undefined, sunglasses: Math.random() < 0.25, beard: Math.random() < 0.2, female: Math.random() < 0.1,
      build: wpick([['athletic', 0.45], ['average', 0.3], ['heavy', 0.25]]), height: 0.98 + Math.random() * 0.09 };
  }
  if (base === LOOKS.gang) {
    const g = [0x2e8b57, 0x1f6b3f, 0x3cb371, 0x145a32, 0x2eff7a], top = pick(['tank', 'tee', 'tee', 'hoodie', 'longsleeve', 'leather']);
    return { ...base, skin: pick(SKINS), shirt: Math.random() < 0.8 ? pick(g) : pick([0xf2efe6, 0x1a1a1a]), top, jacket: top === 'leather' ? 0x0c0c0e : undefined, pants: pick([0x1a1a1a, DENIM[0], KHAKI, 0x2f2f2f]), bottom: pick(['jeans', 'jeans', 'chinos', 'sweatpants', 'cargo']), shoeType: pick(['sneakers', 'sneakers', 'boots']),
      shoes: pick([0xffffff, 0x1a1a1a, 0x2e8b57]), hairStyle: pick(['short', 'buzz', 'bald', 'curly', 'afro', 'fade', 'locs']), hair: pick([0x1a120e, 0x2b2b2b, 0x3b2716]), band: undefined, bandana: pick([0x2eff7a, 0x2e8b57, 0x3cb371]), beard: Math.random() < 0.5 ? pick(['full', 'short', 'goatee', 'moustache']) : false,
      sunglasses: Math.random() < 0.2, chain: Math.random() < 0.4, build: wpick([['slim', 0.3], ['average', 0.45], ['heavy', 0.25]]), height: 0.95 + Math.random() * 0.12 };
  }
  for (const k of UNIFORM_KINDS) if (base === LOOKS[k]) return uniformLook(k);
  return base;
}

// =====================================================================================================================
// SURFACES (release 3, P2). Every person still shares ONE material and costs one draw call, but a surface is no longer a flat colour: the vertex colour stays the base (skin, cloth, hair) and a fragment patch
// multiplies shared procedural textures into it, chosen per vertex through the `uv` attribute:
//   uv.x <= -0.5   FABRIC  id = -uv.x (FAB.*): a layer of the fabric array, projected triplanar from the BIND-POSE position (nothing to unwrap, and the weave stays glued to the body while it moves);
//                          it adds a luminance weave / grain / ribs / check, a roughness swing and a bump (denim twill, knit ribs, leather pebbles, ripstop, herringbone, straw basket weave ...)
//   uv.x  > 0      ATLAS   (u, v) in the face atlas: faces (8 expressions x sex x age), eyes (6 lid states), hair strands. A texel multiplies the vertex colour (skin tone) and the masks refine it:
//                          maskA.r dark (brows, stubble: darkened to tint.a), maskA.g tint (iris, lipstick, hair streaks: coloured by tint.rgb), maskA.b absolute (sclera, teeth, pupil, lashes: the texel colour itself);
//                          maskB.r roughness, maskB.g height (bump)
//   uv = 0         plain   (everything else: unchanged shading)
// `tint` is a normalised byte attribute (rgb + a). The atlas is drawn once, lazily, on a canvas (no files); expressions change a face's UVs in place (see FACE below), never its geometry.
// =====================================================================================================================
export const FAB = { denim: 1, jersey: 2, poplin: 3, knit: 4, fleece: 5, wool: 6, leather: 7, nylon: 8, satin: 9, canvas: 10, cord: 11, pique: 12, pinstripe: 13, rubber: 14, straw: 15, plaid: 16, spandex: 17, twill: 18, mesh: 19, glitter: 20, glass: 21, metal: 22, felt: 23 };
// per layer: tiles per metre, bump height (m), base roughness, roughness swing with the height
const FAB_INFO = [null,
  { tile: 9, amp: 0.00045, rough: 0.9, swing: 0.12 }, { tile: 12, amp: 0.0007, rough: 0.92, swing: 0.1 }, { tile: 11, amp: 0.0003, rough: 0.78, swing: 0.1 }, { tile: 7, amp: 0.0016, rough: 1.0, swing: 0.05 },
  { tile: 9, amp: 0.0008, rough: 1.0, swing: 0.02 }, { tile: 8, amp: 0.0005, rough: 0.84, swing: 0.1 }, { tile: 14, amp: 0.0009, rough: 0.46, swing: 0.4 }, { tile: 8, amp: 0.0005, rough: 0.52, swing: 0.25 },
  { tile: 6, amp: 0.0001, rough: 0.34, swing: 0.1 }, { tile: 10, amp: 0.0008, rough: 0.95, swing: 0.05 }, { tile: 12, amp: 0.0012, rough: 0.95, swing: 0.05 }, { tile: 12, amp: 0.0009, rough: 0.88, swing: 0.1 },
  { tile: 8, amp: 0.0004, rough: 0.82, swing: 0.1 }, { tile: 10, amp: 0.0003, rough: 0.58, swing: 0.2 }, { tile: 9, amp: 0.0016, rough: 0.9, swing: 0.1 }, { tile: 5, amp: 0.0005, rough: 0.86, swing: 0.1 },
  { tile: 14, amp: 0.0002, rough: 0.4, swing: 0.15 }, { tile: 10, amp: 0.0005, rough: 0.85, swing: 0.1 }, { tile: 14, amp: 0.0004, rough: 0.6, swing: 0.2 }, { tile: 16, amp: 0.0006, rough: 0.3, swing: 0.5 },
  { tile: 4, amp: 0, rough: 0.1, swing: 0 }, { tile: 20, amp: 0.0002, rough: 0.28, swing: 0.3 }, { tile: 10, amp: 0.0006, rough: 0.97, swing: 0.03 },
];
const FS = 128; // fabric tile size in texels
const hash2 = (i, j, s) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
// tileable value noise: (x, y) in lattice units, P cells per tile
function pn(x, y, P, s) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), x0 = ((xi % P) + P) % P, x1 = (x0 + 1) % P, y0 = ((yi % P) + P) % P, y1 = (y0 + 1) % P;
  const a = hash2(x0, y0, s), b = hash2(x1, y0, s), c = hash2(x0, y1, s), d = hash2(x1, y1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const pfbm = (x, y, P, s) => (pn(x * P, y * P, P, s) * 0.62 + pn(x * P * 2, y * P * 2, P * 2, s + 7) * 0.38);
const tri = x => Math.abs(x - Math.floor(x) - 0.5) * 2; // triangle wave, period 1, 0..1
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// periodic voronoi (G cells per tile): returns F2 - F1 in cell units, and F1 in o[4]
function voro(u, v, G, s, o) {
  const x = u * G, y = v * G, xi = Math.floor(x), yi = Math.floor(y); let f1 = 9, f2 = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j, wx = ((cx % G) + G) % G, wy = ((cy % G) + G) % G, px = cx + 0.15 + 0.7 * hash2(wx, wy, s), py = cy + 0.15 + 0.7 * hash2(wx, wy, s + 3), d = Math.hypot(px - x, py - y);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
  }
  o[4] = f1; return f2 - f1;
}
// generators: (x, y, out) -> out[0..2] = colour multiplier (1 = the vertex colour), out[3] = height 0..1 (also drives the roughness swing); every pattern period divides 128 so tiles join
const FAB_GEN = [null,
  (x, y, o) => { const u = x / FS, v = y / FS, tw = ((x + y) & 3) < 2 ? 1 : 0, fade = pfbm(u, v, 4, 11), st = pn(u * 32, v * 2, 32, 3), sl = hash2(x, y, 5), l = 0.83 + 0.1 * tw + 0.3 * (fade - 0.5) + 0.1 * (st - 0.5) + 0.07 * (sl - 0.5); o[0] = l * 0.98; o[1] = l; o[2] = l * 1.04; o[3] = 0.3 + 0.45 * tw + 0.25 * sl; }, // 1 denim: twill diagonal, fade patches, streaks
  (x, y, o) => { const c = 0.5 + 0.5 * Math.sin(x / 4 * TAU), r = ((y >> 2) & 1) * 0.5, l = 0.9 + 0.07 * c + 0.05 * Math.sin((y / 4 + r) * TAU) + 0.12 * (pfbm(x / FS, y / FS, 8, 17) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.5 + 0.3 * c; }, // 2 jersey knit
  (x, y, o) => { const w = ((x >> 1) + (y >> 1)) & 1, l = 0.95 + 0.04 * w + 0.05 * (hash2(x, y, 9) - 0.5) + 0.03 * (pfbm(x / FS, y / FS, 6, 4) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.4 + 0.3 * w; }, // 3 poplin
  (x, y, o) => { const u8 = (x & 7) / 8, v8 = (y & 7) / 8, h = Math.pow(Math.sin(Math.PI * u8), 1.3) * (0.78 + 0.22 * Math.cos((v8 + 0.5 * Math.abs(u8 - 0.5)) * TAU)), l = 0.6 + 0.4 * h + 0.06 * (hash2(x, y, 2) - 0.5); o[0] = o[1] = o[2] = l; o[3] = h; }, // 4 knit: rib columns with V stitches
  (x, y, o) => { const l = 0.86 + 0.2 * (hash2(x, y, 6) - 0.5) + 0.14 * (pfbm(x / FS, y / FS, 8, 21) - 0.5); o[0] = o[1] = o[2] = l; o[3] = hash2(x >> 1, y >> 1, 8); }, // 5 fleece
  (x, y, o) => { const d = ((y >> 3) & 1) ? x + y : x - y + 256, t = tri(d / 8), l = 0.82 + 0.13 * t + 0.07 * (hash2(x, y, 12) - 0.5) + 0.08 * (pfbm(x / FS, y / FS, 8, 5) - 0.5); o[0] = o[1] = o[2] = l; o[3] = t; }, // 6 wool: herringbone
  (x, y, o) => { const u = x / FS, v = y / FS, d = voro(u, v, 11, 4, o), e = sst(0.02, 0.22, d), cr = pfbm(u, v, 5, 33), l = 0.6 + 0.4 * e + 0.12 * (cr - 0.5) - 0.06 * (1 - sst(0.0, 0.5, o[4])); o[0] = l * 1.02; o[1] = l; o[2] = l * 0.97; o[3] = 0.25 + 0.65 * e; }, // 7 leather: pebble grain, creases
  (x, y, o) => { const line = (x & 15) === 0 || (y & 15) === 0 ? 1 : 0, wv = (x + y) & 1, l = 0.96 - 0.12 * line + 0.03 * wv + 0.03 * (hash2(x, y, 14) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.25 * wv + 0.55 * line + 0.2; }, // 8 nylon: ripstop grid
  (x, y, o) => { const l = 0.97 + 0.07 * Math.sin((x + y) / FS * TAU * 2) + 0.02 * (pfbm(x / FS, y / FS, 4, 8) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.5 + 0.3 * Math.sin((x - y) / FS * TAU * 3); }, // 9 satin
  (x, y, o) => { const w = ((x >> 1) ^ (y >> 1)) & 1, l = 0.8 + 0.12 * w + 0.1 * (hash2(x, y, 3) - 0.5) + 0.1 * (pfbm(x / FS, y / FS, 6, 31) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.3 + 0.6 * w; }, // 10 canvas: coarse plain weave
  (x, y, o) => { const t = 0.5 + 0.5 * Math.sin(x / 8 * TAU), l = 0.7 + 0.3 * t + 0.05 * (hash2(x, y, 6) - 0.5); o[0] = o[1] = o[2] = l; o[3] = t; }, // 11 corduroy wales
  (x, y, o) => { const a = tri(x / 8), b = tri(y / 8), d = Math.abs(a - 0.5) + Math.abs(b - 0.5), l = 0.76 + 0.3 * sst(0.2, 0.5, d) + 0.05 * (hash2(x, y, 1) - 0.5); o[0] = o[1] = o[2] = l; o[3] = d; }, // 12 piqué waffle
  (x, y, o) => { const d = ((y >> 3) & 1) ? x + y : x - y + 256, t = tri(d / 8), st = (x & 31) === 8 ? 1 : (x & 31) === 9 ? 0.5 : 0, l = 0.8 + 0.07 * t + 0.4 * st + 0.06 * (pfbm(x / FS, y / FS, 8, 9) - 0.5); o[0] = o[1] = o[2] = l; o[3] = t * 0.8; }, // 13 pinstripe suit
  (x, y, o) => { const sp = hash2(x, y, 40) > 0.985 ? 1 : 0, l = 0.93 + 0.09 * (hash2(x, y, 41) - 0.5) + 0.1 * sp + 0.06 * (pfbm(x / FS, y / FS, 8, 2) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.4 + 0.2 * sp; }, // 14 rubber / smooth leather
  (x, y, o) => { const bx = ((x >> 4) + (y >> 4)) & 1, c = bx ? x : y, t = tri(c / 4), l = 0.7 + 0.3 * t + 0.1 * (hash2(x, y, 7) - 0.5) + 0.06 * (pfbm(x / FS, y / FS, 8, 6) - 0.5); o[0] = l * 1.04; o[1] = l; o[2] = l * 0.9; o[3] = 0.3 + 0.65 * t; }, // 15 straw basket weave
  (x, y, o) => { const bands = c => { const m = c % 64; return (m < 8 ? 0.55 : m < 12 ? 0 : m < 20 ? 0.3 : m < 24 ? 0 : m < 28 ? 0.15 : 0) + (m >= 40 && m < 48 ? 0.4 : 0); }, bx = bands(x), by = bands(y), tw = ((x + y) & 3) < 2 ? 1 : 0, l = 0.95 * (1 - 0.5 * bx) * (1 - 0.5 * by) + 0.06 * tw + 0.04 * (hash2(x, y, 50) - 0.5); o[0] = l * (1 + 0.25 * by); o[1] = l * (1 - 0.1 * bx); o[2] = l * (1 + 0.1 * bx); o[3] = 0.4 + 0.3 * tw; }, // 16 plaid / tartan
  (x, y, o) => { const l = 0.96 + 0.04 * Math.sin((x + y) / 16 * TAU) + 0.02 * (hash2(x, y, 3) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.5 + 0.4 * Math.sin((x + y) / 16 * TAU); }, // 17 spandex
  (x, y, o) => { const t = tri((x + y) / 8), l = 0.88 + 0.11 * t + 0.06 * (hash2(x, y, 5) - 0.5) + 0.06 * (pfbm(x / FS, y / FS, 8, 12) - 0.5); o[0] = o[1] = o[2] = l; o[3] = t; }, // 18 twill (coat, work wear)
  (x, y, o) => { const hole = ((x & 3) === 1 && (y & 3) === 1) ? 1 : 0, l = 0.92 - 0.45 * hole + 0.06 * (hash2(x, y, 9) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 1 - hole; }, // 19 mesh
  (x, y, o) => { const r = hash2(x, y, 77), sp = r > 0.955 ? 1 : 0, l = 0.8 + 0.2 * (hash2(x >> 1, y >> 1, 78) - 0.5) + 0.7 * sp; o[0] = l * (1 + 0.2 * sp); o[1] = l; o[2] = l * (1 + 0.3 * sp); o[3] = 0.3 + 0.7 * sp; }, // 20 glitter / sequins
  (x, y, o) => { o[0] = o[1] = o[2] = 1.0; o[3] = 0.5; }, // 21 glass: flat, glossy
  (x, y, o) => { const l = 0.92 + 0.12 * Math.sin(x / 2 * 3.14159) * 0.3 + 0.08 * (hash2(x, y >> 3, 5) - 0.5); o[0] = o[1] = o[2] = l; o[3] = 0.5 + 0.2 * (hash2(x, y >> 3, 5) - 0.5); }, // 22 brushed metal
  (x, y, o) => { const l = 0.88 + 0.22 * (hash2(x, y, 6) - 0.5) + 0.14 * (pfbm(x / FS, y / FS, 8, 30) - 0.5); o[0] = o[1] = o[2] = l; o[3] = hash2(x >> 1, y >> 1, 4); }, // 23 felt / foam (hats, helmet padding)
];
function fabricArray() {
  const N = FAB_INFO.length - 1, data = new Uint8Array(FS * FS * 4 * N), o = [1, 1, 1, 0, 0];
  for (let id = 1; id <= N; id++) { const f = FAB_GEN[id]; for (let y = 0; y < FS; y++) for (let x = 0; x < FS; x++) { f(x, y, o); const k = ((id - 1) * FS * FS + y * FS + x) * 4; data[k] = clamp(o[0] * 0.8 * 255, 0, 255); data[k + 1] = clamp(o[1] * 0.8 * 255, 0, 255); data[k + 2] = clamp(o[2] * 0.8 * 255, 0, 255); data[k + 3] = clamp(o[3] * 255, 0, 255); } }
  const t = new THREE.DataArrayTexture(data, FS, FS, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; return t;
}

// ---------- the material patch ----------
const GL_ARR = (k, d) => FAB_INFO.map(f => (f ? f[k] : d).toFixed(5)).join(', ');
const NFAB = FAB_INFO.length;
const GL_PARS = `
uniform sampler2D chMaskA;
uniform sampler2D chMaskB;
uniform highp sampler2DArray chFab;
varying vec4 vTint;
varying vec3 vFabP;
varying vec3 vFabN;
const float chTile[${NFAB}] = float[${NFAB}](${GL_ARR('tile', 1)});
const float chAmp[${NFAB}] = float[${NFAB}](${GL_ARR('amp', 0)});
const float chRgh[${NFAB}] = float[${NFAB}](${GL_ARR('rough', 0.8)});
const float chSwg[${NFAB}] = float[${NFAB}](${GL_ARR('swing', 0)});`;
const GL_MAP = `
vec3 chMul = vec3(1.0), chAbsC = vec3(0.0); float chRough = 0.8, chH = 0.0, chAbsK = 0.0, chTintK = 0.0, chAlpha = 1.0;
{
  vec2 uvq = vMapUv; vec2 g1 = dFdx(uvq), g2 = dFdy(uvq); vec3 fx = dFdx(vFabP), fy = dFdy(vFabP);
  if (uvq.x <= -0.5) {
    int fid = int(-uvq.x + 0.5); float tl = chTile[fid], L = float(fid - 1);
    vec3 w = pow(abs(normalize(vFabN)), vec3(4.0)); vec3 p = vFabP * tl, px = fx * tl, py = fy * tl; vec4 t = vec4(0.0); float ws = 0.0;
    #ifdef CH_LOW
      if (w.x > w.y && w.x > w.z) t = textureGrad(chFab, vec3(p.zy, L), px.zy, py.zy); else if (w.z > w.y) t = textureGrad(chFab, vec3(p.xy, L), px.xy, py.xy); else t = textureGrad(chFab, vec3(p.xz, L), px.xz, py.xz);
      ws = 1.0;
    #else
      w /= (w.x + w.y + w.z);
      if (w.x > 0.05) { t += w.x * textureGrad(chFab, vec3(p.zy, L), px.zy, py.zy); ws += w.x; }
      if (w.y > 0.05) { t += w.y * textureGrad(chFab, vec3(p.xz, L), px.xz, py.xz); ws += w.y; }
      if (w.z > 0.05) { t += w.z * textureGrad(chFab, vec3(p.xy, L), px.xy, py.xy); ws += w.z; }
    #endif
    t /= max(ws, 0.001); chMul = t.rgb * 1.25; chH = t.a * chAmp[fid]; chRough = clamp(chRgh[fid] + (t.a - 0.5) * chSwg[fid], 0.12, 1.0);
  } else if (uvq.x > 0.0005) {
    vec4 c = textureGrad(map, uvq, g1, g2), ma = textureGrad(chMaskA, uvq, g1, g2), mb = textureGrad(chMaskB, uvq, g1, g2);
    chMul = c.rgb * 1.25 * mix(1.0, vTint.a, ma.r); chAlpha = mb.b; chAbsC = c.rgb; chAbsK = ma.b; chTintK = ma.g; chRough = mb.r; chH = mb.g * 0.004;
  }
}
diffuseColor.rgb *= chMul; diffuseColor.a *= chAlpha;`;
const GL_POST_COLOR = `
if (chTintK > 0.0 && dot(vTint.rgb, vec3(1.0)) > 0.01) diffuseColor.rgb = mix(diffuseColor.rgb, vTint.rgb * chMul, chTintK);
diffuseColor.rgb = mix(diffuseColor.rgb, chAbsC, chAbsK);`;
const GL_BUMP = `
#ifndef CH_LOW
{ vec2 dH = vec2(dFdx(chH), dFdy(chH)); vec3 sp = -vViewPosition, sx = dFdx(sp), sy = dFdy(sp), R1 = cross(sy, normal), R2 = cross(normal, sx); float det = dot(sx, R1);
  if (abs(det) > 1e-12 && (abs(dH.x) + abs(dH.y)) > 0.0) { vec3 gr = sign(det) * (dH.x * R1 + dH.y * R2); normal = normalize(abs(det) * normal - gr); } }
#endif`;
function patchChar(shader) {
  shader.uniforms.chMaskA = { value: SURF.maskA }; shader.uniforms.chMaskB = { value: SURF.maskB }; shader.uniforms.chFab = { value: SURF.fab };
  shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 tint;\nvarying vec4 vTint;\nvarying vec3 vFabP;\nvarying vec3 vFabN;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTint = tint;\nvFabP = position;\nvFabN = normal;');
  shader.fragmentShader = (QUALITY === 'low' ? '#define CH_LOW\n' : '') + shader.fragmentShader.replace('#include <map_pars_fragment>', '#include <map_pars_fragment>' + GL_PARS).replace('#include <map_fragment>', GL_MAP)
    .replace('#include <color_fragment>', '#include <color_fragment>' + GL_POST_COLOR).replace('#include <roughnessmap_fragment>', 'float roughnessFactor = chRough;')
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>' + GL_BUMP);
}
const SURF = { ready: false, fab: null, maskA: null, maskB: null, atlas: null };
charMat.alphaTest = 0.5; charMat.roughness = 1; charMat.onBeforeCompile = patchChar; charMat.customProgramCacheKey = () => 'char-r3-' + (QUALITY === 'low' ? 'low' : 'hi');

// ---------- skeleton (bind pose in metres; H = 1 is a 1.73 m body, look.height scales the whole group) ----------
// Finger geometry is modelled in a RELAXED pose (fingers slightly curled), so a bone rotation of 0 is the relaxed hand: positive = more curl (a fist), negative = open.
const FIN = { a1: 0.22, a2: 0.42, l1: 0.043, l2: 0.042, y0: 0.80, dx: 0.006 }; // relaxed finger: flexion of the first / second phalanx (rad), their lengths, knuckle height, root x offset
const FJ_DX = FIN.dx - FIN.l1 * Math.sin(FIN.a1), FJ_Y = FIN.y0 - FIN.l1 * Math.cos(FIN.a1); // the first finger joint
const BONES = [ // name, parent, side (+1 = the character's left = +x, -1 = right, 0 = centre), x group ('a' = arm x, 'l' = leg x of the body spec, '' = 0), y, z, dx (extra x towards the side)
  ['hips', -1, 0, '', 0.94, 0, 0], ['spine', 0, 0, '', 1.08, 0, 0], ['chest', 1, 0, '', 1.28, 0, 0], ['neck', 2, 0, '', 1.47, 0, 0], ['head', 3, 0, '', 1.56, 0, 0],
  ['upperArm.L', 2, 1, 'a', 1.42, 0, 0], ['foreArm.L', 5, 1, 'a', 1.13, 0, 0], ['hand.L', 6, 1, 'a', 0.88, 0, 0],
  ['upperArm.R', 2, -1, 'a', 1.42, 0, 0], ['foreArm.R', 8, -1, 'a', 1.13, 0, 0], ['hand.R', 9, -1, 'a', 0.88, 0, 0], ['prop', 10, -1, 'a', 0.83, 0, -0.016], // prop: the centre of the fist (a held item's origin)
  ['thigh.L', 0, 1, 'l', 0.92, 0, 0], ['shin.L', 12, 1, 'l', 0.50, 0, 0], ['foot.L', 13, 1, 'l', 0.08, 0, 0],
  ['thigh.R', 0, -1, 'l', 0.92, 0, 0], ['shin.R', 15, -1, 'l', 0.50, 0, 0], ['foot.R', 16, -1, 'l', 0.08, 0, 0],
  ['finger.L', 7, 1, 'a', FIN.y0, 0, FIN.dx], ['fingerTip.L', 18, 1, 'a', FJ_Y, 0, FJ_DX], ['thumb.L', 7, 1, 'a', 0.862, 0.020, -0.002],
  ['finger.R', 10, -1, 'a', FIN.y0, 0, FIN.dx], ['fingerTip.R', 21, -1, 'a', FJ_Y, 0, FJ_DX], ['thumb.R', 10, -1, 'a', 0.862, 0.020, -0.002],
];
const [HIPS, SPINE, CHEST, NECK, HEAD, UA_L, FA_L, HD_L, UA_R, FA_R, HD_R, PROP, TH_L, SH_L, FT_L, TH_R, SH_R, FT_R, FG_L, FGT_L, TB_L, FG_R, FGT_R, TB_R] = BONES.map((b, i) => i);
const REST_HIPS_Y = 0.94, ARM_OUT = 0.10;
// Documented attachment points (bind pose, H = 1, metres; x = 0 is the body centre). Heads, hats, hair, glasses go on the HEAD bone, held items on PROP, shoes and soles on foot.L / foot.R.
//   head   pivot (0, 1.56, 0); the skull centre is (0, HY = 1.62, 0) and everything head-bound is scaled about (0, 1.50, 0) by HEAD_SCALE (see makeCharacter); chin about y 1.50, crown about y 1.73
//   hand   wrist = the hand.X bone; palm centre = the PROP bone (also the origin of a held item; the barrel runs along -y, "up" is +z); fingers curl about finger.X / fingerTip.X (z axis)
//   foot   ankle = the foot.X bone at y = 0.08; the sole is flat at y = 0 from z = -0.07 (heel) to z = +0.25 (toe), the toe cap reaches z = 0.26
//   torso  ring surface = bodyRing functions below; a garment is the same surface offset by LAYER.* metres (see "layering")
export const ANCHORS = { headPivot: [0, 1.56, 0], skullCentre: [0, 1.62, 0], headScaleCentre: [0, 1.50, 0], chin: [0, 1.50, 0.08], crown: [0, 1.73, 0], neckBase: [0, 1.47, 0], shoulderY: 1.42, hipY: 0.94, ankleY: 0.08, soleHeelZ: -0.07, soleToeZ: 0.25, fist: 'bones.prop', leftWrist: 'bones["hand.L"]', rightWrist: 'bones["hand.R"]', leftFoot: 'bones["foot.L"]', rightFoot: 'bones["foot.R"]' };
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
  if (o && (o.fab || o.tint)) addSurf(g, tot, o.fab, o.tint);
  return g;
}
// fabric id (uv.x = -id) and tint (rgba 0..1) for every vertex of a geometry
function addSurf(g, n, fab, tint) {
  if (fab) { const UV = new Float32Array(n * 2); for (let i = 0; i < n; i++) UV[i * 2] = -fab; g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); }
  if (tint) { const TI = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { TI[i * 4] = tint[0] * 255; TI[i * 4 + 1] = tint[1] * 255; TI[i * 4 + 2] = tint[2] * 255; TI[i * 4 + 3] = (tint[3] === undefined ? 1 : tint[3]) * 255; } g.setAttribute('tint', new THREE.BufferAttribute(TI, 4, true)); }
}

// Welds skinned pieces into one indexed geometry; copies position, normal, color, skinIndex and skinWeight.
function mergeSkinned(geos) {
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), K = new Float32Array(nv * 3), SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), I = new Uint16Array(ni), UV = new Float32Array(nv * 2), TI = new Uint8Array(nv * 4);
  for (let i = 3; i < nv * 4; i += 4) TI[i] = 255; // no tint: rgb 0, a 1 (no darkening)
  let vo = 0, io = 0;
  for (const g of geos) {
    const a = g.attributes, c = a.position.count, ix = g.index.array;
    P.set(a.position.array, vo * 3); N.set(a.normal.array, vo * 3); K.set(a.color.array, vo * 3); SI.set(a.skinIndex.array, vo * 4); SW.set(a.skinWeight.array, vo * 4); if (a.uv) UV.set(a.uv.array, vo * 2); if (a.tint) TI.set(a.tint.array, vo * 4);
    for (let i = 0; i < ix.length; i++) I[io + i] = ix[i] + vo;
    vo += c; io += ix.length;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(N, 3)); out.setAttribute('color', new THREE.BufferAttribute(K, 3));
  out.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); out.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4)); out.setIndex(new THREE.BufferAttribute(I, 1)); out.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); out.setAttribute('tint', new THREE.BufferAttribute(TI, 4, true));
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
// bevelled torso block: 4 radial segments rotated 45 degrees (a box frustum, w0/d0 at y0, w1/d1 at y1); med/high use 8 for a rounder body
function taper(bone, w0, d0, w1, d1, y0, y1, x, z, c, o, four) {
  const k4 = four || !B.hi, k = k4 ? 0.70710678 : 0.5;
  cyl(bone, w0 * k, d0 * k, w1 * k, d1 * k, y1 - y0, x, (y0 + y1) / 2, z, c, Object.assign({ seg: k4 ? 4 : 8, part: [k4 ? Math.PI / 4 : 0, TAU] }, o));
}
const box = (bone, w, h, d, x, y, z, c, o) => { const r = (o && o.rot) || ZERO3; put(emit(uBox(), xf(x, y, z, r[0], r[1], r[2], w, h, d), c, bone, o)); };
// thin box between two points
function bar(bone, x0, y0, z0, x1, y1, z1, thick, c, o) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0; _fe.set(-Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 'YXZ'); _fq.setFromEuler(_fe);
  _bm.compose(_fp.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), _fq, _fs.set(thick, thick, Math.hypot(dx, dy, dz)));
  put(emit(uBox(), _bm, c, bone, o));
}
function ring(bone, rx, rz, tube, x, y, z, c, rot, o) {
  const r = rot || ZERO3; put(emit(ringUnit(rx, rz, tube, (o && o.rs) || (B.hi ? 6 : 4), (o && o.ts) || (B.hi ? 14 : 9), o && o.arc), xf(x, y, z, r[0], r[1], r[2], 1, 1, 1), c, bone, o));
}

// =====================================================================================================================
// BODY MODEL. A body is a set of LOFTS (rings swept along a limb or the trunk), skinned with blended weights across every joint, built once per
// (sex, build, width, LOD) and cached; a person copies the cached arrays and only computes vertex colours (skin tone). Garments are the SAME ring
// surfaces offset by LAYER.* metres with the same weights, so cloth follows the skin through every bend and never z-fights (see "layering" in buildBody).
// =====================================================================================================================
const X_AX = [1, 0, 0], Y_AX = [0, 1, 0], Z_AX = [0, 0, 1];
const gaus = (x, c, s) => Math.exp(-(((x - c) / s) ** 2));
const smx = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }; // smoothstep, a < b
export const LAYER = { under: 0.004, bottom: 0.010, top: 0.018, outer: 0.028, armor: 0.040 }; // offsets of cloth layers from the skin surface, metres

// Hermite interpolation over key rows [y, v0, v1, ...]; returns a shared scratch array (read it at once)
const _hk = [0, 0, 0, 0, 0, 0];
function hk(keys, y) {
  const n = keys.length; let i = 0; while (i < n - 2 && y > keys[i + 1][0]) i++;
  const k0 = keys[i], k1 = keys[i + 1], km = keys[i > 0 ? i - 1 : 0], kp = keys[i + 2 < n ? i + 2 : n - 1];
  const h = k1[0] - k0[0], t = clamp((y - k0[0]) / h, 0, 1), t2 = t * t, t3 = t2 * t, h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2, d0 = k1[0] - km[0] || 1, d1 = kp[0] - k0[0] || 1;
  for (let v = 1; v < k0.length; v++) _hk[v - 1] = h00 * k0[v] + h10 * (k1[v] - km[v]) / d0 * h + h01 * k1[v] + h11 * (kp[v] - k0[v]) / d1 * h;
  return _hk;
}
const lin = (keys, y) => { let i = 0; while (i < keys.length - 2 && y > keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1]; return a[1] + (b[1] - a[1]) * clamp((y - a[0]) / (b[0] - a[0]), 0, 1); };
// value noise for the skin tone mottling
function hash3(i, j, k) { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1274126177)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const a = hash3(i, j, k) + (hash3(i + 1, j, k) - hash3(i, j, k)) * u, b = hash3(i, j + 1, k) + (hash3(i + 1, j + 1, k) - hash3(i, j + 1, k)) * u, c = hash3(i, j, k + 1) + (hash3(i + 1, j, k + 1) - hash3(i, j, k + 1)) * u, d = hash3(i, j + 1, k + 1) + (hash3(i + 1, j + 1, k + 1) - hash3(i, j + 1, k + 1)) * u;
  const e = a + (b - a) * v, f = c + (d - c) * v; return e + (f - e) * w;
}

// ---------- body spec: proportions of one body type ----------
// Base = an average adult male (1.73 m). Rows are [y, half width x, front depth z, back depth z] for the trunk, [y, half width, half depth, centre z] for a limb. Sex and build scale them by zone.
const TK0 = [[0.70, 0.062, 0.030, 0.050], [0.73, 0.088, 0.032, 0.050], [0.76, 0.115, 0.036, 0.056], [0.79, 0.140, 0.044, 0.068], [0.82, 0.158, 0.064, 0.086], [0.86, 0.170, 0.094, 0.110], [0.94, 0.165, 0.100, 0.112], [1.02, 0.150, 0.097, 0.099], [1.08, 0.141, 0.094, 0.092], [1.15, 0.148, 0.097, 0.093], [1.23, 0.160, 0.104, 0.096],
  [1.31, 0.172, 0.112, 0.098], [1.37, 0.178, 0.107, 0.093], [1.41, 0.170, 0.096, 0.090], [1.432, 0.142, 0.083, 0.082], [1.452, 0.108, 0.070, 0.072], [1.476, 0.078, 0.060, 0.062], [1.50, 0.062, 0.056, 0.057], [1.525, 0.056, 0.054, 0.054]];
const AK0 = [[1.422, 0.014, 0.018, 0], [1.415, 0.034, 0.038, 0], [1.401, 0.050, 0.053, 0.001], [1.381, 0.058, 0.060, 0.002], [1.345, 0.057, 0.060, 0.003], [1.285, 0.051, 0.056, 0.006], [1.215, 0.045, 0.049, 0.004], [1.165, 0.041, 0.043, 0],
  [1.130, 0.040, 0.042, -0.004], [1.090, 0.043, 0.044, 0], [1.030, 0.040, 0.040, 0], [0.965, 0.033, 0.033, 0], [0.915, 0.027, 0.029, 0], [0.888, 0.021, 0.027, 0]];
const LK0 = [[1.00, 0.042, 0.050, 0], [0.94, 0.050, 0.060, -0.002], [0.88, 0.060, 0.074, -0.002], [0.84, 0.072, 0.088, -0.002], [0.80, 0.086, 0.098, -0.001], [0.76, 0.088, 0.094, 0], [0.66, 0.078, 0.083, 0.003], [0.58, 0.066, 0.071, 0.004], [0.525, 0.059, 0.064, 0.005], [0.485, 0.058, 0.060, 0.002],
  [0.43, 0.058, 0.064, -0.004], [0.36, 0.060, 0.069, -0.008], [0.28, 0.051, 0.058, -0.006], [0.19, 0.040, 0.045, -0.003], [0.13, 0.036, 0.040, 0], [0.085, 0.037, 0.041, 0.004], [0.055, 0.036, 0.041, 0.004]];
// multipliers: hp hips, wa waist, ch chest, sh shoulders, dz trunk depth, nk neck, ar arms, th thigh, cf calf; ax arm x, lx leg x, bu bust (f) / pectoral (m) bump, gl glute bump, hk hand size
const SEX_SPEC = {
  m: { hp: 0.97, wa: 1, ch: 1, sh: 1, dz: 1, nk: 1, ar: 1, th: 1, cf: 1, ax: 0.19, lx: 0.088, bu: 0.008, gl: 0.016, hk: 1, neck: 0.054 },
  f: { hp: 1.05, wa: 0.82, ch: 0.89, sh: 0.89, dz: 0.94, nk: 0.82, ar: 0.82, th: 1.02, cf: 0.88, ax: 0.171, lx: 0.093, bu: 0.046, gl: 0.032, hk: 0.92, neck: 0.054 },
};
const BUILD_SPEC = { // slim | average | athletic | heavy (belly = extra front depth at the waist, buK scales the bust or pectorals)
  slim: { hp: 0.93, wa: 0.88, ch: 0.93, sh: 0.94, dz: 0.92, belly: -0.004, ar: 0.84, th: 0.85, cf: 0.87, nk: 0.9, buK: [0.6, 0.85], glK: 0.8 },
  average: { hp: 1, wa: 1, ch: 1, sh: 1, dz: 1, belly: 0, ar: 1, th: 1, cf: 1, nk: 1, buK: [1, 1], glK: 1 },
  athletic: { hp: 0.99, wa: 0.92, ch: 1.12, sh: 1.1, dz: 1.05, belly: -0.006, ar: 1.2, th: 1.12, cf: 1.12, nk: 1.12, buK: [3.2, 1.0], glK: 1.3 },
  heavy: { hp: 1.14, wa: 1.4, ch: 1.12, sh: 1.05, dz: 1.08, belly: 0.058, ar: 1.28, th: 1.24, cf: 1.14, nk: 1.22, buK: [1.9, 1.3], glK: 1.35 },
};
const _specs = new Map();
// res = residual width factor of the person within the build (quantised to 0.03 steps so the cache stays small)
export function bodySpec(fem, build, res) {
  if (!BUILD_SPEC[build]) build = 'average'; res = Math.round(clamp(res || 1, 0.94, 1.06) * 33) / 33;
  const key = (fem ? 'f' : 'm') + build + res; let S = _specs.get(key); if (S) return S;
  const sx = fem ? SEX_SPEC.f : SEX_SPEC.m, b = BUILD_SPEC[build], hp = sx.hp * b.hp, wa = sx.wa * b.wa, ch = sx.ch * b.ch, sh = sx.sh * b.sh, dz = sx.dz * b.dz;
  const mx = [[0.7, hp], [0.92, hp], [1.08, wa], [1.2, (wa + ch) / 2], [1.31, ch], [1.39, sh], [1.46, 1], [1.6, 1]]; // lateral multiplier by height
  S = { fem, build, res, tk: [], ak: [], lk: [], pc: [null, null, null], handK: sx.hk, armX: sx.ax * (0.5 + 0.5 * sh) * res, legX: sx.lx * (0.7 + 0.3 * hp) * res, neckR: sx.neck * sx.nk * b.nk, bust: sx.bu * b.buK[fem ? 1 : 0], pecX: fem ? 0.062 : 0.078, glute: sx.gl * b.glK };
  for (const r of TK0) {
    const y = r[0], belly = b.belly * gaus(y, 1.06, 0.1), zone = fem && y > 0.95 && y < 1.2 ? 0.93 : 1;
    S.tk.push([y, r[1] * lin(mx, y) * res, (r[2] + belly) * dz * zone, r[3] * dz * zone * (1 + (b.belly > 0.02 ? 0.05 * gaus(y, 1.06, 0.1) : 0))]);
  }
  const arm = sx.ar * b.ar, thigh = sx.th * b.th, calf = sx.cf * b.cf;
  // (the limb tables above read top to bottom; interpolation wants ascending y)
  for (const r of AK0.slice().reverse()) { const m = r[0] > 1.2 ? arm : r[0] < 1.1 ? 1 + (arm - 1) * 0.55 : 1 + (arm - 1) * (0.55 + 0.45 * (r[0] - 1.1) / 0.1); S.ak.push([r[0], r[1] * m * res, r[2] * m * res, r[3]]); }
  for (const r of LK0.slice().reverse()) { const m = r[0] > 0.66 ? thigh : r[0] > 0.5 ? mixn(calf, thigh, (r[0] - 0.5) / 0.16) : r[0] > 0.2 ? calf : mixn(1, calf, (r[0] - 0.05) / 0.15); S.lk.push([r[0], r[1] * m * res, r[2] * m * res, r[3]]); }
  _specs.set(key, S); return S;
}
// BODY KIND of a look: build ('slim' | 'average' | 'athletic' | 'heavy') and the width residual
function bodyKind(look) {
  let build = look.build; if (!BUILD_SPEC[build]) { const w = look.width || 1; build = w < 0.93 ? 'slim' : w > 1.1 ? 'heavy' : 'average'; }
  const w = look.width || BUILD_W[build] || 1; return { build, res: w / (BUILD_W[build] || 1) };
}

// ---------- skin weights (bones a ring is bound to) ----------
function wt(list) { const b = [0, 0, 0, 0], w = [0, 0, 0, 0]; let n = 0, t = 0; for (const e of list) if (e[1] > 1e-4 && n < 4) { b[n] = e[0]; w[n] = e[1]; t += e[1]; n++; } for (let i = 0; i < 4; i++) w[i] /= t || 1; return [b, w]; }
function wTorso(y) { const a = smx(0.9, 1.12, y), b = smx(1.2, 1.38, y), c = smx(1.44, 1.56, y); return wt([[HIPS, 1 - a], [SPINE, a * (1 - b)], [CHEST, a * b * (1 - c)], [NECK, a * b * c]]); }
function wArm(s, y) { // the shoulder cap shares with the chest, the elbow blends upper arm and fore arm over 12 cm, the wrist fore arm and hand over 6 cm
  const ua = s > 0 ? UA_L : UA_R, fa = s > 0 ? FA_L : FA_R, hd = s > 0 ? HD_L : HD_R, top = smx(1.40, 1.49, y) * 0.4, e = 1 - smx(1.07, 1.19, y), wr = 1 - smx(0.875, 0.935, y);
  return wt([[CHEST, top], [ua, (1 - top) * (1 - e)], [fa, (1 - top) * e * (1 - wr)], [hd, (1 - top) * e * wr]]);
}
function wLeg(s, y) {
  const th = s > 0 ? TH_L : TH_R, sh = s > 0 ? SH_L : SH_R, ft = s > 0 ? FT_L : FT_R, hw = smx(0.86, 1.0, y) * 0.85, k = 1 - smx(0.44, 0.58, y), a = 1 - smx(0.085, 0.14, y);
  return wt([[HIPS, hw], [th, (1 - hw) * (1 - k)], [sh, (1 - hw) * k * (1 - a)], [ft, (1 - hw) * k * a]]);
}
const wNeck = y => wt([[CHEST, (1 - smx(1.44, 1.5, y)) * 0.5], [NECK, 1 - smx(1.53, 1.58, y)], [HEAD, smx(1.53, 1.58, y)]]);

// the crotch region follows the thighs: below y = 0.9 the trunk's vertices take up to half their weight from the thigh on their side (so a squat or a high kick bends the groin instead of leaving a block behind)
function pelvisSkin(x, y, z, si, sw, k) {
  const t = 0.5 * (1 - smx(0.70, 0.9, y)), s = clamp(x / 0.08, -1, 1), wl = t * (0.5 + 0.5 * s), wr = t * (0.5 - 0.5 * s), a = si[k], w0 = sw[k];
  if (t < 0.002 || a !== HIPS || w0 < 0.999) return;
  si[k] = HIPS; sw[k] = 1 - wl - wr; si[k + 1] = TH_L; sw[k + 1] = wl; si[k + 2] = TH_R; sw[k + 2] = wr; si[k + 3] = 0; sw[k + 3] = 0;
}
// ---------- ring surfaces: the body at height y, offset by `off` metres (0 = skin) ----------
export function torsoRing(S, y, off) {
  const v = hk(S.tk, y), w = wTorso(y);
  return { c: [0, y, 0], a: X_AX, b: Z_AX, ra: v[0] + off, rm: (v[1] + v[2]) / 2 + off, rd: (v[1] - v[2]) / 2, sq: 2.35, bu: S.bust * gaus(y, 1.305, 0.05), bx: S.pecX, bs: 0.042, gl: S.glute * gaus(y, 0.865, 0.07), gx: 0.072, gs: 0.055, sb: w[0], sw: w[1] };
}
export function armRing(S, s, y, off) { const v = hk(S.ak, y), w = wArm(s, y); return { c: [s * S.armX, y, v[2]], a: X_AX, b: Z_AX, ra: v[0] + off, rm: v[1] + off, rd: 0, sq: 0, sb: w[0], sw: w[1] }; }
export function legRing(S, s, y, off) { const v = hk(S.lk, y), w = wLeg(s, y); return { c: [s * S.legX, y, v[2]], a: X_AX, b: Z_AX, ra: v[0] + off, rm: v[1] + off, rd: 0, sq: 0, sb: w[0], sw: w[1] }; }
function neckRing(S, y) { const r = S.neckR; return { c: [0, y, 0.014 * smx(1.45, 1.58, y)], a: X_AX, b: Z_AX, ra: r, rm: r * 1.05, rd: 0, sq: 0, sb: wNeck(y)[0], sw: wNeck(y)[1] }; }
// z of the clothing surface at (x, y) on the front of the trunk (for decals, plackets, ties)
export function frontZ(S, y, off, x) {
  const r = torsoRing(S, y, off), pw = 2 / r.sq, cp = clamp(Math.abs(x) / r.ra, 0, 1), c = Math.pow(cp, 1 / pw), s = Math.pow(Math.max(0, 1 - c * c), 0.5), sp = Math.pow(s, pw);
  return sp * (r.rm + r.rd * sp) + r.bu * sp * sp * Math.exp(-(((Math.abs(x) - r.bx) / r.bs) ** 2));
}
export function backZ(S, y, off) { const r = torsoRing(S, y, off); return -(r.rm - r.rd); }

// ---------- loft: rings -> skinned indexed mesh with smooth normals ----------
// ring: { c centre, a / b unit axes of the ring plane, ra radius along a, rm + rd * s radius along b (front / back differ), sq super-ellipse exponent (0 = ellipse), bu / bx / bs front bump, gl / gx / gs back bump,
//         sb / sw bone indices and weights, a0 / asw arc start and sweep for open shells, k brightness }.   o: { col, open, capLo, capHi, flip, sh [yLo, yHi, mulLo, mulHi], vs (x,y,z,nx,ny,nz) => mul, noise, skin (x,y,z,si,sw,k) => void, tone }
function loft(rings, seg, o) {
  o = o || {}; const nr = rings.length, closed = !o.open, ns = closed ? seg : seg + 1, capLo = !!o.capLo, capHi = !!o.capHi, nv = nr * ns + (capLo ? 1 : 0) + (capHi ? 1 : 0), cl = o.col;
  const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), SI = new Uint16Array(nv * 4), SW = new Float32Array(nv * 4), K = new Float32Array(nv * 3), T = o.tone ? new Float32Array(nv * 2) : null;
  let big = 0, bigR = -1;
  for (let i = 0; i < nr; i++) {
    const R = rings[i], a0 = R.a0 !== undefined ? R.a0 : (o.a0 || 0), asw = closed ? TAU : (R.asw !== undefined ? R.asw : TAU), pw = R.sq ? 2 / R.sq : 1, rm = R.rm, rd = R.rd || 0, ca = R.c, A = R.a, Bv = R.b;
    if (R.ra > bigR) { bigR = R.ra; big = i; }
    for (let j = 0; j < ns; j++) {
      const th = a0 + asw * j / seg; let c = Math.cos(th), s = Math.sin(th);
      if (pw !== 1) { c = Math.sign(c) * Math.pow(Math.abs(c), pw); s = Math.sign(s) * Math.pow(Math.abs(s), pw); }
      const u = R.ra * c; let v = s * (rm + rd * s);
      if (R.bu && s > 0) v += R.bu * s * s * Math.exp(-(((Math.abs(u) - R.bx) / R.bs) ** 2));
      if (R.gl && s < 0) v -= R.gl * s * s * Math.exp(-(((Math.abs(u) - R.gx) / R.gs) ** 2));
      const k = (i * ns + j) * 3; P[k] = ca[0] + A[0] * u + Bv[0] * v; P[k + 1] = ca[1] + A[1] * u + Bv[1] * v; P[k + 2] = ca[2] + A[2] * u + Bv[2] * v;
    }
  }
  const tn = [0, 0, 0];
  const rawN = (i, j) => {
    const jp = closed ? (j + 1) % ns : Math.min(j + 1, ns - 1), jm = closed ? (j + ns - 1) % ns : Math.max(j - 1, 0), ip = Math.min(i + 1, nr - 1), im = Math.max(i - 1, 0), a = (i * ns + jp) * 3, b = (i * ns + jm) * 3, c = (ip * ns + j) * 3, d = (im * ns + j) * 3;
    const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
    tn[0] = uy * vz - uz * vy; tn[1] = uz * vx - ux * vz; tn[2] = ux * vy - uy * vx; return tn;
  };
  let sgn = 1; { const j = ns >> 1, n = rawN(big, j), p = (big * ns + j) * 3, cc = rings[big].c; sgn = n[0] * (P[p] - cc[0]) + n[1] * (P[p + 1] - cc[1]) + n[2] * (P[p + 2] - cc[2]) >= 0 ? 1 : -1; }
  const fl = o.flip ? -1 : 1, sh = o.sh, na = o.noise || 0;
  for (let i = 0; i < nr; i++) {
    const R = rings[i], ip = Math.min(i + 1, nr - 1), im = Math.max(i - 1, 0), kk = R.k === undefined ? 1 : R.k;
    for (let j = 0; j < ns; j++) {
      const v = i * ns + j, k = v * 3, n = rawN(i, j), l = Math.hypot(n[0], n[1], n[2]); let nx, ny, nz;
      if (l > 1e-12) { nx = n[0] / l * sgn * fl; ny = n[1] / l * sgn * fl; nz = n[2] / l * sgn * fl; }
      else { const ax = rings[ip].c[0] - rings[im].c[0], ay = rings[ip].c[1] - rings[im].c[1], az = rings[ip].c[2] - rings[im].c[2], al = Math.hypot(ax, ay, az) || 1, sg = (i === 0 ? -1 : 1) * fl; nx = ax / al * sg; ny = ay / al * sg; nz = az / al * sg; }
      N[k] = nx; N[k + 1] = ny; N[k + 2] = nz;
      const sb = R.sb, sw = R.sw; for (let q = 0; q < 4; q++) { SI[v * 4 + q] = sb[q]; SW[v * 4 + q] = sw[q]; }
      if (o.skin) o.skin(P[k], P[k + 1], P[k + 2], SI, SW, v * 4);
      if (T) o.tone(P[k], P[k + 1], P[k + 2], nx, ny, nz, T, v * 2);
      else if (cl) {
        let m = kk; if (sh) m *= sh[2] + (sh[3] - sh[2]) * clamp((P[k + 1] - sh[0]) / (sh[1] - sh[0]), 0, 1);
        if (o.vs) m *= o.vs(P[k], P[k + 1], P[k + 2], nx, ny, nz); if (na) m *= 1 + na * (vnoise(P[k] * 13 + 4.1, P[k + 1] * 13 + 1.7, P[k + 2] * 13 + 8.3) - 0.5) * 2;
        K[k] = cl.r * m; K[k + 1] = cl.g * m; K[k + 2] = cl.b * m;
      }
    }
  }
  const ni = (nr - 1) * seg * 6 + (closed ? ((capLo ? seg * 3 : 0) + (capHi ? seg * 3 : 0)) : 0), I = new Uint16Array(ni); let q = 0;
  for (let i = 0; i < nr - 1; i++) for (let j = 0; j < seg; j++) {
    const jn = closed ? (j + 1) % ns : j + 1, a = i * ns + j, b = i * ns + jn, c = (i + 1) * ns + j, d = (i + 1) * ns + jn;
    if ((sgn * fl) > 0) { I[q++] = a; I[q++] = b; I[q++] = c; I[q++] = b; I[q++] = d; I[q++] = c; } else { I[q++] = a; I[q++] = c; I[q++] = b; I[q++] = b; I[q++] = c; I[q++] = d; }
  }
  const cap = (ri, ci, dir) => { // fan over ring ri around a centre vertex ci; dir = -1 faces away from the loft's start
    let cx = 0, cy = 0, cz = 0; for (let j = 0; j < ns; j++) { const k = (ri * ns + j) * 3; cx += P[k]; cy += P[k + 1]; cz += P[k + 2]; } cx /= ns; cy /= ns; cz /= ns;
    const k = ci * 3, rj = ri === 0 ? 1 : nr - 2, ax = rings[ri].c[0] - rings[rj].c[0], ay = rings[ri].c[1] - rings[rj].c[1], az = rings[ri].c[2] - rings[rj].c[2], al = Math.hypot(ax, ay, az) || 1;
    P[k] = cx; P[k + 1] = cy; P[k + 2] = cz; N[k] = ax / al; N[k + 1] = ay / al; N[k + 2] = az / al; const R = rings[ri], sb = R.sb, sw = R.sw; for (let t = 0; t < 4; t++) { SI[ci * 4 + t] = sb[t]; SW[ci * 4 + t] = sw[t]; }
    if (T) o.tone(cx, cy, cz, N[k], N[k + 1], N[k + 2], T, ci * 2); else if (cl) { K[k] = cl.r * (R.k === undefined ? 1 : R.k); K[k + 1] = cl.g * (R.k === undefined ? 1 : R.k); K[k + 2] = cl.b * (R.k === undefined ? 1 : R.k); }
    const p0 = ri * ns * 3, p1 = (ri * ns + 1) * 3, gx = (P[p0 + 1] - cy) * (P[p1 + 2] - cz) - (P[p0 + 2] - cz) * (P[p1 + 1] - cy), gy = (P[p0 + 2] - cz) * (P[p1] - cx) - (P[p0] - cx) * (P[p1 + 2] - cz), gz = (P[p0] - cx) * (P[p1 + 1] - cy) - (P[p0 + 1] - cy) * (P[p1] - cx);
    const fwd = (gx * N[k] + gy * N[k + 1] + gz * N[k + 2]) * dir >= 0; // does (centre, v_j, v_j+1) face along the cap normal (= along `dir` x the axis)?
    for (let j = 0; j < ns; j++) { const a = ri * ns + j, b = ri * ns + (j + 1) % ns; if (fwd) { I[q++] = ci; I[q++] = a; I[q++] = b; } else { I[q++] = ci; I[q++] = b; I[q++] = a; } }
  };
  let ci = nr * ns; if (closed && capLo) { cap(0, ci, 1); ci++; } if (closed && capHi) { cap(nr - 1, ci, 1); ci++; }
  return { P, N, K, SI, SW, T, idx: I, n: nv, fab: o.fab, tint: o.tint };
}
// BufferGeometry of a loft with its own colour array
function toGeo(l) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(l.P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(l.N, 3)); g.setAttribute('color', new THREE.BufferAttribute(l.K, 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(l.SI, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(l.SW, 4)); g.setIndex(new THREE.BufferAttribute(l.idx, 1)); if (l.fab || l.tint) addSurf(g, l.n, l.fab, l.tint); return g;
}

// ---------- skin tone: undertone, subsurface warmth in the shadows, blush where blood is near the surface ----------
const _blush = new Map();
// the skin colours of one person: base = the tone x the person's nuance, blush = the same tone shifted red (cached per tone; the base is a small per-person object, so nothing grows with the number of people)
function skinInfo(hex, tone) {
  const c = col(hex), t = tone || 1; let blush = _blush.get(hex);
  if (!blush) { const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, light = clamp(L / 0.6, 0, 1); blush = new THREE.Color(Math.min(1, c.r * (1.05 + 0.1 * light)), c.g * (0.62 + 0.14 * (1 - light)), c.b * (0.58 + 0.16 * (1 - light))); _blush.set(hex, blush); } // a red shift stronger on pale skin (blood shows through), subtle on deep skin
  return { base: new THREE.Color(c.r * t, c.g * t, c.b * t), blush };
}
// vertex colour of a cached skin loft = base tone x brightness (darker zones shift towards red, highlights towards yellow) mixed with blush
function skinGeo(l, info, fr) {
  const n = l.n, K = new Float32Array(n * 3), T = l.T, b = info.base, bl = info.blush, P = l.P;
  for (let i = 0; i < n; i++) {
    const k = T[i * 2], u = T[i * 2 + 1]; let r = b.r * Math.pow(k, 0.82), g = b.g * Math.pow(k, 1.12), bb = b.b * Math.pow(k, 1.2);
    r += (bl.r - r) * u; g += (bl.g - g) * u; bb += (bl.b - bb) * u;
    if (fr > 0) { // freckles on the shoulders, upper arms and upper chest: speckles of warm brown where a high-frequency noise peaks
      const y = P[i * 3 + 1], zone = smx(1.22, 1.32, y) * (1 - smx(1.44, 1.5, y));
      if (zone > 0.01) { const sp = smx(0.72, 0.9, vnoise(P[i * 3] * 60 + 11.3, y * 60 + 3.7, P[i * 3 + 2] * 60 + 5.9)) * zone * fr; r *= 1 - 0.1 * sp; g *= 1 - 0.2 * sp; bb *= 1 - 0.24 * sp; }
    }
    K[i * 3] = r; K[i * 3 + 1] = g; K[i * 3 + 2] = bb;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(l.P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(l.N, 3)); g.setAttribute('color', new THREE.BufferAttribute(K, 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(l.SI, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(l.SW, 4)); g.setIndex(new THREE.BufferAttribute(l.idx, 1)); return g;
}
// per-vertex tone: [brightness, blush] written to T[k], T[k+1]
function toneFor(kind, S, s) {
  return (x, y, z, nx, ny, nz, T, k) => {
    let b = 1 + 0.07 * (vnoise(x * 11 + 2.3, y * 11 + 5.1, z * 11 + 9.7) - 0.5) + 0.04 * (vnoise(x * 29 + 7, y * 29 + 1, z * 29 + 3) - 0.5), bl = 0;
    if (kind === 'torso') {
      const ax = Math.abs(x); b *= 1 - 0.13 * gaus(y, 1.35, 0.05) * clamp((ax - 0.11) / 0.05, 0, 1); // armpit
      b *= 1 - 0.14 * (1 - smx(0.74, 0.86, y)); // groin
      if (nz > 0.3) bl += 0.07 * gaus(y, 1.44, 0.025) + 0.03 * gaus(y, 1.3, 0.07); // collarbone, chest
      if (nz < -0.3) b *= 1 - 0.06 * gaus(y, 1.08, 0.08); // small of the back
    } else if (kind === 'neck') { b *= 1 - 0.14 * smx(1.5, 1.57, y) * (nz > 0 ? 1 : 0.3); bl += 0.04;
    } else if (kind === 'arm') {
      bl += 0.15 * gaus(y, 1.13, 0.03) * (nz < 0 ? 1 : 0.3) + 0.04 * gaus(y, 1.43, 0.03) + 0.05 * gaus(y, 0.90, 0.025); b *= 1 - 0.11 * gaus(y, 1.15, 0.035) * (nz > 0.2 ? 1 : 0); // elbow, shoulder, wrist, inner elbow
      if (-s * nx > 0.55) b *= 1.05; // the inner arm is paler
    } else if (kind === 'leg') {
      bl += 0.13 * gaus(y, 0.51, 0.035) * (nz > 0 ? 1 : 0.4) + 0.06 * gaus(y, 0.09, 0.03); b *= 1 - 0.13 * gaus(y, 0.5, 0.04) * (nz < -0.2 ? 1 : 0); // knee, ankle, back of the knee
      if (-s * nx > 0.6 && y > 0.6) b *= 0.93; // inner thigh
      if (nz > 0.5 && y > 0.22 && y < 0.46) b *= 1.035; // shin
    } else if (kind === 'hand') {
      const back = nx * s > 0.3; if (back) bl += 0.17 * gaus(y, 0.80, 0.012) + 0.07 * gaus(y, 0.758, 0.01); else { b *= 0.95; bl += 0.05; }
      if (y < 0.745) bl += 0.14 * smx(0.745, 0.715, y); // fingertips
    } else if (kind === 'foot') { bl += 0.12 * smx(0.2, 0.25, z) + 0.08 * (1 - smx(-0.07, -0.04, z)); b *= nz > 0 ? 1 : 1; }
    T[k] = b; T[k + 1] = clamp(bl, 0, 0.6);
  };
}

// ---------- cached skin pieces per body spec and LOD ----------
const LD = { tseg: [16, 12, 9], lseg: [10, 8, 6], nseg: [8, 7, 5], pseg: [8, 7, 5], tstep: [0.034, 0.05, 0.075], lstep: [0.042, 0.06, 0.09] };
function stn(y0, y1, step, joints) { // ring heights from y0 to y1, denser near joints
  const dir = y1 > y0 ? 1 : -1, ys = [y0]; let y = y0;
  for (;;) { let st = step; if (joints) for (const j of joints) if (Math.abs(y - j) < 0.07) { st = step * 0.6; break; } y += dir * st; if ((y1 - y) * dir <= step * 0.4) { ys.push(y1); break; } ys.push(y); }
  return ys;
}
const TORSO_JOINTS = [0.82, 1.08], ARM_JOINTS = [1.13, 0.9], LEG_JOINTS = [0.5, 0.09, 0.82];
function pathRing(P0, P1, P2, r1, r2, w, hint) { // ring at P1 of a path, perpendicular to the path; r1 radius along a, r2 along b
  const tx = P2[0] - P0[0], ty = P2[1] - P0[1], tz = P2[2] - P0[2], tl = Math.hypot(tx, ty, tz) || 1, t = [tx / tl, ty / tl, tz / tl];
  let ax = hint[1] * t[2] - hint[2] * t[1], ay = hint[2] * t[0] - hint[0] * t[2], az = hint[0] * t[1] - hint[1] * t[0]; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
  const bx = t[1] * az - t[2] * ay, by = t[2] * ax - t[0] * az, bz = t[0] * ay - t[1] * ax;
  return { c: P1, a: [ax, ay, az], b: [bx, by, bz], ra: r1, rm: r2, rd: 0, sq: 0, sb: w[0], sw: w[1] };
}
const wtp = list => wt(list);
function handLofts(S, s, lod, out) {
  const m = -s, k = S.handK, ax = s * S.armX, tone = toneFor('hand', S, s), hd = s > 0 ? HD_L : HD_R, ft = s > 0 ? FGT_L : FGT_R, tb = s > 0 ? TB_L : TB_R, fgB = s > 0 ? FG_L : FG_R;
  const PR = [[0.898, 0.0195, 0.027, 0], [0.872, 0.0195, 0.0325, 0.002], [0.844, 0.018, 0.0395, 0.003], [0.818, 0.0165, 0.043, 0.001], [0.801, 0.0145, 0.0415, 0]];
  const pal = (lod === 0 ? PR : [PR[0], PR[2], PR[4]]).map(r => { const w = wArm(s, r[0]); return { c: [ax + s * 0.008 * k, r[0], r[3] * k], a: X_AX, b: Z_AX, ra: r[1] * k, rm: r[2] * k, rd: 0, sq: 2.6, sb: w[0], sw: w[1] }; });
  out.push(loft(pal, LD.pseg[lod], { tone, capHi: true }));
  const fx = ax + s * FIN.dx, y0 = FIN.y0 + 0.003, cosA = Math.cos(FIN.a1), L1 = (y0 - FJ_Y) / cosA, d1 = [m * Math.sin(FIN.a1), -cosA, 0], d2 = [m * Math.sin(FIN.a1 + FIN.a2), -Math.cos(FIN.a1 + FIN.a2), 0];
  const W7 = [wtp([[hd, 0.5], [fgB, 0.5]]), wtp([[fgB, 1]]), wtp([[fgB, 0.8], [ft, 0.2]]), wtp([[fgB, 0.5], [ft, 0.5]]), wtp([[ft, 0.85], [fgB, 0.15]]), wtp([[ft, 1]]), wtp([[ft, 1]])];
  const fingerPts = (zc, L2) => { const J = [fx + d1[0] * L1, y0 + d1[1] * L1, zc], pts = []; for (const f of [0, 0.4, 0.8, 1]) pts.push([fx + d1[0] * L1 * f, y0 + d1[1] * L1 * f, zc]); for (const f of [0.35, 0.7, 1]) pts.push([J[0] + d2[0] * L2 * f, J[1] + d2[1] * L2 * f, zc]); return pts; };
  if (lod === 0) {
    const ZS = [0.0315, 0.0105, -0.0105, -0.0305], RS = [0.0105, 0.0108, 0.0100, 0.0085], L2S = [0.040, 0.045, 0.040, 0.031];
    for (let i = 0; i < 4; i++) {
      const pts = fingerPts(ZS[i] * k, L2S[i] * k), RF = [1, 0.97, 0.93, 0.9, 0.84, 0.74, 0.62], rr = [];
      for (let j = 0; j < pts.length; j++) rr.push(pathRing(pts[Math.max(0, j - 1)], pts[j], pts[Math.min(pts.length - 1, j + 1)], RS[i] * k * RF[j] * 0.92, RS[i] * k * RF[j], W7[j], Z_AX));
      out.push(loft(rr, 6, { tone, capHi: true }));
    }
  } else { // a mitten: all four fingers as one tapered wedge
    const pts = fingerPts(0, 0.04 * k), sel = lod === 1 ? [0, 1, 2, 3, 4, 5, 6] : [0, 2, 3, 5, 6], RA = [0.0125, 0.0122, 0.0117, 0.0112, 0.0102, 0.0088, 0.0072], RB = [0.0425, 0.0415, 0.040, 0.0385, 0.035, 0.031, 0.026], rr = [];
    sel.forEach((j, n) => rr.push(pathRing(pts[Math.max(0, j - 1)], pts[j], pts[Math.min(pts.length - 1, j + 1)], RA[j] * k, RB[j] * k, W7[j], Z_AX)));
    out.push(loft(rr, LD.pseg[lod], { tone, capHi: true }));
  }
  // thumb: base on the palm (pivot = the thumb bone), pointing down and forward
  const TP = [[-0.002, 0.862, 0.020], [-0.006, 0.838, 0.040], [-0.010, 0.812, 0.052], [-0.012, 0.786, 0.057], [-0.0125, 0.770, 0.0585]], TR = [0.0125, 0.0118, 0.0105, 0.0090, 0.0062], TW = [wtp([[hd, 0.5], [tb, 0.5]]), wtp([[tb, 1]]), wtp([[tb, 1]]), wtp([[tb, 1]]), wtp([[tb, 1]])];
  const tp = TP.map(p => [ax + s * p[0], p[1], p[2] * k]), tsel = lod === 0 ? [0, 1, 2, 3, 4] : lod === 1 ? [0, 1, 3, 4] : [0, 2, 4], tr = [];
  tsel.forEach(j => tr.push(pathRing(tp[Math.max(0, j - (lod ? 1 : 1))], tp[j], tp[Math.min(tp.length - 1, j + 1)], TR[j] * k, TR[j] * k * 1.05, TW[j], X_AX)));
  out.push(loft(tr, lod === 0 ? 7 : lod === 1 ? 6 : 5, { tone, capHi: true }));
}
function bodyPieces(S, lod) {
  if (S.pc[lod]) return S.pc[lod];
  const out = [];
  out.push(loft(stn(0.70, 1.525, LD.tstep[lod], TORSO_JOINTS).map(y => torsoRing(S, y, 0)), LD.tseg[lod], { tone: toneFor('torso', S, 0), capLo: true, skin: pelvisSkin }));
  out.push(loft(stn(1.45, 1.585, 0.034 + lod * 0.02).map(y => neckRing(S, y)), LD.nseg[lod], { tone: toneFor('neck', S, 0) }));
  for (const s of [1, -1]) {
    out.push(loft(stn(1.422, 0.889, LD.lstep[lod], ARM_JOINTS).map(y => armRing(S, s, y, 0)), LD.lseg[lod], { tone: toneFor('arm', S, s), capLo: true }));
    out.push(loft(stn(1.0, 0.055, LD.lstep[lod], LEG_JOINTS).map(y => legRing(S, s, y, 0)), LD.lseg[lod], { tone: toneFor('leg', S, s) }));
    handLofts(S, s, lod, out);
  }
  S.pc[lod] = out; return out;
}
// =====================================================================================================================
// THE HEAD (release 3, P2). Unscaled head frame (the head group is later scaled by HEAD_SCALE about (0, 1.5, 0)): x = the character's left, y up, z forward; chin underside y = 1.500, crown y = 1.7465, the skull
// is centred on z = 0. Landmarks (m): stomion 1.5475, subnasale 1.569, eye centres (+-0.034, 1.632), brow 1.654, hairline 1.703 (man) / 1.708 (woman), ears at x = +-0.08.
//   skull + face  one lofted grid (rings by height, a superellipse per ring from a profile table), sculpted with gaussian bumps (brow ridge, orbits, cheekbones, lips, philtrum, chin ...). The grid is built once per
//                 head spec and LOD and shared; a person only gets its own skin colours. Its front triangles are re-issued as a second vertex set carrying atlas UVs (the face texture, see s_atlas), so a face is
//                 painted, not modelled, where it is flat: eyelids, brows, nostrils, lip colour, teeth, stubble, wrinkles.
//   FACE tags     geometry.userData.faceTags = [{ kind: 'face' | 'eyeL' | 'eyeR', start, count, local }]: the UVs of these vertices are rewritten by applyFace() to change an expression or blink: no geometry is rebuilt.
//   nose, ears, eyes, lips are real geometry; hair and headwear (h_hair, h_wear) are shells over the same surface function headP().
// =====================================================================================================================
const HY = 1.62; // skull centre height; the combat head hit sphere (p.y + 1.6, r 0.24) stays centred on it
const FACE = { W: 0.176, Y0: 1.49, H: 0.21 }; // the face window of an atlas cell, head frame metres: lu = 0.5 + x / W, lv = (y - Y0) / H
const LMK = { stomion: 1.5475, subnasale: 1.569, eye: 1.632, brow: 1.654, eyeX: 0.0335, nasion: 1.629, crown: 1.7465, chin: 1.5 };
// profile of an average man's head: [y, half width, front z, back z, super-ellipse exponent]
const HT = [[1.500, 0.032, 0.046, 0.046, 2.2], [1.508, 0.050, 0.068, 0.060, 2.3], [1.520, 0.062, 0.0795, 0.071, 2.4], [1.535, 0.0655, 0.0815, 0.080, 2.4], [1.550, 0.068, 0.0805, 0.088, 2.4], [1.570, 0.0735, 0.0810, 0.097, 2.3],
  [1.600, 0.0775, 0.0835, 0.104, 2.25], [1.630, 0.0795, 0.0845, 0.109, 2.2], [1.655, 0.0825, 0.0915, 0.113, 2.2], [1.680, 0.0850, 0.0925, 0.115, 2.2], [1.705, 0.0790, 0.0870, 0.107, 2.15], [1.725, 0.0640, 0.0680, 0.087, 2.1],
  [1.738, 0.0420, 0.0430, 0.058, 2.05], [1.7465, 0.0040, 0.0040, 0.006, 2.0]];
// gaussian bumps on the front of the face: [cx, cy, sx, sy, man A, woman A] (z, m); cx = 0 centred, otherwise mirrored
const FB = [[0.034, 1.654, 0.030, 0.0075, 0.0050, 0.0022], [0, 1.651, 0.016, 0.010, 0.0030, 0.0012], [0.034, 1.632, 0.0165, 0.0125, -0.0045, -0.0040], [0.056, 1.600, 0.019, 0.015, 0.0060, 0.0050], [0.050, 1.562, 0.020, 0.016, -0.0030, -0.0015],
  [0.026, 1.563, 0.0055, 0.020, -0.0020, -0.0018], [0, 1.5527, 0.0215, 0.0042, 0.0050, 0.0062], [0, 1.5385, 0.0215, 0.0052, 0.0062, 0.0072], [0, 1.5475, 0.027, 0.0013, -0.0034, -0.0034], [0.027, 1.5475, 0.0052, 0.0065, -0.0028, -0.0028],
  [0, 1.5625, 0.0042, 0.0062, -0.0015, -0.0015], [0, 1.5265, 0.0150, 0.0034, -0.0022, -0.0022], [0, 1.512, 0.0210, 0.0105, 0.0075, 0.0052], [0.0, 1.5755, 0.014, 0.006, 0.0020, 0.0015]];
const _hs = new Map();
// a head spec: the profile table adjusted for sex, build and age; sa = overall width scale; bump scale
function headSpec(fem, build, elder, jawK) {
  const jw = jawK === undefined ? 0 : jawK - 1, jk = jw ? 'j' + jawK : ''; // jawK 0 narrow and round, 1 average (the default), 2 square: a jaw and cheek offset per person
  const key = (fem ? 'f' : 'm') + (build || '') + (elder ? 'e' : '') + jk; let S = _hs.get(key); if (S) return S;
  const heavy = build === 'heavy', slim = build === 'slim', ath = build === 'athletic', tab = HT.map(r => {
    const y = r[0], jaw = 1 - smx(1.54, 1.62, y), low = 1 - smx(1.5, 1.545, y); let a = r[1], zf = r[2], zb = r[3], n = r[4];
    if (fem) { a *= 0.965 - 0.035 * jaw; zf *= 1 + 0.012 * smx(1.62, 1.7, y) - 0.025 * low; n -= 0.12 * jaw; }
    if (heavy) { a *= 1 + 0.07 * jaw; zf *= 1 + 0.015 * jaw; }
    if (slim) a *= 1 - 0.03 * jaw; if (ath) a *= 1 + 0.02 * jaw;
    if (jw) { const cheek = smx(1.56, 1.64, y) * (1 - smx(1.7, 1.75, y)); a *= 1 + 0.035 * jw * jaw + 0.018 * jw * cheek; n += 0.22 * jw * jaw; } // a square jaw is wider and boxier, a narrow one rounder; the cheeks follow
    return [y, a, zf, zb, n];
  });
  S = { fem, build, elder, jk, tab, bump: FB.map(b => [b[0], b[1], b[2], b[3], fem ? b[5] : b[4]]), heavy, slim }; if (heavy) { S.bump[3][4] *= 0.4; S.bump[4][4] = 0.003; } if (slim || ath) S.bump[4][4] -= 0.002; if (elder) { S.bump[4][4] -= 0.001; }
  _hs.set(key, S); return S;
}
// z offset of the sculpted bumps at (|x|, y); bumps with cx > 0 exist on both sides (mirrored)
function faceBump(S, ax, y) {
  let z = 0; for (const b of S.bump) { const ey = (y - b[1]) / b[3]; if (ey * ey > 12) continue; let ex = (ax - b[0]) / b[2], g = Math.exp(-(ex * ex + ey * ey)); if (b[0] > 0) { ex = (ax + b[0]) / b[2]; g += Math.exp(-(ex * ex + ey * ey)); } z += b[4] * g; }
  return z;
}
// a point of the head surface at height y and angle phi (0 = straight ahead, +pi/2 = the character's left); o = [x, y, z]
function headP(S, y, phi, o, bumps) {
  const v = hk(S.tab, y), a = v[0], zf = v[1], zb = v[2], pw = 2 / v[3], c = Math.cos(phi), s = Math.sin(phi);
  const x = a * Math.sign(s) * Math.pow(Math.abs(s), pw), cz = Math.sign(c) * Math.pow(Math.abs(c), pw); let z = cz >= 0 ? zf * cz : zb * cz;
  if (bumps && c > 0.1) z += smx(0.1, 0.5, c) * faceBump(S, Math.abs(x), y);
  o[0] = x; o[1] = y; o[2] = z; return o;
}
// z of the front of the face at (x, y): solves the super-ellipse for the angle (used to seat eyes, nose, glasses and headwear on the real surface)
function headZ(S, x, y, bumps) {
  const v = hk(S.tab, y), a = v[0], zf = v[1], pw = 2 / v[3], sn = Math.pow(Math.min(0.999, Math.abs(x) / a), 1 / pw), z = zf * Math.pow(Math.sqrt(Math.max(0, 1 - sn * sn)), pw);
  return bumps ? z + faceBump(S, Math.abs(x), y) : z;
}
const _p0 = [0, 0, 0], _p1 = [0, 0, 0], _p2 = [0, 0, 0];
// outward unit normal of the head surface by finite differences
function headN(S, y, phi, o, bumps) {
  headP(S, y + 0.0015, phi, _p0, bumps); headP(S, y - 0.0015, phi, _p1, bumps); const ux = _p0[0] - _p1[0], uy = _p0[1] - _p1[1], uz = _p0[2] - _p1[2];
  headP(S, y, phi + 0.02, _p0, bumps); headP(S, y, phi - 0.02, _p1, bumps); const vx = _p0[0] - _p1[0], vy = _p0[1] - _p1[1], vz = _p0[2] - _p1[2];
  let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  headP(S, y, phi, _p2, bumps); if (nx * _p2[0] + nz * _p2[2] + ny * (y - 1.62) < 0) { nx = -nx; ny = -ny; nz = -nz; }
  o[0] = nx; o[1] = ny; o[2] = nz; return o;
}
const HLOD = { seg: [40, 28, 18], step: [1.12, 1.9, 3.4] };
function headYs(lod) {
  const k = HLOD.step[lod], ys = []; let y = 1.5; const st = yy => (yy < 1.52 ? 0.0055 : yy < 1.566 ? 0.0030 : yy < 1.60 ? 0.0045 : yy < 1.667 ? 0.0055 : 0.009) * k;
  while (y < 1.7440) { ys.push(y); y += st(y); } ys.push(1.7440, 1.7465); return ys;
}
// the head grid of a spec at a LOD: { P, N, T (tone), idx, n, ys, phis, seg, faceTris (triangles whose vertices are all in the face window) }
const _headCache = new Map();
function headMesh(S, lod) {
  const key = S === undefined ? '' : (S.fem ? 'f' : 'm') + (S.build || '') + (S.elder ? 'e' : '') + (S.jk || '') + lod; let H = _headCache.get(key); if (H) return H;
  const ys = headYs(lod), nr = ys.length, seg = HLOD.seg[lod], n = nr * seg, P = new Float32Array(n * 3), N = new Float32Array(n * 3), phis = new Float32Array(seg), o = [0, 0, 0];
  for (let j = 0; j < seg; j++) { const psi = TAU * j / seg - Math.PI; phis[j] = psi - 0.34 * Math.sin(psi); } // denser at the front (psi = 0)
  const bumps = lod < 2;
  for (let i = 0; i < nr; i++) for (let j = 0; j < seg; j++) { headP(S, ys[i], phis[j], o, bumps); const k = (i * seg + j) * 3; P[k] = o[0]; P[k + 1] = o[1]; P[k + 2] = o[2]; }
  const idx = new Uint16Array((nr - 1) * seg * 6); let q = 0;
  for (let i = 0; i < nr - 1; i++) for (let j = 0; j < seg; j++) { const jn = (j + 1) % seg, a = i * seg + j, b = i * seg + jn, c = (i + 1) * seg + j, d = (i + 1) * seg + jn; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  // orientation: the first triangle must face outwards
  { const a = (nr >> 1) * seg + (seg >> 1), b = a + seg, c = a + 1; const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2]; const nz = ux * vy - uy * vx; if (nz < 0) for (let t = 0; t < idx.length; t += 3) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; } }
  for (let t = 0; t < idx.length; t += 3) { // area weighted vertex normals
    const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const k of [a, b, c]) { N[k] += nx; N[k + 1] += ny; N[k + 2] += nz; }
  }
  for (let v = 0; v < n; v++) { const l = Math.hypot(N[v * 3], N[v * 3 + 1], N[v * 3 + 2]) || 1; N[v * 3] /= l; N[v * 3 + 1] /= l; N[v * 3 + 2] /= l; }
  // tone [brightness, blush]
  const T = new Float32Array(n * 2);
  for (let v = 0; v < n; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], ny = N[v * 3 + 1], nz = N[v * 3 + 2]; let b = 1 + 0.05 * (vnoise(x * 23 + 1.3, y * 23 + 4.1, z * 23 + 9.7) - 0.5), bl = 0;
    b *= 1 - 0.28 * smx(0.2, 0.9, -ny); // under the chin / jaw: in shadow
    if (z > 0.03) { b *= 1 - 0.2 * gaus(Math.abs(x), 0.0335, 0.022) * gaus(y, 1.636, 0.016) - 0.14 * gaus(Math.abs(x), 0.0, 0.03) * gaus(y, 1.5645, 0.006) - 0.1 * gaus(Math.abs(x), 0.0, 0.016) * gaus(y, 1.527, 0.005) - 0.08 * gaus(Math.abs(x), 0.03, 0.01) * gaus(y, 1.549, 0.012); bl += 0.1 * gaus(Math.abs(x), 0.055, 0.016) * gaus(y, 1.592, 0.014) + 0.03 * gaus(y, 1.66, 0.02) + 0.05 * gaus(Math.abs(x), 0.0, 0.03) * gaus(y, 1.652, 0.008); }
    T[v * 2] = b; T[v * 2 + 1] = clamp(bl, 0, 0.5);
  }
  // face window: columns |phi| <= 1.3, rows y <= 1.70
  const inF = new Uint8Array(n); for (let i = 0; i < nr; i++) for (let j = 0; j < seg; j++) inF[i * seg + j] = Math.abs(phis[j]) <= 1.3 && ys[i] <= 1.70 ? 1 : 0;
  const faceTris = [], restTris = []; for (let t = 0; t < idx.length; t += 3) { if (inF[idx[t]] && inF[idx[t + 1]] && inF[idx[t + 2]]) faceTris.push(idx[t], idx[t + 1], idx[t + 2]); else restTris.push(idx[t], idx[t + 1], idx[t + 2]); }
  H = { P, N, T, n, ys, phis, seg, nr, restIdx: new Uint16Array(restTris), faceIdx: new Uint16Array(faceTris), cache: new Map() }; _headCache.set(key, H); return H;
}

// ---------- face atlas layout (the painting is in s_atlas) ----------
const EYE_CELL = 0.034, EYE_K = 1.28; // width of an eye cell in metres, and the scale of the painted eye inside it // width of an eye cell in metres
const AT = { W: 1024, H: 768, FW: 100, FH: 114, FCOLS: 10, EY: 456, EW: 64, HY: 520, HW: 256, HH: 248 };
const EXPRS = ['neutral', 'smile', 'angry', 'scared', 'pained', 'dead', 'talk', 'laugh'];
const EYE_OF = [0, 0, 2, 1, 3, 5, 0, 3]; // lid state of each expression: 0 open, 1 wide, 2 narrow, 3 squint, 4 closed, 5 glazed
// what a look's face needs, decided once and kept on the look so a person stays the same: face kind (0 man, 1 man with stubble, 2 old man, 3 woman, 4 old woman), eye colour, nose, facial hair style
const IRIS = [0x4a2f1c, 0x4a2f1c, 0x3a2416, 0x6a4a24, 0x4f7a45, 0x3f6fa8, 0x7a8a96, 0x8a5a22];
function facePlan(look, fem) {
  if (look._fk !== undefined) return look;
  const q = Math.random;
  look._fem = fem; look._ex = look.restEx ? 1 : 0; look._es = 0; // resting face: neutral, or a faint smile for some people (randomLook) if (look._side === undefined) look._side = Math.random() < 0.5 ? 1 : -1;
  let bs = look.beard; if (bs === true) bs = q() < 0.5 ? 'full' : q() < 0.5 ? 'short' : 'goatee'; if (!bs || fem) bs = fem ? false : (q() < (look.elder ? 0.22 : 0.17) ? 'stubble' : false); look._beard = bs;
  look._fk = look.elder ? (fem ? 4 : 2) : fem ? 3 : (bs === 'stubble' ? 1 : 0);
  look._iris = look.eye === undefined || look.eye === 0x1c1612 ? pick(IRIS) : look.eye;
  look._nose = [0.9 + q() * 0.26, 0.86 + q() * 0.3, q()]; // width, protrusion, tip turn-up
  look._tie = pick([0xd1345b, 0x14161c, 0xf5c542, 0x3ce8f5, 0xffffff, 0x7b4fbf, 0x2aa198, 0xff7f50]); // hair tie / scrunchie colour
  look._lip = look.lipstick === true ? pick([0xb0174a, 0xc2185b, 0x8a1c2e, 0xd2455c, 0x6f2a55]) : (look.lipstick || 0);
  return look;
}
// writes the atlas UVs of every tagged part of a head from the look's expression state: the whole expression change
function applyFace(geo, look) {
  const tags = geo.userData && geo.userData.faceTags; if (!tags) return; const uv = geo.attributes.uv, A = uv.array, ex = look._ex | 0, fk = look._fk | 0, es = look._es | 0;
  for (const t of tags) {
    let x0, y0, w, h; if (t.kind === 'face') { const c = fk * 8 + ex; x0 = (c % AT.FCOLS) * AT.FW; y0 = Math.floor(c / AT.FCOLS) * AT.FH; w = AT.FW; h = AT.FH; } else { const c = es + 6 * (look._fem ? 1 : 0); x0 = c * AT.EW; y0 = AT.EY; w = AT.EW; h = AT.EW; }
    const L = t.local, fl = t.kind === 'eyeR';
    for (let i = 0; i < t.count; i++) { let lu = L[i * 2]; const lv = L[i * 2 + 1]; if (fl) lu = 1 - lu; A[(t.start + i) * 2] = (x0 + lu * w) / AT.W; A[(t.start + i) * 2 + 1] = 1 - (y0 + (1 - lv) * h) / AT.H; }
  }
  uv.needsUpdate = true;
}
const lumi = c => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
// the cached vertex sets of a head: rest = every vertex (plain UVs), face = the vertices of the front window re-issued with local UVs
function headSets(H) {
  if (H.rest) return H;
  const n = H.n, SI = new Uint16Array(n * 4), SW = new Float32Array(n * 4); for (let i = 0; i < n; i++) { SI[i * 4] = HEAD; SW[i * 4] = 1; }
  { const rm = new Int32Array(n).fill(-1), ru = []; for (const v of H.restIdx) if (rm[v] < 0) { rm[v] = ru.length; ru.push(v); } const m = ru.length, P = new Float32Array(m * 3), N = new Float32Array(m * 3), T = new Float32Array(m * 2), SI2 = new Uint16Array(m * 4), SW2 = new Float32Array(m * 4), idx = new Uint16Array(H.restIdx.length); // only the vertices the back of the head uses
    ru.forEach((v, i) => { P.set(H.P.subarray(v * 3, v * 3 + 3), i * 3); N.set(H.N.subarray(v * 3, v * 3 + 3), i * 3); T.set(H.T.subarray(v * 2, v * 2 + 2), i * 2); SI2[i * 4] = HEAD; SW2[i * 4] = 1; }); for (let i = 0; i < idx.length; i++) idx[i] = rm[H.restIdx[i]]; H.rest = { P, N, T, SI: SI2, SW: SW2, idx, n: m }; }
  const map = new Int32Array(n).fill(-1), used = []; for (const v of H.faceIdx) if (map[v] < 0) { map[v] = used.length; used.push(v); }
  const m = used.length, Pf = new Float32Array(m * 3), Nf = new Float32Array(m * 3), Tf = new Float32Array(m * 2), SIf = new Uint16Array(m * 4), SWf = new Float32Array(m * 4), local = new Float32Array(m * 2), idx = new Uint16Array(H.faceIdx.length);
  used.forEach((v, i) => { Pf.set(H.P.subarray(v * 3, v * 3 + 3), i * 3); Nf.set(H.N.subarray(v * 3, v * 3 + 3), i * 3); Tf.set(H.T.subarray(v * 2, v * 2 + 2), i * 2); SIf[i * 4] = HEAD; SWf[i * 4] = 1; local[i * 2] = clamp(0.5 + H.P[v * 3] / FACE.W, 0.02, 0.98); local[i * 2 + 1] = clamp((H.P[v * 3 + 1] - FACE.Y0) / FACE.H, 0.015, 0.985); });
  for (let i = 0; i < idx.length; i++) idx[i] = map[H.faceIdx[i]];
  H.face = { P: Pf, N: Nf, T: Tf, SI: SIf, SW: SWf, idx, n: m, local }; return H;
}
// colour of a head vertex set: like skinGeo, plus freckles on cheeks and nose; extra writes the face UV / tint (null for the rest)
function headSkin(l, info, fr, tag) {
  const g = skinGeo(l, info, 0);
  if (fr > 0) { const K = g.attributes.color.array, P = l.P; for (let i = 0; i < l.n; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; if (z < 0.04) continue; const zone = gaus(Math.abs(x), 0.03, 0.03) * gaus(y, 1.595, 0.022) + gaus(Math.abs(x), 0.05, 0.02) * gaus(y, 1.592, 0.016); const sp = smx(0.7, 0.9, vnoise(x * 150 + 11.3, y * 150 + 3.7, z * 150 + 5.9)) * Math.min(1, zone) * fr; K[i * 3] *= 1 - 0.1 * sp; K[i * 3 + 1] *= 1 - 0.2 * sp; K[i * 3 + 2] *= 1 - 0.26 * sp; } }
  return g;
}

// tags the last part put() into B.parts as a face part whose UVs applyFace rewrites
function tagPart(kind, local) { const g = B.parts[B.parts.length - 1]; g.userData.tag = { kind, local }; }
// eyes: a sphere cap on each side, seated in the orbit, textured from the eye cells (sclera, iris, lids, lashes are painted; the iris colour is the tint)
function buildEyes(look, HS, fem, skin) {
  const re = 0.0166, ic = col(look._iris), lid = shade(skin, 0.97);
  for (const s of [1, -1]) {
    const cx = s * LMK.eyeX, cy = LMK.eye, cz = headZ(HS, cx, cy, true) + 0.0094 - re;
    sph(HEAD, re, re, re, cx, cy, cz, lid, { seg: B.hi ? (B.fine ? [12, 8] : [8, 6]) : [7, 5], part: [0, TAU, 0, 1.8], rot: [HALF_PI, 0, 0], tint: [ic.r, ic.g, ic.b, 1] });
    const g = B.parts[B.parts.length - 1], P = g.attributes.position.array, n = g.attributes.position.count, L = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { L[i * 2] = clamp(0.5 + (P[i * 3] - cx) / EYE_CELL, 0.02, 0.98); L[i * 2 + 1] = clamp(0.5 + (P[i * 3 + 1] - cy) / EYE_CELL, 0.02, 0.98); } // head-frame position in the eye cell; applyFace mirrors the right eye so the inner corner stays next to the nose
    g.userData.tag = { kind: s > 0 ? 'eyeL' : 'eyeR', local: L };
  }
}
// the nose: horizontal rings from the bridge down to the base, seated on the face surface
const NOSE_Y = [1.634, 1.628, 1.618, 1.607, 1.596, 1.587, 1.580, 1.5755, 1.5725, 1.5695, 1.5672];
const NOSE_W = [0.0046, 0.0056, 0.0068, 0.0080, 0.0094, 0.0108, 0.0130, 0.0165, 0.0174, 0.0148, 0.0105];
const NOSE_P = [0.0008, 0.0026, 0.0062, 0.0098, 0.0135, 0.0166, 0.0185, 0.0192, 0.0160, 0.0112, 0.0050];
function noseTone(x, y, z, nx, ny, nz, T, k) { let b = 1 + 0.04 * (vnoise(x * 40, y * 40, z * 40) - 0.5), bl = 0.04; b *= 1 - 0.5 * smx(0.55, 0.98, -ny); b *= 1 - 0.18 * smx(0.45, 0.95, Math.abs(nx)) + 0.05 * smx(0.5, 0.95, nz); bl += 0.16 * gaus(y, 1.5775, 0.004) + 0.07 * gaus(y, 1.572, 0.004) * (Math.abs(x) > 0.008 ? 1 : 0); T[k] = b; T[k + 1] = clamp(bl, 0, 0.5); }
function buildNose(look, HS, info) {
  const nw = look._nose[0], np = look._nose[1], lod = B.lod, seg = [12, 8, 6][lod], pick3 = lod === 0 ? NOSE_Y.map((_, i) => i) : lod === 1 ? [0, 2, 4, 6, 7, 8, 10] : [0, 4, 7, 10], rings = [];
  for (const i of pick3) {
    const y = NOSE_Y[i], zf = headZ(HS, 0, y, true), zb = zf - 0.008, zt = zf + NOSE_P[i] * np * (i === 7 ? 1 + 0.25 * (look._nose[2] - 0.5) : 1), w = NOSE_W[i] * nw * (HS.fem ? 0.92 : 1);
    rings.push({ c: [0, y, (zt + zb) / 2], a: X_AX, b: Z_AX, ra: w, rm: (zt - zb) / 2, rd: 0, sq: i > 6 ? 2.3 : 2.0, sb: [HEAD, 0, 0, 0], sw: [1, 0, 0, 0] });
  }
  put(skinGeo(loft(rings, seg, { tone: noseTone, capHi: true }), info, 0));
}
function buildEars(look, HS, info, skin) {
  const ec = mix(skin, info.blush, 0.28).multiplyScalar(0.97), seg = B.hi ? [9, 6] : [6, 4];
  for (const s of [1, -1]) {
    const x = s * (hk(HS.tab, 1.625)[0] + 0.0035); sph(HEAD, 0.0048, 0.0385, 0.0205, x, 1.6245, -0.016, ec, { seg, rot: [0, s * 0.42, -s * 0.2] });
    if (B.fine) sph(HEAD, 0.0028, 0.021, 0.0085, x + s * 0.0018, 1.632, -0.015, shade(ec, 0.78), { seg: [6, 4], rot: [0, s * 0.42, -s * 0.2] }); // the rim / concha shadow
  }
}
// head, eyes, nose, ears; hair and headwear follow (h_hair, h_wear)
function buildHeadBase(look, fem) {
  const HS = headSpec(fem, look.build, look.elder, look.jaw), H = headSets(headMesh(HS, B.lod)), info = skinInfo(look.skin, look._tone), skin = col(look.skin);
  put(headSkin(H.rest, info, look.freckles));
  // brow and stubble darkness: the hair's luminance against the skin; on dark skin the floor is a fraction of the skin, so a brow still reads on it
  const hairL = lumi(col(look.hair === undefined ? 0x2b2b2b : look.hair)), skinL = Math.max(lumi(skin), 0.03), dk = clamp((0.2 - skinL) / 0.12, 0, 1);
  const bk = clamp(Math.min(hairL, skinL * (1 - 0.55 * dk)) / skinL * 0.85 + 0.09, 0.1, 0.92), fg = headSkin(H.face, info, look.freckles), TI = new Uint8Array(H.face.n * 4), lipC = look._lip ? col(look._lip) : null;
  for (let i = 0; i < H.face.n; i++) { if (lipC) { TI[i * 4] = lipC.r * 255; TI[i * 4 + 1] = lipC.g * 255; TI[i * 4 + 2] = lipC.b * 255; } TI[i * 4 + 3] = bk * 255; }
  fg.setAttribute('tint', new THREE.BufferAttribute(TI, 4, true)); fg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(H.face.n * 2), 2)); fg.userData.tag = { kind: 'face', local: H.face.local }; put(fg);
  buildEyes(look, HS, fem, skin); buildNose(look, HS, info); buildEars(look, HS, info, skin);
  return HS;
}

// =====================================================================================================================
// THE FACE ATLAS. Three canvases of 1024 x 768 drawn once (about 40 ms), no files: colour (texel x 1.25 multiplies the vertex colour; where maskA.b is set the texel IS the colour), maskA (r dark: brows and stubble,
// g tint: iris, lipstick, hair streaks, b absolute: sclera, teeth, pupil, lashes), maskB (r roughness, g height). Layout (see AT): 40 face cells of 100 x 114 px (8 expressions x 5 face kinds: man, man with stubble,
// old man, woman, old woman; a cell shows the head window FACE), 12 eye cells of 64 px (6 lid states x 2 sexes), 3 hair strand cells of 256 x 248 px (straight, wavy, short / fur).
// Everything is drawn in head-frame METRES through a transform, so a feature sits exactly where the sculpted lips, brows and orbits are.
// =====================================================================================================================
const enc = L => (L <= 0.0031308 ? 12.92 * L : 1.055 * Math.pow(L, 1 / 2.4) - 0.055);
const cC = m => (Array.isArray(m) ? m : [m, m, m]).map(v => 255 * enc(clamp(v * 0.8, 0, 1))); // a colour multiplier -> sRGB bytes (the texture is sRGB-decoded, then x 1.25)
const cRaw = v => (Array.isArray(v) ? v : [v, v, v]).map(x => x * 255); // mask values 0..1 -> bytes
const cAbs = hex => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255]; // an absolute colour as written in hex (sRGB)
const css = (rgb, al) => `rgba(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0},${al})`;
// ink(X, draw, c, a, b, al): runs draw(ctx) once per layer with the layer's colour; a layer spec is null (untouched) or a value: c = multiplier (number | [r,g,b]) or {abs: hex}; a / b = mask values
function ink(X, draw, c, a, b, al) {
  al = al === undefined ? 1 : al;
  if (c) { const rgb = c.abs !== undefined ? cAbs(c.abs) : cC(c); X.c.fillStyle = X.c.strokeStyle = css(rgb, al); draw(X.c); }
  if (a) { X.a.fillStyle = X.a.strokeStyle = css(cRaw(a), al); draw(X.a); }
  if (b) { const r = cRaw(b); r[2] = 255; X.b.fillStyle = X.b.strokeStyle = css(r, al); draw(X.b); } // maskB.b is the alpha (cut-out) channel: always opaque here
}
// soft elliptical blob (radial falloff)
function blob(X, x, y, rx, ry, al, c, a, b) {
  for (const [ctx, spec, conv] of [[X.c, c, v => (v.abs !== undefined ? cAbs(v.abs) : cC(v))], [X.a, a, cRaw], [X.b, b, v => { const r = cRaw(v); r[2] = 255; return r; }]]) {
    if (!spec) continue; const rgb = conv(spec); ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, css(rgb, al)); g.addColorStop(0.5, css(rgb, al * 0.6)); g.addColorStop(1, css(rgb, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill(); ctx.restore();
  }
}
// a smooth curve through points (quadratic through the midpoints); closed = a filled outline
function spath(ctx, pts, closed) {
  ctx.beginPath(); const n = pts.length; if (closed) { ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2); for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } ctx.closePath(); }
  else { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n - 1; i++) { const p = pts[i], q = pts[i + 1]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } ctx.lineTo(pts[n - 1][0], pts[n - 1][1]); }
}
const stroke = (X, pts, w, al, c, a, b) => ink(X, ctx => { spath(ctx, pts, false); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }, c, a, b, al);
const fillp = (X, pts, al, c, a, b) => ink(X, ctx => { spath(ctx, pts, true); ctx.fill(); }, c, a, b, al);

// expression table: brow inner / peak / outer offsets (m), mouth opening, corner lift, width scale, teeth rows, tongue, cheek raise, brow furrow, forehead lines, pallor
const XP = [
  { bi: 0, bp: 0, bo: 0, mo: 0, cl: 0.0008, mw: 1, te: 0, tg: 0, ch: 0, fu: 0, fl: 0 },
  { bi: 0.0005, bp: 0.001, bo: 0.0015, mo: 0.0028, cl: 0.0042, mw: 1.1, te: 1, tg: 0, ch: 1, fu: 0, fl: 0 },
  { bi: -0.0065, bp: -0.003, bo: 0.0012, mo: 0.0045, cl: -0.002, mw: 0.98, te: 2, tg: 0, ch: 0, fu: 1, fl: 0.3 },
  { bi: 0.0085, bp: 0.007, bo: 0.0035, mo: 0.0105, cl: -0.0005, mw: 0.9, te: 2, tg: 0, ch: 0, fu: 0, fl: 1 },
  { bi: 0.0065, bp: 0.002, bo: -0.0015, mo: 0.0055, cl: -0.0032, mw: 0.96, te: 2, tg: 0, ch: 0.6, fu: 0.7, fl: 0.6 },
  { bi: -0.0015, bp: -0.0025, bo: -0.002, mo: 0.0035, cl: -0.001, mw: 0.97, te: 0, tg: 0, ch: 0, fu: 0, fl: 0, pale: 1 },
  { bi: 0.001, bp: 0.0015, bo: 0.001, mo: 0.0085, cl: 0.0005, mw: 0.9, te: 1, tg: 1, ch: 0.2, fu: 0, fl: 0 },
  { bi: 0.002, bp: 0.003, bo: 0.0035, mo: 0.0125, cl: 0.0055, mw: 1.14, te: 2, tg: 1, ch: 1, fu: 0, fl: 0 },
];
const FKIND = [{ fem: 0, stub: 0, age: 0 }, { fem: 0, stub: 1, age: 0 }, { fem: 0, stub: 0, age: 1 }, { fem: 1, stub: 0, age: 0 }, { fem: 1, stub: 0, age: 1 }];
// one face cell: expression ex (0..7) of face kind fk
function paintFace(X, ex, fk, rnd) {
  const x = XP[ex], K = FKIND[fk], fem = K.fem, age = K.age, yc = LMK.stomion, E = LMK.eye;
  // base: neutral multiplier, skin sheen; a dead face is pale
  ink(X, c => c.fillRect(-0.2, 1.2, 0.4, 0.8), x.pale ? [0.9, 0.93, 1.0] : 1, [0, 0, 0], [0.6, 0, 0]);
  // skin: faint pores and unevenness, and a five o'clock shadow on every man
  for (let i = 0; i < 520; i++) { const px = (rnd() * 2 - 1) * 0.085, py = 1.5 + rnd() * 0.2, m = 0.94 + rnd() * 0.1; ink(X, c => c.fillRect(px, py, 0.0018, 0.0018), m, null, null, 0.55); }
  if (!fem && !K.stub) { blob(X, 0, 1.522, 0.046, 0.027, 0.13, null, [0.8, 0, 0]); blob(X, 0, 1.557, 0.034, 0.008, 0.1, null, [0.8, 0, 0]); }
  // ----- shading of the face -----
  for (const s of [1, -1]) {
    blob(X, s * 0.034, E + 0.0015, 0.025, 0.0175, 0.6 + 0.15 * age, [0.8, 0.7, 0.72]);                               // orbit
    blob(X, s * 0.034, E - 0.014, 0.0185, 0.0062, 0.35 + 0.4 * age + (x.pale ? 0.3 : 0), [0.86, 0.78, 0.8]);        // under-eye
    blob(X, s * 0.053, 1.592, 0.019, 0.016, 0.34 + 0.2 * x.ch, [1.06, 0.88, 0.88]);                                  // cheek blush
    blob(X, s * 0.062, 1.575, 0.02, 0.03, 0.07, [0.94, 0.92, 0.92]);                                                   // the jaw side
    const lift = x.ch * 0.0018;
    stroke(X, [[s * 0.0215, 1.5775], [s * (0.0265 + 0.002 * x.ch), 1.5615 + lift], [s * (0.0315 + 0.003 * x.ch), 1.5465 + x.cl * 0.5]], 0.0021 + 0.0012 * x.ch + 0.0016 * age, 0.45 + 0.3 * x.ch + 0.3 * age, [0.84, 0.74, 0.75], null, [0.62, 0.22, 0]); // nasolabial fold
    blob(X, s * 0.0075, 1.5712, 0.0036, 0.0019, 0.7, [0.4, 0.3, 0.3]);                                              // nostril
    blob(X, s * 0.0185, 1.574, 0.006, 0.0042, 0.35, [0.8, 0.62, 0.62]);                                              // nose wing
  }
  blob(X, 0, 1.5665, 0.011, 0.003, 0.3, [0.6, 0.5, 0.5]);                                                          // under the nose
  blob(X, 0, 1.5255, 0.0135, 0.0032, 0.4 + 0.2 * age, [0.84, 0.74, 0.75]);                                           // mentolabial shadow
  blob(X, 0, 1.5105, 0.011, 0.007, 0.25, [1.07, 1.0, 1.0]);                                                          // chin highlight
  blob(X, 0, 1.616, 0.006, 0.019, 0.2, [1.07, 1.03, 1.02]);                                                          // nose bridge light
  // ----- brows (hairs in the dark mask) -----
  const bt = fem ? 0.0052 : 0.0100, arch = fem ? 0.0058 : 0.0035, bI = [0.0125, LMK.brow - 0.005 + x.bi], bP = [0.0385, LMK.brow + 0.0042 + arch * (fem ? 1 : 0.6) + x.bp], bO = [0.0605, LMK.brow - 0.0045 + x.bo + (fem ? 0.0012 : 0)];
  for (const s of [1, -1]) {
    const cv = t => { const a = 1 - t, y = a * a * bI[1] + 2 * a * t * bP[1] + t * t * bO[1], xx = a * a * bI[0] + 2 * a * t * bP[0] + t * t * bO[0], th = bt * (0.5 + 0.7 * Math.sin(Math.min(1, t * 1.5) * Math.PI * 0.5) * (1 - 0.8 * t * t)) * (age ? 0.8 : 1); return [s * xx, y, th]; };
    const pts = [0, 0.25, 0.5, 0.75, 1].map(t => cv(t)); stroke(X, pts.map(p => [p[0], p[1]]), bt * 0.9, fem ? 0.62 : 0.88, [0.9, 0.86, 0.86], [1, 0, 0]);
    for (let i = 0; i < (fem ? 46 : 64); i++) { const t = rnd(), p = cv(t), q = cv(Math.min(1, t + 0.06)), th = p[2]; let dx = q[0] - p[0], dy = q[1] - p[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const ox = (rnd() - 0.5) * th * 0.9, oy = (rnd() - 0.5) * th * 0.9, ln = 0.0042 + rnd() * 0.0035; ink(X, c => { c.beginPath(); c.moveTo(p[0] + ox - dx * 0.0008, p[1] + oy - dy * 0.0008 + th * 0.12 * (1 - t)); c.lineTo(p[0] + ox + dx * ln, p[1] + oy + dy * ln + th * 0.1 * t * (rnd() - 0.4)); c.lineWidth = 0.00055; c.lineCap = 'round'; c.stroke(); }, null, [1, 0, 0], null, 0.85); }
    if (x.fu) stroke(X, [[s * 0.004, LMK.brow + 0.001], [s * 0.0055, LMK.brow + 0.011 + 0.005 * x.fu]], 0.0016, 0.6 * x.fu, [0.78, 0.68, 0.68], null, [0.62, 0.3, 0]);   // furrow between the brows
    // crow's feet and old-age lines
    if (age) { for (let i = 0; i < 3; i++) stroke(X, [[s * 0.0545, E + 0.002 - i * 0.004], [s * 0.0645, E + 0.007 - i * 0.0075]], 0.0011, 0.5, [0.8, 0.72, 0.72], null, [0.62, 0.2, 0]); stroke(X, [[s * 0.031, yc + 0.001], [s * 0.034, yc - 0.0165]], 0.0017, 0.45, [0.85, 0.76, 0.77], null, [0.62, 0.2, 0]); }
    if (x.ch > 0.5) for (let i = 0; i < 2; i++) stroke(X, [[s * 0.056, E - 0.002 - i * 0.004], [s * 0.0635, E + 0.003 - i * 0.0075]], 0.0009, 0.35 * x.ch, [0.82, 0.74, 0.74], null, [0.62, 0.16, 0]);
  }
  // forehead lines (expression + age)
  const fl = Math.max(x.fl, age ? 0.7 : 0); if (fl > 0) for (let i = 0; i < 3; i++) { const y = 1.672 + i * 0.0105, w = 0.04 - i * 0.005; stroke(X, [[-w, y - 0.001], [-w * 0.4, y + 0.0013], [0, y + 0.0017], [w * 0.4, y + 0.0013], [w, y - 0.001]], 0.0014, 0.5 * fl, [0.84, 0.76, 0.76], null, [0.62, 0.2, 0]); }
  // ----- the mouth -----
  const mw = 0.0275 * x.mw * (fem ? 0.95 : 1), cl = x.cl, mo = x.mo, tH = fem ? 0.0108 : 0.0098, bH = fem ? 0.0120 : 0.0105; // half width, corner lift, opening, lip heights
  const upper = [], lower = []; // inner edges, u in -1..1 along the mouth
  for (let i = 0; i <= 8; i++) { const u = -1 + i / 4, a = Math.abs(u), cx = u * mw, corner = cl * Math.pow(a, 2.5), bow = 0.0006 * Math.cos(a * Math.PI * 0.5) * (1 - a); upper.push([cx, yc + mo * 0.5 * (1 - a * a) + corner + bow]); lower.push([cx, yc - mo * 0.5 * (1 - a * a * 0.6) + corner]); }
  const topO = upper.map((p, i) => { const a = Math.abs(-1 + i / 4); return [p[0] * (1 + 0.012), p[1] + tH * Math.pow(Math.max(0, 1 - a ** 1.7), 0.8)]; });
  const botO = lower.map((p, i) => { const a = Math.abs(-1 + i / 4); return [p[0], p[1] - bH * Math.pow(Math.max(0, 1 - a ** 1.9), 0.75)]; });
  const lipsOutline = topO.concat(botO.slice().reverse());
  const lipM = fem ? [1.0, 0.62, 0.62] : [0.92, 0.6, 0.58];
  fillp(X, lipsOutline, 0.96, lipM, [0, 1, 0], [0.68, 0.32, 0]);                              // lips: colour, lipstick mask (only where tint is set), gloss and a little height
  stroke(X, topO, 0.0007, 0.5, [0.8, 0.52, 0.52]); stroke(X, botO, 0.0007, 0.4, [0.85, 0.58, 0.58]);
  if (mo < 0.002) stroke(X, upper.map((p, i) => [p[0], p[1] - 0.0004 + (lower[i][1] - p[1]) * 0.5]), 0.0011, 0.9, [0.38, 0.24, 0.24], null, [0.62, 0.15, 0]); // the closed mouth: a dark line where the lips meet                 // the vermilion border
  blob(X, 0, yc - bH * 0.55 - mo * 0.5, 0.012, 0.0028, 0.5, [1.14, 1.0, 1.0], null, [0.3, 0.2, 0]);                  // light on the lower lip
  if (mo > 0.0012) { // the opening: dark inside, teeth, tongue (absolute colours)
    const hole = upper.concat(lower.slice().reverse());
    ink(X, c => { spath(c, hole, true); c.fill(); }, { abs: 0x2a0d12 }, [0, 0, 1], [0.35, 0, 0]);
    if (x.tg) ink(X, c => { c.beginPath(); c.ellipse(0, yc - mo * 0.5 + mo * 0.18, mw * 0.5, mo * 0.28, 0, 0, TAU); c.fill(); }, { abs: 0x9a4650 }, [0, 0, 1], [0.35, 0, 0]);
    if (x.te) { // upper teeth hang from the upper lip, lower teeth stand on the lower lip
      const th = Math.min(mo * 0.75, 0.0042), n = 8;
      for (let i = 0; i < n; i++) { const u0 = -0.8 + 1.6 * i / n, u1 = -0.8 + 1.6 * (i + 1) / n; ink(X, c => { c.beginPath(); c.moveTo(u0 * mw, yc + mo * 0.5 * (1 - u0 * u0) + cl * Math.pow(Math.abs(u0), 2.5) - 0.0002); c.lineTo(u1 * mw, yc + mo * 0.5 * (1 - u1 * u1) + cl * Math.pow(Math.abs(u1), 2.5) - 0.0002); c.lineTo(u1 * mw, yc + mo * 0.5 * (1 - u1 * u1) + cl * Math.pow(Math.abs(u1), 2.5) - th); c.lineTo(u0 * mw, yc + mo * 0.5 * (1 - u0 * u0) + cl * Math.pow(Math.abs(u0), 2.5) - th); c.closePath(); c.fill(); c.lineWidth = 0.00025; c.stroke(); }, { abs: i % 2 ? 0xe9e2d2 : 0xf1ead9 }, [0, 0, 1], [0.2, 0, 0]); }
      if (x.te > 1 && mo > 0.004) for (let i = 0; i < n; i++) { const u0 = -0.7 + 1.4 * i / n, u1 = -0.7 + 1.4 * (i + 1) / n, yb = u => yc - mo * 0.5 * (1 - u * u * 0.6) + cl * Math.pow(Math.abs(u), 2.4) + 0.0002, h = Math.min(mo * 0.5, 0.0035); ink(X, c => { c.beginPath(); c.moveTo(u0 * mw, yb(u0)); c.lineTo(u1 * mw, yb(u1)); c.lineTo(u1 * mw, yb(u1) + h); c.lineTo(u0 * mw, yb(u0) + h); c.closePath(); c.fill(); }, { abs: 0xdcd5c4 }, [0, 0, 1], [0.2, 0, 0]);
    }
  }
  }
  // laughter creases and parentheses round the mouth
  if (x.ch > 0.4) for (const s of [1, -1]) stroke(X, [[s * (mw + 0.0045), yc + 0.006], [s * (mw + 0.0075), yc + 0.0005], [s * (mw + 0.0045), yc - 0.005]], 0.0015, 0.5 * x.ch, [0.82, 0.72, 0.72], null, [0.62, 0.18, 0]);
  if (age) for (const s of [1, -1]) stroke(X, [[s * (mw + 0.003), yc - 0.003], [s * (mw + 0.0045), yc - 0.013], [s * (mw + 0.001), yc - 0.021]], 0.0016, 0.45, [0.84, 0.75, 0.76], null, [0.62, 0.2, 0]);
  // ----- stubble -----
  if (K.stub) {
    blob(X, 0, 1.522, 0.045, 0.026, 0.35, null, [0.9, 0, 0]); blob(X, 0, 1.557, 0.038, 0.008, 0.28, null, [0.9, 0, 0]); blob(X, 0.049, 1.552, 0.016, 0.03, 0.3, null, [0.9, 0, 0]); blob(X, -0.049, 1.552, 0.016, 0.03, 0.3, null, [0.9, 0, 0]);
    for (let i = 0; i < 1500; i++) { const px = (rnd() * 2 - 1) * 0.07, py = 1.5 + rnd() * 0.075, inside = smx(0.2, 0.0, Math.hypot(px / 0.065, (py - 1.53) / 0.05) - 0.8) + (Math.abs(px) < 0.03 && py > 1.554 && py < 1.568 ? 1 : 0); if (rnd() > Math.min(1, inside) * 0.9) continue; const lipZone = Math.abs(px) < mw && py > yc - bH * 0.9 && py < yc + tH * 0.9 ? 0 : 1; if (!lipZone) continue; ink(X, c => c.fillRect(px, py, 0.0016, 0.0016), null, [0.85, 0, 0], null, 0.8); }
  }
  // old skin: blotches, a duller sheen
  if (age) { blob(X, 0.045, 1.607, 0.006, 0.005, 0.25, [0.9, 0.82, 0.8]); blob(X, -0.05, 1.628, 0.005, 0.004, 0.2, [0.9, 0.82, 0.8]); ink(X, c => c.fillRect(-0.2, 1.2, 0.4, 0.8), null, null, [0.7, 0, 0], 0.0); }
}
// one eye cell (left eye; the right one is mirrored by applyFace): lid state st = 0 open, 1 wide, 2 narrow, 3 squint, 4 closed, 5 glazed
const EYE_LID = [[0.0061, 0.0051], [0.0079, 0.0058], [0.0042, 0.0045], [0.0030, 0.0037], [0, 0], [0.0044, 0.0042]];
function paintEye(X, st, fem, rnd) {
  const [hu, hl] = EYE_LID[st], x0 = -0.0112, x1 = 0.0116, closed = st === 4;
  ink(X, c => c.fillRect(-0.02, -0.02, 0.04, 0.04), fem ? [0.965, 0.93, 0.94] : 0.965, [0, 0, 0], [0.62, 0, 0]); // lid skin
  const up = [[x0, -0.0003], [-0.0062, hu * 0.62 - 0.0004], [-0.0012, hu], [0.0045, hu * 0.8 + 0.0003], [x1, 0.0009]], lo = [[x1, 0.0009], [0.0058, -hl * 0.62], [0.0004, -hl], [-0.0055, -hl * 0.7], [x0, -0.0003]];
  if (!closed) {
    const clipA = c => { c.beginPath(); c.moveTo(up[0][0], up[0][1]); for (let i = 1; i < up.length - 1; i++) { const p = up[i], q = up[i + 1]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } c.lineTo(up[4][0], up[4][1]); for (let i = 1; i < lo.length - 1; i++) { const p = lo[i], q = lo[i + 1]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); } c.lineTo(lo[4][0], lo[4][1]); c.closePath(); };
    for (const k of ['c', 'a', 'b']) { X[k].save(); clipA(X[k]); X[k].clip(); }
    ink(X, c => c.fillRect(-0.015, -0.015, 0.03, 0.03), { abs: 0xf6f1e8 }, [0, 0, 1], [0.1, 0, 0]);                                  // sclera
    blob(X, x0 + 0.0008, -0.0003, 0.0034, 0.0028, 0.9, { abs: 0xcf7e78 }, [0, 0, 1]);                                               // tear duct
    blob(X, -0.0004, 0.0006, 0.0125, 0.0075, 0.16, { abs: 0xb9a9a2 }, [0, 0, 1]);                                                  // the eyeball curves away at the corners
    const ri = 0.0058 * (st === 1 ? 1.0 : st === 3 ? 0.97 : 1), cx = 0.0004, cy = st === 1 ? 0.0001 : 0.0004;
    ink(X, c => { c.beginPath(); c.arc(cx, cy, ri, 0, TAU); c.fill(); }, 1, [0, 1, 0], [0.08, 0, 0]);                              // iris disc (tint), coloured by tint.rgb
    ink(X, c => { c.beginPath(); c.arc(cx, cy, ri, 0, TAU); c.arc(cx, cy, ri * 0.93, 0, TAU, true); c.fill(); }, 0.32, null, null, 1);   // limbal ring
    for (let i = 0; i < 70; i++) { const a = rnd() * TAU, r0 = ri * (0.32 + rnd() * 0.15), r1 = ri * (0.78 + rnd() * 0.18), m = 0.6 + rnd() * 0.75; ink(X, c => { c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineWidth = 0.0003; c.stroke(); }, m, null, null, 0.5); }
    blob(X, cx, cy, ri * 0.62, ri * 0.62, 0.55, 1.3, null, null);                                                                  // collarette
    blob(X, cx, cy + ri * 0.2, ri * 0.9, ri * 0.6, 0.35, 1.18, null, null);                                                        // lower iris glows (light through the iris)
    const rp = ri * (st === 1 ? 0.5 : st === 2 ? 0.38 : st === 5 ? 0.66 : 0.43);
    ink(X, c => { c.beginPath(); c.arc(cx, cy, rp, 0, TAU); c.fill(); }, { abs: 0x0b0909 }, [0, 0, 1], [0.05, 0, 0]);               // pupil
    if (st !== 5) { ink(X, c => { c.beginPath(); c.ellipse(cx + 0.0029, cy + 0.0030, 0.0016, 0.0013, 0.4, 0, TAU); c.fill(); }, { abs: 0xffffff }, [0, 0, 1], [0.03, 0, 0]); ink(X, c => { c.beginPath(); c.arc(cx - 0.0016, cy - 0.0019, 0.0005, 0, TAU); c.fill(); }, { abs: 0xffffff }, [0, 0, 1], [0.04, 0, 0], 0.5); } // catch-lights
    const sg = X.c.createLinearGradient(0, hu, 0, -hl * 0.3); sg.addColorStop(0, 'rgba(10,6,6,0.5)'); sg.addColorStop(0.5, 'rgba(10,6,6,0)'); X.c.fillStyle = sg; X.c.fillRect(-0.015, -0.015, 0.03, 0.03); // the upper lid shades the eye
    for (const k of ['c', 'a', 'b']) X[k].restore();
  }
  // lid lines: crease, lashes
  const lash = fem ? 0.0019 : 0.0012;
  if (closed) {
    const cl = [[x0, 0.0004], [-0.0058, -0.0006], [0, -0.0012], [0.0058, -0.0007], [x1, 0.0008]];
    stroke(X, cl, lash * 1.4, 1, { abs: 0x1e1614 }, [0, 0, 1], [0.25, 0, 0]); stroke(X, cl.map(p => [p[0], p[1] + 0.0029]), 0.0006, 0.4, [0.85, 0.76, 0.77]);
    if (fem) for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, px = x0 + t * (x1 - x0), py = -0.0012 + 0.0022 * Math.abs(t - 0.5) * 0, a = -1.2 + t * 0.2; stroke(X, [[px, py], [px + 0.0013 * Math.cos(a) * 0.4 + 0.0006, py - 0.0028]], 0.0004, 0.9, { abs: 0x1e1614 }, [0, 0, 1]); }
  } else {
    stroke(X, up, lash, 1, { abs: 0x1e1614 }, [0, 0, 1], [0.2, 0, 0]);                                                            // upper lash line
    stroke(X, up.map(p => [p[0] * 1.02, p[1] + hu * 0.55 + 0.0024]), 0.0007, st === 3 ? 0.3 : 0.8, [0.83, 0.73, 0.74], null, [0.62, 0.35, 0]); // lid crease
    stroke(X, lo, 0.0005, 0.5, [0.8, 0.66, 0.66]);                                                                                   // lower lid line
    const n = fem ? 11 : 6; for (let i = 0; i < n; i++) { const t = 0.12 + 0.82 * (i + rnd() * 0.6) / n, k = t * (up.length - 1), j = Math.min(up.length - 2, Math.floor(k)), f = k - j, px = up[j][0] + (up[j + 1][0] - up[j][0]) * f, py = up[j][1] + (up[j + 1][1] - up[j][1]) * f, ln = (fem ? 0.0036 : 0.0022) * (0.6 + 0.5 * Math.sin(t * Math.PI)), dx = 0.35 * (t - 0.4) * ln * 2; stroke(X, [[px, py], [px + dx * 0.6, py + ln * 0.7], [px + dx * 1.4, py + ln]], 0.00045, 1, { abs: 0x1e1614 }, [0, 0, 1]); }
    if (fem) { for (let i = 0; i < 6; i++) { const t = 0.2 + 0.7 * i / 6, k = t * (lo.length - 1), j = Math.min(lo.length - 2, Math.floor(k)), f = k - j; stroke(X, [[lo[j][0] + (lo[j + 1][0] - lo[j][0]) * f, lo[j][1] + (lo[j + 1][1] - lo[j][1]) * f], [lo[j][0] + (lo[j + 1][0] - lo[j][0]) * f, lo[j][1] + (lo[j + 1][1] - lo[j][1]) * f - 0.0014]], 0.0003, 0.7, { abs: 0x1e1614 }, [0, 0, 1]); } blob(X, 0, hu + 0.003, 0.012, 0.0048, 0.18, [0.8, 0.74, 0.82]); } // lower lashes, a touch of eyeshadow
    if (st === 5) blob(X, 0, 0, 0.0115, 0.0055, 0.2, { abs: 0xb8c0c6 }, [0, 0, 0.5]); // glazed: a milky film (absolute, over the iris)
  }
}
// hair strand cells: straight (clumps along the strand, root dark, a highlight band), wavy (curls with dark gaps), fur (short hair, beards)
function paintHair(X, kind, rnd, ox, oy) {
  const W = AT.HW, Hh = AT.HH, cd = X.c.getImageData(ox, oy, W, Hh), md = X.a.getImageData(ox, oy, W, Hh), bd = X.b.getImageData(ox, oy, W, Hh); const C = cd.data, A = md.data, Bd = bd.data;
  const nClump = kind === 2 ? 64 : kind === 1 ? 20 : 34, cb = [], cs = [], cl = []; for (let i = 0; i < nClump + 2; i++) { cb.push(0.8 + rnd() * 0.38); cs.push(rnd() > 0.95 ? 1 : 0); cl.push(0.74 + rnd() * 0.12); }
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / Hh, o = (y * W + x) * 4; let wob = kind === 1 ? Math.sin(v * 26 + u * 40) * 0.012 + Math.sin(v * 9 + u * 17) * 0.02 : kind === 0 ? Math.sin(v * 7 + u * 31) * 0.004 : 0;
    const uu = ((u + wob) % 1 + 1) % 1, ci = uu * nClump, cj = Math.floor(ci), cf = ci - cj, edge = Math.min(cf, 1 - cf) * 2;
    let m = cb[cj] * (0.9 + 0.2 * hash2(Math.floor(uu * W * (kind === 2 ? 0.6 : 1)), kind === 2 ? y : 0, 3)) * (0.78 + 0.22 * smx(0, 0.28, edge));
    if (kind === 1) m *= 0.55 + 0.45 * smx(0, 0.5, Math.sin(v * 30 + cj) * 0.5 + 0.5 + edge * 0.4);
    if (kind === 2) m = 0.8 + 0.35 * hash2(x, y, 9) + 0.15 * (vnoise(x * 0.3, y * 0.3, 1) - 0.5);
    const root = kind === 2 ? 1 : 0.62 + 0.38 * smx(0, 0.16, v), hi = Math.exp(-(((v - 0.42) / 0.075) ** 2)), hi2 = Math.exp(-(((v - 0.72) / 0.05) ** 2)) * 0.5;
    const val = m * root * (1 + 0.32 * (hi + hi2));
    const [r8] = cC(clamp(val, 0, 1.25)); C[o] = C[o + 1] = C[o + 2] = r8; C[o + 3] = 255;
    const cut = kind !== 2 && v > cl[cj] + 0.15 * edge * edge ? 1 : 0, tint0 = 0;
    const tint = Math.max(cs[cj] * smx(0.15, 0.4, edge) * 0.95, kind === 2 ? 0 : smx(0.72, 0.98, v) * 0.4);
    A[o] = 0; A[o + 1] = tint * 255; A[o + 2] = 0; A[o + 3] = 255;
    Bd[o] = (0.66 - 0.36 * (hi + hi2 * 0.5) - (kind === 0 ? 0.08 : 0)) * 255; Bd[o + 1] = (0.5 + 0.1 * (hash2(x, 0, 5) - 0.5) * (kind === 2 ? 0.2 : 1) + (kind === 1 ? 0.12 * (1 - edge) : 0)) * 255; Bd[o + 2] = cut ? 0 : 255; Bd[o + 3] = 255;
  }
  X.c.putImageData(cd, ox, oy); X.a.putImageData(md, ox, oy); X.b.putImageData(bd, ox, oy);
}
// builds the three canvases and the textures (once)
function ensureSurfaces() {
  if (SURF.ready) return SURF; SURF.ready = true; SURF.fab = fabricArray();
  const mk = (w, h) => (typeof document !== 'undefined' ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : null), cc = mk(AT.W, AT.H), ca = mk(AT.W, AT.H), cb = mk(AT.W, AT.H);
  if (!cc || !cc.getContext) { // no canvas (Node): 1 x 1 neutral textures
    const dt = v => { const t = new THREE.DataTexture(new Uint8Array([v[0], v[1], v[2], 255]), 1, 1); t.needsUpdate = true; return t; }; SURF.atlas = dt([231, 231, 231]); SURF.maskA = dt([0, 0, 0]); SURF.maskB = dt([150, 0, 0]); charMat.map = SURF.atlas; return SURF;
  }
  const ctx = [cc, ca, cb].map(c => c.getContext('2d', { willReadFrequently: true })), X = { c: ctx[0], a: ctx[1], b: ctx[2] }, rnd = mulberry(20260);
  X.c.fillStyle = css(cC(1), 1); X.c.fillRect(0, 0, AT.W, AT.H); X.a.fillStyle = '#000'; X.a.fillRect(0, 0, AT.W, AT.H); X.b.fillStyle = css(cRaw([0.62, 0, 1]), 1); X.b.fillRect(0, 0, AT.W, AT.H);
  const cell = (x0, y0, w, h, fn) => { for (const k of ['c', 'a', 'b']) { X[k].save(); X[k].beginPath(); X[k].rect(x0, y0, w, h); X[k].clip(); } fn(); for (const k of ['c', 'a', 'b']) X[k].restore(); };
  for (let fk = 0; fk < 5; fk++) for (let ex = 0; ex < 8; ex++) {
    const idx = fk * 8 + ex, x0 = (idx % AT.FCOLS) * AT.FW, y0 = Math.floor(idx / AT.FCOLS) * AT.FH;
    cell(x0, y0, AT.FW, AT.FH, () => { const sx = AT.FW / FACE.W, sy = AT.FH / FACE.H; for (const k of ['c', 'a', 'b']) X[k].setTransform(sx, 0, 0, -sy, x0 + AT.FW / 2, y0 + AT.FH + FACE.Y0 * sy); paintFace(X, ex, fk, rnd); for (const k of ['c', 'a', 'b']) X[k].setTransform(1, 0, 0, 1, 0, 0); });
  }
  for (let fem = 0; fem < 2; fem++) for (let st = 0; st < 6; st++) {
    const x0 = (st + 6 * fem) * AT.EW, y0 = AT.EY;
    cell(x0, y0, AT.EW, AT.EW, () => { const s = AT.EW / EYE_CELL * EYE_K; for (const k of ['c', 'a', 'b']) X[k].setTransform(s, 0, 0, -s, x0 + AT.EW / 2, y0 + AT.EW / 2); paintEye(X, st, fem, rnd); for (const k of ['c', 'a', 'b']) X[k].setTransform(1, 0, 0, 1, 0, 0); });
  }
  for (let k = 0; k < 3; k++) paintHair(X, k, rnd, k * AT.HW, AT.HY);
  const tex = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; return t; };
  SURF.atlas = tex(cc, true); SURF.maskA = tex(ca, false); SURF.maskB = tex(cb, false); charMat.map = SURF.atlas; return SURF;
}
if (typeof window !== 'undefined' && typeof setTimeout === 'function') setTimeout(ensureSurfaces, 30); // draw the textures while the title screen is up, not when the first person is built

// =====================================================================================================================
// HAIR (release 3, P2). Hair is LAYERED SHELLS over the head surface function headP(): a scalp cap that starts at a per-style hairline and rises to the crown (thickness profile, volume pushes), curtains that leave the
// skull and hang over the neck and back, tubes (ponytail, plaits, locs), blobs (curls, a bun, an afro) and tapered RIBBON locks that break the hairline and the hem. Every piece is textured from the hair strand cells of the
// atlas (clumps, root darkening, a highlight band, tapering tips cut out by alpha test) and tinted per person (streaks, ombre tips). The pieces of one style are merged into a cached TEMPLATE (positions, normals, UVs, per
// vertex brightness and skin mix); a person only gets its own colour array and tint, so a hair style costs nothing to build the second time. Styles: bald buzz crop fade short sidepart slick quiff pixie balding curly
// afro long wavy pony bun bob braids locs mohawk. Facial hair (stubble is painted; moustache, goatee, short and full beards) are shells over the jaw.
// =====================================================================================================================
const TOP_Y = 1.7455, HC = [0, 1.62, -0.005]; // crown, a point inside the head
const HAIRLINE = [[0, 1.700], [0.45, 1.694], [0.8, 1.676], [1.1, 1.648], [1.3, 1.600], [1.45, 1.628], [1.58, 1.666], [1.95, 1.668], [2.1, 1.625], [2.4, 1.595], [2.8, 1.565], [3.1416, 1.552]];
const hl0 = (a, fem) => hk(HAIRLINE, Math.min(a, 3.1415))[0] + (fem ? 0.005 * (1 - smx(0.5, 1.2, a)) : 0);
const wHair = y => { const h = smx(1.40, 1.52, y); return h > 0.999 ? [[HEAD, 0, 0, 0], [1, 0, 0, 0]] : wt([[HEAD, h], [CHEST, 1 - h]]); }; // hair that hangs below the neck follows the chest
const _hn = [0, 0, 0], _hp = [0, 0, 0];
// ---- pieces ----
// a piece = { P, N, idx, UV, K (rgb: brightness replicated, or an absolute colour), M (mode per vertex: 1 = hair colour, 0 = absolute, 2 = skin mix), S (skin mix), SI, SW, n }
function uvAtlas(cell, lu, lv) { return [(cell * AT.HW + clamp(lu, 0.012, 0.988) * AT.HW) / AT.W, 1 - (AT.HY + (1 - clamp(lv, 0.01, 0.99)) * AT.HH) / AT.H]; }
function finishPiece(P, idx, n, o) { // normals from the faces, orientation fixed against `outward`, weights, colours
  const N = new Float32Array(n * 3);
  const accum = () => { N.fill(0); for (let t = 0; t < idx.length; t += 3) { const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3, ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2], nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const k of [a, b, c]) { N[k] += nx; N[k + 1] += ny; N[k + 2] += nz; } } };
  accum(); let s = 0; for (let v = 0; v < n; v++) { const x = P[v * 3] - HC[0], z = P[v * 3 + 2] - HC[2]; s += N[v * 3] * x + N[v * 3 + 2] * z + (o.radial3 ? N[v * 3 + 1] * (P[v * 3 + 1] - HC[1]) : 0); }
  if (s < 0 && !o.dbl) { for (let t = 0; t < idx.length; t += 3) { const tmp = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = tmp; } accum(); }
  let I = idx, m = n, PP = P, NN = N; let UV = o.UV; if (o.fab) { UV = new Float32Array(n * 2); for (let i = 0; i < n; i++) UV[i * 2] = -o.fab; } // a fabric id instead of atlas coordinates
  if (o.dbl) { // second, reversed copy so a sheet is seen from both sides
    PP = new Float32Array(n * 6); PP.set(P); PP.set(P, n * 3); NN = new Float32Array(n * 6); for (let i = 0; i < n * 3; i++) { NN[i] = N[i]; NN[n * 3 + i] = -N[i]; }
    I = new Uint16Array(idx.length * 2); I.set(idx); for (let t = 0; t < idx.length; t += 3) { I[idx.length + t] = idx[t] + n; I[idx.length + t + 1] = idx[t + 2] + n; I[idx.length + t + 2] = idx[t + 1] + n; } m = n * 2;
  }
  const dup = (src, w) => { if (!o.dbl) return src; const d = new src.constructor(src.length * 2); d.set(src); d.set(src, src.length); return d; };
  const SI = new Uint16Array(m * 4), SW = new Float32Array(m * 4), K = new Float32Array(m * 3), M = new Uint8Array(m), S = new Float32Array(m);
  for (let v = 0; v < m; v++) {
    const vi = v % n, w = wHair(PP[v * 3 + 1]); for (let q = 0; q < 4; q++) { SI[v * 4 + q] = w[0][q]; SW[v * 4 + q] = w[1][q]; }
    const kb = typeof o.k === 'function' ? o.k(vi) : (o.k === undefined ? 1 : o.k); if (o.rgb !== undefined) { const c = col(o.rgb); K[v * 3] = c.r * kb; K[v * 3 + 1] = c.g * kb; K[v * 3 + 2] = c.b * kb; M[v] = 0; } else { K[v * 3] = K[v * 3 + 1] = K[v * 3 + 2] = kb; M[v] = 1; }
    if (o.sm) { S[v] = o.sm(vi); if (S[v] > 0) M[v] = 2; }
  }
  return { P: PP, N: NN, idx: I, UV: dup(UV), K, M, S, SI, SW, n: m };
}
// a grid of positions (nr rows x nc columns) as a piece; o: cell, uv(i, j) -> [lu, lv], k(v), sm(v), dbl, closed (wraps the columns)
function gridPiece(P, nr, nc, o) {
  const n = nr * nc, ncq = o.closed ? nc : nc - 1, idx = new Uint16Array((nr - 1) * ncq * 6), UV = new Float32Array(n * 2); let q = 0;
  for (let i = 0; i < nr - 1; i++) for (let j = 0; j < ncq; j++) { const jn = (j + 1) % nc, a = i * nc + j, b = i * nc + jn, c = (i + 1) * nc + j, d = (i + 1) * nc + jn; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) { const t = o.uv(i, j), u = uvAtlas(o.cell, t[0], t[1]); UV[(i * nc + j) * 2] = u[0]; UV[(i * nc + j) * 2 + 1] = u[1]; }
  return finishPiece(P, idx, n, { ...o, UV });
}
// scalp cap: columns around the head, rows from the hairline edge(a, phi) to top(a, phi); th(a, f, phi, y) = thickness; push(a, f, phi, y, n, out) adds a displacement
function capPiece(HS, o) {
  const nc = o.nc, nr = o.nr, P = new Float32Array(nc * nr * 3), push = [0, 0, 0], arc = o.arc;
  for (let j = 0; j < nc; j++) {
    const phi = arc ? arc[0] + (arc[1] - arc[0]) * j / (nc - 1) : -Math.PI + TAU * j / nc, a = Math.abs(phi), y0 = o.edge(a, phi), y1 = o.top ? o.top(a, phi) : TOP_Y;
    for (let i = 0; i < nr; i++) {
      const f = i / (nr - 1), y = y0 + (y1 - y0) * f; headP(HS, y, phi, _hp, false); headN(HS, y, phi, _hn, false); const th = o.th(a, f, phi, y); push[0] = push[1] = push[2] = 0; if (o.push) o.push(a, f, phi, y, _hn, push);
      const k = (i * nc + j) * 3; P[k] = _hp[0] + _hn[0] * th + push[0]; P[k + 1] = _hp[1] + _hn[1] * th + push[1]; P[k + 2] = _hp[2] + _hn[2] * th + push[2];
    }
  }
  const lv = o.lv || [0.2, 0.7];
  return gridPiece(P, nr, nc, { cell: o.cell === undefined ? 2 : o.cell, fab: o.fab, closed: !arc, dbl: o.dbl, uv: (i, j) => [j / nc * (o.ur || 1), lv[0] + (lv[1] - lv[0]) * i / (nr - 1)], k: o.k && (v => o.k(Math.floor(v / nc), v % nc)), sm: o.sm && (v => o.sm(Math.floor(v / nc), v % nc)), rgb: o.rgb });
}
// hanging hair: columns over [phi0, phi1], rows from the start (top) down to yEnd(phi); the sheet leaves the skull below y = 1.56 for the "hang ellipse" over the neck and back
const _tkc = new Map();
function hangPoint(HS, phi, y, th, o, out) {
  headP(HS, Math.max(y, 1.508), phi, _hp, false); headN(HS, Math.max(y, 1.508), phi, _hn, false); const sx = _hp[0] + _hn[0] * th, sz = _hp[2] + _hn[2] * th, w = smx(1.575, 1.47, y);
  let tk = _tkc.get(HS.fem + ':' + HS.build); if (!tk) { tk = bodySpec(HS.fem, HS.build, 1).tk; _tkc.set(HS.fem + ':' + HS.build, tk); }
  const tv = hk(tk, clamp(y, 1.2, 1.5)), ax = 0.066 + 0.9 * Math.max(0, 1.56 - y) * 0.2 * (o.spread === undefined ? 1 : o.spread), zb = Math.max(tv[2] + 0.026 + th, 0.092) + 0.12 * Math.max(0, 1.5 - y) * 0.2, zf = 0.058; // back depth stays outside the back of the trunk and its clothing
  const s = Math.sin(phi), c = Math.cos(phi), hx = ax * Math.sign(s) * Math.pow(Math.abs(s), 0.8), hz = c >= 0 ? zf * Math.pow(c, 0.8) : zb * -Math.pow(-c, 0.8);
  out[0] = sx + (hx - sx) * w; out[1] = y; out[2] = sz + (hz - sz) * w; return out;
}
function curtainPiece(HS, o) {
  const nc = o.nc, nr = o.nr, P = new Float32Array(nc * nr * 3), pt = [0, 0, 0];
  for (let j = 0; j < nc; j++) {
    const phi = o.phi0 + (o.phi1 - o.phi0) * j / (nc - 1), a = Math.abs(phi), yS = o.start(a, phi), yE = o.end(a, phi);
    for (let i = 0; i < nr; i++) {
      const f = i / (nr - 1), y = yS + (yE - yS) * f, th = o.th(a, f, phi, y); hangPoint(HS, phi, y, th, o, pt); let x = pt[0], z = pt[2];
      if (o.wave) { const wv = o.wave * smx(0, 0.35, f) * Math.sin(f * o.wf + phi * 3.1 + 0.6); x += wv; z += wv * 0.4; }
      if (o.curl) { const cf = smx(0.72, 1, f); x -= Math.sign(x) * o.curl * cf; z += o.curl * 0.7 * cf * (z < 0 ? 1 : 0); }
      const k = (i * nc + j) * 3; P[k] = x; P[k + 1] = y; P[k + 2] = z;
    }
  }
  return gridPiece(P, nr, nc, { cell: o.cell === undefined ? 0 : o.cell, closed: false, dbl: true, uv: (i, j) => [(j / (nc - 1) * 0.8 + 0.1 + (o.u0 || 0)) % 1, 0.98 - 0.94 * i / (nr - 1)], k: o.k && (v => o.k(Math.floor(v / nc), v % nc)), sm: o.sm && (v => o.sm(Math.floor(v / nc), v % nc)), rgb: o.rgb, radial3: false });
}
// a tapered ribbon lock: root point on the surface at (phi, y), end offset (dx, dy, dz), width w; 4 rows x 3 columns
function lockPiece(HS, phi, y, dx, dy, dz, w, th, o) {
  o = o || {}; headP(HS, y, phi, _hp, false); headN(HS, y, phi, _hn, false); const nx = _hn[0], ny = _hn[1], nz = _hn[2], rx = _hp[0] + nx * th, ry = _hp[1] + ny * th, rz = _hp[2] + nz * th, L = Math.hypot(dx, dy, dz) || 1;
  const dX = dx / L, dY = dy / L, dZ = dz / L; let wx = ny * dZ - nz * dY, wy = nz * dX - nx * dZ, wz = nx * dY - ny * dX; const wl = Math.hypot(wx, wy, wz) || 1; wx /= wl; wy /= wl; wz /= wl;
  const nr = 4, nc = 3, P = new Float32Array(nr * nc * 3), lift = o.lift === undefined ? 0.008 : o.lift;
  for (let i = 0; i < nr; i++) { const t = i / (nr - 1), ww = w * (1 - 0.82 * Math.pow(t, 1.4)), bx = rx + dx * t + nx * lift * Math.sin(t * Math.PI * 0.9) + (o.sag ? 0 : 0), by = ry + dy * t + ny * lift * Math.sin(t * Math.PI * 0.9) - (o.sag || 0) * t * t, bz = rz + dz * t + nz * lift * Math.sin(t * Math.PI * 0.9);
    for (let j = 0; j < nc; j++) { const c = (j - 1) * ww, bump = j === 1 ? 0.0022 * (1 - t) : 0, k = (i * nc + j) * 3; P[k] = bx + wx * c + nx * bump; P[k + 1] = by + wy * c + ny * bump; P[k + 2] = bz + wz * c + nz * bump; } }
  const u0 = o.u0 === undefined ? Math.abs(Math.sin(phi * 7.3 + y * 31)) * 0.7 : o.u0;
  return gridPiece(P, nr, nc, { cell: o.cell === undefined ? 0 : o.cell, closed: false, dbl: true, uv: (i, j) => [u0 + j * 0.1, 0.94 - 0.9 * i / (nr - 1)], k: v => 0.94 + 0.12 * ((v * 7) % 3) / 3, sm: o.sm });
}
// a tube along a path of points (parallel transport frames); radii per point; the end tapers to a point
function tubePiece(pts, rad, seg, o) {
  const nr = pts.length, P = new Float32Array(nr * seg * 3); let ux = 0, uy = 0, uz = 1; // frame
  for (let i = 0; i < nr; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(nr - 1, i + 1)]; let tx = p1[0] - p0[0], ty = p1[1] - p0[1], tz = p1[2] - p0[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let d = ux * tx + uy * ty + uz * tz; ux -= tx * d; uy -= ty * d; uz -= tz * d; let ul = Math.hypot(ux, uy, uz); if (ul < 1e-4) { ux = 1; uy = 0; uz = 0; d = tx; ux -= tx * d; uy -= ty * d; uz -= tz * d; ul = Math.hypot(ux, uy, uz) || 1; } ux /= ul; uy /= ul; uz /= ul;
    const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux, r = rad[i] * (i === nr - 1 ? 0.35 : 1);
    for (let j = 0; j < seg; j++) { const a = TAU * j / seg, c = Math.cos(a) * r, s = Math.sin(a) * r, k = (i * seg + j) * 3; P[k] = pts[i][0] + ux * c + vx * s; P[k + 1] = pts[i][1] + uy * c + vy * s; P[k + 2] = pts[i][2] + uz * c + vz * s; }
  }
  return gridPiece(P, nr, seg, { cell: o.cell === undefined ? 0 : o.cell, closed: true, uv: (i, j) => [(j / seg * 0.5 + (o.u0 || 0.2)), 0.96 - 0.92 * i / (nr - 1)], k: o.k, rgb: o.rgb, fab: o.fab, radial3: true, dbl: false });
}
// an ellipsoid blob (curls, the bun, plait links)
function blobPiece(cx, cy, cz, rx, ry, rz, seg, o) {
  const u = uSphere(seg[0], seg[1], 0, TAU, 0, Math.PI), n = u.n, P = new Float32Array(n * 3), cr = Math.cos(o.rot || 0), sr = Math.sin(o.rot || 0); const UVl = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) { const x = u.pos[i * 3] * rx, y = u.pos[i * 3 + 1] * ry, z = u.pos[i * 3 + 2] * rz; P[i * 3] = cx + x * cr - y * sr; P[i * 3 + 1] = cy + x * sr + y * cr; P[i * 3 + 2] = cz + z; UVl[i * 2] = Math.atan2(u.pos[i * 3], u.pos[i * 3 + 2]) / TAU + 0.5; UVl[i * 2 + 1] = 0.25 + 0.4 * (u.pos[i * 3 + 1] + 1) / 2; }
  const UV = new Float32Array(n * 2); for (let i = 0; i < n; i++) { const t = uvAtlas(o.cell === undefined ? 1 : o.cell, UVl[i * 2], UVl[i * 2 + 1]); UV[i * 2] = t[0]; UV[i * 2 + 1] = t[1]; }
  return finishPiece(P, u.idx.slice(), n, { UV, k: o.k || (() => 0.92 + 0.16 * hash2(Math.round(cx * 997), Math.round(cz * 991), 3)), rgb: o.rgb, sm: o.sm, fab: o.fab, radial3: true });
}
// ---- styles ----
const HLOD_N = { nc: [40, 26, 16], nr: [11, 8, 6] };
const stableR = (s) => { let t = s * 9301 + 49297; return () => { t = (t * 9301 + 49297) % 233280; return t / 233280; }; };
function hairPieces(look, HS, fem, style, lod) {
  const nc = HLOD_N.nc[lod], nr = HLOD_N.nr[lod], out = [], rng = stableR(style.length * 31 + (fem ? 7 : 0)), side = look._side || 1, elder = !!look.elder;
  const edge = (dy, lim) => (a, phi) => hl0(a, fem) + (typeof dy === 'function' ? dy(a, phi) : dy);
  // value of the hair without an explicit shade: darker under the hairline, lighter on the crown, with a streak per column so the cap reads as strands, not a helmet
  const strand = (i, j) => { const h = Math.sin(j * 12.9898) * 43758.5453; return 0.86 + 0.2 * (i / (nr - 1)) + 0.1 * (h - Math.floor(h) - 0.5); };
  const cap = o => out.push(capPiece(HS, { nc, nr, k: strand, ...o }));
  const ribbons = (list, o) => { if (lod > 1) return; for (const [phi, y, dx, dy, dz, w, th] of list) { const lk = 0.72 + 0.6 * rng(), wk = 0.8 + 0.45 * rng(); out.push(lockPiece(HS, phi + (rng() - 0.5) * 0.05, y, dx * lk, dy * lk, dz * lk, w * wk, th === undefined ? 0.007 : th, o)); } }; // each lock a little different in length and width, so a fringe is not a row of teeth
  // thickness profile: edge value t0 rising to t1 over the first part of the cap, a little more on the crown
  const prof = (t0, t1, crown) => (a, f) => t0 + (t1 - t0) * smx(0, 0.38, f) + (crown || 0) * smx(0.55, 1, f) * (1 - smx(1.5, 2.6, a) * 0.4);
  switch (style) {
    case 'buzz': cap({ edge: edge(0.006), th: prof(0.0014, 0.0030), cell: 2, lv: [0.2, 0.6], sm: (i, j) => 0.5 - 0.15 * (i / (nr - 1)) }); break;
    case 'fade': cap({ edge: edge((a) => 0.012 + 0.03 * smx(0.9, 1.5, a) * (1 - smx(2.6, 3.1, a) * 0.5)), th: (a, f) => (0.0016 + 0.0085 * smx(0.1, 0.65, f)) * (1 + 0.2 * smx(0, 0.8, f)), cell: 2, lv: [0.2, 0.7], sm: (i) => 0.55 * (1 - smx(0.0, 0.5, i / (nr - 1))) }); ribbons([[0.2, 1.699, 0.0, -0.012, 0.012, 0.016], [-0.2, 1.699, 0.0, -0.013, 0.012, 0.016]], { cell: 2 }); break;
    case 'crop': cap({ edge: edge((a) => 0.004 + 0.016 * smx(1.0, 1.6, a)), th: prof(0.003, 0.0105, 0.0025), cell: 0, lv: [0.2, 0.7] }); cap({ edge: edge(0.025), th: (a, f) => 0.0065 + 0.008 * smx(0.0, 0.5, f), cell: 0, lv: [0.3, 0.7], k: () => 1.05 });
      ribbons([[0.0, 1.700, 0.0, -0.03, 0.02, 0.008], [0.1 * side, 1.7, 0.003 * side, -0.032, 0.02, 0.008], [-0.1 * side, 1.7, -0.003 * side, -0.03, 0.02, 0.008], [0.22 * side, 1.699, 0.006 * side, -0.034, 0.018, 0.008], [-0.22 * side, 1.698, -0.006 * side, -0.03, 0.018, 0.008], [0.34 * side, 1.696, 0.01 * side, -0.028, 0.014, 0.008], [-0.36 * side, 1.695, -0.01 * side, -0.028, 0.014, 0.008], [0.5 * side, 1.69, 0.012 * side, -0.024, 0.01, 0.008], [-0.5 * side, 1.69, -0.012 * side, -0.024, 0.01, 0.008], [0.66, 1.682, 0.014, -0.02, 0.004, 0.008], [-0.66, 1.682, -0.014, -0.02, 0.004, 0.008]], { cell: 0 }); break;
    case 'short': default:
      cap({ edge: edge(0), th: prof(0.0035, 0.0115, 0.004), cell: 0, lv: [0.2, 0.72] }); cap({ edge: edge(0.02), th: (a, f) => 0.0075 + 0.0085 * smx(0.0, 0.5, f) + 0.004 * smx(0.55, 1, f), cell: 0, lv: [0.3, 0.7], nc: Math.max(12, nc - 4), k: () => 1.04 }); // two layers: the lower hair and the top
      ribbons([[0.0, 1.700, 0.0, -0.026, 0.028, 0.016], [0.25 * side, 1.699, 0.01 * side, -0.026, 0.026, 0.016], [-0.3 * side, 1.698, -0.01 * side, -0.022, 0.02, 0.015], [3.0, 1.556, 0.0, -0.018, -0.012, 0.016, 0.004], [-3.0, 1.556, 0.0, -0.018, -0.012, 0.016, 0.004], [0.0, 1.735, 0.0, 0.008, -0.03, 0.02, 0.006], [2.2, 1.72, 0.0, -0.02, -0.03, 0.02, 0.005]], { cell: 0 }); break;
    case 'sidepart': {
      const px = 0.62 * side; cap({ edge: edge(0), th: (a, f, phi) => { const d = (phi - px), groove = 0.0052 * Math.exp(-((d / 0.045) ** 2)) * smx(0.08, 0.3, f), vol = (side * phi > 0 ? 0.0105 : 0.0058) * smx(0.2, 0.7, f); return 0.003 + 0.0075 * smx(0, 0.38, f) + vol * 0.5 - groove + 0.004 * smx(0.6, 1, f); }, cell: 0, lv: [0.22, 0.62], k: (i, j) => 1, ur: 1 });
      ribbons([[px - 0.1 * side, 1.7, -0.002 * side, -0.02, 0.026, 0.02], [px + 0.12 * side, 1.7, 0.0, -0.034, 0.03, 0.022], [px + 0.34 * side, 1.698, 0.012 * side, -0.036, 0.018, 0.02], [px + 0.55 * side, 1.69, 0.016 * side, -0.03, 0.008, 0.017], [3.0, 1.556, 0.0, -0.018, -0.014, 0.016, 0.004], [-3.0, 1.556, 0.0, -0.018, -0.014, 0.016, 0.004]], { cell: 0 }); break; }
    case 'slick': cap({ edge: edge((a) => 0.004 + 0.006 * smx(0.4, 1.2, a)), th: (a, f) => 0.0035 + 0.0075 * smx(0, 0.5, f) + 0.003 * smx(0.55, 0.9, f), cell: 0, lv: [0.3, 0.55] });
      ribbons([[3.0, 1.556, 0.0, -0.022, -0.012, 0.018, 0.004], [-3.0, 1.556, 0.0, -0.022, -0.012, 0.018, 0.004], [2.7, 1.58, 0.0, -0.022, -0.016, 0.018, 0.004], [-2.7, 1.58, 0.0, -0.022, -0.016, 0.018, 0.004]], { cell: 0 }); break;
    case 'quiff': cap({ edge: edge(0.002), th: (a, f, phi) => 0.003 + 0.008 * smx(0, 0.38, f) + 0.012 * Math.exp(-((a / 0.7) ** 2)) * smx(0.1, 0.5, f) * (1 - smx(0.6, 1, f)), push: (a, f, phi, y, n, o) => { const q = Math.exp(-((a / 0.65) ** 2)) * smx(0.1, 0.55, f) * (1 - smx(0.55, 1, f)); o[1] += 0.012 * q; o[2] += 0.02 * q; }, cell: 0, lv: [0.25, 0.6] });
      ribbons([[0.0, 1.724, 0.0, 0.01, 0.034, 0.024, 0.014], [0.3, 1.715, 0.01, 0.0, 0.034, 0.022, 0.012], [-0.3, 1.715, -0.01, 0.0, 0.034, 0.022, 0.012], [-1.35, 1.612, -0.002, -0.034, 0.004, 0.012, 0.004]], { cell: 0 }); break;
    case 'balding': cap({ edge: edge(0.0), top: (a) => hl0(a, fem) + 0.032 * smx(0.9, 1.6, a) * (1 - smx(2.9, 3.14, a) * 0.3) + 0.002, th: prof(0.0028, 0.007), cell: 2, lv: [0.2, 0.6] }); break;
    case 'pixie': cap({ edge: edge(0.0), th: prof(0.003, 0.0105, 0.004), cell: 0, lv: [0.22, 0.65] });
      ribbons([[0.0, 1.702, 0.0, -0.036, 0.022, 0.02], [0.3 * side, 1.702, 0.02 * side, -0.036, 0.018, 0.02], [-0.3 * side, 1.7, -0.01 * side, -0.03, 0.02, 0.02], [0.65 * side, 1.69, 0.03 * side, -0.036, 0.0, 0.012], [2.6, 1.585, 0.0, -0.04, -0.016, 0.02], [-2.6, 1.585, 0.0, -0.04, -0.016, 0.02], [3.1, 1.555, 0.0, -0.04, -0.012, 0.02]], { cell: 0 }); break;
    case 'curly': { // a thin cap and a spiral of ball-curls (golden angle) over the crown and sides
      cap({ edge: edge(0.0), th: prof(0.009, 0.016), cell: 1, lv: [0.25, 0.6] }); // thick enough that the gaps between the curls show hair, not scalp
      const n = [46, 24, 11][lod], r = [0.030, 0.034, 0.042][lod];
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, el = Math.acos(1 - t * 0.92), pa = ((i * 2.39996 + 0.4 + Math.PI) % TAU) - Math.PI, ya = Math.min(Math.max(hl0(Math.abs(pa), fem) + 0.01, TOP_Y - el * 0.075), 1.742), s = 0.9 + 0.3 * rng();
        headP(HS, ya, pa, _hp, false); headN(HS, ya, pa, _hn, false); out.push(blobPiece(_hp[0] + _hn[0] * 0.014, _hp[1] + _hn[1] * 0.014 + 0.004, _hp[2] + _hn[2] * 0.014, r * s, r * s * 0.95, r * s, lod ? [7, 5] : [9, 6], { cell: 1 })); }
      break; }
    case 'afro': {
      const nc2 = [44, 28, 18][lod], nr2 = [16, 11, 8][lod];
      out.push(capPiece(HS, { nc: nc2, nr: nr2, edge: (a) => hl0(a, fem) + 0.006 + 0.03 * smx(0.9, 1.7, a) + 0.012 * smx(2.6, 3.1, a), th: (a, f, phi, y) => { const base = 0.012 + 0.03 * Math.sin(Math.min(1, f / 0.62) * Math.PI * 0.5) + 0.006 * smx(0.55, 1, f), bump = 0.0075 * (vnoise(phi * 3.1 + 1.7, y * 38, 0.5) - 0.5) + 0.004 * (vnoise(phi * 9 + 3, y * 90, 1.5) - 0.5); return base + bump * smx(0.1, 0.5, f); }, push: (a, f, phi, y, n, o) => { o[1] += 0.012 * smx(0.3, 1, f); }, cell: 1, lv: [0.25, 0.7] }));
      break; }
    case 'mohawk': { // shaved sides and a ripple-topped fin along the midline from the forehead over the crown to the nape
      cap({ edge: edge(0.012), th: prof(0.0014, 0.0030), cell: 2, lv: [0.2, 0.6], sm: (i) => 0.5 - 0.2 * (i / (nr - 1)) });
      const ns = [16, 10, 7][lod], P = new Float32Array(ns * 3 * 3);
      for (let i = 0; i < ns; i++) { const t = i / (ns - 1), front = t <= 0.5, yy = front ? 1.704 + (TOP_Y - 1.704) * t * 2 : TOP_Y - (TOP_Y - 1.595) * (t - 0.5) * 2, ph = front ? 0 : Math.PI;
        headP(HS, yy, ph, _hp, false); headN(HS, yy, ph, _hn, false); const h = (0.014 + 0.046 * Math.pow(Math.sin(Math.PI * t), 0.7)) * (1 + 0.22 * Math.sin(i * 2.7)), hw = 0.021 * (0.75 + 0.45 * Math.sin(Math.PI * t));
        for (let j = 0; j < 3; j++) { const k = (i * 3 + j) * 3, c = j - 1, lift = j === 1 ? h : 0.002; P[k] = _hp[0] + c * hw + _hn[0] * lift; P[k + 1] = _hp[1] + _hn[1] * lift; P[k + 2] = _hp[2] + _hn[2] * lift; } }
      out.push(gridPiece(P, ns, 3, { cell: 0, closed: false, dbl: true, uv: (i, j) => [0.2 + j * 0.2, 0.15 + 0.5 * (i % 3) / 3], k: () => 1 }));
      break; }
    case 'long': case 'wavy': {
      const wavy = style === 'wavy', long = true, cL = wavy ? 1 : 0, nc2 = [30, 20, 14][lod], nr2 = [16, 11, 7][lod], endY = wavy ? 1.33 : 1.3;
      cap({ edge: edge(0.0), th: prof(0.004, 0.0105, 0.004), cell: wavy ? 1 : 0, lv: [0.2, 0.65] });
      // back curtain from the ear round the back; side curtains frame the face
      out.push(curtainPiece(HS, { nc: nc2, nr: nr2, phi0: 1.45, phi1: TAU - 1.45, start: (a) => hl0(a, fem) - 0.0, end: (a) => endY + 0.02 * Math.cos(a * 2) + (wavy ? -0.02 : 0), th: (a, f) => 0.006 + 0.004 * smx(0, 0.5, f) + (wavy ? 0.008 * smx(0.2, 0.6, f) : 0), cell: cL, wave: wavy ? 0.012 : 0, wf: 11, u0: 0.1 }));
      for (const s of [1, -1]) out.push(curtainPiece(HS, { nc: 6, nr: nr2, phi0: s * 0.92, phi1: s * 1.46, start: (a) => 1.69 - 0.03 * (a - 0.92) * 3, end: (a) => 1.465 - (wavy ? 0.03 : 0), th: (a, f) => 0.007 + 0.005 * f, cell: cL, wave: wavy ? 0.007 : 0, wf: 9, u0: s > 0 ? 0 : 0.4, spread: 0.35 }));
      ribbons([[0.0, 1.700, 0.0, -0.01, 0.03, 0.018, 0.01]], { cell: 0 }); break; }
    case 'bob': {
      cap({ edge: edge(0.0), th: prof(0.004, 0.0105, 0.004), cell: 0, lv: [0.22, 0.65] });
      out.push(curtainPiece(HS, { nc: [30, 20, 14][lod], nr: [11, 8, 6][lod], phi0: 0.92 * 1, phi1: TAU - 0.92, start: (a) => hl0(a, fem) + 0.0, end: (a) => 1.505 + 0.012 * Math.cos(a * 2), th: (a, f) => 0.007 + 0.007 * smx(0.2, 0.7, f), cell: 0, curl: 0.016, u0: 0.1, spread: 0.0 }));
      ribbons([[0.0, 1.700, 0.0, -0.034, 0.02, 0.01, 0.008], [0.12, 1.7, 0.004, -0.036, 0.018, 0.01, 0.008], [-0.12, 1.7, -0.004, -0.036, 0.018, 0.01, 0.008], [0.25, 1.7, 0.01, -0.036, 0.018, 0.01, 0.008], [-0.25, 1.7, -0.01, -0.036, 0.018, 0.01, 0.008], [0.4, 1.696, 0.012, -0.032, 0.014, 0.01, 0.008], [-0.4, 1.696, -0.012, -0.032, 0.014, 0.01, 0.008]], { cell: 0 }); break; }
    case 'pony': case 'bun': case 'braids': case 'locs': {
      const bun = style === 'bun', pony = style === 'pony';
      cap({ edge: edge(0.0), th: prof(0.0032, bun || pony ? 0.0085 : 0.009, 0.002), cell: 0, lv: [0.3, 0.55], k: (i, j) => 0.94 + 0.04 * smx(0.5, 1, i / (nr - 1)) });
      if (pony) { const seg = lod ? 5 : 8, pts = [[0, 1.687, -0.108], [0, 1.668, -0.13], [0, 1.628, -0.148], [0, 1.57, -0.152], [0, 1.50, -0.146], [0, 1.44, -0.135], [0, 1.385, -0.125]], rad = [0.02, 0.026, 0.03, 0.031, 0.028, 0.02, 0.011];
        out.push(tubePiece(pts, rad, seg, { cell: 0, u0: 0.1 })); out.push(tubePiece(pts.slice(0, 2).map((p, i) => [p[0], p[1] - 0.0 + i * 0.0, p[2] + 0.0]), [0.0255, 0.0255], seg, { rgb: look._tie || 0xd1345b, cell: 0 }));
        ribbons([[0.5, 1.7, 0, -0.01, 0.02, 0.016], [-0.5, 1.7, 0, -0.01, 0.02, 0.016]], { cell: 0 }); }
      if (bun) { out.push(blobPiece(0, 1.712, -0.082, 0.052, 0.046, 0.05, lod ? [8, 6] : [12, 8], { cell: 1, k: () => 0.98 })); if (lod < 2) out.push(tubePiece([[-0.03, 1.703, -0.108], [0, 1.722, -0.118], [0.03, 1.703, -0.108]], [0.011, 0.011, 0.011], 6, { rgb: look._tie || 0x2f2f2f, cell: 0 })); }
      if (style === 'braids') { for (const s of [1, -1]) { const pts = []; for (let i = 0; i < 9; i++) { const t = i / 8; pts.push([s * (0.086 + 0.012 * t + 0.01 * Math.sin(t * 3)), 1.62 - t * 0.27, -0.03 - 0.03 * t + 0.0]); } const rad = pts.map((p, i) => 0.0105 * (1 - 0.35 * i / 8));
        out.push(tubePiece(pts, rad, lod ? 5 : 7, { cell: 1, u0: 0.1, k: (v) => 0.88 + 0.2 * (Math.floor(v / (lod ? 5 : 7)) % 2) }));
        if (lod < 2) for (let i = 1; i < 8; i++) out.push(blobPiece(pts[i][0] + s * 0.0028 * (i % 2 ? 1 : -1), pts[i][1], pts[i][2], 0.0118 * (1 - 0.3 * i / 8), 0.0145, 0.0118 * (1 - 0.3 * i / 8), [7, 5], { cell: 1, k: () => 0.9 + 0.12 * (i % 2) })); } }
      if (style === 'locs') { const n = [18, 11, 7][lod]; for (let i = 0; i < n; i++) { const phi = -Math.PI + TAU * (i + 0.5 * (i % 2)) / n, a = Math.abs(phi); if (a < 0.7) continue; const yS = Math.max(hl0(a, fem) + 0.02, 1.66) + (a > 2.4 ? -0.05 : 0), L = 0.2 + 0.1 * rng(), pts = [], hl = Math.min(8, 5 + lod * 0); headP(HS, yS, phi, _hp, false); headN(HS, yS, phi, _hn, false); for (let q = 0; q <= hl; q++) { const t = q / hl; pts.push([_hp[0] + _hn[0] * (0.01 + 0.012 * t) + Math.sin(phi) * 0.006 * t, yS - L * t, _hp[2] + _hn[2] * (0.01 + 0.012 * t)]); } out.push(tubePiece(pts, pts.map((p, q) => 0.0085 * (1 - 0.25 * q / hl)), lod ? 4 : 6, { cell: 1, u0: rng() * 0.5 })); } }
      break; }
  }
  return out;
}
// a style's merged template (cached by style, head spec and LOD)
const _hairTpl = new Map();
function hairTemplate(look, HS, fem, style, lod) {
  const key = style + '|' + (fem ? 'f' : 'm') + (HS.build || '') + (HS.elder ? 'e' : '') + '|' + lod + '|' + (look._side || 1) + (look._tie ? look._tie : ''); let T = _hairTpl.get(key); if (T) return T;
  const pcs = hairPieces(look, HS, fem, style, lod); let nv = 0, ni = 0; for (const p of pcs) { nv += p.n; ni += p.idx.length; }
  T = { P: new Float32Array(nv * 3), N: new Float32Array(nv * 3), UV: new Float32Array(nv * 2), K: new Float32Array(nv * 3), M: new Uint8Array(nv), S: new Float32Array(nv), SI: new Uint16Array(nv * 4), SW: new Float32Array(nv * 4), idx: new Uint16Array(ni), n: nv };
  let vo = 0, io = 0; for (const p of pcs) { T.P.set(p.P, vo * 3); T.N.set(p.N, vo * 3); T.UV.set(p.UV, vo * 2); T.K.set(p.K, vo * 3); T.M.set(p.M, vo); T.S.set(p.S, vo); T.SI.set(p.SI, vo * 4); T.SW.set(p.SW, vo * 4); for (let i = 0; i < p.idx.length; i++) T.idx[io + i] = p.idx[i] + vo; vo += p.n; io += p.idx.length; }
  _hairTpl.set(key, T); return T;
}
// a person's copy of a template: own colours and tint
function hairGeo(T, look, skin, hairC, tintC) {
  const n = T.n, K = new Float32Array(n * 3), TI = new Uint8Array(n * 4);
  for (let v = 0; v < n; v++) {
    const m = T.M[v]; if (m === 1) { K[v * 3] = hairC.r * T.K[v * 3]; K[v * 3 + 1] = hairC.g * T.K[v * 3 + 1]; K[v * 3 + 2] = hairC.b * T.K[v * 3 + 2]; }
    else if (m === 2) { const s = T.S[v], b = T.K[v * 3]; K[v * 3] = hairC.r * b * (1 - s) + skin.r * 0.82 * s; K[v * 3 + 1] = hairC.g * b * (1 - s) + skin.g * 0.82 * s; K[v * 3 + 2] = hairC.b * b * (1 - s) + skin.b * 0.82 * s; }
    else { K[v * 3] = T.K[v * 3]; K[v * 3 + 1] = T.K[v * 3 + 1]; K[v * 3 + 2] = T.K[v * 3 + 2]; }
    if (tintC && m !== 0) { TI[v * 4] = tintC.r * 255; TI[v * 4 + 1] = tintC.g * 255; TI[v * 4 + 2] = tintC.b * 255; } TI[v * 4 + 3] = 255;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(T.P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(T.N, 3)); g.setAttribute('color', new THREE.BufferAttribute(K, 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(T.SI, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(T.SW, 4)); g.setAttribute('uv', new THREE.BufferAttribute(T.UV, 2)); g.setAttribute('tint', new THREE.BufferAttribute(TI, 4, true)); g.setIndex(new THREE.BufferAttribute(T.idx, 1)); return g;
}
// facial hair as a shell over the jaw: style 'full' | 'short' | 'goatee' | 'moustache' | 'chinstrap'; the mouth stays open
const _beardTpl = new Map();
function beardTemplate(HS, style, lod) {
  const key = style + (HS.build || '') + lod; let T = _beardTpl.get(key); if (T) return T;
  const nc = [34, 22, 14][lod], nr = [14, 9, 6][lod]; let arc, top, bot, th;
  const mouthHole = (a, y) => smx(0.5, 0.3, a) * smx(1.527, 1.531, y) * smx(1.5625, 1.5585, y); // no hair over the lips
  if (style === 'moustache') { arc = [-0.62, 0.62]; top = a => 1.5665 - 0.002 * a; bot = a => 1.5555 + 0.006 * smx(0.2, 0.6, a); th = (a, f, y) => (0.0045 * (1 - 0.5 * smx(0.3, 0.62, a)) * Math.sin(Math.PI * Math.min(1, 0.12 + f * 0.9)) - 0.0035 * mouthHole(a, y)); }
  else if (style === 'chinstrap') { arc = [-1.75, 1.75]; top = a => 1.512 + 0.04 * smx(0.3, 1.7, a); bot = a => 1.499 + 0.03 * smx(0.3, 1.7, a); th = (a, f) => 0.004 * Math.sin(Math.PI * (0.1 + f * 0.8)); }
  else if (style === 'goatee') { arc = [-0.95, 0.95]; top = a => 1.5465 - 0.025 * smx(0.3, 0.95, a); bot = a => 1.499; th = (a, f, y) => (0.009 * (1 - smx(0.35, 0.95, a))) * Math.sin(Math.PI * Math.min(1, 0.1 + f * 0.95)) - 0.006 * mouthHole(a, y); }
  else { const full = style === 'full'; arc = [-2.0, 2.0]; top = a => 1.5655 + 0.035 * smx(0.55, 1.7, a) - 0.003 * smx(0, 0.5, a); bot = a => 1.499 + 0.034 * smx(0.7, 1.9, a); th = (a, f, y) => (full ? 0.011 : 0.005) * (0.45 + 0.55 * smx(0, 0.5, f)) * (1 - smx(1.3, 2.0, a) * 0.85) * Math.sin(Math.PI * (0.06 + 0.9 * f)) + (full ? 0.004 : 0.0015) * smx(0.2, 0.7, f) * (1 - smx(0.0, 0.5, a)) - 0.0075 * mouthHole(a, y) - 0.0042 * (1 - smx(0.0, 0.22, f)) - 0.003 * smx(0.88, 1, f); }
  const P = new Float32Array(nc * nr * 3), pt = [0, 0, 0], nm = [0, 0, 0];
  for (let j = 0; j < nc; j++) { const phi = arc[0] + (arc[1] - arc[0]) * j / (nc - 1), a = Math.abs(phi), y0 = top(a), y1 = bot(a); for (let i = 0; i < nr; i++) { const f = i / (nr - 1), y = y0 + (y1 - y0) * f; headP(HS, y, phi, pt, true); headN(HS, y, phi, nm, true); const t = th(a, f, y), k = (i * nc + j) * 3; P[k] = pt[0] + nm[0] * t; P[k + 1] = pt[1] + nm[1] * t - (style === 'full' || style === 'goatee' ? 0.006 * smx(0.4, 1, f) * (1 - smx(0.5, 1.2, a)) : 0); P[k + 2] = pt[2] + nm[2] * t; } }
  const piece = gridPiece(P, nr, nc, { cell: 2, closed: false, dbl: false, uv: (i, j) => [0.1 + 0.8 * j / (nc - 1), 0.2 + 0.4 * i / (nr - 1)], k: v => 0.86 + 0.12 * hash2(v, 1, 2) });
  T = { P: piece.P, N: piece.N, UV: piece.UV, K: piece.K, M: piece.M, S: piece.S, SI: piece.SI, SW: piece.SW, idx: piece.idx, n: piece.n }; _beardTpl.set(key, T); return T;
}
function buildHair(look, HS, fem, skin) {
  const style = look.hairStyle || 'short', covered = !!(look.hat || look.cap || look.beanie || look.bandana || look.helmet), hairC = col(look.hair === undefined ? 0x2b2b2b : look.hair), lod = B.lod;
  if (look._side === undefined) look._side = Math.random() < 0.5 ? 1 : -1; const darkH = lumi(hairC) < 0.2; if (look._hl === undefined) look._hl = Math.random() < (darkH ? 0.6 : 0.3) ? mix(hairC, look.elder ? 0xffffff : 0xd8b078, darkH ? 0.42 : 0.26).getHex() : 0; // dark hair gets a warm sheen more often, so it catches the light
  const tintC = look._hl ? col(look._hl) : null; let st = style;
  if (covered && !['long', 'wavy', 'bob', 'pony', 'braids', 'locs', 'bald'].includes(st)) st = 'buzz'; // under a cap only the sides show
  if (!look.hoodUp && st !== 'bald') { const T = hairTemplate(look, HS, fem, st, lod); if (T.n) put(hairGeo(T, look, skin, hairC, tintC)); }
  const bs = look._beard; if (bs && bs !== 'stubble' && !fem) { const T = beardTemplate(HS, bs, lod); put(hairGeo(T, look, skin, mix(hairC, 0x000000, 0.08), null)); }
}

// =====================================================================================================================
// HEADWEAR, GLASSES AND THE HEAD ASSEMBLY (release 3, P2). Hats are shells over the same head surface as the hair (capPiece / brims / tubes), cut from cloth, felt, straw, knit or painted shell (fabric ids), cached per
// head spec and LOD like hair templates; a person only colours them. look fields: cap (+ capBack), beanie, hat (a peaked cap; a light coloured hat without a badge is a straw sun hat), helmet ('swat' | 'moto' | 'fire' |
// 'hard'), toque (chef), headband, bandana, band, hoodUp, headphones, glasses, sunglasses (+ frame), earrings.
// =====================================================================================================================
const _wearTpl = new Map();
function mergeTpl(pcs) {
  let nv = 0, ni = 0; for (const p of pcs) { nv += p.n; ni += p.idx.length; }
  const T = { P: new Float32Array(nv * 3), N: new Float32Array(nv * 3), UV: new Float32Array(nv * 2), K: new Float32Array(nv * 3), M: new Uint8Array(nv), S: new Float32Array(nv), SI: new Uint16Array(nv * 4), SW: new Float32Array(nv * 4), idx: new Uint16Array(ni), n: nv };
  let vo = 0, io = 0; for (const p of pcs) { T.P.set(p.P, vo * 3); T.N.set(p.N, vo * 3); T.UV.set(p.UV, vo * 2); T.K.set(p.K, vo * 3); T.M.set(p.M, vo); T.S.set(p.S, vo); T.SI.set(p.SI, vo * 4); T.SW.set(p.SW, vo * 4); for (let i = 0; i < p.idx.length; i++) T.idx[io + i] = p.idx[i] + vo; vo += p.n; io += p.idx.length; }
  return T;
}
const wearKey = (HS, lod, k) => k + '|' + (HS.fem ? 'f' : 'm') + (HS.build || '') + '|' + lod;
// a brim: a sheet leaving the shell edge outwards; centre = the direction (0 = front, pi = back), half = half angle, len(delta) = length, y(phi) = edge height, droop
function brimPiece(HS, o) {
  const nc = o.nc || 14, nr = 4, P = new Float32Array(nc * nr * 3), full = o.half >= Math.PI - 1e-3;
  for (let j = 0; j < nc; j++) {
    const d = full ? -Math.PI + TAU * j / nc : -o.half + 2 * o.half * j / (nc - 1), phi = o.centre + d, y = o.y(Math.abs(((phi + Math.PI) % TAU + TAU) % TAU - Math.PI), phi), L = o.len(d); headP(HS, y, phi, _hp, false); headN(HS, y, phi, _hn, false); const hx = _hn[0], hz = _hn[2], hl = Math.hypot(hx, hz) || 1;
    for (let i = 0; i < nr; i++) { const t = i / (nr - 1), k = (i * nc + j) * 3; P[k] = _hp[0] + _hn[0] * o.th + hx / hl * L * t; P[k + 1] = y + (o.up || 0) * t - (o.droop || 0.012) * t * t; P[k + 2] = _hp[2] + _hn[2] * o.th + hz / hl * L * t; }
  }
  return gridPiece(P, nr, nc, { cell: 0, fab: o.fab, closed: full, dbl: true, uv: () => [0.5, 0.5], k: o.k || (() => 0.9), rgb: o.rgb });
}
// a closed loop tube (glasses rims, hat bands)
function loopTube(cx, cy, cz, rx, ry, sq, n, r, o) {
  const pts = []; for (let i = 0; i <= n; i++) { const a = TAU * i / n, c = Math.cos(a), s = Math.sin(a); pts.push([cx + rx * Math.sign(c) * Math.pow(Math.abs(c), 2 / sq), cy + ry * Math.sign(s) * Math.pow(Math.abs(s), 2 / sq), cz]); }
  return tubePiece(pts, pts.map(() => r), o.seg || 4, { ...o });
}
const rim = (HS, lod) => lod < 2;
function headwearPieces(look, HS, fem, lod, kind) {
  const nc = HLOD_N.nc[lod], nr = HLOD_N.nr[lod], out = [], seam = (j) => 1;
  const cap = o => out.push(capPiece(HS, { nc, nr, cell: 0, ...o }));
  switch (kind) {
    case 'cap': { // baseball cap: six panels (darker seams), a button, a curved brim (turned round when worn backwards)
      const edge = a => 1.661 - 0.05 * smx(0.4, 3.1, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.0095 + 0.0075 * smx(0.1, 0.55, f) * (1 - 0.3 * smx(0.8, 1, f)), fab: FAB.twill, k: (i, j) => 1 - 0.18 * Math.exp(-Math.pow(((j / nc * 6 + 0.5) % 1 - 0.5) / 0.045, 2)) * smx(0.12, 0.3, i / (nr - 1)) });
      out.push(blobPiece(0, 1.7465 + 0.012, -0.005, 0.0085, 0.0045, 0.0085, [8, 5], { fab: FAB.twill, k: () => 0.8 }));
      out.push(brimPiece(HS, { centre: look.capBack ? Math.PI : 0, half: 1.18, len: d => 0.082 * Math.pow(Math.max(0, Math.cos(d * 1.3)), 0.8) + 0.006, y: (a) => edge(a) + 0.0, th: 0.0095, droop: 0.014, fab: FAB.twill, k: () => 0.84 }));
      if (look.capBack) out.push(brimPiece(HS, { centre: 0, half: 0.7, len: d => 0.01 * Math.cos(d * 2), y: (a) => edge(a), th: 0.0095, droop: 0.002, fab: FAB.twill, k: () => 0.8 })); // the strap opening
      break; }
    case 'beanie': { // knitted: ribbed band, pulled down over the ears at the back
      const edge = a => 1.646 - 0.034 * smx(0.7, 2.2, a) - 0.004 * smx(2.2, 3.1, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.0135 + 0.007 * smx(0.1, 0.5, f) + 0.004 * (1 - smx(0.0, 0.16, f)), fab: FAB.knit, k: (i, j) => (i / (nr - 1) < 0.18 ? 0.86 : 1) * (0.96 + 0.04 * Math.sin(j / nc * TAU * 24)) });
      if (lod < 2) out.push(blobPiece(0, 1.7465 + 0.01, -0.006, 0.014, 0.012, 0.014, [8, 5], { fab: FAB.knit, k: () => 1.05 })); break; }
    case 'hat': { // peaked cap (police, driver): a flared crown over a dark band, a flat top, a visor
      const edge = a => 1.659 - 0.03 * smx(0.5, 3.0, a);
      out.push(capPiece(HS, { nc, nr: Math.max(4, nr - 4), cell: 0, edge: a => edge(a), top: () => edge(0) + 0.02, th: () => 0.0165, fab: FAB.felt, k: () => 0.55 })); // the band
      cap({ edge: (a) => edge(a) + 0.02, top: () => 1.742, th: (a, f) => 0.0165 + 0.016 * smx(0, 0.35, f) - 0.004 * smx(0.8, 1, f), fab: FAB.twill, k: () => 1 });
      out.push(blobPiece(0, 1.742 + 0.004, -0.004, 0.066, 0.006, 0.073, lod ? [9, 4] : [14, 5], { fab: FAB.twill, k: () => 1 }));
      out.push(brimPiece(HS, { centre: 0, half: 1.0, len: d => 0.058 * Math.pow(Math.max(0, Math.cos(d * 1.5)), 0.6) + 0.004, y: () => edge(0) + 0.002, th: 0.0165, droop: 0.012, rgb: 0x08090c, k: () => 1, fab: FAB.rubber })); break; }
    case 'sunhat': { // straw: a crown and a wide drooping brim
      const edge = a => 1.668 - 0.012 * smx(0.5, 3.0, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.014 + 0.006 * smx(0, 0.4, f) + 0.0, fab: FAB.straw, k: () => 1 });
      out.push(brimPiece(HS, { centre: 0, half: Math.PI, nc: lod ? 18 : 30, len: () => 0.12, y: a => edge(a), th: 0.014, droop: 0.032, up: -0.0, fab: FAB.straw, k: () => 1 }));
      out.push(capPiece(HS, { nc, nr: 3, cell: 0, edge: a => edge(a) + 0.006, top: a => edge(a) + 0.03, th: () => 0.0205, rgb: 0xb23a48, fab: FAB.cord, k: () => 1 })); break; } // a hat band
    case 'hard': { // hard hat / construction helmet: a shell with a ridge and a short brim
      const edge = a => 1.650 - 0.03 * smx(0.9, 3.0, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.014 + 0.007 * smx(0.0, 0.4, f), fab: FAB.rubber, k: () => 1 });
      out.push(capPiece(HS, { nc: Math.max(8, nc >> 1), nr, cell: 0, arc: [-0.13, 0.13], edge: () => edge(0.3) + 0.01, top: () => 1.7455, th: (a, f) => 0.022 + 0.004 * Math.sin(f * 3), fab: FAB.rubber, k: () => 0.93 })); // the ridge (a strip over the crown)
      out.push(brimPiece(HS, { centre: 0, half: 1.05, len: d => 0.048 * Math.pow(Math.max(0, Math.cos(d * 1.4)), 0.7), y: () => edge(0), th: 0.0145, droop: 0.01, fab: FAB.rubber, k: () => 1 })); break; }
    case 'swat': { // tactical helmet: a deep shell down over the ears, a rail and a visor-less brow
      const edge = a => 1.645 - 0.025 * smx(0.4, 1.0, a) - 0.05 * smx(1.0, 1.8, a) - 0.03 * smx(2.0, 3.1, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.0185 + 0.007 * smx(0.0, 0.4, f), fab: FAB.nylon, k: () => 1 });
      if (lod < 2) { out.push(brimPiece(HS, { centre: 0, half: 0.8, len: d => 0.014 * Math.cos(d * 1.9), y: () => edge(0) + 0.002, th: 0.0185, droop: 0.002, fab: FAB.rubber, k: () => 0.55, rgb: 0x0a0b0d })); out.push(blobPiece(0, edge(0) + 0.028, 0.115, 0.014, 0.011, 0.01, [7, 5], { rgb: 0x1a1d22, fab: FAB.metal, k: () => 1 })); } break; }
    case 'moto': { // courier / scooter helmet: a glossy shell, an open face with a visor
      const edge = a => 1.650 - 0.035 * smx(0.8, 1.8, a) - 0.05 * smx(1.8, 3.1, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.0215 + 0.008 * smx(0.0, 0.35, f) * (1 - 0.3 * smx(0.9, 1, f)), fab: FAB.glass, k: () => 1 });
      out.push(brimPiece(HS, { centre: 0, half: 1.05, len: d => 0.04 * Math.pow(Math.max(0, Math.cos(d * 1.4)), 0.7), y: () => edge(0) - 0.002, th: 0.0215, droop: 0.02, rgb: 0x0c0d10, fab: FAB.glass, k: () => 1 })); break; }
    case 'fire': { // fire helmet: a high crown with a comb, a long neck brim at the back
      const edge = a => 1.652 - 0.02 * smx(0.6, 3.0, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.0165 + 0.009 * smx(0.0, 0.4, f), fab: FAB.rubber, k: () => 1 });
      out.push(capPiece(HS, { nc: Math.max(8, nc >> 1), nr, cell: 0, arc: [-0.12, 0.12], edge: () => 1.675, top: () => 1.7455, th: (a, f) => 0.03 + 0.006 * f, fab: FAB.rubber, k: () => 0.9 }));
      out.push(brimPiece(HS, { centre: Math.PI, half: 1.6, len: d => 0.085 * Math.pow(Math.max(0, Math.cos(d * 0.98)), 0.8) + 0.012, y: () => edge(3) - 0.0, th: 0.016, droop: 0.02, up: -0.01, fab: FAB.rubber, k: () => 0.92 }));
      out.push(brimPiece(HS, { centre: 0, half: 1.1, len: d => 0.035 * Math.pow(Math.max(0, Math.cos(d * 1.4)), 0.7), y: () => edge(0), th: 0.0165, droop: 0.006, fab: FAB.rubber, k: () => 0.95 })); break; }
    case 'toque': { // chef's hat: a band and a tall pleated puff
      const edge = a => 1.668 - 0.012 * smx(0.5, 3.0, a);
      cap({ edge: (a) => edge(a), top: () => edge(0) + 0.045, th: () => 0.0105, fab: FAB.poplin, k: () => 0.96 });
      out.push(blobPiece(0, 1.775, -0.004, 0.078, 0.052, 0.082, lod ? [10, 6] : [16, 9], { fab: FAB.poplin, k: (v) => 0.94 + 0.06 * Math.sin(v * 0.9) })); break; }
    case 'headband': { // athletic band, a sweatband round the forehead
      const edge = a => 1.662 - 0.02 * smx(0.5, 3.0, a);
      out.push(capPiece(HS, { nc, nr: 3, cell: 0, edge: a => edge(a), top: a => edge(a) + 0.026, th: () => 0.0075, fab: FAB.spandex, k: () => 1 })); break; }
    case 'bandana': { // head wrap with a knot at the back
      const edge = a => 1.657 - 0.04 * smx(0.7, 3.0, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.0055 + 0.0035 * smx(0, 0.4, f), fab: FAB.poplin, k: (i, j) => 0.92 + 0.08 * Math.sin(j * 0.9 + i)});
      if (lod < 2) { out.push(blobPiece(0, 1.665, -0.113, 0.02, 0.016, 0.018, [7, 5], { fab: FAB.poplin, k: () => 0.85 })); for (const s of [1, -1]) out.push(lockPiece(HS, Math.PI + s * 0.12, 1.652, s * 0.012, -0.04, -0.018, 0.012, 0.012, { cell: 0, lift: 0.004 })); } break; }
    case 'hood': { // a hood pulled over the head: deep, open at the face, resting on the shoulders at the back
      const edge = a => 1.658 - 0.1 * smx(0.7, 1.5, a) - 0.1 * smx(1.5, 2.6, a);
      cap({ edge: (a) => edge(a), th: (a, f) => 0.026 + 0.012 * smx(0, 0.4, f) + 0.02 * smx(1.5, 2.8, a) * (1 - f), fab: FAB.fleece, k: (i, j) => 1 - 0.12 * (1 - smx(0, 0.15, i / (nr - 1))), dbl: false }); break; }
    case 'headphones': { // band over the crown and two cups
      const pts = []; for (let i = 0; i <= 12; i++) { const t = -1.45 + 2.9 * i / 12, th = Math.PI / 2 - Math.abs(t) * 0; headP(HS, 1.62 + 0.125 * Math.cos(t), 0, _hp, false); const x = Math.sin(t) * 0.0975, y = 1.62 + Math.cos(t) * 0.135 - 0.01, z = -0.004; pts.push([x, y, z]); }
      out.push(tubePiece(pts, pts.map(() => 0.0078), 5, { cell: 0, fab: FAB.rubber })); for (const s of [1, -1]) { out.push(blobPiece(s * 0.096, 1.616, -0.006, 0.019, 0.037, 0.034, lod ? [7, 5] : [10, 7], { fab: FAB.rubber, k: () => 1 })); out.push(blobPiece(s * 0.103, 1.616, -0.006, 0.009, 0.029, 0.026, [8, 5], { fab: FAB.felt, k: () => 0.8 })); } break; }
  }
  return out;
}
function wearGeo(look, HS, kind, colour, lod, extra) {
  const key = wearKey(HS, lod, kind + (extra || '') + (look.capBack ? 'b' : '')); let T = _wearTpl.get(key); if (!T) { T = mergeTpl(headwearPieces(look, HS, HS.fem, lod, kind)); _wearTpl.set(key, T); }
  return hairGeo(T, look, null, col(colour), null);
}
function buildHeadwear(look, HS, fem) {
  const lod = B.lod, hat = look.hat; if (look.hoodUp) put(wearGeo(look, HS, 'hood', look.shirt, lod));
  if (look.cap) put(wearGeo(look, HS, 'cap', look.cap, lod));
  if (look.beanie) put(wearGeo(look, HS, 'beanie', look.beanie, lod));
  if (look.helmet) put(wearGeo(look, HS, look.helmet, look.helmetColour === undefined ? 0xdddddd : look.helmetColour, lod));
  else if (hat && look.armor) put(wearGeo(look, HS, 'swat', hat, lod));
  else if (hat) { const hc = col(hat); if (lumi(hc) > 0.5 && !look.badge) put(wearGeo(look, HS, 'sunhat', hat, lod)); else { put(wearGeo(look, HS, 'hat', hat, lod)); if (look.badge && lod < 2) { const z = headZ(HS, 0, 1.69, false) + 0.0; put(box0(0, 1.683, 0.098, 0.016, 0.016, 0.006, 0xffd34e, 0.25)); } } }
  if (look.toque) put(wearGeo(look, HS, 'toque', look.toque, lod));
  if (look.headband) put(wearGeo(look, HS, 'headband', look.headband, lod));
  if (look.bandana) put(wearGeo(look, HS, 'bandana', look.bandana, lod));
  if (look.band) put(wearGeo(look, HS, 'headband', look.band, lod, 'x'));
  if (look.headphones) put(wearGeo(look, HS, 'headphones', look.headphones, lod));
}
// a small emitted box on the head (badge)
function box0(x, y, z, w, h, d, c, rx) { const g = emit(uBox(), xf(x, y, z, rx || 0, 0, 0, w, h, d), c, HEAD, { fab: FAB.metal }); return g; }
// glasses and sunglasses: rims as tubes (round, rectangular or aviator), lenses, bridge, temples
function buildGlasses(look, HS) {
  const sun = !!look.sunglasses, shape = Math.floor((look._nose ? look._nose[2] : 0.5) * 3) % 3, fc = look.frame === undefined ? (sun ? 0x0d0e11 : 0x15171b) : look.frame, lod = B.lod;
  const rx = [0.0205, 0.0245, 0.0255][shape], ry = [0.0195, 0.0155, 0.0215][shape], sq = [2.1, 3.6, 2.5][shape], cy = LMK.eye - 0.0005 - (shape === 2 ? 0.0015 : 0), pieces = [];
  for (const s of [1, -1]) {
    const cx = s * LMK.eyeX, z = headZ(HS, cx, cy, true) + 0.0148;
    if (lod < 2 || sun) pieces.push(loopTube(cx, cy, z, rx, ry, sq, lod ? 12 : 20, sun ? 0.0013 : 0.0011, { seg: 4, rgb: fc, fab: FAB.metal, k: 1 }));
    if (sun) pieces.push(blobPiece(cx, cy, z - 0.0006, rx * 0.97, ry * 0.97, 0.0016, lod ? [8, 4] : [16, 5], { rgb: 0x0b0d12, fab: FAB.glass, k: () => 1 })); // dark lenses; clear glasses have no lens (the eyes stay visible)
    if (lod < 2) { const zt = headZ(HS, s * 0.0795, cy + 0.002, false); pieces.push(tubePiece([[s * (Math.abs(cx) + rx), cy + 0.003, z - 0.002], [s * 0.0765, cy + 0.003, z - 0.012], [s * 0.0835, cy + 0.0035, Math.max(zt - 0.008, 0.012)], [s * 0.0845, cy + 0.0005, -0.012], [s * 0.0845, cy - 0.012, -0.018]], [0.0011, 0.0011, 0.0011, 0.0011, 0.0013], 4, { rgb: fc, fab: FAB.metal, k: 1 })); }
  }
  if (lod < 2) pieces.push(tubePiece([[-(LMK.eyeX - rx + 0.001), cy + ry * 0.35, headZ(HS, 0.0125, cy, true) + 0.0148], [0, cy + ry * 0.55, headZ(HS, 0.0, cy + 0.006, true) + 0.0175], [LMK.eyeX - rx + 0.001, cy + ry * 0.35, headZ(HS, 0.0125, cy, true) + 0.0148]], [0.0012, 0.0012, 0.0012], 4, { rgb: fc, fab: FAB.metal, k: 1 }));
  if (pieces.length) put(hairGeo(mergeTpl(pieces), look, null, col(0xffffff), null));
}
function buildEarrings(look, HS, fem) {
  if (!look.earrings) return; const c = col(look.earrings), pcs = [];
  for (const s of [1, -1]) { const x = s * (hk(HS.tab, 1.6)[0] + 0.004), ring = look.earrings === 0xe8e8ee ? 0 : 1; if (B.lod < 2) pcs.push(blobPiece(x + s * 0.0012, 1.5885, -0.0105, 0.0042, 0.0042, 0.0042, [6, 4], { rgb: c.getHex(), fab: FAB.metal, k: () => 1 })); if (B.lod === 0) pcs.push(tubePiece([[x + s * 0.0012, 1.585, -0.0105], [x + s * 0.0012, 1.5775, -0.0105], [x + s * 0.0012, 1.570, -0.0105]], [0.0016, 0.0022, 0.0034], 5, { rgb: c.getHex(), fab: FAB.metal, k: 1 })); }
  if (pcs.length) put(hairGeo(mergeTpl(pcs), look, null, col(0xffffff), null));
}
function buildHead(look, fem) {
  facePlan(look, fem); const HS = buildHeadBase(look, fem), skin = col(look.skin);
  buildHair(look, HS, fem, skin); buildHeadwear(look, HS, fem);
  if (look.glasses || look.sunglasses) buildGlasses(look, HS); buildEarrings(look, HS, fem);
}

// ---------- clothes ----------
// What a look actually wears: the new garment fields where given, otherwise worked out from the old ones (jacket, tie, armor, skirt, shorts, hat ...).
const LAYERED_TOPS = ['jacket', 'blazer', 'leather', 'puffer', 'labcoat', 'chefcoat', 'turnout', 'paramedic'];
const TOP_FAB = { tee: 'jersey', polo: 'pique', longsleeve: 'jersey', tank: 'jersey', hoodie: 'fleece', shirt: 'poplin', sweater: 'knit', jacket: 'nylon', leather: 'leather', puffer: 'nylon', blazer: 'wool', labcoat: 'twill', chefcoat: 'poplin', turnout: 'canvas', paramedic: 'nylon', overalls: 'canvas', scrubs: 'poplin', dress: 'jersey', bare: 'jersey' };
const BOTTOM_FAB = { jeans: 'denim', chinos: 'twill', shorts: 'twill', skirt: 'poplin', sweatpants: 'fleece', trunks: 'spandex', cargo: 'canvas', leggings: 'spandex', suit: 'wool', pencil: 'wool', work: 'canvas' };
function garments(look) {
  const hasJ = look.jacket !== undefined && look.jacket !== null;
  let top = look.top; if (!TOPS.includes(top)) top = look.skirt ? 'dress' : hasJ ? (look.tie ? 'blazer' : 'jacket') : look.armor || look.sleeves === 'long' ? 'longsleeve' : 'tee';
  let bottom = look.bottom; if (!BOTTOMS.includes(bottom)) bottom = look.skirt ? 'skirt' : look.shorts ? 'shorts' : 'jeans';
  if (top === 'dress') bottom = 'skirt';
  const layered = LAYERED_TOPS.includes(top), skirtOn = bottom === 'skirt' || bottom === 'pencil', skirtC = skirtOn ? (look.skirt !== undefined && look.skirt !== null ? look.skirt : top === 'dress' ? look.shirt : look.pants) : null;
  const tf = k => FAB[k] || 0, topFab = look.plaid && (top === 'shirt' || top === 'overalls') ? 'plaid' : look.satin && top === 'dress' ? 'satin' : look.pinstripe && top === 'blazer' ? 'pinstripe' : TOP_FAB[top];
  const botFab = look.pinstripe && bottom === 'suit' ? 'pinstripe' : bottom === 'shorts' && look.denim ? 'denim' : bottom === 'skirt' && look.satin ? 'satin' : BOTTOM_FAB[bottom];
  return { top, bottom, layered, outer: layered ? (hasJ ? look.jacket : look.shirt) : null, inner: layered ? (look.inner !== undefined ? look.inner : hasJ ? look.shirt : 0xe8e0d0) : 0xe8e0d0, skirtC,
    fab: { top: tf(topFab), bottom: tf(botFab), inner: tf(top === 'blazer' ? 'poplin' : 'jersey') },
    sleeves: layered || ['longsleeve', 'hoodie', 'sweater', 'overalls'].includes(top) || look.armor ? 'long' : top === 'tank' || top === 'bare' ? 'none' : look.sleeves === 'long' ? 'long' : look.sleeves === 'rolled' ? 'rolled' : 'short',
    shoeType: SHOE_TYPES.includes(look.shoeType) ? look.shoeType : layered && top === 'blazer' ? 'dress' : 'sneakers', shoeC: SHOE_TYPES.includes(look.shoeType) || top !== 'blazer' ? null : 0x15110e, belly: look.build === 'heavy' }; // a suit gets dress shoes
}

// A garment shell: the body ring surface mk(y, offset) swept over the heights ys and offset by `off` metres (+ drape(y)), with the body's own skin weights, so cloth follows the skin through every bend.
//   o: lip 'a' | 'b' | 'ab' (rolled edge at the first / last ring), drape(y), k(y) brightness, arcFn(y) -> [start, sweep] for open shells (front openings, straps, bands), capLo / capHi, flip (inside of a skirt),
//      sh (vertical gradient), vs (shading callback), noise (fabric mottling), skin (per-vertex weights)
function shell(mk, ys, seg, off, c, o) {
  o = o || {}; const rings = [], n = ys.length, dir = ys[n - 1] > ys[0] ? 1 : -1, lip = o.lip || '', ex = y => off + (o.drape ? o.drape(y) : 0);
  const mkr = (y, e) => { const R = mk(y, e); if (o.k) R.k = o.k(y); if (o.arcFn) { const a = o.arcFn(y); R.a0 = a[0]; R.asw = a[1]; } return R; };
  if (lip.includes('a')) rings.push(mkr(ys[0] + dir * 0.004, ex(ys[0]) - 0.0045));
  for (let i = 0; i < n; i++) rings.push(mkr(ys[i], ex(ys[i])));
  if (lip.includes('b')) rings.push(mkr(ys[n - 1] - dir * 0.004, ex(ys[n - 1]) - 0.0045));
  put(toGeo(loft(rings, seg, { col: col(c), open: !!o.arcFn, capLo: o.capLo, capHi: o.capHi, flip: o.flip, sh: o.sh, vs: o.vs, skin: o.skin, fab: o.fab, tint: o.tint, noise: o.noise === undefined ? 0.02 : o.noise })));
}
const shellTorso = (y0, y1, off, c, o) => { const S = B.S; shell((y, e) => torsoRing(S, y, e), stn(y0, y1, o && o.step && B.lod < 2 ? o.step : LD.tstep[B.lod], TORSO_JOINTS), LD.tseg[B.lod], off, c, y0 < 0.9 && !(o && o.skin) ? Object.assign({ skin: pelvisSkin }, o) : o); };
const shellArm = (s, y0, y1, off, c, o) => { const S = B.S; shell((y, e) => armRing(S, s, y, e), stn(y0, y1, o && o.step && B.lod < 2 ? o.step : LD.lstep[B.lod], ARM_JOINTS), LD.lseg[B.lod], off, c, o); };
const shellLeg = (s, y0, y1, off, c, o) => { const S = B.S; shell((y, e) => legRing(S, s, y, e), stn(y0, y1, o && o.step && B.lod < 2 ? o.step : LD.lstep[B.lod], LEG_JOINTS), LD.lseg[B.lod], off, c, o); };
const halfW = (y, off) => hk(B.S.tk, y)[0] + off; // half width of the trunk at height y (clothing surface)
// arc of a trunk ring that covers x in [x0 - w, x0 + w] on the front (back = false) or back of the +x (s = 1) or -x (s = -1) side: shoulder straps
function strapArc(s, x0, w, back) {
  return y => { const ra = Math.max(halfW(y, LAYER.top), x0 + 0.001), a0 = Math.acos(clamp((x0 + w) / ra, 0, 1)), a1 = Math.acos(clamp((x0 - w) / ra, 0, 1)), sw = Math.max(0.05, a1 - a0);
    return s > 0 ? [back ? -(a0 + sw) : a0, sw] : [back ? Math.PI + a0 : Math.PI - (a0 + sw), sw]; };
}

// ---------- shoes ----------
// A last: rings along z (heel to toe) in the foot frame; every shoe is built on the same planform so the sole stays flat on the ground from z = -0.07 to 0.25 (the toe cap reaches 0.262).
const SHOE_Z0 = -0.075, SHOE_Z1 = 0.262;
const SHOE = {
  sneakers: { sole: 0.028, hw: 0.056, plan: [[0, 0], [0.025, 0.55], [0.07, 0.72], [0.18, 0.8], [0.38, 0.86], [0.58, 0.98], [0.74, 1], [0.88, 0.9], [0.96, 0.66], [1, 0.3]], tops: [[-0.075, 0.07], [-0.055, 0.105], [-0.03, 0.118], [0, 0.116], [0.035, 0.106], [0.075, 0.088], [0.12, 0.078], [0.17, 0.068], [0.22, 0.054], [0.262, 0.034]] },
  boots: { sole: 0.034, hw: 0.058, plan: [[0, 0], [0.025, 0.55], [0.07, 0.72], [0.18, 0.8], [0.38, 0.86], [0.58, 0.98], [0.74, 1], [0.88, 0.9], [0.96, 0.66], [1, 0.3]], tops: [[-0.075, 0.08], [-0.05, 0.13], [-0.025, 0.15], [0.01, 0.14], [0.05, 0.115], [0.09, 0.092], [0.14, 0.082], [0.19, 0.072], [0.23, 0.056], [0.262, 0.04]] },
  dress: { sole: 0.02, hw: 0.049, plan: [[0, 0], [0.025, 0.55], [0.07, 0.72], [0.18, 0.78], [0.38, 0.84], [0.58, 0.94], [0.74, 0.9], [0.88, 0.72], [0.96, 0.45], [1, 0.2]], tops: [[-0.075, 0.06], [-0.05, 0.085], [-0.025, 0.095], [0.01, 0.092], [0.05, 0.08], [0.09, 0.07], [0.14, 0.062], [0.19, 0.05], [0.23, 0.038], [0.262, 0.026]] },
  heels: { sole: 0.014, hw: 0.05, plan: [[0, 0], [0.025, 0.5], [0.07, 0.66], [0.18, 0.72], [0.38, 0.78], [0.58, 0.9], [0.74, 0.88], [0.88, 0.7], [0.96, 0.42], [1, 0.16]], tops: [[-0.075, 0.045], [-0.045, 0.075], [-0.01, 0.085], [0.04, 0.075], [0.09, 0.058], [0.14, 0.046], [0.19, 0.036], [0.235, 0.027], [0.262, 0.018]] },
  sandals: { sole: 0.014, hw: 0.055, plan: [[0, 0], [0.025, 0.55], [0.07, 0.72], [0.18, 0.8], [0.38, 0.86], [0.58, 0.98], [0.74, 1], [0.88, 0.9], [0.96, 0.66], [1, 0.3]], tops: [[-0.075, 0.045], [-0.045, 0.075], [-0.01, 0.085], [0.04, 0.075], [0.09, 0.058], [0.14, 0.046], [0.19, 0.036], [0.235, 0.027], [0.262, 0.018]] },
};
const FOOT_U = [[0.012, 0.04, 0.09, 0.15, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.85, 0.91, 0.96, 0.995], [0.012, 0.07, 0.18, 0.34, 0.5, 0.66, 0.8, 0.9, 0.97, 0.995], [0.012, 0.15, 0.4, 0.62, 0.82, 0.95, 0.995]];
// rings of a last: yBot / top(z) give the vertical extent, grow the extra radius (toe cap, sole)
function lastRings(P, s, x, ft, yBot, topFn, grow, u0, u1, sqv, hwMul) {
  const w = [[ft, 0, 0, 0], [1, 0, 0, 0]], rings = [], list = FOOT_U[B.lod], hw = P.hw * (hwMul || 1);
  for (const u of list) {
    if (u < u0 || u > u1) continue;
    const z = SHOE_Z0 + (SHOE_Z1 - SHOE_Z0) * u, f = lin(P.plan, u), top = topFn(z), hy = Math.max(0.004, (top - yBot) / 2 + grow);
    rings.push({ c: [x, yBot + (top - yBot) / 2, z], a: X_AX, b: Y_AX, ra: hw * f + grow, rm: hy, rd: 0, sq: sqv, sb: w[0], sw: w[1] });
  }
  return rings;
}
function buildShoes(look, gm, fem, shoes) {
  const S = B.S, hi = B.hi, fine = B.fine, type = gm.shoeType, P = SHOE[type], skin = col(look.skin), info = skinInfo(look.skin, look._tone);
  const soleC = type === 'sneakers' ? col(0xf2f2f2) : type === 'boots' ? col(0x2a2420) : type === 'dress' ? col(0x15110e) : shade(shoes, 0.6), hwMul = fem ? 0.92 : 1;
  const topFn = z => hk(P.tops, z)[0], seg = B.lod === 0 ? 16 : B.lod === 1 ? 12 : 8;
  for (const s of [1, -1]) {
    const x = s * S.legX, ft = s > 0 ? FT_L : FT_R, sole = P.sole;
    // sole (outsole + midsole), closed at both ends
    put(toGeo(loft(lastRings(P, s, x, ft, 0.003, () => sole, 0.003, 0, 1, 4, hwMul), seg, { col: soleC, capLo: true, capHi: true, fab: FAB.rubber }))); // the sole's underside is exactly y = 0
    if (type === 'boots' || type === 'dress') { // a heel block under the rear of the foot
      const hr = lastRings(P, s, x, ft, 0.002, z => sole + (type === 'boots' ? 0.02 : 0.016) * (1 - smx(-0.075, 0.05, z)), 0.002, 0, 0.22, 4, hwMul); if (hr.length > 2) put(toGeo(loft(hr, seg, { col: shade(soleC, 0.85), capLo: true, capHi: true, fab: FAB.rubber })));
    }
    if (type === 'sandals' || type === 'heels') { // a bare foot on a thin sole, two straps over the instep (heels: a wedge under the heel, a toe loop and an ankle strap)
      if (type === 'heels') { const hb = lastRings(P, s, x, ft, 0.002, z => sole + 0.03 * (1 - smx(-0.075, 0.075, z)), 0.002, 0, 0.55, 4, hwMul); if (hb.length > 2) put(toGeo(loft(hb, seg, { col: shoes, capLo: true, capHi: true, fab: FAB.leather }))); ring(ft, 0.039, 0.039, 0.0034, x, 0.082, -0.002, shoes, ZERO3, { fab: FAB.leather }); }
      const fr = lastRings(P, s, x, ft, sole - 0.002, topFn, 0, 0, 1, 2.6, hwMul * 0.95), tone = toneFor('foot', S, s);
      put(skinGeo(loft(fr, seg, { tone, capLo: true, capHi: true }), info));
      if (fine) for (let i = 0; i < 5; i++) ball(ft, i ? 0.0092 - i * 0.0004 : 0.0125, x - s * 0.024 + s * i * 0.0205, sole + 0.011, 0.243 - i * 0.004, skin, { seg: [6, 4] });
      for (const [z, w] of type === 'heels' ? [[0.035, 0.016], [0.135, 0.018], [0.2, 0.012]] : [[0.035, 0.03], [0.125, 0.026]]) box(ft, hwMul * 0.112, 0.012, w, x, topFn(z) + sole * 0.2, z, shoes, { fab: FAB.leather });
      continue;
    }
    // upper, toe cap, heel counter
    const up = lastRings(P, s, x, ft, sole - 0.002, topFn, 0, 0, 1, 3, hwMul);
    put(toGeo(loft(up, seg, { col: shoes, capLo: true, capHi: true, sh: [sole, 0.14, 0.78, 1], noise: 0.025, fab: type === 'sneakers' ? FAB.canvas : FAB.leather })));
    const tc = type === 'sneakers' ? col(0xf4f4f4) : shade(shoes, type === 'dress' ? 1.35 : 0.78);
    const cap = lastRings(P, s, x, ft, sole - 0.002, topFn, 0.0022, 0.8, 1, 3, hwMul); if (cap.length > 2) put(toGeo(loft(cap, seg, { col: tc, capHi: true })));
    if (hi) { const hc = lastRings(P, s, x, ft, sole - 0.002, topFn, 0.0022, 0, 0.16, 3, hwMul); if (hc.length > 2) put(toGeo(loft(hc, seg, { col: shade(shoes, type === 'sneakers' ? 0.82 : 0.7), capLo: true }))); }
    ring(ft, 0.047 * (fem ? 0.9 : 1), 0.049 * (fem ? 0.9 : 1), 0.0105, x, topFn(0) - 0.006, 0.0, shade(shoes, type === 'sneakers' ? 0.78 : 0.9), ZERO3);
    if (type === 'sneakers' && fine) { box(ft, 0.04, 0.006, 0.07, x, topFn(0.06) + 0.003, 0.085, shade(shoes, 1.2)); for (const z of [0.05, 0.08, 0.11, 0.14]) box(ft, hwMul * 0.05, 0.004, 0.008, x, topFn(z) + 0.006, z, 0xf2f2f2); } // tongue and lace bars
    if (type === 'boots') shellLeg(s, 0.05, 0.255, LAYER.under + 0.003, shoes, { lip: 'b', noise: 0.025, fab: FAB.leather }); // shaft (under the trouser leg, which hangs over it)
  }
}

// ---------- the person ----------
// skin weights for cloth that hangs from the hips (coats, aprons): above y = 1.03 the ring's own weights, below it up to 62 % of the weight moves to the thigh on the vertex's side, so the cloth swings with the legs
function thighSkin(x, y, z, si, sw, k) {
  if (y >= 1.03) return; const t = clamp((1.03 - y) / 0.4, 0, 1), s = clamp(x / 0.3, -1, 1), wl = t * 0.62 * (0.5 + 0.5 * s), wr = t * 0.62 * (0.5 - 0.5 * s);
  sw[k] *= 1 - wl - wr; sw[k + 1] *= 1 - wl - wr; si[k + 2] = TH_L; sw[k + 2] = wl; si[k + 3] = TH_R; sw[k + 3] = wr;
}
// The wardrobe (release 3, P2). Every garment is a shell over the body surface (see "layering" below) cut from a FABRIC (FAB.*): hems and cuffs are rolled lips or narrow darker bands, collars, plackets, pockets, buttons and zips are
// small boxes / bars / bands on the cloth, loose clothes drape with ripples (bunching at the waist and elbow, stacking at the ankle), a puffer jacket has quilted baffles.
//   tops     tee polo longsleeve tank hoodie shirt sweater scrubs overalls dress bare | layered (an outer garment over an inner shirt): jacket blazer leather puffer labcoat chefcoat turnout paramedic
//   bottoms  jeans chinos shorts skirt pencil sweatpants trunks cargo leggings suit work
//   extras   apron, hivis (vest colour), armor (+ vestStripe), reflect (band colour), dutyBelt, radio, lanyard, stethoscope, scarf, bag, bracelet, necklace, chain, watch, backpack (+ box for a delivery box), belt, tie, badge, stripe
function buildBody(look, fem, gm) {
  const S = B.S, hi = B.hi, fine = B.fine, info = skinInfo(look.skin, look._tone);
  const skin = col(look.skin), shirt = col(look.shirt), pants = col(look.pants), vest = look.armor ? col(look.armor) : null;
  const { top, bottom } = gm, layered = gm.layered, outer = layered ? col(gm.outer) : null, sl = gm.sleeves, TL = LAYER.top, OL = LAYER.outer, BL = LAYER.bottom, ARM = LAYER.armor, F = gm.fab;
  const sleeveC = layered ? outer : shirt, lowerC = gm.skirtC !== null ? col(gm.skirtC) : pants, shoes = col(gm.shoeC !== null ? gm.shoeC : look.shoes === undefined ? 0x1a1a1a : look.shoes);
  const NY = 1.49; // top of the neckline
  const mat = (c, k) => shade(c, k);
  // LAYERING: skin (0) -> trousers / skirt (BL 10 mm) -> shirt (TL 18 mm) -> jacket (OL 28 mm) -> armour (ARM 40 mm). Every layer is the skin surface offset by its own amount, so layers never touch and a joint can bend
  // without skin showing through cloth; each layer is thicker than the one below by more than the depth resolution needs.
  for (const l of bodyPieces(S, B.lod)) put(skinGeo(l, info, look.freckles));
  // ----- trousers, shorts, skirt -----
  const jeans = bottom === 'jeans', cargo = bottom === 'cargo' || bottom === 'work', legg = bottom === 'leggings', suitB = bottom === 'suit', longLegs = jeans || cargo || legg || suitB || bottom === 'chinos' || bottom === 'sweatpants';
  const fold = (y) => 0.0034 * (0.5 + 0.5 * Math.sin(y * 52)) * smx(0.34, 0.1, y) + 0.0022 * gaus(y, 0.5, 0.05); // trousers bunch above the shoe and crease at the knee
  const legX = (s, y, off) => s * S.legX + s * (hk(S.lk, y)[0] + off), legZ = y => hk(S.lk, y)[2];
  if (gm.skirtC === null) {
    const wearK = jeans || cargo ? (x, y, z, nx, ny, nz) => 1 + (nz > 0.2 ? 0.035 * gaus(y, 0.55, 0.14) + 0.03 * gaus(y, 0.22, 0.12) + 0.03 * gaus(y, 0.88, 0.05) : 0) - 0.05 * smx(0.2, 0.08, y) - 0.06 * gaus(y, 0.5, 0.045) * (nz < -0.2 ? 1 : 0) : null;
    shellTorso(bottom === 'trunks' ? 0.745 : 0.70, 1.045, BL + (legg ? -0.004 : 0.002), lowerC, { lip: 'b', capLo: true, sh: [0.74, 1.04, 0.95, 1], fab: F.bottom });
    for (const s of [1, -1]) {
      const yEnd = longLegs ? 0.083 : bottom === 'shorts' ? 0.53 : 0.75, loose = bottom === 'sweatpants' ? 0.008 : cargo ? 0.007 : jeans ? 0.0025 : suitB ? 0.004 : 0, ob = legg ? BL - 0.005 : BL;
      shellLeg(s, 0.97, yEnd, ob, lowerC, { lip: 'b', vs: wearK, drape: y => loose * (1 - smx(0.9, 0.55, y)) + (jeans ? 0.004 * smx(0.4, 0.1, y) : 0) + (bottom === 'shorts' ? 0.012 * smx(0.7, 0.53, y) : 0) + (longLegs && !legg ? fold(y) * (bottom === 'sweatpants' ? 1.4 : 1) : 0), sh: [0.06, 1.0, 0.92, 1], fab: F.bottom });
      if (bottom === 'sweatpants') shellLeg(s, 0.145, 0.083, BL + 0.011, mat(pants, 0.72), { lip: 'ab', fab: FAB.knit }); // ribbed cuff
      if (suitB) { shellLeg(s, 0.95, 0.11, BL + 0.0025, mat(pants, 1.22), { lip: 'ab', arcFn: () => [HALF_PI - 0.035, 0.07], noise: 0, fab: F.bottom }); shellLeg(s, 0.12, 0.083, BL + 0.004, mat(pants, 0.82), { lip: 'ab', noise: 0, fab: F.bottom }); } // crease and turn-up
      if (legg) shellLeg(s, 0.93, 0.1, ob + 0.002, mat(pants, 0.78), { lip: 'ab', arcFn: () => s > 0 ? [-0.06, 0.12] : [Math.PI - 0.06, 0.12], noise: 0, fab: FAB.spandex }); // side seam
      if (cargo && fine) { // thigh pockets with flaps, a knee-high bellows
        const cz = legZ(0.72), px = legX(s, 0.72, BL + 0.011); const th = s > 0 ? TH_L : TH_R;
        box(th, 0.024, 0.125, 0.092, px, 0.70, cz, mat(pants, 0.94), { fab: F.bottom }); box(th, 0.027, 0.034, 0.096, px + s * 0.001, 0.775, cz, mat(pants, 0.86), { fab: F.bottom }); box(th, 0.006, 0.012, 0.012, px + s * 0.012, 0.76, cz + 0.02, 0x9a9ca2, { fab: FAB.metal });
      }
      if ((jeans || bottom === 'chinos' || suitB) && fine) { // back pockets with a stitch line
        const bz = backZ(S, 0.9, BL) - 0.003; box(HIPS, 0.074, 0.08, 0.005, s * 0.073, 0.905, bz, mat(pants, jeans ? 0.9 : 0.85), { fab: F.bottom }); if (jeans) box(HIPS, 0.07, 0.003, 0.0052, s * 0.073, 0.89, bz - 0.0006, 0xd8b45a, { fab: FAB.metal }); // contrast stitching
      }
    }
    if (jeans && fine) for (const s of [1, -1]) { const th = s > 0 ? TH_L : TH_R, z = frontZ(S, 0.965, BL, s * 0.09); box(HIPS, 0.04, 0.003, 0.008, s * 0.09, 0.965, z + 0.002, 0xcfc9b8, { rot: [0, 0, s * 0.6], fab: FAB.metal }); } // the coin pocket's rivets
    if (top === 'tank' || top === 'bare' || look.belt) { // the belt or waistband shows under a short top
      if (bottom === 'sweatpants') shellTorso(1.0, 1.046, BL + 0.004, mat(pants, 0.8), { lip: 'ab', fab: FAB.knit });
      else if (bottom !== 'trunks' && !legg) { shellTorso(0.995, 1.04, BL + 0.004, col(look.belt === undefined || look.belt === true ? 0x15171a : look.belt), { lip: 'ab', fab: FAB.leather }); box(SPINE, 0.034, 0.03, 0.01, 0, 1.018, frontZ(S, 1.018, BL + 0.004, 0) + 0.003, 0xc9ccd2, { fab: FAB.metal }); }
    }
  } else { // flared skirt / dress hem, a pencil skirt, a mini; its lower vertices follow the thighs (the whole flare lies outside the thigh volume)
    const pencil = bottom === 'pencil', mini = bottom === 'skirt' && look.mini, hem = top === 'dress' ? (look.hemY || 0.58) : pencil ? 0.6 : mini ? 0.8 : 0.68, TOP = 1.045;
    const skirtSkin = (x, y, z, si, sw, k) => { const t = clamp((1.03 - y) / 0.4, 0, 1), s = clamp(x / 0.3, -1, 1), wl = t * 0.62 * (0.5 + 0.5 * s), wr = t * 0.62 * (0.5 - 0.5 * s); si[k] = HIPS; sw[k] = 1 - wl - wr; si[k + 1] = TH_L; sw[k + 1] = wl; si[k + 2] = TH_R; sw[k + 2] = wr; si[k + 3] = 0; sw[k + 3] = 0; };
    const mk = (y, e) => { const R = torsoRing(S, clamp(y, 0.9, TOP), e), d = Math.max(0, 0.9 - y); R.c = [0, y, 0]; if (pencil) { const lz = hk(S.lk, clamp(y, 0.3, 0.95)); R.ra = Math.max(R.ra, S.legX + lz[0] + e + 0.016); R.rm = Math.max(R.rm, lz[1] + Math.abs(lz[2]) + e + 0.034); R.rd = 0; } else { const fl = mini ? 0.5 : 0.46; R.ra += fl * d; R.rm += (mini ? 0.36 : 0.34) * d; } R.bu = 0; R.gl = 0; R.sq = 2.1; return R; };
    const ys = stn(TOP, hem, LD.tstep[B.lod] * 1.4, null), sg = LD.tseg[B.lod], sfab = look.satin || top === 'dress' ? (look.satin ? FAB.satin : F.top) : F.bottom;
    shell(mk, ys, sg, BL, lowerC, { lip: 'b', skin: skirtSkin, sh: [hem - 0.02, 1.0, 0.84, 1], noise: 0.025, fab: sfab, drape: y => (pencil ? 0 : 0.004 * Math.sin(y * 46) * smx(1.0, 0.8, y)) });
    shell(mk, ys, sg, BL - 0.004, mat(lowerC, 0.72), { flip: true, skin: skirtSkin, noise: 0 });
    shellTorso(0.70, 1.05, BL, hi ? mat(lowerC, 0.9) : lowerC, { capLo: true, fab: sfab }); // the hips under the skirt
  }
  // ----- the top -----
  let front = TL; // offset of the outermost layer on the trunk (for decals)
  const SLV = TL - 0.007; // sleeves hug the arm closer than the trunk garment hangs
  const sleeves = (c, off, yEnd, o) => { if (sl !== 'none') for (const s of [1, -1]) shellArm(s, 1.422, yEnd, off, c, Object.assign({ capLo: true, lip: 'b' }, o)); };
  const shortEnd = 1.25, longEnd = 0.918, rolled = sl === 'rolled' ? 1.12 : null;
  const elbow = y => 0.0032 * Math.sin(y * 52) * gaus(y, 1.13, 0.08), waist = y => 0.0042 * (0.5 + 0.5 * Math.sin(y * 50)) * smx(1.08, 0.92, y);
  const cuffs = (c, y0, y1, off, f) => { for (const s of [1, -1]) shellArm(s, y0, y1, off, c, { lip: 'ab', noise: 0, fab: f || F.top }); };
  const metal = { fab: FAB.metal, noise: 0 };
  if (layered) { // outer garment over a shirt: an opening in front shows the shirt
    const k = top, blazer = k === 'blazer', lab = k === 'labcoat', turn = k === 'turnout', chef = k === 'chefcoat', puffer = k === 'puffer', leath = k === 'leather', para = k === 'paramedic', longC = lab || turn || chef || blazer;
    const lo = blazer ? 0.8 : lab ? 0.56 : turn ? 0.6 : chef ? 0.78 : puffer ? 0.84 : leath ? 0.9 : para ? 0.88 : 0.88, extra = puffer ? 0.014 : turn ? 0.01 : lab ? 0.004 : leath ? -0.002 : 0;
    const zipped = look.open === false || (look.open === undefined && (puffer || turn || para || chef)), gap = y => zipped ? 0.004 : blazer ? 0.014 + 0.062 * smx(1.06, 1.42, y) : lab ? 0.02 + 0.05 * smx(1.1, 1.42, y) : leath ? 0.016 + 0.05 * smx(1.1, 1.42, y) : 0.024 + 0.034 * smx(1.1, 1.4, y);
    const g = y => Math.asin(clamp(gap(y) / halfW(y, OL + extra), 0, 0.97)), lean = leath ? 0.34 : 0; // a biker jacket's zip runs off-centre
    front = OL + extra; const ofs = OL + extra;
    shellTorso(0.88, NY, TL, col(gm.inner), { lip: 'ab', noise: 0.012, fab: F.inner });
    const baffles = puffer ? y => 0.0085 * Math.pow(Math.abs(Math.sin(y * 44)), 0.6) :  y => (blazer ? -0.003 * gaus(y, 1.08, 0.12) : 0.004 * smx(1.1, 0.92, y)) + waist(y) * 0.6;
    const arc = y => { const a = g(y); return [HALF_PI + a - lean * a, TAU - 2 * a]; };
    if (longC) { // a coat that leaves the trunk at the hips: flared, with the same opening; weights follow the thighs below the hip
      const TOP = 1.045, mk = (y, e) => { const R = torsoRing(S, clamp(y, 0.9, 1.5), e), d = Math.max(0, TOP - y); if (y < 0.9) R.c = [0, y, 0]; R.ra += 0.2 * d; R.rm += 0.14 * d; if (y < TOP) { R.bu = 0; R.gl = 0; R.sq = 2.2; } return R; };
      shell(mk, stn(lo, NY, LD.tstep[B.lod], [0.82, 1.08]), LD.tseg[B.lod], ofs, outer, { lip: 'ab', arcFn: arc, skin: thighSkin, noise: 0.015, drape: y => 0.003 * Math.sin(y * 46) * smx(1.0, 0.7, y), fab: F.top });
    } else shellTorso(lo, NY, ofs, outer, { lip: 'ab', arcFn: arc, drape: baffles, noise: 0.015, fab: F.top, step: puffer ? 0.02 : undefined });
    if (!puffer && !longC) for (const sd of [1, -1]) shellTorso(lo, NY, ofs + 0.003, mat(outer, blazer ? 0.74 : 0.82), { lip: 'ab', arcFn: y => { const a = g(y); return [sd > 0 ? HALF_PI + a - lean * a : HALF_PI - a - 0.15 - lean * a, 0.15]; }, noise: 0, fab: F.top }); // lapel / zip edge bands
    if (puffer || longC) for (const sd of [1, -1]) shellTorso(lo + 0.02, NY, ofs + 0.003, mat(outer, 0.86), { lip: 'ab', arcFn: y => { const a = g(y); return [sd > 0 ? HALF_PI + a : HALF_PI - a - 0.1, 0.1]; }, noise: 0, fab: F.top });
    const sleeveOff = ofs - 0.007 + (puffer ? 0.004 : 0), end = rolled ? 1.12 : longEnd + 0.01;
    for (const s of [1, -1]) {
      shellArm(s, 1.422, end, sleeveOff, outer, { capLo: true, lip: 'b', drape: y => 0.006 * smx(1.25, 0.95, y) + elbow(y) + (puffer ? 0.007 * Math.pow(Math.abs(Math.sin(y * 40)), 0.6) : 0), noise: 0.015, fab: F.top, step: puffer ? 0.024 : undefined });
      if (!rolled) shellArm(s, 0.95, 0.905, SLV + 0.002, col(gm.inner), { lip: 'ab', fab: F.inner }); // shirt cuff
      if (puffer || leath || k === 'jacket' || para) shellArm(s, end + 0.02, end - 0.0, sleeveOff + 0.003, mat(outer, 0.7), { lip: 'ab', noise: 0, fab: FAB.knit }); // ribbed cuffs
    }
    if (puffer || leath || k === 'jacket' || para) shellTorso(lo + 0.032, lo, ofs + 0.003, mat(outer, 0.72), { lip: 'ab', arcFn: arc, noise: 0, fab: puffer || k === 'jacket' ? FAB.knit : F.top }); // hem band
    ring(NECK, S.neckR + 0.014, S.neckR * 1.05 + 0.014, hi ? 0.014 : 0.012, 0, 1.488, 0.004, mat(outer, 0.9), ZERO3, { fab: F.top });
    if (puffer || turn || para) ring(NECK, S.neckR + 0.016, S.neckR * 1.05 + 0.016, hi ? 0.02 : 0.016, 0, 1.5, 0.004, mat(outer, 0.88), ZERO3, { fab: F.top }); // a high collar
    if (blazer || lab || leath || k === 'jacket') for (const s of [1, -1]) { const w = leath ? 0.026 : 0.018; bar(CHEST, s * (leath ? 0.075 : 0.062), 1.43, frontZ(S, 1.43, ofs, s * 0.062) + 0.003, s * (leath ? 0.03 : 0.014), lab ? 1.12 : 1.2, frontZ(S, lab ? 1.12 : 1.2, ofs, s * 0.014) + 0.003, w, mat(outer, leath ? 0.8 : 0.7)); } // lapels
    if (fine) { // pockets, buttons, zips
      const pz = y => frontZ(S, y, ofs, 0);
      if (blazer) { for (const s of [1, -1]) box(SPINE, 0.058, 0.014, 0.012, s * 0.085, 0.98, frontZ(S, 0.98, ofs, s * 0.085) + 0.003, mat(outer, 0.78), { fab: F.top }); box(CHEST, 0.044, 0.012, 0.008, 0.09, 1.22, frontZ(S, 1.22, ofs, 0.09) + 0.003, mat(outer, 0.8), { rot: [0, 0, 0.08], fab: F.top }); box(CHEST, 0.036, 0.034, 0.003, 0.092, 1.235, frontZ(S, 1.235, ofs, 0.092) + 0.004, 0xf2efe6); for (const y of [1.03, 0.97]) ball(SPINE, 0.0068, 0.0, y, pz(y) + 0.004, mat(outer, 0.5), { seg: [6, 4] }); }
      if (lab) { for (const s of [1, -1]) box(SPINE, 0.07, 0.07, 0.012, s * 0.1, 0.76, frontZ(S, 0.86, ofs, s * 0.1) + 0.003 - 0.01 * smx(0.9, 0.7, 0.76), mat(outer, 0.93), { fab: F.top }); box(CHEST, 0.05, 0.05, 0.01, 0.092, 1.2, frontZ(S, 1.2, ofs, 0.092) + 0.003, mat(outer, 0.93), { fab: F.top }); for (const y of [1.28, 1.14, 1.0, 0.86]) ball(SPINE, 0.0072, 0.0, y, pz(y) + 0.004, 0xdfe4ea, { seg: [6, 4] }); }
      if (chef) { for (const sx of [-0.045, 0.045]) for (const y of [1.34, 1.22, 1.1, 0.98, 0.88]) ball(SPINE, 0.0085, sx, y, frontZ(S, y, ofs, sx) + 0.004, 0xe8eef2, { seg: [6, 4] }); bar(CHEST, 0.0, 1.43, frontZ(S, 1.43, ofs, 0) + 0.003, 0.0, 0.85, frontZ(S, 0.85, ofs, 0) + 0.003, 0.012, mat(outer, 0.88)); }
      if (k === 'jacket' || leath || para || turn) { bar(CHEST, 0, 1.44, pz(1.44) + 0.004, 0, lo + 0.02, pz(lo) + 0.004, 0.0055, 0xaeb2ba); for (const s of [1, -1]) box(SPINE, 0.012, 0.08, 0.02, s * 0.098, 1.0, frontZ(S, 1.0, ofs, s * 0.098) + 0.003, mat(outer, 0.7), { rot: [0, 0, s * 0.18], fab: F.top }); }
      if (leath) { for (const s of [1, -1]) { bar(CHEST, s * 0.1, 1.405, frontZ(S, 1.405, ofs, s * 0.1) + 0.004, s * 0.115, 1.395, frontZ(S, 1.395, ofs, s * 0.115) + 0.004, 0.02, mat(outer, 0.75)); box(CHEST, 0.052, 0.01, 0.01, s * 0.12, 1.43, 0.0, mat(outer, 0.7), { fab: F.top }); } bar(CHEST, 0.03, 1.3, pz(1.3) + 0.006, 0.04, 1.2, pz(1.2) + 0.006, 0.007, 0xaeb2ba, { fab: FAB.metal }); }
    }
  } else if (top === 'tank') { // straps over bare shoulders
    shellTorso(0.90, 1.365, TL, shirt, { lip: 'ab', noise: 0.015, drape: waist, fab: F.top });
    for (const s of [1, -1]) for (const back of [false, true]) shellTorso(1.35, 1.466, TL + 0.002, shirt, { lip: 'ab', arcFn: strapArc(s, 0.085 * (fem ? 0.93 : 1), 0.0165, back), noise: 0, fab: F.top });
    shellTorso(0.905, 0.89, TL + 0.0015, mat(shirt, 0.9), { lip: 'ab', noise: 0, fab: F.top });
  } else if (top === 'bare') { /* swimwear: the torso is skin */
  } else if (top === 'hoodie') { // thick, baggy, a ribbed band, a kangaroo pocket, the hood draped behind the neck, drawstrings
    front = TL + 0.016; const ho = TL + 0.012;
    shellTorso(0.90, NY, ho, shirt, { lip: 'ab', drape: y => 0.012 * smx(1.25, 0.95, y) + waist(y), noise: 0.02, fab: F.top });
    shellTorso(0.82, 0.92, TL + 0.004, mat(shirt, 0.78), { lip: 'ab', noise: 0, fab: FAB.knit });
    shellTorso(0.95, 1.06, ho + 0.007, mat(shirt, 0.84), { lip: 'ab', arcFn: () => [HALF_PI - 0.8, 1.6], drape: y => 0.012 * smx(1.25, 0.95, y), noise: 0, fab: F.top }); // pocket
    sleeves(shirt, SLV + 0.006, longEnd + 0.005, { drape: y => 0.007 * smx(1.25, 1.0, y) + elbow(y), noise: 0.02, fab: F.top });
    cuffs(mat(shirt, 0.72), 0.95, 0.9, SLV + 0.008, FAB.knit); // ribbed cuffs
    ring(CHEST, 0.105, 0.1, 0.03, 0, 1.462, -0.03, mat(shirt, 0.9), [-0.35, 0, 0], { arc: [Math.PI, Math.PI], fab: F.top }); // hood hanging behind the neck
    if (hi) for (const s of [1, -1]) bar(CHEST, s * 0.032, 1.43, frontZ(S, 1.43, ho, s * 0.032) + 0.004, s * 0.036, 1.27, frontZ(S, 1.27, ho, s * 0.036) + 0.004, 0.009, 0xe8e0d0);
  } else if (top === 'sweater') { // chunky knit, rolled neck, ribbed hem and cuffs
    front = TL + 0.01; const so = TL + 0.01;
    shellTorso(0.90, NY, so, shirt, { lip: 'ab', drape: y => 0.008 * smx(1.25, 0.95, y) + waist(y) * 0.5, noise: 0.02, fab: FAB.knit });
    shellTorso(0.915, 0.88, so + 0.004, mat(shirt, 0.82), { lip: 'ab', noise: 0, fab: FAB.knit });
    sleeves(shirt, SLV + 0.005, longEnd + 0.005, { drape: y => 0.005 * smx(1.25, 1.0, y) + elbow(y), noise: 0.02, fab: FAB.knit }); cuffs(mat(shirt, 0.8), 0.95, 0.9, SLV + 0.009, FAB.knit);
    ring(NECK, S.neckR + 0.018, S.neckR * 1.05 + 0.018, hi ? 0.02 : 0.016, 0, 1.494, 0.004, mat(shirt, 0.92), ZERO3, { fab: FAB.knit });
  } else if (top === 'overalls') { // a coverall: canvas, zip, collar, chest pockets, a belt line
    front = TL + 0.004; const oo = TL + 0.004;
    shellTorso(0.80, NY, oo, shirt, { lip: 'ab', drape: y => 0.004 * smx(1.2, 0.95, y) + waist(y) * 0.5, noise: 0.02, fab: F.top });
    sleeves(shirt, SLV + 0.003, longEnd + 0.01, { drape: y => 0.006 * smx(1.25, 1.0, y) + elbow(y), noise: 0.02, fab: F.top }); cuffs(mat(shirt, 0.85), 0.95, 0.9, SLV + 0.006, F.top);
    shellTorso(1.02, 0.98, oo + 0.003, mat(shirt, 0.8), { lip: 'ab', noise: 0, fab: F.top });
    ring(NECK, S.neckR + 0.012, S.neckR * 1.05 + 0.012, hi ? 0.013 : 0.011, 0, 1.495, 0.004, mat(shirt, 0.9), ZERO3, { fab: F.top });
    if (fine) { bar(CHEST, 0, 1.46, frontZ(S, 1.46, oo, 0) + 0.003, 0, 0.84, frontZ(S, 0.84, oo, 0) + 0.003, 0.006, 0xaeb2ba, { fab: FAB.metal }); for (const s of [1, -1]) { box(CHEST, 0.05, 0.05, 0.01, s * 0.085, 1.22, frontZ(S, 1.22, oo, s * 0.085) + 0.003, mat(shirt, 0.92), { fab: F.top }); box(SPINE, 0.06, 0.07, 0.012, s * 0.1, 0.9, frontZ(S, 0.9, oo, s * 0.1) + 0.003, mat(shirt, 0.92), { fab: F.top }); } }
  } else { // tee, polo, scrubs, long sleeve, shirt, dress top
    const shirtT = top === 'shirt', polo = top === 'polo', scrub = top === 'scrubs', hem = shirtT ? 0.86 : top === 'dress' ? 0.97 : 0.885, fb = F.top;
    shellTorso(hem, NY, TL, shirt, { lip: 'ab', drape: y => (shirtT ? 0.004 * smx(1.2, 0.95, y) : 0.003 * smx(1.2, 0.93, y)) + waist(y) * (shirtT ? 0.7 : 0.4), noise: 0.015, fab: fb });
    const end = rolled || (sl === 'long' ? longEnd : shortEnd);
    sleeves(shirt, SLV, end, { drape: y => (sl === 'long' ? 0.004 : 0.006) * smx(1.3, 1.0, y) + (sl !== 'short' ? elbow(y) : 0), fab: fb });
    if (top !== 'dress' && !shirtT) { shellTorso(hem + 0.016, hem, TL + 0.0015, mat(shirt, 0.92), { lip: 'ab', noise: 0, fab: fb }); } // hem seam
    if (sl === 'short' && !rolled) cuffs(polo ? mat(shirt, 0.82) : mat(shirt, 0.94), shortEnd + 0.014, shortEnd, SLV + 0.0025, polo ? FAB.knit : fb); // sleeve hems
    if (shirtT) { shellTorso(hem, 1.47, TL + 0.003, mat(shirt, 0.84), { lip: 'ab', arcFn: () => [HALF_PI - 0.05, 0.1], noise: 0, fab: fb }); if (sl === 'long') cuffs(mat(shirt, 0.88), 0.95, 0.915, SLV + 0.004, fb); if (rolled) cuffs(mat(shirt, 0.92), 1.14, 1.12, SLV + 0.008, fb);
      if (fine) { for (let y = 1.44; y > hem + 0.02; y -= 0.082) ball(SPINE, 0.0058, 0, y, frontZ(S, y, TL + 0.003, 0) + 0.004, 0xeae6da, { seg: [6, 4] }); if (look._side > 0) box(CHEST, 0.05, 0.056, 0.007, 0.088, 1.255, frontZ(S, 1.255, TL, 0.088) + 0.003, mat(shirt, 0.93), { fab: fb }); } } // button placket, cuffs, buttons, a chest pocket
    if (polo) { shellTorso(hem, 1.45, TL + 0.003, mat(shirt, 0.86), { lip: 'ab', arcFn: () => [HALF_PI - 0.065, 0.13], noise: 0, fab: fb }); if (fine) for (const y of [1.4, 1.34, 1.28]) ball(SPINE, 0.0058, 0, y, frontZ(S, y, TL + 0.003, 0) + 0.004, mat(shirt, 0.6), { seg: [6, 4] }); }
    if (scrub) { for (const s of [1, -1]) bar(CHEST, s * 0.062, 1.462, frontZ(S, 1.462, TL, s * 0.062) + 0.003, 0, 1.345, frontZ(S, 1.345, TL, 0) + 0.003, 0.016, mat(shirt, 0.82)); if (fine) { box(CHEST, 0.052, 0.058, 0.007, 0.086, 1.24, frontZ(S, 1.24, TL, 0.086) + 0.003, mat(shirt, 0.9), { fab: fb }); for (const s of [1, -1]) box(SPINE, 0.06, 0.07, 0.008, s * 0.1, 0.98, frontZ(S, 0.98, TL, s * 0.1) + 0.003, mat(shirt, 0.92), { fab: fb }); } }
  }
  if (top === 'shirt') { // collar band and the two wings of an open collar
    ring(NECK, S.neckR + 0.01, S.neckR * 1.05 + 0.01, hi ? 0.012 : 0.011, 0, 1.496, 0.004, shirt, ZERO3, { fab: F.top });
    for (const s of [1, -1]) bar(NECK, s * 0.02, 1.506, S.neckR + 0.02, s * 0.075, 1.45, S.neckR * 1.05 + 0.02, 0.016, mat(shirt, 0.94), { fab: F.top });
  } else if (top === 'polo') {
    ring(NECK, S.neckR + 0.011, S.neckR * 1.05 + 0.011, hi ? 0.012 : 0.01, 0, 1.497, 0.004, mat(shirt, 0.9), ZERO3, { fab: FAB.knit });
    for (const s of [1, -1]) bar(NECK, s * 0.018, 1.51, S.neckR + 0.022, s * 0.066, 1.455, S.neckR * 1.05 + 0.022, 0.017, mat(shirt, 0.88), { fab: FAB.knit });
  } else if (hi && (top === 'tee' || top === 'longsleeve' || top === 'dress')) ring(NECK, S.neckR + 0.014, S.neckR * 1.05 + 0.014, 0.0105, 0, NY - 0.002, 0.004, mat(shirt, 0.86), ZERO3, { fab: FAB.knit });
  // ----- worn over the top: vests, aprons, belts, reflective trim -----
  if (vest) { // SWAT vest, pouches, reflective stripe
    shellTorso(1.0, 1.425, ARM, vest, { lip: 'ab', noise: 0.02, fab: FAB.nylon }); front = ARM;
    if (hi) for (const px of [-0.09, 0, 0.09]) box(SPINE, 0.06, 0.075, 0.032, px, 1.1, frontZ(S, 1.1, ARM, px) + 0.012, mat(vest, 0.7), { fab: FAB.nylon });
    if (look.vestStripe !== undefined && look.vestStripe !== null) shellTorso(1.285, 1.335, ARM + 0.003, col(look.vestStripe), { lip: 'ab', noise: 0, fab: FAB.mesh });
  }
  if (look.hivis !== undefined && look.hivis !== null && !vest) { // hi-vis vest: mesh, reflective bands
    const vo = (layered ? OL : TL) + 0.007, gv = 0.05; front = vo; const hv = col(look.hivis);
    shellTorso(0.98, 1.43, vo, hv, { lip: 'ab', arcFn: () => [HALF_PI + 0.1, TAU - 0.2], noise: 0.015, fab: FAB.mesh });
    for (const y of [1.14, 1.0]) shellTorso(y + 0.022, y - 0.022, vo + 0.003, 0xdfe3e8, { lip: 'ab', arcFn: () => [HALF_PI + 0.1, TAU - 0.2], noise: 0, fab: FAB.metal });
    for (const s of [1, -1]) for (const back of [false, true]) shellTorso(1.0, 1.43, vo + 0.003, 0xdfe3e8, { lip: 'ab', arcFn: strapArc(s, 0.075 * (fem ? 0.93 : 1), 0.0125, back), noise: 0, fab: FAB.metal });
  }
  if (look.reflect !== undefined && look.reflect !== null) { // reflective bands on trunk and sleeves (paramedics, firefighters)
    const rc = look.reflect === true ? 0xcfd6dc : look.reflect, ro = (layered ? OL : TL) + 0.012 + (top === 'puffer' ? 0.01 : 0); front = Math.max(front, ro);
    for (const y of top === 'turnout' ? [1.05, 0.85, 0.7] : [1.14, 1.0]) shellTorso(y + 0.024, y - 0.024, ro, rc, { lip: 'ab', arcFn: () => [HALF_PI + 0.016, TAU - 0.032], noise: 0, fab: FAB.metal, drape: () => 0 });
    for (const s of [1, -1]) { shellArm(s, 1.05, 1.0, ro - 0.0, rc, { lip: 'ab', noise: 0, fab: FAB.metal }); shellArm(s, 1.17, 1.12, ro - 0.0, rc, { lip: 'ab', noise: 0, fab: FAB.metal }); }
  }
  if (look.apron !== undefined && look.apron !== null) { // a bib apron from the chest to the knees: narrow at the neck, wide at the waist, straps round the neck, ties at the back, a pocket
    const ao = Math.max(front, layered ? OL : TL) + 0.014, ac = col(look.apron); front = ao;
    const mkA = (y, e) => { const R = torsoRing(S, clamp(y, 0.9, 1.5), e), d = Math.max(0, 0.9 - y); if (y < 0.9) R.c = [0, y, 0]; R.ra += 0.04 * d; R.rm += 0.05 * d; if (y < 0.95) { R.bu = 0; R.gl = 0; } return R; };
    const arcA = y => { const half = 0.5 + 0.78 * smx(1.4, 1.12, y); return [HALF_PI - half, 2 * half]; };
    shell(mkA, stn(0.52, 1.38, LD.tstep[B.lod], [0.82, 1.08]), LD.tseg[B.lod], ao, ac, { lip: 'ab', arcFn: arcA, skin: thighSkin, noise: 0.015, fab: FAB.canvas });
    for (const s of [1, -1]) { bar(CHEST, s * 0.075, 1.36, frontZ(S, 1.36, ao, s * 0.075) + 0.003, s * 0.05, 1.5, 0.0, 0.016, mat(ac, 0.9), { fab: FAB.canvas }); bar(HIPS, s * 0.14, 0.99, 0.03, s * 0.02, 1.0, backZ(S, 1.0, ao) - 0.004, 0.014, mat(ac, 0.9), { fab: FAB.canvas }); }
    if (fine) { box(SPINE, 0.15, 0.08, 0.012, 0, 0.83, frontZ(S, 0.83, ao, 0) + 0.003, mat(ac, 0.88), { fab: FAB.canvas }); if (look.apronStripe !== undefined) shell(mkA, stn(1.02, 1.06, LD.tstep[B.lod], null), LD.tseg[B.lod], ao + 0.002, col(look.apronStripe), { lip: 'ab', arcFn: arcA, skin: thighSkin, noise: 0, fab: FAB.canvas }); }
  }
  if (look.dutyBelt) { // police / security: a belt with pouches, holster, handcuffs, a radio on the shoulder
    const bo = Math.max(BL, layered ? OL : TL) + 0.008, bc = 0x15171a; shellTorso(0.97, 1.03, bo, bc, { lip: 'ab', noise: 0.01, fab: FAB.leather }); front = Math.max(front, bo);
    if (fine) { box(HIPS, 0.035, 0.034, 0.012, 0, 1.0, frontZ(S, 1.0, bo, 0) + 0.004, 0xc9ccd2, { fab: FAB.metal }); for (const px of [-0.1, 0.05]) box(HIPS, 0.045, 0.075, 0.03, px, 1.0, frontZ(S, 1.0, bo, px) + 0.012, bc, { fab: FAB.leather }); box(TH_R, 0.036, 0.15, 0.05, -0.19, 0.86, 0.0, 0x101114, { rot: [0, 0, 0.0], fab: FAB.leather }); box(HIPS, 0.04, 0.09, 0.02, 0.12, 1.0, backZ(S, 1.0, bo) - 0.01, bc, { fab: FAB.leather }); box(CHEST, 0.036, 0.05, 0.022, -0.1, 1.355, frontZ(S, 1.355, OL, -0.1) + 0.012, 0x15171a, { fab: FAB.rubber }); }
  }
  if (look.tie || top === 'blazer') { const tc = col(look.tie === undefined ? 0xb0122a : look.tie), fz = frontZ(S, 1.25, front, 0) + 0.004; box(CHEST, 0.04, 0.3, 0.01, 0, 1.25, fz, tc, { fab: FAB.satin }); box(CHEST, 0.05, 0.045, 0.02, 0, 1.4, frontZ(S, 1.4, front, 0) + 0.006, mat(tc, 1.1), { fab: FAB.satin }); }
  if (look.stripe) { // side stripes on the trunk and down the outside of the legs
    const sc = col(look.stripe);
    for (const s of [1, -1]) {
      shellTorso(0.89, 1.44, TL + 0.003, sc, { lip: 'ab', arcFn: () => s > 0 ? [-0.05, 0.5] : [Math.PI - 0.45, 0.5], noise: 0, fab: FAB.spandex });
      shellLeg(s, 0.97, longLegs ? 0.1 : 0.53, BL + 0.003, sc, { lip: 'ab', arcFn: () => s > 0 ? [-0.1, 0.5] : [Math.PI - 0.4, 0.5], noise: 0, fab: FAB.spandex });
    }
  }
  if (look.badge) box(CHEST, 0.05, 0.062, 0.012, 0.085, 1.31, frontZ(S, 1.31, front, 0.085) + 0.004, 0xffd34e, { rot: [0, 0, 0.1], fab: FAB.metal });
  if (look.lanyard) { const lc = col(look.lanyard === true ? 0x2a6fd6 : look.lanyard); for (const s of [1, -1]) bar(NECK, s * 0.048, 1.5, 0.045, 0, 1.2, frontZ(S, 1.2, front, 0) + 0.004, 0.006, lc, { fab: FAB.satin }); box(CHEST, 0.056, 0.078, 0.004, 0, 1.17, frontZ(S, 1.17, front, 0) + 0.005, 0xf2f4f6, { fab: FAB.poplin }); box(CHEST, 0.02, 0.016, 0.0044, -0.012, 1.188, frontZ(S, 1.188, front, 0) + 0.0055, 0x3a6ea5); }
  if (look.stethoscope) { const tc = 0x1a1c20; ring(CHEST, S.neckR + 0.03, S.neckR * 1.05 + 0.035, 0.0055, 0, 1.455, 0.0, tc, [0.25, 0, 0], { fab: FAB.rubber }); bar(CHEST, -0.052, 1.45, frontZ(S, 1.45, front, -0.052) + 0.006, -0.03, 1.16, frontZ(S, 1.16, front, -0.03) + 0.008, 0.006, tc, { fab: FAB.rubber }); bar(CHEST, 0.052, 1.45, frontZ(S, 1.45, front, 0.052) + 0.006, 0.03, 1.16, frontZ(S, 1.16, front, 0.03) + 0.008, 0.006, tc, { fab: FAB.rubber }); ball(CHEST, 0.02, 0, 1.15, frontZ(S, 1.15, front, 0) + 0.014, 0xb9bdc4, { fab: FAB.metal, seg: [8, 5] }); }
  if (look.scarf !== undefined && look.scarf !== null) { const sc = col(look.scarf); ring(NECK, S.neckR + 0.03, S.neckR * 1.05 + 0.03, hi ? 0.024 : 0.02, 0, 1.47, 0.006, sc, ZERO3, { fab: FAB.knit }); ring(NECK, S.neckR + 0.036, S.neckR * 1.05 + 0.036, hi ? 0.016 : 0.014, 0, 1.43, 0.012, mat(sc, 0.9), [0.1, 0, 0], { fab: FAB.knit }); box(CHEST, 0.07, 0.3, 0.02, -0.04, 1.28, frontZ(S, 1.28, front, -0.04) + 0.012, mat(sc, 0.95), { rot: [0, 0, 0.06], fab: FAB.knit }); }
  if (look.bag !== undefined && look.bag !== null) { // a shoulder bag: a strap across the chest, the bag at the hip
    const bc = col(look.bag), bf = front + 0.006;
    bar(CHEST, 0.1, 1.43, frontZ(S, 1.43, bf, 0.1) + 0.003, -0.13, 1.0, frontZ(S, 1.0, bf, -0.13) + 0.003, 0.022, mat(bc, 0.85), { fab: FAB.leather }); bar(CHEST, 0.1, 1.43, 0.0, 0.14, 1.0, backZ(S, 1.0, bf) - 0.002, 0.02, mat(bc, 0.85), { fab: FAB.leather });
    box(HIPS, 0.27, 0.19, 0.08, -0.2, 0.9, 0.0, bc, { rot: [0, 0, 0.08], fab: FAB.leather }); box(HIPS, 0.272, 0.07, 0.083, -0.2, 0.975, 0.0, mat(bc, 0.86), { rot: [0, 0, 0.08], fab: FAB.leather }); if (fine) box(HIPS, 0.03, 0.026, 0.01, -0.2, 0.95, 0.045, 0xd5b04a, { fab: FAB.metal });
  }
  if (look.backpack) {
    const bc = col(look.backpack), bz = backZ(S, 1.22, OL) - 0.085, box3 = look.delivery; // a delivery rucksack is a hard square box
    if (box3) { box(CHEST, 0.36 * (S.armX / 0.19), 0.38, 0.3, 0, 1.22, bz - 0.06, bc, { fab: FAB.nylon }); box(CHEST, 0.364 * (S.armX / 0.19), 0.04, 0.304, 0, 1.38, bz - 0.06, mat(bc, 1.15), { fab: FAB.nylon }); box(CHEST, 0.2, 0.12, 0.004, 0, 1.2, bz - 0.211, 0xf4f4f4, { fab: FAB.poplin }); }
    else { taper(CHEST, 0.3 * (S.armX / 0.19), 0.12, 0.33 * (S.armX / 0.19), 0.15, 1.04, 1.4, 0, bz, bc, { sh: [1.04, 1.4, 0.82, 1], fab: FAB.nylon }); box(CHEST, 0.2, 0.12, 0.05, 0, 1.12, bz - 0.085, mat(bc, 0.8), { fab: FAB.nylon }); if (fine) box(CHEST, 0.012, 0.2, 0.012, 0, 1.25, bz - 0.15, 0xaeb2ba, { fab: FAB.metal }); }
    const sd = hk(S.tk, 1.46)[0] > 0.1 ? 0.088 : 0.07, off = front + 0.006, sc2 = mat(bc, 0.7); // straps follow the shoulder over the top and down the chest, and down the back to the pack
    for (const s of [1, -1]) {
      const x = s * sd, pts = [[1.466, 0.0], [1.43, frontZ(S, 1.43, off, x) + 0.002], [1.3, frontZ(S, 1.3, off, x) + 0.002], [1.2, frontZ(S, 1.2, off, x) + 0.002]];
      for (let i = 0; i < 3; i++) bar(CHEST, x, pts[i][0], pts[i][1], x, pts[i + 1][0], pts[i + 1][1], 0.032, sc2, { fab: FAB.nylon });
      bar(CHEST, x, 1.466, 0.0, x, 1.4, backZ(S, 1.4, off) - 0.002, 0.032, sc2); bar(CHEST, x, 1.4, backZ(S, 1.4, off) - 0.002, x, 1.25, bz + 0.04, 0.032, sc2);
    }
  }
  if (look.chain) { const r = hk(S.tk, 1.435); ring(CHEST, r[0] * 0.78 + front, r[1] * 0.9 + front, 0.0055, 0, 1.435, -0.005, 0xf0c040, [0.35, 0, 0], { rs: 4, ts: hi ? 12 : 8, fab: FAB.metal }); box(CHEST, 0.022, 0.03, 0.01, 0, 1.36, frontZ(S, 1.36, front, 0) + 0.004, 0xf0c040, { fab: FAB.metal }); }
  if (look.necklace) { const r = hk(S.tk, 1.44), nc = col(look.necklace === true ? 0xf2efe8 : look.necklace); ring(CHEST, r[0] * 0.7 + front, r[1] * 0.85 + front, 0.0036, 0, 1.44, -0.002, nc, [0.4, 0, 0], { rs: 4, ts: hi ? 14 : 9, fab: FAB.metal }); if (fine) { ball(CHEST, 0.0075, 0, 1.372, frontZ(S, 1.372, front, 0) + 0.006, 0xe05a7a, { seg: [7, 5], fab: FAB.glass }); } }
  if (look.watch) { shellArm(1, 0.955, 0.925, LAYER.under + 0.002, 0x2a2d33, { lip: 'ab', noise: 0, fab: FAB.rubber }); box(FA_L, 0.012, 0.034, 0.034, S.armX + 0.038, 0.94, 0, 0xd8d8e0, { fab: FAB.metal }); }
  if (look.bracelet) { const bc = look.bracelet === true ? 0xd9b24a : look.bracelet; shellArm(-1, 0.945, 0.925, LAYER.under + 0.0045, bc, { lip: 'ab', noise: 0, fab: FAB.metal }); shellArm(-1, 0.92, 0.905, LAYER.under + 0.0045, mat(col(bc), 0.85), { lip: 'ab', noise: 0, fab: FAB.metal }); }
  buildShoes(look, gm, fem, shoes);
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
  const geo = mergeSkinned(B.parts); geo.deleteAttribute('skinIndex'); geo.deleteAttribute('skinWeight'); geo.deleteAttribute('uv'); geo.deleteAttribute('tint'); B = saved;
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
// ---------- locomotion: a planted-foot gait ----------
// The legs of a walker or runner are NOT swung as sine waves (that slides the foot over the ground); each ankle follows a trajectory in the pelvis frame and two-bone IK
// turns it into thigh and knee angles. One leg cycle is a STANCE (the foot rolls heel -> flat -> ball and moves backwards in the pelvis frame at exactly the ground speed, so it is
// planted in the world) and a SWING (it lifts, passes the other leg and lands ahead). The pelvis height is solved from the feet: the thigh pivot is as high as every foot allows (smooth minimum of the
// reach of both legs, of a standing leg and of the flight lift), which gives the bob, the knee flexion at touchdown and, when running, the flight phase. Everything is in LOCAL units (a 1.73 m body,
// look.height divides the world speed), the cycle phase is the existing distance-driven ch.phase, so footsteps (ch.steps) still fire at every touchdown.
//   rolling the foot about the heel (w < 0, toes up) or the ball (w > 0, heel up) shifts the ankle by dz(w) and lifts it by dy(w); with the contact point fixed in the world this is exact
const GO = { th: new Float32Array(2), sh: new Float32Array(2), fw: new Float32Array(2), fz: new Float32Array(2), fy: new Float32Array(2), hp: 0.92 }; // gait result: thigh x, shin x, world pitch of the foot, ankle z / y, height of the thigh pivot
const FWV = new Float32Array(2); let IKW = 0, IKHIP = 0; // foot pitch the solver wants and how much of the pose the IK owns this frame (0 = the old pose layer)
const GL_A = 0.42, GL_L = 0.84, GL_BALL = 0.25, GL_HEEL = 0.07; // the shoe is one rigid last: it rolls over the toe tip (z 0.25) and the heel (z -0.07)
const footDz = w => w < 0 ? -GL_HEEL + 0.08 * Math.sin(w) + GL_HEEL * Math.cos(w) : GL_BALL - GL_BALL * Math.cos(w) + 0.08 * Math.sin(w); // ankle z relative to the flat-foot ankle
const footDy = w => w < 0 ? 0.08 * Math.cos(w) - GL_HEEL * Math.sin(w) : 0.08 * Math.cos(w) + GL_BALL * Math.sin(w);                       // ankle height above the ground
const smin3 = (a, b, c, k) => { const m = Math.min(a, b, c); return m - Math.log(Math.exp(-k * (a - m)) + Math.exp(-k * (b - m)) + Math.exp(-k * (c - m))) / k; };
const minJerk = t => t * t * t * (10 - 15 * t + 6 * t * t);
const stepLen = v => 0.42 + 0.22 * v; // metres per step (a foot touchdown) at ground speed v; DMAX = the longest stretch a foot can stay planted (the swept angle of the leg is limited)
const DMAX = 0.92, GG = { S: [0.64, 0.44, 0.32], zTD: [0.36, 0.3, 0.3], whs: [-0.3, -0.1, -0.02], wto: [0.45, 0.52, 0.6], pHS: [0.12, 0.07, 0.05], pHO: [0.42, 0.4, 0.38], lift: [0.075, 0.26, 0.34], comp: [0.99, 0.955, 0.93], fl: [0, 0.035, 0.06], dangle: [0, 0.25, 0.4] };
// cyc 0..1 (the left foot touches down at 0, the right at 0.5), v local speed (m/s), blend weights wr / ws (run / sprint), ss stride scale (small at the start / stop and when turning on the spot), dip extra knee bend (landing)
function gaitSolve(cyc, v, wr, ws, ss, dip) {
  const Cd = 2 * stepLen(v), S = Math.min(g3(GG.S, wr, ws), DMAX / Cd), Dst = S * Cd * ss, whs = g3(GG.whs, wr, ws), wto = g3(GG.wto, wr, ws), pHS = g3(GG.pHS, wr, ws), pHO = g3(GG.pHO, wr, ws), Az0 = g3(GG.zTD, wr, ws) * ss - footDz(whs); // Az0: the flat-foot ankle at touchdown, chosen so the ankle (heel strike) lands zTD ahead of the pelvis
  const lift = g3(GG.lift, wr, ws) * (0.35 + 0.65 * ss), Lc = GL_L * g3(GG.comp, wr, ws) - dip, dang = g3(GG.dangle, wr, ws);
  let fl = 0; if (S < 0.5) { const m = cyc % 0.5; if (m > S) fl = g3(GG.fl, wr, ws) * Math.sin(Math.PI * (m - S) / (0.5 - S)); } // flight: both feet are in the air, the pelvis follows a parabola
  for (let l = 0; l < 2; l++) {
    const u = (cyc + 0.5 * l) % 1; let w, z, y;
    if (u < S) { // stance
      const p = u / S;
      w = p < pHS ? whs * (1 - sstep(0, 1, p / pHS)) : p < pHO ? 0 : wto * Math.pow((p - pHO) / (1 - pHO), 1.5);
      z = Az0 - Dst * p + footDz(w); y = footDy(w);
    } else { // swing: minimum-jerk travel from the toe-off point to the next touchdown, a lift that peaks early (the heel recovers first), the foot dangles toes-down then flexes up for the landing
      const t = (u - S) / (1 - S), e = minJerk(t), zt = Az0 - Dst + footDz(wto), yt = footDy(wto), zh = Az0 + footDz(whs), yh = footDy(whs);
      z = zt + (zh - zt) * e; y = yt + (yh - yt) * e + lift * Math.sin(Math.PI * Math.pow(t, 0.8)) + fl;
      w = wto + (whs - wto) * sstep(0.05, 0.8, t) + dang * Math.sin(Math.PI * t) * (1 - sstep(0.5, 0.95, t));
    }
    GO.fz[l] = z; GO.fy[l] = y; GO.fw[l] = w;
  }
  // pelvis: as high as the reach of both legs and of a straight standing leg allow
  const r0 = Math.sqrt(Math.max(0.09, Lc * Lc - GO.fz[0] * GO.fz[0])) + GO.fy[0], r1 = Math.sqrt(Math.max(0.09, Lc * Lc - GO.fz[1] * GO.fz[1])) + GO.fy[1];
  const hp = smin3(0.08 + Lc + fl, r0, r1, 60); GO.hp = hp;
  for (let l = 0; l < 2; l++) { legIK(GO.fz[l], hp - GO.fy[l]); GO.th[l] = _IK[0]; GO.sh[l] = _IK[1]; }
}
// two-bone IK in the sagittal plane: ankle at (z forward, drop below the thigh pivot) -> thigh x and knee x (flexion >= 0); the foot pitch is set by the caller
const _IK = new Float32Array(2); // result of legIK: thigh x, knee x
function legIK(z, drop) {
  const D = Math.min(GL_L * 0.9995, Math.max(0.14, Math.hypot(z, drop))), al = Math.acos(D / GL_L);
  _IK[0] = Math.atan2(-z, drop) - al; _IK[1] = 2 * al;
}
// ---------- dying, ragdoll limbs, getting up ----------
// The collapse is carried by the pelvis: ROOT is a rotation applied to the hips bone (the whole body pivots about the feet), so the group stays upright and
// every caller keeps writing group.position / rotation.y as before. A launched ragdoll instead turns the group itself (Ped owns that rigid body).
const ROOT = { on: false, solveW: 1, q: new THREE.Quaternion(), pelvis: false, py: 0.94, pz: 0 }; // pelvis: the caller places the pelvis itself (getting up from a bed pivots about the pelvis, not the feet)
const _ra = new THREE.Vector3(), _rq = new THREE.Quaternion(), Y_AXIS = new THREE.Vector3(0, 1, 0), _lm = new THREE.Matrix4(), _ly = new Float32Array(NB * 4);
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

// =====================================================================================================================
// ACTIVITY LAYER (release 3, P3). A person can be doing something on top of, or instead of, the locomotion: talking on the phone while walking, sitting on a bench, waving, dancing, lying hurt.
//   rig.setActivity(name, opts)   start an activity (blends in over about 0.3 s; the previous one blends out first). name = null / 'none' / undefined clears it. Returns the rig; an unknown name is ignored.
//   rig.activity                  the requested activity, null for none
//   rig.activityWeight            0..1, how far the blend has got (1 = fully in the pose), for callers that wait for a pose
//   ACTIVITIES                    the list of names, for validation
//   opts (all optional)           instant: true snaps into the pose (a person spawned already sitting)
//   phone      { mode: 'ear' | 'read', hand: 'R' | 'L' }      the handset is a small shared mesh in the hand; 'ear' = a call (head tilts to the shoulder), 'read' = held in front, the head looks down, a thumb types
//   talk       { energy 0..1 (0.6) }                           conversational gestures with both hands, nods, head tilts; at the finest LOD the mouth moves
//   sit        { h: seat height in metres (0.46), lean: 0..1 slouch forward, back: true leans on a backrest, z: shift }   the group origin is the point on the ground under the pelvis, the person faces the group's +z, feet are planted on the ground
//   wave       { hand: 'R' | 'L' }                             a raised hand waving, a smile
//   cheer      { energy 0..1 }                                 both arms up, fists pumping, knees bouncing
//   cower      {}                                              a deep crouch with the hands over the head, a scared face
//   lookAround { range (rad, 1.1) }                            the head sweeps from side to side, the chest follows
//   umbrella   { color }                                       one arm up holding an open umbrella (a shared prop)
//   carry      { kind: 'box' | 'bag' }                         'box' = both arms hold a carton against the chest, 'bag' = one hand holds a shopping bag
//   sunbathe   { pose: 'back' | 'belly', center: true }        lying flat on the back (head towards -z of the group) or the belly (head towards +z); center puts the pelvis over the group origin
//   dance      { style: 0 | 1 | 2, bpm: 118 }                  0 = party (arms alternate overhead), 1 = slow sway, 2 = two-step with a clap
//   smoke      {}                                              a cigarette (glowing tip): raised to the mouth every few seconds, otherwise held low
//   point      { target: {x, z} (world) | yaw (rad, relative to the heading), hand: 'R' | 'L' }
//   handsUp    {}                                              surrender: both hands beside the head, palms forward
//   injured    { side: 1 | -1 }                                lying hurt on the back, one hand on the belly, the other reaching, a knee drawn up, the body shifting slowly; a pained face
//   handcuffed {}                                              the hands behind the back (the legs keep walking)
// Activities fade the locomotion arms and, for sit / sunbathe / injured / cower / dance, the legs; props (phone, umbrella, box, bag, cigarette) are hidden again when the activity ends. All of it is allocation-free.
// =====================================================================================================================
export const ACTIVITIES = ['phone', 'talk', 'sit', 'wave', 'cheer', 'cower', 'lookAround', 'umbrella', 'carry', 'sunbathe', 'dance', 'smoke', 'point', 'handsUp', 'injured', 'handcuffed'];
const ACT = new Float32Array(HPX + 3), ADD = new Float32Array(HPX + 3), MASK = new Float32Array(NB);
const AXO = { leg: 0, hw: 0, hy: 0.94, hx: 0, hz: 0, root: 0, rax: -1, raz: 0, roll: 0, pz: 0, prop: '', slot: '', expr: '', fx: 0 }; // what the running activity asks of the pelvis, the root and the props
const AC = { seed: 0, fem: false, lod: 0, yaw: 0, gx: 0, gz: 0, wr: 0 }; // the person the activity is evaluated for (set by the rig before every call)
const ap = (i, x, y, z, m) => { const k = i * 3; ACT[k] = x; ACT[k + 1] = y; ACT[k + 2] = z; MASK[i] = m === undefined ? 1 : m; }; // absolute target for a bone, with its influence
const ad = (i, x, y, z) => { const k = i * 3; ADD[k] += x; ADD[k + 1] += y; ADD[k + 2] += z; }; // an additive offset (bounces, sways) on top of whatever the pose layer has
// arm poses solved against the skeleton with an offline search (palm centre at the target, palm and fingers oriented): [upper arm x, y, z, fore arm x, hand x, y, z] for the RIGHT arm; the left arm is the mirror image (x, -y, -z)
const AP = {
  ear: [-1.309, 0.106, -0.432, -2.53, -0.503, 0.101, -0.352], read: [-0.154, -0.071, 0.224, -1.473, 0.179, -0.9, 0.7], readSup: [-0.214, 0.327, 0.124, -1.18, 0.476, -0.9, 0.7], umbrella: [-0.013, 0.015, -0.293, -1.383, -0.158, 0.21, -0.007], cowerA: [-1.924, 0.518, -0.559, -2.298, -0.9, 0.604, -0.45],
  wave: [-1.418, 0.46, -1.499, -1.467, 0.337, -0.131, -0.152], up: [-1.326, 0.464, -1.589, -1.702, 0.514, -0.302, -0.222], cheer: [-1.176, 0.953, -1.799, -0.062, -0.126, 0.861, -0.141], carry: [0.029, 0.417, -0.334, -1.15, -0.45, -0.321, -0.426],
  cuff: [0.884, 1.151, -0.338, -0.814, -0.196, -0.847, -0.7], mouth: [-1.292, 0.659, 0.21, -2.63, 0.9, -0.866, -0.7], akimbo: [0.957, 0.502, -0.665, -1.221, -0.9, -0.267, -0.7], clutch: [0.3, 0.687, -0.351, -1.426, -0.872, -0.572, 0.651],
  gestA: [-0.001, -0.068, -0.151, -1.856, 0.118, -0.9, -0.021], gestB: [-0.217, 0.279, -0.232, -2.062, 0.371, -0.197, -0.296], danceUp: [-1.614, 1.105, -1.523, -0.416, -0.045, -0.077, 0.076], danceMid: [-0.159, 0.029, -0.348, -2.009, 0.257, -0.25, -0.086],
  lap: [0.242, 0.222, -0.205, -1.285, 0.149, -0.9, 0.626], rest: [0, 0, -0.1, -0.12, 0, 0, 0], low: [-0.35, 0.2, -0.12, -1.0, 0, 0, 0], bag: [-0.1, 0, -0.1, -0.25, 0, 0, 0],
};
const _qa7 = new Float32Array(7);
function arm(side, q, m, q2, k) { // side +1 left, -1 right; with q2 the pose is the blend q -> q2 by k
  const r = side < 0, s = r ? 1 : -1; let a = q;
  if (q2) { for (let i = 0; i < 7; i++) _qa7[i] = q[i] + (q2[i] - q[i]) * k; a = _qa7; }
  ap(r ? UA_R : UA_L, a[0], s * a[1], s * a[2], m); ap(r ? FA_R : FA_L, a[3], 0, 0, m); ap(r ? HD_R : HD_L, a[4], s * a[5], s * a[6], m);
}
function fist(side, c, m) { const r = side < 0, k = side; ap(r ? FG_R : FG_L, 0, 0, -k * c * 0.95, m); ap(r ? FGT_R : FGT_L, 0, 0, -k * c * 1.1, m); ap(r ? TB_R : TB_L, 0, 0, -k * Math.max(0, c - 0.3) * 0.5, m); }
// two-bone arm IK in the frame of the chest: the wrist at (tx, ty, tz) from the shoulder, the elbow towards the pole (px, py, pz); the result (upper arm x y z, fore arm x) is left in _AI.
// R maps the arm's local axes onto the solution: -y -> the upper arm, +z -> the direction the elbow folds towards; it is turned into the XYZ Euler angles of the bone.
const _AI = new Float32Array(4);
function armIK(tx, ty, tz, px, py, pz) {
  const L1 = 0.29, L2 = 0.25, D = Math.hypot(tx, ty, tz) || 1e-4, Dc = Math.min(L1 + L2 - 0.004, Math.max(0.12, D)), ux = tx / D, uy = ty / D, uz = tz / D;
  const a = (L1 * L1 - L2 * L2 + Dc * Dc) / (2 * Dc), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), dp = px * ux + py * uy + pz * uz;
  let qx = px - dp * ux, qy = py - dp * uy, qz = pz - dp * uz; const ql = Math.hypot(qx, qy, qz) || 1; qx /= ql; qy /= ql; qz /= ql;
  const ex = ux * a + qx * h, ey = uy * a + qy * h, ez = uz * a + qz * h, d1x = ex / L1, d1y = ey / L1, d1z = ez / L1;
  const d2x = (ux * Dc - ex) / L2, d2y = (uy * Dc - ey) / L2, d2z = (uz * Dc - ez) / L2, cf = clamp(d1x * d2x + d1y * d2y + d1z * d2z, -1, 1);
  let wx = d2x - cf * d1x, wy = d2y - cf * d1y, wz = d2z - cf * d1z, wl = Math.hypot(wx, wy, wz); if (wl < 1e-3) { wx = qx; wy = qy; wz = qz; wl = 1; } wx /= wl; wy /= wl; wz /= wl;
  const Xx = -(d1y * wz - d1z * wy), Yx = -d1x, Zx = wx, Zy = wy, Zz = wz; // columns of R: X = -(d1 x w), Y = -d1, Z = w
  _AI[1] = Math.asin(clamp(Zx, -1, 1)); _AI[0] = Math.atan2(-Zy, Zz); _AI[2] = Math.atan2(-Yx, Xx); _AI[3] = -Math.acos(cf);
}
const sideOf = o => o && o.hand === 'L' ? 1 : -1; // +1 left arm, -1 right arm (the right hand is the default)
const bounce = (t, hz) => 0.5 + 0.5 * Math.sin(t * hz * TAU);
// ---- the activities: (t = seconds since the activity began, o = its options); each writes absolute bone targets (ap), offsets (ad) and the AXO flags ----
const AFN = {
  phone(t, o) {
    const s = sideOf(o), b = Math.sin(t * 0.7 + AC.seed);
    if (o && o.mode === 'read') { // held in front, the head looks down at the screen, thumbs type, the weight shifts
      arm(s, AP.read, 1); arm(-s, AP.readSup, 1); fist(s, 0.55, 1); fist(-s, 0.35, 1);
      const ty = 0.3 + 0.25 * Math.sin(t * 9.1 + 1) * Math.sin(t * 2.3); ap(s < 0 ? TB_R : TB_L, 0, 0, -s * ty, 1);
      ap(HEAD, 0.45 + 0.03 * b, 0.04 * Math.sin(t * 0.4 + AC.seed), 0, 1); ap(NECK, 0.12, 0, 0, 1); ad(CHEST, 0.06, 0, 0); ad(SPINE, 0.04, 0, 0);
    } else { arm(s, AP.ear, 1); fist(s, 0.6, 1); ap(HEAD, -0.03 + 0.03 * b, -s * 0.1, -s * 0.16 - 0.03 * b, 1); ap(NECK, 0, 0, -s * 0.04, 1); ad(CHEST, 0, s * 0.03 * Math.sin(t * 0.5), 0); }
    AXO.slot = s < 0 ? 'hand' : 'handL'; AXO.prop = 'phone';
  },
  talk(t, o) {
    const e = o && o.energy !== undefined ? o.energy : 0.6, sd = AC.seed, a = 0.5 + 0.5 * Math.sin(t * (2.4 + 1.5 * e) + sd), bb = 0.5 + 0.5 * Math.sin(t * 1.7 + sd * 2.3 + 1);
    const on = sstep(-0.35, 0.25, Math.sin(t * 0.55 + sd * 3)); // the right hand gestures in bursts
    arm(-1, AP.rest, 1, AP.gestB, on * (0.5 + 0.5 * e) * (0.6 + 0.4 * a)); ap(UA_R, ACT[UA_R * 3] + 0.12 * a * e, ACT[UA_R * 3 + 1], ACT[UA_R * 3 + 2], 1); ap(FA_R, ACT[FA_R * 3] - 0.3 * a * on * e, 0, 0, 1);
    arm(1, AP.rest, 1, AP.gestA, (1 - on) * 0.55 * bb * e); fist(-1, 0.25 * on, 1); fist(1, 0.2, 1);
    ap(HEAD, 0.04 + 0.07 * Math.sin(t * 2.1 + sd) * (0.5 + e), 0.14 * Math.sin(t * 0.43 + sd), 0.07 * Math.sin(t * 0.31 + sd * 2), 1); ad(CHEST, 0, 0.08 * Math.sin(t * 0.37 + sd * 1.4), 0);
    if (AC.lod === 0 && Math.sin(t * 24 + sd) > 0.2) AXO.expr = 'talk';
  },
  sit(t, o) {
    const h = o && o.h !== undefined ? o.h : 0.46, drop = h + 0.005, fz = Math.max(0.15, 0.46 - 0.8 * Math.max(0, drop - 0.55)), lean = o && o.lean || 0, back = o && o.back ? -0.1 : 0;
    AXO.leg = 1; AXO.hw = 1; AXO.hy = h + 0.105; AXO.hz = o && o.z || 0;
    legIK(fz, drop); ap(TH_L, _IK[0], 0, 0.09); ap(SH_L, _IK[1], 0, 0); legIK(fz + 0.02, drop); ap(TH_R, _IK[0], 0, -0.09); ap(SH_R, _IK[1], 0, 0); ap(FT_L, 0, 0.12, 0); ap(FT_R, 0, -0.12, 0);
    const sp = 0.04 + lean * 0.3 + back, ch = 0.02 + lean * 0.25; ap(SPINE, sp, 0, 0); ap(CHEST, ch, 0, 0); ap(HEAD, -(sp + ch) * 0.85, 0, 0); ap(NECK, 0, 0, 0);
    arm(-1, AP.lap, 1); arm(1, AP.lap, 1); fist(-1, 0.2, 1); fist(1, 0.2, 1); ad(CHEST, 0.012 * Math.sin(AC.seed + t * 1.5), 0, 0);
  },
  wave(t, o) {
    const s = sideOf(o), w = Math.sin(t * 7.5), u = s < 0 ? UA_R : UA_L, f = u + 1, h = u + 2; arm(s, AP.wave, 1);
    ap(u, ACT[u * 3], ACT[u * 3 + 1] + 0.14 * w, ACT[u * 3 + 2], 1); ap(f, ACT[f * 3] + 0.12 * w, 0, 0, 1); ap(h, ACT[h * 3], ACT[h * 3 + 1], ACT[h * 3 + 2] + 0.5 * w, 1); // the upper arm twists, the elbow and the wrist rock: the hand waves
    fist(s, -0.45, 1); ap(HEAD, -0.05, -s * 0.12, -s * 0.1, 1); AXO.expr = 'smile';
  },
  cheer(t, o) {
    const e = o && o.energy !== undefined ? o.energy : 0.8, k = 0.5 + 0.5 * Math.sin(t * (6 + 2 * e)), bn = Math.max(0, Math.sin(t * (6 + 2 * e) * 0.5));
    arm(-1, AP.cheer, 1, AP.danceUp, k); arm(1, AP.cheer, 1, AP.danceUp, 1 - k); fist(-1, 1, 1); fist(1, 1, 1); ap(HEAD, -0.15 - 0.05 * k, 0, 0, 1); ap(CHEST, -0.08, 0, 0, 1);
    ad(TH_L, -0.35 * bn * e, 0, 0); ad(TH_R, -0.35 * bn * e, 0, 0); ad(SH_L, 0.7 * bn * e, 0, 0); ad(SH_R, 0.7 * bn * e, 0, 0); AXO.expr = 'laugh';
  },
  cower(t, o) {
    const sh = 0.012 * Math.sin(t * 19 + AC.seed); AXO.leg = 1;
    ap(TH_L, -1.55, 0, 0.12); ap(TH_R, -1.55, 0, -0.12); ap(SH_L, 2.3, 0, 0); ap(SH_R, 2.3, 0, 0); ap(SPINE, 0.62, 0, 0); ap(CHEST, 0.42, 0, 0); ap(NECK, 0.15, 0, 0); ap(HEAD, 0.35, 0, 0);
    arm(-1, AP.cowerA, 1); arm(1, AP.cowerA, 1); fist(-1, 0.8, 1); fist(1, 0.8, 1); ad(CHEST, sh, 0, 0); ad(HEAD, 0, sh * 2, 0); AXO.expr = 'scared';
  },
  lookAround(t, o) {
    const r = o && o.range !== undefined ? o.range : 1.1, a = Math.sin(t * 0.75 + AC.seed), b = Math.sin(t * 0.37 + AC.seed * 2), c = a * (0.75 + 0.25 * b);
    ap(HEAD, 0.04 * b - 0.03, r * c, 0.05 * a, 1); ap(NECK, 0, r * c * 0.35, 0, 1); ad(CHEST, 0, r * c * 0.25, 0); ad(SPINE, 0, r * c * 0.12, 0);
  },
  umbrella(t, o) {
    arm(-1, AP.umbrella, 1); fist(-1, 1.1, 1); ap(HEAD, 0.12 + 0.02 * Math.sin(t * 0.8 + AC.seed), 0, 0.04, 1); AXO.slot = 'hand'; AXO.prop = 'umbrella';
  },
  carry(t, o) {
    if (o && o.kind === 'bag') { arm(-1, AP.bag, 1); fist(-1, 1, 1); AXO.slot = 'hand'; AXO.prop = 'bag'; ad(SPINE, 0, 0, 0.03); ad(HIPS, 0, 0, 0.0); return; }
    arm(-1, AP.carry, 1); arm(1, AP.carry, 1); fist(-1, 0.45, 1); fist(1, 0.45, 1); ap(HEAD, 0.06, 0, 0, 1); ad(CHEST, -0.1, 0, 0); ad(SPINE, -0.05, 0, 0); AXO.slot = 'chest'; AXO.prop = 'box';
  },
  sunbathe(t, o) {
    const belly = o && o.pose === 'belly'; AXO.leg = 1; AXO.root = 1; AXO.rax = belly ? 1 : -1; AXO.raz = 0; AXO.pz = o && o.center === false ? 0 : (belly ? -0.9 : 0.9); AXO.hw = 0;
    const br = Math.sin(t * 1.1 + AC.seed) * 0.012;
    if (belly) { ap(TH_L, -0.05, 0, 0.14); ap(TH_R, -0.03, 0, -0.14); ap(SH_L, 0.1, 0, 0); ap(SH_R, 0.35, 0, 0); ap(FT_L, 0.9, 0, 0); ap(FT_R, 0.9, 0, 0); ap(UA_L, -2.6, 0, 0.35); ap(FA_L, -1.8, 0, 0); ap(UA_R, -2.5, 0, -0.4); ap(FA_R, -1.9, 0, 0); ap(HEAD, -0.55, 0.9, 0); ap(SPINE, -0.12, 0, 0); ap(CHEST, -0.1 + br, 0, 0); }
    else { ap(TH_L, -0.02, 0, 0.1); ap(TH_R, -1.0, 0, -0.16); ap(SH_L, 0.04, 0, 0); ap(SH_R, 1.7, 0, 0); ap(FT_L, 0.3, 0, 0); ap(FT_R, 0.1, 0, 0); ap(UA_L, 0.0, 0, 0.3); ap(FA_L, -0.1, 0, 0); arm(-1, AP.clutch, 1); ap(HEAD, 0.08, 0.35, 0.05); ap(SPINE, 0.03, 0, 0); ap(CHEST, br, 0, 0); }
    fist(-1, 0.1, 1); fist(1, 0.1, 1);
  },
  dance(t, o) {
    const st = o && o.style !== undefined ? o.style | 0 : 0, bpm = o && o.bpm || 118, bt = t * bpm / 60 * Math.PI, b = Math.sin(bt), b2 = Math.sin(bt * 0.5 + 0.4), bh = 0.5 + 0.5 * Math.sin(bt * 2), lf = Math.max(0, b), rt = Math.max(0, -b);
    AXO.leg = 1; AXO.expr = 'smile';
    if (st === 1) { // slow sway: the weight rocks from foot to foot, the hands drift at chest height
      const sw = Math.sin(bt * 0.5); ap(TH_L, -0.12 - 0.22 * Math.max(0, sw), 0, 0.2); ap(TH_R, -0.12 - 0.22 * Math.max(0, -sw), 0, -0.2); ap(SH_L, 0.25 + 0.5 * Math.max(0, sw), 0, 0); ap(SH_R, 0.25 + 0.5 * Math.max(0, -sw), 0, 0);
      ap(HIPS, 0, 0.18 * sw, -0.08 * sw); ap(SPINE, 0.03, -0.1 * sw, 0.06 * sw); ap(CHEST, 0, -0.14 * sw, 0.04 * sw); ap(HEAD, 0.02, 0.1 * sw, -0.12 * sw);
      arm(-1, AP.danceMid, 1, AP.gestB, 0.5 + 0.5 * Math.sin(bt * 0.5 + 1)); arm(1, AP.danceMid, 1, AP.gestB, 0.5 + 0.5 * Math.sin(bt * 0.5 + 3)); fist(-1, 0.3, 1); fist(1, 0.3, 1); return;
    }
    if (st === 2) { // two-step: a side step on every beat, a clap in front
      const sw = Math.sin(bt * 0.5); ap(TH_L, -0.25 - 0.55 * lf, 0, 0.16 + 0.1 * Math.max(0, sw)); ap(TH_R, -0.25 - 0.55 * rt, 0, -0.16 - 0.1 * Math.max(0, -sw)); ap(SH_L, 0.5 + 0.9 * lf, 0, 0); ap(SH_R, 0.5 + 0.9 * rt, 0, 0);
      ap(HIPS, 0, 0.22 * b2, 0.06 * b); ap(SPINE, 0.06 + 0.05 * bh, -0.14 * b2, 0); ap(CHEST, 0.04, -0.16 * b2, 0); ap(HEAD, 0.06 * bh, 0.08 * b2, 0.08 * b);
      const cl = 0.5 + 0.5 * Math.sin(bt * 2 + 0.5); arm(-1, AP.danceMid, 1, AP.carry, 0.15 + 0.7 * cl); arm(1, AP.danceMid, 1, AP.carry, 0.15 + 0.7 * cl); fist(-1, 0.5, 1); fist(1, 0.5, 1); return;
    }
    // party: knees bounce, the hips rock, the arms alternate overhead, the head nods
    ap(TH_L, -0.3 - 0.3 * lf, 0, 0.17); ap(TH_R, -0.3 - 0.3 * rt, 0, -0.17); ap(SH_L, 0.55 + 0.6 * lf, 0, 0); ap(SH_R, 0.55 + 0.6 * rt, 0, 0);
    ap(HIPS, 0, 0.28 * b2, 0.1 * b); ap(SPINE, 0.08 * bh, -0.18 * b2, -0.07 * b); ap(CHEST, 0.05 * bh, -0.2 * b2, 0); ap(HEAD, 0.12 * bh - 0.04, 0.1 * b2, 0.1 * b);
    const ka = sstep(-0.6, 0.6, Math.sin(bt * 0.5)), kb = 1 - ka; arm(-1, AP.danceMid, 1, AP.danceUp, ka * (0.6 + 0.4 * bh)); arm(1, AP.danceMid, 1, AP.danceUp, kb * (0.6 + 0.4 * bh)); fist(-1, 0.8, 1); fist(1, 0.8, 1);
  },
  smoke(t, o) {
    const c = t % 8.5, up = sstep(0.0, 1.0, c) * (1 - sstep(2.8, 3.8, c)), hold = sstep(1.0, 1.4, c) * (1 - sstep(2.4, 2.8, c));
    arm(-1, AP.low, 1, AP.mouth, up); fist(-1, 0.45, 1); ap(HEAD, -0.04 * hold + 0.06 * (1 - up), -0.1 * hold, -0.05 * hold, 1); ad(CHEST, 0.03 * hold, 0, 0);
    arm(1, AP.rest, 1, AP.akimbo, 0.75); fist(1, 0.35, 1); AXO.slot = 'hand'; AXO.prop = 'cig'; AXO.fx = hold; // the tip glows brighter on a drag
  },
  point(t, o) {
    let rel = 0; if (o && o.target) rel = wrapAngle(Math.atan2(o.target.x - AC.gx, o.target.z - AC.gz) - AC.yaw); else if (o && o.yaw !== undefined) rel = o.yaw;
    const s = o && o.hand === 'L' ? 1 : o && o.hand === 'R' ? -1 : rel > 0.1 ? 1 : -1, u = s < 0 ? UA_R : UA_L, tw = clamp(rel * 0.6, -0.9, 0.9), res = rel - tw; // the trunk turns most of the way, the head looks, the arm covers the rest
    ap(CHEST, 0, tw * 0.6, 0); ap(SPINE, 0.02, tw * 0.4, 0); ap(HEAD, -0.04, clamp(res, -1, 1) * 0.8, 0); ap(NECK, 0, clamp(res, -0.6, 0.6) * 0.25, 0);
    ap(u, -1.5, 0, clamp(res, s > 0 ? -0.5 : -1.5, s > 0 ? 1.5 : 0.5)); ap(u + 1, -0.08, 0, 0); ap(u + 2, -0.05, 0, 0); fist(s, -0.3, 1); // with the arm up and forward a rotation about z is the angle off straight ahead
  },
  handsUp(t, o) {
    const tr = 0.012 * Math.sin(t * 17 + AC.seed); arm(-1, AP.up, 1); arm(1, AP.up, 1); fist(-1, -0.4, 1); fist(1, -0.4, 1); ap(HEAD, -0.08 + tr, 0, 0, 1); ad(CHEST, -0.05, 0, 0); AXO.expr = 'scared';
  },
  injured(t, o) {
    const sd = o && o.side === -1 ? -1 : 1, ph = Math.sin(t * 0.9 + AC.seed), ph2 = Math.sin(t * 0.55 + AC.seed * 1.7), gr = sstep(0.2, 0.9, ph2); AXO.leg = 1; AXO.root = 1; AXO.rax = -1; AXO.raz = 0; AXO.roll = sd * (0.45 + 0.12 * ph2); AXO.pz = 0.9; AXO.hw = 0; AXO.expr = 'pained';
    ap(TH_L, -0.9 - 0.2 * ph, 0, 0.12); ap(SH_L, 1.5, 0, 0); ap(TH_R, -0.08 * ph, 0, -0.1); ap(SH_R, 0.15, 0, 0); ap(FT_L, 0.3, 0, 0); ap(FT_R, 0.5, 0, 0);
    arm(-1, AP.clutch, 1); fist(-1, 0.9, 1);
    ap(UA_L, -2.7 + 0.25 * ph2, 0, 0.35 - 0.15 * ph, 1); ap(FA_L, -0.25 - 0.15 * gr, 0, 0, 1); ap(HD_L, 0.2 * ph, 0, 0, 1); fist(1, -0.3 + 0.9 * gr, 1);
    ap(HEAD, 0.25 * gr - 0.1, 0.5 * ph2, 0.18 * ph, 1); ap(SPINE, 0.06 + 0.06 * ph, 0, 0.05 * ph2, 1); ap(CHEST, 0.05 * ph + 0.02 * Math.sin(t * 5.5), 0, 0, 1);
  },
  handcuffed(t, o) {
    arm(-1, AP.cuff, 1); arm(1, AP.cuff, 1); fist(-1, 0.6, 1); fist(1, 0.6, 1); ap(HEAD, 0.12, 0, 0, 1); ad(SPINE, 0.06, 0, 0); ad(CHEST, 0.05, 0, 0);
  },
};
// ---- props: small meshes shared by every person (one geometry per kind), parked on a bone while an activity uses them ----
const propMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.05, side: THREE.DoubleSide });
const glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide }); // the phone screen and the cigarette tip: unlit, brighter than white so the bloom picks them up
const _propGeos = {};
function propGeo(kind) { // { main, glow }: built once, in the frame of the slot (palm centre of a hand: x = palm normal, -y along the fingers, z = up of the hand; the chest bone for a carried box)
  if (_propGeos[kind]) return _propGeos[kind];
  const saved = B; let main = null, glow = null; B = { parts: [], hi: true };
  const flush = gain => { const g = B.parts.length ? mergeSkinned(B.parts) : null; if (g) { g.deleteAttribute('skinIndex'); g.deleteAttribute('skinWeight'); g.deleteAttribute('uv'); g.deleteAttribute('tint'); if (gain) { const K = g.attributes.color.array; for (let i = 0; i < K.length; i++) K[i] *= gain; } } B.parts = []; return g; };
  if (kind === 'phone') {
    box(0, 0.0085, 0.147, 0.072, 0.015, -0.035, 0, 0x14161a); box(0, 0.0095, 0.139, 0.064, 0.0155, -0.035, 0, 0x0d0e11); ball(0, 0.0045, 0.0185, -0.095, 0.0, 0x1b1d22, { seg: [6, 4] });
    main = flush(); box(0, 0.0006, 0.122, 0.058, 0.0205, -0.037, 0, 0x6fb4ff); box(0, 0.0007, 0.02, 0.03, 0.0206, -0.012, 0, 0xcfe6ff); glow = flush(1.8);
  } else if (kind === 'cig') {
    cyl(0, 0.0042, 0.0042, 0.0042, 0.0042, 0.1, 0.0, -0.105, 0.0, 0xeeeae0, { seg: 6, rot: [0, 0, 0] }); cyl(0, 0.0044, 0.0044, 0.0044, 0.0044, 0.022, 0.0, -0.065, 0.0, 0xc98a3c, { seg: 6 });
    main = flush(); ball(0, 0.0048, 0, -0.158, 0, 0xff5a1c, { seg: [6, 4] }); glow = flush(2.4);
  } else if (kind === 'umbrella') {
    cyl(0, 0.006, 0.006, 0.006, 0.006, 0.92, 0, 0, 0.35, 0x2a2c33, { seg: 6, rot: [HALF_PI, 0, 0] }); box(0, 0.016, 0.016, 0.1, 0, 0, -0.1, 0x1b1c20); ring(0, 0.035, 0.035, 0.008, 0.0, 0.0, -0.17, 0x1b1c20, [HALF_PI, 0, 0], { rs: 4, ts: 10, arc: [0, Math.PI] });
    sph(0, 0.58, 0.26, 0.58, 0, 0, 0.62, 0xd33b52, { part: [0, TAU, 0, HALF_PI], seg: [18, 6], rot: [HALF_PI, 0, 0] }); // the canopy: the dome of a unit sphere whose pole is along +z
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; bar(0, 0, 0, 0.88, Math.cos(a) * 0.575, Math.sin(a) * 0.575, 0.62, 0.006, 0x24262b); }
    main = flush();
  } else if (kind === 'box') {
    box(0, 0.36, 0.27, 0.31, 0, 0, 0, 0xb98a56); box(0, 0.364, 0.012, 0.314, 0, 0.13, 0, 0xa87a48); box(0, 0.365, 0.275, 0.05, 0, 0, 0.0, 0xd6b98a); box(0, 0.1, 0.07, 0.004, 0.0, 0.03, 0.157, 0xf4f1ea); box(0, 0.03, 0.03, 0.005, 0.07, 0.03, 0.157, 0x3a6ea5);
    main = flush();
  } else if (kind === 'bag') {
    box(0, 0.2, 0.3, 0.12, 0, -0.2, 0, 0xe8dcc0); box(0, 0.202, 0.03, 0.122, 0, -0.065, 0, 0xcdbf9f); box(0, 0.19, 0.2, 0.004, 0, -0.22, 0.062, 0x2f7d6a); ring(0, 0.045, 0.01, 0.005, 0, -0.03, 0.0, 0x9a8a68, [0, 0, 0], { rs: 4, ts: 10 });
    main = flush();
  }
  B = saved; return (_propGeos[kind] = { main, glow });
}

// ---------- one person's mesh at a level of detail ----------
// LOD 0: fingers, shoe details, 12 radial segments on limbs, ~5k vertices; LOD 1: mitten hands, 9 segments, ~2.7k; LOD 2: 7 segments, no hand or shoe detail, ~1.4k. The body skin is cached and shared by (sex, build, width, LOD);
// only the clothes, the head and the vertex colours are built per person. The head is scaled about the neck (0, 1.5, 0) so the body reads 7.5 heads tall (man) to 7.7 (woman).
export const HEAD_SCALE = { m: 0.925, f: 0.9 };
function buildPersonGeo(look, S, gm, fem, lod) {
  B = { parts: [], hi: lod < 2, fine: lod === 0, lod, lk: 1, S };
  buildBody(look, fem, gm); const mark = B.parts.length; buildHead(look, fem);
  const geo = mergeSkinned(B.parts), tags = []; let vo = 0, vMark = 0; // face parts (UV rewritten by applyFace) and the first head vertex
  B.parts.forEach((p, i) => { if (i === mark) vMark = vo; const c = p.attributes.position.count, t = p.userData && p.userData.tag; if (t) tags.push({ kind: t.kind, start: vo, count: c, local: t.local }); vo += c; });
  const k = fem ? HEAD_SCALE.f : HEAD_SCALE.m, P = geo.attributes.position.array; // the head and everything on it is scaled about the neck; shared (cached) part arrays are never touched, only the merged copy
  for (let j = vMark * 3; j < P.length; j += 3) { P[j] *= k; P[j + 1] = 1.5 + (P[j + 1] - 1.5) * k; P[j + 2] *= k; }
  geo.computeBoundingSphere(); geo.userData.faceTags = tags; applyFace(geo, look); B = { parts: [], hi: true }; return geo;
}
// distance (metres at a 55 degree field of view) where a person drops to LOD 1 (d0) and LOD 2 (d1); best = the finest LOD the quality tier allows
let _empty = null; // a placeholder with nothing to draw, until the real geometry is built
function emptyGeo() {
  if (_empty) return _empty; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(9), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(9), 3));
  g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(12), 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(new Float32Array(12), 4)); g.setIndex(new THREE.BufferAttribute(new Uint16Array(0), 1)); return (_empty = g);
}
const LOD_TIER = { high: { best: 0, d0: 14, d1: 40 }, med: { best: 1, d0: 0, d1: 26 }, low: { best: 1, d0: 0, d1: 10 } };
const _cam = new THREE.Vector3(); let _camOk = false, _fovK = 1, _lodT = 0;
function noteCamera(renderer, scene, cam) { if (cam.isPerspectiveCamera && !(cam.parent && cam.parent.isCubeCamera)) { _cam.setFromMatrixPosition(cam.matrixWorld); _fovK = Math.tan(cam.fov * Math.PI / 360) / 0.52; _camOk = true; } } // set as mesh.onBeforeRender: the last camera that drew a person
// finger curl of one hand: 0 = the relaxed hand the mesh is modelled in, 1 = a firm grip, 1.35 = a fist, negative = open; the thumb tucks in with it (s = +1 left hand, -1 right)
function setHand(fg, ft, tb, s, c) { tset(fg, 0, 0, -s * c * 0.95); tset(ft, 0, 0, -s * c * 1.1); tset(tb, 0, 0, -s * Math.max(0, c - 0.3) * 0.5); }

// Character faces local +z. Pivot at the feet. Returns { group, parts, bones, look, mesh, skeleton, gun, phase, steps, setGun, animate, kick, fall, flinch, setShadow, dispose }.
export function makeCharacter(look) {
  ensureSurfaces(); const q = look.quality || QUALITY, H = look.height || 1, gm = garments(look), fem = !!(look.female || gm.skirtC !== null), stoop = look.elder ? 1 : 0, kind = bodyKind(look), BS = bodySpec(fem, kind.build, kind.res), tier = LOD_TIER[q] || LOD_TIER.high;
  if (look._tone === undefined) look._tone = 0.965 + Math.random() * 0.07; // a stable skin-tone nuance per person
  facePlan(look, fem); if (look.freckles === undefined) look.freckles = col(look.skin).g > 0.38 && Math.random() < 0.28 ? 0.5 + Math.random() * 0.5 : 0; // some light-skinned people are freckled (0 .. 1)
  // level of detail: nothing is built until the first animate (or the first render) knows how far the person is from the camera; then the LOD for that distance is built, and others on demand (see lodUpdate)
  const lodGeo = [null, null, null]; let lod = -1;
  // bones: positions are relative to the parent, so the parent's absolute position is subtracted; arm and leg x come from the body spec
  const list = BONES.map(b => { const bone = new THREE.Bone(); bone.name = b[0]; return bone; }), abs = BONES.map(b => [b[2] * ((b[3] === 'a' ? BS.armX : b[3] === 'l' ? BS.legX : 0) + b[6]), b[4], b[5]]);
  BONES.forEach((b, i) => { const bone = list[i]; if (b[1] < 0) bone.position.set(abs[i][0], abs[i][1], abs[i][2]); else { const p = abs[b[1]]; bone.position.set(abs[i][0] - p[0], abs[i][1] - p[1], abs[i][2] - p[2]); list[b[1]].add(bone); } });
  const bones = {}; list.forEach(b => { bones[b.name] = b; });
  list[HIPS].rotation.order = 'YXZ'; // yaw outermost: strafing, turn lean and pitch compose the way a pelvis does
  list[TH_L].rotation.order = 'YXZ'; list[TH_R].rotation.order = 'YXZ'; // a thigh yaws after it pitches: the gait cancels the pelvis twist so the planted feet travel straight
  const mesh = new THREE.SkinnedMesh(emptyGeo(), charMat); mesh.name = 'character'; mesh.add(list[HIPS]); list[HIPS].updateMatrixWorld(true); mesh.bind(new THREE.Skeleton(list));
  mesh.castShadow = true; mesh.frustumCulled = true; mesh.onBeforeRender = (r, sc, cam) => { noteCamera(r, sc, cam); if (lod < 0) lodUpdate(); }; // the camera of the last render drives the LOD
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 2.0); // fixed: three would otherwise freeze the bind-pose sphere and cull lying poses
  const g = new THREE.Group(); g.add(mesh); g.scale.set(H, H, H);
  const gun = new THREE.Mesh(gunGeo('pistol'), gunMat); gun.visible = false; gun.castShadow = true;
  const hips = bones.hips;
  const parts = { legL: list[TH_L], legR: list[TH_R], torso: list[SPINE], head: list[HEAD], armL: list[UA_L], armR: list[UA_R], gun, hips, chest: list[CHEST], neck: list[NECK], foreArmL: list[FA_L], foreArmR: list[FA_R], handL: list[HD_L], handR: list[HD_R], shinL: list[SH_L], shinR: list[SH_R], footL: list[FT_L], footR: list[FT_R], prop: list[PROP],
    fingersL: list[FG_L], fingersR: list[FG_R], fingerTipL: list[FGT_L], fingerTipR: list[FGT_R], thumbL: list[TB_L], thumbR: list[TB_R] };
  let exHold = 0, blinkT = 1 + Math.random() * 3, blinking = false, wasDead = false;
  const faceRefresh = () => { const gg = lodGeo[lod]; if (gg) applyFace(gg, look); }; // the other LODs are re-tagged when they are next shown (useLod)
  let gunKind = 'pistol', disposed = false, flT = 9, flX = 0, flZ = 0, flHead = false;
  const seed = Math.random() * 6.28;
  const cur = new Float32Array(HPX + 3); // the damped base pose of this person
  const ovKeep = new Float32Array(HPX + 3); // the gait overlay of the last living frame; it fades out over a few frames when the pose changes to dead / ragdoll, so a runner does not freeze its legs with a pop
  // per-person animation state: airborne / landing, arm weights, punch combo, idle weight shift
  const S = { init: false, init2: false, vw: 0, fly: 0, airT: 0, minVy: 0, wasAir: false, landT: 9, airW: 0, back: false, frL: 1, frR: 1, aw: 0, combo: 0, pPrev: 0, lastPunch: -9, side: 1, nextShift: 3 + Math.random() * 3, ovFade: 0, flail: 0, actLeg: 0, ste: 0, mirT: 2 + Math.random() * 4, mirH: 0, mirD: 1, acc: 0, vPrev: 0, br: Math.random() * 6, exert: 0, glT: 1 + Math.random() * 3, glH: 0, glY: 0, glP: 0, glW: 0 };
  // collapse: direction of the fall in the body's own frame (unit vector, x = the character's left), spring of the lagging head / arms, headshot flag
  let fLX = 0, fLZ = -1, fSp = 0, fSv = 0, fHead = false, fRoll = 0, fKind = 'shot', fT = T_FALL, fR0 = 0.25, fR1 = 0.85;

  // ----- activities (see the activity layer above): state, props, blending -----
  let actWant = null, actWantO = null, actName = null, actO = null, actW = 0, actT = 0, actInstant = false, exAct = '', lastSlot = '';
  const slots = {}; // prop meshes by attachment slot: 'hand' (the right palm), 'handL' (the left palm, mirrored), 'chest'
  const SLOT_BONE = { hand: PROP, handL: HD_L, chest: CHEST };
  function propShow(slot, kind) {
    let m = slots[slot];
    if (!kind) { if (m && m.parent) m.parent.remove(m); if (m) m.userData.kind = ''; return; }
    const G = propGeo(kind);
    if (!m) { m = slots[slot] = new THREE.Mesh(G.main, propMat); m.add(new THREE.Mesh(G.main, glowMat)); m.frustumCulled = false; m.children[0].frustumCulled = false; m.userData.kind = ''; }
    if (m.userData.kind !== kind) {
      m.userData.kind = kind; m.geometry = G.main; const gm2 = m.children[0]; gm2.visible = !!G.glow; if (G.glow) gm2.geometry = G.glow; m.castShadow = kind === 'umbrella' || kind === 'box'; m.rotation.set(0, 0, 0); m.position.set(0, 0, 0); m.scale.set(slot === 'handL' ? -1 : 1, 1, 1);
      if (slot === 'handL') m.position.set(-0.016, -0.05, 0); else if (slot === 'chest') m.position.set(0, -0.18, 0.29);
    }
    const bone = list[SLOT_BONE[slot]]; if (m.parent !== bone) bone.add(m);
  }
  const ACT_RATE = { sit: 4, sunbathe: 3, injured: 3, cower: 7, dance: 5 };
  // moves the blend weight: the old activity fades out first, then the new one fades in; returns true while any activity has weight
  function actUpdate(dt) {
    if (actName !== actWant) {
      if (!actName || actW < 0.03 || actInstant) { actName = actWant; actO = actWantO; actT = 0; actW = actName && actInstant ? 1 : 0; actInstant = false; }
      else actW = damp(actW, 0, 10, dt);
    } else if (actName) { actW = damp(actW, 1, ACT_RATE[actName] || 6, dt); if (actW > 0.995) actW = 1; }
    if (actName) actT += dt;
    return !!actName;
  }
  // writes the activity into TG / OV (the pose layer), the pelvis offsets (AXO) and the root; an activity that owns the legs switches the planted-foot gait off
  function applyAct(dt) {
    ACT.fill(0); ADD.fill(0); MASK.fill(0); AXO.leg = 0; AXO.hw = 0; AXO.hx = 0; AXO.hz = 0; AXO.root = 0; AXO.pz = 0; AXO.roll = 0; AXO.prop = ''; AXO.slot = ''; AXO.expr = ''; AXO.fx = 0;
    AC.seed = seed; AC.fem = fem; AC.lod = lod; AC.yaw = g.rotation.y; AC.gx = g.position.x; AC.gz = g.position.z;
    AFN[actName](actT, actO);
    const w = actW;
    for (let i = 0; i < NB; i++) { const m = MASK[i] * w; if (m > 0) { const k = i * 3; for (let j = 0; j < 3; j++) { TG[k + j] += (ACT[k + j] - TG[k + j]) * m; OV[k + j] *= 1 - m; } } }
    for (let k = 0; k < HPX; k++) TG[k] += ADD[k] * w;
    IKW *= 1 - AXO.leg * w; S.actLeg = AXO.leg * w; AXO.hw *= w; AXO.hx *= w; AXO.hz *= w;
    if (AXO.root > 0) { const rw = AXO.root * w; ROOT.on = true; ROOT.solveW = 1 - rw; ROOT.q.setFromAxisAngle(_ra.set(AXO.rax, 0, AXO.raz), HALF_PI * rw); if (AXO.roll) ROOT.q.multiply(_rq.setFromAxisAngle(Y_AXIS, AXO.roll * rw)); ch.lie = rw; AXO.pz *= rw; } else AXO.pz = 0;
    const slot = w > 0.15 ? AXO.slot : ''; if (lastSlot !== slot) { if (lastSlot) propShow(lastSlot, ''); lastSlot = slot; } if (slot) propShow(slot, AXO.prop);
    if (AXO.prop === 'cig' && slots.hand) { const gl = slots.hand.children[0]; gl.scale.setScalar(1 + 0.5 * AXO.fx); }
    const ex = w > 0.5 ? AXO.expr : ''; if (ex !== exAct) { exAct = ex; ch.setExpression(ex || 'neutral'); }
  }
  // the activity has ended: props away, the face back to neutral
  function actClear() { if (lastSlot) { propShow(lastSlot, ''); lastSlot = ''; } if (exAct) { exAct = ''; ch.setExpression('neutral'); } S.actLeg = 0; if (ch.lie > 0 && !ch.dying) ch.lie = 0; }

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
  function startFall(dx, dz, head, deadDir, kind) {
    const yaw = g.rotation.y; let lx, lz;
    if (dx || dz) { lx = dx * Math.cos(yaw) - dz * Math.sin(yaw); lz = dx * Math.sin(yaw) + dz * Math.cos(yaw); } else { lx = (deadDir || 1) * 0.35; lz = -1; }
    const l = Math.hypot(lx, lz) || 1; fLX = lx / l; fLZ = lz / l; fSp = 0; fSv = 0; fHead = !!head;
    // how this person dies: 'shot' (a reflex reach as the ground comes up), 'crumple' (the knees go first, the hands clutch the belly), 'spin' (the hit turns the body half way round before it drops), 'head' (a head shot: limp, quick, no reach)
    fKind = kind === 'shot' || kind === 'crumple' || kind === 'spin' || kind === 'head' ? kind : head ? 'head' : ['shot', 'shot', 'crumple', 'crumple', 'spin'][Math.floor(Math.random() * 5)];
    fT = fKind === 'head' ? 0.38 : fKind === 'crumple' ? 0.6 : T_FALL; fR0 = 0.25; fR1 = 0.85;
    ch.dying = true; ch.fallT = 0; ch.fallDir = fLX > 0 ? 1 : -1; ch.fallKind = fKind;
    let mode = Math.abs(fLZ) >= 0.5 ? (fLZ > 0 ? 'prone' : 'supine') : 'side';
    if (fKind === 'spin' && mode !== 'side') mode = mode === 'prone' ? 'supine' : 'prone'; // half a turn: it lands on the other side
    ch.setSprawl(mode);
    // Pitching about the axis (lz, 0, -lx) leaves the front of a diagonal fall half turned to the side; the body also rolls about its own long axis (its local y, applied before the
    // pitch) so that it ends exactly on its belly (front down), on its back or on its side. Derived from the pitched front vector (-lx lz, -lz, lx^2).
    let roll = mode === 'prone' ? Math.atan2(fLX, fLZ) : mode === 'supine' ? Math.atan2(-fLX, -fLZ) : Math.atan(-fLZ / (Math.abs(fLX) > 1e-3 ? fLX : 1e-3));
    if (fKind === 'spin') { roll += (fLX >= 0 ? 1 : -1) * Math.PI * (mode === 'side' ? 0 : 1); fR0 = 0.0; fR1 = 0.55; }
    else if (mode !== 'side' && SPRAWL[ch.spr].roll) roll += (Math.random() < 0.5 ? -1 : 1) * HALF_PI; // the 'on its side' pose
    fRoll = roll + (Math.random() - 0.5) * 0.1;
  }

  // Dying: 0 - 0.15 s the knees buckle and the pelvis sinks, then the whole body pitches about the feet away from the hit, theta = (pi/2)(t / 0.45)^2 with a 0.06 rad
  // bounce at contact; head and arms lag on a damped spring (k 60, zeta 0.35); the limbs end in one of four sprawl poses (damped, k = 8 in applyPose).
  function poseDead(dt, state) {
    if (!ch.dying) startFall(0, 0, false, state.deadDir);
    const t = (ch.fallT += dt), tm = Math.min(1, t / fT), tb = t - fT, kc = fKind === 'crumple', kh = fKind === 'head', ksp = fKind === 'spin';
    const th = HALF_PI * tm * tm - (tb > 0 ? (kh ? 0.03 : 0.06) * Math.exp(-4 * tb) * Math.abs(Math.sin(tb * 15.7)) : 0);
    ch.lie = Math.sin(th);
    for (let n = dt > 0.03 ? 3 : 1, h = dt / n; n-- > 0;) { fSv += (60 * (th - fSp) - 5.4161 * fSv) * h; fSp += fSv * h; }
    const lag = (fSp - th) * (1 - sstep(0.8, 1.3, t)), ax = fLZ, az = -fLX, wb = kc ? 1 - sstep(0.24, 0.55, t) : 1 - sstep(0.16, 0.42, t), ws = sstep(kc ? 0.45 : 0.3, kc ? 0.8 : 0.62, t), wa = sstep(0, 0.18, t) * (1 - ws) * (kh ? 0.2 : 1);
    fadeOverlay(dt);
    const kb = kc ? 1.45 : kh ? 0.5 : 1; // how far the knees buckle
    tadd(TH_L, -0.72 * wb * kb, 0, 0); tadd(TH_R, -0.72 * wb * kb, 0, 0); tadd(SH_L, 1.4 * wb * kb, 0, 0); tadd(SH_R, 1.4 * wb * kb, 0, 0); tadd(SPINE, 0.12 * wb, 0, 0); // knees buckle
    if (kc) { const wc = sstep(0, 0.25, t) * (1 - ws), q = AP.clutch; for (let k = 0; k < 2; k++) { const sg = k ? 1 : -1, u = k ? UA_R : UA_L; tadd(u, q[0] * wc, sg * q[1] * wc, sg * q[2] * wc); tadd(u + 1, q[3] * wc, 0, 0); tadd(u + 2, q[4] * wc, sg * q[5] * wc, sg * q[6] * wc); } tadd(SPINE, 0.1 * wc, 0, 0); } // the hands clutch the belly
    else if (ksp) { tadd(UA_L, -0.8 * wa, 0, 0.9 * wa); tadd(UA_R, -0.8 * wa, 0, -0.9 * wa); tadd(FA_L, -0.3 * wa, 0, 0); tadd(FA_R, -0.3 * wa, 0, 0); } // the arms are flung out by the spin
    else { tadd(UA_L, -0.45 * wa, 0, 0.35 * wa); tadd(UA_R, -0.45 * wa, 0, -0.35 * wa); tadd(FA_L, -0.5 * wa, 0, 0); tadd(FA_R, -0.5 * wa, 0, 0); } // a reflex reach as the ground comes up
    addSprawl(ws);
    if (fHead) tadd(HEAD, -0.6 * Math.exp(-5 * t), 0, 0); // a head shot throws the head back
    oadd(HEAD, lag * ax, 0, lag * az); oadd(NECK, 0.5 * lag * ax, 0, 0.5 * lag * az); // lag < 0 while the body accelerates: the head stays behind
    oadd(UA_L, 1.5 * lag * ax, 0, 1.5 * lag * az - 0.7 * Math.abs(lag)); oadd(UA_R, 1.5 * lag * ax, 0, 1.5 * lag * az + 0.7 * Math.abs(lag)); oadd(FA_L, 0.8 * lag * ax, 0, 0); oadd(FA_R, 0.8 * lag * ax, 0, 0);
    ROOT.on = true; ROOT.solveW = 1 - sstep(0.15, 0.45, t); ROOT.q.setFromAxisAngle(_ra.set(ax, 0, az), th);
    if (fRoll) ROOT.q.multiply(_rq.setFromAxisAngle(Y_AXIS, fRoll * sstep(fR0, fR1, t)));
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

  // Driving (state.driving, with steer -1..1 (+ = left), throttle -1..1, v, mirror -1..1 to force a mirror check, otherwise one every few seconds at speed): seated on the seat, the feet on the pedals,
  // the hands on the wheel at ten and two and turning with it (arm IK), the head looks into a mirror now and then. The wheel is the vehicle's; this places the hands where it is (centre 0.5 m ahead of the pelvis, 0.38 above it, tilted).
  function poseDrive(dt, state) {
    const st = clamp(state.steer || 0, -1, 1), thr = clamp(state.throttle || 0, -1, 1), spd = state.v || 0, r = 0.12, cr = Math.cos(r), sr = Math.sin(r), hipY = 0.605;
    fadeOverlay(dt); S.ste = damp(S.ste, st, 12, dt); AXO.hw = 1; AXO.hy = hipY;
    legIK(0.5, hipY - 0.02 - 0.17); tset(TH_L, _IK[0], 0, 0.1); tset(SH_L, _IK[1], 0, 0); const g1 = Math.max(0, thr), g2 = Math.max(0, -thr); legIK(0.5 + 0.04 * g1 - 0.03 * g2, hipY - 0.02 - 0.14 + 0.02 * g1 + 0.02 * g2); tset(TH_R, _IK[0], 0, -0.1); tset(SH_R, _IK[1], 0, 0); tset(FT_L, 0, 0.1, 0); tset(FT_R, 0, -0.1, 0);
    S.mirT -= dt; if (S.mirT <= 0) { S.mirT = 4 + Math.random() * 6; S.mirH = 0.9; S.mirD = Math.random() < 0.5 ? 1 : -1; } S.mirH -= dt;
    const mir = state.mirror !== undefined ? state.mirror : S.mirH > 0 && spd > 2 ? S.mirD : 0;
    tset(SPINE, -0.06, -0.12 * mir, 0.03 * S.ste); tset(CHEST, -0.06 + 0.012 * Math.sin(ch.t * 1.57 + seed), -0.1 * mir, 0.02 * S.ste); tset(NECK, 0, 0.3 * mir, 0); tset(HEAD, r - 0.04, 0.55 * mir - 0.1 * S.ste, -0.06 * S.ste);
    const wa = S.ste * 1.5;
    for (let k = 0; k < 2; k++) { // k 0 = the left hand, 1 = the right
      const sd = k ? -1 : 1, a = (k ? 1.047 : -1.047) - wa, wx = -0.19 * Math.sin(a), wy = 0.98 + 0.19 * Math.cos(a) * 0.883, wz = 0.5 + 0.19 * Math.cos(a) * 0.4695; // the grip on the rim
      const shx = sd * BS.armX, shy = hipY + 0.48 * cr, shz = -0.48 * sr; let dx = wx - shx, dy = wy - shy, dz = wz - shz; const dl = Math.hypot(dx, dy, dz) || 1; dx -= 0.05 * dx / dl; dy -= 0.05 * dy / dl; dz -= 0.05 * dz / dl; // the wrist is 5 cm short of the grip
      const cy = dy * cr - dz * sr, cz = dy * sr + dz * cr; // into the frame of the reclined chest
      armIK(dx, cy, cz, sd * 0.45, -1, -0.2); const u = k ? UA_R : UA_L; tset(u, _AI[0], _AI[1], _AI[2]); tset(u + 1, _AI[3], 0, 0); tset(u + 2, -0.25, -sd * 0.55, -sd * 0.25);
      setHand(k ? FG_R : FG_L, k ? FGT_R : FGT_L, k ? TB_R : TB_L, sd, 0.9);
    }
  }
  // Getting up from the ground for a character that stays at its own place (state.rise 0..1: the hospital bed, a fall): lying on the back, the knees come up, the trunk curls up with the hands pushing on the ground,
  // the body pivots about the pelvis into a squat and stands. The pelvis is placed here (ROOT.pelvis); the group origin stays between the feet.
  function poseRise(dt, state) {
    const u = clamp(state.rise, 0, 1), th = HALF_PI * (1 - sstep(0.3, 0.74, u)), sit = sstep(0.0, 0.32, u) * (1 - sstep(0.5, 0.82, u)), sq = sstep(0.12, 0.45, u) * (1 - sstep(0.68, 1, u));
    fadeOverlay(dt); ROOT.on = true; ROOT.pelvis = true; ROOT.solveW = 0; ROOT.q.setFromAxisAngle(_ra.set(-1, 0, 0), th);
    ROOT.py = mixn(mixn(0.13, 0.5, sstep(0.28, 0.7, u)), 0.94, sstep(0.66, 1, u)); ROOT.pz = -0.4 * (1 - sstep(0.12, 0.95, u));
    tset(TH_L, -1.1 - 0.45 * sq, 0, 0.1 * sq); tset(TH_R, -1.1 - 0.45 * sq, 0, -0.1 * sq); tset(SH_L, 1.9 + 0.4 * sq, 0, 0); tset(SH_R, 1.9 + 0.4 * sq, 0, 0);
    const stand = sstep(0.66, 1, u); for (const k of [TH_L, TH_R, SH_L, SH_R]) { TG[k * 3] *= 1 - stand; TG[k * 3 + 2] *= 1 - stand; }
    tset(SPINE, 0.85 * sit + 0.1, 0, 0); tset(CHEST, 0.45 * sit, 0, 0); tset(HEAD, -0.5 * sit + 0.1, 0.1 * (1 - u), 0); tset(NECK, 0.1 * sit, 0, 0);
    const arm = sit * (1 - stand * 0.5); tset(UA_L, 0.55 * arm, 0, ARM_OUT + 0.35 * arm); tset(UA_R, 0.55 * arm, 0, -ARM_OUT - 0.35 * arm); tset(FA_L, -0.12 - 0.25 * sq, 0, 0); tset(FA_R, -0.12 - 0.25 * sq, 0, 0);
    setHand(FG_L, FGT_L, TB_L, 1, 0.2 + 0.3 * sit); setHand(FG_R, FGT_R, TB_R, -1, 0.2 + 0.3 * sit); tset(FT_L, 0, 0.09, 0); tset(FT_R, 0, -0.09, 0);
    if (u > 0.9) { tadd(HEAD, 0, 0.3 * Math.sin((u - 0.9) * 31), 0); } // a last look round
  }
  // Climbing a ledge (state.climb 0..1; the caller lifts the group): reach up and grab, pull the chest to the edge with one knee up, push and stand.
  function poseClimb(dt, state) {
    const u = clamp(state.climb, 0, 1), rc = sstep(0, 0.22, u), pl = sstep(0.2, 0.62, u), st = sstep(0.62, 1, u), sw = Math.sin(ch.t * 9);
    fadeOverlay(dt); IKW = 0;
    tset(UA_L, mixn(mixn(-2.85, -1.3, pl), -0.2, st) * rc, 0, mixn(0.22, 0.45, pl) * rc * (1 - st)); tset(UA_R, mixn(mixn(-2.85, -1.3, pl), -0.2, st) * rc, 0, -mixn(0.22, 0.45, pl) * rc * (1 - st));
    tset(FA_L, mixn(-0.15, -2.3, pl) * (1 - st) - 0.12 * st, 0, 0); tset(FA_R, mixn(-0.15, -2.3, pl) * (1 - st) - 0.12 * st, 0, 0);
    tset(SPINE, 0.12 * pl, 0, 0); tset(CHEST, 0.2 * pl, 0, 0); tset(HEAD, -0.3 * rc * (1 - st), 0, 0);
    tset(TH_L, -0.25 * rc - 1.3 * pl * (1 - st) + 0.1 * sw * rc * (1 - pl), 0, 0.1); tset(SH_L, 0.4 * rc + 1.6 * pl * (1 - st), 0, 0); tset(TH_R, 0.05 + 0.15 * sw * rc * (1 - pl), 0, -0.08); tset(SH_R, 0.3 * rc * (1 - st), 0, 0);
    setHand(FG_L, FGT_L, TB_L, 1, 1.1 * (1 - st)); setHand(FG_R, FGT_R, TB_R, -1, 1.1 * (1 - st));
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

    // ----- gait phase: distance driven (one step per step length of local metres), reversed when backpedalling while aiming; turning on the spot steps the feet round -----
    let dirSign = 1, hyaw = 0;
    if (aim && v > 0.3 && state.moveYaw !== undefined && state.yaw !== undefined) {
      const al = wrapAngle(state.moveYaw - state.yaw) || 0; S.back = Math.abs(al) > (S.back ? 1.75 : 2.05); // about 1.9 rad with hysteresis
      if (S.back) { hyaw = wrapAngle(al - Math.PI); dirSign = -1; } else hyaw = clamp(al, -1, 1);
    } else S.back = false;
    const vL = vw / H, yrA = Math.abs(state.yawRate || 0), tipW = grounded && !air ? (1 - gw) * sstep(0.6, 2.4, yrA) * (1 - S.aw) * (1 - S.actLeg) : 0;
    ch.phase += dirSign * (vL * dt / stepLen(vL) * Math.PI + (1 - sstep(0.15, 0.5, vL)) * tipW * Math.min(yrA, 7) * dt * 1.7); ch.steps = Math.floor(ch.phase / Math.PI);
    const cyc = ((ch.phase / TAU) % 1 + 1) % 1, cs = Math.cos(ch.phase), sn = Math.sin(ch.phase - 0.4);
    S.aw = damp(S.aw, aim ? 1 : 0, 20, dt);

    // ----- legs: planted-foot IK (see gaitSolve); the old pose layer keeps the legs only when standing, in the air or inside an activity -----
    IKW = Math.max(sstep(0.04, 0.4, vw), tipW) * (1 - S.airW) * (1 - S.actLeg);
    const dipK = lf * 0.1;
    if (IKW > 0.002) { gaitSolve(cyc, Math.max(vL, 0.0), wr, ws, mixn(0.2, 1, sstep(0.05, 1.1, vL)), dipK); IKHIP = 1; FWV[0] = GO.fw[0]; FWV[1] = GO.fw[1]; } else IKHIP = 0;
    if (lf > 0) { const k = lf * (1 - IKW); oadd(TH_L, -0.5 * k, 0, 0); oadd(TH_R, -0.5 * k, 0, 0); oadd(SH_L, k, 0, 0); oadd(SH_R, k, 0, 0); }
    S.fly = 0;
    // ----- pelvis (overlay): twist with the stride, weight shift to the stance side, small roll; the chest counter-twists (fully while aiming) -----
    const tw = gaitW * g3(GT.twist, wr, ws);
    const swayX = (fem ? 0.035 : 0.02) * gaitW * sn;
    oadd(HIPS, 0, -tw * cs, gaitW * g3(GT.roll, wr, ws) * sn); OV[HPX] += swayX;
    if (IKHIP) { oadd(TH_L, 0, tw * cs, -1.1 * swayX); oadd(TH_R, 0, tw * cs, -1.1 * swayX); } // the legs undo the pelvis twist and sway: the planted feet stay where they are
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
    S.acc = dt > 1e-5 ? damp(S.acc, clamp((vw - S.vPrev) / dt, -30, 30), 7, dt) : S.acc; S.vPrev = vw; // smoothed acceleration (m/s^2): the body leans into a start and back into a stop
    const accL = grounded ? clamp(S.acc * 0.02, -0.1, 0.16) * (1 - S.aw) : 0;
    S.br += dt * (1.57 + 4.6 * sstep(0.5, 7, vw) + 1.5 * S.exert); S.exert = Math.max(0, S.exert - dt * 0.05); // breathing: 0.25 Hz at rest, faster and deeper with speed and after a long run
    const breath = Math.sin(S.br + seed), bAmp = (0.016 + 0.034 * sstep(2, 8, vw)) * (1 - 0.6 * S.aw);
    if (vw > 5) S.exert = Math.min(1, S.exert + dt * 0.12);
    let spx = 0.6 * lean + 0.5 * accL, chx = 0.4 * lean + 0.5 * accL + breath * bAmp, hdx = -0.55 * lean - 0.55 * accL - breath * bAmp * 0.4;
    spx += 0.15 * stoop; hdx -= 0.12 * stoop; // an elderly person stoops (spine 0.15 rad) and lifts the head to look ahead
    const spy = -0.5 * hyaw; let chy = spy; // spine and chest each take half of the hips' strafe yaw back, so the upper body keeps facing the aim direction
    if (aimGun) { chx -= 0.4 * aimP; hdx -= 0.5 * aimP; }
    const tp = spx + chx; // torso pitch the arm has to compensate
    flT += dt; const fe = flT < 0.7 ? Math.exp(-10 * flT) : 0;
    spx += flZ * 0.14 * fe - rec * 0.1; chx += flZ * 0.21 * fe - rec * 0.25; hdx += (flHead ? 0.5 : 0.12) * flZ * fe; // chest pitch away from the hit: 0.35 * e^(-10 t) in total
    // the head stays level while the body bobs (the pelvis bob and the stride pitch it by a fraction of what the spine does), and it looks around: a glance every few seconds, a sweep when idle for long
    S.glT -= dt; if (S.glT <= 0) { S.glT = 2.2 + Math.random() * 5.5; S.glH = 0.6 + Math.random() * 1.1; S.glY = (Math.random() - 0.5) * 1.5 * (Math.random() < 0.35 ? 0.25 : 1); S.glP = (Math.random() - 0.5) * 0.3; }
    S.glW = damp(S.glW, S.glH > 0 ? 1 : 0, 6, dt); S.glH -= dt;
    let hdy = idleW * 0.05 * Math.sin(ch.t * 0.5 + seed * 2) + S.glW * S.glY * (1 - S.aw) * (0.5 + 0.5 * idle), nky = 0, hdz = S.glW * 0.2 * S.glY * idle; const la = state.lookAt;
    hdx += S.glW * S.glP * (1 - S.aw);
    const yrL = clamp(state.yawRate || 0, -8, 8) * (grounded ? 1 : 0.3) * (1 - S.aw); hdy += clamp(yrL * 0.14, -0.5, 0.5); nky += clamp(yrL * 0.04, -0.15, 0.15); // turning: the head leads, the neck follows, then the body
    if (la && !aim) { // look at the point, up to 1 rad (a point behind the person is ignored)
      const rel = wrapAngle(Math.atan2(la.x - g.position.x, la.z - g.position.z) - (state.yaw !== undefined ? state.yaw : g.rotation.y));
      if (Math.abs(rel) < 2.4) { const hy = clamp(rel, -1, 1); nky = hy * 0.3; hdy = hy * 0.7; hdz = 0; }
    }
    tadd(SPINE, 0, 0, 0.55 * roll); tadd(CHEST, 0, 0, 0.3 * roll); hdz -= 0.5 * 1.85 * roll; // lean into a turn: the roll spreads over pelvis, spine and chest and the head comes back to level
    tset(FT_L, 0, 0.09, 0); tset(FT_R, 0, -0.09, 0); // a little toe-out

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
    if (punch > 0 && S.pPrev <= 0 && !bat && !gren) S.combo = ch.t - S.lastPunch < 1.15 ? (S.combo + 1) % 4 : 0; // a new swing within 1.15 s of the last continues the combination: jab, cross, hook, kick
    if (punch > 0) S.lastPunch = ch.t; S.pPrev = punch;
    let kickW = 0;
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
      } else if (S.combo === 3) { // front kick with the right leg: the knee comes up (0 - 0.16), the shin snaps out (0.16 - 0.3), the leg returns; the hands guard, the trunk leans back
        const c1 = sstep(0, 0.16, p), ex = sstep(0.16, 0.3, p), rc = sstep(0.34, 0.85, p); kickW = c1 * (1 - rc);
        tset(TH_R, mixn(mixn(0, -1.45, c1), -1.6, ex) * (1 - rc), 0, -0.12 * kickW); tset(SH_R, mixn(mixn(0, 1.9, c1), 0.12, ex) * (1 - rc), 0, 0); tset(FT_R, 0.3 * kickW, 0, 0);
        urx = mixn(urx, -0.95, kickW); urz = mixn(urz, -0.3, kickW); frx = mixn(frx, -1.4, kickW); ulx = mixn(ulx, -0.95, kickW); ulz = mixn(ulz, -0.3, kickW); flx = mixn(flx, -1.4, kickW); spx -= 0.17 * kickW; chx -= 0.12 * kickW; hdx += 0.2 * kickW; chy += 0.25 * ex * (1 - rc);
      } else if (S.combo === 2) { // right hook: the trunk winds up to the right and whips across with the elbow out
        const c1 = sstep(0, 0.16, p), ex = sstep(0.16, 0.3, p), rc = sstep(0.3, 1, p), w2 = c1 * (1 - rc);
        urx = mixn(urx, -0.3, w2); urz = mixn(urz, -1.25, w2); frx = mixn(frx, -1.5, w2); ulx = mixn(ulx, -0.9, w2); ulz = mixn(ulz, -0.28, w2); flx = mixn(flx, -1.3, w2);
        chy += mixn(mixn(0, -0.6, c1), 0.95, ex) * (1 - rc); spx += 0.06 * w2;
      } else { // jab / cross: chamber (0 - 0.12), extend (0.12 - 0.22), recover; the arms alternate, the other one guards
        const R = S.combo % 2 === 0, c1 = sstep(0, 0.12, p), ex = sstep(0.12, 0.22, p), rc = sstep(0.22, 1, p), gw2 = c1 * (1 - rc);
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
    IKW *= 1 - kickW; // a kick owns the legs
    tset(UA_L, ulx, 0, ulz); tset(FA_L, flx, 0, flz); tset(UA_R, urx, 0, urz); tset(FA_R, frx, 0, frz);
    tset(PROP, 0, (aimGun ? (long ? 0.15 : 0.1) : 0) + tilt * 0.6, 0); // roll: cancels the tilt the bladed arm puts on an aimed gun; canted in a reload
    // hands: relaxed (jogging closes them half way), a grip round the gun / bat / grenade, fists for a punch, the left hand holds the magazine in a reload
    let hl = 0.35 * wr * gw, hr = hl;
    if (armed) { if (bat) { hr = 1.15; if (aim || punch > 0) hl = 1.15; } else if (gren) hr = 0.95; else if (long) { hr = 1.0; hl = 0.85; } else { hr = 1.1; if (aimGun) hl = 0.9; } }
    if (punch > 0 && !bat && !gren) hl = hr = 1.3;
    if (reload >= 0) hl = Math.max(hl, 0.75);
    setHand(FG_L, FGT_L, TB_L, 1, hl); setHand(FG_R, FGT_R, TB_R, -1, hr);
    // fold the torso and head targets in (spine/chest yaw also carries the counter-rotation of the hips)
    tadd(SPINE, spx, spy, 0); tadd(CHEST, chx, chy, 0); tset(NECK, 0, nky, 0); tset(HEAD, hdx, hdy, hdz);
    tadd(SPINE, 0, 0, -flX * 0.14 * fe); tadd(CHEST, 0, 0, -flX * 0.21 * fe); if (flHead) tadd(HEAD, 0, 0, -flX * 0.25 * fe); tadd(TH_L, -0.1 * fe, 0, 0); tadd(TH_R, -0.1 * fe, 0, 0); tadd(SH_L, 0.2 * fe, 0, 0); tadd(SH_R, 0.2 * fe, 0, 0); // roll away from the hit, a head shot also rolls the head; the knees dip (the pelvis follows the feet)
    tadd(UA_L, -0.3 * fe, 0, 0.35 * fe); tadd(UA_R, -0.3 * fe, 0, -0.35 * fe); tadd(FA_L, -0.25 * fe, 0, 0); tadd(FA_R, -0.25 * fe, 0, 0); if (flX !== 0) tadd(flX > 0 ? UA_R : UA_L, -0.45 * fe, 0, 0); // a hit throws the arms out; the arm nearest the blow jerks up
    const door = state.door || 0; // getting into / out of a vehicle: the trunk ducks, the knees give, one hand reaches for the frame
    if (door > 0) { IKW *= 1 - door; tadd(SPINE, 0.32 * door, 0, 0); tadd(CHEST, 0.2 * door, 0, 0); tadd(HEAD, -0.3 * door, 0, 0); tadd(TH_L, -0.6 * door, 0, 0.05); tadd(TH_R, -0.6 * door, 0, -0.05); tadd(SH_L, 1.0 * door, 0, 0); tadd(SH_R, 1.0 * door, 0, 0); tadd(UA_R, -1.0 * door, 0, -0.35 * door); tadd(FA_R, -0.5 * door, 0, 0); tadd(UA_L, 0.3 * door, 0, 0.2 * door); }
    // stance legs when airborne: one knee up, one trailing
    if (air) { tset(TH_L, -0.5, 0, 0.02); tset(TH_R, 0.15, 0, -0.02); tset(SH_L, 1, 0, 0); tset(SH_R, 0.4, 0, 0); }
    return true;
  }

  // Damps the base pose toward TG, adds the gait overlay, writes the bones, levels the feet and (when `solve`) puts the pelvis where the lowest foot touches y = 0.
  function applyPose(dt, kU, kL, snap, solve, autoFoot) {
    const fU = snap ? 1 : 1 - Math.exp(-kU * dt), fL = snap ? 1 : 1 - Math.exp(-kL * dt);
    for (let i = 0; i < NB; i++) {
      const k = i * 3, f = i === HIPS || i >= TH_L && i <= FT_R ? fL : fU;
      cur[k] += (TG[k] - cur[k]) * f; cur[k + 1] += (i === HIPS ? wrapAngle(TG[k + 1] - cur[k + 1]) : TG[k + 1] - cur[k + 1]) * f; cur[k + 2] += (TG[k + 2] - cur[k + 2]) * f;
      list[i].rotation.set(cur[k] + OV[k], cur[k + 1] + OV[k + 1], cur[k + 2] + OV[k + 2]);
    }
    for (let c = 0; c < 3; c++) cur[HPX + c] += (TG[HPX + c] - cur[HPX + c]) * fL;
    const hx = cur[HIPS * 3] + OV[HIPS * 3], hz = cur[HIPS * 3 + 2] + OV[HIPS * 3 + 2]; let reach = 0;
    for (let l = 0; l < 2; l++) { // feet stay level with the ground (80 % of the leg tilt is cancelled; the toes drop at push-off), reach = how far the sole hangs below the hip
      const L = LEGS[l], kt = L[0] * 3, ks = L[1] * 3, kf = L[2] * 3;
      if (IKW > 0) { // the gait owns the leg: thigh and knee come from the IK, blended with the pose layer by IKW; the damped state follows so the pose layer resumes from where the IK left it
        const tx = mixn(cur[kt] + OV[kt], GO.th[l] - hx, IKW), sx = mixn(cur[ks] + OV[ks], GO.sh[l], IKW); list[L[0]].rotation.x = tx; list[L[1]].rotation.x = sx; cur[kt] = tx - OV[kt]; cur[ks] = sx - OV[ks];
      }
      const a = hx + cur[kt] + OV[kt], s = a + cur[ks] + OV[ks];
      let fx = autoFoot ? -0.8 * s : cur[kf] + OV[kf]; if (autoFoot) { if (IKW > 0) fx = mixn(fx, FWV[l] - s, IKW); list[L[2]].rotation.x = fx; cur[kf] = fx - OV[kf]; } // the damped state follows the levelled foot, so a death / ragdoll / get-up pose starts from the real angle
      if (solve) reach = Math.max(reach, legReach(a, s, s + fx));
    }
    let hy = solve ? mixn(reach * Math.cos(hz) + HIP_DROP + S.fly, REST_HIPS_Y, S.airW) : REST_HIPS_Y;
    if (IKW > 0 && IKHIP) hy = mixn(hy, Math.max(GO.hp + HIP_DROP, solve ? reach * Math.cos(hz) + HIP_DROP : 0), IKW); // the gait sets the pelvis height (bob, flight); a foot is never allowed below the ground
    if (ROOT.on) hy = mixn(REST_HIPS_Y, hy, ROOT.solveW); // dying: the feet carry the pelvis only while the knees buckle
    if (AXO.hw > 0) hy = mixn(hy, AXO.hy, AXO.hw); // sitting: the pelvis rests on the seat
    hips.position.set(cur[HPX] + OV[HPX] + AXO.hx, hy + cur[HPX + 1] + OV[HPX + 1], cur[HPX + 2] + OV[HPX + 2] + AXO.hz);
    if (ROOT.on) { hips.quaternion.premultiply(ROOT.q); hips.position.applyQuaternion(ROOT.q); hips.position.y += 0.13 * ch.lie; hips.position.z += AXO.pz; if (ROOT.pelvis) hips.position.set(0, ROOT.py, ROOT.pz); } // the whole body pivots about the feet (the origin of the group); a lying body's thickness lifts it off the ground
  }

  // swap the mesh to LOD l (built now when missing); the LOD two steps away is freed so a person keeps at most two geometries
  function useLod(l) {
    if (!lodGeo[l]) lodGeo[l] = buildPersonGeo(look, BS, gm, fem, l);
    lod = l; if (lodGeo[l].userData.faceTags) applyFace(lodGeo[l], look); mesh.geometry = lodGeo[l]; for (let i = 0; i < 3; i++) if (lodGeo[i] && Math.abs(i - l) > 1) { lodGeo[i].dispose(); lodGeo[i] = null; }
  }
  // distance LOD with 10 % hysteresis; at most one new far LOD is built every 2.5 ms across all people (a person within 14 m is built at once), so a crowd crossing a threshold together does not hitch
  function lodUpdate() {
    if (!ch.autoLod) { if (lod < 0) useLod(tier.best); return; }
    if (!_camOk) { if (lod < 0) useLod(tier.best); return; }
    const dx = g.position.x - _cam.x, dy = g.position.y + 1 - _cam.y, dz = g.position.z - _cam.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz) * _fovK;
    const w = Math.max(tier.best, d < tier.d0 * (lod === 0 ? 1.1 : 0.9) ? 0 : d < tier.d1 * (lod <= 1 ? 1.1 : 0.9) ? 1 : 2);
    if (w !== lod) { if (lodGeo[w] || d < 14) useLod(w); else if (performance.now() - _lodT > 2.5) { useLod(w); _lodT = performance.now(); } } // the window starts when a build ends, so the next far build waits 2.5 ms after it
  }
  const ch = { group: g, parts, bones, look, mesh, skeleton: mesh.skeleton, gun, autoLod: true, phase: 0, steps: 0, t: 0, rec: 0, dying: false, fallT: 0, fallDir: 1, lie: 0, spr: 0, sprProne: false,
    setGun(v, kind) {
      gun.visible = !!v; if (v) { if (!gun.parent) bones.prop.add(gun); } else if (gun.parent) gun.parent.remove(gun); // a hidden item leaves the hierarchy (no matrix updates, and it never counts in a bounding box)
      const k = GUN_POSE[kind] ? kind : 'pistol'; gunKind = k; gun.geometry = gunGeo(k);
      const p = GUN_POSE[k]; gun.position.set(p[0], p[1], p[2]); gun.rotation.set(p[3], p[4], p[5]);
    },
    // recoil impulse in radians: raises the muzzle and rocks the torso back, decays by itself (k = 14)
    kick(a) { ch.rec = Math.min(0.6, ch.rec + (a === undefined ? 0.1 : a)); },
    // Start the collapse. (dx, dz) is the world direction the hit travelled: the body pitches about the feet that way (knees buckle first, head and arms lag on a spring,
    // then one of four sprawl poses; the lag rings out by about 1.3 s). A head shot throws the head back. Without a direction the person goes down backwards. animate({ dead: true }) continues it.
    fall(dx, dz, head, kind) { if (!ch.dying) startFall(dx, dz, head, 1, kind); },
    // Brief hit reaction on a standing person: chest pitch / roll away from the hit of 0.35 * e^(-10 t) rad, a head snap (0.5 rad on a head shot) and a small knee dip.
    // (The 0.15 m stagger is a position change and belongs to the caller.)
    flinch(dx, dz, headShot) { if (!wasDead) ch.setExpression('pained', 0.7); const yaw = g.rotation.y, lx = (dx || 0) * Math.cos(yaw) - (dz || 0) * Math.sin(yaw), lz = (dx || 0) * Math.sin(yaw) + (dz || 0) * Math.cos(yaw), l = Math.hypot(lx, lz) || 1; flX = lx / l; flZ = lz / l; flHead = !!headShot; flT = 0; },
    // chooses the settled lying pose for a body that ended 'supine' (on its back), 'prone' (face down) or on its 'side' ('flat' leaves out the poses that roll the body onto its side)
    setSprawl(mode, flat) { ch.sprProne = mode === 'prone'; const l = (flat ? SPRAWL_FLAT : SPRAWL_BY)[mode] || SPRAWL_BY.supine; ch.spr = l[Math.floor(Math.random() * l.length)]; },
    // the lowest world y of the posed mesh (every vertex, skinned; one pass over ~2.5k vertices, meant to be called once when a body has come to rest)
    lowestY() {
      if (lod < 0) useLod(tier.best); g.updateMatrixWorld(true); const bi = mesh.skeleton.boneInverses;
      for (let i = 0; i < NB; i++) { _lm.multiplyMatrices(list[i].matrixWorld, bi[i]); const e = _lm.elements; _ly[i * 4] = e[1]; _ly[i * 4 + 1] = e[5]; _ly[i * 4 + 2] = e[9]; _ly[i * 4 + 3] = e[13]; }
      const A = mesh.geometry.attributes, P = A.position.array, SI = A.skinIndex.array, SW = A.skinWeight.array, n = A.position.count; let lo = Infinity;
      for (let v = 0; v < n; v++) {
        const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2]; let Y = 0;
        for (let k = 0; k < 4; k++) { const w = SW[v * 4 + k]; if (w > 0) { const b = SI[v * 4 + k] * 4; Y += w * (_ly[b] * x + _ly[b + 1] * y + _ly[b + 2] * z + _ly[b + 3]); } }
        if (Y < lo) lo = Y;
      }
      if (gun.parent) { const e = gun.matrixWorld.elements, GP = gun.geometry.attributes.position.array; for (let v = 0; v < GP.length; v += 3) { const Y = e[1] * GP[v] + e[5] * GP[v + 1] + e[9] * GP[v + 2] + e[13]; if (Y < lo) lo = Y; } } // a held item counts too
      return lo;
    },
    // force a level of detail (0 finest .. 2 coarsest) and stop the automatic distance selection; ch.autoLod = true resumes it
    setLod(l) { ch.autoLod = false; useLod(clamp(Math.round(l), 0, 2)); },
    get lod() { return lod; },
    // builds the geometry now (the first animate or render does it otherwise)
    ready() { if (lod < 0) lodUpdate(); return ch; },
    // ACTIVITIES (documented above the activity layer): rig.setActivity(name, opts), rig.activity, rig.activityWeight, rig.props (the prop meshes by slot)
    setActivity(name, opts) { if (name === null || name === undefined || name === 'none') { actWant = null; actWantO = null; return ch; } if (!AFN[name]) return ch; actWant = name; actWantO = opts || null; if (opts && opts.instant) actInstant = true; return ch; },
    get activity() { return actWant; },
    get activityWeight() { return actName ? actW : 0; },
    props: slots,
    setShadow(on) { mesh.castShadow = !!on; gun.castShadow = !!on; },
    // FACE: expression 'neutral' | 'smile' | 'angry' | 'scared' | 'pained' | 'dead' | 'talk' | 'laugh' (or its index). Only the UVs of the face and eye vertices change (a texture cell), no geometry is rebuilt; hold > 0 returns to neutral after that many seconds.
    setExpression(name, hold) { const i = typeof name === 'number' ? name : EXPRS.indexOf(name); if (i < 0 || i >= EXPRS.length) return ch; exHold = hold > 0 ? hold : 0; if (i !== (look._ex | 0)) { look._ex = i; look._es = blinking ? 4 : EYE_OF[i]; faceRefresh(); } return ch; },
    get expression() { return EXPRS[look._ex | 0]; },
    // close (true) or open the eyes by hand (a blink does this by itself near the camera)
    setBlink(on) { const e = on ? 4 : EYE_OF[look._ex | 0]; if (e !== look._es) { look._es = e; faceRefresh(); } return ch; },
    // state: { v (m/s, absolute), grounded, vy, moveYaw, yaw, yawRate, aiming, aimPitch (rad, positive = up), long, punch 0..1, melee 'fist'|'bat',
    //          reload 0..1 or -1, dead, deadDir, sitting, lookAt {x, z}, rag (0 none, 1 flying ragdoll, 2 limp ragdoll), getUp (0..1 while rising from the ground) }.
    //          The old keys { moving, speed (0..1), pitch } still work when v / aimPitch are absent.
    animate(dt, state) {
      if (!g.visible || !mesh.visible) { S.init = false; return; } // nobody sees this person: no pose work (the next visible frame snaps to the pose)
      lodUpdate(); dt = dt > 0 ? Math.min(dt, 0.1) : 0; ch.t += dt;
      if (!!state.dead !== wasDead) { wasDead = !!state.dead; ch.setExpression(wasDead ? 'dead' : 'neutral'); } // a dead face is a dead face
      else if (state.expression !== undefined && !wasDead && state.expression !== EXPRS[look._ex | 0] && !exHold) ch.setExpression(state.expression);
      if (exHold > 0 && (exHold -= dt) <= 0) ch.setExpression(state.expression || 'neutral');
      if (lod === 0 && !wasDead) { blinkT -= dt; if (blinkT <= 0) { blinking = !blinking; blinkT = blinking ? 0.13 : 2.2 + Math.random() * 4.5; ch.setBlink(blinking); } } // eyes blink at close range
      TG.fill(0); OV.fill(0); ROOT.on = false; ROOT.pelvis = false; IKW = 0; IKHIP = 0; AXO.hw = 0; AXO.hx = 0; AXO.hz = 0; AXO.pz = 0; ch.rec *= Math.exp(-14 * dt);
      let snap = false; if (!S.init) { S.init = true; snap = true; }
      if ((state.dead || state.rag) && lastSlot) { propShow(lastSlot, ''); lastSlot = ''; }
      if (state.dead && !state.rag) { poseDead(dt, state); applyPose(dt, 8, 8, snap, true, false); return; } // the collapse is damped with k = 8
      if (state.rag) { if (state.dead && !ch.dying) ch.dying = true; poseRag(dt, state); applyPose(dt, state.rag === 1 ? 12 : 8, 12, snap, false, false); return; }
      if (ch.dying) { ch.dying = false; ch.lie = 0; fSp = 0; fSv = 0; snap = true; } // back from the dead: stand up at once
      if (state.getUp > 0) { poseGetUp(dt, state); applyPose(dt, 14, 14, snap, false, false); return; }
      if (state.rise !== undefined && state.rise < 1) { poseRise(dt, state); applyPose(dt, 14, 14, snap, false, false); return; }
      if (state.driving) { poseDrive(dt, state); applyPose(dt, 14, 14, snap, false, false); return; }
      if (state.climb > 0) { poseClimb(dt, state); applyPose(dt, 20, 20, snap, false, false); return; }
      const solve = poseLive(dt, state), fast = state.aiming || ch.rec > 0.02 || state.punch > 0 || state.reload >= 0;
      if (actUpdate(dt)) applyAct(dt); else actClear();
      ovKeep.set(OV); S.ovFade = 1; applyPose(dt, fast ? 28 : 16, 16, snap, solve, true); // k = 16 normally, 28 for aim and recoil
    },
    dispose() {
      if (disposed) return; disposed = true;
      for (const l of lodGeo) if (l) l.dispose(); if (mesh.skeleton) mesh.skeleton.dispose(); // never the shared materials or the shared gun geometries
    } };
  ch.setGun(false, 'pistol');
  return ch;
}
