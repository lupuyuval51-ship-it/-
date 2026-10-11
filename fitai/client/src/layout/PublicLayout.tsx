import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Icon, LoadingState } from '../components/ui';
import { useI18n } from '../i18n';

export function PublicLayout() {
  const { t, locale, setLocale } = useI18n();
  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="dumbbell" size={22} />
          </span>
          <span className="brand-name">{t('common.appName')}</span>
        </div>
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
      <footer className="public-footer muted">{t('common.disclaimer')}</footer>
    </div>
  );
}
