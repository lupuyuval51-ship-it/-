import * as THREE from "three";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RENDER_PROFILES } from "@/config/graphics";
import { humanLook } from "@/components/game/scene/Characters";
import { SPIN_FAR, SPIN_NEAR, nextSpin, pickupGeometry, startsBurst } from "@/components/game/scene/Collectibles";
import { createMaterialSet } from "@/components/game/scene/materials";
import { GameRuntime } from "@/lib/game/engine/runtime";
import { toPublicSpec } from "@/lib/game/spec/public";
import { initialState, toClientState } from "@/lib/game/state/progress";
import { validDemoSpec } from "./helpers";

afterEach(() => vi.restoreAllMocks());

// ───────────────────────── the pick-up burst plays for a pick-up, not for a world that loads ─────────────────────────

describe("the pick-up burst", () => {
  const spec = toPublicSpec(validDemoSpec({ gameType: "exploration", mode: "FULL" }));
  const fresh = toClientState(initialState(spec as never, 0));
  const areaId = spec.areas[0]!.id;

  /** What CollectibleView does: `was` starts from the state at its first draw, then each frame asks `startsBurst`. */
  function view(rt: GameRuntime, itemId: string) {
    let was = rt.isCollected(itemId);
    let wasFor = rt;
    return (now: GameRuntime = rt): boolean => {
      const collected = now.isCollected(itemId);
      const burst = startsBurst(wasFor === now ? was : null, collected);
      was = collected;
      wasFor = now;
      return burst;
    };
  }

  it("an item collected in an earlier session never bursts when the game is resumed (it used to, every one of them at once)", () => {
    const probe = new GameRuntime(spec, areaId, fresh);
    const items = probe.world.collectibles.map((c) => c.itemId);
    expect(items.length).toBeGreaterThan(1);
    const resumed = { ...fresh, collected: items.slice(0, 2) };
    const rt = new GameRuntime(spec, areaId, resumed);
    const frames = items.map((id) => view(rt, id));
    for (let f = 0; f < 5; f++) {
      rt.update(1 / 60);
      expect(frames.map((frame) => frame())).toEqual(items.map(() => false));
    }
  });

  it("an item picked up now bursts exactly once; picked up again after a failed event, it bursts again", () => {
    const rt = new GameRuntime(spec, areaId, fresh);
    const gem = rt.world.collectibles[0]!;
    const frame = view(rt, gem.itemId);
    expect(frame()).toBe(false);
    rt.sim.teleport(gem.x, gem.y - 0.8, gem.z);
    rt.update(1 / 60);
    expect(frame()).toBe(true);
    rt.update(1 / 60);
    expect(frame()).toBe(false);
    rt.forgetPending(gem.itemId); // the event failed: the item is back
    expect(frame()).toBe(false);
    rt.sim.teleport(gem.x, gem.y - 0.8, gem.z);
    rt.update(1 / 60);
    expect(frame()).toBe(true);
  });

  it("a pick-up on the very first frame still bursts, because the view looked before that frame", () => {
    const rt = new GameRuntime(spec, areaId, fresh);
    const gem = rt.world.collectibles[0]!;
    const frame = view(rt, gem.itemId); // drawn (rendered) before the first frame runs
    rt.sim.teleport(gem.x, gem.y - 0.8, gem.z);
    rt.update(1 / 60); // the runtime's own frame runs first
    expect(frame()).toBe(true);
  });

  it("a view handed a new runtime does not take that runtime's collected items for pick-ups", () => {
    const rt = new GameRuntime(spec, areaId, fresh);
    const gem = rt.world.collectibles[0]!;
    const frame = view(rt, gem.itemId);
    expect(frame()).toBe(false);
    const next = new GameRuntime(spec, areaId, { ...fresh, collected: [gem.itemId] });
    expect(frame(next)).toBe(false);
    expect(frame(next)).toBe(false);
  });

  it("startsBurst: only a change from not collected to collected", () => {
    expect(startsBurst(false, true)).toBe(true);
    expect(startsBurst(true, true)).toBe(false);
    expect(startsBurst(null, true)).toBe(false);
    expect(startsBurst(false, false)).toBe(false);
    expect(startsBurst(true, false)).toBe(false);
    expect(startsBurst(null, false)).toBe(false);
  });
});

// ───────────────────────── the spin speeds up near the player without jumping ─────────────────────────

