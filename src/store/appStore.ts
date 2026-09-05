"use client";
/**
 * Local-first application store.
 * The UI always reads from this store (guest and account modes alike). Account users get
 * background sync (see src/store/sync.ts) that pushes dirty records and pulls remote changes.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type {
  ActiveSession, AiConversation, AppNotification, AuthState, BaselineTest, CompletedSession, ExerciseResult,
  FavoriteExercise, PersonalBest, PlannedSession, Profile, SavedWorkout, Settings, SyncedCollection,
  TrainingPlan, TrainingWeek, UserAchievement, UserChallenge, Workout, XpEvent,
} from "@/lib/types";
import { newId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";

export interface CollectionTypes {
  workouts: Workout;
  plannedSessions: PlannedSession;
  trainingWeeks: TrainingWeek;
  trainingPlans: TrainingPlan;
  completedSessions: CompletedSession;
  exerciseResults: ExerciseResult;
  personalBests: PersonalBest;
  baselineTests: BaselineTest;
  xpEvents: XpEvent;
  userChallenges: UserChallenge;
  userAchievements: UserAchievement;
  savedWorkouts: SavedWorkout;
  favoriteExercises: FavoriteExercise;
  notifications: AppNotification;
  aiConversations: AiConversation;
}

export type CollectionName = keyof CollectionTypes & SyncedCollection;
export type Collections = { [K in CollectionName]: Record<string, CollectionTypes[K]> };

export interface SyncStatus {
  state: "idle" | "syncing" | "offline" | "error" | "disabled";
  lastSyncAt?: string;
  error?: string;
  pending: number;
}

export const DEFAULT_SETTINGS: Settings = {
  locale: "he",
  theme: "system",
  textScale: 1,
  sound: true,
  vibration: true,
  voiceCount: false,
  keepAwake: true,
  highContrastSession: true,
  aiDataSharing: { profile: true, results: true, history: true, notes: true },
  reminders: { plannedSession: true, postponedSession: true, weeklySummary: true, weeklyChallenge: true, comebackAfterBreak: true, leadMinutes: 60 },
  updatedAt: "1970-01-01T00:00:00.000Z",
};

export function emptyCollections(): Collections {
  return {
    workouts: {}, plannedSessions: {}, trainingWeeks: {}, trainingPlans: {}, completedSessions: {}, exerciseResults: {},
    personalBests: {}, baselineTests: {}, xpEvents: {}, userChallenges: {}, userAchievements: {}, savedWorkouts: {},
    favoriteExercises: {}, notifications: {}, aiConversations: {},
  };
}

export interface AppState {
  hydrated: boolean;
  auth: AuthState;
  profile: Profile | null;
  settings: Settings;
  activeSession: ActiveSession | null;
  collections: Collections;
  /** Dirty records awaiting push, keyed `${collection}:${id}` (singletons use their name as id). */
  syncQueue: Record<string, { collection: string; id: string; updatedAt: string }>;
  syncStatus: SyncStatus;
  /** True after the user explicitly dismissed the "resume active session" prompt for this session id. */
  resumePromptDismissedFor?: string;

  setHydrated: (v: boolean) => void;
  setAuth: (patch: Partial<AuthState>) => void;
  setProfile: (profile: Profile | null | ((prev: Profile | null) => Profile | null)) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setActiveSession: (session: ActiveSession | null | ((prev: ActiveSession | null) => ActiveSession | null)) => void;
  upsert: <K extends CollectionName>(collection: K, record: CollectionTypes[K]) => void;
  upsertMany: <K extends CollectionName>(collection: K, records: CollectionTypes[K][]) => void;
  /** Soft delete (sets deletedAt) so the deletion syncs. */
  remove: (collection: CollectionName, id: string) => void;
  /** Apply remote records without marking them dirty. Newer updatedAt wins. */
  applyRemote: (collection: CollectionName, records: unknown[]) => void;
  applyRemoteSingleton: (name: "profile" | "settings" | "activeSession", data: unknown, updatedAt: string) => void;
  markSynced: (keys: string[]) => void;
  setSyncStatus: (patch: Partial<SyncStatus>) => void;
  markAllDirty: () => void;
  setResumePromptDismissedFor: (id?: string) => void;
  /** Wipe everything local (account deletion / sign-out without keeping data). */
  resetAll: () => void;
}

type Persisted = Pick<AppState, "auth" | "profile" | "settings" | "activeSession" | "collections" | "syncQueue">;

const idbStorage = {
  getItem: async (name: string) => (await idbGet<string>(name)) ?? null,
  setItem: async (name: string, value: string) => { await idbSet(name, value); },
  removeItem: async (name: string) => { await idbDel(name); },
};

