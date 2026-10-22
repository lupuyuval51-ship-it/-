import * as THREE from '../vendor/three.module.min.js';
import { OUTFITS } from './config.js';
import { mulberry, clamp } from './utils.js';
import { Vehicle } from './vehicle.js';
import { Ped } from './peds.js';
import { LOOKS, crewLook, uniformLook, randomLook } from './character.js';

// =====================================================================================================================
// SHOPS (release 3, W2). Every point of interest that used to be a solid box gets a hollow, enterable ground floor:
//   * a storefront (glass bays, a door with its leaves swung open, kick plate, fascia, awning or canopy, neon, door mat) merged with the storefronts
//     of all other shops into five global meshes (clad / metal / glass / awning / glow) that are always drawn;
//   * an interior (floor, ceiling, walls, ceiling fixtures, counter, shelves, shop specific props) merged per material into 6-9 meshes per shop and
//     drawn only while the camera is within reach (Scene.onBeforeRender hook, chained after the one flora.js installs);
//   * a shopkeeper (a Ped of kind 'keeper', created once the game exists, see Shops.attach / Shops.update).
// No light is created: fixtures are emissive, their light is baked into the vertex colours (bake) plus one shared ambient term in the shader.
// Layout frame of an interior: local x = across (u), local z = depth from the inner face of the front wall (v), +z runs towards the back wall,
// so a prop with yaw 0 looks at the back wall and a customer at the counter looks along +z.
// =====================================================================================================================
const WT = 0.35;          // thickness of the outer walls
const FLOORY = 0.15;      // top of the pavement; the interior floor sits on it
const RT = new Map(), col = h => { if (typeof h === 'object') return h; let c = RT.get(h); if (!c) RT.set(h, c = new THREE.Color(h)); return c; }; // sRGB hex -> linear colour (cached); a Color passes through
const hdr = (h, k) => col(h).clone().multiplyScalar(k); // emissive vertex colour above 1.0 (blooms at night)
const _c = new THREE.Color();
const mix = (a, b, t) => _c.set(a).lerp(col(b), t).getHex();
const shade = (h, k) => _c.set(h).multiplyScalar(k).getHex();
const U = { glow: { value: 1 }, time: { value: 0 }, amb: { value: 0.5 } }; // shared uniforms: emissive level (day 1 .. night 3.4), clock of animated screens, shader ambient

// ---------- specs: what is built where ----------
// kind picks the layout, gf the height of the hollow ground floor (3.5 = one floor of the facade texture, 7 = a double-height lobby), iw/dp cap the interior
// width and depth, floor/wall the finish, k1/k2 the paint colours, glowc the fixture colour, keeper the look of the person behind the counter.
const SPEC = {
  guns:      { kind: 'guns', iw: 17, dp: 11.5, floor: 'rubber', wall: 0x5b6070, dado: 0x2c2f38, k1: 0x1d2027, k2: 0xff4fa3, glowc: 0xffe8d0, keeper: 'gunsmith' },
  guns2:     { kind: 'guns', iw: 17, dp: 11.5, floor: 'rubber', wall: 0x7a6a58, dado: 0x3a3028, k1: 0x2a231c, k2: 0xff4fa3, glowc: 0xffdcb0, keeper: 'gunsmith' },
  guns3:     { kind: 'guns', iw: 21, dp: 12.5, floor: 'rubber', wall: 0x646a72, dado: 0x2c3036, k1: 0x1d2027, k2: 0xff4fa3, glowc: 0xf0f4ff, keeper: 'gunsmith' },
  clothes:   { kind: 'clothes', gain: 0.88, iw: 21, dp: 13, floor: 'wood', wall: 0xe8d4dc, k1: 0xd8bfcb, k2: 0xff9ad5, glowc: 0xfff4ea, keeper: 'cashier' },
  burger:    { kind: 'burger', gain: 0.9, iw: 21, dp: 12.5, floor: 'checker', wall: 0xf6dfc8, k1: 0xd8452a, k2: 0xff9a3c, glowc: 0xfff0d8, keeper: 'cashier' },
  burger2:   { kind: 'burger', gain: 0.9, iw: 17, dp: 13.5, floor: 'checker', wall: 0xcfeede, k1: 0x2b9a8a, k2: 0xff9a3c, glowc: 0xfff0d8, keeper: 'cashier' },
  dealer:    { kind: 'dealer', gain: 0.74, iw: 17, dp: 14.5, floor: 'marble', amb: 0.46, ceil: 0xb8bcc0, wall: 0xd4dae2, k1: 0x1f2a3a, k2: 0x3ce8f5, glowc: 0xf0f8ff, keeper: 'banker' },
  spray:     { kind: 'spray', gain: 0.82, iw: 21, dp: 14, floor: 'concrete', wall: 0x9a9ca6, k1: 0x2a2d36, k2: 0xc084fc, glowc: 0xf0f4ff, keeper: 'mechanic', bays: true },
  spray2:    { kind: 'spray', gain: 0.82, iw: 21, dp: 14, floor: 'concrete', wall: 0x8e8a86, k1: 0x2a2d36, k2: 0xc084fc, glowc: 0xf0f4ff, keeper: 'mechanic', bays: true },
  casino:    { kind: 'casino', gf: 7, iw: 17, dp: 15.5, floor: 'carpet', wall: 0x4a1020, k1: 0x2a0a14, k2: 0xffd34e, glowc: 0xffd9a0, keeper: 'cashier' },
  bank:      { kind: 'bank', gain: 0.72, gf: 7, iw: 21, dp: 18, floor: 'marble', amb: 0.42, ceil: 0xb4b0a6, wall: 0xcfc4ae, k1: 0x3a3a42, k2: 0xffd34e, glowc: 0xfff4dc, keeper: 'banker' },
  hospital:  { kind: 'hospital', gain: 0.62, gf: 7, iw: 21, dp: 16, floor: 'tile', amb: 0.42, ceil: 0xb8bcbc, wall: 0xcfdadd, k1: 0xe8f0f2, k2: 0xff5a5a, glowc: 0xeaf6ff, keeper: 'nurse' },
  hospital2: { kind: 'hospital', gain: 0.62, gf: 7, iw: 21, dp: 14, floor: 'tile', amb: 0.42, ceil: 0xb8bcbc, wall: 0xcad8d6, k1: 0xe8f0f2, k2: 0xff5a5a, glowc: 0xeaf6ff, keeper: 'nurse' },
  police:    { kind: 'police', gain: 0.8, iw: 21, dp: 14, floor: 'concrete', wall: 0x6d7a96, k1: 0x1a2440, k2: 0x4d8cff, glowc: 0xe8f0ff, keeper: 'cop' },
  police2:   { kind: 'police', gain: 0.8, iw: 17, dp: 14.5, floor: 'concrete', wall: 0x6a7a8a, k1: 0x1a2440, k2: 0x4d8cff, glowc: 0xe8f0ff, keeper: 'cop' },
  taxi:      { kind: 'taxi', gain: 0.85, iw: 17, dp: 11.5, floor: 'concrete', wall: 0xe6d8b0, k1: 0x3a3a42, k2: 0xffd34e, glowc: 0xfff0d0, keeper: 'cashier' },
  ricky:     { kind: 'lounge', iw: 21, dp: 12.5, floor: 'wood', wall: 0x3a1a3a, k1: 0x1a0a1c, k2: 0xff4fa3, glowc: 0xffd0f0, keeper: 'clubber' },
  dana:      { kind: 'garage', gain: 0.8, iw: 17, dp: 12.5, floor: 'concrete', wall: 0x7aa89a, k1: 0x2a2d36, k2: 0x3ce8f5, glowc: 0xf0fff8, keeper: 'mechanic' },
  safehouse: { kind: 'lobby', gain: 0.78, iw: 17, dp: 11.5, floor: 'marble', wall: 0xd8e8d8, k1: 0x2a3a2e, k2: 0x7cff8a, glowc: 0xfff0d0, keeper: 'guard' },
};
const DEALER_CARS = [['sport', 0xff4fa3], ['muscle', 0x3ce8f5], ['super', 0xf2f2f2]];

// ---------- canvas textures ----------
const cvs = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); f(x, w, h); return c; };
const tex = (c, rep = true, aniso = 8) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; return t; };
const FONT = '"Arial Black", Heebo, Arial, sans-serif';
const hexs = h => '#' + h.toString(16).padStart(6, '0');
// floor textures: FLOOR_SIZE is the length of one repeat in metres (uv = world position / size)
const FLOOR_SIZE = { checker: 0.9, wood: 1.6, concrete: 3, marble: 2.4, carpet: 2, tile: 2, rubber: 2 };
const FLOOR_ROUGH = { checker: 0.26, wood: 0.45, concrete: 0.78, marble: 0.16, carpet: 1, tile: 0.28, rubber: 0.7 };
const floorCache = {};
function floorTex(kind) {
  if (floorCache[kind]) return floorCache[kind]; const r = mulberry(kind.length * 977 + kind.charCodeAt(0));
  const c = cvs(256, 256, (x, w, h) => {
    const noise = (n, a, col = '255,255,255') => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${col},${a * r()})`; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } };
    if (kind === 'checker') { x.fillStyle = '#f2ece4'; x.fillRect(0, 0, w, h); x.fillStyle = '#25262c'; x.fillRect(0, 0, w / 2, h / 2); x.fillRect(w / 2, h / 2, w / 2, h / 2); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, h / 2 - 1, w, 2); x.fillRect(w / 2 - 1, 0, 2, h); x.fillRect(0, 0, w, 1.5); x.fillRect(0, 0, 1.5, h); noise(300, 0.06, '0,0,0'); }
    else if (kind === 'wood') { for (let i = 0; i < 4; i++) { const k = 0.82 + r() * 0.3; x.fillStyle = `rgb(${190 * k | 0},${142 * k | 0},${96 * k | 0})`; x.fillRect(0, i * 64, w, 64); for (let j = 0; j < 14; j++) { x.strokeStyle = `rgba(90,56,30,${0.1 + r() * 0.18})`; x.lineWidth = 0.6 + r(); x.beginPath(); const y = i * 64 + r() * 64; x.moveTo(0, y); x.bezierCurveTo(w * 0.3, y + r() * 4 - 2, w * 0.6, y + r() * 4 - 2, w, y + r() * 3 - 1.5); x.stroke(); } x.fillStyle = 'rgba(40,24,12,0.55)'; x.fillRect(0, i * 64, w, 1.5); x.fillRect((i * 97) % w, i * 64, 1.5, 64); } }
    else if (kind === 'concrete') { x.fillStyle = '#8c8e94'; x.fillRect(0, 0, w, h); for (let i = 0; i < 28; i++) { x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.015 + r() * 0.03})`; const s = 20 + r() * 70; x.beginPath(); x.ellipse(r() * w, r() * h, s, s * 0.6, r() * 3, 0, 6.3); x.fill(); } noise(1200, 0.12, '0,0,0'); noise(700, 0.1); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); }
    else if (kind === 'marble') { x.fillStyle = '#c9c2b6'; x.fillRect(0, 0, w, h); for (let t = 0; t < 4; t++) { x.fillStyle = (t % 3 === 0) ? 'rgba(110,100,88,0.18)' : 'rgba(255,255,255,0.1)'; x.fillRect((t & 1) * w / 2, (t >> 1) * h / 2, w / 2, h / 2); } for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(120,110,100,${0.08 + r() * 0.16})`; x.lineWidth = 0.5 + r() * 1.3; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let j = 0; j < 5; j++) { px += (r() - 0.5) * 70; py += (r() - 0.5) * 70; x.lineTo(px, py); } x.stroke(); } x.fillStyle = 'rgba(90,80,70,0.55)'; x.fillRect(w / 2 - 1, 0, 2, h); x.fillRect(0, h / 2 - 1, w, 2); x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); }
    else if (kind === 'carpet') { x.fillStyle = '#5a1424'; x.fillRect(0, 0, w, h); x.strokeStyle = '#c9a24a'; x.lineWidth = 3; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const cx = 64 + i * 128, cy = 64 + j * 128; x.beginPath(); x.moveTo(cx, cy - 52); x.lineTo(cx + 52, cy); x.lineTo(cx, cy + 52); x.lineTo(cx - 52, cy); x.closePath(); x.stroke(); x.fillStyle = '#7a1c32'; x.beginPath(); x.moveTo(cx, cy - 30); x.lineTo(cx + 30, cy); x.lineTo(cx, cy + 30); x.lineTo(cx - 30, cy); x.closePath(); x.fill(); x.fillStyle = '#c9a24a'; x.fillRect(cx - 3, cy - 3, 6, 6); } noise(2500, 0.1, '0,0,0'); noise(1200, 0.07, '255,200,200'); }
    else if (kind === 'tile') { x.fillStyle = '#b4c6c6'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const k = 0.94 + r() * 0.08; x.fillStyle = `rgb(${190 * k | 0},${208 * k | 0},${206 * k | 0})`; x.fillRect(i * 64 + 1, j * 64 + 1, 62, 62); } x.fillStyle = 'rgba(80,100,100,0.5)'; for (let i = 0; i < 4; i++) { x.fillRect(i * 64, 0, 1.5, h); x.fillRect(0, i * 64, w, 1.5); } noise(500, 0.05, '0,0,0'); }
    else { x.fillStyle = '#585b66'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.04})`; x.beginPath(); x.arc(i * 16 + 8, j * 16 + 8, 5.5, 0, 6.3); x.fill(); } noise(1500, 0.08); x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); }
  });
  return floorCache[kind] = tex(c);
}

