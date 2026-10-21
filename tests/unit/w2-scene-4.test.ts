import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RENDER_PROFILES, type RenderProfile } from "@/config/graphics";
import type { GraphicsTier } from "@/config/plans";
import { MEMOISED_VIEWS, bossBar, portalIsOpen } from "@/components/game/scene/Entities";
import { MATERIAL_PROFILE_FIELDS, materialProfileFor } from "@/components/game/scene/GameCanvas";
import { GameRuntime } from "@/lib/game/engine/runtime";
import { addFinalBoss } from "@/lib/game/spec/boss";
import { toPublicSpec } from "@/lib/game/spec/public";
import { bossProgress, initialState, portalOpen, toClientState, type ClientState } from "@/lib/game/state/progress";
import { validDemoSpec } from "./helpers";

const TIERS: GraphicsTier[] = ["A", "B", "C"];
const scene = (file: string) => readFileSync(path.join(import.meta.dirname, "../../src/components/game/scene", file), "utf8");

/** The calmer profile the play screen hands the canvas when "reduce motion" is on (PlayClient's `sceneProfile`). */
const calmer = (p: RenderProfile): RenderProfile => ({ ...p, particles: { ambient: 0, burst: Math.min(p.particles.burst, 6), trails: false } });

// ───────────────────────── the material set is not rebuilt for a profile that only differs elsewhere ─────────────────────────

