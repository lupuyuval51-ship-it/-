/**
 * Screen-reader support for the 3D scene: pure helpers that turn the player's position, the world layout and the
 * progress state into short sentences ("Terminal Loops, 4 m ahead and to the right"). Nothing here touches the DOM, and
 * it only uses what the browser already knows (public spec + world layout + progress), never an answer.
 */
import type { DictKey, TFn } from "@/lib/i18n";
import type { Interactable } from "@/lib/game/engine/runtime";
import type { PublicSpec } from "@/lib/game/spec/public";
import { stationActive, stationDone, missionUnlocked, objectiveProgress, portalOpen, type ClientState } from "@/lib/game/state/progress";
import type { GuideTarget } from "@/lib/game/state/guidance";
import type { WorldModel } from "@/lib/game/world/types";

export type RelDir = "ahead" | "aheadRight" | "right" | "behindRight" | "behind" | "behindLeft" | "left" | "aheadLeft";
const SECTORS: readonly RelDir[] = ["ahead", "aheadRight", "right", "behindRight", "behind", "behindLeft", "left", "aheadLeft"];

type Pt = { x: number; z: number };

/** Direction of `to` relative to where the camera looks. The camera looks along (−sin yaw, −cos yaw); its right is (cos yaw, −sin yaw). */
export function relativeDirection(from: Pt, yaw: number, to: Pt): RelDir {
  const dx = to.x - from.x, dz = to.z - from.z;
  const ahead = -Math.sin(yaw) * dx - Math.cos(yaw) * dz;
  const side = Math.cos(yaw) * dx - Math.sin(yaw) * dz;
  const angle = Math.atan2(side, ahead); // 0 = straight ahead, positive = to the right
  const sector = ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8;
  return SECTORS[sector]!;
}

export const metersBetween = (a: Pt, b: Pt): number => Math.max(0, Math.round(Math.hypot(a.x - b.x, a.z - b.z)));

// ───────────────────────── what is around the player ─────────────────────────

export type ScenePointKind = "station" | "lore" | "npc" | "boss" | "portal" | "collectible";
export interface ScenePoint {
  kind: ScenePointKind;
  id: string;
  label: string;
  x: number;
  z: number;
  /** Only for stations and portals. */
  status?: "done" | "locked" | "active" | "open";
}

/** Everything in the current area a player could walk to: stations, characters, the portal and loose pick-ups. */
export function scenePoints(spec: PublicSpec, client: ClientState, world: WorldModel, areaId: string): ScenePoint[] {
  const area = spec.areas.find((a) => a.id === areaId);
  const out: ScenePoint[] = [];
  for (const s of world.stations) {
    const def = area?.stations.find((x) => x.id === s.stationId);
    const status = stationDone(client, s.stationId) ? "done" : def && !stationActive(spec as never, client, def as never) ? "locked" : "active";
    out.push({ kind: s.kind === "lore" ? "lore" : "station", id: s.stationId, label: s.label, x: s.x, z: s.z, status });
  }
  for (const n of world.npcs) out.push({ kind: "npc", id: n.npcId, label: n.name, x: n.x, z: n.z });
  for (const b of world.bosses ?? []) out.push({ kind: "boss", id: b.bossId, label: b.name, x: b.x, z: b.z });
  if (world.portal && area) out.push({ kind: "portal", id: world.portal.toAreaId, label: world.portal.label, x: world.portal.x, z: world.portal.z, status: portalOpen(spec as never, client, area as never) ? "open" : "locked" });
  for (const c of world.collectibles) if (!client.collected.includes(c.itemId)) out.push({ kind: "collectible", id: c.itemId, label: "", x: c.x, z: c.z });
  return out;
}

const KIND_KEY: Record<ScenePointKind, DictKey> = {
  station: "a11y.kind.station", lore: "a11y.kind.lore", npc: "a11y.kind.npc", boss: "a11y.kind.boss", portal: "a11y.kind.portal", collectible: "a11y.kind.collectible",
};

