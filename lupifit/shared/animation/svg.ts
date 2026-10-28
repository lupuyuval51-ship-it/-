/**
 * SVG string renderer for animation frames (used for offline contact sheets and tests;
 * the app renders the same geometry with React elements).
 */
import type { Muscle } from '../constants';
import { CANVAS, computeFrame, floorDash, viewBoxFor, type Frame, type PropShape, type Tone } from './engine';
import type { ExerciseAnimation } from './types';

export const PALETTE = {
  bodyNear: '#e2e8f0',
  bodyFar: '#8b97ad',
  torso: '#cbd5e1',
  highlight: '#22c55e',
  floor: '#334155',
  tones: {
    metal: '#94a3b8',
    plate: '#475569',
    pad: '#1e293b',
    wood: '#a16207',
    band: '#f97316',
    cable: '#64748b',
    rubber: '#334155',
    frame: '#475569',
    ball: '#b45309',
    floorMark: '#334155',
  } satisfies Record<Tone, string>,
};

function shapeSvg(p: PropShape): string {
  const c = PALETTE.tones[p.tone];
  switch (p.type) {
    case 'line':
      return `<line x1="${p.a[0]}" y1="${p.a[1]}" x2="${p.b[0]}" y2="${p.b[1]}" stroke="${c}" stroke-width="${p.w}" stroke-linecap="round"${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}/>`;
    case 'circle':
      return `<circle cx="${p.c[0]}" cy="${p.c[1]}" r="${p.r}" fill="${c}"/>`;
    case 'rect':
      return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.rx ?? 0}" fill="${c}"${p.rotate ? ` transform="rotate(${p.rotate.deg} ${p.rotate.cx} ${p.rotate.cy})"` : ''}/>`;
    case 'path':
      return `<path d="${p.d}" ${p.fill ? `fill="${c}"` : `fill="none" stroke="${c}" stroke-width="${p.w ?? 2}"`}/>`;
  }
}

export function frameSvg(frame: Frame, opts: { size?: number; background?: string; viewBox?: { x: number; y: number; w: number; h: number }; floorDash?: string } = {}): string {
  const vb = opts.viewBox ?? { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };
  const parts: string[] = [];
  parts.push(`<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="${opts.background ?? '#0f172a'}"/>`);
  parts.push(`<line x1="${vb.x}" y1="${CANVAS.floor + 1}" x2="${vb.x + vb.w}" y2="${CANVAS.floor + 1}" stroke="${PALETTE.floor}" stroke-width="2"${opts.floorDash ? ` stroke-dasharray="${opts.floorDash}"` : ''}/>`);
  parts.push(`<ellipse cx="${frame.shadow.cx}" cy="${frame.shadow.cy}" rx="${frame.shadow.rx}" ry="3" fill="#000" opacity="${frame.shadow.opacity}"/>`);
  for (const p of frame.props) if (p.layer === 'back') parts.push(shapeSvg(p));
  for (const s of frame.segments) {
    const color = s.side === 'far' ? PALETTE.bodyFar : s.part === 'torso' || s.part === 'neck' ? PALETTE.torso : PALETTE.bodyNear;
    parts.push(`<line x1="${s.a[0]}" y1="${s.a[1]}" x2="${s.b[0]}" y2="${s.b[1]}" stroke="${s.highlight && s.side !== 'far' ? PALETTE.highlight : color}" stroke-width="${s.w}" stroke-linecap="round"/>`);
  }
  for (const o of frame.overlays) parts.push(`<line x1="${o.a[0]}" y1="${o.a[1]}" x2="${o.b[0]}" y2="${o.b[1]}" stroke="${PALETTE.highlight}" stroke-width="${o.w}" stroke-linecap="round" opacity="0.9"/>`);
  for (const d of frame.overlayDots) parts.push(`<circle cx="${d.c[0]}" cy="${d.c[1]}" r="${d.r}" fill="${PALETTE.highlight}" opacity="0.9"/>`);
  parts.push(`<circle cx="${frame.head.c[0]}" cy="${frame.head.c[1]}" r="${frame.head.r}" fill="${PALETTE.bodyNear}"/>`);
  for (const p of frame.props) if (p.layer === 'front') parts.push(shapeSvg(p));
  const size = opts.size ?? 240;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${size}" height="${(size * CANVAS.h) / CANVAS.w}">${parts.join('')}</svg>`;
}

export function animationFrameSvg(anim: ExerciseAnimation, t: number, muscles: Muscle[] = [], size?: number): string {
  const frame = computeFrame(anim, t, muscles);
  return frameSvg(frame, { size, viewBox: viewBoxFor(anim, frame), floorDash: floorDash(anim)?.dash });
}
