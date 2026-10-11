import { describe, expect, it } from "vitest";
import {
  BACKUP_ERROR_CODES, BACKUP_FORMAT, BackupError, createBackup, fileTooLarge, importBackup, MAX_BACKUP_BYTES, MAX_BACKUP_FILE_BYTES, MAX_GAMES, MAX_SESSIONS, parseBackup, serializeBackup,
  type BackupFile,
} from "@/lib/offline/backup";
import { DICTIONARIES } from "@/lib/i18n";
import { getOfflineTier } from "@/lib/offline/entitlement";
import { generateOffline } from "@/lib/offline/generate";
import { checkGameRecord, revalidateSpec } from "@/lib/offline/records";
import { memoryKV, OfflineStore } from "@/lib/offline/store";
import { validateGameSpec } from "@/lib/game/spec/validate";
import { request } from "./helpers";
import { editStored, flakyKV, phone, populated, PREFIX } from "./offline-helpers";
import { randomAction, rng } from "./random-play";

const exportText = (store: OfflineStore) => JSON.stringify(createBackup(store, 5_000_000));
const codeOf = (fn: () => unknown): string => { try { fn(); } catch (e) { return e instanceof BackupError ? e.code : `OTHER:${String(e)}`; } return "NONE"; };

describe("backup round trip keeps everything the rules depend on", () => {
  it("keeps bossesDefeated, so the boss bonus is never paid a second time after a restore", () => {
    const src = populated();
    expect(src.game.spec.bosses.length).toBeGreaterThan(0);
    const bossId = src.game.spec.bosses[0]!.id;
    editStored(src.kv, `session.${src.sessionId}`, (v) => {
      const st = v.state as { bossesDefeated: string[]; score: number };
      st.bossesDefeated = [bossId];
      st.score += 500;
    });
    const dst = phone(9_000_000).store;
    const r = importBackup(dst, exportText(src.store));
    expect(r.sessionsImported).toBe(1);
    const restored = dst.getSession(src.sessionId)!;
    expect(restored.state.bossesDefeated).toEqual([bossId]);
    expect(restored.state.score).toBe(src.store.getSession(src.sessionId)!.state.score);
    expect(restored.state).toEqual(src.store.getSession(src.sessionId)!.state);
  });

  it("keeps the game's feature tier and generator label", () => {
    const src = populated();
    const dst = phone(9_000_000).store;
    importBackup(dst, exportText(src.store));
    const g = dst.getGame(src.game.id)!;
    expect(g.spec.meta.featureTier).toBe(getOfflineTier());
    expect(g.spec.meta.generator).toEqual(src.game.spec.meta.generator);
    expect(g.spec.bosses).toEqual(src.game.spec.bosses);
  });

  it("accepts a backup made by an older app version: sessions without bossesDefeated, updatedAt or optional fields", () => {
    const ctx = phone(1_000_000);
    const game = ctx.store.addGame(generateOffline(request({ mode: "FAST", subject: "Fractions" })).spec);
    expect(game.spec.bosses).toEqual([]);
    const run = ctx.store.startSession(game.id, false);
    const b = JSON.parse(exportText(ctx.store)) as { games: Record<string, unknown>[]; sessions: { state: Record<string, unknown> }[] };
    delete b.games[0]!.updatedAt;
    delete (b.games[0]!.spec as { bosses?: unknown }).bosses;
    delete (b.games[0]!.spec as { meta: { featureTier?: unknown } }).meta.featureTier;
    for (const k of ["bossesDefeated", "updatedAt", "openedAt", "recent"]) delete b.sessions[0]!.state[k];
    delete (b.sessions[0] as Record<string, unknown>).updatedAt;
    const dst = phone(9_000_000).store;
    const r = importBackup(dst, JSON.stringify(b));
    expect(r).toMatchObject({ gamesAdded: 1, sessionsImported: 1, droppedSessions: 0, rejectedGames: [] });
    expect(dst.getSession(run.session.id)!.state.bossesDefeated).toEqual([]);
    expect(dst.getSession(run.session.id)!.state.openedAt).toEqual({});
    expect(dst.startSession(game.id, false).resumed).toBe(true);
  });

  it("a tier above what the device is entitled to is cut down, never trusted from the file", () => {
    const spec = generateOffline(request({ mode: "FULL" }), new Date(), "A").spec;
    expect(spec.meta.featureTier).toBe("A");
    const asC = revalidateSpec(spec, "C");
    expect(asC.ok).toBe(false); // a Full Adventure is not part of tier C: it is refused, not kept at A
    const puzzle = generateOffline(request({ mode: "FAST", gameType: "puzzle" }), new Date(), "A").spec;
    const clamped = revalidateSpec(puzzle, "C");
    expect(clamped.ok && clamped.spec.meta.featureTier).toBe("C");
    // a lower tier than the device's is kept as the file says
    const low = generateOffline(request({ mode: "FAST", gameType: "puzzle" }), new Date(), "C").spec;
    const kept = revalidateSpec(low, "A");
    expect(kept.ok && kept.spec.meta.featureTier).toBe("C");
  });

  it("an AI claim in the file is shown as demo-less (dropped), a demo/engine label is kept", () => {
    const src = populated();
    const b = JSON.parse(exportText(src.store)) as { games: { spec: { meta: { generator: Record<string, unknown> } } }[] };
    b.games[0]!.spec.meta.generator = { kind: "ai", provider: "x", model: "y", mode: "FULL", generatedAt: "2030-01-01T00:00:00Z" };
    const dst = phone(9_000_000).store;
    importBackup(dst, JSON.stringify(b));
    expect(dst.getGame(src.game.id)!.spec.meta.generator).toBeUndefined();
    expect(dst.listGames()[0]!.generatorKind).toBe("demo");
  });
});