/** "Terminal Loops (locked), 4 m ahead and to the right" */
export function describePoint(p: { kind: ScenePointKind; label: string; status?: ScenePoint["status"] }, from: Pt, yaw: number, to: Pt, t: TFn): string {
  const name = [t(KIND_KEY[p.kind]), p.label].filter(Boolean).join(" ");
  const status = p.status === "done" ? t("a11y.status.done") : p.status === "locked" ? t("a11y.status.locked") : "";
  return t("a11y.entry", { name: status ? `${name} (${status})` : name, meters: metersBetween(from, to), dir: t(`a11y.dir.${relativeDirection(from, yaw, to)}`) });
}

/** The full "what is around me" answer: the area, the nearest few things, loose pick-ups (counted, not listed) and the next objective. */
export function describeSurroundings(args: { points: ScenePoint[]; player: Pt; yaw: number; areaName: string; goal: GuideTarget | null; t: TFn; max?: number }): string {
  const { points, player, yaw, areaName, goal, t, max = 4 } = args;
  const named = points.filter((p) => p.kind !== "collectible").sort((a, b) => metersBetween(player, a) - metersBetween(player, b) || a.id.localeCompare(b.id));
  const parts: string[] = [];
  const list = named.slice(0, max).map((p) => describePoint(p, player, yaw, p, t));
  parts.push(list.length ? t("a11y.around", { area: areaName, list: list.join("; ") }) : t("a11y.around.none", { area: areaName }));
  const loose = points.filter((p) => p.kind === "collectible");
  if (loose.length) parts.push(t(loose.length === 1 ? "a11y.collectibles.one" : "a11y.collectibles", { n: loose.length }));
  if (goal) parts.push(t("a11y.goal", { entry: describePoint({ kind: goal.kind, label: goal.label }, player, yaw, goal, t) }));
  return parts.join(" ");
}

// ───────────────────────── interact prompt ─────────────────────────

/** Why a station is locked, naming the mission to finish next when missions lock it. */
export function lockedText(target: Extract<Interactable, { kind: "station" }>, t: TFn): string {
  if (target.lockedByBoss) return t("prompt.station.lockedBoss", { label: target.label });
  return target.blockedBy ? t("prompt.station.lockedBy", { label: target.label, mission: target.blockedBy }) : t("prompt.station.locked", { label: target.label });
}

/** The text of the interact prompt for a nearby target, and whether activating it does anything. */
export function interactablePrompt(target: Interactable, t: TFn): { text: string; enabled: boolean } {
  if (target.kind === "npc") return { text: t("prompt.npc", { label: target.label }), enabled: true };
  if (target.kind === "boss") return { text: t("prompt.boss", { label: target.label }), enabled: true };
  if (target.kind === "portal") return { text: target.open ? t("prompt.portal", { label: target.label }) : t("prompt.portal.locked", { label: target.label }), enabled: target.open };
  if (target.status === "done") return { text: t("prompt.station.done", { label: target.label }), enabled: true };
  if (target.status === "locked") return { text: lockedText(target, t), enabled: false };
  return { text: t(target.stationKind === "lore" ? "prompt.station.lore" : "prompt.station.active", { label: target.label }), enabled: true };
}

/** What the live region says when the player walks up to something. */
export function nearbyAnnouncement(target: Interactable, touch: boolean, t: TFn): string {
  const { text, enabled } = interactablePrompt(target, t);
  return enabled ? t(touch ? "a11y.nearby.touch" : "a11y.nearby", { text }) : text;
}

// ───────────────────────── objectives ─────────────────────────

export interface ObjectiveSnap {
  key: string;
  kind: "objective" | "mission";
  text: string;
  done: boolean;
  current: number;
  target: number;
}

