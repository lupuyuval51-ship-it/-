import type { DecorKind } from "@/lib/game/world/types";

export type Geo = "box" | "cyl" | "cone" | "sphere" | "oct" | "torus";
export type ColorKey = "trunk" | "leaf" | "rock" | "crystal" | "metal" | "wall" | "accent" | "accent2" | "sand" | "cloud" | "coral" | "lamp" | "glass" | "stone" | "frond" | "flame" | "cloth" | "kelp" | "petal" | "bronze";

export interface Part {
  geo: Geo;
  /** Local scale of the unit geometry. */
  size: [number, number, number];
  /** Offset from the item's base position. */
  pos: [number, number, number];
  color: ColorKey;
  emissive?: boolean;
  /** Euler rotation (radians, applied as yaw · pitch · roll) of this part inside the item. */
  rot?: [number, number, number];
}

/** A palm: a leaning trunk crowned by drooping, flattened fronds. */
function palmParts(): Part[] {
  const parts: Part[] = [
    { geo: "cyl", size: [0.26, 0.6, 0.26], pos: [0, 0.3, 0], color: "trunk" },
    { geo: "cyl", size: [0.19, 3.4, 0.19], pos: [0.1, 2.1, 0], color: "trunk", rot: [0, 0, -0.06] },
    { geo: "sphere", size: [0.3, 0.26, 0.3], pos: [0.22, 3.85, 0], color: "trunk" },
  ];
  const n = 8, tilt = 1.18, len = 2.1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dx = -Math.sin(tilt) * Math.cos(a), dy = Math.cos(tilt), dz = Math.sin(tilt) * Math.sin(a);
    parts.push({ geo: "cone", size: [0.4, len, 0.08], pos: [0.22 + dx * (len / 2), 3.85 + dy * (len / 2) - 0.1, dz * (len / 2)], color: "frond", rot: [0, a, tilt] });
  }
  return parts;
}

/** A clump of tall blades leaning in different directions (reeds along water, kelp under it). */
function bladeParts(n: number, h: number, w: number, color: ColorKey, lean: number): Part[] {
  const out: Part[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.7;
    const hh = h * (0.7 + ((i * 37) % 10) / 33);
    const dx = -Math.sin(lean) * Math.cos(a), dy = Math.cos(lean), dz = Math.sin(lean) * Math.sin(a);
    out.push({ geo: "cyl", size: [w, hh, w], pos: [Math.cos(a) * 0.18 + dx * (hh / 2), dy * (hh / 2), Math.sin(a) * 0.18 + dz * (hh / 2)], color, rot: [0, a, lean] });
  }
  return out;
}

