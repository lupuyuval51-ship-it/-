import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudApi, CloudCard, CloudGame, CloudRows, CloudSession, PushBatch } from "@/lib/offline/sync";

/**
 * Rows per read. A game row carries its whole spec (up to 1 MB), so games are read a few at a time; a request that is too big
 * would fail on every round and the phone would never get its games.
 */
const PAGE: Record<string, number> = { games: 10, sessions: 200, deck_cards: 500 };
/** Re-read a short window before the cursor: a transaction that committed late can carry an older updated_at. The merge is idempotent. */
export const OVERLAP_MS = 60_000;
/** A single write request stays under about this many characters of JSON and this many rows (the first sync of a phone with many games). */
export const MAX_BATCH_CHARS = 1_500_000;
export const MAX_BATCH_ROWS = 100;
/** Ids per `in (...)` filter: they travel in the URL. */
export const MAX_IDS_PER_FILTER = 50;

type Row = Record<string, unknown>;

/** A value inside a PostgREST `or(...)` filter: double-quoted, so a comma, a parenthesis or a dot in a key cannot end it early. */
const quoted = (v: string): string => `"${v.replace(/[\\"]/g, "\\$&")}"`;

/**
 * Pages through one table in (updated_at, key) order. Each page starts after the last row of the previous one (keyset), not at an
 * offset: a row that another phone changes while the pull is running jumps to the end of the order, and with offsets every row behind
 * it would shift one place forward and the row at the page boundary would never be returned (the cursor then moves past it).
 * `order` is [updated_at, the table's key column]; both are in `columns`.
 */
async function readAll(db: SupabaseClient, table: string, columns: string, since: string | null, order: string[], gameIds?: string[]): Promise<Row[]> {
  const page = PAGE[table] ?? 100;
  const keyCol = order[1]!;
  const out: Row[] = [];
  let last: Row | null = null;
  for (;;) {
    let q = db.from(table).select(columns);
    if (since) q = q.gt("updated_at", since);
    if (gameIds) q = q.in("game_id", gameIds);
    if (last) {
      const at = last.updated_at;
      const key = last[keyCol];
      if (typeof at !== "string" || typeof key !== "string") throw new Error(`${table}: a row came back without its ${order.join(" / ")}`);
      q = q.or(`updated_at.gt.${quoted(at)},and(updated_at.eq.${quoted(at)},${keyCol}.gt.${quoted(key)})`);
    }
    for (const col of order) q = q.order(col, { ascending: true });
    const { data, error } = await q.limit(page);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Row[];
    out.push(...rows);
    if (rows.length < page) return out;
    last = rows[rows.length - 1]!;
  }
}

interface DbError { message: string; code?: string }

function must(error: DbError | null): void {
  if (error) throw new Error(error.message);
}

/**
 * The table refuses this particular row (a rule on its content: too long, out of range, malformed), as opposed to the request
 * failing (offline, signed out, a missing game). Foreign-key errors are not row refusals: the round heals those by sending the game.
 */
const isRowRefusal = (e: DbError): boolean => /^(22|23)/.test(e.code ?? "") && e.code !== "23503";

/**
 * One upsert. If the table refuses a row in it, the request is split until the refused row is alone and left out (counted), so a
 * single bad record can never stop everything else from syncing. Anything else that goes wrong is raised.
 */
async function upsertChunk(db: SupabaseClient, table: string, rows: Row[], onConflict: string, refused: { n: number }): Promise<void> {
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (!error) return;
  if (!isRowRefusal(error)) throw new Error(error.message);
  if (rows.length === 1) { refused.n++; return; }
  const mid = rows.length >> 1;
  await upsertChunk(db, table, rows.slice(0, mid), onConflict, refused);
  await upsertChunk(db, table, rows.slice(mid), onConflict, refused);
}

async function upsertAll(db: SupabaseClient, table: string, rows: Row[], onConflict: string, refused: { n: number }): Promise<void> {
  for (const chunk of chunkRows(rows)) await upsertChunk(db, table, chunk, onConflict, refused);
}

