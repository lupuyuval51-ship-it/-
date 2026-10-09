import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { LoginInput, RegisterInput } from '@shared/schemas/auth';
import type { AuthResponse, MeResponse, UserDTO } from '@shared/types';
import { api, onUnauthorized, setCsrfToken } from '../api/client';
import { qk } from '../api/queryClient';
import { useI18n } from '../i18n';
import { storage } from '../lib/storage';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthValue {
  user: UserDTO | null;
  status: AuthStatus;
  login(input: LoginInput): Promise<UserDTO>;
  register(input: RegisterInput): Promise<UserDTO>;
  logout(): Promise<void>;
  /** Re-fetches /auth/me (e.g. after onboarding or settings changes). */
  refresh(): Promise<void>;
  /** Locally merges user fields after a successful settings update. */
  setUser(patch: Partial<UserDTO>): void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { setLocale, locale } = useI18n();

  const me = useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      const res = await api<MeResponse>('/auth/me');
      setCsrfToken(res.csrfToken);
      return res;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const user = me.data?.user ?? null;
  const status: AuthStatus = me.isPending ? 'loading' : user ? 'authenticated' : 'anonymous';

  // Keep UI language aligned with the account preference.
  useEffect(() => {
    if (user && user.locale !== locale) setLocale(user.locale);
  }, [user?.locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme: explicit dark/light, or follow the OS.
  useEffect(() => {
    const pref = user?.theme ?? storage.get<string>('fitai.theme') ?? 'system';
    const media = window.matchMedia?.('(prefers-color-scheme: light)');
    const apply = () => {
      const theme = pref === 'system' ? (media?.matches ? 'light' : 'dark') : pref;
      document.documentElement.dataset.theme = theme;
    };
    apply();
    if (pref === 'system' && media) {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [user?.theme]);

  const setSession = useCallback(
    (res: AuthResponse) => {
      setCsrfToken(res.csrfToken);
      queryClient.setQueryData<MeResponse>(qk.me, { user: res.user, csrfToken: res.csrfToken });
      return res.user;
    },
    [queryClient],
  );

  const clearSession = useCallback(() => {
    setCsrfToken(null);
    queryClient.cancelQueries();
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    queryClient.setQueryData<MeResponse>(qk.me, { user: null, csrfToken: null });
  }, [queryClient]);

  useEffect(() => {
    onUnauthorized(() => clearSession());
    return () => onUnauthorized(null);
  }, [clearSession]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      status,
      login: async (input) => setSession(await api<AuthResponse>('/auth/login', { method: 'POST', body: input })),
      register: async (input) => setSession(await api<AuthResponse>('/auth/register', { method: 'POST', body: input })),
      logout: async () => {
        try {
          await api('/auth/logout', { method: 'POST', body: {} });
        } finally {
          storage.remove('fitai.activeSession');
          clearSession();
        }
      },
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: qk.me });
        await queryClient.refetchQueries({ queryKey: qk.me });
      },
      setUser: (patch) => {
        queryClient.setQueryData<MeResponse>(qk.me, (old) => (old?.user ? { ...old, user: { ...old.user, ...patch } } : old));
      },
    }),
    [user, status, setSession, clearSession, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
