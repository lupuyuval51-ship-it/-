import type { Environment, TimeOfDay } from "../spec/constants";
import type { DecorKind, EnvTheme } from "./types";

const base: Record<Environment, EnvTheme> = {
  "neon-city": { skyTop: "#0b0620", skyBottom: "#3a1b78", fog: "#1a0f3d", ground: "#2d366e", groundAlt: "#38437f", wall: "#2c2f63", platform: "#3b3f86", accent: "#22e6ff", accent2: "#ff4fd8", sun: "#b9a6ff", sunIntensity: 1.1, ambient: 0.72, stars: true, clouds: false },
  forest: { skyTop: "#5fa8d3", skyBottom: "#d6efdc", fog: "#b9dcc4", ground: "#3d7a3a", groundAlt: "#4b8f45", wall: "#6b5a43", platform: "#7a6a52", accent: "#ffd166", accent2: "#a3ff4f", sun: "#fff4d6", sunIntensity: 1.7, ambient: 0.7, stars: false, clouds: true },
  "space-station": { skyTop: "#02030a", skyBottom: "#0c1330", fog: "#070b1d", ground: "#252b3c", groundAlt: "#2f3750", wall: "#3b4663", platform: "#47557a", accent: "#35f0ff", accent2: "#ff8a3d", sun: "#cfe1ff", sunIntensity: 1.2, ambient: 0.5, stars: true, clouds: false },
  "desert-ruins": { skyTop: "#5aa0d6", skyBottom: "#f4d9a6", fog: "#ecd2a0", ground: "#d2b074", groundAlt: "#c49f61", wall: "#b08a55", platform: "#c9a468", accent: "#2dd4bf", accent2: "#f59e0b", sun: "#fff1cc", sunIntensity: 1.9, ambient: 0.75, stars: false, clouds: true },
  "ocean-floor": { skyTop: "#041c3a", skyBottom: "#0b5d8a", fog: "#0a4f78", ground: "#c9b88b", groundAlt: "#b8a678", wall: "#2c6f8f", platform: "#3a89a8", accent: "#7df9ff", accent2: "#ff7b9c", sun: "#9fe7ff", sunIntensity: 1.1, ambient: 0.65, stars: false, clouds: false },
  laboratory: { skyTop: "#6fa8d8", skyBottom: "#cfe2f0", fog: "#b9d0e2", ground: "#8fa6bd", groundAlt: "#7f97b0", wall: "#6c849f", platform: "#5f7b99", accent: "#2f9bff", accent2: "#2fd98a", sun: "#ffffff", sunIntensity: 1.35, ambient: 0.7, stars: false, clouds: true },
  castle: { skyTop: "#334a6b", skyBottom: "#c8b79a", fog: "#9d9585", ground: "#8c8a82", groundAlt: "#7c7a73", wall: "#6e6a62", platform: "#80796d", accent: "#f2c14e", accent2: "#c0392b", sun: "#ffe9c2", sunIntensity: 1.5, ambient: 0.65, stars: false, clouds: true },
  "sky-islands": { skyTop: "#3b82f6", skyBottom: "#dff4ff", fog: "#cfe8fb", ground: "#6fbf5f", groundAlt: "#5cae52", wall: "#9a8f7c", platform: "#7ec96a", accent: "#fff27a", accent2: "#ff7ab6", sun: "#fffbe5", sunIntensity: 1.8, ambient: 0.8, stars: false, clouds: true },
};

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

export function themeFor(env: Environment, time: TimeOfDay, palette?: { primary: string; accent: string }): EnvTheme {
  const t = { ...base[env] };
  if (time === "dusk") {
    t.skyTop = mix(t.skyTop, "#3b1f5e", 0.5);
    t.skyBottom = mix(t.skyBottom, "#ff9a5a", 0.5);
    t.fog = mix(t.fog, "#8a4f6f", 0.45);
    t.sun = mix(t.sun, "#ffb36b", 0.6);
    t.sunIntensity *= 0.8;
    t.ambient *= 0.8;
  } else if (time === "night") {
    t.skyTop = mix(t.skyTop, "#02040f", 0.8);
    t.skyBottom = mix(t.skyBottom, "#0b1230", 0.75);
    t.fog = mix(t.fog, "#060a1c", 0.8);
    t.ground = mix(t.ground, "#05070f", 0.2);
    t.groundAlt = mix(t.groundAlt, "#05070f", 0.2);
    t.sun = "#8fa8ff";
    t.sunIntensity *= 0.75;
    t.ambient *= 0.9;
    t.stars = true;
    t.clouds = false;
  }
  if (palette) {
    t.accent = palette.accent;
    t.platform = mix(t.platform, palette.primary, 0.55);
    t.wall = mix(t.wall, palette.primary, 0.35);
  }
  return t;
}

/** Scenery per environment: `solid` props can be walked into, `ambient` props only dress the scene. */
export const ENV_DECOR: Record<Environment, { solid: DecorKind[]; ambient: DecorKind[] }> = {
  "neon-city": { solid: ["crate", "lamp", "crate"], ambient: ["tower", "antenna", "building", "lamp", "hologram"] },
  forest: { solid: ["tree", "rock", "tree"], ambient: ["bush", "pine", "mushroom", "flower", "flower", "bush"] },
  "space-station": { solid: ["crate", "pillar"], ambient: ["antenna", "pipe", "tower", "dish"] },
  "desert-ruins": { solid: ["pillar", "rock", "obelisk"], ambient: ["cactus", "arch", "rock", "palm", "palm", "obelisk", "reed"] },
  "ocean-floor": { solid: ["coral", "rock"], ambient: ["coral", "bush", "crystal", "kelp", "kelp"] },
  laboratory: { solid: ["crate", "pillar", "flask"], ambient: ["pipe", "lamp", "tower", "flask"] },
  castle: { solid: ["pillar", "crate"], ambient: ["tower", "arch", "lamp", "torch", "banner"] },
  "sky-islands": { solid: ["rock", "tree"], ambient: ["cloud", "crystal", "bush", "flower"] },
};

/**
 * Collision footprint of solid scenery (half-extent in metres and height, both ×scale). The visible mesh is the decor
 * itself; the collider is only as big as the part of it a player can actually bump into (a trunk, not the canopy).
 * Half-extents stay ≤ 0.9 at the maximum scale so the "every gap is wider than the player" guarantee still holds.
 */
export const COLLIDER: Partial<Record<DecorKind, { r: number; h: number }>> = {
  crate: { r: 0.6, h: 1.2 },
  pillar: { r: 0.58, h: 3.4 },
  rock: { r: 0.62, h: 1.0 },
  tree: { r: 0.3, h: 3.2 },
  lamp: { r: 0.16, h: 3.3 },
  coral: { r: 0.4, h: 1.8 },
  obelisk: { r: 0.42, h: 4.4 },
  flask: { r: 0.55, h: 1.7 },
  cactus: { r: 0.36, h: 2.4 },
};
