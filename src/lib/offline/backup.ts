/**
 * Backup file for the offline app: "Export my games" writes one JSON file with the games, play sessions and the
 * review deck; "Import" reads one back. The file is untrusted input (it may be edited, damaged or come from another
 * app): it is checked with zod, every game spec is re-validated with `validateGameSpec` (which also sanitises it)
 * before it is stored, and records are merged without overwriting newer local data. Pure: no DOM, no network.
 */
import { z } from "zod";
import { checkCardRecord, checkGameRecord, checkSessionRecord, type RejectedGame } from "./records";
import type { DeckCard } from "./deck";
import { isStorageError, type ImportCounts, type OfflineStore, type StoredGame, type StoredSession } from "./store";

export type { RejectedGame };
export const BACKUP_FORMAT = "levelup-backup";
export const BACKUP_VERSION = 1;
/** Longest backup text (characters) that is read or written. A file made by the app always stays under it (see `serializeBackup`). */
export const MAX_BACKUP_BYTES = 30_000_000;
/** Largest file on disk worth opening: the text limit at 3 bytes per character (UTF-8), checked before the file is read into memory. */
export const MAX_BACKUP_FILE_BYTES = MAX_BACKUP_BYTES * 3;
export const MAX_GAMES = 500;
export const MAX_SESSIONS = 5000;
export const MAX_CARDS = 20_000;

const ms = z.number().finite().nonnegative();

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

/** Every reason a backup can fail; the screen has a message `mob.backup.err.<CODE>` for each (checked by a test, in both languages). */
export const BACKUP_ERROR_CODES = ["TOO_LARGE", "NOT_JSON", "NOT_A_BACKUP", "NEWER_VERSION", "INVALID", "EXPORT_TOO_LARGE", "STORAGE_FULL", "STORAGE_UNAVAILABLE"] as const;
export type BackupErrorCode = (typeof BACKUP_ERROR_CODES)[number];
export class BackupError extends Error {
  constructor(public code: BackupErrorCode, message: string) {
    super(message);
  }
}

export interface ImportReport extends ImportCounts {
  /** Games in the file that were damaged or failed validation, so were not stored. */
  rejectedGames: RejectedGame[];
  /** Sessions and review cards dropped because they were damaged or their game was missing/rejected. */
  droppedSessions: number;
  droppedCards: number;
}

/**
 * The backup file's contents, as a plain object. Runs beyond the import limit are left out oldest-abandoned first, so a
 * file the app writes can always be read back by the app (the runs that matter most, unfinished and finished ones, go first).
 */
export function createBackup(store: OfflineStore, now: number = Date.now()): BackupFile {
  const { games, sessions, cards } = store.exportData();
  const weight = (s: StoredSession) => (s.status === "ABANDONED" ? 0 : 1);
  const keptSessions = sessions.length <= MAX_SESSIONS ? sessions : [...sessions].sort((a, b) => weight(b) - weight(a) || b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS);
  const keptCards = cards.length <= MAX_CARDS ? cards : [...cards].sort((a, b) => Number(a.mastered) - Number(b.mastered) || b.updatedAt - a.updatedAt).slice(0, MAX_CARDS);
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now, games, sessions: keptSessions, deck: keptCards };
}

/**
 * The text to write to the file. Throws BackupError("EXPORT_TOO_LARGE") instead of producing a file this app would refuse to
 * open again (more games, or more bytes, than an import accepts): a backup that cannot be restored is worse than none.
 */
export function serializeBackup(backup: BackupFile): string {
  if (backup.games.length > MAX_GAMES) throw new BackupError("EXPORT_TOO_LARGE", "There are too many games for one backup file.");
  const text = JSON.stringify(backup);
  if (text.length > MAX_BACKUP_BYTES) throw new BackupError("EXPORT_TOO_LARGE", "The games are too big for one backup file.");
  return text;
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

/** True when a file of this size (bytes) is certainly too large to be a backup, so it is not even read into memory. */
export const fileTooLarge = (sizeBytes: number): boolean => sizeBytes > MAX_BACKUP_FILE_BYTES;

/**
 * Import backup text into the store. Throws BackupError when the file as a whole is unusable; individual bad games,
 * sessions or cards are skipped and counted in the report so one damaged game never blocks the rest.
 * Sessions written by older app versions (no `bossesDefeated`, no `updatedAt`) are accepted and completed.
 */
export function importBackup(store: OfflineStore, text: string): ImportReport {
  const backup = parseBackup(text);
  const rejectedGames: RejectedGame[] = [];
  const games: StoredGame[] = [];
  const seen = new Set<string>();
  for (const g of backup.games) {
    const r = checkGameRecord(g);
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
    const p = checkSessionRecord(s);
    if (!p || !gameKnown(p.gameId)) { droppedSessions++; continue; }
    sessions.push(p);
  }
  let droppedCards = 0;
  const cards: DeckCard[] = [];
  for (const c of backup.deck) {
    const p = checkCardRecord(c);
    if (!p || !gameKnown(p.gameId)) { droppedCards++; continue; }
    cards.push(p);
  }
  try {
    const counts = store.importRecords({ games, sessions, cards });
    return { ...counts, rejectedGames, droppedSessions, droppedCards };
  } catch (e) {
    // the phone ran out of room part-way: what was stored is complete per record, and importing the same file again continues
    if (isStorageError(e)) throw new BackupError(e.code as "STORAGE_FULL" | "STORAGE_UNAVAILABLE", e.message);
    throw e;
  }
}
