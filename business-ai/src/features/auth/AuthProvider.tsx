import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Locale } from '@/i18n/types';
import { AppErrorException, makeAppError, toAppError } from '@/lib/errors';
import { clearQueryCache } from '@/lib/queryClient';
import { readString, removeKey, STORAGE_KEYS, writeString } from '@/lib/storage';
import { isSupabaseConfigured, supabase, wireAuthAutoRefresh } from '@/lib/supabase';
import { useActiveBusinessStore } from '@/stores/activeBusiness';

export interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  /** Stored in user metadata; the signup trigger copies it to `profiles.locale`. */
  locale: Locale;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True until the initial session is known (the splash screen covers this). */
  isLoading: boolean;
  /** True after a password-recovery link signed the user in, until the password is updated. */
  isPasswordRecovery: boolean;
  /** Rejects with AppErrorException (`toAppError(e).messageKey`). */
  signIn: (email: string, password: string) => Promise<void>;
  /** `needsEmailConfirmation` when the project requires confirming the email (no session yet). */
  signUp: (input: SignUpInput) => Promise<{ needsEmailConfirmation: boolean }>;
  /** Signs out (falls back to a local sign-out offline) and wipes cached data on this device. */
  signOut: () => Promise<void>;
  /** Emails a recovery link that opens /reset-password. Never reveals whether the email exists. */
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  /** Native recovery / confirmation links: exchanges the PKCE `code` for a session. */
  exchangeCodeForSession: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Deep link the auth emails return to (web: http(s) origin; native: businessai://…). */
export function authRedirectUrl(path: '/reset-password' | '/sign-in'): string {
  return Linking.createURL(path);
}

async function forgetDeviceData(): Promise<void> {
  await clearQueryCache();
  useActiveBusinessStore.getState().clear();
}

function fail(error: unknown): never {
  throw new AppErrorException(toAppError(error));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const lastUserId = useRef<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const stopAutoRefresh = wireAuthAutoRefresh();
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    /** Applies sessions in order; a different account than last time wipes cached data first. */
    const apply = async (next: Session | null, initial: boolean) => {
      const uid = next?.user.id ?? null;
      if (uid && lastUserId.current && lastUserId.current !== uid) await forgetDeviceData();
      if (uid && lastUserId.current !== uid) {
        lastUserId.current = uid;
        await writeString(STORAGE_KEYS.lastUserId, uid);
      }
      if (cancelled) return;
      setSession(next);
      if (initial) setIsLoading(false);
    };

    void (async () => {
      lastUserId.current = await readString(STORAGE_KEYS.lastUserId);
      if (cancelled) return;
      const { data } = supabase.auth.onAuthStateChange((event, next) => {
        if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
        if (event === 'SIGNED_OUT') setIsPasswordRecovery(false);
        // Never await Supabase calls inside this callback (auth lock); defer the work.
        const initial = event === 'INITIAL_SESSION';
        queue.current = queue.current.then(() => apply(next, initial)).catch(() => undefined);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
      stopAutoRefresh();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) fail(error);
  }, []);

  const signUp = useCallback(async ({ email, password, displayName, locale }: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: displayName.trim(), locale },
        emailRedirectTo: authRedirectUrl('/sign-in'),
      },
    });
    if (error) fail(error);
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    // Offline or revoked token: still end the session on this device.
    if (error) await supabase.auth.signOut({ scope: 'local' });
    await forgetDeviceData();
    lastUserId.current = null;
    await removeKey(STORAGE_KEYS.lastUserId);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl('/reset-password') });
    if (error) fail(error);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) fail(error);
    setIsPasswordRecovery(false);
  }, []);

  const exchangeCodeForSession = useCallback(async (code: string) => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const appError = toAppError(error);
      throw new AppErrorException(
        appError.code === 'network' ? appError : makeAppError('recovery_link_invalid', appError.message, appError.status),
      );
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isPasswordRecovery,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      exchangeCodeForSession,
    }),
    [session, isLoading, isPasswordRecovery, signIn, signUp, signOut, sendPasswordReset, updatePassword, exchangeCodeForSession],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
