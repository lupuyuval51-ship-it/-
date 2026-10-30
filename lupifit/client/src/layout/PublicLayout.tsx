import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { Icon, LoadingState, LogoMark } from '../components/ui';
import { LEGAL_PAGES } from '../features/legal/links';
import { useI18n } from '../i18n';

export function PublicLayout() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="public-layout">
      <header className="public-header">
        {/* Signed-in users reading a legal page get back to the app; everyone else lands on the login screen. */}
        <Link to="/" className="brand public-brand">
          <span className="brand-mark" aria-hidden="true">
            <LogoMark size={24} />
          </span>
          <span className="brand-name">{t('common.appName')}</span>
        </Link>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLocale(locale === 'he' ? 'en' : 'he')} lang={locale === 'he' ? 'en' : 'he'}>
          <Icon name="globe" size={16} />
          <span className="btn-label">{locale === 'he' ? 'English' : 'עברית'}</span>
        </button>
      </header>
      <main id="main" className="public-main">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="public-footer muted">
        <nav aria-label={t('legal.nav.label')}>
          <ul className="public-footer-links">
            {LEGAL_PAGES.map((p) => (
              <li key={p.to}>
                <NavLink to={p.to} className="link link-block">
                  {t(p.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <p>{t('common.disclaimer')}</p>
      </footer>
    </div>
  );
}
