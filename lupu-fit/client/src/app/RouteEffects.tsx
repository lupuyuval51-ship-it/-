import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useLang } from '../i18n/index.tsx';

/** Longest-prefix map from route to the dictionary key of its screen name. */
const TITLES: [string, string][] = [
  ['/workouts', 'nav.workouts'], ['/nutrition', 'nav.nutrition'], ['/coach', 'nav.coach'], ['/progress', 'nav.progress'], ['/exercises', 'nav.exercises'],
  ['/notifications', 'nav.notifications'], ['/profile', 'nav.profile'], ['/privacy', 'legal.privacy.title'], ['/terms', 'legal.terms.title'], ['/account-deletion', 'legal.deletion.nav'],
  ['/login', 'auth.login.title'], ['/register', 'auth.register.title'], ['/welcome', 'welcome.title'],
];
export function titleKeyFor(path: string): string {
  if (path === '/') return 'nav.home';
  return TITLES.find(([p]) => path === p || path.startsWith(`${p}/`))?.[1] ?? 'app.name';
}

/**
 * Per-screen document title (browser tab, history, screen-reader page announcement) and, after in-app
 * navigation, focus moved to the main landmark so keyboard and screen-reader users start at the new content.
 */
export function RouteEffects(): ReactNode {
  const { t, lang } = useLang();
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    const key = titleKeyFor(pathname);
    const name = t(key);
    document.title = key === 'app.name' || name === key ? t('app.name') : `${name} · ${t('app.name')}`;
  }, [pathname, t]);
  useEffect(() => {
    // The web app manifest follows the UI language (install name, description and shortcuts).
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const href = lang === 'he' ? '/manifest.webmanifest' : '/manifest.en.webmanifest';
    if (link && link.getAttribute('href') !== href) link.setAttribute('href', href);
  }, [lang]);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const main = document.getElementById('main');
    if (main && document.activeElement !== main) main.focus({ preventScroll: true });
  }, [pathname]);
  return null;
}
