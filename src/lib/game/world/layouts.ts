/**
 * Deterministic layout generators. Each takes a validated area and returns real geometry plus the exact
 * positions of stations, NPCs, collectibles, checkpoints, hazards, gates and the portal.
 *
 * Reachability is guaranteed by construction (and verified by tests that flood-fill / simulate crossings):
 *  - open layouts keep obstacle gaps wider than the player;
 *  - rooms/corridor chain doors in path order;
 *  - the platformer derives every gap and rise from the same physics constants the simulation uses.
 */
import { MAX_COMFORT_GAP, MAX_JUMP_HEIGHT, PLAYER_RADIUS, KILL_Y_MARGIN } from "../engine/constants";
import { collectibleId } from "../state/progress";
import { rangeOf } from "../util/prng";
import { COLLIDER } from "./theme";
import { ambientDecor, box, centered, dist2d, farthestSpot, scatter, sizeScale, solidDecorKind, type LayoutCtx, type LayoutResult } from "./helpers";
import type { DecorItem, WorldBox, WorldCheckpoint, WorldCollectible, WorldGate, WorldHazard, WorldNpc, WorldPortal, WorldStation } from "./types";

const AMBIENT_MAX = 140;

function emptyResult(): LayoutResult {
  return {
    bounds: { x0: -10, x1: 10, z0: -10, z1: 10 }, killY: -60, spawn: { x: 0, y: 0, z: 0, yaw: 0 }, boxes: [], decor: [], stations: [], npcs: [],
    collectibles: [], checkpoints: [], hazards: [], gates: [], portal: null, hasVoid: false,
  };
}

const station = (ctx: LayoutCtx, i: number, x: number, y: number, z: number): WorldStation => {
  const s = ctx.area.stations[i]!;
  return { stationId: s.id, kind: s.kind, label: s.label, x, y, z, facing: 0 };
};
const npc = (ctx: LayoutCtx, i: number, x: number, y: number, z: number): WorldNpc => {
  const n = ctx.area.npcs[i]!;
  return { npcId: n.id, name: n.name, color: n.look.color, shape: n.look.shape, x, y, z, facing: 0 };
};
const collectible = (ctx: LayoutCtx, i: number, x: number, y: number, z: number): WorldCollectible => ({
  itemId: collectibleId(ctx.area.id, i), kind: ctx.area.collectibles.kind, x, y, z,
});
const portalOf = (ctx: LayoutCtx, x: number, y: number, z: number): WorldPortal | null =>
  ctx.area.portal ? { toAreaId: ctx.area.portal.toAreaId, label: ctx.area.portal.label, requiresMissionIds: ctx.area.portal.requiresMissionIds, x, y, z } : null;

const wantsCollectibles = (ctx: LayoutCtx) => ctx.mech.has("collect") && ctx.area.collectibles.count > 0;
const wantsNpcs = (ctx: LayoutCtx) => ctx.mech.has("dialogue") && ctx.area.npcs.length > 0;
const hazardTarget = (ctx: LayoutCtx) => (ctx.mech.has("hazards") ? (ctx.area.hazardLevel === "high" ? 5 : ctx.area.hazardLevel === "low" ? 2 : 0) : 0);

// ───────────────────────────── plaza ─────────────────────────────