// The art atlas: every printed or lit picture of the shops (neon words, menu boards, price boards, posters, reels, logos) in one texture.
// An entry is [id, width, height, draw]; cells are packed in shelves with a 4 px margin. rect(id) returns the uv rectangle of the cell.
function neonWord(x, w, h, text, c1, c2) { x.fillStyle = '#05060a'; x.fillRect(0, 0, w, h); x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = h * 0.7; x.font = `900 ${fs}px ${FONT}`; while (x.measureText(text).width > w * 0.9 && fs > 8) { fs -= 2; x.font = `900 ${fs}px ${FONT}`; } x.lineJoin = 'round'; x.lineWidth = fs * 0.2; x.strokeStyle = c2; x.shadowColor = c1; x.shadowBlur = fs * 0.35; x.strokeText(text, w / 2, h / 2 + fs * 0.04); x.shadowBlur = 0; x.fillStyle = c1; x.fillText(text, w / 2, h / 2 + fs * 0.04); }
function plate(x, w, h, bg, fg, text, sub) { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(0, 0, w, h * 0.5); x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = h * (sub ? 0.4 : 0.55); x.font = `900 ${fs}px ${FONT}`; while (x.measureText(text).width > w * 0.9 && fs > 8) { fs -= 2; x.font = `900 ${fs}px ${FONT}`; } x.fillText(text, w / 2, h * (sub ? 0.36 : 0.52)); if (sub) { x.font = `700 ${h * 0.2}px ${FONT}`; x.fillText(sub, w / 2, h * 0.76); } }
const ART = [
  ['open', 192, 72, (x, w, h) => neonWord(x, w, h, 'OPEN', '#ff9ab8', '#ff2a6a')],
  ['open24', 192, 72, (x, w, h) => neonWord(x, w, h, '24 / 7', '#8ff4ff', '#10a8c8')],
  ['guns', 192, 72, (x, w, h) => neonWord(x, w, h, 'GUNS', '#ffb0d8', '#ff2a8a')],
  ['ammo', 192, 72, (x, w, h) => neonWord(x, w, h, 'AMMO', '#fff2a0', '#ff9a1c')],
  ['burgers', 192, 72, (x, w, h) => neonWord(x, w, h, 'BURGERS', '#ffd09a', '#ff6a1c')],
  ['fries', 192, 72, (x, w, h) => neonWord(x, w, h, 'FRIES', '#fff2a0', '#ffb01c')],
  ['sale', 192, 72, (x, w, h) => neonWord(x, w, h, 'SALE', '#ffb0e8', '#ff2ad0')],
  ['fashion', 192, 72, (x, w, h) => neonWord(x, w, h, 'FASHION', '#ffd0f0', '#ff4fb0')],
  ['cars', 192, 72, (x, w, h) => neonWord(x, w, h, 'CARS', '#a0f4ff', '#1ca8ff')],
  ['bank', 192, 72, (x, w, h) => neonWord(x, w, h, 'BANK', '#fff0a0', '#e0a010')],
  ['taxi', 192, 72, (x, w, h) => neonWord(x, w, h, 'TAXI', '#fff2a0', '#e0a010')],
  ['auto', 192, 72, (x, w, h) => neonWord(x, w, h, 'AUTO', '#e0c0ff', '#9a4cf0')],
  ['er', 192, 72, (x, w, h) => neonWord(x, w, h, 'EMERGENCY', '#ffb0b0', '#ff2a2a')],
  ['casino', 288, 72, (x, w, h) => neonWord(x, w, h, 'JACKPOT', '#fff0a0', '#ff9a1c')],
  ['lounge', 192, 72, (x, w, h) => neonWord(x, w, h, 'LOUNGE', '#ffb0e8', '#ff2ab0')],
  ['police', 192, 72, (x, w, h) => neonWord(x, w, h, 'POLICE', '#a8c8ff', '#2a6aff')],
  ['exit', 128, 48, (x, w, h) => plate(x, w, h, '#0c5a2a', '#e8fff0', 'EXIT')],
  ['menu1', 384, 256, (x, w, h) => { x.fillStyle = '#1a0f0a'; x.fillRect(0, 0, w, h); x.fillStyle = '#ff9a3c'; x.fillRect(0, 0, w, 44); x.fillStyle = '#1a0f0a'; x.font = `900 32px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BURGERS', w / 2, 24); x.textAlign = 'left'; x.fillStyle = '#fff2dc'; x.font = `700 26px ${FONT}`; [['NEON BURGER', '$12'], ['DOUBLE STACK', '$16'], ['BACON BLAZE', '$15'], ['VEGGIE GLOW', '$13'], ['KIDS MEAL', '$9']].forEach((r, i) => { x.fillText(r[0], 18, 78 + i * 38); x.textAlign = 'right'; x.fillStyle = '#ffd34e'; x.fillText(r[1], w - 18, 78 + i * 38); x.textAlign = 'left'; x.fillStyle = '#fff2dc'; }); }],
  ['menu2', 384, 256, (x, w, h) => { x.fillStyle = '#0a1418'; x.fillRect(0, 0, w, h); x.fillStyle = '#3ce8f5'; x.fillRect(0, 0, w, 44); x.fillStyle = '#0a1418'; x.font = `900 32px ${FONT}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('SIDES & DRINKS', w / 2, 24); x.textAlign = 'left'; x.fillStyle = '#e0fbff'; x.font = `700 26px ${FONT}`; [['FRIES', '$4'], ['ONION RINGS', '$5'], ['SHAKE', '$6'], ['COLA', '$3'], ['COFFEE', '$3']].forEach((r, i) => { x.fillText(r[0], 18, 78 + i * 38); x.textAlign = 'right'; x.fillStyle = '#ffd34e'; x.fillText(r[1], w - 18, 78 + i * 38); x.textAlign = 'left'; x.fillStyle = '#e0fbff'; }); }],
  ['menu3', 384, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ff5a2a'); g.addColorStop(1, '#ffb01c'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `900 58px ${FONT}`; x.fillText('COMBO', w / 2, 70); x.font = `900 92px ${FONT}`; x.fillStyle = '#1a0f0a'; x.fillText('$18', w / 2, 154); x.font = `700 26px ${FONT}`; x.fillStyle = '#fff'; x.fillText('BURGER + FRIES + COLA', w / 2, 222); }],
  ['logoNeon', 384, 96, (x, w, h) => neonWord(x, w, h, 'NEON BURGER', '#ffd09a', '#ff6a1c')],
  ['logoMotors', 384, 96, (x, w, h) => neonWord(x, w, h, 'COAST MOTORS', '#a0f4ff', '#1ca8ff')],
  ['logoBank', 384, 96, (x, w, h) => neonWord(x, w, h, 'SOLARA BANK', '#fff0a0', '#e0a010')],
  ['logoCasino', 384, 96, (x, w, h) => neonWord(x, w, h, 'SOLARA CASINO', '#ffe8a0', '#ff6a1c')],
  ['logoSunset', 384, 96, (x, w, h) => neonWord(x, w, h, 'SUNSET', '#ffd0f0', '#ff4fb0')],
  ['logoPalms', 384, 96, (x, w, h) => neonWord(x, w, h, 'THE PALMS', '#c8ffd0', '#2ad060')],
  ['logoArms', 384, 96, (x, w, h) => neonWord(x, w, h, 'ARMS & AMMO', '#ffb0d8', '#ff2a8a')],
  ['logoAuto', 384, 96, (x, w, h) => neonWord(x, w, h, 'SERVICE', '#e0c0ff', '#9a4cf0')],
  ['logoGarage', 384, 96, (x, w, h) => neonWord(x, w, h, 'GARAGE 8', '#a0f4ff', '#1ca8ff')],
  ['logoRicky', 384, 96, (x, w, h) => neonWord(x, w, h, "RICKY'S", '#ffb0e8', '#ff2ab0')],
  ['logoTaxi', 384, 96, (x, w, h) => neonWord(x, w, h, 'TAXI DISPATCH', '#fff2a0', '#e0a010')],
  ['target', 128, 192, (x, w, h) => { x.fillStyle = '#e9e4d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#17181c'; x.beginPath(); x.arc(w / 2, 52, 22, 0, 6.3); x.fill(); x.fillRect(w / 2 - 36, 76, 72, 100); x.fillStyle = '#e9e4d6'; for (const r of [34, 22, 10]) { x.strokeStyle = '#e9e4d6'; x.lineWidth = 2; x.beginPath(); x.arc(w / 2, 118, r, 0, 6.3); x.stroke(); } x.fillStyle = '#d02a2a'; for (const [px, py] of [[58, 100], [74, 118], [66, 132], [52, 52], [50, 142]]) { x.beginPath(); x.arc(px, py, 3, 0, 6.3); x.fill(); } }],
  ['target2', 128, 192, (x, w, h) => { x.fillStyle = '#f2efe6'; x.fillRect(0, 0, w, h); for (let i = 5; i >= 1; i--) { x.fillStyle = i % 2 ? '#1c1d22' : '#f2efe6'; x.beginPath(); x.arc(w / 2, 96, i * 17, 0, 6.3); x.fill(); } x.strokeStyle = '#1c1d22'; x.lineWidth = 3; x.strokeRect(2, 2, w - 4, h - 4); x.fillStyle = '#d02a2a'; for (const [px, py] of [[60, 90], [70, 100], [64, 94], [90, 70]]) { x.beginPath(); x.arc(px, py, 2.6, 0, 6.3); x.fill(); } }],
  ['wanted', 128, 192, (x, w, h) => { x.fillStyle = '#d8c8a0'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a2a1a'; x.font = `900 24px ${FONT}`; x.textAlign = 'center'; x.fillText('WANTED', w / 2, 30); x.fillStyle = '#6a5a44'; x.fillRect(22, 44, 84, 84); x.fillStyle = '#c8a888'; x.beginPath(); x.arc(w / 2, 82, 24, 0, 6.3); x.fill(); x.fillStyle = '#3a2a1a'; x.fillRect(38, 56, 52, 12); x.fillRect(46, 94, 36, 5); x.font = `700 14px ${FONT}`; x.fillText('REWARD', w / 2, 154); x.font = `900 22px ${FONT}`; x.fillText('$5,000', w / 2, 178); }],
  ['wanted2', 128, 192, (x, w, h) => { x.fillStyle = '#cfd6e0'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a2440'; x.font = `900 20px ${FONT}`; x.textAlign = 'center'; x.fillText('MISSING', w / 2, 28); x.fillStyle = '#8a98b0'; x.fillRect(22, 40, 84, 90); x.fillStyle = '#e0b898'; x.beginPath(); x.arc(w / 2, 84, 26, 0, 6.3); x.fill(); x.fillStyle = '#4a3020'; x.beginPath(); x.arc(w / 2, 70, 26, Math.PI, 0); x.fill(); x.fillStyle = '#1a2440'; x.font = `700 13px ${FONT}`; x.fillText('CALL 911', w / 2, 158); }],
  ['clockface', 128, 128, (x, w, h) => { x.fillStyle = '#f6f2e8'; x.beginPath(); x.arc(64, 64, 62, 0, 6.3); x.fill(); x.strokeStyle = '#1a1a1e'; x.lineWidth = 5; x.stroke(); x.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; x.beginPath(); x.moveTo(64 + Math.sin(a) * 50, 64 - Math.cos(a) * 50); x.lineTo(64 + Math.sin(a) * 58, 64 - Math.cos(a) * 58); x.stroke(); } x.lineWidth = 5; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.sin(-1.05) * 30, 64 - Math.cos(-1.05) * 30); x.stroke(); x.lineWidth = 3; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.sin(2.1) * 46, 64 - Math.cos(2.1) * 46); x.stroke(); }],
  ['cross', 128, 128, (x, w, h) => { x.fillStyle = '#f6f8fa'; x.fillRect(0, 0, w, h); x.fillStyle = '#e02a2a'; x.fillRect(46, 16, 36, 96); x.fillRect(16, 46, 96, 36); }],
  ['eye', 128, 192, (x, w, h) => { x.fillStyle = '#f6f6f2'; x.fillRect(0, 0, w, h); x.fillStyle = '#16181c'; x.textAlign = 'center'; x.textBaseline = 'middle'; [['E', 52], ['F P', 40], ['T O Z', 30], ['L P E D', 22], ['P E C F D', 16], ['E D F C Z P', 12]].forEach((r, i) => { x.font = `900 ${r[1]}px ${FONT}`; x.fillText(r[0], w / 2, 22 + i * 28 + (i > 2 ? 12 : 0)); }); }],
  ['anatomy', 128, 192, (x, w, h) => { x.fillStyle = '#dfeaf0'; x.fillRect(0, 0, w, h); x.fillStyle = '#b8483c'; x.beginPath(); x.ellipse(64, 56, 20, 30, 0, 0, 6.3); x.fill(); x.fillRect(46, 82, 36, 70); x.fillStyle = '#f0c8a8'; x.beginPath(); x.arc(64, 24, 14, 0, 6.3); x.fill(); x.strokeStyle = '#2a3a4a'; x.lineWidth = 2; x.strokeRect(2, 2, w - 4, h - 4); x.fillStyle = '#2a3a4a'; x.font = `700 12px ${FONT}`; x.textAlign = 'center'; x.fillText('ANATOMY', w / 2, 178); }],
  ['bars', 128, 128, (x, w, h) => { x.fillStyle = '#10141c'; x.fillRect(0, 0, w, h); const cols = ['#e0e0e0', '#e0e000', '#00e0e0', '#00e000', '#e000e0', '#e00000', '#0000e0']; cols.forEach((c, i) => { x.fillStyle = c; x.fillRect(i * 18 + 1, 0, 18, 88); }); x.fillStyle = '#10141c'; x.fillRect(0, 88, w, 40); for (let i = 0; i < 8; i++) { x.fillStyle = `hsl(${i * 40},70%,50%)`; x.fillRect(i * 16, 96, 12, 24); } }],
  ['news', 256, 144, (x, w, h) => { x.fillStyle = '#10243c'; x.fillRect(0, 0, w, h); x.fillStyle = '#c01818'; x.fillRect(0, h - 38, w, 38); x.fillStyle = '#fff'; x.font = `900 22px ${FONT}`; x.textAlign = 'left'; x.fillText('NEON NEWS 24', 14, h - 12); x.fillStyle = '#6a8ab0'; x.beginPath(); x.arc(76, 62, 26, 0, 6.3); x.fill(); x.fillRect(46, 88, 60, 24); x.fillStyle = '#d8e8f8'; x.fillRect(130, 34, 100, 8); x.fillRect(130, 54, 80, 8); x.fillRect(130, 74, 92, 8); }],
  ['rates', 192, 256, (x, w, h) => { x.fillStyle = '#05080c'; x.fillRect(0, 0, w, h); x.font = `700 22px ${FONT}`; x.textAlign = 'left'; ['SLR/USD', 'GOLD', 'NEON', 'COAST', 'OIL', 'BTC'].forEach((s, i) => { x.fillStyle = '#ffd34e'; x.fillText(s, 10, 30 + i * 38); x.fillStyle = i % 2 ? '#ff5a5a' : '#5aff8a'; x.textAlign = 'right'; x.fillText((100 + i * 17.3).toFixed(1), w - 10, 30 + i * 38); x.textAlign = 'left'; }); }],
  ['reels', 96, 384, (x, w, h) => { x.fillStyle = '#fdf7e8'; x.fillRect(0, 0, w, h); const S = ['7', '★', '♦', '●', '♥', '$', '7', '♣']; const C = ['#d82020', '#e0a010', '#2060e0', '#20a040', '#d82080', '#20a040', '#d82020', '#202020']; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `900 ${h / 8 * 0.72}px ${FONT}`; for (let i = 0; i < 8; i++) { x.fillStyle = C[i]; x.fillText(S[i], w / 2, (i + 0.5) * h / 8); x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, i * h / 8, w, 2); } }],
  ['felt', 256, 128, (x, w, h) => { x.fillStyle = '#0c5a34'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d8c070'; x.lineWidth = 2; x.beginPath(); x.ellipse(w / 2, h * 0.1, w * 0.4, h * 0.7, 0, 0, Math.PI); x.stroke(); x.fillStyle = '#d8c070'; x.font = `700 12px ${FONT}`; x.textAlign = 'center'; x.fillText('BLACKJACK PAYS 3 TO 2', w / 2, h * 0.5); for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(w * (0.2 + i * 0.15), h * 0.72, 11, 0, 6.3); x.stroke(); } }],
  ['roulette', 256, 128, (x, w, h) => { x.fillStyle = '#0c5a34'; x.fillRect(0, 0, w, h); x.strokeStyle = '#e8e0c0'; x.lineWidth = 1.5; for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { x.fillStyle = (i + j) % 2 ? '#a81818' : '#101010'; x.fillRect(60 + i * 15, 30 + j * 20, 15, 20); x.strokeRect(60 + i * 15, 30 + j * 20, 15, 20); } x.fillStyle = '#0c8a4a'; x.fillRect(30, 30, 30, 60); x.strokeRect(30, 30, 30, 60); }],
  ['ad1', 128, 192, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ff7ac8'); g.addColorStop(1, '#7a4cff'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(46, 30, 36, 110); x.beginPath(); x.arc(64, 22, 14, 0, 6.3); x.fill(); x.fillStyle = '#fff'; x.font = `900 22px ${FONT}`; x.textAlign = 'center'; x.fillText('SUMMER', w / 2, 168); }],
  ['ad2', 128, 192, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffd34e'); g.addColorStop(1, '#ff7a2a'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1a1e'; x.fillRect(40, 30, 48, 120); x.beginPath(); x.arc(64, 22, 14, 0, 6.3); x.fill(); x.fillStyle = '#fff'; x.font = `900 22px ${FONT}`; x.textAlign = 'center'; x.fillText('NEW IN', w / 2, 174); }],
  ['map', 256, 192, (x, w, h) => { x.fillStyle = '#12182a'; x.fillRect(0, 0, w, h); x.fillStyle = '#143a66'; x.fillRect(w * 0.82, 0, w * 0.18, h); x.strokeStyle = '#6a74a3'; x.lineWidth = 3; for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo(i * w * 0.08, 0); x.lineTo(i * w * 0.08, h); x.stroke(); } for (let j = 1; j < 8; j++) { x.beginPath(); x.moveTo(0, j * h * 0.12); x.lineTo(w * 0.82, j * h * 0.12); x.stroke(); } x.fillStyle = '#ffd34e'; for (const [a, b] of [[3, 2], [6, 5], [8, 3]]) { x.beginPath(); x.arc(a * w * 0.08 + w * 0.04, b * h * 0.12 + h * 0.06, 6, 0, 6.3); x.fill(); } }],
  ['kitchen', 128, 128, (x, w, h) => { x.fillStyle = '#e8e4da'; x.fillRect(0, 0, w, h); x.fillStyle = '#c8402a'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) x.fillRect(i * 32, j * 32, 32, 32); }],
  ['price0', 256, 128, (x, w, h) => plate(x, w, h, '#0a1a2a', '#a0f4ff', 'SPORT', '$14,000')],
  ['price1', 256, 128, (x, w, h) => plate(x, w, h, '#0a1a2a', '#a0f4ff', 'MUSCLE', '$9,500')],
  ['price2', 256, 128, (x, w, h) => plate(x, w, h, '#0a1a2a', '#a0f4ff', 'SUPERCAR', '$48,000')],
];
let ATLAS = null;
function artAtlas() {
  if (ATLAS) return ATLAS;
  const W = 2048, H = 1280, rects = {}, list = ART.slice().sort((a, b) => b[2] - a[2]); let px = 4, py = 4, rowH = 0; // tallest cells first: shelf packing, a cell that does not fit is skipped, never the whole rest
  const c = cvs(W, H, (x) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    for (const [id, w, h, draw] of list) {
      if (px + w + 4 > W) { px = 4; py += rowH + 8; rowH = 0; } if (py + h + 4 > H) { console.warn('shops: art cell does not fit: ' + id); continue; }
      x.save(); x.translate(px, py); x.beginPath(); x.rect(0, 0, w, h); x.clip(); draw(x, w, h); x.restore();
      rects[id] = { u0: px / W, v0: 1 - (py + h) / H, u1: (px + w) / W, v1: 1 - py / H, w, h }; px += w + 8; rowH = Math.max(rowH, h);
    }
  });
  const t = tex(c, false, 8); return ATLAS = { tex: t, rects };
}

// ---------- materials (shared by every shop; created on first use) ----------
// lit materials get one shader patch: an ambient term (U.amb) that stands in for the ceiling lights, whose light is otherwise baked into the vertex colours.
// glass is a premultiplied-alpha material: the pane dims what is behind it a little, while its reflection (specular) is added at full strength.
const BAKED = new Set(['matte', 'plastic', 'metal', 'art', 'felt']); // keys whose vertex colours receive the baked light (floors too, see IB.acc)
let MATS = null;
function mats() {
  if (MATS) return MATS;
  const A = artAtlas(), M = {};
  const lit = o => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, ...o }); m.onBeforeCompile = sh => { sh.uniforms.uAmb = U.amb; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uAmb;').replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\n  reflectedLight.indirectDiffuse += uAmb * diffuseColor.rgb;'); }; m.customProgramCacheKey = () => 'shopLit'; return m; };
  M.matte = lit({ roughness: 0.88, metalness: 0 }); M.plastic = lit({ roughness: 0.4, metalness: 0.05 }); M.metal = lit({ roughness: 0.3, metalness: 0.9 });
  M.clad = lit({ roughness: 0.5, metalness: 0.3 }); M.awning = lit({ roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  M.art = lit({ roughness: 0.75, metalness: 0, map: A.tex });
  for (const k in FLOOR_SIZE) { const m = lit({ roughness: FLOOR_ROUGH[k], metalness: 0, map: floorTex(k), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); M['f:' + k] = m; }
  const g = M.glass = new THREE.MeshStandardMaterial({ color: 0xa8d4e0, transparent: true, opacity: 0.14, roughness: 0.04, metalness: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
  g.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'gl_FragColor = vec4(totalDiffuse * diffuseColor.a + totalSpecular + totalEmissiveRadiance, clamp(diffuseColor.a + dot(totalSpecular, vec3(0.33)) * 0.6, 0.0, 1.0));')
      .replace('#include <fog_fragment>', '#ifdef USE_FOG\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * gl_FragColor.a, smoothstep(fogNear, fogFar, vFogDepth));\n#endif');
  };
  g.customProgramCacheKey = () => 'shopGlass';
  M.glow = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  M.glow.onBeforeCompile = sh => { sh.uniforms.uGlow = U.glow; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow;').replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= uGlow;'); };
  M.glow.customProgramCacheKey = () => 'shopGlow';
  // animated pictures: aCell = the atlas rectangle (u0, v0, du, dv), aAnim = (scroll speed, phase, flicker); the uv of such a face runs 0..1 inside its cell
  const sc = M.screen = new THREE.MeshBasicMaterial({ map: A.tex, vertexColors: true, toneMapped: false });
  sc.onBeforeCompile = sh => {
    sh.uniforms.uTime = U.time; sh.uniforms.uGlow = U.glow;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aCell; attribute vec4 aAnim; varying vec4 vCell; varying vec4 vAnim;').replace('#include <begin_vertex>', '#include <begin_vertex>\n  vCell = aCell; vAnim = aAnim;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uGlow; varying vec4 vCell; varying vec4 vAnim;')
      .replace('#include <map_fragment>', `vec2 scD = dFdx(vMapUv) * vCell.zw, scE = dFdy(vMapUv) * vCell.zw;
  vec2 scQ = vec2(vMapUv.x, vAnim.x != 0.0 ? fract(vMapUv.y + vAnim.x * uTime + vAnim.y) : vMapUv.y);
  diffuseColor *= textureGrad(map, vCell.xy + scQ * vCell.zw, scD, scE);
  diffuseColor.rgb *= mix(1.0, uGlow, 0.5) * (1.0 - vAnim.z * step(0.62, fract(sin(floor(uTime * 9.0) * 91.7 + vAnim.y * 50.0) * 437.5)));`);
  };
  sc.customProgramCacheKey = () => 'shopScreen';
  return MATS = M;
}

// ---------- IB: the interior builder ----------
// Collects triangles per material key. Primitives are given in the local frame (at/end push and pop a translation plus a yaw), vertices are transformed once and
// the light of the ceiling fixtures is baked into their colours (bake(x, y, z, nx, ny, nz) -> brightness), so one prop costs no draw call and no runtime light.
class IB {
  constructor(bake) { this.m = {}; this.bake = bake; this.t = { x: 0, y: 0, z: 0, a: 0, c: 1, s: 0 }; this.st = []; this.cols = []; this.top = 0; }
  acc(key) { return this.m[key] || (this.m[key] = { p: [], n: [], c: [], u: [], ce: [], an: [], bake: !!this.bake && (BAKED.has(key) || key[0] === 'f') }); }
  at(x, y, z, yaw = 0) { const t = this.t; this.st.push(t); const a = t.a + yaw, c = Math.cos(a), s = Math.sin(a); this.t = { x: t.x + t.c * x + t.s * z, y: t.y + y, z: t.z - t.s * x + t.c * z, a, c, s }; return this; }
  end() { this.t = this.st.pop(); return this; }
  W(x, y, z) { const t = this.t; return [t.x + t.c * x + t.s * z, t.y + y, t.z - t.s * x + t.c * z]; }
  vtx(A, P, nx, ny, nz, c, uv, ex) {
    const t = this.t, x = t.x + t.c * P[0] + t.s * P[2], y = t.y + P[1], z = t.z - t.s * P[0] + t.c * P[2], wx = t.c * nx + t.s * nz, wz = -t.s * nx + t.c * nz;
    let r = c.r, g = c.g, b = c.b; if (A.bake) { const k = this.bake(x, y, z, wx, ny, wz); r *= k; g *= k; b *= k; }
    A.p.push(x, y, z); A.n.push(wx, ny, wz); A.c.push(r, g, b); A.u.push(uv ? uv[0] : 0, uv ? uv[1] : 0); if (ex) A.ce.push(ex[0], ex[1], ex[2], ex[3]), A.an.push(ex[4], ex[5], ex[6], 0);
  }
  // quad a, b, c, d counter-clockwise seen from the side the normal points to (right-hand rule); uv: four [u, v]; ex: screen cell and animation
  quad(key, a, b, c, d, color, uv, ex) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const A = this.acc(key), C = col(color), P = [a, b, c, a, c, d], I = [0, 1, 2, 0, 2, 3], Q = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
    for (let i = 0; i < 6; i++) this.vtx(A, P[i], nx, ny, nz, C, Q[I[i]], ex);
  }
  // axis-aligned box in the local frame; o.no = letters of the faces to leave out (E +x, W -x, S -z, N +z, U top, D bottom), o.uv = [u scale, v scale] in metres per repeat
  box(key, x0, y0, z0, x1, y1, z1, color, o = {}) {
    const no = o.no || '', k = o.k || [1, 1, 1, 1, 1, 0.8], F = (f, a, b, c, d, i) => { if (no.indexOf(f) < 0) this.quad(key, a, b, c, d, k[i] === 1 ? color : typeof color === 'object' ? color.clone().multiplyScalar(k[i]) : mix(color, 0x000000, 1 - k[i]), o.uvf ? o.uvf(f, a, b, c, d) : undefined); };
    F('E', [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 1); F('W', [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], 1);
    F('S', [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 2); F('N', [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 2);
    F('U', [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], 0); F('D', [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 5);
  }
  // one triangle with per-vertex normals; the vertex order is fixed so the right-hand rule agrees with the normals (counter-clockwise seen from outside)
  tri3(A, C, P0, P1, P2, N0, N1, N2) {
    const ux = P1[0] - P0[0], uy = P1[1] - P0[1], uz = P1[2] - P0[2], vx = P2[0] - P0[0], vy = P2[1] - P0[1], vz = P2[2] - P0[2];
    const d = (uy * vz - uz * vy) * (N0[0] + N1[0] + N2[0]) + (uz * vx - ux * vz) * (N0[1] + N1[1] + N2[1]) + (ux * vy - uy * vx) * (N0[2] + N1[2] + N2[2]);
    if (d >= 0) { this.vtx(A, P0, N0[0], N0[1], N0[2], C); this.vtx(A, P1, N1[0], N1[1], N1[2], C); this.vtx(A, P2, N2[0], N2[1], N2[2], C); }
    else { this.vtx(A, P0, N0[0], N0[1], N0[2], C); this.vtx(A, P2, N2[0], N2[1], N2[2], C); this.vtx(A, P1, N1[0], N1[1], N1[2], C); }
  }
  // vertical cylinder / cone frustum from y0 (radius r0) to y0 + h (radius r1); o.ax 'x' or 'z' lays it on its side; o.cap = false leaves the lid off, o.bot caps the bottom
  cyl(key, cx, y0, cz, r0, r1, h, color, seg = 12, o = {}) {
    const ax = o.ax || 'y', C = col(color), A = this.acc(key), sl = (r0 - r1) / (h || 1), k = 1 / Math.hypot(1, sl);
    const P = (a, t, r) => { const ca = Math.cos(a) * r, sa = Math.sin(a) * r; return ax === 'y' ? [cx + ca, y0 + t, cz + sa] : ax === 'x' ? [cx + t, y0 + ca, cz + sa] : [cx + ca, y0 + sa, cz + t]; };
    const N = (a, ny) => { const ca = Math.cos(a), sa = Math.sin(a); return ax === 'y' ? [ca * k, ny * k, sa * k] : ax === 'x' ? [ny * k, ca * k, sa * k] : [ca * k, sa * k, ny * k]; };
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * 6.2832, a1 = (i + 1) / seg * 6.2832, p0 = P(a0, 0, r0), p1 = P(a1, 0, r0), p2 = P(a1, h, r1), p3 = P(a0, h, r1), n0 = N(a0, sl), n1 = N(a1, sl);
      this.tri3(A, C, p0, p1, p2, n0, n1, n1); this.tri3(A, C, p0, p2, p3, n0, n1, n0);
    }
    const lid = (t, r, d) => { const cc = ax === 'y' ? [cx, y0 + t, cz] : ax === 'x' ? [cx + t, y0, cz] : [cx, y0, cz + t], nn = ax === 'y' ? [0, d, 0] : ax === 'x' ? [d, 0, 0] : [0, 0, d]; for (let i = 0; i < seg; i++) this.tri3(A, C, cc, P(i / seg * 6.2832, t, r), P((i + 1) / seg * 6.2832, t, r), nn, nn, nn); };
    if (o.cap !== false && r1 > 0.001) lid(h, r1, 1); if (o.bot && r0 > 0.001) lid(0, r0, -1);
  }
  // ellipsoid
  sph(key, cx, cy, cz, rx, ry, rz, color, ws = 10, hs = 7) {
    const C = col(color), A = this.acc(key), pt = (i, j) => { const th = j / hs * Math.PI, ph = i / ws * 6.2832, s = Math.sin(th); return [Math.cos(ph) * s, Math.cos(th), Math.sin(ph) * s]; };
    const W = p => [cx + p[0] * rx, cy + p[1] * ry, cz + p[2] * rz], Nn = p => [p[0] / rx, p[1] / ry, p[2] / rz];
    for (let j = 0; j < hs; j++) for (let i = 0; i < ws; i++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      if (j > 0) this.tri3(A, C, W(a), W(b), W(c), Nn(a), Nn(b), Nn(c)); if (j < hs - 1) this.tri3(A, C, W(a), W(c), W(d), Nn(a), Nn(c), Nn(d));
    }
  }
  // one rectangle on an axis-aligned plane facing outwards: E / W plane x = c (a: z range, b: y range), S / N plane z = c (a: x range, b: y range), U / D plane y = c (a: x range, b: z range)
  rect(key, f, a0, a1, b0, b1, c, color, uv, ex) {
    const q = f === 'E' ? [[c, b0, a1], [c, b0, a0], [c, b1, a0], [c, b1, a1]] : f === 'W' ? [[c, b0, a0], [c, b0, a1], [c, b1, a1], [c, b1, a0]] : f === 'S' ? [[a1, b0, c], [a0, b0, c], [a0, b1, c], [a1, b1, c]] : f === 'N' ? [[a0, b0, c], [a1, b0, c], [a1, b1, c], [a0, b1, c]]
      : f === 'U' ? [[a0, c, b1], [a1, c, b1], [a1, c, b0], [a0, c, b0]] : [[a0, c, b0], [a1, c, b0], [a1, c, b1], [a0, c, b1]];
    this.quad(key, q[0], q[1], q[2], q[3], color, uv, ex);
  }
  // a textured / animated picture: face (a, b, c, d as quad) showing cell id of the atlas; anim = [scroll, phase, flicker] makes it a screen
  pic(key, a, b, c, d, id, color = 0xffffff, anim, vr = [0, 1]) {
    const r = artAtlas().rects[id]; if (!r) return;
    if (anim || key === 'screen') this.quad('screen', a, b, c, d, color, [[0, vr[0]], [1, vr[0]], [1, vr[1]], [0, vr[1]]], [r.u0, r.v0, r.u1 - r.u0, r.v1 - r.v0, anim ? anim[0] : 0, anim ? anim[1] : 0, anim ? anim[2] : 0]);
    else this.quad(key, a, b, c, d, color, [[r.u0, r.v0], [r.u1, r.v0], [r.u1, r.v1], [r.u0, r.v1]]);
  }
  // a collision box in the local frame (axis aligned in the world for yaws that are multiples of 90 degrees, otherwise its bounding box)
  col(x0, z0, x1, z1, y1 = 1.1, type = 'prop', y0 = 0) {
    const P = [this.W(x0, 0, z0), this.W(x1, 0, z0), this.W(x1, 0, z1), this.W(x0, 0, z1)], xs = P.map(p => p[0]), zs = P.map(p => p[2]);
    this.cols.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), y0, y1: this.t.y + y1, type });
  }
  // merged meshes, one per material key, as a group
  build(grp, castShadow, receive = true) {
    const M = mats(), out = [];
    for (const key in this.m) {
      const A = this.m[key]; if (!A.p.length) continue; const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(A.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(A.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(A.u, 2));
      if (key === 'screen') { g.setAttribute('aCell', new THREE.Float32BufferAttribute(A.ce, 4)); g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A.an, 4)); }
      g.computeBoundingSphere(); const m = new THREE.Mesh(g, M[key]); m.castShadow = castShadow && key !== 'glass' && key !== 'glow' && key !== 'screen'; m.receiveShadow = receive && key !== 'glow' && key !== 'screen'; m.matrixAutoUpdate = false; m.userData.key = key;
      if (key === 'glass') m.renderOrder = 2; else if (key === 'glow' || key === 'screen') m.renderOrder = 1; grp.add(m); out.push(m);
    }
    return out;
  }
  get tris() { let n = 0; for (const k in this.m) n += this.m[k].p.length / 9; return n; }
}

