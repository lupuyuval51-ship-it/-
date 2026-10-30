import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { ErrorState, LoadingState } from '../components/ui';
import { isWelcomed } from '../features/device/control';
import { isDeviceMode } from '../platform';

/** Requires a signed-in user; optionally requires completed onboarding. */
export function RequireAuth({ children, onboarded = true }: { children: ReactNode; onboarded?: boolean }) {
  const { status, user, refresh } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingState />;
  if (!user) {
    // Device mode has no login screen: the app is always signed in to its device account.
    if (isDeviceMode) return <ErrorState onRetry={() => void refresh()} />;
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (onboarded && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** Public-only pages (login/register) redirect signed-in users. Device mode has none of them. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (isDeviceMode) return <Navigate to="/" replace />;
  if (status === 'loading') return <LoadingState />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={user.onboardingCompleted ? from ?? '/' : '/onboarding'} replace />;
  }
  return <>{children}</>;
}

/** Pages that need a password or an e-mail address (password reset): not in device mode. */
export function NotOnDevice({ children }: { children: ReactNode }) {
  if (isDeviceMode) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Pages that exist only in device mode (the first-run welcome). */
export function DeviceOnly({ children }: { children: ReactNode }) {
  if (!isDeviceMode) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * Device mode: the first onboarding starts with the welcome screen (it asks for the name). A re-run of the
 * questionnaire from the settings, and server mode, go straight to it.
 */
export function RequireWelcome({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (isDeviceMode && user && !user.onboardingCompleted && !isWelcomed(user.id)) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}