export function plaza(ctx: LayoutCtx): LayoutResult {
  const r = emptyResult();
  const R = [16, 22, 28][sizeScale(ctx.area.size)]!;
  r.bounds = { x0: -R, x1: R, z0: -R, z1: R };
  r.boxes.push(box("floor", "floor", -R, R, -0.5, 0, -R, R, { style: "floor" }));
  const t = 2;
  r.boxes.push(
    box("bound-n", "bounds", -R - t, R + t, 0, 12, -R - t, -R), box("bound-s", "bounds", -R - t, R + t, 0, 12, R, R + t),
    box("bound-w", "bounds", -R - t, -R, 0, 12, -R, R), box("bound-e", "bounds", R, R + t, 0, 12, -R, R),
  );
  r.spawn = { x: 0, y: 0, z: R * 0.78, yaw: 0 };

  const n = ctx.area.stations.length;
  const ring = R * 0.58;
  const keep: { x: number; z: number; r: number }[] = [{ x: r.spawn.x, z: r.spawn.z, r: 4 }];
  ctx.area.stations.forEach((_, i) => {
    const a = ((n === 1 ? 270 : 205 + (130 * i) / (n - 1)) * Math.PI) / 180;
    const s = station(ctx, i, Math.cos(a) * ring, 0, Math.sin(a) * ring);
    r.stations.push(s);
    keep.push({ x: s.x, z: s.z, r: 3.2 });
  });
  if (wantsNpcs(ctx)) {
    ctx.area.npcs.forEach((_, i) => {
      const a = ((100 + i * 55) * Math.PI) / 180;
      const p = npc(ctx, i, Math.cos(a) * R * 0.3, 0, Math.sin(a) * R * 0.3 + 2);
      r.npcs.push(p);
      keep.push({ x: p.x, z: p.z, r: 3 });
    });
  }
  const cand = Array.from({ length: 24 }, (_, i) => ({ x: Math.cos((i / 24) * Math.PI * 2) * R * 0.86, z: Math.sin((i / 24) * Math.PI * 2) * R * 0.86 }));
  const portalPos = ctx.area.portal ? farthestSpot(cand.filter((c) => c.z < 0), r.stations) : null;
  if (portalPos) {
    r.portal = portalOf(ctx, portalPos.x, 0, portalPos.z);
    keep.push({ x: portalPos.x, z: portalPos.z, r: 4 });
  }

  // Lava patches (hazards) keep clear of every key point so a safe route always exists.
  const lava = scatter(ctx.rng, hazardTarget(ctx), { minR: R * 0.25, maxR: R * 0.8 }, 6, keep.map((k) => ({ ...k, r: k.r + 2.5 })));
  lava.forEach((p, i) => {
    r.hazards.push({ id: `lava-${i}`, x0: p.x - 1.5, x1: p.x + 1.5, z0: p.z - 1.5, z1: p.z + 1.5, y: 0, kind: "lava" });
    keep.push({ x: p.x, z: p.z, r: 3.5 });
  });

  // Solid scenery: radius ≤ 0.9 and ≥ 3.8 apart ⇒ every gap is wider than the player.
  const obstacleCount = Math.round(R * 0.42);
  const obstacles = scatter(ctx.rng, obstacleCount, { minR: 3, maxR: R * 0.93 }, 3.8, keep.map((k) => ({ ...k, r: k.r + 0.6 })));
  obstacles.forEach((p, i) => {
    const rad = 0.55 + ctx.rng() * 0.35;
    const kind = solidDecorKind(ctx);
    const scale = rad * 1.6;
    const col = COLLIDER[kind] ?? { r: 0.6, h: 1.6 };
    const half = Math.min(0.9, col.r * scale);
    // The collider is invisible: the decor mesh is what the player sees (no more grey boxes under trees and lamps).
    r.boxes.push(centered(`prop-${i}`, "prop", p.x, p.z, half * 2, half * 2, 0, col.h * scale, { style: "prop", walkable: false, visible: false }));
    const item: DecorItem = { kind, x: p.x, y: 0, z: p.z, scale, rot: ctx.rng() * 6.28, rank: 0, solid: true, tint: Math.floor(ctx.rng() * 4) };
    r.decor.push(item);
    keep.push({ x: p.x, z: p.z, r: 1.4 });
  });

  if (wantsCollectibles(ctx)) {
    const spots = scatter(ctx.rng, ctx.area.collectibles.count, { minR: R * 0.2, maxR: R * 0.88 }, 2.6, keep.map((k) => ({ ...k, r: Math.max(k.r, 1.8) })));
    spots.forEach((p, i) => r.collectibles.push(collectible(ctx, i, p.x, 0.9, p.z)));
  }
  if (ctx.mech.has("checkpoints")) {
    r.stations.slice(0, 3).forEach((s, i) => r.checkpoints.push({ checkpointId: `${ctx.area.id}:cp${i}`, x: s.x * 0.8, y: 0, z: s.z * 0.8 + 3 }));
  }
  r.decor.push(...ambientDecor(ctx, r.bounds, 0, AMBIENT_MAX));
  return r;
}

// ───────────────────────────── corridor ─────────────────────────────

