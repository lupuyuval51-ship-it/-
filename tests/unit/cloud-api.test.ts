import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { chunkRows, MAX_BATCH_CHARS, MAX_BATCH_ROWS, MAX_IDS_PER_FILTER, OVERLAP_MS, supabaseCloud } from "../../mobile/src/cloud/api";

type Call = { op: string; table: string; detail?: unknown };

/** A Supabase client that records what the app asks of it. Nothing leaves the machine. */
function fakeDb(tables: Record<string, Record<string, unknown>[]> = {}, failOn?: (c: Call) => string | null) {
  const calls: Call[] = [];
  const record = (c: Call) => { calls.push(c); const msg = failOn?.(c); return Promise.resolve({ data: null, error: msg ? { message: msg } : null }); };
  const db = {
    from(table: string) {
      return {
        select(columns: string) {
          const q = {
            since: null as string | null,
            gt(_col: string, v: string) { q.since = v; return q; },
            order() { return q; },
            range(from: number, to: number) {
              calls.push({ op: "range", table, detail: { from, to, columns, since: q.since } });
              return Promise.resolve({ data: (tables[table] ?? []).slice(from, to + 1), error: null });
            },
          };
          return q;
        },
        upsert: (rows: unknown[], opts: unknown) => record({ op: "upsert", table, detail: { rows, opts } }),
        update: (patch: unknown) => ({ in: (col: string, ids: string[]) => record({ op: "update", table, detail: { patch, col, ids } }) }),
      };
    },
  };
  return { db: db as unknown as SupabaseClient, calls };
}

const game = (i: number, pad = 0) => ({ localId: `g${i}`, title: `Game ${i}`, spec: { pad: "x".repeat(pad) } as never, createdAt: "2030-01-01T00:00:00.000Z" });

describe("cloud push is split into small requests", () => {
  it("chunkRows keeps every request under the row and size limits and loses nothing", () => {
    const rows = Array.from({ length: 250 }, (_, i) => ({ i, pad: "x".repeat(100_000) }));
    const chunks = chunkRows(rows);
    expect(chunks.flat()).toEqual(rows);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(MAX_BATCH_ROWS);
      expect(JSON.stringify(c).length).toBeLessThanOrEqual(MAX_BATCH_CHARS + 100_100);
      expect(c.length).toBeLessThanOrEqual(Math.max(1, Math.floor(MAX_BATCH_CHARS / 100_020)));
    }
    expect(chunkRows([])).toEqual([]);
    expect(chunkRows([{ big: "y".repeat(MAX_BATCH_CHARS * 2) }])).toHaveLength(1); // a single oversize row goes alone
    expect(chunkRows(Array.from({ length: 250 }, (_, i) => ({ i })))).toHaveLength(3); // 100 + 100 + 50
  });

  it("a phone with many large games sends several upserts, games before runs before cards before deletions", async () => {
    const { db, calls } = fakeDb();
    await supabaseCloud(db).push({
      games: Array.from({ length: 40 }, (_, i) => game(i, 200_000)),
      sessions: Array.from({ length: 230 }, (_, i) => ({ localId: `s${i}`, gameId: "g0", status: "ACTIVE" as const, state: {} as never, startedAt: "2030-01-01T00:00:00.000Z", finishedAt: null })),
      cards: [{ cardKey: "k", gameId: "g0", challengeId: "c", box: 1, due: "2030-01-01T00:00:00.000Z", mastered: false }],
      deletedGames: Array.from({ length: 120 }, (_, i) => `d${i}`),
    });
    const order = calls.map((c) => `${c.op}:${c.table}`);
    const firstOf = (s: string) => order.indexOf(s);
    const lastOf = (s: string) => order.lastIndexOf(s);
    expect(lastOf("upsert:games")).toBeLessThan(firstOf("upsert:sessions"));
    expect(lastOf("upsert:sessions")).toBeLessThan(firstOf("upsert:deck_cards"));
    expect(lastOf("upsert:deck_cards")).toBeLessThan(firstOf("update:games"));
    const gameUpserts = calls.filter((c) => c.op === "upsert" && c.table === "games");
    expect(gameUpserts.length).toBeGreaterThan(3);
    expect(gameUpserts.reduce((n, c) => n + (c.detail as { rows: unknown[] }).rows.length, 0)).toBe(40);
    for (const c of gameUpserts) expect(JSON.stringify(c.detail).length).toBeLessThan(MAX_BATCH_CHARS + 250_000);
    const sessionUpserts = calls.filter((c) => c.op === "upsert" && c.table === "sessions");
    expect(sessionUpserts.map((c) => (c.detail as { rows: unknown[] }).rows.length)).toEqual([100, 100, 30]);
    const deletes = calls.filter((c) => c.op === "update");
    expect(deletes.map((c) => (c.detail as { ids: string[] }).ids.length)).toEqual([MAX_IDS_PER_FILTER, MAX_IDS_PER_FILTER, 20]);
    expect((deletes[0]!.detail as { patch: { deleted_at: string } }).patch.deleted_at).toMatch(/^\d{4}-\d\d-\d\dT/);
  });

  it("never sends the user id (the database fills it in from the token) and keeps the conflict key", async () => {
    const { db, calls } = fakeDb();
    await supabaseCloud(db).push({ games: [game(1)], sessions: [], cards: [], deletedGames: [] });
    const c = calls[0]!;
    expect(JSON.stringify(c.detail)).not.toMatch(/user_id":/);
    expect((c.detail as { opts: unknown }).opts).toEqual({ onConflict: "user_id,local_id" });
  });

  it("a failing request stops the push with the server's message, and later requests are not sent", async () => {
    const { db, calls } = fakeDb({}, (c) => (c.table === "sessions" ? "permission denied" : null));
    await expect(supabaseCloud(db).push({
      games: [game(1)],
      sessions: [{ localId: "s", gameId: "g1", status: "ACTIVE", state: {} as never, startedAt: "2030-01-01T00:00:00.000Z", finishedAt: null }],
      cards: [{ cardKey: "k", gameId: "g1", challengeId: "c", box: 1, due: "2030-01-01T00:00:00.000Z", mastered: false }],
      deletedGames: ["x"],
    })).rejects.toThrow("permission denied");
    expect(calls.map((c) => `${c.op}:${c.table}`)).toEqual(["upsert:games", "upsert:sessions"]);
  });

  it("an empty batch sends nothing", async () => {
    const { db, calls } = fakeDb();
    await supabaseCloud(db).push({ games: [], sessions: [], cards: [], deletedGames: [] });
    expect(calls).toEqual([]);
  });
});

