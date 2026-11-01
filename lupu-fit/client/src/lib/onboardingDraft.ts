/** Onboarding draft persistence: localStorage only (preferences-grade data, never tokens), 3-day TTL. */
export const ONBOARDING_DRAFT_KEY = 'lf_onboarding_draft';
export const ONBOARDING_DRAFT_TTL_MS = 3 * 24 * 60 * 60 * 1000;

export interface StoredDraft { savedAt: number; step: number; data: Record<string, unknown> }

export function saveOnboardingDraft(step: number, data: Record<string, unknown>, now: number = Date.now()): void {
  try { localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ savedAt: now, step, data } satisfies StoredDraft)); } catch { /* storage unavailable */ }
}

export function clearOnboardingDraft(): void {
  try { localStorage.removeItem(ONBOARDING_DRAFT_KEY); } catch { /* storage unavailable */ }
}

/** Returns the stored draft, or null when absent, malformed or older than the TTL (expired drafts are removed). */
export function loadOnboardingDraft(now: number = Date.now()): StoredDraft | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<StoredDraft> | null;
    const ok = v !== null && typeof v === 'object' && typeof v.savedAt === 'number' && typeof v.step === 'number' && typeof v.data === 'object' && v.data !== null && !Array.isArray(v.data);
    if (!ok || now - (v as StoredDraft).savedAt > ONBOARDING_DRAFT_TTL_MS || now < (v as StoredDraft).savedAt) { clearOnboardingDraft(); return null; }
    return v as StoredDraft;
  } catch { return null; }
}