export function corridor(ctx: LayoutCtx): LayoutResult {
  const r = emptyResult();
  const n = ctx.area.stations.length;
  const W = 5; // half width
  const seg = [12, 14, 16][sizeScale(ctx.area.size)]!;
  const head = 10;
  const length = head + seg * n + (ctx.area.portal ? 8 : 4);
  r.bounds = { x0: -W, x1: W, z0: -length + head, z1: head };
  r.boxes.push(box("floor", "floor", -W, W, -0.5, 0, -length + head, head, { style: "floor" }));
  r.boxes.push(box("wall-w", "wall", -W - 0.8, -W, 0, 4.5, -length + head - 0.8, head + 0.8), box("wall-e", "wall", W, W + 0.8, 0, 4.5, -length + head - 0.8, head + 0.8));
  r.boxes.push(box("wall-s", "wall", -W - 0.8, W + 0.8, 0, 4.5, head, head + 0.8), box("wall-n", "wall", -W - 0.8, W + 0.8, 0, 4.5, -length + head - 0.8, -length + head));
  r.spawn = { x: 0, y: 0, z: head - 3, yaw: 0 };
  const gates = ctx.mech.has("gates");
  ctx.area.stations.forEach((s, i) => {
    const z = -(seg * i) - seg * 0.55;
    r.stations.push(station(ctx, i, i % 2 === 0 ? -2.2 : 2.2, 0, z));
    r.boxes.push(centered(`pedestal-${i}`, "prop", i % 2 === 0 ? -2.2 : 2.2, z - 1.2, 1.4, 0.6, 0, 0.5, { walkable: false, style: "pedestal" }));
    const lastSegment = i === n - 1;
    if (gates && !lastSegment) {
      const gz = -(seg * (i + 1));
      const id = `gate-${i}`;
      r.boxes.push(box(id, "gate", -W, W, 0, 4, gz - 0.4, gz + 0.4, { gateId: id, style: "gate" }));
      r.gates.push({ id, opensWhenStationsDone: [s.id] });
    }
    if (ctx.mech.has("checkpoints") && i > 0) r.checkpoints.push({ checkpointId: `${ctx.area.id}:cp${i}`, x: 0, y: 0, z: -(seg * i) + 2 });
  });
  if (wantsNpcs(ctx)) ctx.area.npcs.forEach((_, i) => r.npcs.push(npc(ctx, i, -2.5 + i * 2.5, 0, head - 6.5)));
  if (wantsCollectibles(ctx)) {
    for (let i = 0; i < ctx.area.collectibles.count; i++) {
      const segIdx = i % n;
      const z = -(seg * segIdx) - seg * (0.2 + 0.18 * Math.floor(i / n)) - 0.5;
      r.collectibles.push(collectible(ctx, i, i % 2 === 0 ? 3.9 : -3.9, 0.9, z));
    }
  }
  const endZ = -(seg * n) - 4;
  const portal = portalOf(ctx, 0, 0, endZ);
  if (portal) r.portal = portal;
  for (let z = 4; z > -length + head; z -= 7) {
    for (const x of [-W + 0.5, W - 0.5]) r.decor.push({ kind: "pillar", x, y: 0, z, scale: 0.7, rot: 0, rank: 0.2 + ctx.rng() * 0.8, solid: false, tint: 0 });
  }
  r.decor.push(...ambientDecor(ctx, { x0: -W, x1: W, z0: -length + head, z1: head }, 0, 40));
  return r;
}

// ───────────────────────────── rooms ─────────────────────────────