describe("the spin of a pick-up", () => {
  const shortest = (a: number, b: number) => {
    const d = (((b - a) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
    return Math.abs(d);
  };

  it("starts where a pick-up far away always was, and keeps that pace while nobody comes near", () => {
    const dt = 1 / 60;
    let t = 37.5;
    let a = nextSpin(null, t, dt, false);
    expect(a).toBeCloseTo(t * SPIN_FAR, 10);
    for (let i = 0; i < 600; i++) {
      t += dt;
      a = nextSpin(a, t, dt, false);
    }
    expect(a).toBeCloseTo(t * SPIN_FAR, 6);
  });

  it("walking in and out of the 3 m ring never turns it by more than one frame at the fast speed", () => {
    const dt = 1 / 60;
    let t = 120;
    let a = nextSpin(null, t, dt, false);
    let worstOld = 0;
    for (let i = 1; i < 60 * 20; i++) {
      t += dt;
      const near = Math.floor(i / 37) % 2 === 1; // in and out every 37 frames
      const b = nextSpin(a, t, dt, near);
      expect(shortest(a, b)).toBeLessThanOrEqual(SPIN_NEAR * dt + 1e-9);
      a = b;
      const wasNear = Math.floor((i - 1) / 37) % 2 === 1;
      worstOld = Math.max(worstOld, shortest(t * (wasNear ? SPIN_NEAR : SPIN_FAR) - dt * (wasNear ? SPIN_NEAR : SPIN_FAR), t * (near ? SPIN_NEAR : SPIN_FAR)));
    }
    // the old angle (time × speed) jumped by a large angle at the edge of the ring
    expect(worstOld).toBeGreaterThan(0.5);
  });
});

// ───────────────────────── shapes shared by every pick-up of a kind ─────────────────────────

describe("pick-up geometry", () => {
  it("one star, one leaf and one set of data-core edges for every pick-up of that kind", () => {
    for (const kind of ["star", "leaf", "data-core"] as const) {
      const g = pickupGeometry(kind)!;
      expect(g, kind).toBeInstanceOf(THREE.BufferGeometry);
      expect(pickupGeometry(kind), kind).toBe(g);
      expect(g.getAttribute("position").count, kind).toBeGreaterThan(0);
    }
    expect(pickupGeometry("gem")).toBeNull();
    expect(pickupGeometry("coin")).toBeNull();
  });

  it("keeps the shapes they had: centred star and leaf of the same size, the 12 edges of a 0.5 m cube", () => {
    for (const [kind, w, h] of [["star", 0.47, 0.42], ["leaf", 0.4, 0.88]] as const) {
      const g = pickupGeometry(kind)!;
      g.computeBoundingBox();
      const box = g.boundingBox!;
      const c = box.getCenter(new THREE.Vector3());
      expect(c.length(), kind).toBeLessThan(1e-6);
      const size = box.getSize(new THREE.Vector3());
      expect(size.x, kind).toBeGreaterThan(w * 0.9);
      expect(size.y, kind).toBeGreaterThan(h * 0.9);
    }
    const edges = pickupGeometry("data-core")!;
    expect(edges.getAttribute("position").count).toBe(24);
    edges.computeBoundingBox();
    expect(edges.boundingBox!.getSize(new THREE.Vector3()).toArray()).toEqual([0.5, 0.5, 0.5]);
  });
});

// ───────────────────────── human characters: the look players know, without an undefined colour ─────────────────────────

describe("humanLook", () => {
  const SKIN = ["#f1c9a5", "#e0a97d", "#c68863", "#a46a45", "#7a4a2e", "#fbd9c0"];
  const HAIR = ["#2b1d14", "#5a3a22", "#a0522d", "#d9b36c", "#1c1c28", "#8a8f99"];
  function hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  const ids = [...Array.from({ length: 120 }, (_, i) => `n-${i}`), "guide", "mentor", "boss", "boss-1", "sage", "npc-1", "npc-2-0", "teacher"];

  it("draws every character exactly as before: same skin, hair, style and glasses (white where the palette was missed)", () => {
    for (const id of ids) {
      const h = hash(id);
      const look = humanLook(id);
      expect(look.skin, id).toBe(SKIN[h % SKIN.length]);
      expect(look.hair, id).toBe(HAIR[(h >> 3) % HAIR.length] ?? "#ffffff");
      expect(look.style === 0, id).toBe((h >> 6) % 4 === 0);
      expect(look.style, id).toBe((h >> 6) % 4);
      expect(look.glasses, id).toBe((h >> 9) % 3 === 0);
    }
  });

  it("never hands a material an undefined colour (three.js warned and drew it white)", () => {
    const theme = new GameRuntime(toPublicSpec(validDemoSpec({ gameType: "adventure", mode: "FULL" })), "a-plaza", toClientState(initialState(toPublicSpec(validDemoSpec({ gameType: "adventure", mode: "FULL" })) as never, 0))).world.theme;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const tier of ["B", "C"] as const) {
      const set = createMaterialSet(RENDER_PROFILES[tier], theme);
      try {
        for (const id of ids) {
          const look = humanLook(id);
          expect(look.hair, id).toMatch(/^#[0-9a-f]{6}$/);
          expect(look.skin, id).toMatch(/^#[0-9a-f]{6}$/);
          expect([0, 1, 2, 3, -1, -2, -3]).toContain(look.style);
          set.solid(look.hair, { rough: 0.8 });
          set.solid(look.skin, { rough: 0.7 });
        }
      } finally {
        set.dispose();
      }
    }
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("undefined"))).toEqual([]);
  });

  it("is fixed by the id", () => {
    for (const id of ids) expect(humanLook(id)).toEqual(humanLook(id));
  });
});
