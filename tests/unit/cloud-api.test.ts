import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { chunkRows, MAX_BATCH_CHARS, MAX_BATCH_ROWS, MAX_IDS_PER_FILTER, OVERLAP_MS, supabaseCloud } from "../../mobile/src/cloud/api";

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
type Call = { op: string; table: string; detail?: unknown };

/** A Supabase client that records what the app asks of it. Nothing leaves the machine. */
type Failure = string | { message: string; code?: string } | null;
function fakeDb(tables: Record<string, Record<string, unknown>[]> = {}, failOn?: (c: Call) => Failure, onPage?: (table: string, page: number) => void) {
  const calls: Call[] = [];
  const stored: Record<string, Record<string, unknown>[]> = {};
  const record = (c: Call) => {
    calls.push(c);
    const f = failOn?.(c);
    if (!f && c.op === "upsert") (stored[c.table] ??= []).push(...(c.detail as { rows: Record<string, unknown>[] }).rows);
    return Promise.resolve({ data: null, error: f ? (typeof f === "string" ? { message: f } : f) : null });
  };
  const db = {
    from(table: string) {
      return {
        select(columns: string) {
          const q = {
            since: null as string | null,
            gameIds: null as string[] | null,
            after: null as { at: string; col: string; key: string } | null,
            sort: [] as string[],
            gt(_col: string, v: string) { q.since = v; return q; },
            in(_col: string, ids: string[]) { q.gameIds = ids; return q; },
            /** The one filter the app sends: rows after (updated_at, key), as PostgREST evaluates it. */
            or(filter: string) {
              const m = /^updated_at\.gt\."((?:[^"\\]|\\.)*)",and\(updated_at\.eq\."((?:[^"\\]|\\.)*)",(\w+)\.gt\."((?:[^"\\]|\\.)*)"\)$/.exec(filter);
              if (!m || m[1] !== m[2]) throw new Error(`unexpected filter ${filter}`);
              const unescape = (v: string) => v.replace(/\\(.)/g, "$1");
              q.after = { at: unescape(m[1]!), col: m[3]!, key: unescape(m[4]!) };
              return q;
            },
            order(col: string) { q.sort.push(col); return q; },
            /** Rows as the database returns them: filtered, in the asked order, at most `n`. */
            run(n: number) {
              const rows = (tables[table] ?? [])
                .filter((r) => !q.gameIds || q.gameIds.includes(r.game_id as string))
                .filter((r) => !q.since || String(r.updated_at) > q.since)
                .filter((r) => !q.after || String(r.updated_at) > q.after.at || (String(r.updated_at) === q.after.at && cmp(String(r[q.after.col]), q.after.key) > 0))
                .sort((a, b) => q.sort.reduce((d, col) => d || cmp(String(a[col]), String(b[col])), 0));
              return rows.slice(0, n);
            },
            range(from: number, to: number) {
              calls.push({ op: "range", table, detail: { from, to, columns, since: q.since, gameIds: q.gameIds } });
              onPage?.(table, calls.filter((c) => c.op === "range" && c.table === table).length);
              return Promise.resolve({ data: q.run(to + 1).slice(from), error: null });
            },
            limit(n: number) {
              calls.push({ op: "range", table, detail: { limit: n, columns, since: q.since, gameIds: q.gameIds, after: q.after } });
              onPage?.(table, calls.filter((c) => c.op === "range" && c.table === table).length);
              return Promise.resolve({ data: q.run(n), error: null });
            },
          };
          return q;
        },
        upsert: (rows: unknown[], opts: unknown) => record({ op: "upsert", table, detail: { rows, opts } }),
        update: (patch: unknown) => ({ in: (col: string, ids: string[]) => record({ op: "update", table, detail: { patch, col, ids } }) }),
      };
    },
  };
  return { db: db as unknown as SupabaseClient, calls, stored };
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

  it("a row the table refuses is left out and counted; every other row is stored", async () => {
    const refuse = (c: Call) => ((c.detail as { rows?: { title?: string; state?: { bad?: boolean } }[] }).rows ?? []).some((r) => r.title === "TOO LONG" || r.state?.bad)
      ? { message: 'new row for relation "games" violates check constraint', code: "23514" } : null;
    const { db, stored, calls } = fakeDb({}, refuse);
    const games = Array.from({ length: 9 }, (_, i) => ({ ...game(i), title: i === 4 ? "TOO LONG" : `Game ${i}` }));
    const sessions = Array.from({ length: 5 }, (_, i) => ({ localId: `s${i}`, gameId: "g0", status: "ACTIVE" as const, state: { bad: i === 0 } as never, startedAt: "2030-01-01T00:00:00.000Z", finishedAt: null }));
    const r = await supabaseCloud(db).push({ games, sessions, cards: [], deletedGames: [] });
    expect(r).toEqual({ refused: 2 });
    expect((stored.games ?? []).map((g) => g.local_id).sort()).toEqual(["g0", "g1", "g2", "g3", "g5", "g6", "g7", "g8"]);
    expect((stored.sessions ?? []).map((g) => g.local_id).sort()).toEqual(["s1", "s2", "s3", "s4"]);
    expect(calls.length).toBeLessThan(40); // the bad row is found by splitting, not by sending rows one by one
  });

  it("only content rules count as refusals: a foreign key error, a network error and a permission error still stop the push", async () => {
    for (const failure of [{ message: 'violates foreign key constraint "sessions_user_id_game_id_fkey"', code: "23503" }, { message: "TypeError: Failed to fetch" }, { message: "permission denied", code: "42501" }]) {
      const { db } = fakeDb({}, () => failure);
      await expect(supabaseCloud(db).push({ games: [game(1), game(2)], sessions: [], cards: [], deletedGames: [] })).rejects.toThrow(failure.message);
    }
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
    // each page starts after the last row of the one before (keyset), at most 10 rows per request
    const gamePages = calls.filter((c) => c.op === "range" && c.table === "games").map((c) => c.detail as { limit: number; after: { key: string } | null });
    expect(gamePages.map((p) => p.limit)).toEqual([10, 10, 10]);
    expect(gamePages.map((p) => p.after?.key ?? null)).toEqual([null, "g9", "g19"]);
    expect(rows.sessions).toEqual([]);
    expect(rows.cards).toEqual([]);
  });

  it("a row that changes while the pull is running does not make the pull skip another row", async () => {
    const at = (i: number) => `2030-01-01T00:00:${String(i).padStart(2, "0")}Z`;
    const games = Array.from({ length: 25 }, (_, i) => ({ local_id: `g${i}`, title: `G${i}`, spec: {}, created_at: "c", updated_at: at(i), deleted_at: null }));
    // another phone changes g4 (already read) right after the first page: it moves to the end of the order
    const { db } = fakeDb({ games }, undefined, (table, page) => {
      if (table === "games" && page === 2) games.find((g) => g.local_id === "g4")!.updated_at = at(40);
    });
    const rows = await supabaseCloud(db).pull(null);
    const ids = rows.games.map((g) => g.localId);
    expect([...new Set(ids)].sort()).toEqual(games.map((g) => g.local_id).sort()); // every game arrived (g10 used to be skipped)
    const g4 = rows.games.filter((g) => g.localId === "g4");
    expect(g4[g4.length - 1]!.updatedAt).toBe(at(40)); // the newest copy comes last, so the merge ends on it
  });

  it("rows that share one updated_at (a batch pushed together) are paged by their key, none skipped or repeated", async () => {
    const same = "2030-01-01T00:00:00.123456+00:00";
    const sessions = Array.from({ length: 450 }, (_, i) => ({ local_id: `s${String(i).padStart(3, "0")}`, game_id: "g", status: "ACTIVE", state: {}, started_at: "a", finished_at: null, updated_at: same }));
    const { db } = fakeDb({ sessions });
    const rows = await supabaseCloud(db).pull(null);
    expect(rows.sessions.map((s) => s.localId)).toEqual(sessions.map((s) => s.local_id));
  });

  it("a key with a quote, a comma or a parenthesis cannot break the page filter", async () => {
    const keys = ['a"b', "c,d", "(e)", "f\\g", "h.i"];
    const cards = keys.map((k) => ({ card_key: k, game_id: "g", challenge_id: "c", box: 1, due: "d", mastered: false, updated_at: "2030-01-01T00:00:00Z" })).concat(
      Array.from({ length: 500 }, (_, i) => ({ card_key: `z${String(i).padStart(3, "0")}`, game_id: "g", challenge_id: "c", box: 1, due: "d", mastered: false, updated_at: "2030-01-01T00:00:00Z" })));
    const { db } = fakeDb({ deck_cards: cards });
    const rows = await supabaseCloud(db).pull(null);
    expect(rows.cards).toHaveLength(cards.length);
    expect(rows.cards.map((c) => c.cardKey).sort()).toEqual(cards.map((c) => c.card_key).sort());
  });

  it("starts a little before the cursor, so a row that committed late is still seen", async () => {
    const { db, calls } = fakeDb();
    const cursor = "2030-01-01T00:10:00.000Z";
    await supabaseCloud(db).pull(cursor);
    const since = (calls.find((c) => c.op === "range")!.detail as { since: string }).since;
    expect(Date.parse(cursor) - Date.parse(since)).toBe(OVERLAP_MS);
  });

  it("pullGameData reads every run and card of the given games, of any age, a few games per request", async () => {
    const sessions = Array.from({ length: 3 }, (_, i) => ({ local_id: `s${i}`, game_id: i === 2 ? "other" : `g${i}`, status: "ACTIVE", state: {}, started_at: "a", finished_at: null, updated_at: "2020-01-01T00:00:00Z" }));
    const cards = [{ card_key: "g0.c", game_id: "g0", challenge_id: "c", box: 2, due: "d", mastered: false, updated_at: "2020-01-01T00:00:00Z" }];
    const { db, calls } = fakeDb({ sessions, deck_cards: cards });
    const ids = Array.from({ length: 120 }, (_, i) => `g${i}`);
    const data = await supabaseCloud(db).pullGameData!(ids);
    expect(data.sessions.map((s) => s.localId).sort()).toEqual(["s0", "s1"]); // the run of a game that was not asked for stays out
    expect(data.cards.map((c) => c.cardKey)).toEqual(["g0.c"]);
    const filters = calls.filter((c) => c.op === "range" && c.table === "sessions").map((c) => (c.detail as { gameIds: string[]; since: string | null }));
    expect(filters.map((f) => f.gameIds.length)).toEqual([MAX_IDS_PER_FILTER, MAX_IDS_PER_FILTER, 20]);
    expect(filters.every((f) => f.since === null)).toBe(true); // no age limit
    expect(await supabaseCloud(db).pullGameData!([])).toEqual({ sessions: [], cards: [] });
  });

  it("the first pull has no lower bound", async () => {
    const { db, calls } = fakeDb();
    await supabaseCloud(db).pull(null);
    expect((calls.find((c) => c.op === "range")!.detail as { since: string | null }).since).toBeNull();
  });
});