describe("materialProfileFor", () => {
  it("keeps the profile the set was built from when reduce motion is switched on or off (every tier)", () => {
    for (const t of TIERS) {
      const base = RENDER_PROFILES[t];
      const calm = calmer(base);
      expect(calm).not.toBe(base); // a new object of the same tier: what used to rebuild every material
      expect(materialProfileFor(base, calm), t).toBe(base);
      expect(materialProfileFor(base, { ...base }), t).toBe(base);
      // ...and back again
      expect(materialProfileFor(calm, base), t).toBe(calm);
    }
  });

  it("ignores every field the material set does not read (particles, shadows, lights, exposure, resolution)", () => {
    const base = RENDER_PROFILES.A;
    const other: RenderProfile = { ...base, shadows: { enabled: false, type: "none", mapSize: 0, casters: 0 }, accentLights: 0, exposure: base.exposure + 0.3, pixelRatioMax: 1, glow: false };
    expect(materialProfileFor(base, other)).toBe(base);
  });

  it("builds from the new profile when a field the set reads changes, and when nothing was built yet", () => {
    for (const a of TIERS) for (const b of TIERS) {
      if (a === b) continue;
      const differs = MATERIAL_PROFILE_FIELDS.some((f) => RENDER_PROFILES[a][f] !== RENDER_PROFILES[b][f]);
      expect(materialProfileFor(RENDER_PROFILES[a], RENDER_PROFILES[b])).toBe(differs ? RENDER_PROFILES[b] : RENDER_PROFILES[a]);
    }
    for (const f of MATERIAL_PROFILE_FIELDS) {
      const base = RENDER_PROFILES.A;
      const changed = { ...base, [f]: f === "textureSize" ? 64 : "standard" } as RenderProfile;
      expect(materialProfileFor(base, changed), f).toBe(changed);
    }
    expect(materialProfileFor(null, RENDER_PROFILES.B)).toBe(RENDER_PROFILES.B);
  });

  it("lists every profile field materials.ts reads (a new one must be added, or the set would keep stale materials)", () => {
    const read = new Set([...scene("materials.ts").matchAll(/\bprofile\.(\w+)/g)].map((m) => m[1]!));
    expect(read.size).toBeGreaterThan(0);
    for (const f of read) expect(MATERIAL_PROFILE_FIELDS as readonly string[], `materials.ts reads profile.${f}`).toContain(f);
  });

  it("the canvas builds its material set through materialProfileFor, not from every new profile object", () => {
    const src = scene("GameCanvas.tsx");
    expect(src).toMatch(/materialProfileFor\(built, tierProfile\)/);
    expect(src).toMatch(/createMaterialSet\(materialProfile, theme\), \[materialProfile, theme\]/);
    expect(src).not.toMatch(/createMaterialSet\(tierProfile/);
  });
});

// ───────────────────────── the boss bar and the portal follow the shared rules, as plain values ─────────────────────────

describe("bossBar", () => {
  const base = validDemoSpec({ gameType: "adventure", mode: "FULL" });
  const withBoss = addFinalBoss(base);
  if (!withBoss.added) throw new Error(withBoss.notes.join("; "));
  const spec = toPublicSpec(withBoss.spec);
  const boss = spec.bosses![0]!;
  const fresh = toClientState(initialState(withBoss.spec, 0));
  const resolve = (c: ClientState, ids: string[], how: "correct" | "revealed" = "correct"): ClientState => ({
    ...c, resolvedStations: { ...c.resolvedStations, ...Object.fromEntries(ids.map((id) => [id, how])) },
  });

  it("is full before the battle and loses one segment per round won, in step with bossProgress", () => {
    const n = boss.phaseStationIds.length;
    expect(n).toBeGreaterThan(0);
    for (let k = 0; k <= n; k++) {
      const c = resolve(fresh, boss.phaseStationIds.slice(0, k));
      const p = bossProgress(boss, c);
      expect(bossBar(spec, boss.id, c)).toEqual({ total: n, left: n - k, defeated: k === n });
      expect(p.total - p.done).toBe(n - k);
    }
  });

  it("a round resolved by revealing the answer counts as the rule says (the battle the server grades)", () => {
    const c = resolve(fresh, boss.phaseStationIds, "revealed");
    expect(bossBar(spec, boss.id, c)).toEqual({ total: boss.phaseStationIds.length, left: 0, defeated: bossProgress(boss, c).defeated });
  });

  it("an unknown boss draws one full segment (what the scene drew before)", () => {
    expect(bossBar(spec, "no-such-boss", fresh)).toEqual({ total: 1, left: 1, defeated: false });
    expect(bossBar({ bosses: undefined } as never, boss.id, fresh)).toEqual({ total: 1, left: 1, defeated: false });
  });

  it("progress elsewhere (a pick-up, a talk, a station outside the battle) leaves the bar's values equal, so the boss is not drawn again", () => {
    const before = bossBar(spec, boss.id, fresh);
    const other = spec.areas.flatMap((a) => a.stations).find((s) => !boss.phaseStationIds.includes(s.id))!;
    const later: ClientState = { ...resolve(fresh, [other.id]), collected: ["x:c0"], talked: ["npc"] };
    const after = bossBar(spec, boss.id, later);
    expect(Object.entries(after)).toEqual(Object.entries(before));
  });
});

describe("portalIsOpen", () => {
  const spec = toPublicSpec(validDemoSpec({ gameType: "adventure", mode: "FULL" }));
  const fresh = toClientState(initialState(spec as never, 0));

  it("agrees with the runtime's interaction prompt for every area, locked and open", () => {
    let seen = 0;
    for (const area of spec.areas) {
      if (!area.portal) {
        expect(portalIsOpen(spec, area.id, fresh)).toBe(false);
        continue;
      }
      seen++;
      for (const c of [fresh, { ...fresh, missionsDone: [...area.portal.requiresMissionIds] }]) {
        const rt = new GameRuntime(spec, area.id, c);
        rt.setClientState(c);
        const portal = rt.world.portal!;
        rt.sim.teleport(portal.x, portal.y, portal.z);
        rt.update(1 / 60);
        const prompt = rt.nearby;
        expect(prompt?.kind, area.id).toBe("portal");
        expect(portalIsOpen(spec, area.id, c), area.id).toBe(prompt?.kind === "portal" && prompt.open);
        expect(portalIsOpen(spec, area.id, c)).toBe(portalOpen(spec, c, area));
      }
      // with every mission it waits for done it is open; before that only a portal that waits for nothing is
      expect(portalIsOpen(spec, area.id, { ...fresh, missionsDone: [...area.portal.requiresMissionIds] })).toBe(true);
      expect(portalIsOpen(spec, area.id, fresh)).toBe(area.portal.requiresMissionIds.length === 0);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("an area that is not in the game has no open portal (instead of throwing while the scene is drawn)", () => {
    expect(portalIsOpen(spec, "no-such-area", fresh)).toBe(false);
  });
});

// ───────────────────────── the views that take no progress state are memoised ─────────────────────────

describe("Entities memoises what does not follow progress", () => {
  const MEMO = Symbol.for("react.memo");

  for (const [name, view] of Object.entries(MEMOISED_VIEWS)) {
    it(`${name} is wrapped in memo`, () => {
      expect((view as unknown as { $$typeof: symbol }).$$typeof).toBe(MEMO);
    });
  }

  it("the scene draws the memoised views, and none of them is handed the whole progress state", () => {
    const src = scene("Entities.tsx");
    const body = src.slice(src.indexOf("export function Entities("));
    for (const name of Object.keys(MEMOISED_VIEWS)) {
      expect(body, name).toContain(`<${name}Memo `);
      expect(body, name).not.toMatch(new RegExp(`<${name}[ />]`));
      const tag = new RegExp(`<${name}Memo [^>]*>`).exec(body)?.[0] ?? "";
      expect(tag, name).not.toMatch(/\bclient=/);
    }
  });
});
