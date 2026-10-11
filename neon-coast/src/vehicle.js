import * as THREE from '../vendor/three.module.min.js';
import { VEHICLES, CAR_COLORS, JOBS } from './config.js';
import { clamp, damp, mergeGeometries, xform, M4 } from './utils.js';
import { envRegister } from './env.js';

// ---------- job vehicles: decals, details, siren bars ----------
// Canvas decals (transparent planes laid on the body side) and lit signs. Every texture is built once; planes share one material per key.
const HZ = 0.012; // stand-off of stripes and decals from the body side (m)
const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const FONT = '900 {S}px "Arial Black", Heebo, Arial, sans-serif', fnt = s => FONT.replace('{S}', s);
const rrect = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
const DECAL_TEX = {
  amb: () => canvasTex(1024, 384, (x, W, H) => { // red AMBULANCE lettering with the blue star of life
    x.save(); x.translate(104, H / 2); x.fillStyle = '#1b6fd1'; for (let i = 0; i < 3; i++) { x.rotate(Math.PI / 3); rrect(x, -13, -86, 26, 172, 5); x.fill(); } x.fillStyle = '#fff'; rrect(x, -5, -54, 10, 108, 3); x.fill(); x.restore();
    x.fillStyle = '#d4122a'; x.font = fnt(110); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('AMBULANCE', 590, H * 0.42); x.fillStyle = '#1b2a55'; x.font = fnt(42); x.fillText('EMERGENCY  MEDICAL  SERVICE', 590, H * 0.8);
  }),
  fire: () => canvasTex(1024, 256, (x, W, H) => { // gold lettering and a maltese cross on the red body
    x.fillStyle = '#ffd34e'; x.font = fnt(86); x.textAlign = 'center'; x.textBaseline = 'middle'; x.strokeStyle = '#6d0a10'; x.lineWidth = 7; x.strokeText('FIRE & RESCUE', 590, H / 2); x.fillText('FIRE & RESCUE', 590, H / 2);
    x.save(); x.translate(96, H / 2); for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(0, -8); x.lineTo(-24, -66); x.lineTo(24, -66); x.closePath(); x.fill(); } x.restore();
  }),
  tow: () => canvasTex(768, 256, (x, W, H) => { x.fillStyle = '#15171c'; rrect(x, 8, 8, W - 16, H - 16, 28); x.fill(); x.fillStyle = '#f0ac14'; x.font = fnt(112); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TOWING', W / 2, H * 0.4); x.fillStyle = '#fff'; x.font = fnt(62); x.fillText('24 / 7  RECOVERY', W / 2, H * 0.76); }),
  bus: () => canvasTex(1536, 192, (x, W, H) => { x.fillStyle = '#fff'; x.font = fnt(120); x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('COAST TRANSIT', 20, H * 0.46); x.fillStyle = '#ffc83a'; x.beginPath(); x.moveTo(20, H * 0.9); x.lineTo(W - 20, H * 0.76); x.lineTo(W - 20, H * 0.9); x.closePath(); x.fill(); }),
  van: () => canvasTex(1024, 384, (x, W, H) => { x.fillStyle = '#fff'; rrect(x, 12, 12, W - 24, H - 24, 44); x.fill(); x.strokeStyle = '#ff4fa3'; x.lineWidth = 10; x.stroke(); x.font = fnt(108); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ff4fa3'; x.fillText('NEON', W * 0.27, H * 0.4); x.fillStyle = '#ff7a2a'; x.fillText('BURGER', W * 0.69, H * 0.4); x.fillStyle = '#1b2a55'; x.font = fnt(46); x.fillText('FAST  DELIVERY  •  HOT  &  FRESH', W / 2, H * 0.78); }),
  topper: () => canvasTex(512, 160, (x, W, H) => { x.fillStyle = '#ff4fa3'; rrect(x, 4, 4, W - 8, H - 8, 24); x.fill(); x.fillStyle = '#fff'; x.font = fnt(84); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('BURGER', W / 2, H / 2); }),
  busfront: () => canvasTex(768, 112, (x, W, H) => { x.fillStyle = '#050505'; x.fillRect(0, 0, W, H); x.fillStyle = '#ffb21a'; x.font = 'bold 74px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('7  COAST LOOP', W / 2, H / 2 + 4); }),
  bussign: () => canvasTex(512, 96, (x, W, H) => { x.fillStyle = '#050505'; x.fillRect(0, 0, W, H); x.fillStyle = '#ffb21a'; x.font = 'bold 62px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('7  COAST', W / 2, H / 2 + 3); }),
};
const decalMats = new Map();
function decalMat(key, lit) {
  const k = (lit ? 'L' : 'D') + key; if (!decalMats.has(k)) { const t = DECAL_TEX[key](); decalMats.set(k, lit ? new THREE.MeshBasicMaterial({ map: t, transparent: true }) : new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.45, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); }
  return decalMats.get(k);
}
// Details that are merged into one vertex-coloured mesh per type. c = { w, box, dbox, dcyl, paint, dark, chrome, decor }: dbox/dcyl take a hex colour first, then the size and the position.
function ambulanceXtra(c) {
  const { w, dbox, decor } = c, W2 = w / 2 + HZ, red = 0xd4122a;
  for (const s of [-1, 1]) {
    decor.push(dbox(red, 3.16, 0.2, 0.02, -1.3, 1.3, s * W2), dbox(0xff6a1a, 5.7, 0.07, 0.02, 0, 0.62, s * W2), dbox(0x0c1018, 0.9, 0.5, 0.02, -0.75, 1.98, s * W2), dbox(0x2a2d33, 0.025, 1.75, 0.02, -1.55, 1.42, s * W2), dbox(0x2a2d33, 0.025, 1.75, 0.02, -2.3, 1.42, s * W2), dbox(0xcfd4da, 0.18, 0.04, 0.03, -1.45, 1.1, s * (W2 + 0.01)));
    decor.push(dbox(0x15171c, 0.1, 0.3, 0.1, 1.72, 1.7, s * (w / 2 + 0.22)), dbox(0x2a2d33, 0.5, 0.1, 0.18, 1.05, 0.5, s * (w / 2 + 0.1))); // mirror, cab step
    decor.push(dbox(0x0c1018, 0.02, 0.5, 0.42, -2.971, 1.98, s * 0.52), dbox(0xff6a1a, 0.02, 0.07, 0.45, -2.971, 0.62, s * 0.6), dbox(0xff6a1a, 0.02, 0.07, 0.45, -2.971, 0.78, s * 0.6));
  }
  decor.push(dbox(red, 0.02, 0.2, w * 0.98, -2.971, 1.3, 0), dbox(0x2a2d33, 0.02, 1.75, 0.03, -2.971, 1.42, 0), dbox(0x2a2d33, 0.25, 0.1, 1.9, -2.99, 0.46, 0));
  decor.push(dbox(0xdfe3e8, 1.0, 0.16, 0.8, -1.55, 2.53, 0), dbox(0x15171c, 0.42, 0.08, 1.9, 0.72, 2.1, 0)); // roof vent, light bar housing
}
function fireXtra(c) {
  const { w, dbox, dcyl, decor } = c, W2 = w / 2 + HZ, al = 0xaab0b8, dk = 0x20232a;
  for (const s of [-1, 1]) {
    decor.push(dbox(0xf2f2f2, 7.9, 0.12, 0.02, 0, 1.0, s * W2), dbox(0xffc83a, 7.9, 0.04, 0.02, 0, 0.9, s * W2));
    for (const x of [-3.0, -1.5, 0.0]) { decor.push(dbox(al, 1.38, 1.4, 0.02, x, 1.9, s * W2)); for (let k = 0; k < 13; k++) decor.push(dbox(dk, 1.38, 0.016, 0.022, x, 1.26 + k * 0.105, s * W2)); decor.push(dbox(dk, 1.0, 0.05, 0.03, x, 2.62, s * W2)); }
    decor.push(dbox(0x2b2e34, 1.0, 1.3, 0.02, 1.4, 1.85, s * W2)); for (let i = 0; i < 6; i++) decor.push(dcyl(0xdfe3e8, 0.09, 0.09, 0.03, 1.12 + (i % 3) * 0.28, 2.15 - Math.floor(i / 3) * 0.4, s * (W2 + 0.01), Math.PI / 2, 0, 0));
    decor.push(dbox(0x15171c, 0.14, 0.5, 0.18, 3.55, 2.1, s * (w / 2 + 0.2)), dbox(dk, 0.5, 0.08, 0.3, 2.85, 0.72, s * (w / 2 + 0.15)), dbox(0xcfd4da, 0.04, 0.04, 0.9, 3.0, 1.55, s * (W2 + 0.02)));
    decor.push(dcyl(0x2a2d33, 0.13, 0.13, 5.4, -0.9, 3.0, s * 0.95, 0, 0, Math.PI / 2)); // suction hoses along the roof
    decor.push(dbox(0xcfd4da, 5.6, 0.06, 0.06, -0.9, 3.04, s * 0.42));
  }
  for (let k = 0; k < 17; k++) decor.push(dbox(0xcfd4da, 0.04, 0.04, 0.9, -3.6 + k * 0.33, 3.04, 0));
  for (const x of [-3.5, -1.0, 1.5]) for (const s of [-1, 1]) decor.push(dbox(dk, 0.12, 0.1, 0.12, x, 2.97, s * 0.42));
  decor.push(dbox(0xcfd4da, 0.2, 0.28, w * 0.96, 4.05, 0.78, 0), dbox(0x1a1c22, 0.05, 0.55, 1.6, 4.07, 1.12, 0), dbox(dk, 0.45, 0.14, 2.3, -4.18, 0.58, 0), dbox(0xcfd4da, 0.05, 0.05, 2.2, 3.74, 0.95, 0));
  for (let i = 0; i < 8; i++) decor.push(dbox(i % 2 ? 0xf2f2f2 : 0xffc83a, 0.02, 0.9, 0.3, -4.071, 1.2, -1.05 + i * 0.3)); // hi-vis chevrons on the tail
  decor.push(dbox(dk, 0.5, 0.16, 1.9, 3.0, 2.82, 0)); // light bar housing
}
function towXtra(c) {
  const { w, dbox, decor } = c, W2 = w / 2 + HZ;
  decor.push(dbox(0x30333a, 3.8, 0.05, 2.2, -1.4, 1.275, 0), dbox(0x2a2d33, 0.1, 0.08, 2.2, -3.3, 1.31, 0), dbox(0x2a2d33, 0.08, 1.0, 0.08, 0.48, 1.76, 0.95), dbox(0x2a2d33, 0.08, 1.0, 0.08, 0.48, 1.76, -0.95), dbox(0x2a2d33, 0.08, 0.08, 1.98, 0.48, 2.26, 0));
  for (let i = 0; i < 5; i++) decor.push(dbox(0x2a2d33, 0.05, 0.9, 0.05, 0.48, 1.76, -0.7 + i * 0.35));
  decor.push(dbox(0xd49a10, 0.55, 1.3, 1.1, -1.05, 1.9, 0)); // boom column
  for (const s of [-1, 1]) {
    decor.push(dbox(0xd49a10, 1.3, 0.55, 0.42, -0.12, 1.57, s * 0.78), dbox(0x15171c, 1.3, 0.04, 0.44, -0.12, 1.57, s * 0.78), dbox(0xcfd4da, 0.16, 0.04, 0.04, 0.35, 1.6, s * 1.0));
    decor.push(dbox(0x15171c, 0.12, 0.34, 0.14, 1.95, 1.75, s * (w / 2 + 0.2)), dbox(0x2a2d33, 0.4, 0.08, 0.2, 1.3, 0.62, s * (w / 2 + 0.1)));
    for (let k = 0; k < 6; k++) decor.push(dbox(k % 2 ? 0x15171c : 0xf0ac14, 0.02, 0.2, 0.4, -3.385, 0.9, s * (0.2 + k * 0.17))); // hazard stripes on the tail plate
  }
  decor.push(dbox(0x2a2d33, 0.18, 0.2, w * 0.96, -3.4, 0.62, 0), dbox(0x2a2d33, 0.2, 0.3, w * 0.96, 3.4, 0.62, 0));
}
function busXtra(c) {
  const { w, dbox, paint, decor } = c, W2 = w / 2 + HZ, zc = w * 0.45 + 0.012, dk = 0x1a1c21;
  for (const x of [-4.7, -3.2, -1.7, 1.0, 2.5, 3.45, 5.1]) for (const s of [-1, 1]) paint.push(c.box(0.1, 1.46, 0.04, x, 2.04, s * zc)); // window pillars (the door bays stay open)
  decor.push(dbox(0xf3f5f8, 10.7, 0.16, w * 0.97, 0, 2.86, 0), dbox(0xf3f5f8, 0.14, 0.4, w * 0.97, 5.28, 2.7, 0), dbox(0xf3f5f8, 0.14, 0.4, w * 0.97, -5.28, 2.7, 0));
  decor.push(dbox(0xd8dde3, 2.4, 0.28, 1.3, -1.8, 3.08, 0), dbox(0xd8dde3, 1.0, 0.2, 1.1, 2.9, 3.0, 0));
  for (const s of [-1, 1]) {
    decor.push(dbox(0xf3f5f8, 10.4, 0.18, 0.02, 0, 0.62, s * W2), dbox(0xffc83a, 10.4, 0.07, 0.02, 0, 1.2, s * W2));
    decor.push(dbox(dk, 0.06, 0.06, 0.45, 5.0, 2.3, s * (w / 2 + 0.2)), dbox(dk, 0.1, 0.46, 0.2, 5.0, 2.1, s * (w / 2 + 0.42)));
  }
  for (const x of [4.3, -0.15]) { // doors on the right side only: dark frame, two light glass leaves
    decor.push(dbox(dk, 1.2, 1.5, 0.03, x, 2.05, W2 + 0.01), dbox(0x7fa6c4, 0.52, 1.38, 0.03, x - 0.28, 2.05, W2 + 0.03), dbox(0x7fa6c4, 0.52, 1.38, 0.03, x + 0.28, 2.05, W2 + 0.03), dbox(dk, 1.2, 0.5, 0.03, x, 0.98, W2 + 0.01));
  }
  decor.push(dbox(dk, 0.02, 0.5, 1.8, -5.371, 0.85, 0)); for (let i = 0; i < 4; i++) decor.push(dbox(0x2b2e34, 0.03, 0.03, 1.8, -5.376, 0.68 + i * 0.12, 0));
  decor.push(dbox(0xffc83a, 0.02, 0.1, w * 0.97, 5.371, 0.95, 0));
}
function vanXtra(c) {
  const { w, dbox, decor } = c, W2 = w / 2 + HZ, dk = 0x2a2d33;
  for (const s of [-1, 1]) {
    decor.push(dbox(0xf6f6f6, 3.0, 0.14, 0.02, -1.0, 0.7, s * W2), dbox(dk, 0.025, 1.4, 0.02, -0.08, 1.35, s * W2), dbox(dk, 0.025, 1.4, 0.02, -1.95, 1.35, s * W2), dbox(0xcfd4da, 0.16, 0.04, 0.03, -0.25, 1.2, s * (W2 + 0.01)));
    decor.push(dbox(0x15171c, 0.1, 0.3, 0.1, 1.15, 1.55, s * (w / 2 + 0.2)));
    decor.push(dbox(0x0c1018, 0.02, 0.5, 0.4, -2.683, 1.7, s * 0.48));
  }
  decor.push(dbox(dk, 0.02, 1.4, 0.03, -2.683, 1.35, 0), dbox(0xf6f6f6, 0.02, 0.12, w * 0.97, -2.683, 0.72, 0), dbox(0xff4fa3, 0.55, 0.12, 0.92, -1.0, 2.26, 0), dbox(0xff4fa3, 0.54, 0.32, 0.9, -1.0, 2.42, 0));
}
// Side profiles (x forward, y up). Body and cabin polygons per type. Optional keys (job vehicles): axles (x of each axle), top (roof height for the chase camera), seams (x of the door seams),
// xtra (detail builder), bar { x, y, parts [[x,y,z,sx,sy,sz,mat]], cols [[on,off] x2] } = roof siren bar whose two halves (mat 0 / 1) flash alternately while Vehicle.siren is on,
// flash (more flashers on the body, same materials), decals (side planes), signs (lit planes), monitor / boom (animated parts, see buildVehicleModel).
const PROFILES = {
  sedan:  { body: [[-2.25, 0.36], [2.25, 0.36], [2.25, 0.78], [1.85, 0.92], [-2.0, 0.92], [-2.25, 0.78]], cabin: [[-1.55, 0.92], [1.35, 0.92], [0.75, 1.45], [-1.05, 1.45]], wheel: 0.34 },
  taxi:   { body: [[-2.25, 0.36], [2.25, 0.36], [2.25, 0.78], [1.85, 0.92], [-2.0, 0.92], [-2.25, 0.78]], cabin: [[-1.55, 0.92], [1.35, 0.92], [0.75, 1.45], [-1.05, 1.45]], wheel: 0.34, roofSign: true },
  police: { body: [[-2.35, 0.36], [2.35, 0.36], [2.35, 0.78], [1.95, 0.92], [-2.1, 0.92], [-2.35, 0.78]], cabin: [[-1.6, 0.92], [1.4, 0.92], [0.8, 1.45], [-1.1, 1.45]], wheel: 0.35, lightbar: true, livery: true },
  sport:  { body: [[-2.25, 0.3], [2.25, 0.3], [2.25, 0.62], [1.55, 0.74], [-1.9, 0.8], [-2.25, 0.7]], cabin: [[-1.45, 0.78], [1.35, 0.72], [0.35, 1.18], [-0.95, 1.2]], wheel: 0.36, spoiler: true },
  super:  { body: [[-2.3, 0.28], [2.3, 0.28], [2.3, 0.52], [1.2, 0.66], [-1.6, 0.74], [-2.3, 0.64]], cabin: [[-1.3, 0.72], [1.15, 0.66], [0.1, 1.08], [-0.85, 1.1]], wheel: 0.37, spoiler: true, wing: true },
  muscle: { body: [[-2.45, 0.36], [2.45, 0.36], [2.45, 0.82], [2.05, 0.98], [-2.2, 0.98], [-2.45, 0.82]], cabin: [[-1.5, 0.98], [1.1, 0.98], [0.55, 1.42], [-1.15, 1.42]], wheel: 0.37, spoiler: true, stripe: true },
  suv:    { body: [[-2.4, 0.46], [2.4, 0.46], [2.4, 1.02], [2.0, 1.12], [-2.4, 1.12]], cabin: [[-2.25, 1.12], [1.5, 1.12], [0.95, 1.92], [-2.15, 1.92]], wheel: 0.42, rack: true },
  swat:   { body: [[-2.8, 0.52], [2.8, 0.52], [2.8, 1.22], [2.4, 1.32], [-2.8, 1.32]], cabin: [[-2.65, 1.32], [2.05, 1.32], [1.6, 2.35], [-2.65, 2.35]], wheel: 0.48, lightbar: true },
  limo:   { body: [[-3.2, 0.36], [3.2, 0.36], [3.2, 0.78], [2.8, 0.92], [-3.0, 0.92], [-3.2, 0.78]], cabin: [[-2.6, 0.92], [2.2, 0.92], [1.6, 1.45], [-2.3, 1.45]], wheel: 0.34 },
  truck:  { body: [[1.0, 0.5], [3.3, 0.5], [3.3, 1.4], [3.05, 1.55], [1.0, 1.55]], cabin: [[1.0, 1.55], [3.0, 1.55], [2.7, 2.5], [1.0, 2.5]], wheel: 0.5, cargo: true, sixWheels: true },
  ambulance: { body: [[-2.9, 0.42], [2.9, 0.42], [2.9, 0.95], [2.5, 1.12], [1.8, 1.15], [0.3, 1.15], [0.3, 2.45], [-2.7, 2.45], [-2.9, 2.3]], cabin: [[0.3, 1.15], [1.8, 1.15], [1.15, 2.02], [0.3, 2.08]], wheel: 0.38, top: 2.6, xtra: ambulanceXtra,
    bar: { x: 0.72, y: 2.2, parts: [[0, 0, 0.5, 0.3, 0.14, 0.8, 0], [0, 0, -0.5, 0.3, 0.14, 0.8, 1]], cols: [[0xff2020, 0x500000], [0x9ac8ff, 0x283848]] },
    flash: [[2.97, 0.85, 0.5, 0.06, 0.1, 0.34, 0], [2.97, 0.85, -0.5, 0.06, 0.1, 0.34, 1], [-2.97, 2.3, 0.85, 0.06, 0.14, 0.4, 0], [-2.97, 2.3, -0.85, 0.06, 0.14, 0.4, 1]],
    decals: [{ key: 'amb', w: 2.7, h: 1.0, x: -1.35, y: 1.8 }] },
  firetruck: { body: [[-4.0, 0.5], [4.0, 0.5], [4.0, 1.35], [3.7, 1.7], [2.0, 1.7], [2.0, 2.9], [-3.8, 2.9], [-4.0, 2.7]], cabin: [[2.0, 1.7], [3.7, 1.7], [3.45, 2.72], [2.0, 2.78]], wheel: 0.55, axles: [2.95, -1.9, -3.2], top: 3.1, xtra: fireXtra, monitor: { x: 1.15, y: 2.96 },
    bar: { x: 3.0, y: 2.95, parts: [[0, 0, 0.6, 0.32, 0.16, 0.9, 0], [0, 0, -0.6, 0.32, 0.16, 0.9, 1]], cols: [[0xff2020, 0x500000], [0xfff0d0, 0x4a4638]] },
    flash: [[4.07, 0.9, 1.0, 0.06, 0.12, 0.3, 0], [4.07, 0.9, -1.0, 0.06, 0.12, 0.3, 1], [-4.07, 2.75, 1.05, 0.06, 0.16, 0.4, 0], [-4.07, 2.75, -1.05, 0.06, 0.16, 0.4, 1]],
    decals: [{ key: 'fire', w: 3.9, h: 0.44, x: -1.3, y: 2.77 }] },
  towtruck: { body: [[-3.3, 0.5], [3.3, 0.5], [3.3, 1.18], [2.85, 1.36], [1.95, 1.42], [0.6, 1.42], [0.6, 1.25], [-3.3, 1.25]], cabin: [[0.6, 1.42], [1.95, 1.42], [1.4, 2.3], [0.6, 2.3]], wheel: 0.5, axles: [2.2, -1.6], top: 2.6, xtra: towXtra, boom: { x: -1.05, y: 2.5 },
    bar: { x: 1.0, y: 2.42, parts: [[0, 0, 0.45, 0.26, 0.2, 0.34, 0], [0, 0, -0.45, 0.26, 0.2, 0.34, 1]], cols: [[0xffa21a, 0x4a2800], [0xffa21a, 0x4a2800]] },
    flash: [[-3.385, 1.0, 0.8, 0.05, 0.12, 0.35, 0], [-3.385, 1.0, -0.8, 0.05, 0.12, 0.35, 1]],
    decals: [{ key: 'tow', w: 1.0, h: 0.34, x: 1.28, y: 0.98 }] },
  bus: { body: [[-5.3, 0.45], [5.3, 0.45], [5.3, 1.0], [5.2, 1.3], [-5.2, 1.3], [-5.3, 1.1]], cabin: [[-5.15, 1.3], [5.2, 1.3], [5.1, 2.78], [-5.15, 2.78]], wheel: 0.52, axles: [3.6, -3.0], top: 3.1, seams: [], xtra: busXtra,
    decals: [{ key: 'bus', w: 3.0, h: 0.375, x: 1.95, y: 0.9 }],
    signs: [{ key: 'busfront', w: 2.0, h: 0.29, x: 5.185, y: 2.63, ry: Math.PI / 2 }, { key: 'busfront', w: 1.2, h: 0.18, x: -5.225, y: 2.6, ry: -Math.PI / 2 }, { key: 'bussign', w: 1.2, h: 0.225, x: 3.4, y: 2.6, z: 1.18, ry: 0 }] },
  van: { body: [[-2.6, 0.42], [2.6, 0.42], [2.6, 0.92], [2.25, 1.06], [1.55, 1.1], [0.35, 1.1], [0.35, 2.2], [-2.45, 2.2], [-2.6, 2.05]], cabin: [[0.35, 1.1], [1.55, 1.1], [0.95, 1.82], [0.35, 1.88]], wheel: 0.36, top: 2.6, xtra: vanXtra,
    decals: [{ key: 'van', w: 2.9, h: 1.08, x: -1.05, y: 1.6 }],
    signs: [{ key: 'topper', w: 0.5, h: 0.2, x: -1.0, y: 2.42, z: 0.456, ry: 0 }, { key: 'topper', w: 0.5, h: 0.2, x: -1.0, y: 2.42, z: -0.456, ry: Math.PI }] },
};
const POLICE_BAR = { parts: [[0, 0, 0.34, 0.34, 0.16, 0.5, 0], [0, 0, -0.34, 0.34, 0.16, 0.5, 1]], cols: [[0xff2020, 0x550000], [0x2a60ff, 0x000055]] };
const matCache = new Map();
// Car paint and glass mirror the city: envRegister gives them their own reflection strength (env.js assigns the PMREM texture).
const paint = hex => { const k = 'p' + hex; if (!matCache.has(k)) matCache.set(k, envRegister(new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.4, metalness: 0.3, clearcoat: 1.0, clearcoatRoughness: 0.12 }), 0.9)); return matCache.get(k); };
const glassMat = envRegister(new THREE.MeshPhysicalMaterial({ color: 0x0a1624, roughness: 0.06, metalness: 0.85, clearcoat: 1.0, clearcoatRoughness: 0.05 }), 1.0);
const propMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.2 });
const darkMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.7 });
const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.18, metalness: 0.95 });
const plateMat = new THREE.MeshStandardMaterial({ color: 0xf2f2e8, roughness: 0.5 });
const wreckMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
const decorMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3 }); // job vehicle details: stripes, shutters, ladders, door frames
// vertex-coloured box / cylinder (cylinder axis = local y) for the merged detail meshes
const dbox = (hex, bw, bh, bd, x, y, z, ry = 0, rz = 0) => xform(new THREE.BoxGeometry(bw, bh, bd), M4(x, y, z, 0, ry, rz), new THREE.Color(hex));
const dcyl = (hex, rt, rb, h, x, y, z, rx = 0, ry = 0, rz = 0) => xform(new THREE.CylinderGeometry(rt, rb, h, 12), M4(x, y, z, rx, ry, rz), new THREE.Color(hex));
// ---------- headlight beam on the road ----------
// Two soft lobes (one per headlight) that widen and fade with distance. t = 0 at the bumper, 1 at the far end; u = -1..1 across the plane.
// Every edge of the texture ends at alpha ~0, so no rectangle shows. The plane starts 0.1 m in front of the bumper and is POOL_LEN long.
const POOL_LEN = 11;
const poolTexCache = {};
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }; // also works with a > b (falling edge)
function poolTex() {
  if (poolTexCache.t) return poolTexCache.t;
  const W = 128, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
  for (let y = 0; y < H; y++) {
    const t = 1 - (y + 0.5) / H; // canvas row 0 is the far end (flipY), the last row touches the bumper
    const hw = 0.18 + 0.32 * t, along = sstep(0, 0.12, t) * Math.pow(1 - t, 1.6);
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W * 2 - 1, a = (u + 0.28) / hw, b = (u - 0.28) / hw, l1 = Math.exp(-a * a * 1.8), l2 = Math.exp(-b * b * 1.8);
      const alpha = (1 - (1 - l1) * (1 - l2)) * along * sstep(1, 0.8, Math.abs(u)) * 0.95, i = (y * W + x) * 4;
      d[i] = 255; d[i + 1] = 238; d[i + 2] = 200; d[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; poolTexCache.t = tex; return tex;
}
const poolMat = new THREE.MeshBasicMaterial({ map: null, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
// One material for the lamps of every car: its colour carries HEADLIGHT_GLOW (set below), the per-car vertex colours carry each lamp state.
const lightMat = new THREE.MeshBasicMaterial({ vertexColors: true });
export let HEADLIGHT_GLOW = 1;
export function setHeadlightPools(night) {
  if (!poolMat.map) { poolMat.map = poolTex(); poolMat.needsUpdate = true; }
  poolMat.opacity = Math.max(0, night - 0.15) * 0.5; HEADLIGHT_GLOW = 1 + night * 1.3; lightMat.color.setScalar(HEADLIGHT_GLOW);
}
const geoCache = new Map();
function extrude(points, width) { const k = JSON.stringify(points) + width; if (!geoCache.has(k)) { const s = new THREE.Shape(points.map(p => new THREE.Vector2(p[0], p[1]))); const g = new THREE.ExtrudeGeometry(s, { depth: width - 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 }); g.translate(0, 0, -(width - 0.12) / 2); g.computeVertexNormals(); geoCache.set(k, g); } return geoCache.get(k); }

// ---------- wheels ----------
// The axle is local z. Layers from the outside in: tyre, sidewall ring, rim lip, dish, then spokes + hub cap (alloys) or slots + a big hub cap (steel).
// Built from vertex-coloured discs, cached per (radius, style): every car of a style shares one geometry.
const WHEEL_STYLES = {
  silver: { rim: 0xc4c8d0, dish: 0x3a3d44, spokes: 5 },
  black:  { rim: 0x17181c, dish: 0x3a3d44, spokes: 6 },
  gold:   { rim: 0xd6a52e, dish: 0x3a3d44, spokes: 5 },
  steel:  { rim: 0xa4aab3, dish: 0x6f757e, spokes: 0 },
};
function wheelGeo(r, style = 'steel') {
  const k = 'w' + r + style; if (geoCache.has(k)) return geoCache.get(k);
  const S = WHEEL_STYLES[style] || WHEEL_STYLES.steel, parts = [], HP = Math.PI / 2;
  const cyl = (rad, h, seg, hex) => xform(new THREE.CylinderGeometry(rad, rad, h, seg), M4(0, 0, 0, HP, 0, 0), new THREE.Color(hex));
  const disc = (rad, z, hex) => xform(new THREE.CircleGeometry(rad, 20), M4(0, 0, z, 0, z < 0 ? Math.PI : 0, 0), new THREE.Color(hex)); // faces +z, turned round on the -z face
  parts.push(cyl(r, 0.26, 20, 0x151517));
  for (const s of [-1, 1]) {
    parts.push(disc(r * 0.8, s * 0.1325, 0x26272b), disc(r * 0.66, s * 0.135, S.rim), disc(r * 0.6, s * 0.1375, S.dish));
    const zf = s * 0.14, rim = new THREE.Color(S.rim);
    if (S.spokes) { // radial spokes from the hub to the rim lip; the box centre sits at 0.36r, so the spoke covers 0.1r..0.62r
      const len = r * 0.52, off = r * 0.36;
      for (let i = 0; i < S.spokes; i++) { const a = i * Math.PI * 2 / S.spokes; parts.push(xform(new THREE.BoxGeometry(len, 0.07, 0.05), M4(Math.cos(a) * off, Math.sin(a) * off, zf, 0, 0, a), rim)); }
    } else { // steel wheel: ventilation slots around a big chrome hub cap
      const slot = r * 0.52, len = r * 0.12, dark = new THREE.Color(0x1e2024);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; parts.push(xform(new THREE.BoxGeometry(len, 0.04, 0.006), M4(Math.cos(a) * slot, Math.sin(a) * slot, s * 0.1385, 0, 0, a), dark)); }
    }
  }
  if (S.spokes) parts.push(cyl(r * 0.16, 0.3, 10, 0xe6eaf0));
  else { parts.push(cyl(r * 0.44, 0.29, 14, 0xdde1e8)); parts.push(cyl(r * 0.16, 0.3, 10, 0x8a909a)); }
  geoCache.set(k, mergeGeometries(parts)); return geoCache.get(k);
}
function pickWheelStyle(type) {
  const r = Math.random();
  switch (type) {
    case 'sport': case 'super': return r < 0.4 ? 'silver' : r < 0.75 ? 'black' : 'gold';
    case 'muscle': return r < 0.35 ? 'silver' : r < 0.65 ? 'black' : 'gold';
    case 'suv': return r < 0.4 ? 'silver' : r < 0.8 ? 'black' : 'steel';
    case 'swat': return r < 0.7 ? 'black' : 'steel';
    case 'limo': return r < 0.6 ? 'silver' : 'black';
    case 'sedan': return r < 0.45 ? 'steel' : r < 0.85 ? 'silver' : 'black';
    case 'taxi': return r < 0.75 ? 'steel' : 'silver';
    default: return 'steel'; // police, truck
  }
}
const wheelAxles = (spec, pr) => pr.axles || (pr.cargo ? [2.3, -0.6, -2.0] : [spec.len * 0.32, -spec.len * 0.32]);
// highest point of the body (or the truck's cargo box) above the vertical line through x; -1 when nothing is there
function bodyTop(pr, x) {
  let y = -1; const b = pr.body;
  for (let i = 0; i < b.length; i++) { const p = b[i], q = b[(i + 1) % b.length]; if (p[0] !== q[0] && (x - p[0]) * (x - q[0]) <= 0) y = Math.max(y, p[1] + (q[1] - p[1]) * (x - p[0]) / (q[0] - p[0])); }
  if (pr.cargo && x > -3.3 && x < 0.8) y = Math.max(y, 3.0);
  return y;
}

// ---------- lamps ----------
// One merged mesh per car holds every lamp, in five groups whose vertex colours are rewritten only when their state changes (Vehicle.setLamp).
// Left = local -z, right = local +z (the same sides as Vehicle.signal: -1 left, +1 right).
export const LAMP = { head: 0, tail: 1, indL: 2, indR: 3, rev: 4 };
const lampCache = new Map(), _lc = new THREE.Color(), _white = new THREE.Color(1, 1, 1);
function lampTemplate(type, spec, pr) {
  let tpl = lampCache.get(type); if (tpl) return tpl;
  const w = spec.wid, front = pr.body[1][0], back = pr.body[0][0], ly = pr.body[2][1] - 0.1, by = pr.body[0][1];
  // the truck carries its rear lamps on the cargo box (rear face x = -3.3); every other car on the body (rear wall at back - 0.06)
  const rearX = pr.cargo ? -3.24 : back, ry = pr.cargo ? 1.0 : ly, vx = pr.cargo ? -3.32 : back - 0.12, vy = pr.cargo ? 0.75 : by + 0.1;
  const hz = w * 0.31, iz = w / 2 - 0.08, vz = w * 0.18, groups = [[], [], [], [], []];
  const mk = (sx, sy, sz, x, y, z) => xform(new THREE.BoxGeometry(sx, sy, sz), M4(x, y, z), _white);
  for (const s of [-1, 1]) {
    groups[LAMP.head].push(mk(0.08, 0.18, 0.34, front + 0.03, ly, s * hz));
    groups[LAMP.tail].push(mk(0.08, 0.16, 0.34, rearX - 0.03, ry, s * hz));
    groups[s < 0 ? LAMP.indL : LAMP.indR].push(mk(0.06, 0.08, 0.16, front + 0.05, ly, s * iz), mk(0.06, 0.08, 0.16, rearX - 0.05, ry, s * iz));
    groups[LAMP.rev].push(mk(0.04, 0.08, 0.16, vx, vy, s * vz));
  }
  const all = [], start = [0];
  for (const g of groups) { let n = 0; for (const geo of g) { all.push(geo); n += geo.attributes.position.count; } start.push(start[start.length - 1] + n); }
  tpl = { geo: mergeGeometries(all), start }; lampCache.set(type, tpl); return tpl;
}

let policeTex = null;
function policeDoorTex() { if (policeTex) return policeTex; const c = document.createElement('canvas'); c.width = 256; c.height = 64; const ctx = c.getContext('2d'); ctx.fillStyle = '#1b2a55'; ctx.fillRect(0, 0, 256, 64); ctx.fillStyle = '#ffffff'; ctx.font = '900 40px Heebo, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('POLICE', 128, 33); policeTex = new THREE.CanvasTexture(c); policeTex.colorSpace = THREE.SRGBColorSpace; return policeTex; }

// The merged paint / dark / chrome / plate geometry only depends on the car type, so it is built once per type and shared by every car of it.
function carParts(type, spec, pr) {
  const kp = 'pp' + type;
  if (!geoCache.has(kp)) {
    const w = spec.wid, cab = pr.cabin, top = cab[2], top2 = cab[3];
    const box = (bw, bh, bd, x, y, z, ry = 0, rz = 0) => xform(new THREE.BoxGeometry(bw, bh, bd), M4(x, y, z, 0, ry, rz));
    const roof = () => box(Math.abs(top[0] - top2[0]) + 0.1, 0.07, w * 0.9, (top[0] + top2[0]) / 2, top[1], 0);
    const paintParts = [roof()], darkParts = [], chromeParts = [], plateParts = [];
    const front = pr.body[1][0], back = pr.body[0][0], ly = pr.body[2][1] - 0.1, by = pr.body[0][1];
    // bumpers, grille, exhaust, door seams, mirrors, plates
    darkParts.push(box(0.16, 0.22, w * 0.98, front + 0.02, by + 0.1, 0)); darkParts.push(box(0.16, 0.22, w * 0.98, back - 0.02, by + 0.1, 0));
    darkParts.push(box(0.05, 0.16, w * 0.42, front + 0.06, ly + 0.02, 0)); chromeParts.push(box(0.06, 0.03, w * 0.42, front + 0.07, ly + 0.08, 0)); chromeParts.push(box(0.06, 0.03, w * 0.42, front + 0.07, ly - 0.04, 0));
    chromeParts.push(xform(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), M4(back - 0.1, by + 0.02, -w * 0.3, 0, 0, Math.PI / 2)));
    const cab0 = cab[0][0], cab1 = cab[1][0]; const seamX = pr.cargo ? [] : (pr.seams || [cab0 + (cab1 - cab0) * 0.5, cab0 - 0.05, cab1 + 0.05]);
    for (const sx of seamX) for (const side of [-1, 1]) darkParts.push(box(0.03, ly - by + 0.3, 0.02, sx, (ly + by) / 2 + 0.1, side * (w / 2 + 0.005)));
    for (const side of [-1, 1]) { paintParts.push(box(0.18, 0.1, 0.22, cab[1][0] - 0.1, cab[1][1] + 0.12, side * (w / 2 + 0.1))); }
    plateParts.push(box(0.03, 0.14, 0.5, front + 0.11, by + 0.12, 0)); plateParts.push(box(0.03, 0.14, 0.5, back - 0.11, by + 0.12, 0));
    if (pr.spoiler) { paintParts.push(box(0.35, 0.06, w * 0.9, back + 0.1, pr.body[3][1] + 0.32, 0)); for (const z of [-0.6, 0.6]) darkParts.push(box(0.2, 0.3, 0.06, back + 0.1, pr.body[3][1] + 0.16, z)); }
    if (pr.wing) { paintParts.push(box(0.3, 0.05, w * 1.0, back + 0.05, pr.body[3][1] + 0.5, 0)); }
    if (pr.stripe) darkParts.push(box(spec.len - 0.1, 0.02, 0.5, 0, pr.body[3][1] + 0.005, 0));
    if (pr.rack) { for (const z of [-w * 0.3, w * 0.3]) darkParts.push(box(2.2, 0.06, 0.06, -0.6, top[1] + 0.12, z)); for (const x of [-1.5, 0.3]) darkParts.push(box(0.06, 0.12, w * 0.62, x, top[1] + 0.08, 0)); }
    if (pr.livery) { paintParts.length = 0; paintParts.push(roof()); } // the police livery keeps only the navy roof; the pillars below are added after this reset
    if (pr.lightbar) darkParts.push(box(0.35, 0.12, 1.25, (top[0] + top2[0]) / 2 + 0.1, top[1] + 0.12, 0));
    // wheel arches: a dark well and a half-ring lip on both body sides around every wheel. Wheels whose tyre already reaches the body line
    // (the front wheels of the low sport / super profiles) get none, otherwise the arch would float above the bodywork.
    const r = pr.wheel;
    for (const x of wheelAxles(spec, pr)) {
      const room = bodyTop(pr, x) - r - 0.015; if (room < r + 0.05) continue;
      const outer = Math.min(r + 0.11, room), well = Math.min(r + 0.04, room);
      for (const side of [-1, 1]) {
        const ry = side < 0 ? Math.PI : 0;
        darkParts.push(xform(new THREE.RingGeometry(r + 0.03, outer, 14, 1, 0, Math.PI), M4(x, r, side * (w / 2 + 0.008), 0, ry, 0)));
        darkParts.push(xform(new THREE.CircleGeometry(well, 14, 0, Math.PI), M4(x, r, side * (w / 2 + 0.004), 0, ry, 0)));
      }
    }
    // window pillars on the glass sides: A (windshield edge), C (rear window edge), B (mid-cabin, not on the truck cab) and a chrome belt strip
    const zc = w * 0.45 + 0.012, lerpY = (p, q, x) => p[1] + (q[1] - p[1]) * (x - p[0]) / ((q[0] - p[0]) || 1);
    const strut = (list, a, b, th, dep, z, dy = 0) => { const dx = b[0] - a[0], dyy = b[1] - a[1]; list.push(box(Math.hypot(dx, dyy), th, dep, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + dy, z, 0, Math.atan2(dyy, dx))); };
    for (const side of [-1, 1]) {
      strut(paintParts, cab[1], cab[2], 0.08, 0.03, side * zc); strut(paintParts, cab[0], cab[3], 0.08, 0.03, side * zc);
      if (!pr.cargo) { const xm = clamp((cab[0][0] + cab[1][0]) / 2, Math.min(cab[3][0], cab[2][0]), Math.max(cab[3][0], cab[2][0])), yb = lerpY(cab[0], cab[1], xm), yt = lerpY(cab[3], cab[2], xm); paintParts.push(box(0.07, yt - yb, 0.03, xm, (yb + yt) / 2, side * zc)); }
      strut(chromeParts, cab[0], cab[1], 0.03, 0.03, side * (zc + 0.002), 0.02);
    }
    const decor = []; if (pr.xtra) pr.xtra({ w, box, dbox, dcyl, paint: paintParts, dark: darkParts, chrome: chromeParts, decor });
    geoCache.set('dc' + type, decor.length ? mergeGeometries(decor) : null);
    geoCache.set(kp, mergeGeometries(paintParts)); geoCache.set('pd' + type, mergeGeometries(darkParts)); geoCache.set('pc' + type, mergeGeometries(chromeParts)); geoCache.set('pl' + type, mergeGeometries(plateParts));
  }
  return { paint: geoCache.get(kp), dark: geoCache.get('pd' + type), chrome: geoCache.get('pc' + type), plate: geoCache.get('pl' + type), decor: geoCache.get('dc' + type) };
}

export function buildVehicleModel(type, color, wheelStyle) {
  const spec = VEHICLES[type], pr = PROFILES[type] || PROFILES.sedan, w = spec.wid; const root = new THREE.Group(); const chassis = new THREE.Group(); root.add(chassis);
  const bodyMat = paint(color);
  const body = new THREE.Mesh(extrude(pr.body, w), bodyMat); body.castShadow = true; body.receiveShadow = true; chassis.add(body);
  const cabin = new THREE.Mesh(extrude(pr.cabin, w * 0.9), glassMat); cabin.castShadow = true; chassis.add(cabin);
  const top = pr.cabin[2], top2 = pr.cabin[3], cab0 = pr.cabin[0][0], cab1 = pr.cabin[1][0];
  const front = pr.body[1][0], ly = pr.body[2][1] - 0.1, by = pr.body[0][1];
  const P = carParts(type, spec, pr);
  if (pr.cargo) { const cargo = new THREE.Mesh(new THREE.BoxGeometry(4.1, 2.5, w), paint(0xe8e8e8)); cargo.position.set(-1.25, 1.75, 0); cargo.castShadow = true; chassis.add(cargo); }
  if (pr.roofSign) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd34e })); s.position.set(-0.1, top[1] + 0.15, 0); chassis.add(s); }
  if (pr.livery) { const t = policeDoorTex(); for (const side of [-1, 1]) { const d = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.42), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 })); d.position.set((cab0 + cab1) / 2 - 0.2, (ly + by) / 2 + 0.16, side * (w / 2 + 0.01)); d.rotation.y = side > 0 ? 0 : Math.PI; chassis.add(d); } }
  // siren bar: two halves (material A / B) that flash alternately while Vehicle.siren is set; pr.flash adds more flashers on the body with the same two materials
  let bar = null; const bc = pr.bar || (pr.lightbar ? POLICE_BAR : null);
  if (bc) {
    bar = new THREE.Group(); bar.position.set(bc.x ?? (top[0] + top2[0]) / 2 + 0.1, bc.y ?? top[1] + 0.12, 0);
    const cols = bc.cols || POLICE_BAR.cols, mats = [new THREE.MeshBasicMaterial({ color: cols[0][1] }), new THREE.MeshBasicMaterial({ color: cols[1][1] })];
    for (const [x, y, z, sx, sy, sz, m] of bc.parts || POLICE_BAR.parts) { const mesh = new THREE.Mesh(boxGeo(sx, sy, sz), mats[m]); mesh.position.set(x, y, z); bar.add(mesh); }
    for (const [x, y, z, sx, sy, sz, m] of pr.flash || []) { const mesh = new THREE.Mesh(boxGeo(sx, sy, sz), mats[m]); mesh.position.set(x, y, z); chassis.add(mesh); }
    bar.userData = { matA: mats[0], matB: mats[1], cols }; chassis.add(bar);
  }
  const extra = []; // job vehicle details: turn black (decals vanish) when the vehicle is wrecked
  for (const d of pr.decals || []) for (const side of d.sides || [-1, 1]) { const m = new THREE.Mesh(planeGeo(d.w, d.h), decalMat(d.key, false)); m.position.set(d.x, d.y, side * (w / 2 + HZ + 0.004)); m.rotation.y = side > 0 ? 0 : Math.PI; m.userData.decal = true; chassis.add(m); extra.push(m); }
  for (const d of pr.signs || []) { const m = new THREE.Mesh(planeGeo(d.w, d.h), decalMat(d.key, true)); m.position.set(d.x, d.y, d.z || 0); m.rotation.y = d.ry || 0; m.userData.decal = true; chassis.add(m); extra.push(m); }
  if (P.decor) { const dc = new THREE.Mesh(P.decor, decorMat); dc.castShadow = true; chassis.add(dc); extra.push(dc); }
  // water cannon on the roof (yaw node, pitch node, barrel along +x) and the tow truck's hoist (pivot group, arm pointing backwards)
  let monitor = null, boom = null;
  if (pr.monitor) {
    if (!geoCache.has('mon0')) {
      geoCache.set('mon0', mergeGeometries([dcyl(0x2a2d33, 0.2, 0.26, 0.22, 0, 0.11, 0), dcyl(0xc9141d, 0.12, 0.14, 0.2, 0, 0.32, 0)]));
      geoCache.set('mon1', mergeGeometries([dbox(0xcfd4da, 0.28, 0.2, 0.34, 0, 0.1, 0), dcyl(0xcfd4da, 0.05, 0.05, 0.4, 0, 0.1, 0, Math.PI / 2, 0, 0)]));
      geoCache.set('mon2', mergeGeometries([dcyl(0xcfd4da, 0.06, 0.1, 0.9, 0.45, 0, 0, 0, 0, -Math.PI / 2), dcyl(0x15171c, 0.075, 0.075, 0.08, 0.92, 0, 0, 0, 0, -Math.PI / 2)]));
    }
    const root = new THREE.Group(); root.position.set(pr.monitor.x, pr.monitor.y, 0); const base = new THREE.Mesh(geoCache.get('mon0'), decorMat); root.add(base);
    const yaw = new THREE.Group(); yaw.position.y = 0.42; const head = new THREE.Mesh(geoCache.get('mon1'), decorMat); yaw.add(head); const pitch = new THREE.Group(); pitch.position.y = 0.1; const barrel = new THREE.Mesh(geoCache.get('mon2'), decorMat); pitch.add(barrel); yaw.add(pitch); root.add(yaw);
    chassis.add(root); extra.push(base, head, barrel); monitor = { root, yaw, pitch, tipX: 0.96 };
  }
  if (pr.boom) {
    if (!geoCache.has('boom')) geoCache.set('boom', mergeGeometries([
      ...[-1, 1].map(s => dbox(0xd49a10, 3.35, 0.14, 0.14, -1.65, -0.28, s * 0.4, 0, 0.165)), dbox(0x2a2d33, 0.14, 0.14, 1.3, -3.28, -0.58, 0), ...[-1, 1].map(s => dbox(0x2a2d33, 0.55, 0.08, 0.1, -3.55, -0.62, s * 0.55)),
      dbox(0x8a8f98, 0.04, 0.55, 0.04, -3.2, -0.9, 0), dbox(0x8a8f98, 0.16, 0.04, 0.04, -3.14, -1.18, 0), dbox(0x8a8f98, 0.04, 0.2, 0.04, -3.06, -1.1, 0), dbox(0x8a8f98, 0.1, 0.12, 0.2, -0.2, 0.16, 0)]));
    boom = new THREE.Group(); boom.position.set(pr.boom.x, pr.boom.y, 0); const arm = new THREE.Mesh(geoCache.get('boom'), decorMat); arm.castShadow = true; boom.add(arm); chassis.add(boom); extra.push(arm);
  }
  const pm = new THREE.Mesh(P.paint, pr.livery ? paint(0x1b2a55) : bodyMat); pm.castShadow = true; chassis.add(pm);
  const dm = new THREE.Mesh(P.dark, darkMat); dm.castShadow = true; chassis.add(dm);
  chassis.add(new THREE.Mesh(P.chrome, chromeMat)); chassis.add(new THREE.Mesh(P.plate, plateMat));
  // all lamps of the car in one draw call: a private copy of the type's template, because the vertex colours are per car
  const tpl = lampTemplate(type, spec, pr), lg = tpl.geo.clone(); lg.attributes.color.setUsage(THREE.DynamicDrawUsage);
  const lights = new THREE.Mesh(lg, lightMat); chassis.add(lights);
  const lamps = { start: tpl.start, hex: new Int32Array(5).fill(-1), mul: new Float64Array(5) };
  // headlight pool on the ground: starts 0.1 m in front of the bumper
  const pool = new THREE.Mesh(planeGeo(w * 2.2, POOL_LEN), poolMat); pool.rotation.x = -Math.PI / 2; pool.rotation.z = -Math.PI / 2; pool.position.set(front + 0.1 + POOL_LEN / 2, 0.04, 0); root.add(pool);
  // wheels: one instanced mesh per car
  const ax = wheelAxles(spec, pr); const wheelPos = []; for (let i = 0; i < ax.length; i++) for (const z of [-w / 2 + 0.05, w / 2 - 0.05]) wheelPos.push({ x: ax[i], z, front: i === 0 });
  const style = wheelStyle || pickWheelStyle(type);
  const wheels = new THREE.InstancedMesh(wheelGeo(pr.wheel, style), propMat, wheelPos.length); wheels.castShadow = true; root.add(wheels);
  return { root, chassis, body, cabin, roof: pm, wheels, wheelPos, bar, lights, lamps, wheelStyle: style, wheelR: pr.wheel, bodyMat, pool, top: pr.top ?? (pr.cargo ? 3.0 : pr.cabin[2][1]), extra, monitor, boom };
}
function boxGeo(a, b, c) { const k = 'bx' + a + 'x' + b + 'x' + c; if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(a, b, c)); return geoCache.get(k); }
function planeGeo(a, b) { const k = 'pl2' + a + 'x' + b; if (!geoCache.has(k)) geoCache.set(k, new THREE.PlaneGeometry(a, b)); return geoCache.get(k); }

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _one = new THREE.Vector3(1, 1, 1);
let nextId = 1;
export class Vehicle {
  // opts (optional): { tier } 2 / 3 = a tuned job vehicle (own copy of the spec, see JOBS.tierSpec, better wheels)
  constructor(type, color, x, z, heading, opts = null) {
    this.id = nextId++; this.type = type; this.spec = VEHICLES[type]; this.color = color ?? CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]; this.tier = opts?.tier > 1 ? opts.tier : 1;
    if (type === 'taxi') this.color = 0xffd034; if (type === 'police') this.color = 0xf2f2f4; if (type === 'swat') this.color = 0x1d2026; if (type === 'limo') this.color = Math.random() < 0.7 ? 0x0c0c10 : 0xf4f4f4;
    if (type === 'ambulance') this.color = 0xf6f6f8; if (type === 'firetruck') this.color = 0xc9141d; if (type === 'towtruck') this.color = 0xf0ac14; if (type === 'bus') this.color = 0x2c6bd0; if (type === 'van' && color == null) this.color = 0xff7a2a;
    if (this.tier > 1) { const m = JOBS.tierSpec[this.tier], b = this.spec, t = { ...b }; for (const k in m) t[k] = b[k] * m[k]; this.spec = t; }
    this.model = buildVehicleModel(type, this.color, this.tier > 2 ? 'gold' : this.tier > 1 ? 'silver' : undefined); this.mesh = this.model.root;
    this.towed = null; this.towedBy = null;
    this.x = x; this.z = z; this.y = 0; this.heading = heading; this.vx = 0; this.vz = 0; this.steer = 0; this.yawKick = 0; this.hp = this.spec.hp; this.maxHp = this.spec.hp;
    this.driver = null; this.ai = null; this.siren = false; this.wrecked = false; this.spin = 0; this.prevVf = 0; this.braking = false; this._brkT = 0; this.hornT = 0; this.lastImpact = 0; this.special = null; this.lightsOn = true; this.parked = false;
    // Indicators: signal -1 = left, +1 = right, 0 = off (AI drivers set it before a turn); hazard = both sides, on top of the automatic panic / collision flashers.
    this.signal = 0; this.hazard = false;
    // Body suspension: roll (+ = right side down), pitch (+ = nose up) and heave are spring-damper states with their own velocities.
    this.roll = 0; this.pitch = 0; this.rollV = 0; this.pitchV = 0; this.heave = 0; this.heaveV = 0; this._st = false;
    // Ground contact: groundPitch / groundRoll share the sign convention of pitch / roll. wheelH holds the ground height under each wheel.
    this.groundPitch = 0; this.groundRoll = 0; this.curbHit = 0; this.groundOn = false; this.wheelH = new Float32Array(this.model.wheelPos.length);
    this._gx = 0; this._gz = 0; this._gh = 0; this._gm = 0; this._tp = 0; this._tr = 0; this._pUp = 0; this._pDn = 0; this._t = 0;
    this.input = { throttle: 0, steer: 0, brake: false, handbrake: false };
    this.syncMesh();
  }
  get fx() { return Math.cos(this.heading); } get fz() { return -Math.sin(this.heading); }
  // a parked car has its headlights off: the beam on the road only shows while the car is not parked (or someone sits in it)
  get parked() { return this._parked; }
  set parked(on) { this._parked = on; this.model.pool.visible = !this.wrecked && (!on || !!this.driver); }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get forwardSpeed() { return this.vx * this.fx + this.vz * this.fz; }
  step(dt) {
    if (this.wrecked) { this.vx *= 0.9; this.vz *= 0.9; this.x += this.vx * dt; this.z += this.vz * dt; return; }
    const s = this.spec, inp = this.input; const fx = this.fx, fz = this.fz, rx = -fz, rz = fx;
    let vf = this.vx * fx + this.vz * fz, vr = this.vx * rx + this.vz * rz; const speed = Math.abs(vf);
    const dmg = 0.55 + 0.45 * (this.hp / this.maxHp); // damaged engines lose power
    if (inp.throttle > 0) vf += s.accel * dmg * inp.throttle * Math.max(0, 1 - vf / (s.maxSpeed * dmg)) * dt;
    // Negative throttle brakes (or reverses) in proportion: keyboard input is exactly -1 and behaves as before, an AI driver asking for -0.2 only brakes lightly.
    if (inp.throttle < 0) { if (vf > 0.5) vf -= s.brake * Math.min(1, -inp.throttle * 1.5) * dt; else vf -= s.accel * 0.45 * -inp.throttle * dt * Math.max(0, 1 + vf / 12); }
    // Brake lights need a real brake request (not a tiny trim) and stay lit for 0.3 s, so a controller hovering around a threshold does not flicker them.
    if (inp.brake || (inp.throttle < -0.15 && vf > 0.5)) this._brkT = 0.3; else if (this._brkT > 0) this._brkT -= dt;
    this.braking = this._brkT > 0;
    if (inp.brake) vf -= Math.sign(vf) * Math.min(Math.abs(vf), s.brake * 1.1 * dt);
    vf -= vf * 0.010 * speed * dt; if (!inp.throttle) vf -= Math.sign(vf) * Math.min(Math.abs(vf), 1.3 * dt);
    const grip = inp.handbrake ? s.grip * 0.16 : s.grip; vr -= vr * Math.min(1, grip * dt);
    const steerLimit = s.steer / (1 + speed / 24); this.steer = damp(this.steer, inp.steer * steerLimit, 10, dt);
    const wheelbase = s.len * 0.62; let yawRate = (vf / wheelbase) * Math.tan(this.steer); if (inp.handbrake && speed > 4) yawRate *= 1.7;
    this.yawKick *= Math.max(0, 1 - 4 * dt); this.heading += (yawRate + this.yawKick) * dt;
    this.vx = fx * vf + rx * vr; this.vz = fz * vf + rz * vr; this.x += this.vx * dt; this.z += this.vz * dt;
    this.slip = Math.abs(vr);
    const accel = (vf - this.prevVf) / Math.max(dt, 1e-3); this.prevVf = vf;
    // weight transfer: a left turn (yawRate > 0) leans the body right (roll +), throttle lifts the nose (pitch +), braking dips it
    this.springs(dt, clamp(yawRate * vf * 0.0045, -0.075, 0.075), clamp(clamp(accel, -40, 40) * 0.0045, -0.07, 0.035)); this._st = true;
    this.spin += vf / this.model.wheelR * dt;
    if (this.hornT > 0) this.hornT -= dt;
  }
  // Spring-damper body model (semi-implicit Euler): roll / pitch chase the weight-transfer targets tR / tP, heave returns to 0.
  // Positive chassis rotation.z lifts the +x nose and positive rotation.x lowers the +z (right) side, so these signs map straight onto syncMesh.
  springs(dt, tR, tP) {
    if (dt > 0.04) dt = 0.04;
    this.rollV += ((tR - this.roll) * 80 - this.rollV * 10) * dt; this.roll += this.rollV * dt;
    this.pitchV += ((tP - this.pitch) * 100 - this.pitchV * 11) * dt; this.pitch += this.pitchV * dt;
    this.heaveV += (-this.heave * 160 - this.heaveV * 14) * dt; this.heave += this.heaveV * dt;
    // hard limits stop stacked impacts from folding the body through the wheels
    this.rollV = clamp(this.rollV, -6, 6); this.pitchV = clamp(this.pitchV, -6, 6); this.heaveV = clamp(this.heaveV, -5, 5);
    this.roll = clamp(this.roll, -0.22, 0.22); this.pitch = clamp(this.pitch, -0.18, 0.18); this.heave = clamp(this.heave, -0.12, 0.2);
  }
  // true while the body is still rocking (never for wrecks, whose suspension is frozen)
  get suspMoving() { return !this.wrecked && (Math.abs(this.rollV) + Math.abs(this.pitchV) + Math.abs(this.heaveV) > 2e-3 || Math.abs(this.roll) + Math.abs(this.pitch) + Math.abs(this.heave) > 2e-4); }
  // Vertical kick of the body: h > 0 hops up (heaveV += h), pk sets how much of it goes into pitch (curb under the front axle: nose up, rear axle: nose down).
  bump(h, pk = 0.6) { if (this.wrecked) return; this.heaveV += h; this.pitchV += h * pk; }
  // Impact response shared by wall and car-to-car hits. off = signed position of the contact circle along the car, (nx, nz) = direction the contact pushes this car, dv = velocity change (m/s).
  kick(off, nx, nz, dv) {
    if (this.wrecked) return; if (dv > 24) dv = 24;
    this.pitchV -= Math.sign(off) * dv * 0.045; this.rollV += (nx * -this.fz + nz * this.fx) * dv * 0.03; this.heaveV += dv * 0.025;
  }
  // collide with static world grid. returns impact magnitude (m/s) of the strongest hit this step
  collideStatic(grid, tmp) {
    const s = this.spec, hw = s.wid * 0.5, r = hw * 0.98; let worst = 0;
    for (const off of circles(s)) {
      const px = this.x + this.fx * off, pz = this.z + this.fz * off; const hit = grid.circleHit(px, pz, r, tmp, true); if (!hit) continue;
      this.x += hit.nx * hit.depth; this.z += hit.nz * hit.depth;
      const vn = this.vx * hit.nx + this.vz * hit.nz;
      if (vn < 0) { const e = 0.25; this.vx -= (1 + e) * vn * hit.nx; this.vz -= (1 + e) * vn * hit.nz; const impact = -vn; worst = Math.max(worst, impact);
        this.yawKick += off * (this.fx * hit.nz - this.fz * hit.nx) * impact * 0.35; this.kick(off, hit.nx, hit.nz, impact);
        if (impact > 4) this.damage(impact * (hit.box.type === 'pole' ? 1.2 : 2.2), 'crash'); }
    }
    return worst;
  }
  damage(n, source) {
    if (this.wrecked) return; this.hp -= n; this.lastImpact = performance.now();
    if ((source === undefined || source === 'gun') && n < 40) this.rollV += (Math.random() - 0.5) * 0.3; // bullets rock the car
    if (this.hp <= 0) this.wreck();
  }
  wreck() {
    if (this.wrecked) return; this.wrecked = true; this.hp = 0; this.siren = false; this.rollV = this.pitchV = this.heaveV = 0; this.model.body.material = wreckMat; this.model.roof.material = wreckMat; this.model.cabin.material = wreckMat;
    this.setLamp(LAMP.head, 0x222222); this.setLamp(LAMP.tail, 0x220000); this.setLamp(LAMP.indL, 0x161616); this.setLamp(LAMP.indR, 0x161616); this.setLamp(LAMP.rev, 0x161616);
    this.model.wheels.material = wreckMat; this.model.pool.visible = false; if (this.model.bar) { this.model.bar.userData.matA.color.setHex(0x111111); this.model.bar.userData.matB.color.setHex(0x111111); }
    for (const m of this.model.extra) { if (m.userData.decal) m.visible = false; else m.material = wreckMat; } this.onWreck?.(this);
  }
  repair() { this.hp = this.maxHp; if (!this.wrecked) this.updateLamps(this._t); }
  // Sets one lamp group (LAMP.*) of the merged lights mesh to colour hex x mul (mul > 1 feeds the bloom). The vertex colours are only rewritten when the state changes.
  setLamp(g, hex, mul = 1) {
    const L = this.model.lamps; if (L.hex[g] === hex && L.mul[g] === mul) return;
    L.hex[g] = hex; L.mul[g] = mul; _lc.setHex(hex);
    const r = _lc.r * mul, gr = _lc.g * mul, b = _lc.b * mul, attr = this.model.lights.geometry.attributes.color, a = attr.array;
    for (let i = L.start[g] * 3, e = L.start[g + 1] * 3; i < e; i += 3) { a[i] = r; a[i + 1] = gr; a[i + 2] = b; }
    attr.needsUpdate = true;
  }
  // Lamp states: head lamps, tail / brake lights, reverse lamps (reverse gear engaged), indicators at 1.6 Hz (signal, or hazards on both sides).
  // Hazards flash for the explicit flag and for AI cars that panic (shot at, hit) or are disturbed by a collision. Disturbed only counts for cars whose
  // AI counts it down again (Traffic.update; pursuit police do not), so a player car or a cop never flashes for ever after a bump.
  updateLamps(t) {
    const inp = this.input, ai = this.ai;
    this.setLamp(LAMP.head, 0xfff1c8);
    if (this.braking) this.setLamp(LAMP.tail, 0xff2a2a, 1.5); else this.setLamp(LAMP.tail, this.lightsOn ? 0xa01818 : 0x4a0d0d, 0.8);
    const haz = this.hazard || (ai && (ai.panic > 0 || (this.disturbed > 0 && ai.mode !== 'police' && ai.mode !== 'deployed'))), blink = Math.floor(t * 3.2) % 2 === 0, sg = this.signal;
    if (blink && (haz || sg < 0)) this.setLamp(LAMP.indL, 0xff9a1a, 2.4); else this.setLamp(LAMP.indL, 0x4a2a06);
    if (blink && (haz || sg > 0)) this.setLamp(LAMP.indR, 0xff9a1a, 2.4); else this.setLamp(LAMP.indR, 0x4a2a06);
    if (inp.throttle < -0.15 && this.forwardSpeed < 0.5) this.setLamp(LAMP.rev, 0xffffff, 2.2); else this.setLamp(LAMP.rev, 0x6a6a68, 0.55);
    this.model.pool.visible = !(this.parked && !this.driver); // a parked car has its headlights off
  }
  // Frees this car's own geometries, materials and instance buffers. Cached geometries and shared materials stay alive for the other cars.
  dispose() {
    const sharedGeo = new Set(geoCache.values());
    const sharedMat = new Set([...matCache.values(), ...decalMats.values(), glassMat, propMat, darkMat, chromeMat, plateMat, wreckMat, poolMat, lightMat, decorMat]);
    this.mesh.traverse(o => {
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry && !sharedGeo.has(o.geometry)) o.geometry.dispose();
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of ms) if (m && !sharedMat.has(m)) m.dispose();
    });
  }
  // Ground contact: samples world.groundY under every wheel. The body sits at the mean height and tilts to the wheel plane (smoothed), every wheel
  // follows its own ground height, and a curb step or drop kicks the suspension. Call once per frame for every car: a car that has not moved
  // since the last call only pays two comparisons. A consumer reads and clears curbHit (> 0 for one frame after a curb strike; it scales with speed).
  updateGround(world, dt = 1 / 60) {
    this.curbHit = 0; let dirty = false;
    // cars the physics loop did not step this frame (parked) still settle after a bump or a gunshot
    if (this._st) this._st = false; else if (this.suspMoving) { this.springs(dt, 0, 0); dirty = true; }
    const first = !this.groundOn;
    if (first || this.x !== this._gx || this.z !== this._gz || this.heading !== this._gh) {
      const wp = this.model.wheelPos, n = wp.length, gh = this.wheelH, hasG = !!world;
      const tele = first || Math.hypot(this.x - this._gx, this.z - this._gz) > 8; // spawn or teleport: take the new height without events
      const c = Math.cos(this.heading), s = Math.sin(this.heading), frontX = wp[0].x, rearX = wp[n - 1].x;
      let sum = 0, fS = 0, fN = 0, bS = 0, bN = 0, lS = 0, lN = 0, rS = 0, rN = 0, dL = 0, dR = 0, up = 0, upI = 0, dn = 0, dnI = 0;
      for (let i = 0; i < n; i++) {
        // wheel i in world space: local +x is the heading (c, -s), local +z is the right side (s, c)
        const w = wp[i], h = hasG ? (world.groundY(this.x + c * w.x + s * w.z, this.z - s * w.x + c * w.z) || 0) : 0, d = h - gh[i];
        gh[i] = h; sum += h;
        if (w.front) { fS += h; fN++; } else if (w.x === rearX) { bS += h; bN++; }
        if (w.z > 0) { rS += h; rN++; dR += d; } else { lS += h; lN++; dL += d; }
        if (d > up) { up = d; upI = i; } else if (-d > dn) { dn = -d; dnI = i; }
      }
      const mean = sum / n, dMean = mean - this._gm;
      if (!tele && !this.wrecked) {
        // edge-triggered: a ramp that keeps rising every frame is a slope, only its first frame (or a real step) counts as a hit
        const rise = Math.max(dMean, up * 0.5), drop = Math.max(-dMean, dn * 0.5), sp = this.speed;
        if (rise > 0.06 && this._pUp < 0.03 && sp > 2.5) {
          this.bump(Math.min(3.2, 0.9 + sp * 0.05), wp[upI].front ? 0.6 : -0.4); this.rollV -= (dR / rN - dL / lN) * 3; // the side that climbed rolls up
          this.vx *= 0.985; this.vz *= 0.985; this.curbHit = 2 + sp * 0.1;
        } else if (drop > 0.06 && this._pDn < 0.03) this.bump(-0.6 * Math.min(1, 0.3 + sp / 4), wp[dnI].front ? 0.6 : -0.4);
        this._pUp = rise; this._pDn = drop;
      } else { this._pUp = 0; this._pDn = 0; }
      this.y = mean; this._gm = mean; this._gx = this.x; this._gz = this.z; this._gh = this.heading; this.groundOn = true; dirty = true;
      // positive groundPitch = nose up (front axle higher), positive groundRoll = right side lower (same signs as pitch / roll, so syncMesh just adds them)
      this._tp = Math.atan2(fS / fN - bS / bN, frontX - rearX); this._tr = Math.atan2(lS / lN - rS / rN, 2 * Math.abs(wp[0].z));
      if (tele) { this.groundPitch = this._tp; this.groundRoll = this._tr; }
    } else { this._pUp = 0; this._pDn = 0; }
    const ep = this._tp - this.groundPitch, er = this._tr - this.groundRoll;
    if (ep !== 0 || er !== 0) {
      if (Math.abs(ep) + Math.abs(er) < 1e-4) { this.groundPitch = this._tp; this.groundRoll = this._tr; }
      else { const k = 1 - Math.exp(-18 * dt); this.groundPitch += ep * k; this.groundRoll += er * k; }
      dirty = true;
    }
    // game.js skips syncMesh for parked cars at rest, so a settling or re-grounded one refreshes itself
    if (this.parked && this.speed <= 0.05 && (dirty || this.suspMoving)) this.syncMesh(this._t);
  }
  syncMesh(t = 0) {
    this._t = t; const m = this.mesh, ch = this.model.chassis; m.position.set(this.x, this.y, this.z); m.rotation.y = this.heading;
    // suspension (heave, roll, pitch) plus the ground tilt under the wheels; positive rotation.z lifts the +x nose, so braking (pitch < 0) dips it
    ch.position.y = this.heave; ch.rotation.x = this.roll + this.groundRoll; ch.rotation.z = this.pitch + this.groundPitch;
    // wheels stay upright on the road (only the ground camber tilts them) and sit at their own ground height relative to the body origin
    const wm = this.model.wheels, wp = this.model.wheelPos, wr = this.model.wheelR, gh = this.wheelH, on = this.groundOn, gr = on ? this.groundRoll : 0;
    for (let i = 0; i < wp.length; i++) { _q.setFromEuler(_e.set(gr, wp[i].front ? this.steer : 0, -this.spin)); _m.compose(_v.set(wp[i].x, on ? wr + gh[i] - this.y : wr, wp[i].z), _q, _one); wm.setMatrixAt(i, _m); } wm.instanceMatrix.needsUpdate = true;
    if (!this.wrecked) this.updateLamps(t);
    if (this.model.bar && !this.wrecked) { const B = this.model.bar.userData, on = this.siren, ph = Math.floor(t * 6) % 2, a = on && ph === 0, b = on && ph === 1; B.matA.color.setHex(a ? B.cols[0][0] : B.cols[0][1]).multiplyScalar(a ? 2.6 : 1); B.matB.color.setHex(b ? B.cols[1][0] : B.cols[1][1]).multiplyScalar(b ? 2.6 : 1); }
  }
  // OBB-ish test: is world point (x,z) inside the car footprint (+margin)?
  contains(x, z, margin = 0) { const dx = x - this.x, dz = z - this.z; const lf = dx * this.fx + dz * this.fz, lr = dx * -this.fz + dz * this.fx; return Math.abs(lf) < this.spec.len / 2 + margin && Math.abs(lr) < this.spec.wid / 2 + margin; }
  seatPosition(side = 1) { const rx = -this.fz, rz = this.fx; return { x: this.x + rx * side * (this.spec.wid / 2 + 0.9) - this.fx * 0.3, z: this.z + rz * side * (this.spec.wid / 2 + 0.9) - this.fz * 0.3 }; }
}

