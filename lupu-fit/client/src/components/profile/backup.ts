import { BackupPayloadSchema, type BackupPayload } from '@lupu-fit/shared';

export interface BackupCounts { weights: number; foodEntries: number; sessions: number }
export type ParsedBackup = { ok: true; backup: BackupPayload; counts: BackupCounts } | { ok: false; reason: 'json' | 'shape' | 'schema'; path?: string };

export const countsOf = (b: BackupPayload): BackupCounts => ({ weights: b.bodyWeight.length, foodEntries: b.foodLog.length, sessions: b.sessions.length });

/** Accepts the full export file ({ backup, extra }) or a bare backup object; validates with the shared BackupPayloadSchema. */
export function parseBackupText(text: string): ParsedBackup {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return { ok: false, reason: 'json' }; }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, reason: 'shape' };
  const o = raw as Record<string, unknown>;
  const candidate = typeof o['backup'] === 'object' && o['backup'] !== null ? o['backup'] : raw;
  const r = BackupPayloadSchema.safeParse(candidate);
  if (!r.success) return { ok: false, reason: 'schema', path: r.error.issues[0]?.path.join('.') || undefined };
  return { ok: true, backup: r.data, counts: countsOf(r.data) };
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
