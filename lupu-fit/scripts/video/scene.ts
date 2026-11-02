import type { V } from './geom.ts';
import type { Rig } from './rig.ts';

export type Prop =
  | { k: 'circle'; c: V; r: number; fill?: boolean; layer?: 'back' | 'front'; far?: boolean; dim?: boolean }
  | { k: 'arc'; c: V; r: number; a0: number; a1: number; w?: number; layer?: 'back' | 'front'; far?: boolean; dim?: boolean }
  | { k: 'line'; a: V; b: V; w?: number; dash?: boolean; layer?: 'back' | 'front'; far?: boolean; dim?: boolean }
  | { k: 'rect'; c: V; w: number; h: number; ang?: number; fill?: boolean; layer?: 'back' | 'front' };

export interface Frame { rig: Rig; props: Prop[] }

// ---- prop builders (world units, H = 1) ----
/** Barbell seen end-on from the side: plate circle plus a short sleeve line through the hands. */
export const barbell = (c: V): Prop[] => [
  { k: 'line', a: [c[0] - 0.17, c[1] - 0.045], b: [c[0] + 0.17, c[1] + 0.045], w: 0.012, dim: true, layer: 'front' }, // bar sleeve, three-quarter view
  { k: 'circle', c: [c[0] + 0.022, c[1] + 0.006], r: 0.098, dim: true, layer: 'front' },                              // far plate
  { k: 'circle', c, r: 0.105, layer: 'front' }, { k: 'circle', c, r: 0.032, fill: true, layer: 'front' },            // near plate + hub
];
/** Dumbbell: handle with a head at each end (drawn at a slight angle so it reads as 3D). */
export const dumbbell = (c: V, ang = 0): Prop[] => {
  const a = (ang * Math.PI) / 180; const d: V = [Math.cos(a) * 0.05, Math.sin(a) * 0.05];
  return [
    { k: 'line', a: [c[0] - d[0], c[1] - d[1]], b: [c[0] + d[0], c[1] + d[1]], w: 0.014, layer: 'front' },
    { k: 'rect', c: [c[0] - d[0], c[1] - d[1]], w: 0.032, h: 0.07, ang, fill: true, layer: 'front' },
    { k: 'rect', c: [c[0] + d[0], c[1] + d[1]], w: 0.032, h: 0.07, ang, fill: true, layer: 'front' },
  ];
};
export const medBall = (c: V): Prop[] => [{ k: 'circle', c, r: 0.11, fill: true, layer: 'front' }, { k: 'arc', c, r: 0.11, a0: 0.4, a1: 2.6, w: 0.01, dim: false, layer: 'front' }];
export const kettlebell = (c: V): Prop[] => [
  { k: 'circle', c: [c[0], c[1] - 0.05], r: 0.062, fill: true, layer: 'front' }, { k: 'circle', c: [c[0], c[1] + 0.008], r: 0.035, layer: 'front' },
];
export const bench = (x0: number, x1: number, top: number): Prop[] => [
  { k: 'rect', c: [(x0 + x1) / 2, top - 0.025], w: x1 - x0, h: 0.05, fill: true, layer: 'back' },
  { k: 'line', a: [x0 + 0.05, top - 0.05], b: [x0 + 0.05, 0], w: 0.02, layer: 'back' }, { k: 'line', a: [x1 - 0.05, top - 0.05], b: [x1 - 0.05, 0], w: 0.02, layer: 'back' },
];
export const box = (x0: number, x1: number, top: number): Prop[] => [{ k: 'rect', c: [(x0 + x1) / 2, top / 2], w: x1 - x0, h: top, fill: false, layer: 'back' }];
/** Pull-up / dip bar drawn as a short horizontal bar with a centre cap, stylised for the side view. */
export const hangBar = (c: V): Prop[] => [
  { k: 'line', a: [c[0] + 0.24, 0], b: [c[0] + 0.24, c[1]], w: 0.016, dim: true, layer: 'back', far: true }, // upright post
  { k: 'line', a: [c[0] - 0.16, c[1]], b: [c[0] + 0.24, c[1]], w: 0.014, dim: true, layer: 'back', far: true },
  { k: 'line', a: [c[0] - 0.16, c[1]], b: [c[0] + 0.16, c[1]], w: 0.03, layer: 'back' }, { k: 'circle', c, r: 0.022, fill: true, layer: 'back' },
];
/** Cable with a handle at the hand and a pulley at the anchor. */
export const cable = (hand: V, anchor: V): Prop[] => [
  { k: 'line', a: hand, b: anchor, w: 0.008, layer: 'back', far: true }, { k: 'circle', c: anchor, r: 0.03, layer: 'back', far: true },
  { k: 'circle', c: anchor, r: 0.01, fill: true, layer: 'back', far: true },
  { k: 'line', a: [hand[0] - 0.035, hand[1] - 0.01], b: [hand[0] + 0.035, hand[1] + 0.01], w: 0.016, layer: 'front', far: true },
];
export const band = (hand: V, anchor: V): Prop[] => [{ k: 'line', a: hand, b: anchor, w: 0.012, dash: true, layer: 'back', far: true }];
export const wheel = (c: V): Prop[] => [{ k: 'circle', c, r: 0.05, layer: 'front' }];