// ---------- storefront (exterior) ----------
// Everything outside the hollow ground floor: piers, kick plate, glass bays, fascia with a neon line, door frame with both leaves swung open, awning or canopy,
// door mat, window signs. All shops add to one shared IB (E) that becomes five meshes for the whole city.
const STRIPE_W = 0.5;
function awning(E, xa, xb, z0, yt, out, drop, c1, c2) { // striped fabric from the wall (height yt) out to z0 - out (height yt - drop), with a valance
  const n = Math.max(1, Math.round((xb - xa) / STRIPE_W)), w = (xb - xa) / n;
  for (let i = 0; i < n; i++) {
    const a = xa + i * w, b = a + w, c = i % 2 ? c2 : c1;
    E.quad('awning', [b, yt, z0 - 0.04], [a, yt, z0 - 0.04], [a, yt - drop, z0 - out], [b, yt - drop, z0 - out], c);
    E.quad('awning', [b, yt - drop, z0 - out], [a, yt - drop, z0 - out], [a, yt - drop - 0.32, z0 - out], [b, yt - drop - 0.32, z0 - out], c);
  }
  for (const [x, f] of [[xa, 1], [xb, -1]]) E.quad('awning', [x, yt, z0 - 0.04], [x, yt - drop, z0 - out], [x, yt - drop - 0.32, z0 - out], [x, yt - drop - 0.32, z0 - 0.04], c1); // end caps
  E.box('metal', xa, yt - drop - 0.36, z0 - out - 0.02, xb, yt - drop - 0.32, z0 - out + 0.02, 0x8a8f99); // valance rail
  for (let i = 0; i <= Math.ceil((xb - xa) / 3); i++) { const x = xa + (xb - xa) * i / Math.ceil((xb - xa) / 3); E.box('metal', x - 0.025, yt - drop - 0.05, z0 - out, x + 0.025, yt - drop, z0 - 0.02, 0x8a8f99); } // arms
}
function frontOf(S, E, grid) {
  const { x0, x1, z0, cx, ix0, ix1, iz0, gf, sp } = S, dw = S.door, acc = sp.k2, FI = iz0, high = gf > 4, fh = high ? 1.25 : 0.55, top = gf - fh, dark = shade(sp.k1, 1);
  const bays = sp.bays ? [cx - 6.2, cx + 6.2] : [], bw = 2.1;
  const segs = []; // front wall pieces between the inner corners, left to right
  if (sp.bays) segs.push(['wall', ix0, bays[0] - bw], ['bay', bays[0] - bw, bays[0] + bw], ['glass', bays[0] + bw, cx - dw], ['door', cx - dw, cx + dw], ['glass', cx + dw, bays[1] - bw], ['bay', bays[1] - bw, bays[1] + bw], ['wall', bays[1] + bw, ix1]);
  else segs.push(['glass', ix0, cx - dw], ['door', cx - dw, cx + dw], ['glass', cx + dw, ix1]);
  // outer piers (the part of the footprint outside the interior) and the fascia over everything
  const pw = Math.max(0, ix0 - x0);
  if (pw > 0.01) for (const [a, b] of [[x0, ix0], [ix1, x1]]) E.box('clad', a, 0.1, z0 - 0.04, b, gf, FI, dark, { no: 'D' });
  E.box('clad', ix0, gf - fh, z0 - 0.06, ix1, gf, FI, dark, { no: 'D' });
  E.box('glow', ix0, gf - fh - 0.045, z0 - 0.08, ix1, gf - fh - 0.015, z0 - 0.06, hdr(mix(acc, 0xffffff, 0.15), 1.5)); // neon line under the fascia
  E.box('metal', ix0, gf - 0.07, z0 - 0.1, ix1, gf, z0 - 0.04, 0x6a6f79);
  for (const [t, a, b] of segs) {
    if (t === 'glass') {
      E.box('clad', a, 0.1, z0 - 0.03, b, 0.55, FI, dark, { no: 'D' });
      E.rect('glass', 'S', a, b, 0.55, top, z0 + 0.2, 0xffffff); E.box('clad', a, top, z0 - 0.02, b, gf - fh, FI, dark, { no: 'DU' });
      const n = Math.max(1, Math.round((b - a) / 2.6)); for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; E.box('metal', x - 0.05, 0.55, z0 - 0.01, x + 0.05, top, z0 + 0.26, 0x2a2d34); }
      E.box('metal', a, 0.52, z0 - 0.01, b, 0.58, z0 + 0.26, 0x2a2d34); E.box('metal', a, top - 0.03, z0 - 0.01, b, top + 0.03, z0 + 0.26, 0x2a2d34);
    } else if (t === 'wall') { E.box('clad', a, 0.1, z0 - 0.04, b, gf, FI, dark, { no: 'D' }); for (let x = a + 0.45; x < b - 0.2; x += 0.9) E.box('metal', x - 0.015, 0.6, z0 - 0.06, x + 0.015, gf - fh - 0.1, z0 - 0.04, 0x3a3e48); }
    else if (t === 'door') {
      const dh = 2.5; E.box('clad', a, dh, z0 - 0.02, b, gf - fh, FI, dark, { no: 'D' }); E.rect('glass', 'S', a, b, dh + 0.06, top, z0 + 0.2, 0xffffff);
      for (const s of [-1, 1]) { const jx = s < 0 ? a - 0.12 : b; E.box('metal', jx, 0.1, z0 - 0.04, jx + 0.12, dh + 0.1, FI + 0.02, 0x2a2d34); }
      E.box('metal', a - 0.12, dh, z0 - 0.04, b + 0.12, dh + 0.1, FI + 0.02, 0x2a2d34); E.box('metal', a, 0.1, z0 - 0.05, b, 0.13, FI, 0x7a7f89); // threshold strip
      for (const s of [-1, 1]) { // one leaf each, swung to stand open across the door: aluminium frame and glass, push bar
        const xl = cx + s * (dw - 0.045), za = iz0 + 0.05, zb = iz0 + 0.84;
        E.box('metal', xl - 0.03, 0.15, za, xl + 0.03, 0.4, zb, 0x9aa0aa); E.box('metal', xl - 0.03, 2.25, za, xl + 0.03, 2.4, zb, 0x9aa0aa); E.box('metal', xl - 0.03, 0.4, za, xl + 0.03, 2.25, za + 0.06, 0x9aa0aa); E.box('metal', xl - 0.03, 0.4, zb - 0.06, xl + 0.03, 2.25, zb, 0x9aa0aa);
        E.rect('glass', s < 0 ? 'E' : 'W', za + 0.06, zb - 0.06, 0.4, 2.25, xl + s * 0.0, 0xffffff); E.cyl('metal', xl - s * 0.07, 1.0, zb - 0.1, 0.02, 0.02, 0.5, 0xd8dce4, 6, { ax: 'y' });
      }
    } else if (t === 'bay') {
      const bc = (a + b) / 2, oh = 2.45; E.box('clad', a, oh + 0.35, z0 - 0.04, b, gf, FI, dark, { no: 'D' });
      (S.bayList || (S.bayList = [])).push({ a, b, top: oh + 0.35, z: z0 + 0.09 }); E.box('metal', a, oh + 0.3, z0 - 0.02, b, oh + 0.36, z0 + 0.14, 0x3a3e48); // the lintel box the shutter rolls into
      for (const s of [-1, 1]) E.box('metal', s < 0 ? a - 0.1 : b, 0.1, z0 - 0.04, s < 0 ? a : b + 0.1, oh + 0.35, FI + 0.02, 0x2a2d34);
      for (const bx of [bc - 0.7, bc + 0.7]) { for (let k = 0; k < 3; k++) E.cyl('plastic', bx, 0.15 + k * 0.3, z0 - 0.45, 0.09, 0.09, 0.3, k % 2 ? 0x1a1a1e : 0xffd02a, 10, { cap: k === 2 }); grid.add({ x0: bx - 0.14, x1: bx + 0.14, z0: z0 - 0.59, z1: z0 - 0.31, y0: 0, y1: 1.1, type: 'pole' }); } // bollards: people walk through, cars cannot
    }
  }
  // collision of the front: everything except the doorway and the open bays
  for (const [t, a, b] of segs) if (t === 'glass' || t === 'wall') grid.add({ x0: a, x1: b, z0, z1: FI, y0: 0, y1: gf, type: 'building' });
  for (const [t, a, b] of segs) if (t === 'bay' || t === 'door') { grid.add({ x0: a - 0.12, x1: a, z0, z1: FI, y0: 0, y1: gf, type: 'building' }); grid.add({ x0: b, x1: b + 0.12, z0, z1: FI, y0: 0, y1: gf, type: 'building' }); grid.add({ x0: a, x1: b, z0, z1: FI, y0: 0, y1: gf, type: 'building', vehOnly: true }); }
  // door mat with a border, laid on the pavement in front of the threshold
  E.box('plastic', cx - 1.0, 0.15, z0 - 0.95, cx + 1.0, 0.172, z0 - 0.08, 0x23252c, { no: 'D' }); E.box('plastic', cx - 0.9, 0.172, z0 - 0.87, cx + 0.9, 0.18, z0 - 0.16, mix(acc, 0x20222a, 0.45), { no: 'D' });
  // awning (low shops) or flat canopy (double height lobbies)
  const c2 = 0xf4f0e8, ca = mix(acc, 0x000000, 0.18);
  if (!high) awning(E, ix0 + 0.1, ix1 - 0.1, z0, gf - 0.58, 1.55, 0.5, ca, c2);
  else {
    const hw = Math.min(5.2, (ix1 - ix0) / 2 - 0.4); E.box('clad', cx - hw, 4.15, z0 - 3.2, cx + hw, 4.5, z0 - 0.04, dark, { no: 'D' }); E.box('metal', cx - hw - 0.04, 4.1, z0 - 3.24, cx + hw + 0.04, 4.18, z0 - 3.16, 0xb8bcc6);
    E.rect('glow', 'D', cx - hw + 0.3, cx + hw - 0.3, z0 - 2.9, z0 - 0.4, 4.145, hdr(mix(0xfff0d0, acc, 0.15), 1.1));
    for (const s of [-1, 1]) { E.box('metal', cx + s * (hw - 0.3) - 0.025, 4.5, z0 - 0.15, cx + s * (hw - 0.3) + 0.025, gf - fh - 0.05, z0 - 0.1, 0x8a8f99); }
    if (S.kind === 'casino') { for (let i = 0; i <= 22; i++) { const x = cx - hw + (2 * hw) * i / 22; E.sph('glow', x, 4.32, z0 - 3.24, 0.07, 0.07, 0.07, hdr(i % 2 ? 0xfff0b0 : 0xffb060, 1.3), 6, 4); } for (let i = 1; i < 8; i++) for (const s of [-1, 1]) E.sph('glow', cx + s * hw + 0.0, 4.32, z0 - 3.2 + i * 0.4, 0.07, 0.07, 0.07, hdr(i % 2 ? 0xfff0b0 : 0xffb060, 1.3), 6, 4); }
  }
  // window signs: the word of the shop and OPEN beside the door, lit pictures hanging behind the glass
  const words = { guns: ['guns', 'ammo'], clothes: ['fashion', 'sale'], burger: ['burgers', 'fries'], dealer: ['cars', 'open24'], spray: ['auto', 'open24'], casino: ['casino', 'open24'], bank: ['bank', 'open24'], hospital: ['er', 'open24'], police: ['police', 'open24'], taxi: ['taxi', 'open24'], lounge: ['lounge', 'open'], garage: ['auto', 'open24'], lobby: ['open24', 'open'] }[S.kind] || ['open', 'open24'];
  const sy = high ? 2.7 : 2.0, sz = z0 + 0.3;
  const sign = (id, x, y, w) => { const r = artAtlas().rects[id]; if (!r) return; const hgt = w * r.h / r.w; E.pic('screen', [x + w / 2, y - hgt / 2, sz], [x - w / 2, y - hgt / 2, sz], [x - w / 2, y + hgt / 2, sz], [x + w / 2, y + hgt / 2, sz], id, 0xffffff, [0, 0, 0.03]); };
  const lx = (ix0 + cx - dw) / 2, rx = (ix1 + cx + dw) / 2; if (!sp.bays) { sign(words[0], lx, sy, Math.min(1.8, (cx - dw - ix0) * 0.5)); sign(words[1], rx, sy, 1.0); } else { sign(words[0], lx, sy, 1.6); sign(words[1], rx, sy, 1.0); }
  // downlights under the fascia, a lantern each side of the door
  for (const x of [cx - 2.4, cx + 2.4]) E.box('glow', x - 0.18, gf - fh - 0.085, z0 - 0.5, x + 0.18, gf - fh - 0.06, z0 - 0.2, hdr(0xfff0d0, 1.3));
}

// ---------- the interior shell: fixtures, floor, ceiling, walls, trim ----------
const PAL = [0xff4fa3, 0x3ce8f5, 0xffd34e, 0xff9a3c, 0x7cff8a, 0xc084fc, 0xf4f4f4, 0xe0453a, 0x2f6fe0];
function fixturesOf(S) {
  const { ix0, iz0, iw, dp, gf, sp } = S, fy = gf - 0.15, fx = [], k = S.kind;
  const nx = Math.max(2, Math.round(iw / (k === 'casino' ? 5.5 : 4.4))), nz = Math.max(2, Math.round(dp / (k === 'casino' ? 5.5 : 4.4))), I = { casino: 0.2, lounge: 0.18, bank: 0.34, hospital: 0.4, dealer: 0.46, spray: 0.4, garage: 0.4 }[k] ?? 0.38;
  const strip = k === 'spray' || k === 'garage' || k === 'police' || k === 'hospital';
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) fx.push({ x: ix0 + (i + 0.5) * iw / nx, y: gf > 4 ? gf - 1.1 : fy, z: iz0 + (j + 0.5) * dp / nz, i: I * (gf > 4 ? 1.9 : 1), kind: gf > 4 ? 'pendant' : strip ? 'strip' : 'panel' });
  fx.push({ x: S.cx, y: fy - 0.4, z: iz0 + dp - 1.8, i: 0.7, kind: 'keeper' }); // warm light on the keeper's side of the counter (bake only)
  if (k === 'casino') fx.push({ x: S.cx, y: gf - 2.3, z: iz0 + dp * 0.5, i: 1.6, kind: 'chandelier' });
  return fx;
}
function interiorOf(S) {
  const { ix0, ix1, iz0, iz1, cx, gf, sp } = S, fy = gf - 0.15, fx = S.fx = fixturesOf(S), amb = sp.amb ?? 0.62, gain = sp.gain ?? 1, y0 = FLOORY;
  const bake = (x, y, z, nx, ny, nz) => {
    let b = amb;
    for (let i = 0; i < fx.length; i++) { const f = fx[i], dx = f.x - x, dy = f.y - y, dz = f.z - z, d2 = dx * dx + dy * dy + dz * dz, l = Math.sqrt(d2) || 1; b += f.i / (1 + d2 * 0.085) * (0.3 + 0.7 * Math.max(0, (nx * dx + ny * dy + nz * dz) / l)); }
    const wd = Math.max(0, Math.min(x - ix0, ix1 - x, z - iz0, iz1 - z)), hy = Math.max(0, y - y0);
    return clamp(b * (1 - 0.32 * Math.exp(-wd * 1.5) * Math.exp(-hy * 0.45) - 0.2 * Math.exp(-hy * 5)), 0.2, 1.4) * gain;
  };
  const ib = new IB(bake); ib.r = S.r = mulberry(S.id.length * 7919 + S.id.charCodeAt(0) * 131 + 17); const fk = 'f:' + sp.floor, fs = FLOOR_SIZE[sp.floor], cell = 1.5, ceilC = sp.ceil ?? 0xcfccc6, wallC = sp.wall, dado = sp.dado ?? sp.k1;
  const nxc = Math.ceil((ix1 - ix0) / cell), nzc = Math.ceil((iz1 - iz0) / cell);
  for (let i = 0; i < nxc; i++) for (let j = 0; j < nzc; j++) {
    const xa = ix0 + i * (ix1 - ix0) / nxc, xb = ix0 + (i + 1) * (ix1 - ix0) / nxc, za = iz0 + j * (iz1 - iz0) / nzc, zb = iz0 + (j + 1) * (iz1 - iz0) / nzc;
    ib.rect(fk, 'U', xa, xb, za, zb, y0, sp.floorTint ?? 0xffffff, [[xa / fs, zb / fs], [xb / fs, zb / fs], [xb / fs, za / fs], [xa / fs, za / fs]]);
    ib.rect('matte', 'D', xa, xb, za, zb, fy, ceilC);
  }
  const bands = gf > 4 ? [[y0, 1.25], [1.25, 3.5], [3.5, gf - 0.15]] : [[y0, 1.1], [1.1, 2.3], [2.3, fy]];
  const wall = (f, c, a0, a1) => { const n = Math.ceil((a1 - a0) / cell); for (let i = 0; i < n; i++) { const la = a0 + i * (a1 - a0) / n, lb = a0 + (i + 1) * (a1 - a0) / n; bands.forEach(([b0, b1], bi) => ib.rect('matte', f, la, lb, b0, b1, c, bi === 0 ? dado : wallC)); } };
  wall('E', ix0, iz0, iz1); wall('W', ix1, iz0, iz1); wall('S', iz1, ix0, ix1);
  // skirting, cornice and a neon line round the three walls
  const nl = hdr(sp.k2, 1.25), tr = shade(sp.k1, 0.8);
  for (const [a, b, c, d] of [[ix0, iz0, ix0 + 0.03, iz1], [ix1 - 0.03, iz0, ix1, iz1], [ix0, iz1 - 0.03, ix1, iz1]]) {
    ib.box('plastic', a, y0, b, c, y0 + 0.12, d, tr, { no: 'D' }); ib.box('plastic', a, fy - 0.1, b, c, fy, d, tr, { no: 'DU' });
    ib.box('glow', a, fy - 0.62, b, c, fy - 0.57, d, nl, { no: 'DU' });
  }
  // ceiling fixtures: recessed panels, strips (fluorescent tubes), pendants (tall lobbies), a chandelier (casino)
  const gc = hdr(sp.glowc, 1.12);
  for (const f of fx) {
    if (f.kind === 'keeper') continue;
    if (f.kind === 'panel') { ib.rect('glow', 'D', f.x - 0.6, f.x + 0.6, f.z - 0.3, f.z + 0.3, fy - 0.012, gc); ib.box('metal', f.x - 0.66, fy - 0.03, f.z - 0.36, f.x + 0.66, fy - 0.01, f.z + 0.36, 0x8a8f99, { no: 'UD' }); }
    else if (f.kind === 'strip') { ib.box('metal', f.x - 1.0, fy - 0.1, f.z - 0.13, f.x + 1.0, fy - 0.04, f.z + 0.13, 0x7a7f89, { no: 'U' }); ib.box('glow', f.x - 0.95, fy - 0.12, f.z - 0.07, f.x + 0.95, fy - 0.1, f.z + 0.07, gc, { no: 'U' }); }
    else if (f.kind === 'pendant') { ib.cyl('metal', f.x, f.y + 0.1, f.z, 0.012, 0.012, fy - f.y - 0.1, 0x4a4d55, 5, { cap: false }); ib.cyl('metal', f.x, f.y, f.z, 0.34, 0.12, 0.1, 0x20232a, 12, { cap: false }); ib.cyl('glow', f.x, f.y - 0.012, f.z, 0.3, 0.3, 0.012, gc, 12, { bot: true, cap: false }); }
    else { // chandelier: rings of glowing crystals round a brass hub
      ib.cyl('metal', f.x, f.y, f.z, 0.06, 0.06, gf - 0.15 - f.y, 0xc9a24a, 6, { cap: false });
      for (let r = 0; r < 3; r++) { const R = 0.5 + r * 0.55, n = 10 + r * 6; for (let i = 0; i < n; i++) { const a = i / n * 6.2832; ib.sph('glow', f.x + Math.cos(a) * R, f.y - r * 0.22 - 0.12, f.z + Math.sin(a) * R, 0.07, 0.11, 0.07, hdr(0xffe6b0, 1.4), 6, 4); } ib.cyl('metal', f.x, f.y - r * 0.22 - 0.2, f.z, R, R, 0.03, 0xc9a24a, 20, { cap: false }); }
    }
  }
  // exit sign over the door (inside), a security camera in the back corner
  const er = artAtlas().rects.exit; if (er && gf < 4) ib.pic('screen', [cx + 0.45, gf - 0.62, iz0 + 0.02], [cx - 0.45, gf - 0.62, iz0 + 0.02], [cx - 0.45, gf - 0.62 + 0.34, iz0 + 0.02], [cx + 0.45, gf - 0.62 + 0.34, iz0 + 0.02], 'exit', 0xffffff, [0, 0, 0]);
  ib.at(ix1 - 0.3, fy - 0.35, iz1 - 0.3, 2.35); ib.box('plastic', -0.05, -0.05, -0.2, 0.05, 0.05, 0.2, 0x1a1b20); ib.sph('plastic', 0, -0.06, 0.22, 0.08, 0.06, 0.08, 0x23252b, 8, 5); ib.end();
  ib.at(cx, y0, iz0); S.api = (LAY[S.kind] || LAY.basic)(ib, S);
  const cn = S.api?.counter; if (cn) { ib.cyl('glow', cn.u, 0.002, cn.v, 0.42, 0.42, 0.012, hdr(sp.k2, 1.1), 24, { cap: true }); ib.cyl('plastic', cn.u, 0.004, cn.v, 0.33, 0.33, 0.012, mix(sp.k2, 0xd8d8de, 0.7), 24, { cap: true }); }
  const kp = S.api?.keeper; if (kp) { ib.cyl('glow', kp.u, 0.003, kp.v, 0.95, 0.95, 0.008, hdr(sp.glowc, 0.32), 24, { cap: true }); const ly = Math.min(fy - 0.6, 2.55); ib.cyl('metal', kp.u, ly + 0.1, kp.v, 0.01, 0.01, fy - 0.15 - ly - 0.1, 0x4a4d55, 5, { cap: false }); ib.cyl('metal', kp.u, ly, kp.v, 0.2, 0.09, 0.12, 0x20232a, 10, { cap: false }); ib.cyl('glow', kp.u, ly - 0.012, kp.v, 0.17, 0.17, 0.01, hdr(0xfff0d8, 1.3), 10, { bot: true, cap: false }); } // keeper's post: a warm spot above and a pool on the floor // the customer spot at the till (the prompt appears here)
  ib.end();
  return ib;
}