export function rooms(ctx: LayoutCtx): LayoutResult {
  const r = emptyResult();
  const n = ctx.area.stations.length;
  const S = [13, 16, 19][sizeScale(ctx.area.size)]!;
  const T = 0.8;
  const P = S + T;
  const cols = Math.min(3, n);
  const DOOR = 4.2;
  const H = 4;
  const gatesOn = ctx.mech.has("gates");

  const pos = Array.from({ length: n }, (_, k) => {
    const row = Math.floor(k / cols);
    const inRow = k % cols;
    const col = row % 2 === 0 ? inRow : cols - 1 - inRow;
    return { row, col, x0: col * P, x1: col * P + S, z1: -(row * P), z0: -(row * P + S) };
  });
  const at = new Map(pos.map((p, k) => [`${p.col},${p.row}`, k]));
  const rows = Math.max(...pos.map((p) => p.row)) + 1;
  r.bounds = { x0: 0, x1: cols * P - T, z0: -(rows * P - T), z1: 0 };
  const doors = new Set<string>();
  for (let k = 0; k + 1 < n; k++) doors.add([k, k + 1].sort((a, b) => a - b).join("-"));

  const built = new Set<string>();
  const wall = (id: string, x0: number, x1: number, z0: number, z1: number) => r.boxes.push(box(id, "wall", x0, x1, 0, H, z0, z1, { style: "wall" }));
  pos.forEach((p, k) => {
    r.boxes.push(box(`floor-${k}`, "floor", p.x0, p.x1, -0.5, 0, p.z0, p.z1, { style: k % 2 === 0 ? "floor" : "floorAlt" }));
    const sides = [
      { dir: "n", nc: p.col, nr: p.row - 1 }, { dir: "s", nc: p.col, nr: p.row + 1 }, { dir: "w", nc: p.col - 1, nr: p.row }, { dir: "e", nc: p.col + 1, nr: p.row },
    ] as const;
    for (const s of sides) {
      const nk = at.get(`${s.nc},${s.nr}`);
      const key = nk === undefined ? `${k}:${s.dir}` : [k, nk].sort((a, b) => a - b).join("-") + (s.dir === "n" || s.dir === "s" ? "h" : "v");
      if (built.has(key)) continue;
      built.add(key);
      const isDoor = nk !== undefined && doors.has([k, nk].sort((a, b) => a - b).join("-"));
      const horizontal = s.dir === "n" || s.dir === "s";
      const fixed = s.dir === "n" ? p.z1 : s.dir === "s" ? p.z0 - T : s.dir === "w" ? p.x0 - T : p.x1;
      const a0 = (horizontal ? p.x0 : p.z0) - T;
      const a1 = (horizontal ? p.x1 : p.z1) + T;
      if (!isDoor) {
        if (horizontal) wall(`w-${key}`, a0, a1, fixed, fixed + T);
        else wall(`w-${key}`, fixed, fixed + T, a0, a1);
        continue;
      }
      const mid = (a0 + T + a1 - T) / 2;
      const g0 = mid - DOOR / 2;
      const g1 = mid + DOOR / 2;
      if (horizontal) {
        wall(`w-${key}-a`, a0, g0, fixed, fixed + T);
        wall(`w-${key}-b`, g1, a1, fixed, fixed + T);
      } else {
        wall(`w-${key}-a`, fixed, fixed + T, a0, g0);
        wall(`w-${key}-b`, fixed, fixed + T, g1, a1);
      }
      const lowK = Math.min(k, nk!);
      if (gatesOn) {
        const gid = `gate-${lowK}`;
        r.boxes.push(horizontal ? box(gid, "gate", g0, g1, 0, H - 0.4, fixed, fixed + T, { gateId: gid, style: "gate" }) : box(gid, "gate", fixed, fixed + T, 0, H - 0.4, g0, g1, { gateId: gid, style: "gate" }));
        r.gates.push({ id: gid, opensWhenStationsDone: [ctx.area.stations[lowK]!.id] });
      }
    }
    const cx = (p.x0 + p.x1) / 2;
    const cz = (p.z0 + p.z1) / 2;
    r.stations.push(station(ctx, k, cx, 0, cz - 1));
    r.boxes.push(centered(`pedestal-${k}`, "prop", cx, cz - 2.2, 2.4, 0.8, 0, 0.6, { walkable: false, style: "pedestal" }));
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const px = cx + dx * (S / 2 - 1.5);
      const pz = cz + dz * (S / 2 - 1.5);
      r.boxes.push(centered(`pillar-${k}-${dx}${dz}`, "prop", px, pz, 1.1, 1.1, 0, H - 0.5, { walkable: false, style: "pillar" }));
      r.decor.push({ kind: "pillar", x: px, y: 0, z: pz, scale: 0.55, rot: 0, rank: 0, solid: true, tint: 0 });
    }
    if (ctx.mech.has("checkpoints")) r.checkpoints.push({ checkpointId: `${ctx.area.id}:cp${k}`, x: cx, y: 0, z: cz + S * 0.3 });
  });
  const first = pos[0]!;
  const last = pos[n - 1]!;
  r.spawn = { x: (first.x0 + first.x1) / 2, y: 0, z: first.z1 - S * 0.2, yaw: 0 };
  if (wantsNpcs(ctx)) ctx.area.npcs.forEach((_, i) => r.npcs.push(npc(ctx, i, (first.x0 + first.x1) / 2 - 3.5 + i * 3.5, 0, first.z1 - S * 0.38)));
  if (wantsCollectibles(ctx)) {
    for (let i = 0; i < ctx.area.collectibles.count; i++) {
      const p = pos[i % n]!;
      const corner = Math.floor(i / n) % 2;
      const cx = (p.x0 + p.x1) / 2;
      const cz = (p.z0 + p.z1) / 2;
      r.collectibles.push(collectible(ctx, i, cx + (corner ? 1 : -1) * (S / 2 - 3.2), 0.9, cz + (S / 2 - 3.2) * (corner ? -1 : 1) * 0.6));
    }
  }
  const portal = portalOf(ctx, (last.x0 + last.x1) / 2, 0, last.z0 + S * 0.22);
  if (portal) r.portal = portal;
  r.decor.push(...ambientDecor(ctx, r.bounds, 0, 60));
  return r;
}

