import { create } from 'zustand';

import type { IconName } from '@/components/ui/Icon';

export interface ToastItem {
  id: number;
  message: string;
  tone: 'neutral' | 'success' | 'danger';
  icon?: IconName;
}

interface ToastState {
  current: ToastItem | null;
  show: (message: string, options?: { tone?: ToastItem['tone']; icon?: IconName }) => void;
  dismiss: (id?: number) => void;
}

let counter = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set, get) => ({
  current: null,
  show: (message, options) => {
    counter += 1;
    const id = counter;
    set({ current: { id, message, tone: options?.tone ?? 'neutral', icon: options?.icon } });
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (get().current?.id === id) set({ current: null });
    }, 2400);
  },
  dismiss: (id) => {
    if (id === undefined || get().current?.id === id) set({ current: null });
  },
}));

export function showToast(message: string, options?: { tone?: ToastItem['tone']; icon?: IconName }) {
  useToast.getState().show(message, options);
}
