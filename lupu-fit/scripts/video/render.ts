import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import type { Muscle } from '../../shared/src/enums.ts';
import type { V } from './geom.ts';
import type { Part, Seg } from './rig.ts';
import type { Frame, Prop } from './scene.ts';

export const SIZE = 720;
const COL = { bg: '#0B0B0D', floorBand: '#131316', dot: '#3A3A40', floor: '#4A4A52', body: '#F5F5F5', far: '#7C7C84', hi: '#FF6A00', propDim: '#5C5C63', prop: '#A3A3A8', ghost: '#F5F5F5' };
const WIDTH: Record<Part, number> = { torso_lower: 0.078, torso_upper: 0.082, neck: 0.034, upperArm: 0.044, foreArm: 0.038, thigh: 0.066, shank: 0.05, foot: 0.038 };

const MUSCLE_PARTS: Record<Muscle, Part[]> = {
  chest: ['torso_upper'], upper_back: ['torso_upper'], lats: ['torso_upper'], traps: ['torso_upper', 'neck'], lower_back: ['torso_lower'],
  front_delts: [], side_delts: [], rear_delts: [], biceps: ['upperArm'], triceps: ['upperArm'], forearms: ['foreArm'],
  abs: ['torso_lower'], obliques: ['torso_lower'], glutes: ['thigh'], quads: ['thigh'], hamstrings: ['thigh'], calves: ['shank'], adductors: ['thigh'],
};
const DELTS: Muscle[] = ['front_delts', 'side_delts', 'rear_delts'];

export interface Camera { scale: number; ox: number; oy: number }

function pointsOf(f: Frame): V[] {
  const out: V[] = [];
  for (const s of f.rig.segs) out.push(s.a, s.b);
  out.push([f.rig.head.c[0] - f.rig.head.r, f.rig.head.c[1] - f.rig.head.r], [f.rig.head.c[0] + f.rig.head.r, f.rig.head.c[1] + f.rig.head.r]);
  for (const p of f.props) {
    if ('far' in p && p.far) continue;
    if (p.k === 'circle' || p.k === 'arc') out.push([p.c[0] - p.r, p.c[1] - p.r], [p.c[0] + p.r, p.c[1] + p.r]);
    else if (p.k === 'line') out.push(p.a, p.b);
    else { const m = Math.max(p.w, p.h) / 2; out.push([p.c[0] - m, p.c[1] - m], [p.c[0] + m, p.c[1] + m]); }
  }
  return out;
}

/** One fixed camera for the whole clip so the figure never jumps. */
export function fitCamera(frames: readonly Frame[]): Camera {
  let x0 = Infinity; let x1 = -Infinity; let y1 = -Infinity; let y0 = Infinity;
  for (const f of frames) for (const p of pointsOf(f)) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const m = 52;
  const w = Math.max(x1 - x0, 0.2); const h = Math.max(y1 - y0, 0.2);
  const scale = Math.min((SIZE - 2 * m) / w, (SIZE - 2 * m) / h, 660);
  const ox = SIZE / 2 - ((x0 + x1) / 2) * scale;
  const oy = SIZE - m - ((SIZE - 2 * m) - h * scale) / 2 + y0 * scale; // vertically centred; screen y = oy - worldY * scale
  return { scale, ox, oy };
}

const px = (cam: Camera, p: V): [number, number] => [cam.ox + p[0] * cam.scale, cam.oy - p[1] * cam.scale];

function drawSeg(ctx: SKRSContext2D, cam: Camera, s: Seg, color: string, outline = true): void {
  const [ax, ay] = px(cam, s.a); const [bx, by] = px(cam, s.b);
  ctx.lineCap = 'round';
  if (outline) { ctx.strokeStyle = COL.bg; ctx.lineWidth = WIDTH[s.part] * cam.scale + 7; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
  ctx.strokeStyle = color; ctx.lineWidth = WIDTH[s.part] * cam.scale;
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
}

/** Faint muscle-belly highlight: an inset orange capsule on the working segment (the limb outline stays off-white). */
function drawMuscle(ctx: SKRSContext2D, cam: Camera, s: Seg): void {
  const [ax, ay] = px(cam, s.a); const [bx, by] = px(cam, s.b);
  const t0 = 0.16; const t1 = 0.84;
  ctx.save(); ctx.globalAlpha = 0.82; ctx.lineCap = 'round'; ctx.strokeStyle = COL.hi; ctx.lineWidth = WIDTH[s.part] * cam.scale * 0.62;
  ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0); ctx.lineTo(ax + (bx - ax) * t1, ay + (by - ay) * t1); ctx.stroke(); ctx.restore();
}

