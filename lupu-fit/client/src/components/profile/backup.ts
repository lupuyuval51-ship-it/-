import { BACKUP_VERSION, BackupPayloadSchema, ClientSettingsSchema, type BackupPayload, type BackupV2, type ClientSettings } from '@lupu-fit/shared';

/** How many things a backup holds, as the confirmation sheet shows them. */
export interface BackupCounts {
  workouts: number; foods: number; weights: number; readiness: number; plans: number; savedMeals: number; customFoods: number; threads: number; messages: number;
}
/** Sections only a version 2 file carries (a version 1 file leaves them as they are). */
export const V2_ONLY: readonly (keyof BackupCounts)[] = ['readiness', 'plans', 'savedMeals', 'customFoods', 'threads'];

export type ParseFailure = 'json' | 'shape' | 'notBackup' | 'newer' | 'schema';
export type ParsedBackup =
  | { ok: true; backup: BackupPayload; version: 1 | 2; exportedAt: string; counts: BackupCounts; clientSettings: ClientSettings | null }
  | { ok: false; reason: ParseFailure; path?: string; version?: number };

export function countsOf(b: BackupPayload): BackupCounts {
  const v2: BackupV2 | null = b.version === 2 ? b : null;
  return {
    workouts: b.sessions.filter((s) => s.finishedAt !== null).length, foods: b.foodLog.length, weights: b.bodyWeight.length,
    readiness: v2?.readiness.length ?? 0, plans: v2?.plans.length ?? 0, savedMeals: v2?.savedMeals.length ?? 0, customFoods: v2?.customFoods.length ?? 0,
    threads: v2?.coachThreads.length ?? 0, messages: v2?.coachThreads.reduce((n, t) => n + t.messages.length, 0) ?? 0,
  };
}

/**
 * Reads a backup file's text. Accepts the whole export file (`{ backup, extra, clientSettings }`) or a bare backup object, and says
 * what is wrong in a way the screen can explain: not JSON, not a backup at all, made by a NEWER app, or damaged at a given place.
 * The browser-only settings block is validated on its own: a damaged one is dropped, it never blocks the restore of the data.
 */
export function parseBackupText(text: string): ParsedBackup {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, reason: 'json' }; }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, reason: 'shape' };
  const o = raw as Record<string, unknown>;
  const wrapped = typeof o['backup'] === 'object' && o['backup'] !== null && !Array.isArray(o['backup']);
  const candidate = wrapped ? o['backup'] : raw;
  const version = (candidate as { version?: unknown }).version;
  if (typeof version !== 'number') return { ok: false, reason: 'notBackup' };
  if (Number.isInteger(version) && version > BACKUP_VERSION) return { ok: false, reason: 'newer', version };
  const r = BackupPayloadSchema.safeParse(candidate);
  if (!r.success) return { ok: false, reason: 'schema', path: r.error.issues[0]?.path.join('.') || undefined };
  const cs = wrapped && o['clientSettings'] !== undefined ? ClientSettingsSchema.safeParse(o['clientSettings']) : null;
  return { ok: true, backup: r.data, version: r.data.version, exportedAt: r.data.exportedAt, counts: countsOf(r.data), clientSettings: cs?.success ? cs.data : null };
}

/** The file the person keeps: the server's export plus the browser-only settings block (its own key, never part of the backup itself). */
export function withClientSettings(exported: unknown, settings: ClientSettings): unknown {
  return typeof exported === 'object' && exported !== null && !Array.isArray(exported) ? { ...(exported as object), clientSettings: settings } : exported;
}

export function downloadJson(filename: string, data: unknown): File {
  const file = new File([JSON.stringify(data, null, 2)], filename, { type: 'application/json' });
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return file;
}

/** Blob.text() with a FileReader fallback for older engines. */
export function readFileText(f: Blob): Promise<string> {
  if (typeof f.text === 'function') return f.text();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error ?? new Error('read_failed'));
    r.readAsText(f);
  });
}

/** What the restore route answers (see RestoreSummary in server/src/services/backup.ts). */
export interface RestoreResult {
  ok: boolean;
  policy?: 'replace';
  backupVersion?: 1 | 2;
  restored: Partial<Record<'workouts' | 'sets' | 'foods' | 'weights' | 'plans' | 'savedMeals' | 'customFoods' | 'threads' | 'messages' | 'readiness' | 'personalRecords' | 'xpEvents' | 'achievements' | 'notifications' | 'profile', number>>;
  skipped?: Partial<Record<'profile' | 'unknownExercises' | 'unfinishedWorkouts' | 'duplicateDays' | 'invalidItems' | 'xpEvents' | 'achievements', number>>;
  untouched?: string[];
}