/** A flat, comparable picture of mission progress. Only unlocked missions are included. */
export function objectiveSnapshot(spec: PublicSpec, client: ClientState): ObjectiveSnap[] {
  const out: ObjectiveSnap[] = [];
  for (const m of spec.missions) {
    const mDone = client.missionsDone.includes(m.id);
    if (!mDone && !missionUnlocked(client, m)) continue;
    out.push({ key: `mission:${m.id}`, kind: "mission", text: m.title, done: mDone, current: mDone ? 1 : 0, target: 1 });
    m.objectives.forEach((o, i) => {
      const p = objectiveProgress(spec as never, client, m as never, i);
      out.push({ key: `${m.id}:${i}`, kind: "objective", text: o.text, done: p.done, current: p.current, target: p.target });
    });
  }
  return out;
}

/** Sentences for everything that moved forward between two snapshots (completed missions, objectives, partial progress). */
export function objectiveChanges(prev: readonly ObjectiveSnap[], next: readonly ObjectiveSnap[], t: TFn): string[] {
  const before = new Map(prev.map((s) => [s.key, s]));
  const out: string[] = [];
  for (const n of next) {
    const p = before.get(n.key);
    if (!p) continue; // newly unlocked entries are not "progress"
    if (n.kind === "mission") {
      if (n.done && !p.done) out.push(t("a11y.mission.done", { title: n.text }));
    } else if (n.done && !p.done) out.push(t("a11y.objective.done", { text: n.text }));
    else if (!n.done && n.current > p.current) out.push(t("a11y.objective.progress", { text: n.text, current: n.current, target: n.target }));
  }
  return out;
}

// ───────────────────────── robot grid ─────────────────────────

export interface GridLike {
  width: number;
  height: number;
  goal: { x: number; y: number };
  walls: { x: number; y: number }[];
}

/** Text alternative for the program-builder grid: size, robot cell and facing, goal cell and the walls (1-based column/row, row 1 at the top). */
export function describeGrid(grid: GridLike, bot: { x: number; y: number }, dir: "N" | "E" | "S" | "W", t: TFn): string {
  const cell = (c: { x: number; y: number }) => t("a11y.grid.cell", { col: c.x + 1, row: c.y + 1 });
  const walls = [...grid.walls].sort((a, b) => a.y - b.y || a.x - b.x).map(cell);
  return [
    t("a11y.grid", { w: grid.width, h: grid.height }),
    t("a11y.grid.bot", { cell: cell(bot), dir: t(`a11y.grid.dir.${dir}`) }),
    t("a11y.grid.goal", { cell: cell(grid.goal) }),
    walls.length ? t("a11y.grid.walls", { list: walls.join(", ") }) : t("a11y.grid.noWalls"),
  ].join(" ");
}

// ───────────────────────── keyboard models ─────────────────────────

/** Next index for an arrow key inside a radio group (wraps). Left/Right follow the reading direction. Returns null for other keys. */
export function radioStep(key: string, index: number, count: number, rtl: boolean): number | null {
  if (count <= 0) return null;
  let delta: number;
  if (key === "ArrowDown") delta = 1;
  else if (key === "ArrowUp") delta = -1;
  else if (key === "ArrowRight") delta = rtl ? -1 : 1;
  else if (key === "ArrowLeft") delta = rtl ? 1 : -1;
  else if (key === "Home") return 0;
  else if (key === "End") return count - 1;
  else return null;
  return (((index + delta) % count) + count) % count;
}

/** Roving tab stop: the checked radio, or the first one while none is checked. */
export const radioTabIndex = (index: number, checkedIndex: number): 0 | -1 => (checkedIndex >= 0 ? (index === checkedIndex ? 0 : -1) : index === 0 ? 0 : -1);

/** Focus-trap target for Tab: where focus must go so it cannot leave the dialog. `null` = let the browser move focus normally, -1 = keep it on the container. */
export function trapTarget(shift: boolean, activeIndex: number, count: number): number | null {
  if (count === 0) return -1;
  if (activeIndex < 0) return shift ? count - 1 : 0; // focus is outside the dialog
  if (shift && activeIndex === 0) return count - 1;
  if (!shift && activeIndex === count - 1) return 0;
  return null;
}