// ---------- the facade skin of the footprint (same texture rules as GeoBuilder.box: v = height / 14 so the window rows of the floors above stay aligned) ----------
function skin(fb, seed, side, x0, z0, x1, z1, y0, y1) {
  const v0 = y0 / 14, v1 = y1 / 14;
  if (side === 'S') fb.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [[0, v0], [(x1 - x0) / 8, v0], [(x1 - x0) / 8, v1], [0, v1]], seed);
  else if (side === 'N') fb.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [[0, v0], [(x1 - x0) / 8, v0], [(x1 - x0) / 8, v1], [0, v1]], seed);
  else if (side === 'E') fb.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [[0, v0], [(z1 - z0) / 8, v0], [(z1 - z0) / 8, v1], [0, v1]], seed);
  else fb.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [[0, v0], [(z1 - z0) / 8, v0], [(z1 - z0) / 8, v1], [0, v1]], seed);
}

// ---------- shopkeepers ----------
function lookFor(name) {
  if (name === 'cop') return crewLook(LOOKS.cop);
  if (LOOKS[name]) return name !== 'bodyguard' && name !== 'target' && name !== 'player' ? uniformLook(name) : LOOKS[name];
  return randomLook();
}
const _ka = { v: 0, grounded: true, vy: 0, moveYaw: 0, yaw: 0, yawRate: 0, aiming: false, aimPitch: 0, long: false, punch: 0, melee: 'fist', reload: -1, lookAt: null }, _kl = { x: 0, z: 0 };
const wrapPi = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
// A shopkeeper stands at the post behind the counter: faces the door, turns to a customer, waves when the player comes in (rig.setActivity of the people chain, when it exists)
// and raises the hands when the player has a weapon out inside the shop or at its door; he steps back a little. He can still be shot like anybody else.
function keeperUpdate(shops, ped, dt) {
  const G = shops.game, P = G.player, S = ped.shop, h = ped.home, dx = P.x - ped.x, dz = P.z - ped.z, d2 = dx * dx + dz * dz, inside = shops.inId === S.id && !P.dead;
  const armed = !!P.weapon && P.weapon.id !== 'fist' && !P.vehicle && !P.dead && (inside || (d2 < 144 && P.z < S.iz0 + 1.5 && P.x > S.ix0 && P.x < S.ix1));
  ped.afraid += ((armed ? 1 : 0) - ped.afraid) * Math.min(1, dt * 5);
  const rig = ped.char;
  if (inside && !ped.wasIn) ped.greetT = 3.0; // the door chime is Game.updateIndoors' (once per entry); the keeper only greets
  ped.wasIn = inside;
  ped.greetT = Math.max(0, ped.greetT - dt); ped.idleT = (ped.idleT ?? 6 + Math.random() * 8) - dt; if (ped.idleT < 0) { ped.idleT = 9 + Math.random() * 14; ped.lookT = 3.5; } ped.lookT = Math.max(0, (ped.lookT || 0) - dt);
  { const want = ped.afraid > 0.6 ? 'handsUp' : ped.greetT > 0 ? 'wave' : ped.lookT > 0 ? 'lookAround' : null; if (want !== ped.act) { ped.act = want; rig.setActivity(want, want === 'wave' ? { hand: 'R' } : undefined); } }
  // post: step back along the facing direction while afraid
  const back = ped.afraid * 0.32, tx = h.x - Math.sin(h.yaw) * back, tz = h.z - Math.cos(h.yaw) * back; ped.x += (tx - ped.x) * Math.min(1, dt * 6); ped.z += (tz - ped.z) * Math.min(1, dt * 6);
  const yawT = d2 < 64 && !P.dead ? h.yaw + Math.max(-1.9, Math.min(1.9, wrapPi(Math.atan2(dx, dz) - h.yaw))) : h.yaw; // a keeper turns to a customer within a fixed arc and always back to the post
  ped.yaw += wrapPi(yawT - ped.yaw) * Math.min(1, dt * 5);
  ped.y = G.world.groundY(ped.x, ped.z) || 0.15; ped.mesh.position.set(ped.x, ped.y, ped.z); ped.mesh.rotation.y = ped.yaw;
  if (ped.culled || d2 > 3600) return; ped.animAcc = (ped.animAcc || 0) + dt; if (++ped.animSkip < (d2 > 900 ? 4 : d2 > 400 ? 2 : 1)) return;
  const A = _ka; A.v = 0; A.moveYaw = ped.yaw; A.yaw = ped.yaw; A.yawRate = 0; if (d2 < 100 && !P.dead) { _kl.x = P.x; _kl.z = P.z; A.lookAt = _kl; } else A.lookAt = null;
  ped.char.animate(ped.animAcc, A); ped.animAcc = 0; ped.animSkip = 0;
}

// ---------- Shops ----------
const _cp = new THREE.Vector3();
export class Shops {
  constructor(world) {
    this.w = world; this.sites = []; this.byId = {}; this.game = null; this.E = null; world.scene.userData.interiorAt = (x, z) => this.interiorAt(x, z); // sky.js (rain) and fx.js (splashes) read it
    this.grp = new THREE.Group(); this.grp.name = 'shops'; world.scene.add(this.grp);
    this.cullD = world.quality === 'low' ? 80 : 150; this.t = 0; this.built = false; this.recheckT = 0; this.nearT = 0; this.nearId = null; this.hooked = false;
  }
  hasInterior(id) { return !!SPEC[id]; }
  // Called by World.addBuilding for a point of interest: emits the facade skin (upper floors plus the three plain ground-floor walls), records the shop and its solid masses.
  // Returns false when the point of interest has no interior (the caller then builds the solid box as before).
  shell(poi, fb, seed, x0, z0, x1, z1, h) {
    const sp = SPEC[poi.id]; if (!sp) return false; const w = this.w, gf = sp.gf || 3.5, cx = (x0 + x1) / 2;
    const iw = Math.min(sp.iw, x1 - x0 - 2 * WT), dp = Math.min(sp.dp, z1 - z0 - 2 * WT - 0.8);
    const S = { id: poi.id, poi, sp, kind: sp.kind, x0, z0, x1, z1, h, gf, cx, iw, dp, ix0: cx - iw / 2, ix1: cx + iw / 2, iz0: z0 + WT, iz1: z0 + WT + dp, door: 0.85 };
    this.sites.push(S); this.byId[poi.id] = S;
    for (const sd of ['S', 'N', 'E', 'W']) skin(fb, seed, sd, x0, z0, x1, z1, sd === 'S' ? gf : 0.1, h); // the south wall of the ground floor is the storefront (frontOf)
    // solid masses round the hollow: west, east, back; the front wall is added by frontOf (it has the openings); everything above the ground floor is one box
    const g = w.grid, add = (a, b, c, d) => g.add({ x0: a, x1: b, z0: c, z1: d, y0: 0, y1: gf, type: 'building' });
    add(x0, S.ix0, z0, z1); add(S.ix1, x1, z0, z1); add(S.ix0, S.ix1, S.iz1, z1); g.add({ x0, x1, z0, z1, y0: gf, y1: h, type: 'building' });
    w.storeSpill.push({ x0, x1, z: z0, side: 'south', alongX: true, a0: S.ix0 + 0.3, a1: S.ix1 - 0.3, face: z0 - 0.06, dir: -1 }); // the lit shop window throws light on the pavement at night
    return true;
  }
  // After the points of interest exist: storefronts of all shops into one mesh set, an interior mesh set per shop, colliders, the contract data of the points of interest.
  build() {
    const w = this.w, E = this.E = new IB(null); mats();
    for (const S of this.sites) frontOf(S, E, w.grid);
    for (const S of this.sites) {
      const ib = S.ib = interiorOf(S), g = S.group = new THREE.Group(); g.name = 'interior-' + S.id; ib.build(g, false); this.grp.add(g);
      for (const c of ib.cols) w.grid.add(c); S.tris = ib.tris;
      const api = S.api || {}, d = { x: S.cx, z: S.z0 };
      const cn = api.counter ? { x: S.cx + api.counter.u, z: S.iz0 + api.counter.v, yaw: api.counter.yaw ?? 0 } : { x: S.cx, z: S.iz0 + S.dp * 0.6, yaw: 0 };
      const kp = api.keeper ? { x: S.cx + api.keeper.u, z: S.iz0 + api.keeper.v, yaw: api.keeper.yaw ?? Math.PI } : { x: cn.x, z: cn.z + 1.6, yaw: Math.PI };
      const vw = api.view || { cam: [0, 1.65, 0.9], look: [0, 1.25, S.dp * 0.7] };
      S.keepers = [{ role: 'main', x: kp.x, z: kp.z, yaw: kp.yaw, look: S.sp.keeper }, ...(api.extra || []).map(e => ({ role: e.role || 'extra', x: S.cx + e.u, z: S.iz0 + e.v, yaw: e.yaw ?? Math.PI, look: e.look }))];
      S.counter = cn; S.keeperPos = kp; S.anim = api.anim || null; S.carObjs = (api.cars || []).map(c => { const v = new Vehicle(c.type, c.color, S.cx + c.u, S.iz0 + c.v, c.h); v.parked = true; v.y = FLOORY + (c.y || 0); v.syncMesh(0); w.scene.add(v.mesh); return { v, spin: c.spin || 0 }; }); S.kp = S.keepers.map(() => null); S.looks = S.keepers.map(k => lookFor(k.look));
      const rad = Math.hypot(S.iw, S.dp, S.gf) * 0.6; S.rad = rad; g.userData.c = [S.cx, S.gf / 2, S.iz0 + S.dp / 2];
      const poi = w.pois[S.id]; if (poi) { poi.interior = { x0: S.ix0, z0: S.iz0, x1: S.ix1, z1: S.iz1, door: d, counter: cn, keeper: kp, kind: S.kind }; poi.viewInside = { cam: [S.cx + vw.cam[0], vw.cam[1], S.iz0 + vw.cam[2]], look: [S.cx + vw.look[0], vw.look[1], S.iz0 + vw.look[2]] }; }
    }
    for (const S of this.sites) S.shutters = (S.bayList || []).map(bay => this.makeShutter(S, bay));
    E.build(this.grp, true); this.built = true; this.hook();
    for (const S of this.sites) { S.ib.m = null; S.ib = null; } E.m = null; // the builders' arrays are not needed any more (the geometry lives on the GPU buffers)
  }
  // true inside the walls of a shop interior: returns the id of the point of interest, otherwise null
  interiorAt(x, z) { const L = this.sites; for (let i = 0; i < L.length; i++) { const S = L[i]; if (x > S.ix0 && x < S.ix1 && z > S.iz0 && z < S.iz1) return S.id; } return null; }
  // Interiors are drawn only while the camera is near (the Scene hook of flora.js stays in place: this one runs after it).
  hook() {
    if (this.hooked) return; this.hooked = true; const sc = this.w.scene, prev = sc.onBeforeRender;
    sc.onBeforeRender = (r, s, cam) => { if (prev) prev.call(sc, r, s, cam); this.cull(cam); };
  }
  cull(cam) {
    if (!cam.isPerspectiveCamera) return; _cp.setFromMatrixPosition(cam.matrixWorld); this.camPos = this.camPos || { x: 0, z: 0 }; this.camPos.x = _cp.x; this.camPos.z = _cp.z;
    const L = this.sites; for (let i = 0; i < L.length; i++) { const S = L[i], c = S.group.userData.c, d = Math.hypot(c[0] - _cp.x, c[2] - _cp.z), vis = d < this.cullD + S.rad; if (S.group.visible !== vis) { S.group.visible = vis; const cs = S.carObjs; for (let k = 0; k < cs.length; k++) cs[k].v.mesh.visible = vis; } }
  }
  // A roll-up door of a garage bay: ribbed slats that roll up into the lintel when somebody comes near (scale about the lintel) and close when the shop is far;
  // while it is down its collision box blocks the bay (a box with y0 above 3.2 does not collide, so toggling y0 switches it).
  makeShutter(S, bay) {
    const w = this.w, ib = new IB(null), h0 = FLOORY + 0.02; for (let y = h0, k = 0; y < bay.top - 0.01; y += 0.1, k++) ib.box('metal', bay.a + 0.02, y, bay.z - 0.03, bay.b - 0.02, Math.min(y + 0.095, bay.top), bay.z + 0.03, k % 2 ? 0x9aa0aa : 0x858a94);
    ib.box('metal', bay.a + 0.02, h0, bay.z - 0.05, bay.b - 0.02, h0 + 0.09, bay.z + 0.05, 0xe0b020);
    const g = new THREE.Group(); const ms = ib.build(g, true); for (const m of ms) { m.matrixAutoUpdate = true; m.frustumCulled = false; } this.grp.add(g);
    const box = { x0: bay.a, x1: bay.b, z0: bay.z - 0.06, z1: bay.z + 0.06, y0: 99, y1: S.gf, type: 'building' }; w.grid.add(box);
    return { g, box: Object.assign(box, { y0: 0 }), top: bay.top, t: 1 };
  }
  updateShutters(dt) {
    const f = this.game?.player ?? this.camPos; if (!f) return;
    const L = this.sites; for (let i = 0; i < L.length; i++) { const S = L[i], list = S.shutters; if (!list || !list.length) continue; const d = Math.hypot((f.x ?? 0) - S.cx, (f.z ?? 0) - (S.iz0 + 3)), want = d < 30 ? 0.12 : 1; for (let k = 0; k < list.length; k++) { const sh = list[k]; // 1 = down, 0.12 = rolled up
      if (Math.abs(sh.t - want) < 1e-3) continue; sh.t += Math.sign(want - sh.t) * Math.min(Math.abs(want - sh.t), dt * 0.9);
      sh.g.scale.y = sh.t; sh.g.position.y = sh.top * (1 - sh.t); sh.box.y0 = sh.t > 0.5 ? 0 : 99;
    } }
  }
  // ----- keepers -----
  // Called once by the game after it exists (Game.buildWorld); World.update also binds window.__game by itself so the shops are staffed even without that call.
  attach(game) { this.game = game; }
  // The shop menu can be opened at the till: returns the marker record (Game.shopMarkers entry) of the shop whose customer spot the player stands on, else null.
  counterTarget(px, pz, markers) {
    for (const S of this.sites) { const c = S.counter; if (!c || Math.abs(px - c.x) > 1.6 || Math.abs(pz - c.z) > 1.6) continue; if (px > S.ix0 && px < S.ix1 && pz > S.iz0 && pz < S.iz1) { const m = (markers || []).find(k => k.id === S.id); if (m) return m; } }
    return null;
  }
  // The shop the player is in (id) while inside, for rain, ambience and crowds
  playerShop() { return this.inId; }
  tickKeepers(dt) {
    const G = this.game, P = G.player; if (!G.peds || !P) return; this.inId = this.interiorAt(P.x, P.z); this.recheckT -= dt; const L = this.sites;
    for (let n = 0; n < L.length; n++) {
      const S = L[n], dx = P.x - S.cx, dz = P.z - (S.iz0 + S.dp / 2), d2 = dx * dx + dz * dz, near = d2 < 150 * 150, far = d2 > 230 * 230;
      for (let i = 0; i < S.keepers.length; i++) {
        let ped = S.kp[i];
        if (ped && G.peds.indexOf(ped) < 0) ped = S.kp[i] = null; // a new game or a respawn cleared the people
        if (!ped && near && this.recheckT <= 0) ped = S.kp[i] = this.spawnKeeper(S, i);
        else if (ped && far && !ped.dead) { G.removePed(ped); S.kp[i] = null; }
        else if (ped && ped.dead && ped.deadT > 75 && d2 > 2500) { G.removePed(ped); S.kp[i] = null; }
      }
    }
    if (this.recheckT <= 0) this.recheckT = 1.5;
  }
  spawnKeeper(S, i) {
    const G = this.game, k = S.keepers[i], look = S.looks[i]; let ped;
    try { ped = new Ped(G, { kind: 'civ', look, x: k.x, z: k.z, yaw: k.yaw, state: 'idle', noDespawn: true, hp: 100 }); } catch (e) { return null; }
    ped.kind = 'keeper'; ped.station = true; ped.noDespawn = true; ped.state = 'idle'; ped.stateT = 1e12; ped.shop = S; ped.home = k; ped.mood = 0; ped.greetT = 0; ped.wasIn = false; ped.afraid = 0; ped.hx = k.x; ped.hz = k.z;
    const base = Ped.prototype.update, shops = this; ped.update = function (dt) { if (this.dead || this.ragdoll) return base.call(this, dt); keeperUpdate(shops, this, dt); };
    const die = ped.die; ped.die = function (dx, dz, src, head) { if (!this.dead && src === 'player') { try { G.police.reportCrime(S.kind === 'police' ? 'killcop' : 'kill', this.x, this.z); } catch (e) {} } return die.call(this, dx, dz, src, head); };
    G.addPed(ped); return ped;
  }
  setNight(f, rain = 0) { U.glow.value = 1 + 2.4 * f; U.amb.value = 0.78 - 0.12 * f; }
  setQuality(q) { this.cullD = q === 'low' ? 80 : 150; }
  update(dt, t) {
    U.time.value = t % 1000; this.t = t; if (!this.game && typeof globalThis !== 'undefined' && globalThis.__game && globalThis.__game.world === this.w && globalThis.__game.peds) this.game = globalThis.__game;
    if (this.game && this.game.built && this.game.player) this.tickKeepers(dt);
    this.updateShutters(dt);
    this.carT = (this.carT || 0) - dt; if (this.carT <= 0) { this.carT = 0.05; const L = this.sites; for (let i = 0; i < L.length; i++) { const S = L[i], cs = S.carObjs; if (!cs.length || !S.group.visible) continue; for (let k = 0; k < cs.length; k++) { const c = cs[k]; if (c.spin) c.v.heading += c.spin * 0.05; c.v.syncMesh(t); } } }
  }
}
// ---------- props (local frame: y = 0 is the floor, local +z is the front of a prop: yaw 0 looks at the back wall) ----------
const pick = (r, a) => a[Math.floor(r() * a.length)];
function counter(ib, x0, z0, x1, z1, o = {}) { // cabinet with an overhanging top, or a glass vitrine; registers its collision
  const h = o.h ?? 1.05, body = o.body ?? 0x343845, top = o.top ?? 0xeceae4, lowH = o.glass ? 0.86 : h - 0.05, r = ib.r;
  ib.box('plastic', x0, 0, z0, x1, lowH, z1, body, { no: 'D' });
  if (o.acc !== undefined) ib.box('glow', x0 - 0.006, 0.1, z0 - 0.006, x1 + 0.006, 0.15, z1 + 0.006, hdr(o.acc, 1.3), { no: 'UD' });
  if (o.glass) {
    ib.box('plastic', x0 - 0.03, lowH, z0 - 0.03, x1 + 0.03, lowH + 0.03, z1 + 0.03, top, { no: 'D' });
    ib.rect('matte', 'U', x0 + 0.03, x1 - 0.03, z0 + 0.03, z1 - 0.03, lowH + 0.03, o.felt ?? 0x20232a); // the velvet floor of the case
    for (let x = x0 + 0.12; x < x1 - 0.2; x += 0.2 + r() * 0.2) { const w = 0.07 + r() * 0.1; ib.box('metal', x, lowH + 0.03, (z0 + z1) / 2 - 0.07, x + w, lowH + 0.03 + 0.04 + r() * 0.1, (z0 + z1) / 2 + 0.07, o.items ? pick(r, o.items) : 0x2a2d33); }
    const gy0 = lowH + 0.03, gy1 = lowH + 0.4;
    ib.rect('glass', 'S', x0 + 0.02, x1 - 0.02, gy0, gy1, z0 + 0.02, 0xffffff); ib.rect('glass', 'N', x0 + 0.02, x1 - 0.02, gy0, gy1, z1 - 0.02, 0xffffff); ib.rect('glass', 'W', z0 + 0.02, z1 - 0.02, gy0, gy1, x0 + 0.02, 0xffffff); ib.rect('glass', 'E', z0 + 0.02, z1 - 0.02, gy0, gy1, x1 - 0.02, 0xffffff); ib.rect('glass', 'U', x0 + 0.02, x1 - 0.02, z0 + 0.02, z1 - 0.02, gy1, 0xffffff);
    for (const [px, pz] of [[x0, z0], [x1 - 0.03, z0], [x0, z1 - 0.03], [x1 - 0.03, z1 - 0.03]]) ib.box('metal', px, gy0, pz, px + 0.03, gy1 + 0.02, pz + 0.03, 0xaab0ba);
    ib.box('metal', x0, gy1, z0, x1, gy1 + 0.03, z0 + 0.03, 0xaab0ba); ib.box('metal', x0, gy1, z1 - 0.03, x1, gy1 + 0.03, z1, 0xaab0ba);
  } else ib.box('plastic', x0 - 0.04, h - 0.05, z0 - 0.04, x1 + 0.04, h, z1 + 0.04, top, { no: 'D' });
  ib.col(x0 - 0.04, z0 - 0.04, x1 + 0.04, z1 + 0.04, o.glass ? 1.3 : h);
}
function till(ib, x, y, z, yaw = 0) { ib.at(x, y, z, yaw); ib.box('plastic', -0.2, 0, -0.17, 0.2, 0.09, 0.17, 0x1b1d22); ib.box('plastic', -0.15, 0.09, -0.03, 0.15, 0.34, 0.03, 0x15171c); ib.rect('glow', 'N', -0.13, 0.13, 0.12, 0.31, 0.031, hdr(0x6fe0ff, 0.8)); ib.box('plastic', 0.2, 0, -0.1, 0.34, 0.2, 0.1, 0x2a2d34); ib.end(); }
function shelf(ib, x, z, L, d, yaw, o = {}) { // shelving unit: back, sides, boards, rows of boxes; front is +z
  const h = o.h ?? 2.0, n = o.n ?? 4, body = o.body ?? 0x3a3d48, pal = o.pal ?? PAL, r = ib.r, iH = o.itemH ?? [0.1, 0.3], gap = (h - 0.15) / n;
  ib.at(x, 0, z, yaw); ib.box('matte', -L / 2, 0, -d / 2, L / 2, h, -d / 2 + 0.04, body, { no: 'S' }); ib.box('matte', -L / 2, 0, -d / 2, -L / 2 + 0.04, h, d / 2, body); ib.box('matte', L / 2 - 0.04, 0, -d / 2, L / 2, h, d / 2, body);
  for (let k = 0; k < n; k++) {
    const y = 0.1 + k * gap; ib.box('matte', -L / 2, y, -d / 2, L / 2, y + 0.03, d / 2, shade(body, 1.2), { no: 'D' });
    for (let u = -L / 2 + 0.12; u < L / 2 - 0.2; u += 0.26 + r() * 0.12) { ib.box('plastic', u, y + 0.005, d / 2, u + 0.1, y + 0.03, d / 2 + 0.012, 0xf4f0e0, { no: 'D' }); ib.box('plastic', u + 0.01, y + 0.012, d / 2 + 0.012, u + 0.05, y + 0.026, d / 2 + 0.016, pick(r, [0xe0453a, 0xffd34e, 0x1d2027])); } // price tags on the shelf lip
    for (let u = -L / 2 + 0.07; u < L / 2 - 0.2;) { const w = 0.08 + r() * 0.16, hh = iH[0] + r() * (iH[1] - iH[0]), dd = Math.min(d - 0.1, 0.1 + r() * 0.22); ib.box('matte', u, y + 0.03, -d / 2 + 0.05, Math.min(u + w, L / 2 - 0.06), y + 0.03 + hh, -d / 2 + 0.05 + dd, pick(r, pal), { no: 'D' }); u += w + 0.015 + r() * 0.04; }
  }
  ib.col(-L / 2, -d / 2, L / 2, d / 2, h); ib.end();
}
function chair(ib, x, z, yaw, c = 0xd8452a, o = {}) { ib.at(x, 0, z, yaw); const h = o.h ?? 0.45; ib.box('plastic', -0.21, h - 0.05, -0.2, 0.21, h, 0.21, c, { no: 'D' }); ib.box('plastic', -0.21, h, -0.22, 0.21, h + 0.42, -0.18, c); for (const sx of [-1, 1]) for (const sz of [-1, 1]) ib.box('metal', sx * 0.18 - 0.01, 0, sz * 0.17 - 0.01, sx * 0.18 + 0.01, h - 0.05, sz * 0.17 + 0.01, 0x9aa0aa, { no: 'UD' }); ib.end(); }
function stool(ib, x, z, c = 0xc01020, h = 0.66) { ib.cyl('plastic', x, h - 0.06, z, 0.19, 0.19, 0.06, c, 10, { bot: true }); ib.cyl('metal', x, 0.04, z, 0.025, 0.025, h - 0.1, 0xb8bcc6, 6, { cap: false }); ib.cyl('metal', x, 0, z, 0.17, 0.17, 0.04, 0x8a8f99, 10); }
function table(ib, x, z, w, d, h, topc = 0xeceae4, legc = 0x8a8f99, round = false) {
  if (round) { ib.cyl('plastic', x, h - 0.04, z, w / 2, w / 2, 0.04, topc, 16, { bot: true }); ib.cyl('metal', x, 0.03, z, 0.04, 0.04, h - 0.07, legc, 6, { cap: false }); ib.cyl('metal', x, 0, z, 0.26, 0.26, 0.03, legc, 12); ib.col(x - w / 2, z - w / 2, x + w / 2, z + w / 2, h); return; }
  ib.box('plastic', x - w / 2, h - 0.04, z - d / 2, x + w / 2, h, z + d / 2, topc, { no: 'D' }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) ib.box('metal', x + sx * (w / 2 - 0.06) - 0.02, 0, z + sz * (d / 2 - 0.06) - 0.02, x + sx * (w / 2 - 0.06) + 0.02, h - 0.04, z + sz * (d / 2 - 0.06) + 0.02, legc, { no: 'UD' }); ib.col(x - w / 2, z - d / 2, x + w / 2, z + d / 2, h);
}
function sofa(ib, x, z, w, yaw, c = 0x3a4a7a) { ib.at(x, 0, z, yaw); ib.box('matte', -w / 2, 0.08, -0.45, w / 2, 0.42, 0.42, c, { no: 'D' }); ib.box('matte', -w / 2, 0.42, -0.45, w / 2, 0.85, -0.22, c); for (const s of [-1, 1]) ib.box('matte', s < 0 ? -w / 2 - 0.12 : w / 2, 0.08, -0.45, s < 0 ? -w / 2 : w / 2 + 0.12, 0.62, 0.42, shade(c, 0.85)); ib.box('matte', -w / 2 + 0.05, 0.42, -0.2, w / 2 - 0.05, 0.5, 0.4, shade(c, 1.15), { no: 'D' }); for (const s of [-1, 1]) ib.box('metal', s * (w / 2 - 0.1), 0, 0.3, s * (w / 2 - 0.1) + 0.04, 0.08, 0.34, 0x20232a); ib.col(-w / 2 - 0.12, -0.45, w / 2 + 0.12, 0.42, 0.85); ib.end(); }
function poster(ib, id, x, y, z, w, h, yaw, color = 0xffffff) { ib.at(x, y, z, yaw); ib.pic('art', [-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], id, color); ib.box('metal', -w / 2 - 0.02, -h / 2 - 0.02, -0.025, w / 2 + 0.02, h / 2 + 0.02, -0.002, 0x20232a, { no: 'N' }); ib.end(); }
function screenQuad(ib, id, x, y, z, w, h, yaw, anim = [0, 0, 0.02]) { ib.at(x, y, z, yaw); ib.pic('screen', [-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], id, 0xffffff, anim); ib.box('metal', -w / 2 - 0.03, -h / 2 - 0.03, -0.04, w / 2 + 0.03, h / 2 + 0.03, -0.003, 0x15171c, { no: 'N' }); ib.end(); }
function glowSign(ib, id, x, y, z, w, yaw) { const r = artAtlas().rects[id]; if (r) screenQuad(ib, id, x, y, z, w, w * r.h / r.w, yaw, [0, 0, 0.015]); }
// a gun lying along local +x (barrel to +x), seen from the side
function gun(ib, kind, x, y, z, yaw = 0, k = 1) {
  ib.at(x, y, z, yaw); const D = 0x17191d, M = 0x2b2e35, W = 0x6e4524;
  if (kind === 'rifle') { ib.box('plastic', -0.45 * k, -0.045 * k, -0.02, -0.2 * k, 0.04 * k, 0.02, M); ib.box('metal', -0.2 * k, -0.04 * k, -0.025, 0.08 * k, 0.05 * k, 0.025, D); ib.box('plastic', 0.08 * k, -0.03 * k, -0.02, 0.3 * k, 0.03 * k, 0.02, M); ib.box('metal', 0.3 * k, -0.012 * k, -0.01, 0.62 * k, 0.012 * k, 0.01, D); ib.box('metal', -0.1 * k, -0.17 * k, -0.015, -0.03 * k, -0.04 * k, 0.015, D); ib.box('metal', -0.18 * k, 0.05 * k, -0.01, 0.0, 0.075 * k, 0.01, D); ib.box('plastic', -0.02 * k, -0.07 * k, -0.015, 0.02 * k, -0.04 * k, 0.015, M); }
  else if (kind === 'shotgun') { ib.box('plastic', -0.5 * k, -0.04 * k, -0.02, -0.2 * k, 0.045 * k, 0.02, W); ib.box('metal', -0.2 * k, -0.03 * k, -0.025, 0.02 * k, 0.04 * k, 0.025, D); ib.box('metal', 0.02 * k, 0.005 * k, -0.013, 0.7 * k, 0.03 * k, 0.013, D); ib.box('metal', 0.02 * k, -0.02 * k, -0.011, 0.55 * k, 0.0, 0.011, M); ib.box('plastic', 0.16 * k, -0.03 * k, -0.02, 0.36 * k, 0.0, 0.02, W); }
  else if (kind === 'smg') { ib.box('metal', -0.16 * k, -0.04 * k, -0.02, 0.18 * k, 0.05 * k, 0.02, D); ib.box('metal', 0.18 * k, -0.01 * k, -0.01, 0.32 * k, 0.02 * k, 0.01, M); ib.box('metal', -0.3 * k, 0.0, -0.01, -0.16 * k, 0.04 * k, 0.01, M); ib.box('metal', -0.02 * k, -0.2 * k, -0.012, 0.03 * k, -0.04 * k, 0.012, M); ib.box('plastic', -0.12 * k, -0.12 * k, -0.014, -0.08 * k, -0.04 * k, 0.014, M); }
  else if (kind === 'sniper') { ib.box('plastic', -0.5 * k, -0.045 * k, -0.02, -0.2 * k, 0.05 * k, 0.02, 0x3a4a2a); ib.box('metal', -0.2 * k, -0.04 * k, -0.025, 0.1 * k, 0.05 * k, 0.025, D); ib.box('metal', 0.1 * k, -0.01 * k, -0.011, 0.78 * k, 0.014 * k, 0.011, D); ib.cyl('metal', -0.02 * k, 0.075 * k, 0, 0.032 * k, 0.032 * k, 0.32 * k, M, 8, { ax: 'x', cap: true, bot: true }); ib.cyl('metal', 0.5 * k, -0.04 * k, 0, 0.006, 0.006, 0.0, D, 3, { cap: false }); }
  else if (kind === 'bat') ib.cyl('plastic', -0.2, 0, 0, 0.018 * k, 0.04 * k, 0.8 * k, 0xb08a52, 8, { ax: 'x', cap: true });
  else { ib.box('metal', 0, 0, -0.012, 0.19 * k, 0.04 * k, 0.012, D); ib.box('plastic', 0, -0.1 * k, -0.011, 0.045 * k, 0.0, 0.011, M); ib.box('metal', 0.19 * k, 0.005 * k, -0.007, 0.21 * k, 0.03 * k, 0.007, D); }
  ib.end();
}
// a shop mannequin in the clothes of an outfit of config.js (o.look: shirt, pants, jacket, shorts, hat, cap, glasses)
function mannequin(ib, x, z, yaw, look, base = 0) {
  const sh = look.shirt ?? 0xffffff, pa = look.pants ?? 0x1c2540, ja = look.jacket, plastic = 0xe4e0d8, y = base; ib.at(x, y, z, yaw);
  ib.cyl('metal', 0, 0, 0, 0.26, 0.26, 0.03, 0xaab0ba, 14, { bot: false }); ib.cyl('metal', 0, 0.03, 0, 0.02, 0.02, 0.9, 0xaab0ba, 6, { cap: false });
  const legC = look.shorts ? plastic : pa; // shorts leave the lower leg bare plastic
  for (const s of [-1, 1]) { ib.cyl('matte', s * 0.1, 0.45, 0.0, 0.06, 0.075, 0.5, pa, 8, { cap: false }); ib.cyl('matte', s * 0.1, 0.0, 0.0, 0.045, 0.06, 0.5, legC, 8, { cap: false }); ib.cyl('plastic', s * 0.1, 0.0, 0.05, 0.05, 0.05, 0.05, 0x1a1a1e, 6); }
  ib.sph('matte', 0, 0.96, 0, 0.19, 0.12, 0.12, pa, 10, 6); ib.sph('matte', 0, 1.3, 0, 0.19, 0.31, 0.12, sh, 10, 8);
  if (ja) { ib.sph('matte', 0, 1.3, 0.01, 0.205, 0.31, 0.135, ja, 10, 8); ib.box('matte', -0.012, 1.0, 0.126, 0.012, 1.6, 0.134, sh, { no: 'D' }); }
  for (const s of [-1, 1]) { const ac = ja ?? sh; ib.cyl('matte', s * 0.23, 1.35, 0, 0.055, 0.045, 0.3, ac, 8, { cap: false }); ib.cyl('matte', s * 0.25, 1.05, 0.04, 0.045, 0.05, 0.32, look.shorts || (!ja && look.sleeves === 'short') ? plastic : ac, 8, { cap: false, bot: true }); }
  ib.cyl('plastic', 0, 1.56, 0, 0.05, 0.06, 0.1, plastic, 6, { cap: false }); ib.sph('plastic', 0, 1.7, 0.01, 0.1, 0.125, 0.115, plastic, 10, 8);
  if (look.hat) { ib.cyl('matte', 0, 1.77, 0, 0.2, 0.2, 0.02, look.hat, 12, { bot: true }); ib.cyl('matte', 0, 1.78, 0, 0.1, 0.1, 0.1, look.hat, 10); }
  if (look.cap) { ib.cyl('matte', 0, 1.78, 0, 0.115, 0.1, 0.07, look.cap, 10, { bot: false }); ib.box('matte', -0.09, 1.78, 0.1, 0.09, 1.795, 0.2, look.cap); }
  if (look.glasses) ib.box('plastic', -0.085, 1.7, 0.1, 0.085, 1.73, 0.13, 0x14151a);
  if (look.tie) ib.box('matte', -0.015, 1.25, 0.13, 0.015, 1.5, 0.14, look.tie);
  ib.col(-0.28, -0.28, 0.28, 0.28, 1.9); ib.end();
}
function slot(ib, x, z, yaw, o = {}) { // slot machine, front +z: cabinet, three scrolling reels, button deck, lit marquee, a stool
  const r = ib.r, c = o.c ?? pick(r, [0xd01c3a, 0x7a1cd0, 0xd08a1c, 0x1c7ad0, 0x1cd06a]); ib.at(x, 0, z, yaw);
  ib.box('plastic', -0.38, 0, -0.3, 0.38, 1.0, 0.28, 0x15171c, { no: 'D' }); ib.box('plastic', -0.38, 1.0, -0.3, 0.38, 1.9, 0.08, 0x1a1c22);
  ib.box('plastic', -0.38, 1.0, 0.08, -0.34, 1.78, 0.14, c); ib.box('plastic', 0.34, 1.0, 0.08, 0.38, 1.78, 0.14, c); // coloured side trims
  ib.box('plastic', -0.38, 0.95, 0.0, 0.38, 1.0, 0.42, 0x23252c, { no: 'D' }); // button deck
  for (let i = 0; i < 5; i++) ib.box('glow', -0.2 + i * 0.1, 1.0, 0.14, -0.14 + i * 0.1, 1.012, 0.2, hdr(i === 2 ? 0xff3030 : pick(r, [0xffd34e, 0x3ce8f5, 0x7cff8a]), 1.2));
  for (let i = 0; i < 3; i++) { const x0 = -0.28 + i * 0.19, sp = 0.45 + r() * 0.5, ph = r(); ib.pic('screen', [x0, 1.28, 0.145], [x0 + 0.17, 1.28, 0.145], [x0 + 0.17, 1.72, 0.145], [x0, 1.72, 0.145], 'reels', 0xffffff, [(i % 2 ? -1 : 1) * sp * 0.3, ph, 0.0], [0, 0.375]); }
  ib.box('matte', -0.3, 1.24, 0.14, 0.3, 1.28, 0.16, 0x0a0a0c, { no: 'ND' }); ib.box('matte', -0.3, 1.72, 0.14, 0.3, 1.76, 0.16, 0x0a0a0c, { no: 'ND' });
  const mq = artAtlas().rects.casino; if (mq) ib.pic('screen', [-0.34, 1.8, 0.09], [0.34, 1.8, 0.09], [0.34, 1.92, 0.09], [-0.34, 1.92, 0.09], 'casino', 0xffffff, [0, 0, 0.1 + 0.2 * r()]);
  ib.box('glow', -0.38, 1.9, -0.3, 0.38, 1.94, 0.1, hdr(c, 1.2)); stool(ib, 0, 0.8, 0xa81428, 0.62); ib.col(-0.4, -0.32, 0.4, 0.44, 1.9); ib.end();
}

