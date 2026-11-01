import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import type { Muscle } from '../../shared/src/enums.ts';
import type { V } from './geom.ts';
import type { Part, Seg } from './rig.ts';
import type { Frame, Prop } from './scene.ts';

export const SIZE = 720;
const COL = { bg: '#0B0B0D', floorBand: '#131316', dot: '#3A3A40', floor: '#4A4A52', body: '#F5F5F5', far: '#7C7C84', hi: '#FF8533', prop: '#A3A3A8', ghost: '#F5F5F5' };
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
    if (p.k === 'circle') out.push([p.c[0] - p.r, p.c[1] - p.r], [p.c[0] + p.r, p.c[1] + p.r]);
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

function drawProp(ctx: SKRSContext2D, cam: Camera, p: Prop): void {
  ctx.strokeStyle = COL.prop; ctx.fillStyle = COL.prop; ctx.lineCap = 'round'; ctx.setLineDash([]);
  if (p.k === 'circle') {
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

export type Hud = { kind: 'reps'; rep: number; reps: number } | { kind: 'time'; t: number };
function drawHud(ctx: SKRSContext2D, hud: Hud | undefined): void {
  if (!hud) return;
  if (hud.kind === 'reps') {
    const gap = 26; const x0 = SIZE / 2 - ((hud.reps - 1) * gap) / 2;
    for (let i = 0; i < hud.reps; i++) { ctx.fillStyle = i === hud.rep ? COL.hi : COL.dot; ctx.beginPath(); ctx.arc(x0 + i * gap, 28, i === hud.rep ? 8 : 6, 0, Math.PI * 2); ctx.fill(); }
  } else {
    ctx.fillStyle = COL.dot; ctx.fillRect(SIZE * 0.3, 24, SIZE * 0.4, 8);
    ctx.fillStyle = COL.hi; ctx.fillRect(SIZE * 0.3, 24, SIZE * 0.4 * hud.t, 8);
  }
}

export function drawFrame(ctx: SKRSContext2D, cam: Camera, f: Frame, primary: readonly Muscle[], ghosts: readonly Frame[], hud?: Hud): void {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, SIZE, SIZE);
  const [, fy] = px(cam, [0, 0]);
  ctx.fillStyle = COL.floorBand; ctx.fillRect(0, fy, SIZE, SIZE - fy); // the floor reads as a surface, not a line
  ctx.strokeStyle = COL.floor; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(SIZE, fy); ctx.stroke();
  drawHud(ctx, hud);
  // contact shadow under the body (flat, no gradient)
  const hipPt = f.rig.pts['hip']; if (hipPt) { const [sx] = px(cam, hipPt); ctx.fillStyle = COL.bg; ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.ellipse(sx, fy + 7, 0.22 * cam.scale, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }

  // faint start/end poses so the range of motion is readable at a glance
  ctx.globalAlpha = 0.11;
  for (const g of ghosts) { for (const s of g.rig.segs) drawSeg(ctx, cam, s, COL.ghost, false); const [hx, hy] = px(cam, g.rig.head.c); ctx.fillStyle = COL.ghost; ctx.beginPath(); ctx.arc(hx, hy, g.rig.head.r * cam.scale, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;

  for (const p of f.props) if (p.layer === 'back') drawProp(ctx, cam, p);
  const hiParts = new Set<Part>(primary.flatMap((m) => MUSCLE_PARTS[m]));
  const layers: Seg['layer'][] = ['far', 'mid', 'near'];
  for (const layer of layers) {
    for (const s of f.rig.segs) {
      if (s.layer !== layer) continue;
      const hi = hiParts.has(s.part) && s.side !== 'F';
      drawSeg(ctx, cam, s, hi ? COL.hi : s.layer === 'far' ? COL.far : COL.body);
    }
  }
  if (primary.some((m) => DELTS.includes(m))) {
    const [sx, sy] = px(cam, f.rig.pts['shoulder'] as V); ctx.fillStyle = COL.hi; ctx.beginPath(); ctx.arc(sx, sy, 0.05 * cam.scale, 0, Math.PI * 2); ctx.fill();
  }
  for (const [key, col] of [['wristF', COL.far], ['wristN', COL.body]] as const) {
    const w = f.rig.pts[key]; if (!w) continue; const [wx, wy] = px(cam, w);
    ctx.fillStyle = COL.bg; ctx.beginPath(); ctx.arc(wx, wy, 0.034 * cam.scale + 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hiParts.has('foreArm') && key === 'wristN' ? COL.hi : col; ctx.beginPath(); ctx.arc(wx, wy, 0.034 * cam.scale, 0, Math.PI * 2); ctx.fill();
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
