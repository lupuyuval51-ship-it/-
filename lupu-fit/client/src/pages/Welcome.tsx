import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { IS_DEVICE } from '../env.ts';
import { useT } from '../i18n/index.tsx';
import { Banner, Card, LinkButton } from '../ui/kit.tsx';
import '../styles/auth.css';

export default function Welcome(): ReactNode {
  const t = useT();
  return (
    <div className="stack-lg auth">
      <div className="stack-sm"><h1>{t('welcome.title')}</h1><p>{t('welcome.lead')}</p></div>
      <Card>
        <ul className="welcome-points">
          <li>{t('welcome.point1')}</li>
          <li>{t('welcome.point2')}</li>
          <li>{t('welcome.point3')}</li>
        </ul>
      </Card>
      {IS_DEVICE ? <Banner>{t('welcome.deviceData')}</Banner> : null}
      <Banner tone="warn">{t('disclaimer.health')}</Banner>
      <LinkButton to="/onboarding" variant="primary" block>{t('welcome.cta')}</LinkButton>
      <p className="small muted">{t('welcome.legalPrefix')} <Link to="/terms">{t('legal.terms.nav')}</Link> {t('auth.register.and')} <Link to="/privacy">{t('legal.privacy.nav')}</Link>.</p>
    </div>
  );
}
