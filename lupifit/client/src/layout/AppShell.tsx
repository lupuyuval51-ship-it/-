import { Suspense, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthProvider';
import { Icon, LoadingState, LogoMark, type IconName } from '../components/ui';
import { NotificationBell } from '../features/gamification/NotificationBell';
import { ReminderScheduler } from '../features/gamification/ReminderScheduler';
import { OutboxIndicator } from '../features/offline/OutboxIndicator';
import { useOutboxSync } from '../features/offline/hooks';
import { ActiveSessionIndicator } from '../features/sessions/ActiveSessionIndicator';
import { useOnline } from '../hooks/useOnline';
import { useI18n, type TKey } from '../i18n';
import { ErrorBoundary } from './ErrorBoundary';

const NAV: { to: string; label: TKey; icon: IconName; end?: boolean; mobile: boolean }[] = [
  { to: '/', label: 'nav.dashboard', icon: 'home', end: true, mobile: true },
  { to: '/workouts', label: 'nav.workouts', icon: 'dumbbell', mobile: true },
  { to: '/exercises', label: 'nav.exercises', icon: 'list', mobile: false },
  { to: '/nutrition', label: 'nav.nutrition', icon: 'apple', mobile: true },
  { to: '/coach', label: 'nav.coach', icon: 'chat', mobile: true },
  { to: '/progress', label: 'nav.progress', icon: 'chart', mobile: true },
  { to: '/profile', label: 'nav.profile', icon: 'user', mobile: false },
];

export function AppShell() {
  const { t, locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const online = useOnline();
  useOutboxSync();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Move focus to main content on route change (screen-reader friendly navigation).
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        {t('nav.skipToContent')}
      </a>
      <aside className="sidebar" aria-label={t('nav.mainNavigation')}>
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <LogoMark size={24} />
          </span>
          <span className="brand-name">{t('common.appName')}</span>
        </div>
        <nav className="side-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
              <Icon name={n.icon} />
              <span>{t(n.label)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <Icon name="user" size={18} />
            <span className="truncate">{user?.displayName}</span>
          </div>
          <button
            type="button"
            className="side-link"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            <Icon name="logout" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <NavLink to="/" end className="topbar-brand" aria-label={`${t('common.appName')} — ${t('nav.dashboard')}`}>
            <span className="brand-mark" aria-hidden="true">
              <LogoMark size={22} />
            </span>
            <span className="brand-name">{t('common.appName')}</span>
          </NavLink>
          <div className="topbar-actions">
            <ActiveSessionIndicator />
            <OutboxIndicator />
            <button
              type="button"
              className="btn btn-ghost btn-sm lang-toggle"
              onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
              aria-label={t('common.language.label')}
              lang={locale === 'he' ? 'en' : 'he'}
            >
              <Icon name="globe" size={16} />
              <span className="btn-label">{locale === 'he' ? 'EN' : 'עב'}</span>
            </button>
            <NotificationBell />
            <NavLink to="/profile" className="btn btn-ghost btn-icon topbar-profile" aria-label={t('nav.profile')} title={t('nav.profile')}>
              <Icon name="user" />
            </NavLink>
          </div>
        </header>
        {!online && (
          <div className="offline-banner" role="status">
            <Icon name="warning" size={16} />
            {t('common.states.offline')}
          </div>
        )}
        <main id="main" ref={mainRef} tabIndex={-1} className="main">
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <nav className="bottom-nav" aria-label={t('nav.mainNavigation')}>
        {NAV.filter((n) => n.mobile).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `bottom-link${isActive ? ' active' : ''}`}>
            <Icon name={n.icon} size={22} />
            <span>{t(n.label)}</span>
          </NavLink>
        ))}
      </nav>
      <ReminderScheduler />
    </div>
  );
}