describe("every backup problem has a message in both languages", () => {
  it("each error code, plus the read/save failures and the storage warnings, has non-empty Hebrew and English text", () => {
    const keys = [...BACKUP_ERROR_CODES.map((c) => `mob.backup.err.${c}`), "mob.backup.err.READ", "mob.backup.err.SAVE", "mob.backup.err.COPY", "mob.backup.downloaded", "mob.backup.copy", "mob.backup.copied", "mob.backup.paste.title", "mob.backup.paste.placeholder", "mob.backup.paste.import", "mob.backup.skipped.runs", "mob.storage.full", "mob.storage.blocked", "mob.storage.damaged", "mob.storage.purge", "mob.storage.purged"];
    for (const locale of ["he", "en"] as const) {
      for (const key of keys) expect((DICTIONARIES[locale] as Record<string, string>)[key]?.length, `${locale} ${key}`).toBeGreaterThan(3);
    }
    // placeholders match between the two languages
    for (const key of keys) {
      const params = (l: "he" | "en") => ((DICTIONARIES[l] as Record<string, string>)[key]!.match(/\{\w+\}/g) ?? []).sort();
      expect(params("he"), key).toEqual(params("en"));
    }
  });
});

describe("huge and tampered files", () => {
  it("a file is refused by size before it is read into memory", () => {
    expect(fileTooLarge(MAX_BACKUP_FILE_BYTES)).toBe(false);
    expect(fileTooLarge(MAX_BACKUP_FILE_BYTES + 1)).toBe(true);
    expect(fileTooLarge(5_000)).toBe(false);
  });

  it("too many games, sessions or cards make the file INVALID without storing anything", () => {
    const { store, kv } = phone(1_000_000);
    const base = { format: BACKUP_FORMAT, version: 1, exportedAt: 1, games: [], sessions: [], deck: [] };
    const long = (n: number) => Array.from({ length: n }, () => ({}));
    expect(codeOf(() => importBackup(store, JSON.stringify({ ...base, games: long(MAX_GAMES + 1) })))).toBe("INVALID");
    expect(codeOf(() => importBackup(store, JSON.stringify({ ...base, sessions: long(MAX_SESSIONS + 1) })))).toBe("INVALID");
    expect(kv.keys!()).toEqual([]);
  });

  it("export never writes a file the app itself would refuse to open", () => {
    const src = populated();
    const backup = createBackup(src.store, 1);
    expect(serializeBackup(backup).length).toBeLessThanOrEqual(MAX_BACKUP_BYTES);
    const tooMany: BackupFile = { ...backup, games: Array.from({ length: MAX_GAMES + 1 }, () => backup.games[0]!) };
    expect(codeOf(() => serializeBackup(tooMany))).toBe("EXPORT_TOO_LARGE");
    const tooBig: BackupFile = { ...backup, games: [{ ...backup.games[0]!, title: "x".repeat(MAX_BACKUP_BYTES) }] };
    expect(codeOf(() => serializeBackup(tooBig))).toBe("EXPORT_TOO_LARGE");
  });

  it("export keeps unfinished and finished runs and drops the oldest abandoned ones beyond the import limit", () => {
    const src = populated();
    const extra = MAX_SESSIONS + 25;
    const proto = JSON.parse(src.kv.get(`${PREFIX}session.${src.sessionId}`)!) as Record<string, unknown>;
    const ids: string[] = [];
    for (let i = 0; i < extra; i++) {
      const id = `old${i}`;
      ids.push(id);
      src.kv.set(`${PREFIX}session.${id}`, JSON.stringify({ ...proto, id, status: "ABANDONED", updatedAt: i }));
    }
    src.kv.set(`${PREFIX}sessions.${src.game.id}`, JSON.stringify([src.sessionId, ...ids]));
    const backup = createBackup(src.store, 1);
    expect(backup.sessions).toHaveLength(MAX_SESSIONS);
    expect(backup.sessions.map((s) => s.id)).toContain(src.sessionId); // the live run is never the one dropped
    expect(backup.sessions.map((s) => s.id)).not.toContain("old0"); // the oldest abandoned one is
    expect(() => parseBackup(serializeBackup(backup))).not.toThrow();
  });

  it("a session whose numbers were tampered with (negative, fractional, NaN-like, huge string keys) is dropped, not stored", () => {
    const src = populated();
    const b = JSON.parse(exportText(src.store)) as { sessions: { state: Record<string, unknown> }[] };
    const variants: ((st: Record<string, unknown>) => void)[] = [
      (st) => { st.streak = -3; },
      (st) => { st.hintsUsed = 1.5; },
      (st) => { st.score = "1000000"; },
      (st) => { st.collected = new Array(6000).fill("x"); },
      (st) => { st.served = { ["k".repeat(300)]: "v" }; },
      (st) => { st.bossesDefeated = "all"; },
    ];
    for (const mutate of variants) {
      const copy = structuredClone(b);
      mutate(copy.sessions[0]!.state);
      const dst = phone(9_000_000).store;
      const r = importBackup(dst, JSON.stringify(copy));
      expect(r.droppedSessions, String(mutate)).toBe(1);
      expect(dst.getSession(src.sessionId)).toBeNull();
      expect(r.gamesAdded).toBe(1);
    }
  });

  it("prototype-polluting keys in a run are not copied into it", () => {
    const src = populated();
    const text = exportText(src.store).replace('"served":{', '"served":{"__proto__":"x","constructor":"y",');
    const dst = phone(9_000_000).store;
    importBackup(dst, text);
    const st = dst.getSession(src.sessionId)!.state;
    expect(Object.keys(st.served)).not.toContain("__proto__");
    expect(Object.keys(st.served)).not.toContain("constructor");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("a duplicate game id in one file is rejected once, not stored twice", () => {
    const src = populated();
    const b = JSON.parse(exportText(src.store)) as { games: unknown[] };
    b.games.push(structuredClone(b.games[0]));
    const dst = phone(9_000_000).store;
    const r = importBackup(dst, JSON.stringify(b));
    expect(r.gamesAdded).toBe(1);
    expect(r.rejectedGames.map((g) => g.reason)).toEqual(["duplicate id"]);
    expect(dst.listGames()).toHaveLength(1);
  });
});

describe("importing into a full phone", () => {
  it("fails with STORAGE_FULL, stores nothing half-way, and the same file imports once there is room", () => {
    const src = populated();
    const text = exportText(src.store);
    const { kv, inner, ctl } = flakyKV();
    const dst = phone(9_000_000, kv).store;
    ctl.mode = "full";
    expect(codeOf(() => importBackup(dst, text))).toBe("STORAGE_FULL");
    expect(inner.keys!()).toEqual([]);
    expect(dst.listGames()).toEqual([]);
    ctl.mode = "ok";
    expect(importBackup(dst, text)).toMatchObject({ gamesAdded: 1, sessionsImported: 1, cardsImported: 1 });
  });

  it("a full phone that fails only after the game was stored keeps the game, and importing again completes the rest", () => {
    const src = populated();
    const text = exportText(src.store);
    const { kv, ctl } = flakyKV();
    const dst = phone(9_000_000, kv).store;
    ctl.mode = "full";
    ctl.failOn = (k) => k.startsWith(`${PREFIX}session.`) || k.startsWith(`${PREFIX}sessions.`) || k === `${PREFIX}deck`;
    expect(codeOf(() => importBackup(dst, text))).toBe("STORAGE_FULL");
    expect(dst.listGames()).toHaveLength(1);
    expect(dst.getSession(src.sessionId)).toBeNull();
    ctl.mode = "ok";
    expect(importBackup(dst, text)).toMatchObject({ gamesKept: 1, sessionsImported: 1, cardsImported: 1 });
    expect(dst.getSession(src.sessionId)).not.toBeNull();
  });

  it("blocked storage is reported as STORAGE_UNAVAILABLE", () => {
    const src = populated();
    const { kv, ctl } = flakyKV();
    const dst = phone(9_000_000, kv).store;
    ctl.mode = "blocked";
    expect(codeOf(() => importBackup(dst, exportText(src.store)))).toBe("STORAGE_UNAVAILABLE");
  });
});

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
function mutate(root: Json, rand: () => number): void {
  const nodes: { parent: Json[] | { [k: string]: Json }; key: string | number }[] = [];
  const walk = (v: Json) => {
    if (Array.isArray(v)) v.forEach((c, i) => { nodes.push({ parent: v, key: i }); walk(c); });
    else if (v && typeof v === "object") for (const k of Object.keys(v)) { nodes.push({ parent: v, key: k }); walk(v[k]!); }
  };
  walk(root);
  const wild: Json[] = [null, true, -1, 0, 1.5, 1e308, "", "x".repeat(500), "../evil", [], {}, [1, 2, 3], { a: 1 }, "__proto__"];
  for (let n = 1 + Math.floor(rand() * 3); n > 0; n--) {
    const t = nodes[Math.floor(rand() * nodes.length)]!;
    const p = t.parent as Record<string | number, Json>;
    const op = rand();
    if (op < 0.3) { if (Array.isArray(p)) p.splice(t.key as number, 1); else delete p[t.key]; }
    else if (op < 0.4 && Array.isArray(p)) p.length = Math.floor(rand() * p.length);
    else p[t.key] = wild[Math.floor(rand() * wild.length)]!;
  }
}

describe("fuzz: whatever is in the file, the library stays valid and usable", () => {
  it("random damage to a backup never throws anything but BackupError, and what is stored is always playable", () => {
    const src = populated();
    const baseText = exportText(src.store);
    let imported = 0;
    let rejected = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rand = rng(seed);
      const b = JSON.parse(baseText) as { [k: string]: Json };
      // odd seeds damage the whole file (mostly the big game spec); even seeds damage only runs, cards and the envelope
      if (seed % 2 === 1) mutate(b, rand);
      else mutate({ sessions: b.sessions!, deck: b.deck!, exportedAt: b.exportedAt!, version: b.version! }, rand);
      const dst = phone(9_000_000).store;
      let report;
      try {
        report = importBackup(dst, JSON.stringify(b));
      } catch (e) {
        expect(e, `seed ${seed}`).toBeInstanceOf(BackupError);
        expect(dst.listGames(), `seed ${seed}`).toEqual([]);
        rejected++;
        continue;
      }
      imported += report.gamesAdded;
      for (const row of dst.listGames()) {
        const g = dst.getGame(row.id)!;
        expect(validateGameSpec(g.spec).ok, `seed ${seed}: stored game is valid`).toBe(true);
        expect(() => dst.startSession(row.id, false), `seed ${seed}`).not.toThrow();
        expect(() => dst.deckSummary(), `seed ${seed}`).not.toThrow();
      }
      expect(dst.integrity().damagedGames, `seed ${seed}`).toEqual([]);
      expect(dst.integrity().damagedSessions, `seed ${seed}`).toEqual([]);
    }
    expect(imported).toBeGreaterThan(10); // the fuzzer does leave a good share of files importable
    expect(rejected + imported).toBeGreaterThan(0);
  });

  it("random damage to a single game record is either rejected with a reason or stored valid", () => {
    const src = populated();
    const raw = JSON.parse(src.kv.get(`${PREFIX}game.${src.game.id}`)!) as Json;
    for (let seed = 100; seed < 130; seed++) {
      const copy = structuredClone(raw);
      mutate(copy, rng(seed));
      const r = checkGameRecord(copy);
      if (r.ok) expect(validateGameSpec(r.game.spec).ok, `seed ${seed}`).toBe(true);
      else expect(r.rejected.reason.length, `seed ${seed}`).toBeGreaterThan(0);
    }
  });

  it("an empty store still exports a valid file and importing it into memory-only storage works", () => {
    const empty = new OfflineStore(memoryKV());
    expect(parseBackup(serializeBackup(createBackup(empty, 1)))).toMatchObject({ games: [], sessions: [], deck: [] });
  });
});

describe("property: a backup restores exactly what was exported", () => {
  const content = (store: OfflineStore) => {
    const d = store.exportData();
    return {
      games: d.games.map((g) => ({ id: g.id, title: g.title, spec: g.spec })).sort((a, b) => a.id.localeCompare(b.id)),
      sessions: d.sessions.map((s) => ({ id: s.id, gameId: s.gameId, status: s.status, state: s.state, startedAt: s.startedAt, finishedAt: s.finishedAt })).sort((a, b) => a.id.localeCompare(b.id)),
      cards: d.cards.map((c) => ({ key: c.key, gameId: c.gameId, challengeId: c.challengeId, box: c.box, due: c.due, mastered: c.mastered })).sort((a, b) => a.key.localeCompare(b.key)),
    };
  };

  it("random libraries survive export, import into an empty device, and a second import changes nothing", () => {
    let cards = 0;
    let sessions = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const rand = rng(seed);
      const src = phone(1_000_000);
      for (let step = 0; step < 30; step++) { src.t.now += 1000; randomAction(src.store, rand); }
      const before = content(src.store);
      const text = serializeBackup(createBackup(src.store, 5));
      const dst = phone(9_000_000);
      const r = importBackup(dst.store, text);
      expect(r.rejectedGames, `seed ${seed}`).toEqual([]);
      expect(r.droppedSessions + r.droppedCards, `seed ${seed}`).toBe(0);
      expect(content(dst.store), `seed ${seed}`).toEqual(before);
      const rows = (store: OfflineStore) => store.listGames().map((g) => ({ ...g, createdAt: 0 })).sort((x, y) => x.id.localeCompare(y.id));
      expect(rows(dst.store), `seed ${seed}`).toEqual(rows(src.store));
      const again = importBackup(dst.store, text);
      expect(again, `seed ${seed}`).toMatchObject({ gamesAdded: 0, gamesUpdated: 0, sessionsImported: 0, cardsImported: 0 });
      expect(content(dst.store), `seed ${seed}`).toEqual(before);
      cards += before.cards.length;
      sessions += before.sessions.length;
    }
    expect(sessions).toBeGreaterThan(20);
    expect(cards).toBeGreaterThan(0);
  });

  it("a restore never replaces newer data on the device with the older data of the file", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const rand = rng(seed + 500);
      const a = phone(1_000_000);
      for (let step = 0; step < 15; step++) { a.t.now += 1000; randomAction(a.store, rand); }
      const old = serializeBackup(createBackup(a.store, 1));
      for (let step = 0; step < 15; step++) { a.t.now += 1000; randomAction(a.store, rand); }
      const now = content(a.store);
      importBackup(a.store, old);
      // everything in `now` is still there exactly as it was (the older file may only add what was deleted/never existed... but never change it)
      const after = content(a.store);
      for (const s of now.sessions) expect(after.sessions.find((x) => x.id === s.id), `seed ${seed}`).toEqual(s);
      for (const g of now.games) expect(after.games.find((x) => x.id === g.id), `seed ${seed}`).toEqual(g);
    }
  });
});
