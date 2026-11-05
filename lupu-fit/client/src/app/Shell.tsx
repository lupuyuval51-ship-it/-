import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { api } from '../api/client.ts';
import { useApiReachable } from '../lib/reachable.ts';
import { useLang, useT } from '../i18n/index.tsx';
import { Brand } from '../ui/BrandMark.tsx';
import { IconBell, IconBook, IconChart, IconChat, IconChevron, IconDumbbell, IconFork, IconHome, IconUser } from '../ui/icons.tsx';
import { qk } from './session.ts';

const MAIN = [
  { to: '/', key: 'nav.home', Icon: IconHome, end: true }, { to: '/workouts', key: 'nav.workouts', Icon: IconDumbbell }, { to: '/nutrition', key: 'nav.nutrition', Icon: IconFork },
  { to: '/coach', key: 'nav.coach', Icon: IconChat }, { to: '/progress', key: 'nav.progress', Icon: IconChart },
] as const;
const MORE = [{ to: '/exercises', key: 'nav.exercises', Icon: IconBook }, { to: '/notifications', key: 'nav.notifications', Icon: IconBell }, { to: '/profile', key: 'nav.profile', Icon: IconUser }] as const;

/** Two-letter language toggle: the current language reads strong, the other one is the tap target hint. */
export function LangSwitch(): ReactNode {
  const { lang, setLang } = useLang(); const t = useT();
  return (
    <button type="button" className="lang-switch" aria-label={t('lang.switchTo')} onClick={() => setLang(lang === 'he' ? 'en' : 'he')}>
      <span className="num lang-cur" aria-hidden="true">{t('lang.short')}</span><span className="num lang-alt" aria-hidden="true">{t('lang.other')}</span>
    </button>
  );
}

const navLinks = (items: readonly (typeof MAIN[number] | typeof MORE[number])[], t: (k: string) => string) =>
  items.map(({ to, key, Icon, ...r }) => <NavLink key={to} to={to} className="navlink" {...('end' in r ? { end: true } : {})}><Icon /><span>{t(key)}</span></NavLink>);

export function Shell(): ReactNode {
  const t = useT();
  const online = useApiReachable(); // Device Mode keeps everything on the phone: there is nothing to "sync when you reconnect"
  const onLive = useLocation().pathname === '/workouts/session';
  const active = useQuery({ queryKey: qk.activeSession, queryFn: () => api.get<{ session: { id: string } | null }>('/api/sessions/active'), refetchOnWindowFocus: true, staleTime: 15_000 });
  return (
    <div className="shell">
      <a href="#main" className="skip-link">{t('nav.skip')}</a>
      <header className="topbar">
        <Link to="/" className="brand-link topbar-brand"><Brand /></Link>
        <div className="row topbar-end"><Link to="/notifications" className="icon-btn" aria-label={t('nav.notifications')}><IconBell /></Link><LangSwitch /></div>
      </header>
      <aside className="sidebar">
        <Link to="/" className="brand-link sidebar-brand"><Brand size={34} /></Link>
        <nav aria-label={t('nav.menu')} className="sidebar-nav">
          {navLinks(MAIN, t)}
          <hr className="divider sidebar-sep" />
          {navLinks(MORE, t)}
        </nav>
      </aside>
      <div className="shell-body">
        {active.data?.session ? <Link to="/workouts/session" className="resume"><span className="resume-dot" aria-hidden="true" /><span className="grow">{t('nav.activeWorkout')}</span><IconChevron className="flip-rtl" width={20} height={20} /></Link> : null}
        {!online && !onLive ? <div className="offline-strip" role="status">{t('app.offline')}</div> : null}
        <main id="main" className="main" tabIndex={-1}><Outlet /></main>
      </div>
      <nav className="bottomnav" aria-label={t('nav.menu')}>{navLinks(MAIN, t)}</nav>
    </div>
  );
}

/** Centered layout for auth, onboarding and legal pages. */
export function PublicLayout(): ReactNode {
  const t = useT();
  return (
    <div className="public-shell">
      <a href="#main" className="skip-link">{t('nav.skip')}</a>
      <header className="topbar"><Link to="/" className="brand-link"><Brand /></Link><LangSwitch /></header>
      <main id="main" className="main public-main" tabIndex={-1}><Outlet /></main>
    </div>
  );
}
