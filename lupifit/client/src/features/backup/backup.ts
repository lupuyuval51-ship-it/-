/**
 * Backup file: the account export from the server plus what only lives on this device (changes that
 * have not synced yet, workout settings), in one JSON file the user keeps.
 *
 * Restoring is deliberately limited to things that can be re-created safely through the app's normal,
 * validated create endpoints without overwriting anything newer: weigh-ins for days that have none,
 * food-diary entries that are not there yet (re-created as quick entries with their saved nutrients) and
 * the device's unsynced changes and workout settings (when they differ). Plans, workout history, records and coach
 * conversations stay in the file as an archive.
 */
import { LIMITS } from '@shared/constants';
import { quickAddSchema, type QuickAddInput } from '@shared/schemas/nutrition';
import { bodyWeightSchema, type BodyWeightInput } from '@shared/schemas/progress';
import type { AccountExportDTO, WorkoutPrefsDTO } from '@shared/types';
import { DEFAULT_WORKOUT_PREFS } from '@shared/types';
import type { DeviceSnapshot } from '../../device/worker/protocol';
import { isOutboxEntry, type OutboxEntry } from '../offline/outbox';

export const BACKUP_FORMAT = 'lupu-fit-backup';
/** Larger files are refused before parsing (a year of data is well under this). */
export const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

export interface DeviceState {
  outbox: OutboxEntry[];
  workoutPrefs: WorkoutPrefsDTO;
  /**
   * Device mode only: the exact copy of everything on the phone (database rows), which a device-mode restore
   * puts back in full. Checked by the device worker; server mode ignores it.
   */
  snapshot?: DeviceSnapshot;
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: 1;
  createdAt: string;
  account: AccountExportDTO;
  device: DeviceState;
}

export function buildBackup(account: AccountExportDTO, device: DeviceState, now: Date = new Date()): BackupFile {
  return { format: BACKUP_FORMAT, version: 1, createdAt: now.toISOString(), account, device };
}

export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; reason: 'too_large' | 'not_json' | 'not_a_backup' | 'unsupported_version' };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function parseBackup(text: string, sizeBytes: number = text.length, maxBytes: number = MAX_BACKUP_BYTES): ParseResult {
  if (sizeBytes > maxBytes) return { ok: false, reason: 'too_large' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not_json' };
  }
  if (!isRecord(raw) || raw.format !== BACKUP_FORMAT || !isRecord(raw.account)) return { ok: false, reason: 'not_a_backup' };
  if (raw.version !== 1) return { ok: false, reason: 'unsupported_version' };
  const account = raw.account as unknown as AccountExportDTO;
  const device = isRecord(raw.device) ? raw.device : {};
  return {
    ok: true,
    backup: {
      format: BACKUP_FORMAT,
      version: 1,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
      account: { ...account, bodyWeights: Array.isArray(account.bodyWeights) ? account.bodyWeights : [], foodLog: Array.isArray(account.foodLog) ? account.foodLog : [] },
      device: {
        outbox: Array.isArray(device.outbox) ? device.outbox.filter(isOutboxEntry) : [],
        workoutPrefs: isRecord(device.workoutPrefs) ? { ...DEFAULT_WORKOUT_PREFS, ...pickBooleans(device.workoutPrefs) } : DEFAULT_WORKOUT_PREFS,
        ...(isRecord(device.snapshot) ? { snapshot: device.snapshot as unknown as DeviceSnapshot } : {}),
      },
    },
  };
}

const PREF_KEYS = ['wakeLock', 'vibrate', 'autoAdvance', 'restSound'] as const;

function pickBooleans(o: Record<string, unknown>): Partial<WorkoutPrefsDTO> {
  const out: Partial<WorkoutPrefsDTO> = {};
  for (const k of PREF_KEYS) if (typeof o[k] === 'boolean') out[k] = o[k];
  return out;
}

export interface RestoreWeight {
  key: string;
  input: BodyWeightInput;
}
export interface RestoreFood {
  key: string;
  input: QuickAddInput;
}

export interface RestorePlan {
  weights: RestoreWeight[];
  foods: RestoreFood[];
  /** The device's unsynced changes that the account does not have yet. */
  outbox: OutboxEntry[];
  /** The file's workout settings, only when they differ from this device's current ones (else null: nothing to change). */
  workoutPrefs: WorkoutPrefsDTO | null;
  /** Entries in the file that were skipped because they already exist. */
  alreadyThere: number;
  /** Entries that could not be read or are not valid (future dates, out-of-range values …). */
  unreadable: number;
}