// ---------- layouts: u across (from the door axis), v depth from the front wall. Each returns the customer spot, the keeper spot and the camera used for close-ups ----------
const OUT = look => OUTFITS.find(o => o.id === look)?.look ?? OUTFITS[0].look;
const LAY = {
  basic(ib, S) { counter(ib, -2.5, S.dp - 3, 2.5, S.dp - 2.2, { acc: S.sp.k2 }); return { counter: { u: 0, v: S.dp - 3.8 }, keeper: { u: 0, v: S.dp - 1.4 } }; },

  // ----- gun shop: wall of weapons, glass counter, ammo shelves, targets, a safe, a display window -----
  guns(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, ac = S.sp.k2, kinds = ['rifle', 'shotgun', 'smg', 'sniper', 'rifle', 'shotgun'];
    // the rack: a pegboard on the back wall, backlit, three rows of weapons, a low cabinet below
    ib.box('matte', -hw + 1.2, 0.85, dp - 0.1, hw - 1.2, 3.05, dp - 0.03, 0x1b1d23, { no: 'DS' }); ib.box('glow', -hw + 1.2, 3.05, dp - 0.12, hw - 1.2, 3.1, dp - 0.04, hdr(ac, 1.2), { no: 'DS' });
    for (let y = 0.95; y < 3.0; y += 0.12) for (let x = -hw + 1.3; x < hw - 1.2; x += 0.12) if (r() < 0.002) ib.box('metal', x, y, dp - 0.12, x + 0.02, y + 0.02, dp - 0.1, 0x6a6f79);
    for (let x = -hw + 2.2, i = 0; x < hw - 1.6; x += 2.0, i++) gun(ib, kinds[i % kinds.length], x, 2.62, dp - 0.14, 0, 1.45);
    for (let x = -hw + 2.0, i = 0; x < hw - 1.4; x += 1.45, i++) gun(ib, i % 3 === 0 ? 'smg' : 'shotgun', x, 1.95, dp - 0.14, 0, 1.3);
    for (let x = -hw + 1.7; x < hw - 1.4; x += 0.5) gun(ib, 'pistol', x, 1.38, dp - 0.14, 0, 1.6);
    for (let x = -hw + 1.7; x < hw - 1.4; x += 0.5) ib.box('metal', x - 0.01, 1.34, dp - 0.14, x + 0.01, 1.4, dp - 0.1, 0x6a6f79);
    ib.box('plastic', -hw + 1.0, 0, dp - 0.6, hw - 1.0, 0.85, dp - 0.04, 0x23262d, { no: 'D' }); ib.box('plastic', -hw + 0.96, 0.85, dp - 0.64, hw - 0.96, 0.89, dp - 0.04, 0x5a5f69); ib.col(-hw + 1.0, dp - 0.6, hw - 1.0, dp - 0.04, 0.89);
    for (let x = -hw + 1.6; x < hw - 1.4; x += 1.4) ib.box('metal', x, 0.5, dp - 0.605, x + 0.3, 0.55, dp - 0.595, 0x8a8f99);
    // glass counter, till, a flat end for the cash drawer
    counter(ib, -3.6, dp - 3.4, 2.4, dp - 2.6, { glass: true, body: 0x23262d, top: 0x6a6f79, acc: ac, items: [0x2a2d33, 0x1a1c20, 0x8a8f99] }); counter(ib, 2.4, dp - 3.4, 3.8, dp - 2.6, { body: 0x23262d, top: 0xe6e2da, acc: ac }); till(ib, 3.1, 1.05, dp - 3.0);
    for (let i = 0; i < 4; i++) ib.box('matte', -1.6 + i * 0.4, 1.31, dp - 3.45, -1.3 + i * 0.4, 1.4 + r() * 0.05, dp - 3.25, i % 2 ? 0xe0453a : 0xd8b030); // ammo boxes on the vitrine
    // islands: two low glass cases
    counter(ib, -5.6, 4.3, -3.6, 5.1, { glass: true, body: 0x23262d, top: 0x6a6f79, acc: ac, items: [0x2a2d33, 0x1a1c20] }); counter(ib, 3.6, 4.3, 5.6, 5.1, { glass: true, body: 0x23262d, top: 0x6a6f79, acc: ac, items: [0x2a2d33, 0x1a1c20] });
    // side walls: ammo shelving left, shelving and targets right
    for (const v of [3.4, 5.2, 7.0]) shelf(ib, -hw + 0.3, v, 1.7, 0.5, Math.PI / 2, { h: 2.1, n: 4, body: 0x2c2f38, pal: [0xe0453a, 0xd8b030, 0x3a6a3a, 0xc8c8c8, 0x2f6fe0], itemH: [0.08, 0.2] });
    for (const v of [3.4, 7.0]) shelf(ib, hw - 0.3, v, 1.7, 0.5, -Math.PI / 2, { h: 2.1, n: 4, body: 0x2c2f38, pal: [0x4a5a3a, 0x8a8f99, 0x3a3f4a, 0xe0453a], itemH: [0.1, 0.28] });
    poster(ib, 'target', hw - 0.03, 1.7, 5.2, 0.9, 1.35, -Math.PI / 2); poster(ib, 'target2', hw - 0.03, 1.7, 6.2, 0.9, 1.35, -Math.PI / 2); poster(ib, 'target', -hw + 0.03, 2.9, 4.4, 0.7, 1.05, Math.PI / 2, 0xe8e0d0);
    glowSign(ib, 'logoArms', hw - 0.05, 2.75, 8.6, 2.6, -Math.PI / 2);
    // safe in the back corner
    ib.box('metal', hw - 1.7, 0, dp - 1.5, hw - 0.5, 1.25, dp - 0.4, 0x3c4048); ib.cyl('metal', hw - 1.1, 0.7, dp - 1.52, 0.17, 0.17, 0.03, 0xa0a6b0, 14, { ax: 'z', bot: true }); ib.box('metal', hw - 1.5, 0.9, dp - 1.53, hw - 1.2, 1.1, dp - 1.5, 0xd0d4dc); ib.col(hw - 1.7, dp - 1.5, hw - 0.5, dp - 0.4, 1.25);
    // window displays (behind the glass): a plinth with rifles on stands, and a vest on a mannequin
    ib.box('matte', -hw + 0.4, 0, 0.35, -1.6, 0.32, 1.45, 0x2c2f38, { no: 'D' }); ib.box('plastic', -hw + 0.38, 0.32, 0.33, -1.58, 0.35, 1.47, 0x5a5f69, { no: 'D' }); ib.col(-hw + 0.4, 0.35, -1.6, 1.45, 0.35);
    for (let i = 0; i < 3; i++) { const x = -hw + 1.6 + i * 1.5; ib.box('metal', x - 0.02, 0.35, 0.9, x + 0.02, 0.9, 0.94, 0x6a6f79); gun(ib, i === 1 ? 'sniper' : 'rifle', x, 0.98, 0.92, 0.55, 0.9); }
    ib.box('matte', 1.6, 0, 0.35, hw - 0.4, 0.32, 1.45, 0x2c2f38, { no: 'D' }); ib.box('plastic', 1.58, 0.32, 0.33, hw - 0.38, 0.35, 1.47, 0x5a5f69, { no: 'D' }); ib.col(1.6, 0.35, hw - 0.4, 1.45, 0.35);
    mannequin(ib, hw - 1.7, 0.9, Math.PI, { shirt: 0x3a4a2a, pants: 0x3a3f4a, jacket: 0x2a2e38, hat: 0x2a2e38 }, 0.35); poster(ib, 'target2', hw - 3.9, 1.5, 0.45, 0.7, 1.0, Math.PI);
    return { counter: { u: -0.6, v: dp - 4.2, yaw: 0 }, keeper: { u: -0.6, v: dp - 1.7, yaw: Math.PI }, extra: [{ role: 'customer', u: 2.2, v: dp - 4.9, yaw: 0 }, { role: 'customer', u: -5.2, v: 5.8, yaw: -Math.PI / 2 }], view: { cam: [0, 1.6, 0.8], look: [0, 1.05, dp - 2] } };
  },

  // ----- clothes: window stage with mannequins in the outfits of the game, racks, mirrors, fitting booths, a wrap desk -----
  clothes(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, ac = S.sp.k2, wood = 0xcaa070;
    for (const [x0, x1] of [[-hw + 0.4, -1.5], [1.5, hw - 0.4]]) { ib.box('plastic', x0, 0, 0.35, x1, 0.3, 1.5, 0xf4efe8, { no: 'D' }); ib.box('glow', x0, 0.28, 0.33, x1, 0.31, 1.52, hdr(ac, 1.0), { no: 'UD' }); ib.col(x0, 0.35, x1, 1.5, 0.3); }
    const win = ['street', 'beach', 'suit', 'track', 'leather', 'hawaii'];
    win.forEach((id, i) => { const left = i < 3, k = i % 3, x = left ? -hw + 1.6 + k * 2.4 : 3.0 + k * 2.4; mannequin(ib, x, 0.95, Math.PI + (k - 1) * 0.28 * (left ? 1 : -1), OUT(id), 0.3); });
    // the gold outfit on its own lit pedestal in the middle left
    ib.cyl('plastic', -hw + 2.4, 0, 6.2, 0.7, 0.7, 0.28, 0xf4efe8, 18, { bot: false }); ib.cyl('glow', -hw + 2.4, 0.27, 6.2, 0.68, 0.68, 0.015, hdr(0xffd34e, 1.2), 18); ib.col(-hw + 1.7, 5.5, -hw + 3.1, 6.9, 0.28); mannequin(ib, -hw + 2.4, 6.2, 0.3, OUT('gold'), 0.28);
    // rails with garments
    const rack = (x, z, yaw) => { ib.at(x, 0, z, yaw); for (const s of [-1, 1]) { ib.box('metal', s * 0.86 - 0.025, 0, -0.3, s * 0.86 + 0.025, 0.04, 0.3, 0xc9ccd4); ib.box('metal', s * 0.86 - 0.015, 0.04, -0.015, s * 0.86 + 0.015, 1.65, 0.015, 0xc9ccd4); } ib.cyl('metal', -0.88, 1.62, 0, 0.014, 0.014, 1.76, 0xc9ccd4, 6, { ax: 'x', cap: false });
      for (let i = 0; i < 13; i++) { const hh = 0.55 + r() * 0.3, c = pick(r, PAL.concat([0xf4efe8, 0x1c2540, 0x2b2b2b, 0xcfe3f5])); ib.box('matte', -0.78 + i * 0.13, 1.6 - hh, -0.23, -0.78 + i * 0.13 + 0.06, 1.6, 0.23, c); ib.box('matte', -0.78 + i * 0.13 - 0.005, 1.5, -0.27, -0.78 + i * 0.13 + 0.065, 1.6, 0.27, shade(c, 0.9)); } ib.col(-0.95, -0.3, 0.95, 0.3, 1.65); ib.end(); };
    for (const v of [4.4, 7.0]) { rack(-5.3, v, 0); rack(4.2, v, 0); rack(7.0, v, 0); }
    // wall shelving with folded stacks, a rail along the left wall, shoe wall
    for (const v of [3.0, 4.6]) shelf(ib, -hw + 0.28, v, 1.5, 0.45, Math.PI / 2, { h: 2.1, n: 5, body: wood, pal: [0xf4efe8, 0x1c2540, 0xff9ad5, 0x3ce8f5, 0xffd34e, 0x2b2b2b], itemH: [0.08, 0.16] });
    // mirrors on the right wall (polished metal in a frame)
    for (const v of [3.3, 5.0, 6.7]) { ib.box('metal', hw - 0.07, 0.2, v - 0.55, hw - 0.04, 2.15, v + 0.55, 0xe4eaf2); ib.box('plastic', hw - 0.08, 0.17, v - 0.6, hw - 0.03, 0.2, v + 0.6, ac); ib.box('plastic', hw - 0.08, 2.15, v - 0.6, hw - 0.03, 2.18, v + 0.6, ac); ib.box('plastic', hw - 0.08, 0.2, v - 0.6, hw - 0.03, 2.15, v - 0.55, ac); ib.box('plastic', hw - 0.08, 0.2, v + 0.55, hw - 0.03, 2.15, v + 0.6, ac); }
    poster(ib, 'ad1', -hw + 0.03, 2.55, 7.4, 0.9, 1.35, Math.PI / 2); poster(ib, 'ad2', -hw + 0.03, 2.55, 8.8, 0.9, 1.35, Math.PI / 2);
    // three fitting booths in the back left corner, curtains in pink, violet, lilac
    [0xff7ac8, 0xa06af0, 0xc8a0ff].forEach((c, i) => { const x0 = -hw + 3.9 + i * 1.5, x1 = x0 + 1.4; ib.box('matte', x0, 0, dp - 1.8, x0 + 0.05, 2.3, dp - 0.05, wood); if (i === 2) ib.box('matte', x1 - 0.05, 0, dp - 1.8, x1, 2.3, dp - 0.05, wood); ib.box('matte', x0, 2.3, dp - 1.8, x1, 2.34, dp - 0.05, wood); ib.box('matte', x0 + 0.05, 0.25, dp - 1.85, x1 - (i === 2 ? 0.05 : 0), 2.2, dp - 1.8, c); ib.col(x0, dp - 1.85, x1, dp - 0.05, 2.3); });
    glowSign(ib, 'sale', -hw + 5.5, 2.9, dp - 0.04, 1.6, Math.PI);
    // wrap desk and till in the back right corner, bags, a rack of belts and hats
    counter(ib, 3.2, dp - 3.3, Math.min(8.4, hw - 0.4), dp - 2.55, { body: 0xf4efe8, top: 0xe8c890, acc: ac }); till(ib, 5.0, 1.05, dp - 2.9);
    for (let i = 0; i < 4; i++) { const x = 6.0 + i * 0.55, c = pick(r, [0xff9ad5, 0xffffff, 0x2b2b2b, 0x3ce8f5]); ib.box('matte', x, 1.05, dp - 3.2, x + 0.34, 1.5, dp - 2.8, c); ib.box('metal', x + 0.08, 1.5, dp - 3.02, x + 0.26, 1.52, dp - 3.0, 0xd8dce4); }
    glowSign(ib, 'logoSunset', 4.4, 3.1, dp - 0.04, 3.4, Math.PI);
    return { counter: { u: 5.0, v: dp - 4.1, yaw: 0 }, keeper: { u: 5.0, v: dp - 1.7, yaw: Math.PI }, extra: [{ role: 'customer', u: 2.0, v: dp - 4.9, yaw: 0 }], view: { cam: [-1.5, 1.6, 0.8], look: [1.5, 1.0, dp * 0.6] } };
  },

  // ----- burger bar: checkered floor, window bar, booths, order counter with menu boards, kitchen, drink machine -----
  burger(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, red = 0xd8452a, cream = 0xf6e8d4, steel = 0xc5cad2, cv = dp - 4.7;
    for (const [x0, x1] of [[-hw + 0.4, -1.7], [1.7, hw - 0.4]]) { ib.box('plastic', x0, 0, 0.3, x1, 1.0, 0.95, 0xf4efe8, { no: 'D' }); ib.box('plastic', x0 - 0.04, 1.0, 0.28, x1 + 0.04, 1.05, 1.0, 0x3a2a22, { no: 'D' }); ib.col(x0, 0.3, x1, 0.95, 1.05); for (let x = x0 + 0.7; x < x1 - 0.3; x += 1.2) stool(ib, x, 1.5, red, 0.76); }
    ib.box('glow', -hw + 0.4, 0.05, 0.3, hw - 0.4, 0.09, 0.31, hdr(S.sp.k2, 1.2), { no: 'D' });
    // tables with chairs, booths on the side walls
    for (const v of [4.0, 6.5]) for (const u of [-6.2, -3.0, 3.0, 6.2]) { if (Math.abs(u) > hw - 2.2) continue; table(ib, u, v, 0.8, 0.8, 0.74, cream, steel, true); chair(ib, u, v - 0.7, 0, red); chair(ib, u, v + 0.7, Math.PI, red); }
    for (const v of [3.6, 6.4]) for (const s of [-1, 1]) { const x = s * (hw - 0.6); ib.box('plastic', x - 0.3, 0, v - 0.9, x + 0.3, 0.45, v + 0.9, red, { no: 'D' }); ib.box('plastic', x + (s < 0 ? -0.3 : 0.2), 0.45, v - 0.9, x + (s < 0 ? -0.2 : 0.3), 1.2, v + 0.9, red); ib.col(x - 0.3, v - 0.9, x + 0.3, v + 0.9, 1.2); table(ib, x - s * 1.0, v, 0.6, 1.2, 0.74, cream, steel); ib.box('plastic', x - s * 1.0 - s * 0.55, 0, v - 0.9, x - s * 1.0 - s * 0.9, 0.45, v + 0.9, red, { no: 'D' }); ib.col(x - s * 1.0 - s * 0.95, v - 0.9, x - s * 1.0 - s * 0.5, v + 0.9, 0.45); }
    // order counter
    counter(ib, -5.2, cv, 5.2, cv + 0.85, { body: red, top: 0xf4efe8, acc: 0xffd34e }); for (const u of [-3.4, 0, 3.4]) till(ib, u, 1.05, cv + 0.45);
    for (const u of [-3.4, 0, 3.4]) { screenQuad(ib, ['menu1', 'menu2', 'menu3'][u < -1 ? 0 : u > 1 ? 2 : 1], u, 2.5, cv + 0.42, 2.1, 1.4, Math.PI, [0, 0, 0.01]); ib.box('metal', u - 0.95, 3.2, cv + 0.4, u - 0.93, S.gf - 0.15, cv + 0.44, 0x4a4d55); ib.box('metal', u + 0.93, 3.2, cv + 0.4, u + 0.95, S.gf - 0.15, cv + 0.44, 0x4a4d55); }
    ib.box('plastic', -5.2, 1.05, cv + 0.02, -3.9, 1.35, cv + 0.12, 0xf4efe8); // tip jar
    // kitchen behind it
    ib.box('metal', -hw + 1.6, 0, dp - 1.0, hw - 1.6, 0.95, dp - 0.2, steel, { no: 'D' }); ib.box('metal', -hw + 1.6, 0.95, dp - 1.0, hw - 1.6, 0.99, dp - 0.2, 0xdde1e8, { no: 'D' }); ib.col(-hw + 1.6, dp - 1.0, hw - 1.6, dp - 0.2, 0.99);
    for (const u of [-5.2, -4.2]) { ib.box('metal', u - 0.4, 0.99, dp - 0.9, u + 0.4, 1.12, dp - 0.3, 0x1c1e22); ib.box('metal', u - 0.3, 1.12, dp - 0.8, u + 0.3, 1.14, dp - 0.4, 0xaab0ba); } // fryers
    ib.box('metal', 2.0, 0.99, dp - 0.95, 5.0, 1.03, dp - 0.3, 0x15171a); for (let i = 0; i < 4; i++) ib.box('matte', 2.3 + i * 0.7, 1.03, dp - 0.8, 2.75 + i * 0.7, 1.07, dp - 0.45, 0x5a2a1a); // grill and patties
    ib.box('metal', -hw + 2.0, 2.15, dp - 1.15, hw - 2.0, 2.55, dp - 0.1, 0xb8bcc6); ib.box('glow', -hw + 2.2, 2.13, dp - 1.05, hw - 2.2, 2.15, dp - 0.25, hdr(0xfff0d0, 1.0)); // hood with its light
    shelf(ib, -hw + 0.4, dp - 3.0, 1.6, 0.5, Math.PI / 2, { h: 1.9, n: 4, body: steel, pal: [0xf4efe8, 0xd8452a, 0xffd34e], itemH: [0.1, 0.25] });
    // drink machine at the right end of the counter, napkin boxes, big neon on the right wall
    ib.at(hw - 1.3, 0, cv + 0.3, 0); ib.box('plastic', -0.35, 0, -0.3, 0.35, 1.9, 0.3, 0xd8201a); ib.box('plastic', -0.3, 1.2, 0.3, 0.3, 1.8, 0.31, 0x15171c); ib.rect('glow', 'N', -0.28, 0.28, 1.25, 1.75, 0.312, hdr(0xfff0d0, 0.9)); for (let i = 0; i < 4; i++) ib.cyl('metal', -0.2 + i * 0.133, 0.95, 0.35, 0.02, 0.02, 0.2, 0xaab0ba, 6, { cap: false }); ib.col(-0.35, -0.3, 0.35, 0.3, 1.9); ib.end();
    glowSign(ib, 'logoNeon', hw - 0.05, 2.5, dp * 0.55, 3.4, -Math.PI / 2); poster(ib, 'kitchen', -hw + 0.03, 1.8, 2.2, 0.9, 0.9, Math.PI / 2);
    return { counter: { u: 0, v: cv - 0.9, yaw: 0 }, keeper: { u: 0, v: cv + 1.4, yaw: Math.PI }, extra: [{ role: 'chef', u: -4.7, v: dp - 1.5, yaw: 0, look: 'chef' }, { role: 'customer', u: 2.3, v: cv - 1.5, yaw: 0 }], view: { cam: [0, 1.6, 0.8], look: [0, 1.4, dp - 2] } };
  },
};

