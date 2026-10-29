import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { LoginInput, RegisterInput } from '@shared/schemas/auth';
import type { AuthResponse, MeResponse, UserDTO } from '@shared/types';
import { ApiError, api, onUnauthorized, setCsrfToken } from '../api/client';
import { qk } from '../api/queryClient';
import { useI18n } from '../i18n';
import { clearAllDrafts } from '../lib/drafts';
import { storage } from '../lib/storage';

/** Last known signed-in user, used only when the network is unreachable. Cleared on logout. */
const ME_CACHE_KEY = 'fitai.me';

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
      try {
        const res = await api<MeResponse>('/auth/me');
        setCsrfToken(res.csrfToken);
        storage.set(ME_CACHE_KEY, res.user);
        return res;
      } catch (err) {
        // Offline in the gym: keep the signed-in user from the last visit so the app (and the
        // workout in progress) stays usable. A real 401 still signs out. The CSRF token is
        // fetched again as soon as a request needs it online.
        const cached = err instanceof ApiError && err.isNetwork ? storage.get<UserDTO>(ME_CACHE_KEY) : null;
        if (cached) return { user: cached, csrfToken: '' } satisfies MeResponse;
        throw err;
      }
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
    storage.remove(ME_CACHE_KEY);
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
          // Shared devices: drop cached health data (the onboarding draft holds weight and
          // injury notes). Unsynced set edits are kept — they are tied to the user and sync
          // on the next sign-in.
          storage.remove('fitai.activeSession');
          storage.remove('fitai.onboardingDraft');
          clearAllDrafts();
          storage.remove(ME_CACHE_KEY);
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
