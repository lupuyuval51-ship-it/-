import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { api } from '../api/client.ts';
import { useLang, useT } from '../i18n/index.tsx';
import { IconBell, IconBook, IconChart, IconChat, IconDumbbell, IconFork, IconHome, IconUser } from '../ui/icons.tsx';
import { qk } from './session.ts';

const MAIN = [
  { to: '/', key: 'nav.home', Icon: IconHome, end: true }, { to: '/workouts', key: 'nav.workouts', Icon: IconDumbbell }, { to: '/nutrition', key: 'nav.nutrition', Icon: IconFork },
  { to: '/coach', key: 'nav.coach', Icon: IconChat }, { to: '/progress', key: 'nav.progress', Icon: IconChart },
] as const;
const MORE = [{ to: '/exercises', key: 'nav.exercises', Icon: IconBook }, { to: '/notifications', key: 'nav.notifications', Icon: IconBell }, { to: '/profile', key: 'nav.profile', Icon: IconUser }] as const;

export function LangSwitch(): ReactNode {
  const { lang, setLang } = useLang(); const t = useT();
  return <button type="button" className="btn btn-sm" aria-label={t('lang.switchTo')} onClick={() => setLang(lang === 'he' ? 'en' : 'he')}><span className="num">{t('lang.other')}</span></button>;
}

export function Shell(): ReactNode {
  const t = useT();
  const active = useQuery({ queryKey: qk.activeSession, queryFn: () => api.get<{ session: { id: string } | null }>('/api/sessions/active'), refetchOnWindowFocus: true, staleTime: 15_000 });
  return (
    <div className="shell">
      <a href="#main" className="sr-only">{t('nav.skip')}</a>
      <header className="topbar">
        <Link to="/" className="wordmark" style={{ color: 'var(--text)', textDecoration: 'none' }}>LUPU<b>-</b>FIT</Link>
        <div className="row"><Link to="/notifications" className="icon-btn" aria-label={t('nav.notifications')}><IconBell /></Link><LangSwitch /></div>
      </header>
      <nav className="sidebar" aria-label={t('nav.menu')}>
        {[...MAIN, ...MORE].map(({ to, key, Icon, ...r }) => <NavLink key={to} to={to} className="navlink" {...('end' in r ? { end: true } : {})}><Icon />{t(key)}</NavLink>)}
      </nav>
      <div style={{ minInlineSize: 0 }}>
        {active.data?.session ? <Link to="/workouts/session" className="resume"><span>{t('nav.activeWorkout')}</span><IconDumbbell width={20} height={20} /></Link> : null}
        <main id="main" className="main"><Outlet /></main>
      </div>
      <nav className="bottomnav" aria-label={t('nav.menu')}>
        {MAIN.map(({ to, key, Icon, ...r }) => <NavLink key={to} to={to} className="navlink" {...('end' in r ? { end: true } : {})}><Icon />{t(key)}</NavLink>)}
      </nav>
    </div>
  );
}

/** Centered layout for auth, onboarding and legal pages. */
export function PublicLayout(): ReactNode {
  return (
    <div style={{ minBlockSize: '100dvh' }}>
      <header className="topbar"><Link to="/" className="wordmark" style={{ color: 'var(--text)', textDecoration: 'none' }}>LUPU<b>-</b>FIT</Link><LangSwitch /></header>
      <main className="main" style={{ maxInlineSize: '36rem' }}><Outlet /></main>
    </div>
  );
}
