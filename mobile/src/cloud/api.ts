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

/** Pages through one table in updated_at order. */
async function readAll(db: SupabaseClient, table: string, columns: string, since: string | null, order: string[]): Promise<Row[]> {
  const page = PAGE[table] ?? 100;
  const out: Row[] = [];
  for (let from = 0; ; from += page) {
    let q = db.from(table).select(columns);
    if (since) q = q.gt("updated_at", since);
    for (const col of order) q = q.order(col, { ascending: true });
    const { data, error } = await q.range(from, from + page - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Row[];
    out.push(...rows);
    if (rows.length < page) return out;
  }
}

function must(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
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

export function supabaseCloud(db: SupabaseClient): CloudApi {
  return {
    async pull(since): Promise<CloudRows> {
      const from = since ? new Date(Date.parse(since) - OVERLAP_MS).toISOString() : null;
      const games = await readAll(db, "games", "local_id,title,spec,created_at,updated_at,deleted_at", from, ["updated_at", "local_id"]);
      const sessions = await readAll(db, "sessions", "local_id,game_id,status,state,started_at,finished_at,updated_at", from, ["updated_at", "local_id"]);
      const cards = await readAll(db, "deck_cards", "card_key,game_id,challenge_id,box,due,mastered,updated_at", from, ["updated_at", "card_key"]);
      return {
        games: games.map((r) => ({ localId: r.local_id, title: r.title, spec: r.spec, createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at ?? null }) as CloudGame),
        sessions: sessions.map((r) => ({ localId: r.local_id, gameId: r.game_id, status: r.status, state: r.state, startedAt: r.started_at, finishedAt: r.finished_at ?? null, updatedAt: r.updated_at }) as CloudSession),
        cards: cards.map((r) => ({ cardKey: r.card_key, gameId: r.game_id, challengeId: r.challenge_id, box: r.box, due: r.due, mastered: r.mastered, updatedAt: r.updated_at }) as CloudCard),
      };
    },

    /**
     * Writes in this order: games, runs, cards, deletions (runs and cards reference their game). Large batches are split into
     * several requests; every request is an idempotent upsert, so a round that stops half-way is simply repeated.
     */
    async push(b: PushBatch): Promise<void> {
      for (const rows of chunkRows(b.games.map((g) => ({ local_id: g.localId, title: g.title, spec: g.spec, created_at: g.createdAt, deleted_at: null })))) {
        must((await db.from("games").upsert(rows, { onConflict: "user_id,local_id" })).error);
      }
      for (const rows of chunkRows(b.sessions.map((s) => ({ local_id: s.localId, game_id: s.gameId, status: s.status, state: s.state, started_at: s.startedAt, finished_at: s.finishedAt })))) {
        must((await db.from("sessions").upsert(rows, { onConflict: "user_id,local_id" })).error);
      }
      for (const rows of chunkRows(b.cards.map((c) => ({ card_key: c.cardKey, game_id: c.gameId, challenge_id: c.challengeId, box: c.box, due: c.due, mastered: c.mastered })))) {
        must((await db.from("deck_cards").upsert(rows, { onConflict: "user_id,card_key" })).error);
      }
      for (let i = 0; i < b.deletedGames.length; i += MAX_IDS_PER_FILTER) {
        must((await db.from("games").update({ deleted_at: new Date().toISOString() }).in("local_id", b.deletedGames.slice(i, i + MAX_IDS_PER_FILTER))).error);
      }
    },
  };
}