// ───────────────────────────── lab ─────────────────────────────

export function lab(ctx: LayoutCtx): LayoutResult {
  const r = emptyResult();
  const R = [14, 18, 22][sizeScale(ctx.area.size)]!;
  r.bounds = { x0: -R, x1: R, z0: -R, z1: R };
  r.boxes.push(box("floor", "floor", -R, R, -0.5, 0, -R, R, { style: "floor" }));
  const t = 0.8;
  r.boxes.push(
    box("wall-n", "wall", -R - t, R + t, 0, 4.5, -R - t, -R), box("wall-s", "wall", -R - t, R + t, 0, 4.5, R, R + t),
    box("wall-w", "wall", -R - t, -R, 0, 4.5, -R, R), box("wall-e", "wall", R, R + t, 0, 4.5, -R, R),
  );
  r.spawn = { x: 0, y: 0, z: R * 0.8, yaw: 0 };
  r.boxes.push(centered("table", "prop", 0, 0, 3.8, 3.8, 0, 1.1, { style: "table", walkable: false }));
  r.decor.push({ kind: "hologram", x: 0, y: 1.1, z: 0, scale: 1.4, rot: 0, rank: 0, solid: false, tint: 0 });
  const n = ctx.area.stations.length;
  const ringR = R * 0.62;
  const avoid: { x: number; z: number }[] = [];
  ctx.area.stations.forEach((_, i) => {
    const a = ((270 + (360 / n) * i) * Math.PI) / 180;
    const sx = Math.cos(a) * ringR;
    const sz = Math.sin(a) * ringR;
    r.stations.push(station(ctx, i, sx, 0, sz));
    const bx = Math.cos(a) * (ringR + 1.7);
    const bz = Math.sin(a) * (ringR + 1.7);
    r.boxes.push(centered(`bench-${i}`, "prop", bx, bz, 3, 1.4, 0, 1.0, { style: "bench", walkable: false }));
    avoid.push({ x: sx, z: sz }, { x: bx, z: bz });
  });
  if (wantsNpcs(ctx)) ctx.area.npcs.forEach((_, i) => r.npcs.push(npc(ctx, i, -3 + i * 3, 0, R * 0.55)));
  const cand = Array.from({ length: 28 }, (_, i) => ({ x: Math.cos((i / 28) * Math.PI * 2) * R * 0.88, z: Math.sin((i / 28) * Math.PI * 2) * R * 0.88 }));
  const portalPos = ctx.area.portal ? farthestSpot(cand, [...avoid, r.spawn, ...r.npcs]) : null;
  if (portalPos) r.portal = portalOf(ctx, portalPos.x, 0, portalPos.z);
  if (wantsCollectibles(ctx)) {
    const keep = [...avoid.map((a) => ({ ...a, r: 3 })), { x: 0, z: 0, r: 4 }, { x: r.spawn.x, z: r.spawn.z, r: 3 }, ...(portalPos ? [{ ...portalPos, r: 3 }] : []), ...r.npcs.map((p) => ({ x: p.x, z: p.z, r: 2.5 }))];
    scatter(ctx.rng, ctx.area.collectibles.count, { minR: 4, maxR: R * 0.9 }, 2.6, keep).forEach((p, i) => r.collectibles.push(collectible(ctx, i, p.x, 0.9, p.z)));
  }
  for (let i = 0; i < 6; i++) r.decor.push({ kind: "pipe", x: -R + 0.6, y: 2.6, z: -R + 3 + i * ((2 * R - 6) / 5), scale: 0.6, rot: 0, rank: i / 6, solid: false, tint: 0 });
  r.decor.push(...ambientDecor(ctx, r.bounds, 0, 36));
  return r;
}

