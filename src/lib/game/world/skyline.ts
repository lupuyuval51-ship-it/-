/**
 * Distant scenery (skyline) per environment: pure, deterministic data that the renderer draws with a handful of
 * instanced meshes. It exists so every world has a horizon with character — pyramids and dunes, a neon skyline,
 * hills and mountains, floating islands, planets — instead of an empty void behind the playable area.
 */
import type { Environment } from "../spec/constants";
import { mulberry32 } from "../util/prng";
import type { EnvTheme } from "./types";

export type SkylineGeo = "box" | "cone" | "cone4" | "sphere" | "cyl" | "dome";

export interface SkylinePiece {
  geo: SkylineGeo;
  x: number;
  y: number;
  z: number;
  /** Full dimensions (width, height, depth). A negative height flips the piece upside down (hanging rocks). */
  sx: number;
  sy: number;
  sz: number;
  color: string;
  /** Drawn at full brightness (windows, beacons, planets' glow) instead of fading into the haze. */
  bright?: boolean;
}

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, "0")}`;
}

/** How much of the haze colour a piece takes on: far pieces fade into the sky (atmospheric perspective). */
const haze = (c: string, theme: EnvTheme, radius: number, base = 0.25) => mix(c, theme.skyBottom, Math.min(0.85, base + (radius - 200) / 420));

type Rect = { x0: number; x1: number; z0: number; z1: number };

/**
 * Distant scenery stands at least this far (metres) beyond the playable area once the caller passes its bounds. The ring
 * is centred on the origin, which is fine for a plaza or a lab but not for a long level: a corridor or a platformer with
 * eight stations runs 140–250 m along −z, straight into the hills, dunes or towers of the ring.
 */
export const SKYLINE_CLEARANCE = 30;

/** Signed distance from (x, z) to a rectangle (negative inside). 1-Lipschitz, and convex along any line. */
const sdRect = (x: number, z: number, b: Rect): number => {
  const dx = Math.max(b.x0 - x, x - b.x1);
  const dz = Math.max(b.z0 - z, z - b.z1);
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
};

/** Gap between a piece's ground footprint at (x, z) and the rectangle: boxes and pyramids are axis-aligned squares, the rest round. */
export function skylineGap(p: Pick<SkylinePiece, "geo" | "sx" | "sz">, x: number, z: number, b: Rect): number {
  const hx = Math.abs(p.sx) / 2, hz = Math.abs(p.sz) / 2;
  if (p.geo === "box" || p.geo === "cone4") return sdRect(x, z, { x0: b.x0 - hx, x1: b.x1 + hx, z0: b.z0 - hz, z1: b.z1 + hz });
  return sdRect(x, z, b) - Math.max(hx, hz);
}

/**
 * Moves one ring slot (a tower and its lit band, an island and the rock under it…) straight away from the playable area
 * until every piece of it clears the area by `SKYLINE_CLEARANCE`. A slot that already does is left exactly where it is.
 */
function clearOfArea(group: SkylinePiece[], b: Rect): void {
  const first = group[0];
  if (!first) return;
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const len = Math.hypot(first.x - cx, first.z - cz);
  if (len < 1e-6) return;
  const ux = (first.x - cx) / len, uz = (first.z - cz) / len;
  const gap = (d: number) => Math.min(...group.map((p) => skylineGap(p, p.x + ux * d, p.z + uz * d, b)));
  let d = 0;
  // the gap grows by at most the distance moved, so stepping by the shortfall never overshoots
  for (let k = 0, g = gap(0); k < 64 && g < SKYLINE_CLEARANCE; k++, g = gap(d)) d += Math.max(1, SKYLINE_CLEARANCE - g);
  if (d === 0) return;
  for (const p of group) {
    p.x += ux * d;
    p.z += uz * d;
  }
}

/**
 * The skyline for one area. `bounds` (the area's playable rectangle) keeps every piece `SKYLINE_CLEARANCE` metres clear
 * of it; without it the ring is exactly the original one. Either way the pieces, their order, sizes and colours are the
 * same for a seed (the budget keeps a prefix of this list), only the slots that would stand in the way move outwards.
 */
export function buildSkyline(env: Environment, theme: EnvTheme, seed: number, groundY: number, bounds?: Rect): SkylinePiece[] {
  const rnd = mulberry32(seed ^ 0x5bd1e995);
  const out: SkylinePiece[] = [];
  const ring = (n: number, r0: number, r1: number, f: (a: number, r: number, i: number) => void) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.12;
      const start = out.length;
      f(a, r0 + rnd() * (r1 - r0), i);
      if (bounds) clearOfArea(out.slice(start), bounds);
    }
  };
  const at = (a: number, r: number) => ({ x: Math.cos(a) * r, z: Math.sin(a) * r });

  switch (env) {
    case "neon-city":
      ring(46, 210, 330, (a, r, i) => {
        const p = at(a, r);
        const h = 45 + rnd() * 135;
        const w = 14 + rnd() * 18;
        out.push({ geo: "box", ...p, y: groundY + h / 2 - 2, sx: w, sy: h, sz: w, color: haze(mix("#10163a", theme.accent2, 0.08 + rnd() * 0.1), theme, r, 0.2) });
        if (i % 2 === 0) {
          // a lit band near the top of the tower, in one of the two neon colours
          const band = h * (0.45 + rnd() * 0.45);
          out.push({ geo: "box", ...p, y: groundY + band, sx: w + 0.6, sy: 2.2, sz: w + 0.6, color: i % 4 === 0 ? theme.accent : theme.accent2, bright: true });
        }
      });
      break;
    case "desert-ruins":
      ring(7, 290, 400, (a, r) => {
        const p = at(a, r);
        const w = 95 + rnd() * 90;
        out.push({ geo: "cone4", ...p, y: groundY + w * 0.38, sx: w, sy: w * 0.78, sz: w, color: haze(mix("#d8b878", "#f0d9a0", rnd()), theme, r, 0.3) });
      });
      ring(26, 190, 360, (a, r) => {
        const p = at(a, r);
        out.push({ geo: "sphere", ...p, y: groundY + 2, sx: 80 + rnd() * 90, sy: 16 + rnd() * 18, sz: 60 + rnd() * 70, color: haze(mix("#d2b074", "#b88f55", rnd()), theme, r, 0.2) });
      });
      break;
    case "forest":
      ring(20, 380, 440, (a, r) => {
        const p = at(a, r);
        const h = 110 + rnd() * 110;
        out.push({ geo: "cone", ...p, y: groundY + h / 2 - 4, sx: h * 1.3, sy: h, sz: h * 1.3, color: haze("#5c7f9a", theme, r, 0.45) });
      });
      ring(30, 200, 340, (a, r) => {
        const p = at(a, r);
        out.push({ geo: "sphere", ...p, y: groundY + 3, sx: 70 + rnd() * 90, sy: 28 + rnd() * 34, sz: 60 + rnd() * 80, color: haze(mix("#2f7a3c", "#4f9a48", rnd()), theme, r, 0.2) });
      });
      break;
    case "sky-islands":
      ring(16, 200, 380, (a, r) => {
        const p = at(a, r);
        const w = 50 + rnd() * 70;
        const y = groundY + 10 + rnd() * 90;
        out.push({ geo: "cyl", ...p, y, sx: w, sy: 6, sz: w, color: haze("#6fbf5f", theme, r, 0.15) });
        out.push({ geo: "cone", ...p, y: y - 3 - w * 0.2, sx: w * 0.9, sy: -w * 0.6, sz: w * 0.9, color: haze("#8a7a64", theme, r, 0.2) });
      });
      ring(14, 180, 400, (a, r) => {
        const p = at(a, r);
        out.push({ geo: "sphere", ...p, y: groundY + 40 + rnd() * 120, sx: 60 + rnd() * 60, sy: 14 + rnd() * 10, sz: 30 + rnd() * 20, color: haze("#ffffff", theme, r, 0.1) });
      });
      break;
    case "castle":
      ring(22, 230, 360, (a, r, i) => {
        const p = at(a, r);
        const h = 40 + rnd() * 70;
        const w = 10 + rnd() * 10;
        const body = haze(mix("#6e6a62", "#8a847a", rnd()), theme, r, 0.3);
        out.push({ geo: "cyl", ...p, y: groundY + h / 2, sx: w, sy: h, sz: w, color: body });
        out.push({ geo: "cone", ...p, y: groundY + h + w * 0.7, sx: w * 1.25, sy: w * 1.5, sz: w * 1.25, color: i % 3 === 0 ? haze(theme.accent2, theme, r, 0.35) : haze("#3b4a63", theme, r, 0.35) });
      });
      ring(16, 330, 430, (a, r) => {
        const p = at(a, r);
        const h = 90 + rnd() * 90;
        out.push({ geo: "cone", ...p, y: groundY + h / 2 - 4, sx: h * 1.4, sy: h, sz: h * 1.4, color: haze("#59687f", theme, r, 0.45) });
      });
      break;
    case "laboratory":
      ring(14, 220, 330, (a, r) => {
        const p = at(a, r);
        const w = 40 + rnd() * 50;
        out.push({ geo: "dome", ...p, y: groundY, sx: w, sy: w * 0.6, sz: w, color: haze(mix("#9db8d4", "#c5d8ea", rnd()), theme, r, 0.2) });
      });
      ring(18, 200, 340, (a, r, i) => {
        const p = at(a, r);
        const h = 35 + rnd() * 70;
        out.push({ geo: "cyl", ...p, y: groundY + h / 2, sx: 7, sy: h, sz: 7, color: haze("#7d93ab", theme, r, 0.25) });
        if (i % 2 === 0) out.push({ geo: "sphere", ...p, y: groundY + h + 3, sx: 5, sy: 5, sz: 5, color: i % 4 === 0 ? theme.accent : theme.accent2, bright: true });
      });
      break;
    case "space-station":
      ring(5, 330, 420, (a, r, i) => {
        const p = at(a, r);
        const d = 55 + rnd() * 80;
        out.push({ geo: "sphere", ...p, y: groundY + 80 + rnd() * 140, sx: d, sy: d, sz: d, color: ["#5b6fc7", "#c77b5b", "#6fb59a", "#a58bd8", "#d8c98b"][i % 5]!, bright: true });
      });
      ring(24, 210, 330, (a, r) => {
        const p = at(a, r);
        const h = 20 + rnd() * 60;
        out.push({ geo: "box", ...p, y: groundY + h / 2, sx: 10 + rnd() * 18, sy: h, sz: 10 + rnd() * 18, color: haze("#2a3350", theme, r, 0.2) });
      });
      break;
    case "ocean-floor":
      ring(26, 220, 380, (a, r) => {
        const p = at(a, r);
        const h = 30 + rnd() * 80;
        out.push({ geo: "cone", ...p, y: groundY + h / 2 - 2, sx: h * 0.7, sy: h, sz: h * 0.7, color: haze(mix("#2f6f8a", "#3d8aa0", rnd()), theme, r, 0.35) });
      });
      ring(30, 190, 330, (a, r) => {
        const p = at(a, r);
        const h = 25 + rnd() * 60;
        out.push({ geo: "cyl", ...p, y: groundY + h / 2, sx: 3, sy: h, sz: 3, color: haze(mix("#2f9a6a", "#3dbb83", rnd()), theme, r, 0.3) });
      });
      break;
  }
  return out;
}

export interface WaterPiece {
  /** A flat rectangle (river segment) or an ellipse (lake), lying on the far ground. */
  shape: "rect" | "ellipse";
  x: number;
  z: number;
  /** Full size along the piece's own x axis (the flow direction for a river) and across it. */
  sx: number;
  sz: number;
  /** Yaw of the piece's x axis, in radians. */
  rot: number;
  /** `bank` is the wider strip of shore drawn under the water. */
  role: "water" | "bank";
  color: string;
}

/**
 * Rivers and lakes just beyond the playable area (desert: the Nile with green banks, forest: a lake). Placed relative to
 * the area's bounds so they never overlap anything the player can reach: every piece keeps at least `WATER_CLEARANCE`
 * metres from the bounds rectangle.
 */
export const WATER_CLEARANCE = 10;

export function buildWater(env: Environment, theme: EnvTheme, seed: number, bounds: { x0: number; x1: number; z0: number; z1: number }): WaterPiece[] {
  if (env !== "desert-ruins" && env !== "forest") return [];
  const rnd = mulberry32(seed ^ 0x2545f491);
  const cx = (bounds.x0 + bounds.x1) / 2, cz = (bounds.z0 + bounds.z1) / 2;
  const rb = Math.hypot(bounds.x1 - bounds.x0, bounds.z1 - bounds.z0) / 2;
  const out: WaterPiece[] = [];
  if (env === "desert-ruins") {
    const water = mix("#2f86b5", theme.skyBottom, 0.22);
    const bank = "#7ea24c";
    const R = rb + WATER_CLEARANCE + 14;
    const a0 = rnd() * Math.PI * 2;
    const span = 2.5;
    const n = Math.ceil((R * span) / 7);
    const phase = rnd() * 6;
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * span;
      const r = R + 3.5 * Math.sin(i * 0.37 + phase);
      const w = 12 + 4 * Math.sin(i * 0.5 + phase * 1.7);
      const len = ((R * span) / n) * 1.25;
      const base = { shape: "rect" as const, x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, rot: -(a + Math.PI / 2) };
      out.push({ ...base, sx: len, sz: w + 9, role: "bank", color: bank });
      out.push({ ...base, sx: len, sz: w, role: "water", color: water });
    }
  } else {
    const water = mix("#3a93b8", theme.skyTop, 0.25);
    const rx = 30 + rnd() * 14, rz = 18 + rnd() * 9;
    const a = rnd() * Math.PI * 2;
    // the ellipse's nearest point to the area must still clear the bounds: use its larger radius as the safety margin
    const d = rb + WATER_CLEARANCE + Math.max(rx, rz) + 6;
    const base = { shape: "ellipse" as const, x: cx + Math.cos(a) * d, z: cz + Math.sin(a) * d, rot: rnd() * Math.PI };
    out.push({ ...base, sx: rx * 2 + 9, sz: rz * 2 + 9, role: "bank", color: "#cdbf8f" });
    out.push({ ...base, sx: rx * 2, sz: rz * 2, role: "water", color: water });
  }
  return out;
}