// Collision circles along the car's axis (offsets from the centre, front to back). Cars up to ~5 widths long use the classic two; long vehicles (fire truck, bus) get
// more, spaced so that no car-sized gap is left between them.
function circles(spec) {
  if (spec._cir) return spec._cir; const hw = spec.wid * 0.5, d = Math.max(0.3, spec.len * 0.5 - hw); let a = [d, -d];
  if (2 * d > 4.2 * hw) { const n = Math.ceil(2 * d / (3.4 * hw)) + 1; a = []; for (let i = 0; i < n; i++) a.push(d - 2 * d * i / (n - 1)); }
  return spec._cir = a;
}
// pairwise vehicle collisions (one circle chain per car)
const _pts = [];
export function collideVehicles(list) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j]; if (a.parked && b.parked && a.speed < 0.05 && b.speed < 0.05) continue; const dx = b.x - a.x, dz = b.z - a.z; const rr = (a.spec.len + b.spec.len) * 0.5 + 0.5; if (dx * dx + dz * dz > rr * rr) continue;
    if (a.towed === b || b.towed === a) continue; // a tow truck and the car on its hoist do not collide with each other
    const ra = a.spec.wid * 0.5, rb = b.spec.wid * 0.5;
    for (const oa of circles(a.spec)) for (const ob of circles(b.spec)) {
      const ax = a.x + a.fx * oa, az = a.z + a.fz * oa, bx = b.x + b.fx * ob, bz = b.z + b.fz * ob; let nx = bx - ax, nz = bz - az; const d = Math.hypot(nx, nz), min = ra + rb; if (d >= min || d < 1e-5) continue;
      nx /= d; nz /= d; const pen = min - d; const ma = a.spec.mass * (a.parked ? 4 : 1), mb = b.spec.mass * (b.parked ? 4 : 1), tot = ma + mb;
      a.x -= nx * pen * (mb / tot); a.z -= nz * pen * (mb / tot); b.x += nx * pen * (ma / tot); b.z += nz * pen * (ma / tot);
      const rvx = b.vx - a.vx, rvz = b.vz - a.vz, vn = rvx * nx + rvz * nz; if (vn > 0) continue;
      const e = 0.3, jn = -(1 + e) * vn / (1 / ma + 1 / mb); a.vx -= jn * nx / ma; a.vz -= jn * nz / ma; b.vx += jn * nx / mb; b.vz += jn * nz / mb;
      const impact = -vn; a.yawKick += oa * (a.fx * nz - a.fz * nx) * -impact * 0.25; b.yawKick += ob * (b.fx * nz - b.fz * nx) * impact * 0.25;
      a.kick(oa, -nx, -nz, jn / ma); b.kick(ob, nx, nz, jn / mb); // each body rocks by the velocity change it received
      if (impact > 3) { a.damage(impact * 1.6 * (mb / ma), 'car'); b.damage(impact * 1.6 * (ma / mb), 'car'); a.hit?.(b, impact); b.hit?.(a, impact); }
      a.disturbed = b.disturbed = 1.5;
    }
  }
}
