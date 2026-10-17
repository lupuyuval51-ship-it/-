import { describe, expect, it } from "vitest";
import { OfflineError, type OfflineStore } from "@/lib/offline/store";
import { createBackup, serializeBackup } from "@/lib/offline/backup";
import { findArea } from "@/lib/game/state/progress";
import { FakeCloud, phone, populated, PREFIX } from "./offline-helpers";
import { randomAction, rng } from "./random-play";

const SEEDS = Number(process.env.FUZZ_SEEDS ?? 40);
type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Damage one stored value the way storage really gets damaged: cut off, emptied, or valid JSON of the wrong shape. */
function damage(raw: string, rand: () => number): string {
  const roll = rand();
  if (roll < 0.25) return raw.slice(0, Math.floor(rand() * raw.length)); // cut off
  if (roll < 0.35) return "";
  if (roll < 0.45) return "null";
  if (roll < 0.55) return JSON.stringify([rand(), "x"]);
  if (roll < 0.65) return JSON.stringify("text");
  // valid JSON with some parts of the right object replaced
  let value: Json;
  try { value = JSON.parse(raw) as Json; } catch { return raw; }
  const nodes: { parent: Json[] | { [k: string]: Json }; key: string | number }[] = [];
  const walk = (v: Json) => {
    if (Array.isArray(v)) v.forEach((c, i) => { nodes.push({ parent: v, key: i }); walk(c); });
    else if (v && typeof v === "object") for (const k of Object.keys(v)) { nodes.push({ parent: v, key: k }); walk(v[k]!); }
  };
  walk(value);
  if (nodes.length === 0) return raw;
  const wild: Json[] = [null, true, -1, 0, 1.5, 1e308, "", "x", [], {}, [1, 2, 3], { a: 1 }];
  for (let n = 1 + Math.floor(rand() * 3); n > 0; n--) {
    const target = nodes[Math.floor(rand() * nodes.length)]!;
    const p = target.parent as Record<string | number, Json>;
    if (rand() < 0.4) { if (Array.isArray(p)) p.splice(target.key as number, 1); else delete p[target.key]; } else p[target.key] = wild[Math.floor(rand() * wild.length)]!;
  }
  return JSON.stringify(value);
}

/** Everything the screens do with the store, read-only or harmless. Nothing here may throw except a typed OfflineError. */
async function exerciseEverything(store: OfflineStore, kv: ReturnType<typeof phone>["kv"], rand: () => number): Promise<string[]> {
  const seen: string[] = [];
  const attempt = (label: string, fn: () => unknown) => {
    try { fn(); seen.push(label); } catch (e) {
      if (!(e instanceof OfflineError)) throw new Error(`${label}: ${e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e)}`);
    }
  };
  attempt("list", () => store.listGames());
  attempt("deck", () => store.deckSummary());
  attempt("deckStart", () => store.deckPractice({ action: "start" }));
  attempt("export", () => createBackup(store));
  attempt("serialize", () => serializeBackup(createBackup(store)));
  attempt("changes", () => store.changesSince(0));
  attempt("integrity", () => store.integrity());
  attempt("usage", () => store.storageUsage());
  attempt("recover", () => store.recover());
  for (const g of store.listGames()) {
    attempt("getGame", () => store.getGame(g.id));
    attempt("start", () => {
      const s = store.startSession(g.id, rand() < 0.3);
      const area = findArea(store.getGame(g.id)!.spec, s.client.areaId);
      if (area?.npcs[0]) store.applyEvent(s.session.id, { type: "talk", npcId: area.npcs[0].id });
    });
    if (g.lastSessionId) {
      attempt("results", () => store.results(g.lastSessionId!));
      attempt("practice", () => store.practice(g.lastSessionId!, { action: "start" }));
      attempt("applyEvent", () => store.applyEvent(g.lastSessionId!, { type: "visit", stationId: "nope" }));
    }
  }
  const cloud = new FakeCloud();
  cloud.tick = 1_000_000;
  try {
    const { syncOnce } = await import("@/lib/offline/sync");
    await syncOnce(store, kv, cloud, "u1", () => 2_000_000);
    seen.push("sync");
  } catch (e) {
    throw new Error(`sync: ${e instanceof Error ? `${e.name}: ${e.message}\n${e.stack}` : String(e)}`);
  }
  return seen;
}

describe("whatever damage the stored data has taken, the app keeps working", () => {
  it("random damage to random stored values never makes a screen's call throw anything but a typed error", async () => {
    let healthyCalls = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const rand = rng(seed);
      const ctx = populated();
      for (let i = 0; i < 8; i++) { ctx.t.now += 1000; randomAction(ctx.store, rand); }
      const keys = ctx.kv.keys!().filter((k) => k.startsWith(PREFIX));
      const victims = Array.from({ length: 1 + Math.floor(rand() * 4) }, () => keys[Math.floor(rand() * keys.length)]!);
      for (const k of victims) ctx.kv.set(k, damage(ctx.kv.get(k) ?? "", rand));
      const seen = await exerciseEverything(ctx.store, ctx.kv, rand).catch((e: unknown) => { throw new Error(`seed ${seed}, damaged ${victims.map((v) => v.slice(PREFIX.length)).join(", ")}: ${e instanceof Error ? e.message : String(e)}`); });
      healthyCalls += seen.length;
    }
    expect(healthyCalls).toBeGreaterThan(SEEDS * 8);
  });

  it("a library where every stored value is garbage is simply empty, and a new game can still be added", async () => {
    const ctx = populated();
    for (const k of ctx.kv.keys!().filter((x) => x.startsWith(PREFIX))) ctx.kv.set(k, "\u0000garbage{[");
    expect(ctx.store.listGames()).toEqual([]);
    await exerciseEverything(ctx.store, ctx.kv, rng(1));
    const g = ctx.store.addGame(populated().game.spec);
    expect(ctx.store.listGames().map((x) => x.id)).toEqual([g.id]);
  });
});
