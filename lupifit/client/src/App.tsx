import { lazy } from 'react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { AppShell } from './layout/AppShell';
import { PublicOnly, RequireAuth } from './layout/guards';
import { PublicLayout } from './layout/PublicLayout';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const WorkoutsPage = lazy(() => import('./pages/workouts/WorkoutsPage'));
const PlanDetailPage = lazy(() => import('./pages/workouts/PlanDetailPage'));
const ActiveSessionPage = lazy(() => import('./pages/session/ActiveSessionPage'));
const SessionSummaryPage = lazy(() => import('./pages/session/SessionSummaryPage'));
const SessionHistoryPage = lazy(() => import('./pages/session/SessionHistoryPage'));
const ExerciseLibraryPage = lazy(() => import('./pages/exercises/ExerciseLibraryPage'));
const ExerciseDetailPage = lazy(() => import('./pages/exercises/ExerciseDetailPage'));
const NutritionPage = lazy(() => import('./pages/nutrition/NutritionPage'));
const FoodLogPage = lazy(() => import('./pages/nutrition/FoodLogPage'));
const MenuPage = lazy(() => import('./pages/nutrition/MenuPage'));
const CoachPage = lazy(() => import('./pages/coach/CoachPage'));
const ProgressPage = lazy(() => import('./pages/progress/ProgressPage'));
const NotificationsPage = lazy(() => import('./pages/progress/NotificationsPage'));
const ProfileSettingsPage = lazy(() => import('./pages/settings/ProfileSettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * Route map (all sections are fully connected):
 *  /login /register /forgot-password /reset-password   public
 *  /onboarding                                          signed in
 *  /                    dashboard
 *  /workouts            plans + AI generator
 *  /workouts/plans/:id  plan details & editing
 *  /workouts/session    active workout session
 *  /workouts/sessions/:id  session summary
 *  /workouts/history    workout history
 *  /exercises, /exercises/:id   exercise library
 *  /nutrition           nutrition dashboard
 *  /nutrition/log       food search & meal logging
 *  /nutrition/menu      daily menu of ready dishes
 *  /coach               AI coach
 *  /progress            progress & analytics
 *  /notifications       notifications
 *  /profile             profile & settings
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/login', element: <PublicOnly><LoginPage /></PublicOnly> },
      { path: '/register', element: <PublicOnly><RegisterPage /></PublicOnly> },
      { path: '/forgot-password', element: <PublicOnly><ForgotPasswordPage /></PublicOnly> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/onboarding', element: <RequireAuth onboarded={false}><OnboardingPage /></RequireAuth> },
    ],
  },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/workouts', element: <WorkoutsPage /> },
      { path: '/workouts/plans/:planId', element: <PlanDetailPage /> },
      { path: '/workouts/session', element: <ActiveSessionPage /> },
      { path: '/workouts/sessions/:sessionId', element: <SessionSummaryPage /> },
      { path: '/workouts/history', element: <SessionHistoryPage /> },
      { path: '/exercises', element: <ExerciseLibraryPage /> },
      { path: '/exercises/:exerciseId', element: <ExerciseDetailPage /> },
      { path: '/nutrition', element: <NutritionPage /> },
      { path: '/nutrition/log', element: <FoodLogPage /> },
      { path: '/nutrition/menu', element: <MenuPage /> },
      { path: '/coach', element: <CoachPage /> },
      { path: '/progress', element: <ProgressPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/profile', element: <ProfileSettingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <Outlet /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