function key(collection: string, id: string) {
  return `${collection}:${id}`;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      auth: { mode: "guest", guestId: newId("guest") },
      profile: null,
      settings: DEFAULT_SETTINGS,
      activeSession: null,
      collections: emptyCollections(),
      syncQueue: {},
      syncStatus: { state: "disabled", pending: 0 },
      resumePromptDismissedFor: undefined,

      setHydrated: (v) => set({ hydrated: v }),
      setAuth: (patch) => set((s) => ({ auth: { ...s.auth, ...patch } })),
      setProfile: (profile) =>
        set((s) => {
          const next = typeof profile === "function" ? profile(s.profile) : profile;
          const stamped = next ? { ...next, updatedAt: nowIso() } : null;
          return { profile: stamped, syncQueue: { ...s.syncQueue, [key("profile", "profile")]: { collection: "profile", id: "profile", updatedAt: stamped?.updatedAt ?? nowIso() } } };
        }),
      updateSettings: (patch) =>
        set((s) => {
          const settings = { ...s.settings, ...patch, updatedAt: nowIso() };
          return { settings, syncQueue: { ...s.syncQueue, [key("settings", "settings")]: { collection: "settings", id: "settings", updatedAt: settings.updatedAt } } };
        }),
      setActiveSession: (session) =>
        set((s) => {
          const next = typeof session === "function" ? session(s.activeSession) : session;
          const stamped = next ? { ...next, updatedAt: nowIso() } : null;
          return { activeSession: stamped, syncQueue: { ...s.syncQueue, [key("activeSession", "activeSession")]: { collection: "activeSession", id: "activeSession", updatedAt: nowIso() } } };
        }),
      upsert: (collection, record) => get().upsertMany(collection, [record]),
      upsertMany: (collection, records) =>
        set((s) => {
          const now = nowIso();
          const col = { ...s.collections[collection] } as Record<string, CollectionTypes[typeof collection]>;
          const queue = { ...s.syncQueue };
          for (const r of records) {
            const stamped = { ...r, updatedAt: now } as CollectionTypes[typeof collection];
            col[stamped.id] = stamped;
            queue[key(collection, stamped.id)] = { collection, id: stamped.id, updatedAt: now };
          }
          return { collections: { ...s.collections, [collection]: col }, syncQueue: queue };
        }),
      remove: (collection, id) =>
        set((s) => {
          const existing = s.collections[collection][id] as { deletedAt?: string | null } | undefined;
          if (!existing) return {};
          const now = nowIso();
          const col = { ...s.collections[collection] } as Record<string, unknown>;
          col[id] = { ...existing, deletedAt: now, updatedAt: now };
          return { collections: { ...s.collections, [collection]: col } as Collections, syncQueue: { ...s.syncQueue, [key(collection, id)]: { collection, id, updatedAt: now } } };
        }),
      applyRemote: (collection, records) =>
        set((s) => {
          const col = { ...s.collections[collection] } as Record<string, { id: string; updatedAt: string }>;
          for (const raw of records as { id: string; updatedAt: string }[]) {
            if (!raw || typeof raw.id !== "string") continue;
            const local = col[raw.id];
            if (!local || (raw.updatedAt ?? "") >= (local.updatedAt ?? "")) col[raw.id] = raw;
          }
          return { collections: { ...s.collections, [collection]: col } as Collections };
        }),
      applyRemoteSingleton: (name, data, updatedAt) =>
        set((s) => {
          const local = s[name] as { updatedAt?: string } | null;
          if (local && (local.updatedAt ?? "") > updatedAt) return {};
          if (name === "profile") return { profile: data as Profile | null };
          if (name === "settings") return { settings: { ...DEFAULT_SETTINGS, ...(data as Settings) } };
          return { activeSession: data as ActiveSession | null };
        }),
      markSynced: (keys) =>
        set((s) => {
          const queue = { ...s.syncQueue };
          for (const k of keys) delete queue[k];
          return { syncQueue: queue, syncStatus: { ...s.syncStatus, pending: Object.keys(queue).length } };
        }),
      setSyncStatus: (patch) => set((s) => ({ syncStatus: { ...s.syncStatus, ...patch, pending: patch.pending ?? Object.keys(s.syncQueue).length } })),
      markAllDirty: () =>
        set((s) => {
          const queue: AppState["syncQueue"] = {};
          const now = nowIso();
          for (const c of Object.keys(s.collections) as CollectionName[]) {
            for (const id of Object.keys(s.collections[c])) queue[key(c, id)] = { collection: c, id, updatedAt: now };
          }
          if (s.profile) queue[key("profile", "profile")] = { collection: "profile", id: "profile", updatedAt: now };
          queue[key("settings", "settings")] = { collection: "settings", id: "settings", updatedAt: now };
          if (s.activeSession) queue[key("activeSession", "activeSession")] = { collection: "activeSession", id: "activeSession", updatedAt: now };
          return { syncQueue: queue };
        }),
      setResumePromptDismissedFor: (id) => set({ resumePromptDismissedFor: id }),
      resetAll: () =>
        set({
          auth: { mode: "guest", guestId: newId("guest") },
          profile: null,
          settings: { ...DEFAULT_SETTINGS, locale: get().settings.locale, theme: get().settings.theme },
          activeSession: null,
          collections: emptyCollections(),
          syncQueue: {},
          syncStatus: { state: "disabled", pending: 0 },
          resumePromptDismissedFor: undefined,
        }),
    }),
    {
      name: "disccoach-v1",
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
      partialize: (s): Persisted => ({ auth: s.auth, profile: s.profile, settings: s.settings, activeSession: s.activeSession, collections: s.collections, syncQueue: s.syncQueue }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Persisted>;
        const active = p.activeSession ?? null;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
          collections: { ...emptyCollections(), ...(p.collections ?? {}) },
          // A reload never continues a running timer silently: the session comes back paused and the UI offers to resume.
          activeSession: active && active.timer?.running ? { ...active, mode: "paused", timer: { ...active.timer, running: false, lastTickAt: null } } : active,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/* ---------------- selectors ---------------- */

export function listCollection<K extends CollectionName>(state: Pick<AppState, "collections">, collection: K): CollectionTypes[K][] {
  return Object.values(state.collections[collection]).filter((r) => !(r as { deletedAt?: string | null }).deletedAt) as CollectionTypes[K][];
}

export function useCollection<K extends CollectionName>(collection: K): Record<string, CollectionTypes[K]> {
  return useAppStore((s) => s.collections[collection]);
}