// ---------- more props ----------
function rods(ib, x0, x1, z, y0, y1, step, c = 0xc9a24a, r = 0.012) { for (let x = x0; x <= x1 + 1e-6; x += step) ib.cyl('metal', x, y0, z, r, r, y1 - y0, c, 5, { cap: false }); }
function plant(ib, x, z, h = 1.1) { ib.cyl('plastic', x, 0, z, 0.26, 0.2, 0.42, 0x2a2d36, 10, { bot: true }); ib.cyl('matte', x, 0.4, z, 0.2, 0.2, 0.03, 0x3a2a1a, 8); for (let i = 0; i < 7; i++) { const a = i * 0.9 + x, rr = 0.14 + (i % 3) * 0.06; ib.sph('matte', x + Math.cos(a) * rr, 0.62 + h * 0.3 * ((i * 37) % 5) / 5 + 0.12, z + Math.sin(a) * rr, 0.2, 0.34, 0.2, i % 2 ? 0x2e8a3a : 0x3aa84a, 7, 5); } ib.col(x - 0.26, z - 0.26, x + 0.26, z + 0.26, 0.9); }
function stanchion(ib, x, z) { ib.cyl('metal', x, 0, z, 0.15, 0.15, 0.03, 0xc9a24a, 10); ib.cyl('metal', x, 0.03, z, 0.025, 0.025, 0.94, 0xc9a24a, 6, { cap: true }); ib.col(x - 0.12, z - 0.12, x + 0.12, z + 0.12, 1.0); }
function belt(ib, x0, z0, x1, z1, c = 0xa81428) { const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz), a = Math.atan2(dx, dz); ib.at((x0 + x1) / 2, 0.88, (z0 + z1) / 2, a); ib.box('matte', -0.02, -0.025, -l / 2, 0.02, 0.025, l / 2, c); ib.end(); }
function bars(ib, x0, z0, x1, z1, h = 2.6, step = 0.13) { const dx = x1 - x0, dz = z1 - z0, n = Math.max(1, Math.round(Math.hypot(dx, dz) / step)); for (let i = 0; i <= n; i++) ib.cyl('metal', x0 + dx * i / n, 0, z0 + dz * i / n, 0.014, 0.014, h, 0x3a3e48, 5, { cap: false }); ib.box('metal', Math.min(x0, x1) - 0.02, 0.1, Math.min(z0, z1) - 0.02, Math.max(x0, x1) + 0.02, 0.16, Math.max(z0, z1) + 0.02, 0x3a3e48); ib.box('metal', Math.min(x0, x1) - 0.02, h - 0.08, Math.min(z0, z1) - 0.02, Math.max(x0, x1) + 0.02, h, Math.max(z0, z1) + 0.02, 0x3a3e48); }
function gurney(ib, x, z, yaw) { ib.at(x, 0, z, yaw); for (const sx of [-1, 1]) for (const sz of [-1, 1]) { ib.cyl('metal', sx * 0.3, 0.0, sz * 0.8, 0.06, 0.06, 0.1, 0x2a2d34, 8, { ax: 'x', cap: true }); ib.box('metal', sx * 0.3 - 0.02, 0.1, sz * 0.8 - 0.02, sx * 0.3 + 0.02, 0.5, sz * 0.8 + 0.02, 0xc9ccd4); } ib.box('metal', -0.34, 0.5, -0.9, 0.34, 0.55, 0.9, 0xc9ccd4); ib.box('matte', -0.33, 0.55, -0.88, 0.33, 0.68, 0.88, 0x2f7fc0); ib.box('matte', -0.3, 0.68, -0.85, 0.3, 0.74, 0.1, 0xf4f6f8); ib.box('matte', -0.3, 0.68, 0.14, 0.3, 0.72, 0.85, 0xf4f6f8); ib.box('matte', -0.28, 0.74, -0.84, 0.28, 0.82, -0.55, 0xf4f6f8); for (const s of [-1, 1]) ib.box('metal', s * 0.35 - 0.01, 0.68, -0.5, s * 0.35 + 0.01, 0.9, 0.5, 0xc9ccd4); ib.cyl('metal', 0.55, 0, 0, 0.02, 0.02, 1.8, 0xc9ccd4, 6, { cap: true }); ib.box('plastic', 0.5, 1.5, -0.04, 0.6, 1.75, 0.04, 0xe8f0f4); ib.col(-0.4, -0.95, 0.4, 0.95, 0.8); ib.end(); }
function wheelchair(ib, x, z, yaw) { ib.at(x, 0, z, yaw); ib.box('matte', -0.22, 0.45, -0.2, 0.22, 0.5, 0.2, 0x20232a); ib.box('matte', -0.22, 0.5, -0.24, 0.22, 0.95, -0.2, 0x20232a); for (const s of [-1, 1]) { ib.cyl('metal', s * 0.28, 0.0, -0.1, 0.3, 0.3, 0.03, 0x15171c, 12, { ax: 'x', cap: true, bot: true }); ib.box('metal', s * 0.22 - 0.01, 0.5, -0.2, s * 0.22 + 0.01, 0.65, 0.18, 0xc9ccd4); ib.cyl('metal', s * 0.2, 0.0, 0.3, 0.07, 0.07, 0.03, 0x15171c, 8, { ax: 'x', cap: true, bot: true }); } ib.col(-0.35, -0.3, 0.35, 0.4, 0.95); ib.end(); }
function atm(ib, x, z, yaw) { ib.at(x, 0, z, yaw); ib.box('plastic', -0.38, 0, -0.3, 0.38, 1.75, 0.22, 0x2a2e38, { no: 'D' }); ib.box('plastic', -0.34, 1.0, 0.22, 0.34, 1.1, 0.4, 0x3a3f4a); ib.rect('glow', 'N', -0.26, 0.26, 1.25, 1.62, 0.221, hdr(0x6fe0ff, 0.9)); ib.box('glow', -0.12, 0.62, 0.0, 0.12, 0.66, 0.222, hdr(0x7cff8a, 1.2)); ib.col(-0.4, -0.32, 0.4, 0.4, 1.75); ib.end(); }
function bottles(ib, x0, x1, z, y, r) { for (let x = x0; x < x1; x += 0.13 + r() * 0.04) { const c = pick(r, [0x2a8a3a, 0x8a4a1a, 0xd8d8e0, 0x3a6ad8, 0xc02a2a, 0xe8b830]); ib.cyl('glass', x, y, z, 0.035, 0.035, 0.2 + r() * 0.1, c, 6, { cap: true }); ib.cyl('plastic', x, y + 0.18, z, 0.012, 0.014, 0.1, c, 5); } }
function lockerWall(ib, x0, z, y0, cols, rows, cw, ch, yaw, c1 = 0x4a5a74) { ib.at(x0, y0, z, yaw); ib.box('matte', -0.05, -0.05, -0.28, cols * cw + 0.05, rows * ch + 0.05, -0.02, 0x2a303c); for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { ib.box('metal', i * cw + 0.02, j * ch + 0.02, -0.04, (i + 1) * cw - 0.02, (j + 1) * ch - 0.02, -0.01, ((i + j) & 1) ? c1 : shade(c1, 1.15)); ib.box('glow', i * cw + cw * 0.4, j * ch + ch * 0.55, -0.045, i * cw + cw * 0.6, j * ch + ch * 0.62, -0.04, hdr(0x6fe0ff, 0.7)); } ib.end(); }
function drum(ib, x, z, c) { ib.cyl('plastic', x, 0, z, 0.28, 0.28, 0.88, c, 12, { bot: true }); ib.cyl('metal', x, 0.3, z, 0.285, 0.285, 0.03, shade(c, 0.7), 12); ib.cyl('metal', x, 0.6, z, 0.285, 0.285, 0.03, shade(c, 0.7), 12); ib.col(x - 0.28, z - 0.28, x + 0.28, z + 0.28, 0.9); }
function tires(ib, x, z, n) { for (let i = 0; i < n; i++) { ib.cyl('plastic', x, i * 0.24, z, 0.34, 0.34, 0.22, 0x16171b, 14, { bot: true }); ib.cyl('metal', x, i * 0.24 + 0.01, z, 0.2, 0.2, 0.22, 0xb0b5be, 12); } ib.col(x - 0.36, z - 0.36, x + 0.36, z + 0.36, n * 0.24); }
function paintCans(ib, x, y, z, n, r, rowLen = 6) { for (let i = 0; i < n; i++) { const c = pick(r, PAL.concat([0xf4f4f4, 0x2a2d33])), px = x + (i % rowLen) * 0.2, pz = z + Math.floor(i / rowLen) * 0.2; ib.cyl('metal', px, y, pz, 0.085, 0.085, 0.2, 0xaab0ba, 8, { bot: true }); ib.cyl('metal', px, y + 0.2, pz, 0.088, 0.088, 0.02, c, 8); ib.cyl('plastic', px, y + 0.06, pz, 0.087, 0.087, 0.07, c, 8, { cap: false }); } }
function rollCab(ib, x, z, yaw, c = 0xc01c20) { ib.at(x, 0, z, yaw); ib.box('plastic', -0.45, 0.1, -0.3, 0.45, 0.95, 0.3, c, { no: 'D' }); ib.box('metal', -0.47, 0.95, -0.32, 0.47, 0.98, 0.32, 0xaab0ba, { no: 'D' }); for (let k = 0; k < 4; k++) { ib.box('metal', -0.4, 0.18 + k * 0.2, 0.3, 0.4, 0.34 + k * 0.2, 0.31, shade(c, 0.8)); ib.box('metal', -0.15, 0.24 + k * 0.2, 0.31, 0.15, 0.26 + k * 0.2, 0.33, 0xd8dce4); } for (const sx of [-1, 1]) ib.cyl('metal', sx * 0.38, 0, -0.2, 0.05, 0.05, 0.1, 0x15171c, 8, { ax: 'x', cap: true }); ib.col(-0.47, -0.32, 0.47, 0.32, 0.98); ib.end(); }
function pegTools(ib, x0, x1, y0, y1, z, r) { ib.box('matte', x0, y0, z, x1, y1, z + 0.04, 0x30343e, { no: 'S' }); for (let x = x0 + 0.15; x < x1 - 0.2; x += 0.28 + r() * 0.2) { const kind = r(), h = 0.25 + r() * 0.5, y = y0 + 0.15 + r() * (y1 - y0 - h - 0.3); if (kind < 0.4) { ib.box('metal', x, y, z - 0.03, x + 0.03, y + h, z, 0xb8bcc6); ib.box('plastic', x - 0.01, y + h * 0.7, z - 0.03, x + 0.04, y + h, z - 0.012, 0xc01c20); } else if (kind < 0.7) { ib.box('metal', x, y, z - 0.025, x + 0.14, y + 0.03, z, 0xb8bcc6); ib.box('plastic', x + 0.02, y - 0.12, z - 0.03, x + 0.07, y, z - 0.01, 0xe0a020); } else { ib.cyl('plastic', x, y, z - 0.05, 0.05, 0.05, 0.12, 0x2f6fe0, 8, { ax: 'z', cap: true }); } } }
function rug(ib, x0, z0, x1, z1, c1, c2) { ib.box('matte', x0, 0, z0, x1, 0.012, z1, c1, { no: 'D' }); ib.box('matte', x0 + 0.14, 0.012, z0 + 0.14, x1 - 0.14, 0.016, z1 - 0.14, c2, { no: 'D' }); }
function vending(ib, x, z, yaw, c = 0xd8201a) { ib.at(x, 0, z, yaw); ib.box('plastic', -0.45, 0, -0.35, 0.45, 1.85, 0.3, c, { no: 'D' }); ib.rect('glow', 'N', -0.35, 0.15, 0.7, 1.7, 0.301, hdr(0xfff0d0, 0.9)); for (let i = 0; i < 12; i++) ib.box('matte', -0.33 + (i % 4) * 0.12, 0.75 + Math.floor(i / 4) * 0.3, 0.302, -0.25 + (i % 4) * 0.12, 0.9 + Math.floor(i / 4) * 0.3, 0.31, PAL[i % PAL.length]); ib.box('plastic', 0.2, 0.9, 0.301, 0.4, 1.4, 0.312, 0x15171c); ib.box('plastic', -0.38, 0.2, 0.301, 0.38, 0.45, 0.312, 0x15171c); ib.col(-0.45, -0.35, 0.45, 0.3, 1.85); ib.end(); }
function carAt(S, c) { return { type: c.type, color: c.color, u: c.u, v: c.v, y: c.y ?? 0, h: c.h ?? 0, spin: c.spin ?? 0 }; }
Object.assign(LAY, {
  // ----- dealership: three cars on rotating turntables under bright light, price boards, sales counter, lounge corner -----
  dealer(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, cy = 0x3ce8f5, tt = [[-4.9, 5.0], [4.9, 5.0], [-2.4, 10.4]], cars = [];
    tt.forEach(([u, v], i) => {
      ib.cyl('metal', u, 0, v, 2.58, 2.58, 0.1, 0x8a8f99, 28, { cap: false }); ib.cyl('plastic', u, 0.1, v, 2.5, 2.5, 0.17, 0xdfe3ea, 28, { bot: false }); ib.cyl('glow', u, 0.262, v, 2.47, 2.47, 0.012, hdr(cy, 1.0), 28, { cap: true }); ib.cyl('plastic', u, 0.272, v, 2.36, 2.36, 0.012, 0xe2e6ee, 28);
      ib.col(u - 1.8, v - 2.5, u + 1.8, v + 2.5, 0.3); ib.col(u - 2.5, v - 1.8, u + 2.5, v + 1.8, 0.3);
      const [type, color] = DEALER_CARS[i]; cars.push({ type, color, u, v, y: 0.28, h: (i - 1) * 0.5 + 0.6, spin: 0.35 * (i % 2 ? -1 : 1) });
      const bz = v - 3.1 + (i === 2 ? 0.3 : 0); for (const s of [-1, 1]) { ib.box('metal', u + s * 0.6 - 0.02, 0, bz - 0.02, u + s * 0.6 + 0.02, 1.15, bz + 0.02, 0xb8bcc6); } screenQuad(ib, 'price' + i, u, 1.05, bz, 1.3, 0.65, Math.PI, [0, 0, 0]); ib.col(u - 0.65, bz - 0.06, u + 0.65, bz + 0.06, 1.2);
    });
    // back wall: logo, keys board, sales counter, desk with monitors, lounge corner
    glowSign(ib, 'logoMotors', 0, 2.72, dp - 0.04, 4.4, Math.PI);
    ib.box('matte', 3.0, 1.3, dp - 0.1, 7.2, 2.3, dp - 0.03, 0x1f2a3a, { no: 'S' }); for (let i = 0; i < 14; i++) ib.box('metal', 3.2 + (i % 7) * 0.55, 1.5 + Math.floor(i / 7) * 0.45, dp - 0.14, 3.3 + (i % 7) * 0.55, 1.75 + Math.floor(i / 7) * 0.45, dp - 0.1, i % 3 ? 0xc9ccd4 : cy);
    counter(ib, 3.0, dp - 2.5, 7.2, dp - 1.75, { body: 0x1f2a3a, top: 0xf2f4f8, acc: cy }); till(ib, 5.1, 1.05, dp - 2.1);
    ib.box('plastic', -hw + 0.8, 0, dp - 1.4, -hw + 3.4, 0.75, dp - 0.6, 0x2a3a52, { no: 'D' }); ib.box('plastic', -hw + 0.76, 0.75, dp - 1.44, -hw + 3.44, 0.79, dp - 0.56, 0xe8ecf2, { no: 'D' }); ib.col(-hw + 0.76, dp - 1.44, -hw + 3.44, dp - 0.56, 0.79);
    for (const u of [-hw + 1.4, -hw + 2.8]) { ib.box('plastic', u - 0.28, 0.79, dp - 0.95, u + 0.28, 1.2, dp - 0.93, 0x15171c); ib.rect('glow', 'S', u - 0.25, u + 0.25, 0.83, 1.18, dp - 0.955, hdr(0x6fb0ff, 0.8)); ib.box('plastic', u - 0.04, 0.79, dp - 0.95, u + 0.04, 0.9, dp - 0.85, 0x15171c); }
    chair(ib, -hw + 1.4, dp - 2.3, Math.PI, 0xf2f4f8); chair(ib, -hw + 2.8, dp - 2.3, Math.PI, 0xf2f4f8); sofa(ib, hw - 1.0, 9.0, 2.2, -Math.PI / 2, 0x1f2a3a); sofa(ib, hw - 1.0, 11.2, 1.6, -Math.PI / 2, 0x1f2a3a); table(ib, hw - 2.2, 10.1, 0.7, 1.2, 0.4, 0xe8ecf2, 0x8a8f99);
    plant(ib, hw - 0.6, 7.3, 1.2); plant(ib, -hw + 0.6, 2.2, 1.2);
    return { counter: { u: 5.1, v: dp - 3.3, yaw: 0 }, keeper: { u: 5.1, v: dp - 0.95, yaw: Math.PI }, cars, extra: [{ role: 'customer', u: 3.0, v: dp - 4.6, yaw: 0 }], view: { cam: [0, 1.6, 0.8], look: [0, 0.9, 7] } };
  },

  // ----- paint and repair shop: a car raised on a two-post lift, a car being prepared, tool wall, roll cabs, paint cans, tyres, a counter -----
  spray(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, ac = S.sp.k2, cars = [], yel = 0xe0b020;
    // floor markings round the two bays
    for (const bu of [-6.2, 6.2]) { ib.box('plastic', bu - 2.4, 0, 0.3, bu - 2.3, 0.012, dp - 4.0, yel, { no: 'D' }); ib.box('plastic', bu + 2.3, 0, 0.3, bu + 2.4, 0.012, dp - 4.0, yel, { no: 'D' }); ib.box('plastic', bu - 2.4, 0, dp - 4.1, bu + 2.4, 0.012, dp - 4.0, yel, { no: 'D' }); }
    // lift (left bay): two columns, four arms, the car on top
    for (const s of [-1, 1]) { const x = -6.2 + s * 1.75; ib.box('metal', x - 0.22, 0, 5.6, x + 0.22, 0.06, 6.4, 0x4a4d55); ib.box('plastic', x - 0.15, 0.06, 5.75, x + 0.15, 2.7, 6.25, yel); ib.box('metal', x - 0.17, 2.7, 5.72, x + 0.17, 2.78, 6.28, 0x3a3e48); ib.col(x - 0.22, 5.6, x + 0.22, 6.4, 2.8); for (const az of [5.3, 7.0]) ib.box('metal', Math.min(x, -6.2 + s * 0.6) - 0.05, 1.42, az - 0.07, Math.max(x, -6.2 + s * 0.6) + 0.05, 1.5, az + 0.07, 0x8a8f99); }
    cars.push({ type: 'muscle', color: 0xff4fa3, u: -6.2, v: 6.2, y: 1.58, h: -Math.PI / 2 });
    cars.push({ type: 'sport', color: 0x3ce8f5, u: 6.2, v: 5.2, y: 0.0, h: -Math.PI / 2 });
    // right bay: paint cart, spray gun on the hose reel, a lamp stand
    ib.box('plastic', 8.6, 0.15, 4.0, 9.6, 0.85, 4.6, 0x2a2d36, { no: 'D' }); paintCans(ib, 8.65, 0.85, 4.1, 6, r, 3); ib.col(8.6, 4.0, 9.6, 4.6, 1.05);
    ib.cyl('metal', hw - 0.5, 1.4, 8.6, 0.28, 0.28, 0.14, 0xe0b020, 14, { ax: 'x', cap: true, bot: true }); ib.cyl('metal', hw - 0.5, 1.4, 8.6, 0.08, 0.08, 0.16, 0x4a4d55, 8, { ax: 'x', cap: true }); ib.cyl('plastic', hw - 0.3, 0.4, 8.6, 0.03, 0.03, 1.1, 0x3a3e48, 5);
    // back wall: tool wall with roll cabs, workbench, paint and tyre storage
    pegTools(ib, -hw + 0.4, -3.2, 1.1, 2.9, dp - 0.06, r); rollCab(ib, -hw + 1.3, dp - 0.8, Math.PI); rollCab(ib, -hw + 2.4, dp - 0.8, Math.PI, 0x2f6fe0); rollCab(ib, -hw + 3.5, dp - 0.8, Math.PI);
    ib.box('metal', -hw + 0.4, 0.9, dp - 1.4, -hw + 0.8, 0.96, dp - 0.1, 0x70757f); // vise bench is the left wall tool bench
    for (const sx of [3.8, 6.8]) shelf(ib, sx, dp - 0.4, 2.6, 0.7, Math.PI, { h: 2.2, n: 4, body: 0x3a3e48, pal: [0xf4f4f4, 0xff4fa3, 0x3ce8f5, 0xffd34e, 0xc084fc, 0x7cff8a], itemH: [0.12, 0.26] });
    paintCans(ib, 4.2, 0, dp - 1.8, 12, r, 6); tires(ib, hw - 1.0, dp - 1.0, 5); tires(ib, hw - 1.0, dp - 2.0, 3); drum(ib, hw - 1.1, dp - 3.3, 0x2f6fe0); drum(ib, hw - 1.7, dp - 3.6, 0xc01c20);
    // reception counter, key hooks, the garage's sign
    counter(ib, -2.4, dp - 3.2, 2.4, dp - 2.5, { body: 0x2a2d36, top: 0xc9ccd4, acc: ac }); till(ib, 1.2, 1.05, dp - 2.85);
    ib.box('matte', -2.2, 1.5, dp - 0.1, 2.2, 2.3, dp - 0.03, 0x30343e, { no: 'S' }); for (let i = 0; i < 12; i++) ib.box('metal', -2.0 + i * 0.35, 1.7 + (i % 2) * 0.35, dp - 0.14, -1.9 + i * 0.35, 1.95 + (i % 2) * 0.35, dp - 0.1, pick(r, [0xc9ccd4, 0xe0b020, 0xc01c20]));
    glowSign(ib, 'logoAuto', 0, 2.78, dp - 0.04, 2.8, Math.PI);
    return { counter: { u: 0, v: dp - 3.9, yaw: 0 }, keeper: { u: 0, v: dp - 1.5, yaw: Math.PI }, cars, view: { cam: [0, 1.6, 0.8], look: [-1.5, 1.2, dp - 2] } };
  },

  // ----- casino: carpet, rows of slot machines with turning reels, card and roulette tables, a cashier cage, a chandelier -----
  casino(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, gold = 0xc9a24a;
    for (const s of [-1, 1]) {
      for (let v = 3.0, i = 0; v < 11.6; v += 1.05, i++) slot(ib, s * (hw - 0.45), v, s < 0 ? Math.PI / 2 : -Math.PI / 2);
      for (let v = 3.2; v < 11.2; v += 1.05) { slot(ib, s * 5.3, v, s < 0 ? -Math.PI / 2 : Math.PI / 2); slot(ib, s * 4.7, v, s < 0 ? Math.PI / 2 : -Math.PI / 2); }
    }
    // tables: blackjack (left), roulette (right), chairs and chips
    const felt = (x, z, rr) => { ib.cyl('plastic', x, 0, z, rr * 0.5, rr * 0.45, 0.72, 0x2a0a14, 16, { cap: false }); ib.cyl('plastic', x, 0.72, z, rr, rr, 0.07, 0x4a2a1a, 20, { bot: true }); ib.cyl('matte', x, 0.79, z, rr - 0.08, rr - 0.08, 0.012, 0x0c6a3a, 20); ib.col(x - rr, z - rr, x + rr, z + rr, 0.8); for (let i = 0; i < 5; i++) { const a = i * 1.1 + z; ib.cyl('plastic', x + Math.cos(a) * rr * 0.55, 0.8, z + Math.sin(a) * rr * 0.55, 0.04, 0.04, 0.03 + (i % 3) * 0.015, pick(r, [0xd01c1c, 0x1c4ad0, 0x1a1a1a, 0xffffff]), 8, { bot: true }); } };
    felt(-1.9, 8.6, 1.15); for (let i = 0; i < 4; i++) { const a = Math.PI * (0.25 + i * 0.5 / 3) * 2 - Math.PI * 0.5; stool(ib, -1.9 + Math.cos(a) * 1.75, 8.6 + Math.sin(a) * 1.75, 0xa81428, 0.7); }
    ib.box('plastic', 1.4, 0, 7.4, 3.2, 0.72, 9.8, 0x2a0a14, { no: 'D' }); ib.box('plastic', 1.34, 0.72, 7.34, 3.26, 0.78, 9.86, 0x4a2a1a, { no: 'D' }); ib.pic('art', [1.4, 0.781, 9.8], [3.2, 0.781, 9.8], [3.2, 0.781, 7.4], [1.4, 0.781, 7.4], 'roulette', 0xffffff); ib.col(1.34, 7.34, 3.26, 9.86, 0.8);
    ib.cyl('plastic', 2.3, 0.78, 8.0, 0.45, 0.45, 0.06, 0x1a1a1e, 16, { bot: true }); ib.cyl('metal', 2.3, 0.84, 8.0, 0.4, 0.4, 0.015, gold, 16); ib.cyl('plastic', 2.3, 0.85, 8.0, 0.3, 0.3, 0.02, 0xa81428, 16); ib.cyl('metal', 2.3, 0.87, 8.0, 0.08, 0.04, 0.12, gold, 8);
    for (const [u, v, y] of [[0.6, 8.6, Math.PI / 2], [4.0, 8.6, -Math.PI / 2], [2.3, 6.6, 0]]) stool(ib, u, v, 0xa81428, 0.7);
    // cashier cage: counter, brass grille with three windows
    counter(ib, -3.4, dp - 2.4, 3.4, dp - 1.7, { body: 0x2a0a14, top: gold, acc: 0xffd34e }); till(ib, 0.6, 1.05, dp - 2.05); ib.col(-3.4, dp - 2.4, 3.4, dp - 1.7, 1.1);
    for (const [a, b] of [[-3.4, -2.7], [-1.5, -0.6], [0.6, 1.5], [2.7, 3.4]]) rods(ib, a, b, dp - 2.0, 1.1, 2.6, 0.14);
    for (const u of [-3.4, -2.7, -1.5, -0.6, 0.6, 1.5, 2.7, 3.4]) ib.box('metal', u - 0.03, 1.1, dp - 2.03, u + 0.03, 2.65, dp - 1.97, gold); ib.box('metal', -3.45, 2.0, dp - 2.03, 3.45, 2.65, dp - 1.97, gold); ib.box('metal', -3.45, 2.65, dp - 2.05, 3.45, 2.72, dp - 1.95, gold);
    glowSign(ib, 'logoCasino', 0, 5.0, dp - 0.04, 7.2, Math.PI); glowSign(ib, 'casino', 0, 3.3, dp - 0.04, 3.4, Math.PI);
    // gilded pilasters on the walls, a rope barrier at the door
    for (const s of [-1, 1]) for (const v of [1.8, 5.2, 8.6, 12.0, 14.6]) { ib.box('metal', s * hw - (s > 0 ? 0.3 : -0.04) + (s > 0 ? 0 : 0), 0.15, v - 0.15, s * hw - (s > 0 ? 0.04 : -0.3), 6.85, v + 0.15, gold); }
    for (const s of [-1, 1]) { stanchion(ib, s * 1.6, 2.2); stanchion(ib, s * 3.0, 2.2); belt(ib, s * 1.6, 2.2, s * 3.0, 2.2); }
    return { counter: { u: 0, v: dp - 3.2, yaw: 0 }, keeper: { u: 0, v: dp - 0.95, yaw: Math.PI }, view: { cam: [0, 1.7, 0.7], look: [0, 1.5, dp - 3] } };
  },

  // ----- bank: marble hall, teller line behind glass, queue posts, vault door, safe-deposit walls, ATMs, columns -----
  bank(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, gold = 0xc9a24a, tz = dp - 6.4;
    counter(ib, -hw + 1.8, tz, hw - 1.8, tz + 0.85, { h: 1.1, body: 0x3a3a42, top: 0xe8e2d4, acc: gold });
    const wx = [-6.3, -2.1, 2.1, 6.3].map(u => Math.max(-hw + 2.0, Math.min(hw - 2.0, u * hw / 10.5)));
    for (const x of wx) { till(ib, x + 0.5, 1.1, tz + 0.5); ib.box('plastic', x - 0.3, 1.1, tz + 0.1, x + 0.3, 1.3, tz + 0.22, 0xe8e2d4); }
    const px = [-hw + 1.8, ...[0, 1, 2].map(i => (wx[i] + wx[i + 1]) / 2), hw - 1.8];
    for (const x of px) ib.box('metal', x - 0.04, 1.1, tz + 0.37, x + 0.04, 2.45, tz + 0.43, gold);
    ib.box('metal', -hw + 1.8, 2.42, tz + 0.37, hw - 1.8, 2.48, tz + 0.43, gold);
    for (let i = 0; i < 4; i++) { const a = px[i], b = px[i + 1], c = wx[i], op = 0.7; ib.rect('glass', 'S', a + 0.04, c - op, 1.3, 2.42, tz + 0.4, 0xffffff); ib.rect('glass', 'S', c + op, b - 0.04, 1.3, 2.42, tz + 0.4, 0xffffff); ib.rect('glass', 'S', c - op, c + op, 2.0, 2.42, tz + 0.4, 0xffffff); }
    // vault in the back wall: frame, door with wheel and bolts, glowing lock indicator
    const vx = 0, vy = 1.95, vz = dp - 0.1; ib.box('metal', vx - 2.3, 0, dp - 0.75, vx + 2.3, 4.2, dp - 0.02, 0x4a4d55, { no: 'D' }); ib.col(vx - 2.3, dp - 0.75, vx + 2.3, dp - 0.02, 4.2);
    ib.cyl('metal', vx, vy, vz - 0.74, 1.62, 1.62, 0.1, 0x9aa0aa, 36, { ax: 'z', cap: true, bot: true }); ib.cyl('metal', vx, vy, vz - 0.85, 1.42, 1.42, 0.14, 0x6a707a, 36, { ax: 'z', cap: true }); ib.cyl('metal', vx, vy, vz - 1.0, 0.5, 0.5, 0.12, gold, 24, { ax: 'z', cap: true });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; ib.cyl('metal', vx + Math.cos(a) * 1.22, vy + Math.sin(a) * 1.22, vz - 0.95, 0.07, 0.07, 0.1, 0xd8dce4, 8, { ax: 'z', cap: true }); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * 3.1416; ib.box('metal', vx + Math.cos(a) * 0.9 - 0.04, vy + Math.sin(a) * 0.9 - 0.04, vz - 1.06, vx - Math.cos(a) * 0.9 + 0.04, vy - Math.sin(a) * 0.9 + 0.04, vz - 1.02, gold); }
    ib.box('glow', vx - 0.08, vy + 1.85, vz - 0.8, vx + 0.08, vy + 1.95, vz - 0.76, hdr(0xff3030, 1.3));
    for (const s of [-1, 1]) { const x0 = s < 0 ? -hw + 0.4 : vx + 2.5; for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) ib.box('metal', x0 + i * 0.34, 0.5 + j * 0.34, dp - 0.1, x0 + i * 0.34 + 0.3, 0.5 + j * 0.34 + 0.3, dp - 0.04, (i + j) & 1 ? gold : shade(gold, 0.85)); }
    glowSign(ib, 'logoBank', 0, 5.5, dp - 0.04, 6.4, Math.PI);
    // queue posts, benches, columns, ATMs, a big clock
    for (const s of [-1, 1]) for (let x = 1.4; x <= 5.6; x += 1.4) stanchion(ib, s * x, tz - 2.2); for (const s of [-1, 1]) for (let x = 1.4; x < 5.6; x += 1.4) belt(ib, s * x, tz - 2.2, s * (x + 1.4), tz - 2.2);
    for (const [u, v] of [[-7.0, 5.0], [7.0, 5.0], [-7.0, 9.5], [7.0, 9.5]]) { ib.cyl('matte', u, 0.3, v, 0.46, 0.46, 6.3, 0xeee6d2, 18, { bot: false }); ib.cyl('metal', u, 0, v, 0.6, 0.6, 0.3, gold, 18); ib.cyl('metal', u, 6.5, v, 0.6, 0.6, 0.34, gold, 18, { bot: true }); ib.col(u - 0.6, v - 0.6, u + 0.6, v + 0.6, 6.8); }
    for (const v of [2.6, 3.9, 5.2]) atm(ib, hw - 0.45, v, -Math.PI / 2); sofa(ib, -hw + 0.7, 3.4, 2.4, Math.PI / 2, 0x2a3a52); sofa(ib, -hw + 0.7, 6.4, 2.4, Math.PI / 2, 0x2a3a52); plant(ib, -hw + 0.6, 1.3, 1.4); plant(ib, hw - 0.6, 1.3, 1.4);
    ib.at(hw - 0.05, 4.8, 8.5, -Math.PI / 2); ib.pic('art', [-0.6, -0.6, 0], [0.6, -0.6, 0], [0.6, 0.6, 0], [-0.6, 0.6, 0], 'clockface', 0xffffff); ib.end();
    screenQuad(ib, 'rates', -hw + 0.06, 3.0, 8.5, 1.4, 1.9, Math.PI / 2, [0, 0, 0.0]);
    return { counter: { u: wx[2], v: tz - 0.9, yaw: 0 }, keeper: { u: wx[2], v: tz + 1.4, yaw: Math.PI }, extra: [{ role: 'teller', u: wx[0], v: tz + 1.4, yaw: Math.PI, look: 'banker' }, { role: 'guard', u: -3.8, v: 2.2, yaw: Math.PI, look: 'guard' }], view: { cam: [0, 1.7, 0.7], look: [0, 1.6, dp - 3] } };
  },
});
Object.assign(LAY, {
  // ----- hospital: tall atrium, reception desk under a lit cross, waiting seats, gurneys, wheelchairs, floor guide lines -----
  hospital(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, red = 0xe02a2a, bz = dp - 5.4;
    counter(ib, -4.2, bz, 4.2, bz + 0.85, { h: 1.1, body: 0xf4f8fa, top: 0xdfe8ec, acc: red }); for (const u of [-1.5, 1.5]) till(ib, u, 1.1, bz + 0.45);
    ib.box('plastic', -4.2, 1.1, bz + 0.05, 4.2, 1.2, bz + 0.12, 0xe8f0f2); // transaction ledge
    screenQuad(ib, 'cross', 0, 4.4, dp - 0.05, 2.6, 2.6, Math.PI, [0, 0, 0.0]); glowSign(ib, 'er', -6.0, 3.1, dp - 0.04, 2.4, Math.PI);
    for (const u of [-hw + 3.6, hw - 3.6]) { ib.box('matte', u - 0.65, 0, dp - 0.1, u + 0.65, 2.3, dp - 0.04, 0xb8d8e8, { no: 'DS' }); ib.box('metal', u - 0.7, 0, dp - 0.12, u + 0.7, 2.36, dp - 0.04, 0xc9ccd4, { no: 'DS' }); ib.rect('glass', 'S', u - 0.3, u + 0.3, 1.2, 2.0, dp - 0.14, 0xffffff); }
    // waiting seats (three rows of four, with armrests) and a TV on the back wall
    for (const v of [3.2, 4.9, 6.6]) for (let k = 0; k < 4; k++) { const u = -hw + 1.8 + k * 0.62; ib.box('plastic', u - 0.26, 0.38, v - 0.24, u + 0.26, 0.45, v + 0.24, 0x2a6fd6, { no: 'D' }); ib.box('plastic', u - 0.26, 0.45, v - 0.26, u + 0.26, 0.92, v - 0.2, 0x2a6fd6); ib.box('metal', u - 0.28, 0.38, v - 0.26, u - 0.26, 0.62, v + 0.24, 0xc9ccd4); ib.box('metal', u - 0.03, 0, v - 0.05, u + 0.03, 0.38, v + 0.05, 0x8a8f99); }
    for (const v of [3.2, 4.9, 6.6]) ib.col(-hw + 1.4, v - 0.3, -hw + 1.8 + 3 * 0.62 + 0.3, v + 0.3, 0.92);
    screenQuad(ib, 'news', -hw + 3.0, 2.7, dp - 0.06, 1.8, 1.0, Math.PI, [0, 0, 0.25]); ib.cyl('plastic', -hw + 0.6, 0, dp - 0.7, 0.2, 0.2, 0.9, 0xe8f0f4, 10, { bot: true }); ib.cyl('plastic', -hw + 0.6, 0.9, dp - 0.7, 0.16, 0.16, 0.34, 0x4aa8e8, 10); ib.col(-hw + 0.4, dp - 0.9, -hw + 0.8, dp - 0.5, 1.3);
    // right side: two gurneys, wheelchairs, doors, charts
    gurney(ib, hw - 2.3, 3.4, 0); gurney(ib, hw - 3.6, 3.7, 0); wheelchair(ib, hw - 1.0, 6.3, Math.PI * 0.9); wheelchair(ib, hw - 1.0, 7.3, Math.PI * 1.1);
    for (const v of [8.6, 10.6]) { ib.box('matte', hw - 0.1, 0, v - 0.6, hw - 0.04, 2.3, v + 0.6, 0xb8d8e8, { no: 'D' }); ib.box('metal', hw - 0.12, 0, v - 0.66, hw - 0.04, 2.36, v - 0.6, 0xc9ccd4); ib.box('metal', hw - 0.12, 0, v + 0.6, hw - 0.04, 2.36, v + 0.66, 0xc9ccd4); }
    poster(ib, 'eye', hw - 0.03, 1.7, 1.6, 0.8, 1.2, -Math.PI / 2); poster(ib, 'anatomy', hw - 0.03, 1.7, 7.5, 0.8, 1.2, -Math.PI / 2);
    ib.box('metal', hw - 2.4, 0, dp - 0.1, hw - 0.4, 2.6, dp - 0.04, 0xaab0ba, { no: 'D' }); ib.box('glow', hw - 1.5, 2.7, dp - 0.09, hw - 1.3, 2.78, dp - 0.06, hdr(0x7cff8a, 1.2)); // lift doors
    // floor guide lines: red, green, blue from the door towards the desk
    [[-0.45, 0xe02a2a], [0, 0x2ab04a], [0.45, 0x2a6fd6]].forEach(([u, c]) => ib.box('plastic', u - 0.06, 0, 1.4, u + 0.06, 0.012, bz - 1.2, c, { no: 'D' }));
    return { counter: { u: 0, v: bz - 0.8, yaw: 0 }, keeper: { u: 0, v: bz + 1.45, yaw: Math.PI }, extra: [{ role: 'doctor', u: hw - 4.5, v: dp - 3.0, yaw: Math.PI, look: 'doctor' }], view: { cam: [0, 1.7, 0.7], look: [0, 1.6, dp - 3] } };
  },

  // ----- police station: front desk behind ballistic glass, wanted board, benches, evidence lockers, two cells with bars -----
  police(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, blue = 0x4d8cff, dz = dp - 6.6;
    counter(ib, -4.2, dz, 4.2, dz + 0.85, { h: 1.15, body: 0x1a2a50, top: 0xdadde4, acc: blue });
    ib.box('metal', -4.2, 1.15, dz + 0.4, -4.1, 2.3, dz + 0.46, 0x8a8f99); ib.box('metal', 4.1, 1.15, dz + 0.4, 4.2, 2.3, dz + 0.46, 0x8a8f99); ib.box('metal', -4.2, 2.3, dz + 0.4, 4.2, 2.36, dz + 0.46, 0x8a8f99);
    for (const [a, b] of [[-4.1, -1.4], [-0.8, 0.8], [1.4, 4.1]]) ib.rect('glass', 'S', a, b, 1.15, 2.3, dz + 0.43, 0xffffff); for (const x of [-1.4, -0.8, 0.8, 1.4]) ib.box('metal', x - 0.025, 1.15, dz + 0.4, x + 0.025, 2.3, dz + 0.46, 0x8a8f99);
    for (const u of [-2.4, 2.4]) { ib.box('plastic', u - 0.3, 1.15, dz + 0.5, u + 0.3, 1.18, dz + 0.9, 0x15171c); ib.box('plastic', u - 0.28, 1.18, dz + 0.78, u + 0.28, 1.58, dz + 0.82, 0x15171c); ib.rect('glow', 'S', u - 0.25, u + 0.25, 1.22, 1.55, dz + 0.775, hdr(0x6fb0ff, 0.85)); }
    glowSign(ib, 'police', 0, 2.75, dp - 0.04, 3.0, Math.PI);
    // left: benches, wanted board, notice poster; evidence lockers on the back wall
    for (const v of [2.8, 5.0]) { ib.box('plastic', -hw + 0.2, 0.4, v - 1.0, -hw + 0.7, 0.46, v + 1.0, 0x6a7a8a, { no: 'D' }); ib.box('plastic', -hw + 0.2, 0.46, v - 1.0, -hw + 0.26, 0.95, v + 1.0, 0x6a7a8a); for (const dz2 of [-0.9, 0.9]) ib.box('metal', -hw + 0.3, 0, v + dz2 - 0.03, -hw + 0.6, 0.4, v + dz2 + 0.03, 0x4a4d55); ib.col(-hw + 0.2, v - 1.0, -hw + 0.7, v + 1.0, 0.95); }
    ib.box('matte', -hw + 0.04, 1.2, 6.5, -hw + 0.1, 2.6, 9.1, 0x8a6a42, { no: 'DW' }); poster(ib, 'wanted', -hw + 0.12, 1.9, 6.9, 0.7, 1.05, Math.PI / 2); poster(ib, 'wanted2', -hw + 0.12, 1.9, 7.8, 0.7, 1.05, Math.PI / 2); poster(ib, 'wanted', -hw + 0.12, 1.9, 8.7, 0.7, 1.05, Math.PI / 2, 0xe8e0d0);
    lockerWall(ib, -hw + 0.5, dp, 0.2, 8, 3, 0.52, 0.9, 0, 0x4a5a74); ib.col(-hw + 0.45, dp - 0.4, -hw + 4.8, dp - 0.04, 3.0);
    // two cells in the back right corner
    const cw = 2.9, cx0 = hw - 2 * cw - 0.5, cz0 = dp - 3.6;
    for (let k = 0; k < 2; k++) {
      const x0 = cx0 + k * (cw + 0.1), x1 = x0 + cw; bars(ib, x0, cz0, x1, cz0, 2.7, 0.14); ib.col(x0, cz0 - 0.03, x1, cz0 + 0.03, 2.7);
      ib.box('matte', x0, 0, cz0, x0 + 0.1, 2.7, dp - 0.04, 0xd8dce4, { no: 'D' }); ib.col(x0, cz0, x0 + 0.1, dp - 0.04, 2.7); if (k === 1) { ib.box('matte', x1 - 0.1, 0, cz0, x1, 2.7, dp - 0.04, 0xd8dce4, { no: 'D' }); ib.col(x1 - 0.1, cz0, x1, dp - 0.04, 2.7); }
      ib.box('metal', x0 + 0.2, 0.45, dp - 2.4, x0 + 1.0, 0.5, dp - 0.3, 0x8a8f99); ib.box('matte', x0 + 0.22, 0.5, dp - 2.35, x0 + 0.98, 0.62, dp - 0.32, 0x5a6a7a); ib.box('metal', x1 - 0.7, 0, dp - 0.9, x1 - 0.2, 0.45, dp - 0.3, 0xe8ecf2); ib.cyl('metal', x1 - 0.45, 0.45, dp - 0.55, 0.14, 0.14, 0.04, 0xc9ccd4, 8);
      ib.box('glow', x0 + cw / 2 - 0.4, 2.55, cz0 + 0.3, x0 + cw / 2 + 0.4, 2.6, cz0 + 0.5, hdr(0xe8f0ff, 1.0));
    }
    // cell gate (one door ajar), and a plant
    plant(ib, hw - 0.6, 1.3, 1.1);
    return { counter: { u: 0, v: dz - 0.8, yaw: 0 }, keeper: { u: 0, v: dz + 1.5, yaw: Math.PI }, extra: [{ role: 'customer', u: 2.4, v: dz - 1.6, yaw: 0 }], view: { cam: [0, 1.65, 0.8], look: [0, 1.4, dp - 2.5] } };
  },

  // ----- taxi dispatch: counter with radio, city map, key board, benches -----
  taxi(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, y = 0xffd34e;
    counter(ib, -3.4, dp - 3.2, 3.4, dp - 2.5, { body: 0x2a2d36, top: 0xe8e4dc, acc: y }); till(ib, 1.6, 1.05, dp - 2.85); ib.box('plastic', -1.2, 1.05, dp - 2.9, -0.5, 1.2, dp - 2.7, 0x15171c); ib.cyl('metal', -0.85, 1.2, dp - 2.8, 0.01, 0.01, 0.25, 0xaab0ba, 5);
    for (let i = 0; i < 10; i++) { ib.box('plastic', -3.4 + i * 0.68, 1.05, dp - 3.15, -3.4 + i * 0.68 + 0.2, 1.07, dp - 2.55, i % 2 ? 0x15171c : y, { no: 'D' }); }
    glowSign(ib, 'taxi', 0, 2.7, dp - 0.04, 2.2, Math.PI);
    poster(ib, 'map', -hw + 0.04, 1.9, 6.0, 2.6, 1.95, Math.PI / 2); poster(ib, 'ad2', hw - 0.04, 1.8, 8.4, 0.8, 1.2, -Math.PI / 2);
    ib.box('matte', 3.8, 1.3, dp - 0.1, 7.6, 2.3, dp - 0.03, 0x3a3d46, { no: 'S' }); for (let i = 0; i < 16; i++) ib.box('metal', 4.0 + (i % 8) * 0.44, 1.5 + Math.floor(i / 8) * 0.45, dp - 0.14, 4.1 + (i % 8) * 0.44, 1.8 + Math.floor(i / 8) * 0.45, dp - 0.1, i % 3 ? 0xc9ccd4 : y);
    for (const v of [3.4, 5.6]) sofa(ib, hw - 0.8, v, 1.8, -Math.PI / 2, 0x3a3d46); table(ib, hw - 2.0, 4.5, 0.6, 0.9, 0.42, 0xe8e4dc, 0x8a8f99);
    ib.box('plastic', -hw + 0.8, 0, dp - 1.5, -hw + 3.2, 0.75, dp - 0.7, 0x3a3d46, { no: 'D' }); ib.box('plastic', -hw + 0.76, 0.75, dp - 1.54, -hw + 3.24, 0.79, dp - 0.66, 0xe8e4dc, { no: 'D' }); ib.col(-hw + 0.76, dp - 1.54, -hw + 3.24, dp - 0.66, 0.79); chair(ib, -hw + 2.0, dp - 2.4, Math.PI, 0x15171c);
    for (const u of [-hw + 1.5, -hw + 2.6]) { ib.box('plastic', u - 0.28, 0.79, dp - 1.05, u + 0.28, 1.2, dp - 1.03, 0x15171c); ib.rect('glow', 'S', u - 0.25, u + 0.25, 0.83, 1.18, dp - 1.055, hdr(0xffd34e, 0.8)); }
    rug(ib, -3.4, 3.2, 3.4, 6.8, 0xffd34e, 0x2a2d36); vending(ib, hw - 0.5, 8.4, -Math.PI / 2, 0x2f6fe0); for (const v of [2.6, 4.2]) sofa(ib, -hw + 0.8, v, 1.5, Math.PI / 2, 0x3a3d46); poster(ib, 'ad1', -hw + 0.04, 1.9, 8.6, 0.8, 1.2, Math.PI / 2); poster(ib, 'target2', hw - 0.04, 1.9, 2.0, 0.7, 1.05, -Math.PI / 2, 0xe8e0d0); screenQuad(ib, 'news', hw - 0.05, 2.2, 6.4, 1.3, 0.75, -Math.PI / 2, [0, 0, 0.25]);
    plant(ib, hw - 0.6, 1.4, 1.1); ib.cyl('plastic', -hw + 0.5, 0, 1.6, 0.18, 0.18, 0.9, 0xe8f0f4, 10, { bot: true }); ib.cyl('plastic', -hw + 0.5, 0.9, 1.6, 0.15, 0.15, 0.3, 0x4aa8e8, 10); ib.col(-hw + 0.3, 1.4, -hw + 0.7, 1.8, 1.2);
    return { counter: { u: 0, v: dp - 3.9, yaw: 0 }, keeper: { u: 0, v: dp - 1.5, yaw: Math.PI }, extra: [{ role: 'customer', u: -2.6, v: dp - 4.9, yaw: 0 }], view: { cam: [0, 1.6, 0.8], look: [0, 1.3, dp - 2] } };
  },

  // ----- Ricky's lounge: pool table, bar with bottles, jukebox, sofas, neon -----
  lounge(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, pk = 0xff4fa3;
    counter(ib, -6.0, dp - 3.2, 6.0, dp - 2.4, { body: 0x1a0a1c, top: 0x3a1a3a, acc: pk }); for (let u = -5.4; u <= 5.4; u += 1.1) stool(ib, u, dp - 4.0, 0x8a1a5a, 0.72);
    ib.box('matte', -6.4, 0.9, dp - 0.4, 6.4, 0.95, dp - 0.04, 0x2a1a2e, { no: 'D' }); ib.box('matte', -6.4, 1.6, dp - 0.4, 6.4, 1.65, dp - 0.04, 0x2a1a2e, { no: 'D' }); ib.box('matte', -6.4, 2.3, dp - 0.4, 6.4, 2.35, dp - 0.04, 0x2a1a2e, { no: 'D' });
    for (const y of [0.95, 1.65, 2.35]) bottles(ib, -6.3, 6.3, dp - 0.2, y, r); for (let y = 0.95; y < 3; y += 0.7) ib.box('glow', -6.4, y + 0.66, dp - 0.4, 6.4, y + 0.68, dp - 0.36, hdr(pk, 0.7), { no: 'D' });
    // pool table in the middle left
    const px = -4.6, pz = 6.0; ib.box('matte', px - 1.3, 0.74, pz - 0.7, px + 1.3, 0.8, pz + 0.7, 0x0c7a4a, { no: 'D' }); for (const [a, b, c, d] of [[-1.38, -0.78, 1.38, -0.7], [-1.38, 0.7, 1.38, 0.78], [-1.38, -0.78, -1.3, 0.78], [1.3, -0.78, 1.38, 0.78]]) ib.box('plastic', px + a, 0.74, pz + b, px + c, 0.88, pz + d, 0x4a2a1a); for (const sx of [-1, 1]) for (const sz of [-1, 1]) ib.box('plastic', px + sx * 1.15 - 0.07, 0, pz + sz * 0.5 - 0.07, px + sx * 1.15 + 0.07, 0.74, pz + sz * 0.5 + 0.07, 0x3a1a0a); ib.col(px - 1.4, pz - 0.8, px + 1.4, pz + 0.8, 0.88);
    for (let i = 0; i < 9; i++) ib.sph('plastic', px + 0.6 + (i % 3) * 0.1 + Math.floor(i / 3) * 0.09, 0.82, pz - 0.1 + (i % 3) * 0.1 - Math.floor(i / 3) * 0.05, 0.03, 0.03, 0.03, pick(r, PAL), 6, 4);
    ib.box('metal', px - 1.0, 2.3, pz - 0.1, px + 1.0, 2.38, pz + 0.1, 0x20232a); ib.box('glow', px - 0.9, 2.28, pz - 0.08, px + 0.9, 2.3, pz + 0.08, hdr(0xffe0b0, 1.2)); ib.cyl('metal', px - 0.9, 2.38, pz, 0.01, 0.01, 0.9, 0x20232a, 4, { cap: false }); ib.cyl('metal', px + 0.9, 2.38, pz, 0.01, 0.01, 0.9, 0x20232a, 4, { cap: false });
    // jukebox, sofas and tables on the sides, posters, neon
    ib.at(hw - 0.5, 0, 6.2, -Math.PI / 2); ib.box('plastic', -0.5, 0, -0.3, 0.5, 1.5, 0.25, 0x2a1a3a, { no: 'D' }); ib.rect('glow', 'N', -0.4, 0.4, 0.9, 1.4, 0.251, hdr(0xff9ad5, 1.1)); ib.cyl('glow', 0, 1.3, 0.25, 0.4, 0.4, 0.05, hdr(0xffe08a, 1.0), 14, { ax: 'z', cap: true }); ib.col(-0.5, -0.3, 0.5, 0.3, 1.5); ib.end();
    for (const v of [3.0, 7.6, 10.0]) { sofa(ib, hw - 0.8, v, 2.0, -Math.PI / 2, 0x8a1a5a); } table(ib, hw - 2.2, 3.0, 0.6, 0.9, 0.42, 0x3a1a3a, 0xc9ccd4); table(ib, hw - 2.2, 8.8, 0.6, 0.9, 0.42, 0x3a1a3a, 0xc9ccd4);
    sofa(ib, -hw + 0.8, 2.8, 2.2, Math.PI / 2, 0x4a2a8a); table(ib, -hw + 2.0, 2.8, 0.6, 1.0, 0.42, 0x3a1a3a, 0xc9ccd4);
    glowSign(ib, 'lounge', -hw + 0.04, 2.6, 8.6, 2.4, Math.PI / 2); glowSign(ib, 'logoRicky', 0, 3.0, dp - 0.04, 3.2, Math.PI);
    poster(ib, 'ad1', hw - 0.04, 2.3, 4.6, 0.8, 1.2, -Math.PI / 2); poster(ib, 'ad2', hw - 0.04, 2.3, 5.6, 0.8, 1.2, -Math.PI / 2);
    return { counter: { u: 0, v: dp - 3.9, yaw: 0 }, keeper: { u: 0, v: dp - 1.3, yaw: Math.PI }, extra: [{ role: 'customer', u: -3.2, v: dp - 4.9, yaw: 0 }, { role: 'customer', u: 3.0, v: 3.6, yaw: Math.PI }], view: { cam: [0, 1.6, 0.8], look: [-1, 1.2, dp - 2] } };
  },

  // ----- Garage 8: a race car on jack stands, tool chests, tyre rack, counter -----
  garage(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, ac = S.sp.k2, cars = [{ type: 'sport', color: 0x2a6fe0, u: -2.4, v: 6.4, y: 0, h: -Math.PI / 2 }];
    for (const [x, z] of [[-3.5, 4.6], [-1.3, 4.6], [-3.5, 8.2], [-1.3, 8.2]]) { ib.cyl('metal', x, 0, z, 0.2, 0.2, 0.03, 0x4a4d55, 8); ib.cyl('plastic', x, 0.03, z, 0.05, 0.05, 0.3, 0xc01c20, 6, { cap: true }); ib.col(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 0.4); }
    for (const [x, z, c] of [[hw - 0.5, 3.0, 0xc01c20], [hw - 0.5, 4.2, 0xc01c20]]) rollCab(ib, x, z, -Math.PI / 2, c);
    pegTools(ib, -hw + 0.4, -2.6, 1.1, 2.9, dp - 0.06, r); rollCab(ib, -hw + 1.2, dp - 0.8, Math.PI, 0x2f6fe0); rollCab(ib, -hw + 2.3, dp - 0.8, Math.PI, 0xc01c20);
    tires(ib, hw - 0.9, dp - 0.9, 6); tires(ib, hw - 0.9, dp - 1.8, 4); drum(ib, hw - 1.0, dp - 3.0, 0xc01c20); drum(ib, hw - 1.6, dp - 3.3, 0x2f6fe0);
    counter(ib, 1.6, dp - 3.0, 6.4, dp - 2.3, { body: 0x2a2d36, top: 0xc9ccd4, acc: ac }); till(ib, 4.0, 1.05, dp - 2.65);
    glowSign(ib, 'logoGarage', 3.0, 2.8, dp - 0.04, 3.0, Math.PI); poster(ib, 'ad1', -hw + 0.04, 1.9, 3.0, 0.8, 1.2, Math.PI / 2);
    ib.box('plastic', -hw + 0.4, 0, 6.0, -hw + 1.2, 0.9, 9.2, 0x4a4d55, { no: 'D' }); ib.box('plastic', -hw + 0.36, 0.9, 5.96, -hw + 1.24, 0.95, 9.24, 0xc8a070, { no: 'D' }); ib.col(-hw + 0.36, 5.96, -hw + 1.24, 9.24, 0.95);
    return { counter: { u: 4.0, v: dp - 3.8, yaw: 0 }, keeper: { u: 4.0, v: dp - 1.4, yaw: Math.PI }, cars, extra: [{ role: 'customer', u: 1.0, v: dp - 4.9, yaw: 0 }], view: { cam: [0, 1.6, 0.8], look: [-1, 1.0, dp - 3] } };
  },

  // ----- apartment lobby (the safehouse): desk, mailboxes, lift, sofas, plants -----
  lobby(ib, S) {
    const hw = S.iw / 2, dp = S.dp, r = ib.r, g = 0x7cff8a;
    counter(ib, -3.0, dp - 3.2, 3.0, dp - 2.5, { body: 0x2a3a2e, top: 0xe8e4dc, acc: g }); till(ib, 1.4, 1.05, dp - 2.85);
    ib.box('matte', -hw + 0.04, 0.8, 3.0, -hw + 0.12, 2.2, 8.6, 0x3a3d46, { no: 'DW' }); for (let i = 0; i < 12; i++) for (let j = 0; j < 5; j++) { ib.box('metal', -hw + 0.12, 0.88 + j * 0.26, 3.1 + i * 0.45, -hw + 0.16, 1.1 + j * 0.26, 3.5 + i * 0.45, (i + j) & 1 ? 0xc9a24a : 0xb08a3a); ib.box('glow', -hw + 0.16, 0.97 + j * 0.26, 3.28 + i * 0.45, -hw + 0.17, 1.0 + j * 0.26, 3.34 + i * 0.45, hdr(0x6fe0ff, 0.5)); }
    ib.box('metal', hw - 3.6, 0, dp - 0.1, hw - 0.5, 2.7, dp - 0.04, 0xaab0ba, { no: 'D' }); ib.box('metal', hw - 2.1, 0, dp - 0.12, hw - 2.0, 2.7, dp - 0.04, 0x4a4d55); ib.box('glow', hw - 2.3, 2.8, dp - 0.1, hw - 1.8, 2.85, dp - 0.06, hdr(g, 1.2));
    sofa(ib, 4.6, 5.4, 2.4, Math.PI, 0x2a3a4a); sofa(ib, 6.3, 3.6, 1.8, -Math.PI / 2, 0x2a3a4a); table(ib, 5.4, 4.0, 1.0, 0.6, 0.4, 0xe8e4dc, 0x8a8f99, true); plant(ib, -hw + 0.7, 1.4, 1.5); plant(ib, hw - 0.7, 1.4, 1.5); plant(ib, hw - 0.7, 8.6, 1.4);
    rug(ib, 3.0, 2.4, hw - 0.4, 6.8, 0x7cff8a, 0x2a3a2e); sofa(ib, -hw + 3.2, 3.4, 1.8, Math.PI, 0x3a4a3a); table(ib, -hw + 3.2, 4.4, 0.9, 0.5, 0.4, 0xe8e4dc, 0x8a8f99); poster(ib, 'ad2', hw - 0.04, 1.9, 9.2, 0.8, 1.2, -Math.PI / 2); poster(ib, 'ad1', hw - 0.04, 1.9, 10.4, 0.8, 1.2, -Math.PI / 2); poster(ib, 'map', hw - 0.04, 1.9, 7.9, 1.4, 1.05, -Math.PI / 2);
    glowSign(ib, 'logoPalms', 0, 2.8, dp - 0.04, 3.0, Math.PI);
    return { counter: { u: 0, v: dp - 3.9, yaw: 0 }, keeper: { u: 0, v: dp - 1.4, yaw: Math.PI }, extra: [{ role: 'customer', u: -1.8, v: dp - 4.9, yaw: 0 }], view: { cam: [0, 1.6, 0.8], look: [0, 1.3, dp - 2] } };
  },
});
LAY.hospital2 = LAY.hospital;
