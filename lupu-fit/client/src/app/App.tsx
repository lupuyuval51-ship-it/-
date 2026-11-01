import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useMemo, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router';
import { ApiRequestError } from '../api/client.ts';
import { IS_DEVICE } from '../env.ts';
import { LangProvider } from '../i18n/index.tsx';
import { ErrorState, Loading } from '../ui/kit.tsx';
import { ToastProvider } from '../ui/toast.tsx';
import { PublicLayout, Shell } from './Shell.tsx';
import { useMe } from './session.ts';

const p = {
  Login: lazy(() => import('../pages/Login.tsx')), Register: lazy(() => import('../pages/Register.tsx')), Forgot: lazy(() => import('../pages/ForgotPassword.tsx')), Reset: lazy(() => import('../pages/ResetPassword.tsx')),
  Welcome: lazy(() => import('../pages/Welcome.tsx')), Onboarding: lazy(() => import('../pages/Onboarding.tsx')), Home: lazy(() => import('../pages/Home.tsx')),
  Workouts: lazy(() => import('../pages/WorkoutsHub.tsx')), Plan: lazy(() => import('../pages/PlanDetail.tsx')), Ready: lazy(() => import('../pages/ReadyDetail.tsx')), History: lazy(() => import('../pages/History.tsx')),
  Live: lazy(() => import('../pages/LiveSession.tsx')), Summary: lazy(() => import('../pages/SessionSummary.tsx')), Exercises: lazy(() => import('../pages/Exercises.tsx')), Exercise: lazy(() => import('../pages/ExerciseDetail.tsx')),
  Nutrition: lazy(() => import('../pages/Nutrition.tsx')), Log: lazy(() => import('../pages/NutritionLog.tsx')), Menu: lazy(() => import('../pages/NutritionMenu.tsx')), Coach: lazy(() => import('../pages/Coach.tsx')),
  Progress: lazy(() => import('../pages/Progress.tsx')), Notifications: lazy(() => import('../pages/Notifications.tsx')), Profile: lazy(() => import('../pages/Profile.tsx')),
  Privacy: lazy(() => import('../pages/Privacy.tsx')), Terms: lazy(() => import('../pages/Terms.tsx')), Deletion: lazy(() => import('../pages/AccountDeletion.tsx')),
};

const PUBLIC = ['/login', '/register', '/forgot-password', '/reset-password'];
const LEGAL = ['/privacy', '/terms', '/account-deletion'];
const ONBOARD = ['/welcome', '/onboarding'];

/** Route guard: signed-out → /login (hosted only); signed-in but not onboarded → /welcome. */
function Gate({ children }: { children: ReactNode }): ReactNode {
  const me = useMe(); const loc = useLocation(); const path = loc.pathname;
  if (me.isPending) return <Loading />;
  if (me.isError) return <div className="main"><ErrorState error={me.error} onRetry={() => void me.refetch()} /></div>;
  const m = me.data;
  if (LEGAL.includes(path)) return children;
  if (!m) return IS_DEVICE ? <Loading /> : PUBLIC.includes(path) ? children : <Navigate to="/login" replace state={{ from: path }} />;
  if (PUBLIC.includes(path)) return <Navigate to={m.onboarded ? '/' : '/welcome'} replace />;
  if (!m.onboarded && !ONBOARD.includes(path)) return <Navigate to="/welcome" replace />;
  if (m.onboarded && path === '/welcome') return <Navigate to="/" replace />;
  return children;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: (n, e) => !(e instanceof ApiRequestError && e.status < 500) && n < 2, refetchOnWindowFocus: false, staleTime: 10_000 }, mutations: { retry: false } } });
}

export function AppRoutes(): ReactNode {
  return (
    <Suspense fallback={<Loading />}>
      <Gate>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<p.Login />} /><Route path="/register" element={<p.Register />} /><Route path="/forgot-password" element={<p.Forgot />} /><Route path="/reset-password" element={<p.Reset />} />
            <Route path="/welcome" element={<p.Welcome />} /><Route path="/onboarding" element={<p.Onboarding />} />
            <Route path="/privacy" element={<p.Privacy />} /><Route path="/terms" element={<p.Terms />} /><Route path="/account-deletion" element={<p.Deletion />} />
          </Route>
          <Route element={<Shell />}>
            <Route path="/" element={<p.Home />} />
            <Route path="/workouts" element={<p.Workouts />} /><Route path="/workouts/plans/:planId" element={<p.Plan />} /><Route path="/workouts/ready/:readyId" element={<p.Ready />} />
            <Route path="/workouts/history" element={<p.History />} /><Route path="/workouts/session" element={<p.Live />} /><Route path="/workouts/sessions/:id" element={<p.Summary />} />
            <Route path="/exercises" element={<p.Exercises />} /><Route path="/exercises/:id" element={<p.Exercise />} />
            <Route path="/nutrition" element={<p.Nutrition />} /><Route path="/nutrition/log" element={<p.Log />} /><Route path="/nutrition/menu" element={<p.Menu />} />
            <Route path="/coach" element={<p.Coach />} /><Route path="/progress" element={<p.Progress />} /><Route path="/notifications" element={<p.Notifications />} /><Route path="/profile" element={<p.Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Gate>
    </Suspense>
  );
}

export function App({ client }: { client?: QueryClient }): ReactNode {
  const qc = useMemo(() => client ?? makeQueryClient(), [client]);
  return (
    <QueryClientProvider client={qc}>
      <LangProvider><ToastProvider><BrowserRouter><AppRoutes /></BrowserRouter></ToastProvider></LangProvider>
    </QueryClientProvider>
  );
}