/** Scenery composed from primitives only: no external assets are ever loaded. */
export const DECOR_PARTS: Record<DecorKind, Part[]> = {
  tree: [
    { geo: "cyl", size: [0.3, 1.8, 0.3], pos: [0, 0.9, 0], color: "trunk" },
    { geo: "sphere", size: [1.7, 1.5, 1.7], pos: [0, 2.5, 0], color: "leaf" },
    { geo: "sphere", size: [1.2, 1.1, 1.2], pos: [0.5, 3.2, 0.2], color: "leaf" },
  ],
  pine: [
    { geo: "cyl", size: [0.25, 1.2, 0.25], pos: [0, 0.6, 0], color: "trunk" },
    { geo: "cone", size: [1.5, 2.2, 1.5], pos: [0, 2.0, 0], color: "leaf" },
    { geo: "cone", size: [1.1, 1.8, 1.1], pos: [0, 3.2, 0], color: "leaf" },
  ],
  rock: [
    { geo: "oct", size: [1.3, 1.0, 1.2], pos: [0, 0.5, 0], color: "rock" },
    { geo: "oct", size: [0.7, 0.55, 0.7], pos: [0.9, 0.25, 0.3], color: "rock" },
  ],
  crystal: [
    { geo: "oct", size: [0.7, 2.2, 0.7], pos: [0, 1.1, 0], color: "crystal", emissive: true },
    { geo: "oct", size: [0.45, 1.4, 0.45], pos: [0.6, 0.7, 0.2], color: "crystal", emissive: true },
  ],
  pillar: [
    { geo: "cyl", size: [0.55, 3.2, 0.55], pos: [0, 1.6, 0], color: "stone" },
    { geo: "box", size: [1.3, 0.3, 1.3], pos: [0, 3.3, 0], color: "stone" },
    { geo: "box", size: [1.3, 0.25, 1.3], pos: [0, 0.12, 0], color: "stone" },
  ],
  tower: [
    { geo: "box", size: [2.2, 9, 2.2], pos: [0, 4.5, 0], color: "metal" },
    { geo: "box", size: [1.2, 3, 1.2], pos: [0, 10.5, 0], color: "metal" },
    { geo: "box", size: [2.3, 0.3, 2.3], pos: [0, 7, 0], color: "accent", emissive: true },
  ],
  crate: [
    { geo: "box", size: [1.2, 1.2, 1.2], pos: [0, 0.6, 0], color: "metal" },
    { geo: "box", size: [1.25, 0.12, 1.25], pos: [0, 0.6, 0], color: "accent", emissive: true },
  ],
  pipe: [
    { geo: "cyl", size: [0.3, 5, 0.3], pos: [0, 2.5, 0], color: "metal" },
    { geo: "torus", size: [0.55, 0.55, 0.3], pos: [0, 3.5, 0], color: "accent" },
  ],
  coral: [
    { geo: "cyl", size: [0.2, 1.6, 0.2], pos: [0, 0.8, 0], color: "coral" },
    { geo: "sphere", size: [0.6, 0.5, 0.6], pos: [0, 1.7, 0], color: "coral" },
    { geo: "cyl", size: [0.15, 1.0, 0.15], pos: [0.5, 0.5, 0.1], color: "coral" },
  ],
  mushroom: [
    { geo: "cyl", size: [0.18, 0.8, 0.18], pos: [0, 0.4, 0], color: "cloud" },
    { geo: "sphere", size: [0.8, 0.45, 0.8], pos: [0, 0.9, 0], color: "accent2" },
  ],
  lamp: [
    { geo: "cyl", size: [0.08, 3.2, 0.08], pos: [0, 1.6, 0], color: "metal" },
    { geo: "sphere", size: [0.35, 0.35, 0.35], pos: [0, 3.3, 0], color: "lamp", emissive: true },
  ],
  arch: [
    { geo: "box", size: [0.7, 4, 0.7], pos: [-1.6, 2, 0], color: "stone" },
    { geo: "box", size: [0.7, 4, 0.7], pos: [1.6, 2, 0], color: "stone" },
    { geo: "box", size: [4, 0.7, 0.8], pos: [0, 4.2, 0], color: "stone" },
  ],
  antenna: [
    { geo: "cyl", size: [0.12, 8, 0.12], pos: [0, 4, 0], color: "metal" },
    { geo: "sphere", size: [0.3, 0.3, 0.3], pos: [0, 8.2, 0], color: "accent2", emissive: true },
  ],
  cactus: [
    { geo: "cyl", size: [0.35, 2.4, 0.35], pos: [0, 1.2, 0], color: "leaf" },
    { geo: "cyl", size: [0.2, 1.0, 0.2], pos: [0.55, 1.5, 0], color: "leaf" },
  ],
  bush: [
    { geo: "sphere", size: [1.1, 0.8, 1.1], pos: [0, 0.4, 0], color: "leaf" },
    { geo: "sphere", size: [0.7, 0.6, 0.7], pos: [0.7, 0.3, 0.3], color: "leaf" },
  ],
  cloud: [
    { geo: "sphere", size: [3, 1.2, 2], pos: [0, 0, 0], color: "cloud" },
    { geo: "sphere", size: [2, 1, 1.5], pos: [2, 0.2, 0.4], color: "cloud" },
    { geo: "sphere", size: [2.2, 0.9, 1.5], pos: [-2, 0, -0.2], color: "cloud" },
  ],
  building: [
    { geo: "box", size: [3, 6, 3], pos: [0, 3, 0], color: "metal" },
    { geo: "box", size: [3.05, 0.25, 3.05], pos: [0, 4.4, 0], color: "accent2", emissive: true },
    { geo: "box", size: [3.05, 0.25, 3.05], pos: [0, 1.8, 0], color: "accent", emissive: true },
  ],
  hologram: [
    { geo: "torus", size: [1.2, 1.2, 0.5], pos: [0, 0.9, 0], color: "accent", emissive: true },
    { geo: "oct", size: [0.7, 0.9, 0.7], pos: [0, 1.0, 0], color: "accent2", emissive: true },
  ],
  palm: palmParts(),
  obelisk: [
    { geo: "box", size: [1.0, 0.35, 1.0], pos: [0, 0.17, 0], color: "stone" },
    { geo: "box", size: [0.72, 4.0, 0.72], pos: [0, 2.3, 0], color: "stone" },
    { geo: "cone", size: [0.62, 0.8, 0.62], pos: [0, 4.7, 0], color: "stone" },
    { geo: "box", size: [0.76, 0.12, 0.76], pos: [0, 3.5, 0], color: "accent2", emissive: true },
    { geo: "box", size: [0.76, 0.12, 0.76], pos: [0, 2.2, 0], color: "accent", emissive: true },
  ],
  reed: bladeParts(7, 1.9, 0.045, "frond", 0.16),
  flower: [
    { geo: "cyl", size: [0.03, 0.55, 0.03], pos: [0, 0.27, 0], color: "leaf" },
    { geo: "sphere", size: [0.17, 0.09, 0.17], pos: [0, 0.58, 0], color: "petal" },
    { geo: "cyl", size: [0.03, 0.4, 0.03], pos: [0.3, 0.2, 0.15], color: "leaf" },
    { geo: "sphere", size: [0.14, 0.08, 0.14], pos: [0.3, 0.43, 0.15], color: "petal" },
    { geo: "cyl", size: [0.03, 0.45, 0.03], pos: [-0.25, 0.22, 0.2], color: "leaf" },
    { geo: "sphere", size: [0.15, 0.08, 0.15], pos: [-0.25, 0.48, 0.2], color: "lamp" },
  ],
  torch: [
    { geo: "cyl", size: [0.07, 1.7, 0.07], pos: [0, 0.85, 0], color: "bronze" },
    { geo: "cyl", size: [0.16, 0.22, 0.16], pos: [0, 1.75, 0], color: "bronze" },
    { geo: "cone", size: [0.15, 0.5, 0.15], pos: [0, 2.1, 0], color: "flame", emissive: true },
  ],
  banner: [
    { geo: "cyl", size: [0.05, 3.6, 0.05], pos: [0, 1.8, 0], color: "bronze" },
    { geo: "box", size: [1.0, 1.7, 0.05], pos: [0.52, 2.55, 0], color: "cloth" },
    { geo: "box", size: [1.04, 0.1, 0.07], pos: [0.52, 3.35, 0], color: "accent2", emissive: true },
    { geo: "sphere", size: [0.11, 0.11, 0.11], pos: [0, 3.7, 0], color: "accent2", emissive: true },
  ],
  kelp: bladeParts(5, 3.4, 0.07, "kelp", 0.12),
  flask: [
    { geo: "box", size: [1.1, 0.12, 1.1], pos: [0, 0.06, 0], color: "metal" },
    { geo: "sphere", size: [0.55, 0.55, 0.55], pos: [0, 0.78, 0], color: "glass" },
    { geo: "cyl", size: [0.17, 0.55, 0.17], pos: [0, 1.5, 0], color: "glass" },
    { geo: "sphere", size: [0.44, 0.3, 0.44], pos: [0, 0.62, 0], color: "accent", emissive: true },
  ],
  dish: [
    { geo: "cyl", size: [0.12, 1.5, 0.12], pos: [0, 0.75, 0], color: "metal" },
    { geo: "sphere", size: [1.3, 0.3, 1.3], pos: [0, 1.9, 0], color: "stone", rot: [0.8, 0, 0] },
    { geo: "cyl", size: [0.04, 0.7, 0.04], pos: [0, 2.35, -0.45], color: "metal", rot: [0.8, 0, 0] },
    { geo: "sphere", size: [0.09, 0.09, 0.09], pos: [0, 2.65, -0.7], color: "accent2", emissive: true },
  ],
};

