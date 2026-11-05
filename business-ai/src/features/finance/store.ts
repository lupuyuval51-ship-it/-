/**
 * Device-local finance UI state (zustand + AsyncStorage): the selected scenario, the forecast
 * month-label style, the reviewed AI proposal item keys and the last fresh AI proposal (so an
 * AI call is not lost when the user navigates away). Never holds financial data of record.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { FinanceProposal } from '@domain/ai-api';
import type { ScenarioKey } from '@domain/finance';

export type MonthLabelMode = 'relative' | 'calendar';

export interface StoredProposal {
  proposal: FinanceProposal;
  receivedAt: string;
}

interface FinanceUiState {
  scenarioByBusiness: Record<string, ScenarioKey>;
  monthLabels: MonthLabelMode;
  reviewedByBusiness: Record<string, string[]>;
  freshProposalByBusiness: Record<string, StoredProposal>;
  setScenario: (businessId: string, scenario: ScenarioKey) => void;
  setMonthLabels: (mode: MonthLabelMode) => void;
  markReviewed: (businessId: string, keys: readonly string[]) => void;
  setFreshProposal: (businessId: string, proposal: FinanceProposal) => void;
}

/** Bound the stored keys per business so the list never grows without limit. */
const MAX_REVIEWED = 300;

export const useFinanceUiStore = create<FinanceUiState>()(
  persist(
    (set) => ({
      scenarioByBusiness: {},
      monthLabels: 'relative',
      reviewedByBusiness: {},
      freshProposalByBusiness: {},
      setScenario: (businessId, scenario) => set((s) => ({ scenarioByBusiness: { ...s.scenarioByBusiness, [businessId]: scenario } })),
      setMonthLabels: (monthLabels) => set({ monthLabels }),
      markReviewed: (businessId, keys) =>
        set((s) => {
          const current = s.reviewedByBusiness[businessId] ?? [];
          const next = Array.from(new Set([...current, ...keys])).slice(-MAX_REVIEWED);
          return { reviewedByBusiness: { ...s.reviewedByBusiness, [businessId]: next } };
        }),
      setFreshProposal: (businessId, proposal) =>
        set((s) => ({
          freshProposalByBusiness: { ...s.freshProposalByBusiness, [businessId]: { proposal, receivedAt: new Date().toISOString() } },
        })),
    }),
    {
      name: 'businessai.finance.ui',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({
        scenarioByBusiness: s.scenarioByBusiness,
        monthLabels: s.monthLabels,
        reviewedByBusiness: s.reviewedByBusiness,
        freshProposalByBusiness: s.freshProposalByBusiness,
      }),
    },
  ),
);

const EMPTY: readonly string[] = [];

/** Selected scenario for a business (default `expected`) and its setter. */
export function useSelectedScenario(businessId: string | null | undefined): [ScenarioKey, (s: ScenarioKey) => void] {
  const scenario = useFinanceUiStore((s) => (businessId ? s.scenarioByBusiness[businessId] : undefined) ?? 'expected');
  const setScenario = useFinanceUiStore((s) => s.setScenario);
  return [scenario, (next: ScenarioKey) => (businessId ? setScenario(businessId, next) : undefined)];
}

export function useReviewedKeys(businessId: string | null | undefined): readonly string[] {
  return useFinanceUiStore((s) => (businessId ? s.reviewedByBusiness[businessId] : undefined) ?? EMPTY);
}

export function useFreshProposal(businessId: string | null | undefined): StoredProposal | undefined {
  return useFinanceUiStore((s) => (businessId ? s.freshProposalByBusiness[businessId] : undefined));
}
