/**
 * Backup file for the offline app: "Export my games" writes one JSON file with the games, play sessions and the
 * review deck; "Import" reads one back. The file is untrusted input (it may be edited, damaged or come from another
 * app): it is checked with zod, every game spec is re-validated with `validateGameSpec` (which also sanitises it)
 * before it is stored, and records are merged without overwriting newer local data. Pure: no DOM, no network.
 */
import { z } from "zod";
import { generatorInfoSchema } from "../game/spec/schema";
import { validateGameSpec } from "../game/spec/validate";
import type { PlayState } from "../game/state/progress";
import type { DeckCard } from "./deck";
import type { ImportCounts, OfflineStore, StoredGame, StoredSession } from "./store";

export const BACKUP_FORMAT = "levelup-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 30_000_000;
const MAX_GAMES = 500;
const MAX_SESSIONS = 5000;
const MAX_CARDS = 20_000;

const id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
const ms = z.number().finite().nonnegative();
const rec = <T extends z.ZodType>(v: T) => z.record(z.string().max(200), v);

const challengeRecordSchema = z.object({
  stationId: z.string().max(200), attempts: z.number().int().nonnegative(), wrong: z.number().int().nonnegative(), hints: z.number().int().nonnegative(),
  resolved: z.boolean(), correct: z.boolean(), revealed: z.boolean(), points: z.number().finite(), timeMs: z.number().finite().nullable(),
});

const playStateSchema = z.object({
  v: z.literal(1),
  areaId: z.string().max(200),
  position: z.object({ x: z.number().finite(), y: z.number().finite(), z: z.number().finite(), yaw: z.number().finite() }).nullable(),
  checkpoint: z.object({ id: z.string().max(200), areaId: z.string().max(200), x: z.number().finite(), y: z.number().finite(), z: z.number().finite() }).nullable(),
  served: rec(z.string().max(200)),
  records: rec(challengeRecordSchema),
  resolvedStations: rec(z.enum(["correct", "revealed"])),
  collected: z.array(z.string().max(200)).max(5000),
  talked: z.array(z.string().max(200)).max(5000),
  visited: z.array(z.string().max(200)).max(5000),
  openedAt: rec(z.number().finite()),
  recent: z.array(z.enum(["good", "bad"])).max(200),
  streak: z.number().int().nonnegative(),
  hintsUsed: z.number().int().nonnegative(),
  score: z.number().finite(),
  achievements: z.array(z.string().max(200)).max(500),
  missionsDone: z.array(z.string().max(200)).max(500),
  finished: z.boolean(),
  startedAt: ms,
  updatedAt: ms,
});

const gameSchema = z.object({
  id, title: z.string().max(300), createdAt: ms, updatedAt: ms.optional(), revision: z.number().int().positive().max(1_000_000),
  spec: z.unknown(), // re-validated with validateGameSpec below, never trusted as-is
});

const sessionSchema = z.object({
  id, gameId: id, revision: z.number().int().positive().max(1_000_000), status: z.enum(["ACTIVE", "COMPLETED", "ABANDONED"]),
  state: playStateSchema, startedAt: ms, finishedAt: ms.nullable(), updatedAt: ms.optional(),
});

const cardSchema = z.object({
  key: z.string().max(200), gameId: id, challengeId: z.string().max(200), box: z.number().int().min(1).max(10), due: ms, added: ms,
  reviews: z.number().int().nonnegative(), updatedAt: ms.optional(), mastered: z.boolean(),
});

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().positive(),
  exportedAt: ms,
  games: z.array(z.unknown()).max(MAX_GAMES),
  sessions: z.array(z.unknown()).max(MAX_SESSIONS),
  deck: z.array(z.unknown()).max(MAX_CARDS),
});

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  games: StoredGame[];
  sessions: StoredSession[];
  deck: DeckCard[];
}

export type BackupErrorCode = "TOO_LARGE" | "NOT_JSON" | "NOT_A_BACKUP" | "NEWER_VERSION" | "INVALID";
export class BackupError extends Error {
  constructor(public code: BackupErrorCode, message: string) {
    super(message);
  }
}

export interface RejectedGame { id: string; title: string; reason: string }
export interface ImportReport extends ImportCounts {
  /** Games in the file that were damaged or failed validation, so were not stored. */
  rejectedGames: RejectedGame[];
  /** Sessions and review cards dropped because they were damaged or their game was missing/rejected. */
  droppedSessions: number;
  droppedCards: number;
}

/** The backup file's contents, as a plain object (stringify it to write the file). */
export function createBackup(store: OfflineStore, now: number = Date.now()): BackupFile {
  const { games, sessions, cards } = store.exportData();
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now, games, sessions, deck: cards };
}

