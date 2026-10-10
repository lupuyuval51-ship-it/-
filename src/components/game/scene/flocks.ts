/**
 * Pure data for the ambient life (no three.js, no React): which critters each environment has, their parts and size.
 * Kept apart from the renderer so tests can count draw calls and per-frame matrices for every tier.
 */
import type { Environment } from "@/lib/game/spec/constants";

export type Kind = "car" | "bird" | "fish" | "drone" | "balloon";

export interface Flock {
  kind: Kind;
  count: number;
  /** Orbit radius, flight height and angular speed ranges. */
  r: [number, number];
  h: [number, number];
  speed: [number, number];
  colors: string[];
  /** `area`: every critter circles its own spot inside the playable area (fish); otherwise they orbit the area's centre. */
  anchor?: "area";
}

export const FLOCKS: Partial<Record<Environment, Flock[]>> = {
  "neon-city": [{ kind: "car", count: 16, r: [55, 150], h: [22, 60], speed: [0.05, 0.13], colors: ["#22e6ff", "#ff4fd8", "#ffd23f", "#a3ff4f"] }],
  forest: [{ kind: "bird", count: 8, r: [25, 75], h: [16, 30], speed: [0.1, 0.22], colors: ["#ffffff", "#f3d9a4", "#c9d7ee", "#e8c4c4"] }],
  "desert-ruins": [{ kind: "bird", count: 5, r: [40, 95], h: [30, 48], speed: [0.05, 0.1], colors: ["#3b2f25", "#5a4636"] }],
  "ocean-floor": [{ kind: "fish", count: 28, r: [5, 22], h: [1.8, 7], speed: [0.25, 0.6], colors: ["#ffb347", "#ff7b9c", "#7df9ff", "#ffe066", "#c77bff"], anchor: "area" }],
  "sky-islands": [
    { kind: "bird", count: 7, r: [25, 80], h: [14, 32], speed: [0.1, 0.2], colors: ["#ffffff", "#fff4c2"] },
    { kind: "balloon", count: 3, r: [60, 130], h: [20, 55], speed: [0.012, 0.025], colors: ["#ff7ab6", "#ffd166", "#7ad7ff"] },
  ],
  castle: [{ kind: "bird", count: 7, r: [18, 60], h: [20, 40], speed: [0.14, 0.26], colors: ["#1d1d27", "#2a2a36"] }],
  laboratory: [{ kind: "drone", count: 5, r: [14, 42], h: [7, 15], speed: [0.1, 0.22], colors: ["#2f9bff", "#2fd98a", "#ffffff"] }],
  "space-station": [{ kind: "drone", count: 5, r: [28, 75], h: [9, 32], speed: [0.04, 0.1], colors: ["#35f0ff", "#ff8a3d", "#ffffff"] }],
};

export type Geo = "box" | "sphere" | "cone" | "torus";
export interface Part {
  geo: Geo;
  size: [number, number, number];
  pos: [number, number, number];
  /** Where the part rotates (wings flap about the shoulder), relative to the critter. */
  pivot?: [number, number, number];
  /** Rotation about local z / y, as a function of time and the critter's own phase. */
  flap?: (t: number, ph: number) => number;
  swing?: (t: number, ph: number) => number;
  /** `tint`: the critter's own colour; `glow`: bright and unlit; otherwise a fixed colour. */
  color: "tint" | "glow" | string;
}

export const PARTS: Record<Kind, Part[]> = {
  bird: [
    { geo: "sphere", size: [0.34, 0.26, 0.85], pos: [0, 0, 0], color: "tint" },
    { geo: "box", size: [1.15, 0.05, 0.5], pos: [-0.62, 0, 0], pivot: [-0.2, 0, 0], flap: (t, p) => Math.sin(t * 9 + p) * 0.55 + 0.1, color: "tint" },
    { geo: "box", size: [1.15, 0.05, 0.5], pos: [0.62, 0, 0], pivot: [0.2, 0, 0], flap: (t, p) => -(Math.sin(t * 9 + p) * 0.55 + 0.1), color: "tint" },
  ],
  fish: [
    { geo: "sphere", size: [0.34, 0.4, 1.0], pos: [0, 0, 0], color: "tint" },
    { geo: "cone", size: [0.34, 0.5, 0.34], pos: [0, 0, 0.62], pivot: [0, 0, 0.45], swing: (t, p) => Math.sin(t * 7 + p) * 0.5, color: "tint" },
  ],
  car: [
    { geo: "box", size: [1.5, 0.5, 3.2], pos: [0, 0, 0], color: "#1a2146" },
    { geo: "box", size: [1.1, 0.4, 1.4], pos: [0, 0.4, 0.2], color: "#2a3470" },
    { geo: "box", size: [1.56, 0.12, 3.26], pos: [0, -0.18, 0], color: "glow" },
    { geo: "box", size: [1.2, 0.14, 0.12], pos: [0, 0.02, -1.62], color: "#ffffff" },
  ],
  drone: [
    { geo: "sphere", size: [0.7, 0.55, 0.7], pos: [0, 0, 0], color: "#e6ecf7" },
    { geo: "torus", size: [0.95, 0.95, 0.95], pos: [0, 0, 0], color: "glow" },
    { geo: "sphere", size: [0.2, 0.2, 0.2], pos: [0, 0.05, -0.34], color: "glow" },
  ],
  balloon: [
    { geo: "sphere", size: [4.2, 5.0, 4.2], pos: [0, 0, 0], color: "tint" },
    { geo: "box", size: [0.9, 0.7, 0.9], pos: [0, -3.9, 0], color: "#8a6a44" },
    { geo: "cone", size: [3.0, 0.8, 3.0], pos: [0, -2.7, 0], color: "tint" },
  ],
};

/** Overall size multiplier per kind: far-away critters need to read as more than a speck. */
export const SCALE: Record<Kind, number> = { car: 2.4, bird: 1.7, fish: 1.3, drone: 1.6, balloon: 1 };
