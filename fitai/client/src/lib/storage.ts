/**
 * localStorage wrapper that never throws (private mode, quota, disabled storage).
 * Used only for UI preferences and crash-recovery caches — never as the source of truth.
 */
export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
