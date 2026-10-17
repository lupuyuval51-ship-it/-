/**
 * GameRuntime: headless orchestration of one area — world + physics + interactions + pickups + checkpoints.
 * The React/three.js layer only renders it and forwards input; all rules live here (and are unit-tested).
 */
import { mechanicsForArea } from "../spec/mechanics";
import type { PublicSpec } from "../spec/public";
import { bossPhaseOpen, portalOpen, stationActive, stationDone, type ClientState } from "../state/progress";
import { buildWorld } from "../world/build";
import type { WorldModel } from "../world/types";
import { INTERACT_RADIUS, PICKUP_RADIUS } from "./constants";
import { WorldSim, type SimInput } from "./sim";

export type Interactable =
  | { kind: "station"; id: string; label: string; stationKind: "challenge" | "lore"; status: "active" | "locked" | "done"; /** Locked because an earlier round of a boss battle is still open. */ lockedByBoss?: boolean; x: number; z: number }
  | { kind: "npc"; id: string; label: string; x: number; z: number }
  | { kind: "boss"; id: string; label: string; x: number; z: number }
  | { kind: "portal"; id: string; label: string; open: boolean; x: number; z: number };

export interface RuntimeCallbacks {
  onNearbyChange?(target: Interactable | null): void;
  onCollect?(itemId: string): void;
  onCheckpoint?(id: string, pos: { x: number; y: number; z: number; yaw: number }): void;
  onRespawn?(reason: "fell" | "hazard"): void;
  onJump?(): void;
  onLand?(): void;
  /** A footstep, fired once per stride while walking or running on the ground. */
  onStep?(fast: boolean): void;
  /** A gate opened because the last station it was waiting for was completed (not fired for gates already open on load). */
  onGateOpen?(gate: { id: string; x: number; y: number; z: number }): void;
}

const NO_INPUT: SimInput = { moveX: 0, moveY: 0, jump: false, sprint: false };

export class GameRuntime {
  readonly spec: PublicSpec;
  readonly areaId: string;
  readonly world: WorldModel;
  readonly sim: WorldSim;
  client: ClientState;
  nearby: Interactable | null = null;
  paused = false;
  private cb: RuntimeCallbacks;
  private pendingCollect = new Set<string>();
  private strideDist = 0;
  private currentCheckpoint: string | null = null;
  private openGates = new Set<string>();
  private gateCache = new Map<string, boolean>();
  private gateCacheFor: ClientState | null = null;
  private areaDef: PublicSpec["areas"][number] | undefined;
  /** False until the first client state arrives, so gates that are already open on load do not "open" again. */
  private ready = false;
  readonly jumpEnabled: boolean;

  constructor(spec: PublicSpec, areaId: string, client: ClientState, cb: RuntimeCallbacks = {}) {
    this.spec = spec;
    this.areaId = areaId;
    this.client = client;
    this.cb = cb;
    this.world = buildWorld(spec, areaId);
    const mech = mechanicsForArea(spec, areaId);
    // Platformer worlds always need jumping; elsewhere it is an opt-in mechanic.
    this.jumpEnabled = mech.has("jump") || this.world.hasVoid;
    this.sim = new WorldSim(this.world, { jumpEnabled: this.jumpEnabled, gateOpen: (id) => this.gateOpen(id) });
    const saved = client.areaId === areaId ? client.position : null;
    if (saved) {
      this.sim.teleport(saved.x, saved.y, saved.z);
      this.sim.player.yaw = saved.yaw;
      this.sim.player.grounded = false;
    }
    const cp = client.checkpoint && client.checkpoint.areaId === areaId ? client.checkpoint : null;
    if (cp) {
      this.sim.setCheckpoint({ x: cp.x, y: cp.y, z: cp.z });
      this.currentCheckpoint = cp.id;
    }
  }

  setClientState(client: ClientState): void {
    this.client = client;
    for (const id of client.collected) this.pendingCollect.delete(id);
    for (const g of this.world.gates) {
      const open = this.gateOpen(g.id);
      if (open && !this.openGates.has(g.id)) {
        this.openGates.add(g.id);
        const box = this.world.boxes.find((b) => b.gateId === g.id);
        if (box && this.ready) this.cb.onGateOpen?.({ id: g.id, x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2, z: (box.z0 + box.z1) / 2 });
      } else if (!open) this.openGates.delete(g.id);
    }
    this.ready = true;
  }

  /**
   * Whether a gate is open. Asked many times per frame (every substep of the simulation, the camera, every gate mesh), so the
   * answers are kept per client state and recomputed only when `client` is a different object.
   */
  gateOpen(gateId: string): boolean {
    if (this.gateCacheFor !== this.client) {
      this.gateCacheFor = this.client;
      this.gateCache.clear();
    }
    const hit = this.gateCache.get(gateId);
    if (hit !== undefined) return hit;
    const gate = this.world.gates.find((g) => g.id === gateId);
    const open = !gate || gate.opensWhenStationsDone.every((sid) => stationDone(this.client, sid));
    this.gateCache.set(gateId, open);
    return open;
  }

