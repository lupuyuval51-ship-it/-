import type { V } from './geom.ts';
import type { Rig } from './rig.ts';

export type Prop =
  | { k: 'circle'; c: V; r: number; fill?: boolean; layer?: 'back' | 'front' }
  | { k: 'line'; a: V; b: V; w?: number; dash?: boolean; layer?: 'back' | 'front' }
  | { k: 'rect'; c: V; w: number; h: number; ang?: number; fill?: boolean; layer?: 'back' | 'front' };

export interface Frame { rig: Rig; props: Prop[] }

// ---- prop builders (world units, H = 1) ----
/** Barbell seen end-on from the side: plate circle plus a short sleeve line through the hands. */
export const barbell = (c: V): Prop[] => [
  { k: 'circle', c, r: 0.105, layer: 'front' }, { k: 'circle', c, r: 0.03, fill: true, layer: 'front' },
];
export const dumbbell = (c: V, ang = 0): Prop[] => [{ k: 'rect', c, w: 0.075, h: 0.045, ang, fill: true, layer: 'front' }];
export const kettlebell = (c: V): Prop[] => [
  { k: 'circle', c: [c[0], c[1] - 0.05], r: 0.062, fill: true, layer: 'front' }, { k: 'circle', c: [c[0], c[1] + 0.008], r: 0.035, layer: 'front' },
];
export const bench = (x0: number, x1: number, top: number): Prop[] => [
  { k: 'rect', c: [(x0 + x1) / 2, top - 0.025], w: x1 - x0, h: 0.05, fill: true, layer: 'back' },
  { k: 'line', a: [x0 + 0.05, top - 0.05], b: [x0 + 0.05, 0], w: 0.02, layer: 'back' }, { k: 'line', a: [x1 - 0.05, top - 0.05], b: [x1 - 0.05, 0], w: 0.02, layer: 'back' },
];
export const box = (x0: number, x1: number, top: number): Prop[] => [{ k: 'rect', c: [(x0 + x1) / 2, top / 2], w: x1 - x0, h: top, fill: false, layer: 'back' }];
/** Pull-up / dip bar drawn as a short horizontal bar with a centre cap, stylised for the side view. */
export const hangBar = (c: V): Prop[] => [{ k: 'line', a: [c[0] - 0.16, c[1]], b: [c[0] + 0.16, c[1]], w: 0.03, layer: 'back' }, { k: 'circle', c, r: 0.022, fill: true, layer: 'back' }];
export const cable = (hand: V, anchor: V): Prop[] => [{ k: 'line', a: hand, b: anchor, w: 0.008, layer: 'back' }, { k: 'circle', c: anchor, r: 0.03, layer: 'back' }];
export const band = (hand: V, anchor: V): Prop[] => [{ k: 'line', a: hand, b: anchor, w: 0.012, dash: true, layer: 'back' }];
export const wheel = (c: V): Prop[] => [{ k: 'circle', c, r: 0.05, layer: 'front' }];
