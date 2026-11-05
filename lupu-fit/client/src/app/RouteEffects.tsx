import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router';
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
/** Scroll offsets by history entry, so Back/Forward returns to where the list was. In memory only. */
const positions = new Map<string, number>();
const instant = (top: number): void => { try { window.scrollTo({ top, left: 0, behavior: 'instant' as ScrollBehavior }); } catch { window.scrollTo(0, top); } };

/** Back/Forward: restore the saved offset, retrying briefly because lazy routes and queries fill the page after the route changes. */
export function restoreScroll(top: number, tries = 20): void {
  if (top <= 0) { instant(0); return; }
  instant(top);
  const doc = document.documentElement;
  if (tries > 0 && doc.scrollHeight - window.innerHeight < top - 1) setTimeout(() => restoreScroll(top, tries - 1), 50);
}

export function RouteEffects(): ReactNode {
  const { t, lang } = useLang();
  const { pathname, key } = useLocation();
  const navType = useNavigationType();
  const first = useRef(true);
  // Remember the scroll offset of the current history entry. It is saved on the click/Back that leaves the page, not on scroll
  // events: swapping routes shrinks the document and the browser clamps scrollY, which would overwrite the real offset.
  const keyRef = useRef(key);
  useEffect(() => { keyRef.current = key; }, [key]);
  useEffect(() => {
    try { window.history.scrollRestoration = 'manual'; } catch { /* unsupported */ }
    const save = (): void => { positions.set(keyRef.current, window.scrollY); };
    document.addEventListener('click', save, true);
    window.addEventListener('popstate', save);
    return () => { document.removeEventListener('click', save, true); window.removeEventListener('popstate', save); };
  }, []);
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
    // A new screen starts at the top; Back/Forward returns to the saved offset.
    if (navType === 'POP') restoreScroll(positions.get(key) ?? 0); else instant(0);
    const main = document.getElementById('main');
    if (main && document.activeElement !== main) main.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a screen change (path) should scroll, not a search-param edit
  }, [pathname]);
  return null;
}