  isCollected(itemId: string): boolean {
    return this.client.collected.includes(itemId) || this.pendingCollect.has(itemId);
  }

  /**
   * The closest thing the player can use, run every frame. Distance is tested first: the progress rules (`stationActive`
   * walks every mission) and the result object are only evaluated for what is actually in reach, and only when it beats the
   * best so far, instead of for every station, character and portal of the area 60 times a second.
   */
  private computeNearby(): Interactable | null {
    const p = this.sim.player;
    let best: Interactable | null = null;
    let bestD = Infinity;
    const area = (this.areaDef ??= this.spec.areas.find((a) => a.id === this.areaId)!);
    for (const s of this.world.stations) {
      const d = Math.hypot(p.x - s.x, p.z - s.z);
      if (d > INTERACT_RADIUS || Math.abs(p.y - s.y) > 2.6 || (best && d >= bestD)) continue;
      const def = area.stations.find((x) => x.id === s.stationId)!;
      const done = stationDone(this.client, s.stationId);
      const status = done ? "done" : stationActive(this.spec, this.client, def) ? "active" : "locked";
      best = { kind: "station", id: s.stationId, label: s.label, stationKind: s.kind, status, lockedByBoss: status === "locked" && !bossPhaseOpen(this.spec, this.client, s.stationId), x: s.x, z: s.z };
      bestD = d;
    }
    for (const n of this.world.npcs) {
      const d = Math.hypot(p.x - n.x, p.z - n.z);
      if (d > INTERACT_RADIUS || Math.abs(p.y - n.y) > 2.6 || (best && d >= bestD)) continue;
      best = { kind: "npc", id: n.npcId, label: n.name, x: n.x, z: n.z };
      bestD = d;
    }
    for (const b of this.world.bosses) {
      const d = Math.hypot(p.x - b.x, p.z - b.z);
      if (d > INTERACT_RADIUS || Math.abs(p.y - b.y) > 2.6 || (best && d >= bestD)) continue;
      best = { kind: "boss", id: b.bossId, label: b.name, x: b.x, z: b.z };
      bestD = d;
    }
    const portal = this.world.portal;
    if (portal) {
      const d = Math.hypot(p.x - portal.x, p.z - portal.z);
      if (!(d > INTERACT_RADIUS || Math.abs(p.y - portal.y) > 2.6 || (best && d >= bestD))) {
        best = { kind: "portal", id: portal.toAreaId, label: portal.label, open: portalOpen(this.spec, this.client, area), x: portal.x, z: portal.z };
      }
    }
    return best;
  }

  update(dt: number, input: SimInput = NO_INPUT, camYaw = 0): void {
    if (this.paused) return;
    const ev = this.sim.step(dt, input, camYaw);
    if (ev.jumped) this.cb.onJump?.();
    if (ev.landed) this.cb.onLand?.();
    if (ev.respawned) this.cb.onRespawn?.(ev.respawned);
    const p = this.sim.player;
    if (p.grounded && p.speed > 0.5) {
      this.strideDist += p.speed * Math.min(dt, 0.1);
      const stride = p.speed > 7 ? 2.2 : 1.6;
      if (this.strideDist >= stride) {
        this.strideDist -= stride;
        this.cb.onStep?.(p.speed > 7);
      }
    } else {
      this.strideDist = 0;
    }

    for (const c of this.world.collectibles) {
      // the cheap distance test first: `isCollected` searches the list of everything collected so far
      if (!(Math.hypot(p.x - c.x, p.z - c.z) <= PICKUP_RADIUS && Math.abs(p.y + 0.8 - c.y) <= 1.7)) continue;
      if (this.isCollected(c.itemId)) continue;
      this.pendingCollect.add(c.itemId);
      this.cb.onCollect?.(c.itemId);
    }
    for (const cp of this.world.checkpoints) {
      if (cp.checkpointId === this.currentCheckpoint) continue;
      if (Math.hypot(p.x - cp.x, p.z - cp.z) <= 2.2 && Math.abs(p.y - cp.y) <= 1.5) {
        this.currentCheckpoint = cp.checkpointId;
        this.sim.setCheckpoint({ x: cp.x, y: cp.y, z: cp.z });
        this.cb.onCheckpoint?.(cp.checkpointId, { x: cp.x, y: cp.y, z: cp.z, yaw: p.yaw });
      }
    }

    const next = this.computeNearby();
    const changed = next?.kind !== this.nearby?.kind || next?.id !== this.nearby?.id || (next?.kind === "station" && this.nearby?.kind === "station" && next.status !== this.nearby.status);
    this.nearby = next;
    if (changed) this.cb.onNearbyChange?.(next);
  }

  /** Re-evaluate what is in reach after state changed (e.g. a station became done). */
  refreshNearby(): void {
    const next = this.computeNearby();
    this.nearby = next;
    this.cb.onNearbyChange?.(next);
  }

  /** Position snapshot for autosave / resume. */
  snapshot(): { x: number; y: number; z: number; yaw: number } {
    const p = this.sim.player;
    return { x: p.x, y: p.y, z: p.z, yaw: p.yaw };
  }
}
