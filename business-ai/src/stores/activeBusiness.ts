/**
 * Device-local cache of the active business id, persisted so business-scoped queries can start
 * (and render from the persisted query cache) before the profile loads. The account-level source
 * of truth is `profiles.active_business_id`; `useActiveBusiness()` reconciles the two.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/lib/storage';

interface ActiveBusinessState {
  businessId: string | null;
  setBusinessId: (businessId: string | null) => void;
  clear: () => void;
}

export const useActiveBusinessStore = create<ActiveBusinessState>()(
  persist(
    (set) => ({
      businessId: null,
      setBusinessId: (businessId) => set({ businessId }),
      clear: () => set({ businessId: null }),
    }),
    {
      name: STORAGE_KEYS.activeBusiness,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ businessId: state.businessId }),
      version: 1,
    },
  ),
);