/** Splits rows into requests of bounded size. A row bigger than the limit goes alone. */
export function chunkRows<T>(rows: T[], maxChars = MAX_BATCH_CHARS, maxRows = MAX_BATCH_ROWS): T[][] {
  const out: T[][] = [];
  let current: T[] = [];
  let chars = 0;
  for (const row of rows) {
    const size = JSON.stringify(row).length;
    if (current.length > 0 && (current.length >= maxRows || chars + size > maxChars)) {
      out.push(current);
      current = [];
      chars = 0;
    }
    current.push(row);
    chars += size;
  }
  if (current.length > 0) out.push(current);
  return out;
}

const SESSION_COLUMNS = "local_id,game_id,status,state,started_at,finished_at,updated_at";
const CARD_COLUMNS = "card_key,game_id,challenge_id,box,due,mastered,updated_at";
const toSession = (r: Row) => ({ localId: r.local_id, gameId: r.game_id, status: r.status, state: r.state, startedAt: r.started_at, finishedAt: r.finished_at ?? null, updatedAt: r.updated_at }) as CloudSession;
const toCard = (r: Row) => ({ cardKey: r.card_key, gameId: r.game_id, challengeId: r.challenge_id, box: r.box, due: r.due, mastered: r.mastered, updatedAt: r.updated_at }) as CloudCard;

export function supabaseCloud(db: SupabaseClient): CloudApi {
  return {
    async pull(since): Promise<CloudRows> {
      const from = since ? new Date(Date.parse(since) - OVERLAP_MS).toISOString() : null;
      const games = await readAll(db, "games", "local_id,title,spec,created_at,updated_at,deleted_at", from, ["updated_at", "local_id"]);
      const sessions = await readAll(db, "sessions", SESSION_COLUMNS, from, ["updated_at", "local_id"]);
      const cards = await readAll(db, "deck_cards", CARD_COLUMNS, from, ["updated_at", "card_key"]);
      return {
        games: games.map((r) => ({ localId: r.local_id, title: r.title, spec: r.spec, createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at ?? null }) as CloudGame),
        sessions: sessions.map(toSession),
        cards: cards.map(toCard),
      };
    },

    /** All runs and review cards of the given games, of any age. */
    async pullGameData(gameIds): Promise<Pick<CloudRows, "sessions" | "cards">> {
      const out = { sessions: [] as CloudSession[], cards: [] as CloudCard[] };
      for (let i = 0; i < gameIds.length; i += MAX_IDS_PER_FILTER) {
        const ids = gameIds.slice(i, i + MAX_IDS_PER_FILTER);
        out.sessions.push(...(await readAll(db, "sessions", SESSION_COLUMNS, null, ["updated_at", "local_id"], ids)).map(toSession));
        out.cards.push(...(await readAll(db, "deck_cards", CARD_COLUMNS, null, ["updated_at", "card_key"], ids)).map(toCard));
      }
      return out;
    },

    /**
     * Writes in this order: games, runs, cards, deletions (runs and cards reference their game). Large batches are split into
     * several requests; every request is an idempotent upsert, so a round that stops half-way is simply repeated. A row the table
     * refuses for what it contains is left out and counted in the result.
     */
    async push(b: PushBatch): Promise<{ refused: number }> {
      const refused = { n: 0 };
      await upsertAll(db, "games", b.games.map((g) => ({ local_id: g.localId, title: g.title, spec: g.spec, created_at: g.createdAt, deleted_at: null })), "user_id,local_id", refused);
      await upsertAll(db, "sessions", b.sessions.map((s) => ({ local_id: s.localId, game_id: s.gameId, status: s.status, state: s.state, started_at: s.startedAt, finished_at: s.finishedAt })), "user_id,local_id", refused);
      await upsertAll(db, "deck_cards", b.cards.map((c) => ({ card_key: c.cardKey, game_id: c.gameId, challenge_id: c.challengeId, box: c.box, due: c.due, mastered: c.mastered })), "user_id,card_key", refused);
      for (let i = 0; i < b.deletedGames.length; i += MAX_IDS_PER_FILTER) {
        must((await db.from("games").update({ deleted_at: new Date().toISOString() }).in("local_id", b.deletedGames.slice(i, i + MAX_IDS_PER_FILTER))).error);
      }
      return { refused: refused.n };
    },
  };
}
