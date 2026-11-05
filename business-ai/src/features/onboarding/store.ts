/**
 * Device-local onboarding draft: what the user is typing on the current step, persisted to
 * AsyncStorage (localStorage on web) so closing the app mid-step restores it. Answers that were
 * saved live in `onboarding_responses`; a draft only covers the step in progress and is cleared as
 * soon as that step is saved (Continue / Skip).
 *
 * Scope: a business id, or `newScope(userId)` for the first step before the business exists.
 * Drafts never leave the device and expire after 30 days.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { OnboardingKey } from '@domain/onboarding';

export const ONBOARDING_DRAFT_STORAGE_KEY = 'businessai.onboarding.draft';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Form field values as typed (strings only — parsed on Continue). */
export type DraftFields = Readonly<Record<string, string>>;

export interface DraftEntry {
  fields: DraftFields;
  updatedAt: number;
}

interface OnboardingDraftState {
  drafts: Record<string, DraftEntry>;
  setDraft: (scope: string, key: OnboardingKey, fields: DraftFields) => void;
  clearDraft: (scope: string, key: OnboardingKey) => void;
  clearScope: (scope: string) => void;
  clearAll: () => void;
}

/** Scope for a business that does not exist yet (per user, so accounts never share drafts). */
export function newScope(userId: string | null | undefined): string {
  return `new:${userId ?? 'anonymous'}`;
}

function draftId(scope: string, key: OnboardingKey): string {
  return `${scope}/${key}`;
}

export const useOnboardingDraftStore = create<OnboardingDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (scope, key, fields) =>
        set((s) => ({ drafts: { ...s.drafts, [draftId(scope, key)]: { fields: { ...fields }, updatedAt: Date.now() } } })),
      clearDraft: (scope, key) =>
        set((s) => {
          const id = draftId(scope, key);
          if (!(id in s.drafts)) return s;
          const { [id]: _removed, ...rest } = s.drafts;
          return { drafts: rest };
        }),
      clearScope: (scope) =>
        set((s) => ({
          drafts: Object.fromEntries(Object.entries(s.drafts).filter(([id]) => !id.startsWith(`${scope}/`))),
        })),
      clearAll: () => set({ drafts: {} }),
    }),
    {
      name: ONBOARDING_DRAFT_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ drafts: s.drafts }),
      merge: (persisted, current) => {
        const stored = (persisted as { drafts?: Record<string, DraftEntry> } | undefined)?.drafts ?? {};
        const now = Date.now();
        const fresh = Object.fromEntries(
          Object.entries(stored).filter(([, d]) => d && typeof d.updatedAt === 'number' && now - d.updatedAt < MAX_AGE_MS),
        );
        // Anything typed before hydration finished wins over the stored copy.
        return { ...current, drafts: { ...fresh, ...current.drafts } };
      },
    },
  ),
);

/** Reads one draft (or undefined). */
export function getDraft(scope: string, key: OnboardingKey): DraftEntry | undefined {
  return useOnboardingDraftStore.getState().drafts[draftId(scope, key)];
}

function subscribeHydration(listener: () => void): () => void {
  const unsubFinish = useOnboardingDraftStore.persist.onFinishHydration(listener);
  const unsubStart = useOnboardingDraftStore.persist.onHydrate(listener);
  return () => {
    unsubFinish();
    unsubStart();
  };
}

/** True once the stored draft has been read from AsyncStorage (restore only after this). */
export function useDraftHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    () => useOnboardingDraftStore.persist.hasHydrated(),
    () => true,
  );
}
