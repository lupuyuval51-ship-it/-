import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { LoadingState } from '../components/ui';

/** Requires a signed-in user; optionally requires completed onboarding. */
export function RequireAuth({ children, onboarded = true }: { children: ReactNode; onboarded?: boolean }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingState />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (onboarded && !user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** Public-only pages (login/register) redirect signed-in users. */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingState />;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={user.onboardingCompleted ? from ?? '/' : '/onboarding'} replace />;
  }
  return <>{children}</>;
}