const SAFE_KEY = /^[A-Za-z0-9_-]{8,100}$/;
const norm = (s: string) => s.trim().toLowerCase();
const foodSignature = (date: string, meal: string, kcal: number, name: string) => `${date}|${meal}|${Math.round(kcal)}|${norm(name)}`;
const localizedName = (v: unknown): string => (isRecord(v) ? String(v.en || v.he || '') : '');

/**
 * Compares the file with what the account has now (`server`) and lists only what is missing, and the file's
 * workout settings only when they differ from `currentPrefs`. Running a restore twice therefore changes
 * nothing the second time.
 */
export function planRestore(
  backup: BackupFile,
  server: Pick<AccountExportDTO, 'bodyWeights' | 'foodLog'>,
  currentOutboxIds: ReadonlySet<string>,
  today: string,
  currentPrefs: WorkoutPrefsDTO,
): RestorePlan {
  let alreadyThere = 0;
  let unreadable = 0;

  const haveWeightDates = new Set(server.bodyWeights.map((w) => String(w.measuredOn)));
  const weights: RestoreWeight[] = [];
  for (const w of backup.account.bodyWeights) {
    const parsed = bodyWeightSchema.safeParse({ date: w.measuredOn, weightKg: typeof w.weightKg === 'number' ? w.weightKg : Number(w.weightKg), note: typeof w.note === 'string' ? w.note : '' });
    if (!parsed.success || parsed.data.date > today) {
      unreadable++;
      continue;
    }
    if (haveWeightDates.has(parsed.data.date) || weights.some((x) => x.input.date === parsed.data.date)) {
      alreadyThere++;
      continue;
    }
    weights.push({ key: keyFor('restore-w', String(w.id ?? parsed.data.date)), input: parsed.data });
  }

  // A multiset: two identical entries in the file are two meals. Each one the account already has "uses up" one
  // copy, so a restore adds exactly the difference and a second run adds nothing.
  const haveFood = new Map<string, number>();
  for (const f of server.foodLog) {
    const sig = foodSignature(String(f.loggedOn), String(f.mealType), Number(f.kcal), localizedName(f.foodName));
    haveFood.set(sig, (haveFood.get(sig) ?? 0) + 1);
  }
  const foods: RestoreFood[] = [];
  for (const f of backup.account.foodLog) {
    const name = localizedName(f.foodName);
    const parsed = quickAddSchema.safeParse({
      date: f.loggedOn,
      mealType: f.mealType,
      name: name.slice(0, LIMITS.textShortMax) || 'Restored entry',
      kcal: Number(f.kcal),
      proteinG: Number(f.proteinG ?? 0),
      carbsG: Number(f.carbsG ?? 0),
      fatG: Number(f.fatG ?? 0),
      fiberG: Number(f.fiberG ?? 0),
      note: typeof f.note === 'string' ? f.note.slice(0, 200) : '',
    });
    if (!parsed.success || parsed.data.date > today) {
      unreadable++;
      continue;
    }
    const sig = foodSignature(parsed.data.date, parsed.data.mealType, parsed.data.kcal, parsed.data.name);
    const left = haveFood.get(sig) ?? 0;
    if (left > 0) {
      haveFood.set(sig, left - 1);
      alreadyThere++;
      continue;
    }
    foods.push({ key: keyFor('restore-f', String(f.id ?? sig)), input: parsed.data });
  }

  const outbox = backup.device.outbox.filter((e) => {
    if (e.status !== 'pending' || currentOutboxIds.has(e.id)) return false;
    const op = e.op;
    if (op.type === 'weight') return !haveWeightDates.has(op.input.date);
    const name = op.type === 'quick_add' ? op.input.name : localizedName(op.preview.name);
    const kcal = op.type === 'quick_add' ? op.input.kcal : op.preview.kcal;
    return (haveFood.get(foodSignature(op.input.date, op.input.mealType, kcal, name)) ?? 0) === 0;
  });

  const filePrefs = backup.device.workoutPrefs;
  const workoutPrefs = PREF_KEYS.some((k) => filePrefs[k] !== currentPrefs[k]) ? filePrefs : null;

  return { weights, foods, outbox, workoutPrefs, alreadyThere, unreadable };
}

function keyFor(prefix: string, id: string): string {
  const k = `${prefix}-${id}`;
  return SAFE_KEY.test(k) ? k : `${prefix}-${id.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 60).padEnd(8, '0')}`;
}

export const planIsEmpty = (p: RestorePlan) => p.weights.length === 0 && p.foods.length === 0 && p.outbox.length === 0 && p.workoutPrefs == null;
