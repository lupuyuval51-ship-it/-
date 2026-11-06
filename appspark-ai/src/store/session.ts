import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface SessionUser {
  id: string;
  email: string | null;
}

export type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

export interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  /** Whether cloud accounts are possible at all (Supabase configured). */
  cloudAvailable: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

function toUser(session: Session | null): SessionUser | null {
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}

let subscribed = false;

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  user: null,
  cloudAvailable: isSupabaseConfigured,
  initialize: async () => {
    if (!supabase) {
      set({ status: 'signedOut', user: null });
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      const user = toUser(data.session);
      set({ status: user ? 'signedIn' : 'signedOut', user });
    } catch {
      set({ status: 'signedOut', user: null });
    }
    if (!subscribed) {
      subscribed = true;
      supabase.auth.onAuthStateChange((_event, session) => {
        const user = toUser(session);
        set({ status: user ? 'signedIn' : 'signedOut', user });
      });
    }
  },
  signIn: async (email, password) => {
    if (!supabase) throw new Error('cloud-unavailable');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  },
  signUp: async (email, password) => {
    if (!supabase) throw new Error('cloud-unavailable');
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  },
  sendMagicLink: async (email) => {
    if (!supabase) throw new Error('cloud-unavailable');
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (error) throw error;
  },
  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ status: 'signedOut', user: null });
  },
}));
