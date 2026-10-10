import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudApi, CloudCard, CloudGame, CloudRows, CloudSession, PushBatch } from "@/lib/offline/sync";

const PAGE = 500;
/** Re-read a short window before the cursor: a transaction that committed late can carry an older updated_at. The merge is idempotent. */
const OVERLAP_MS = 60_000;

type Row = Record<string, unknown>;

/** Pages through one table in updated_at order. */
async function readAll(db: SupabaseClient, table: string, columns: string, since: string | null, order: string[]): Promise<Row[]> {
  const out: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = db.from(table).select(columns);
    if (since) q = q.gt("updated_at", since);
    for (const col of order) q = q.order(col, { ascending: true });
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Row[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

function must(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
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

    async push(b: PushBatch): Promise<void> {
      // games first: sessions and review cards reference them (foreign key)
      if (b.games.length) must((await db.from("games").upsert(b.games.map((g) => ({ local_id: g.localId, title: g.title, spec: g.spec, created_at: g.createdAt, deleted_at: null })), { onConflict: "user_id,local_id" })).error);
      if (b.sessions.length) must((await db.from("sessions").upsert(b.sessions.map((s) => ({ local_id: s.localId, game_id: s.gameId, status: s.status, state: s.state, started_at: s.startedAt, finished_at: s.finishedAt })), { onConflict: "user_id,local_id" })).error);
      if (b.cards.length) must((await db.from("deck_cards").upsert(b.cards.map((c) => ({ card_key: c.cardKey, game_id: c.gameId, challenge_id: c.challengeId, box: c.box, due: c.due, mastered: c.mastered })), { onConflict: "user_id,card_key" })).error);
      if (b.deletedGames.length) must((await db.from("games").update({ deleted_at: new Date().toISOString() }).in("local_id", b.deletedGames)).error);
    },
  };
}