// ───────────────────────────── terraces (platformer) ─────────────────────────────

interface Pad { id: string; xc: number; zc: number; w: number; d: number; y: number; mover?: WorldBox["mover"] }

const gapBetween = (a: Pad, b: Pad): number => {
  const gx = Math.max(0, Math.abs(a.xc - b.xc) - (a.w + b.w) / 2);
  const gz = Math.max(0, Math.abs(a.zc - b.zc) - (a.d + b.d) / 2);
  return Math.hypot(gx, gz);
};

/** Maximum rise (m) we ever ask the player to climb: well below the real jump apex. */
const MAX_RISE = Math.min(0.95, MAX_JUMP_HEIGHT * 0.55);
/** Maximum edge-to-edge gap between consecutive fixed pads. */
const MAX_GAP = Math.min(2.6, MAX_COMFORT_GAP);

export function terraces(ctx: LayoutCtx): LayoutResult {
  const r = emptyResult();
  r.hasVoid = true;
  const n = ctx.area.stations.length;
  const connectors = [1, 2, 3][sizeScale(ctx.area.size)]!;
  const pads: Pad[] = [];
  const stationPadIdx: number[] = [];
  const start: Pad = { id: "start", xc: 0, zc: 0, w: 10, d: 10, y: 0 };
  pads.push(start);

  // Station pads carry lava strips on their side edges, so any pad entering or leaving one stays near its centre
  // lane (|Δx| ≤ 1.2 m): the safe 3.9 m lane is then always reachable and the level stays fair with hazards on.
  const LANE_SHIFT = 1.2;
  const place = (prev: Pad, w: number, d: number, id: string, opts: { rise?: number; gap?: number; lane?: boolean } = {}): Pad => {
    const lane = opts.lane || prev.id.startsWith("station");
    for (let attempt = 0; attempt < 40; attempt++) {
      const gap = opts.gap ?? rangeOf(ctx.rng, 1.5, 2.3);
      const shift = lane ? LANE_SHIFT : 3;
      const xc = Math.max(-7, Math.min(7, prev.xc + rangeOf(ctx.rng, -shift, shift)));
      const rise = opts.rise ?? rangeOf(ctx.rng, -0.5, MAX_RISE);
      const y = Math.max(0, Math.min(7, prev.y + rise));
      const pad: Pad = { id, xc, zc: prev.zc - prev.d / 2 - gap - d / 2, w, d, y };
      if (y - prev.y <= MAX_RISE && gapBetween(prev, pad) <= MAX_GAP) return pad;
    }
    return { id, xc: prev.xc, zc: prev.zc - prev.d / 2 - 1.6 - d / 2, w, d, y: prev.y };
  };

  let prev = start;
  for (let s = 0; s < n; s++) {
    const useMover = ctx.mech.has("moving_platforms") && s % 2 === 1;
    for (let j = 0; j < connectors; j++) {
      if (useMover && j === connectors - 1) {
        // A wide gap bridged by a sliding platform: it is always ≤ 2.4 m from one of its two neighbours.
        const mover: Pad = { id: `mover-${s}`, xc: prev.xc, zc: prev.zc - prev.d / 2 - 3, w: 3.6, d: 3.2, y: prev.y, mover: { axis: "z", amplitude: 1.0, period: 4.4, phase: ctx.rng() * 6.28 } };
        pads.push(mover);
        const next: Pad = { id: `c${s}-${j}`, xc: prev.xc, zc: prev.zc - prev.d / 2 - 6 - 1.8, w: 3.6, d: 3.6, y: prev.y + 0.25 };
        pads.push(next);
        prev = next;
      } else {
        prev = place(prev, 3.4, 3.4, `c${s}-${j}`);
        pads.push(prev);
      }
    }
    prev = place(prev, 7.5, 7.5, `station-${s}`, { rise: 0.3, lane: true });
    pads.push(prev);
    stationPadIdx.push(pads.length - 1);
  }
  let endPad: Pad | null = null;
  if (ctx.area.portal) {
    endPad = place(prev, 6, 6, "end", { rise: 0.2 });
    pads.push(endPad);
  }

  pads.forEach((p, i) => {
    r.boxes.push(box(`pad-${p.id}`, "platform", p.xc - p.w / 2, p.xc + p.w / 2, p.y - 0.8, p.y, p.zc - p.d / 2, p.zc + p.d / 2, {
      style: p.mover ? "mover" : stationPadIdx.includes(i) ? "stationPad" : "platform", mover: p.mover,
    }));
  });

  ctx.area.stations.forEach((_, s) => {
    const p = pads[stationPadIdx[s]!]!;
    r.stations.push(station(ctx, s, p.xc, p.y, p.zc));
    if (ctx.mech.has("checkpoints")) r.checkpoints.push({ checkpointId: `${ctx.area.id}:cp${s}`, x: p.xc, y: p.y, z: p.zc + p.d / 2 - 1.2 });
  });
  r.spawn = { x: 0, y: 0, z: 2.5, yaw: 0 };
  if (wantsNpcs(ctx)) ctx.area.npcs.forEach((_, i) => r.npcs.push(npc(ctx, i, -2.5 + i * 2.5, 0, -2.2)));
  if (endPad) r.portal = portalOf(ctx, endPad.xc, endPad.y, endPad.zc)!;

  if (wantsCollectibles(ctx)) {
    const spots: { x: number; y: number; z: number }[] = [];
    pads.filter((p) => p.id.startsWith("c") && !p.mover).forEach((p) => spots.push({ x: p.xc, y: p.y + 0.9, z: p.zc }));
    pads.filter((p) => p.id.startsWith("station")).forEach((p) => {
      // inside the safe centre lane, never over the lava strips on the sides
      spots.push({ x: p.xc - 1.0, y: p.y + 0.9, z: p.zc + p.d / 2 - 1.2 }, { x: p.xc + 1.0, y: p.y + 0.9, z: p.zc + p.d / 2 - 1.2 });
    });
    spots.slice(0, ctx.area.collectibles.count).forEach((p, i) => r.collectibles.push(collectible(ctx, i, p.x, p.y, p.z)));
  }

  // Lava strips on the side edges of station pads leave a ≥ 3.5 m clear lane through the middle.
  const lavaTarget = hazardTarget(ctx);
  for (let i = 0; i < Math.min(lavaTarget, n * 2); i++) {
    const p = pads[stationPadIdx[Math.floor(i / 2) % n]!]!;
    const side = i % 2 === 0 ? -1 : 1;
    const x = p.xc + side * (p.w / 2 - 0.9);
    r.hazards.push({ id: `lava-${i}`, x0: x - 0.9, x1: x + 0.9, z0: p.zc - p.d / 2 + 0.2, z1: p.zc + p.d / 2 - 0.2, y: p.y, kind: "lava" });
  }

  const xs = pads.flatMap((p) => [p.xc - p.w / 2, p.xc + p.w / 2]);
  const zs = pads.flatMap((p) => [p.zc - p.d / 2, p.zc + p.d / 2]);
  r.bounds = { x0: Math.min(...xs) - 6, x1: Math.max(...xs) + 6, z0: Math.min(...zs) - 6, z1: Math.max(...zs) + 6 };
  r.killY = Math.min(...pads.map((p) => p.y)) - KILL_Y_MARGIN;
  r.decor.push(...ambientDecor(ctx, r.bounds, r.killY + 4, 90).map((d) => ({ ...d, y: d.kind === "cloud" ? 2 + d.scale * 4 : d.y })));
  return r;
}

export const LAYOUT_BUILDERS = { plaza, corridor, rooms, lab, terraces } as const;

export type { WorldCheckpoint, WorldCollectible, WorldGate, WorldHazard };
export { dist2d, PLAYER_RADIUS };