describe("cloud pull reads games a few at a time", () => {
  it("pages games in small pages, sessions and cards in larger ones, and returns every row mapped", async () => {
    const games = Array.from({ length: 25 }, (_, i) => ({ local_id: `g${i}`, title: `G${i}`, spec: {}, created_at: "c", updated_at: `2030-01-01T00:00:${String(i).padStart(2, "0")}Z`, deleted_at: i === 3 ? "d" : null }));
    const { db, calls } = fakeDb({ games });
    const rows = await supabaseCloud(db).pull(null);
    expect(rows.games).toHaveLength(25);
    expect(rows.games[3]).toMatchObject({ localId: "g3", deletedAt: "d" });
    expect(rows.games[0]).toMatchObject({ localId: "g0", deletedAt: null });
    const gameRanges = calls.filter((c) => c.op === "range" && c.table === "games").map((c) => c.detail as { from: number; to: number });
    expect(gameRanges).toEqual([{ from: 0, to: 9 }, { from: 10, to: 19 }, { from: 20, to: 29 }].map((r) => expect.objectContaining(r)));
    expect(rows.sessions).toEqual([]);
    expect(rows.cards).toEqual([]);
  });

  it("starts a little before the cursor, so a row that committed late is still seen", async () => {
    const { db, calls } = fakeDb();
    const cursor = "2030-01-01T00:10:00.000Z";
    await supabaseCloud(db).pull(cursor);
    const since = (calls.find((c) => c.op === "range")!.detail as { since: string }).since;
    expect(Date.parse(cursor) - Date.parse(since)).toBe(OVERLAP_MS);
  });

  it("the first pull has no lower bound", async () => {
    const { db, calls } = fakeDb();
    await supabaseCloud(db).pull(null);
    expect((calls.find((c) => c.op === "range")!.detail as { since: string | null }).since).toBeNull();
  });
});