export const backupFileName = (now: number = Date.now()): string => `levelup-backup-${new Date(now).toISOString().slice(0, 10)}.json`;

/** Parse backup text. Throws BackupError with a code the UI turns into a message. Does not touch the store. */
export function parseBackup(text: string): z.infer<typeof backupSchema> {
  if (text.length > MAX_BACKUP_BYTES) throw new BackupError("TOO_LARGE", "The file is too large to be a backup.");
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new BackupError("NOT_JSON", "The file is not valid JSON."); }
  if (!raw || typeof raw !== "object" || (raw as { format?: unknown }).format !== BACKUP_FORMAT) throw new BackupError("NOT_A_BACKUP", "This is not a LEVEL UP backup file.");
  const version = (raw as { version?: unknown }).version;
  if (typeof version === "number" && version > BACKUP_VERSION) throw new BackupError("NEWER_VERSION", "This backup was made by a newer version of the app. Update the app and try again.");
  const parsed = backupSchema.safeParse(raw);
  if (!parsed.success) throw new BackupError("INVALID", "The backup file is damaged or incomplete.");
  return parsed.data;
}

/** Validate a game record: schema, then the spec through validateGameSpec (use the sanitised spec it returns). */
function checkGame(input: unknown): { ok: true; game: StoredGame } | { ok: false; rejected: RejectedGame } {
  const meta = input && typeof input === "object" ? (input as { id?: unknown; title?: unknown }) : {};
  const label = { id: typeof meta.id === "string" ? meta.id.slice(0, 64) : "?", title: typeof meta.title === "string" ? meta.title.slice(0, 80) : "?" };
  const parsed = gameSchema.safeParse(input);
  if (!parsed.success) return { ok: false, rejected: { ...label, reason: "damaged record" } };
  const res = validateGameSpec(parsed.data.spec);
  if (!res.ok) return { ok: false, rejected: { ...label, reason: res.errors[0] ?? "invalid game" } };
  const g = parsed.data;
  // validateGameSpec strips meta.generator (a model must not set it). A backup of the device's own games must keep its
  // honest label, so restore it from the file when well-formed. This app has no AI, so an "ai" claim is dropped (shown as demo).
  const declared = generatorInfoSchema.safeParse((g.spec as { meta?: { generator?: unknown } } | null)?.meta?.generator);
  if (declared.success && declared.data.kind !== "ai") res.spec.meta.generator = declared.data;
  return { ok: true, game: { id: g.id, title: g.title, createdAt: g.createdAt, updatedAt: g.updatedAt ?? g.createdAt, revision: g.revision, spec: res.spec } };
}

/**
 * Import backup text into the store. Throws BackupError when the file as a whole is unusable; individual bad games,
 * sessions or cards are skipped and counted in the report so one damaged game never blocks the rest.
 */
export function importBackup(store: OfflineStore, text: string): ImportReport {
  const backup = parseBackup(text);
  const rejectedGames: RejectedGame[] = [];
  const games: StoredGame[] = [];
  const seen = new Set<string>();
  for (const g of backup.games) {
    const r = checkGame(g);
    if (!r.ok) { rejectedGames.push(r.rejected); continue; }
    if (seen.has(r.game.id)) { rejectedGames.push({ id: r.game.id, title: r.game.title, reason: "duplicate id" }); continue; }
    seen.add(r.game.id);
    games.push(r.game);
  }
  const rejectedIds = new Set(rejectedGames.map((g) => g.id));
  // a rejected game's id that is also valid elsewhere in the file must not pull its sessions in
  const gameKnown = (gameId: string) => !rejectedIds.has(gameId) && (seen.has(gameId) || store.getGame(gameId) !== null);

  let droppedSessions = 0;
  const sessions: StoredSession[] = [];
  for (const s of backup.sessions) {
    const p = sessionSchema.safeParse(s);
    if (!p.success || !gameKnown(p.data.gameId)) { droppedSessions++; continue; }
    const d = p.data;
    sessions.push({ ...d, state: d.state as PlayState, updatedAt: d.updatedAt ?? d.startedAt });
  }
  let droppedCards = 0;
  const cards: DeckCard[] = [];
  for (const c of backup.deck) {
    const p = cardSchema.safeParse(c);
    if (!p.success || !gameKnown(p.data.gameId)) { droppedCards++; continue; }
    cards.push({ ...p.data, updatedAt: p.data.updatedAt ?? p.data.added });
  }
  const counts = store.importRecords({ games, sessions, cards });
  return { ...counts, rejectedGames, droppedSessions, droppedCards };
}
