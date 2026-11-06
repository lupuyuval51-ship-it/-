import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AiTarget, CategorySlug, ExperienceLevel, Locale, OnboardingAnswers, PromptPlatform } from '@/data/types';

export type ThemeMode = 'system' | 'dark' | 'light';

export interface PreferencesState {
  locale: Locale;
  themeMode: ThemeMode;
  displayName: string;
  onboardingCompleted: boolean;
  onboarding: OnboardingAnswers;
  /** True once the persisted state has been read from storage. */
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setDisplayName: (name: string) => void;
  setOnboarding: (answers: Partial<OnboardingAnswers>) => void;
  toggleInterest: (slug: CategorySlug) => void;
  setExperience: (level: ExperienceLevel | null) => void;
  setPlatform: (platform: PromptPlatform | null) => void;
  setAssistant: (assistant: AiTarget | null) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setHydrated: (value: boolean) => void;
}

export const emptyOnboarding: OnboardingAnswers = {
  interests: [],
  experience: null,
  platform: null,
  assistant: null,
};

export const PREFERENCES_STORAGE_KEY = 'appspark.preferences.v1';

export const usePreferences = create<PreferencesState>()(
  persist(
    (set, get) => ({
      locale: 'he',
      themeMode: 'system',
      displayName: '',
      onboardingCompleted: false,
      onboarding: emptyOnboarding,
      hydrated: false,
      setLocale: (locale) => set({ locale }),
      setThemeMode: (themeMode) => set({ themeMode }),
      setDisplayName: (displayName) => set({ displayName: displayName.trim().slice(0, 40) }),
      setOnboarding: (answers) => set({ onboarding: { ...get().onboarding, ...answers } }),
      toggleInterest: (slug) => {
        const current = get().onboarding.interests;
        const interests = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
        set({ onboarding: { ...get().onboarding, interests } });
      },
      setExperience: (experience) => set({ onboarding: { ...get().onboarding, experience } }),
      setPlatform: (platform) => set({ onboarding: { ...get().onboarding, platform } }),
      setAssistant: (assistant) => set({ onboarding: { ...get().onboarding, assistant } }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      resetOnboarding: () => set({ onboardingCompleted: false, onboarding: emptyOnboarding }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: PREFERENCES_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        locale: state.locale,
        themeMode: state.themeMode,
        displayName: state.displayName,
        onboardingCompleted: state.onboardingCompleted,
        onboarding: state.onboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