const PALETTES: Record<ColorKey, string[]> = {
  trunk: ["#6b4a2b", "#5c3f25", "#7a5632", "#654529"],
  leaf: ["#2f7d3a", "#3f9b45", "#5aae4a", "#2a6b46"],
  rock: ["#8b8f98", "#767b85", "#9a9387", "#6f747d"],
  stone: ["#bdb7a8", "#aaa592", "#c9c2ad", "#9f9a89"],
  crystal: ["#7df9ff", "#b388ff", "#69f0ae", "#ff80ab"],
  metal: ["#4a5578", "#3b4663", "#566086", "#2f3957"],
  wall: ["#6b7280", "#5b6270", "#7a8191", "#4f5666"],
  accent: ["#22e6ff", "#22e6ff", "#22e6ff", "#22e6ff"],
  accent2: ["#ff4fd8", "#ff4fd8", "#ff4fd8", "#ff4fd8"],
  sand: ["#d8c08a", "#cdb27a", "#e3cd9a", "#c2a56c"],
  cloud: ["#ffffff", "#f4f8ff", "#e9f1ff", "#ffffff"],
  coral: ["#ff7b9c", "#ff9e7b", "#c77bff", "#ffb347"],
  lamp: ["#fff3b0", "#fff3b0", "#fff3b0", "#fff3b0"],
  frond: ["#3f9b45", "#5aae4a", "#2f8a3f", "#4aa04a"],
  flame: ["#ffb347", "#ff9a3d", "#ffd166", "#ff8a3d"],
  cloth: ["#b83b3b", "#c0392b", "#7c3aa6", "#2e6fb3"],
  kelp: ["#2f9a6a", "#3dbb83", "#25855a", "#49c58f"],
  petal: ["#ff7b9c", "#ffd166", "#c77bff", "#ffffff"],
  bronze: ["#a5753a", "#946a35", "#b8863f", "#8a5f30"],
  glass: ["#9fd8ff", "#9fd8ff", "#9fd8ff", "#9fd8ff"],
};

export function decorColor(key: ColorKey, tint: number, accent: string, accent2: string): string {
  if (key === "accent") return accent;
  if (key === "accent2") return accent2;
  return PALETTES[key][tint % 4]!;
}