function drawProp(ctx: SKRSContext2D, cam: Camera, p: Prop): void {
  const col = 'dim' in p && p.dim ? COL.propDim : COL.prop;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.setLineDash([]);
  if (p.k === 'arc') {
    const [x, y] = px(cam, p.c); ctx.lineWidth = Math.max(3, (p.w ?? 0.012) * cam.scale);
    ctx.beginPath(); ctx.arc(x, y, p.r * cam.scale, -p.a1, -p.a0); ctx.stroke();
  } else if (p.k === 'circle') {
    const [x, y] = px(cam, p.c); ctx.lineWidth = Math.max(3, 0.014 * cam.scale);
    ctx.beginPath(); ctx.arc(x, y, p.r * cam.scale, 0, Math.PI * 2); if (p.fill) ctx.fill(); else ctx.stroke();
  } else if (p.k === 'line') {
    const [ax, ay] = px(cam, p.a); const [bx, by] = px(cam, p.b);
    ctx.lineWidth = Math.max(3, (p.w ?? 0.012) * cam.scale); if (p.dash) ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
  } else {
    const [x, y] = px(cam, p.c); ctx.save(); ctx.translate(x, y); ctx.rotate(-((p.ang ?? 0) * Math.PI) / 180);
    ctx.lineWidth = Math.max(3, 0.014 * cam.scale);
    if (p.fill) ctx.fillRect(-(p.w * cam.scale) / 2, -(p.h * cam.scale) / 2, p.w * cam.scale, p.h * cam.scale);
    else ctx.strokeRect(-(p.w * cam.scale) / 2, -(p.h * cam.scale) / 2, p.w * cam.scale, p.h * cam.scale);
    ctx.restore();
  }
}

/** Path of the moving implement/hand over the clip, drawn as a faint orange dotted line (no text, no counters: text in videos cannot be translated). */
export function drawFrame(ctx: SKRSContext2D, cam: Camera, f: Frame, primary: readonly Muscle[], ghosts: readonly Frame[], trail: readonly V[] = []): void {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, SIZE, SIZE);
  const [, fy] = px(cam, [0, 0]);
  ctx.fillStyle = COL.floorBand; ctx.fillRect(0, fy, SIZE, SIZE - fy); // the floor reads as a surface, not a line
  ctx.strokeStyle = COL.floor; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(SIZE, fy); ctx.stroke();
  // contact shadow under the body (flat, no gradient)
  const hipPt = f.rig.pts['hip']; if (hipPt) { const [sx] = px(cam, hipPt); ctx.fillStyle = COL.bg; ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.ellipse(sx, fy + 7, 0.22 * cam.scale, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

  // faint start/end poses so the range of motion is readable at a glance
  ctx.globalAlpha = 0.11;
  for (const g of ghosts) { for (const s of g.rig.segs) drawSeg(ctx, cam, s, COL.ghost, false); const [hx, hy] = px(cam, g.rig.head.c); ctx.fillStyle = COL.ghost; ctx.beginPath(); ctx.arc(hx, hy, g.rig.head.r * cam.scale, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;

  for (const p of f.props) if (p.layer === 'back') drawProp(ctx, cam, p);
  if (trail.length > 1) {
    ctx.save(); ctx.strokeStyle = COL.hi; ctx.globalAlpha = 0.5; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.setLineDash([2, 11]);
    ctx.beginPath(); trail.forEach((p, i) => { const [x, y] = px(cam, p); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke(); ctx.restore();
  }
  const hiParts = new Set<Part>(primary.flatMap((m) => MUSCLE_PARTS[m]));
  const layers: Seg['layer'][] = ['far', 'mid', 'near'];
  for (const layer of layers) {
    for (const s of f.rig.segs) {
      if (s.layer !== layer) continue;
      const hi = hiParts.has(s.part) && s.side !== 'F';
      drawSeg(ctx, cam, s, s.layer === 'far' ? COL.far : COL.body);
      if (hi) drawMuscle(ctx, cam, s);
    }
  }
  if (primary.some((m) => DELTS.includes(m))) {
    const [sx, sy] = px(cam, f.rig.pts['shoulder'] as V); ctx.fillStyle = COL.hi; ctx.beginPath(); ctx.arc(sx, sy, 0.05 * cam.scale, 0, Math.PI * 2); ctx.fill();
  }
  for (const [key, col] of [['wristF', COL.far], ['wristN', COL.body]] as const) {
    const w = f.rig.pts[key]; if (!w) continue; const [wx, wy] = px(cam, w);
    ctx.fillStyle = COL.bg; ctx.beginPath(); ctx.arc(wx, wy, 0.034 * cam.scale + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(wx, wy, 0.034 * cam.scale, 0, Math.PI * 2); ctx.fill();
  }
  const [hx, hy] = px(cam, f.rig.head.c);
  ctx.fillStyle = COL.bg; ctx.beginPath(); ctx.arc(hx, hy, f.rig.head.r * cam.scale + 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COL.body; ctx.beginPath(); ctx.arc(hx, hy, f.rig.head.r * cam.scale, 0, Math.PI * 2); ctx.fill();
  for (const p of f.props) if (p.layer !== 'back') drawProp(ctx, cam, p);
}

export function makeCanvas() {
  const canvas = createCanvas(SIZE, SIZE);
  return { canvas, ctx: canvas.getContext('2d') };
}
