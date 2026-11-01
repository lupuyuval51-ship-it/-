import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { IS_DEVICE } from '../env.ts';
import { useT } from '../i18n/index.tsx';
import { BrandMark } from '../ui/BrandMark.tsx';
import { IconChart, IconDumbbell, IconFork } from '../ui/icons.tsx';
import { Banner, LinkButton } from '../ui/kit.tsx';
import '../styles/auth.css';

const POINTS = [{ key: 'welcome.v1', Icon: IconDumbbell }, { key: 'welcome.v2', Icon: IconFork }, { key: 'welcome.v3', Icon: IconChart }] as const;

export default function Welcome(): ReactNode {
  const t = useT();
  return (
    <div className="welcome">
      <div className="welcome-hero">
        <BrandMark size={120} animate className="welcome-mark" />
        <div className="stack-sm"><h1>{t('welcome.title')}</h1><p className="muted welcome-lead">{t('welcome.lead')}</p></div>
      </div>
      <ul className="value-list">
        {POINTS.map(({ key, Icon }) => <li key={key}><span className="value-icon"><Icon /></span><span>{t(key)}</span></li>)}
      </ul>
      <div className="stack-sm welcome-cta">
        {IS_DEVICE ? <Banner>{t('welcome.deviceData')}</Banner> : null}
        <LinkButton to="/onboarding" variant="primary" block>{t('welcome.cta')}</LinkButton>
        <p className="small muted center">{t('welcome.setupTime')}</p>
        <p className="tiny muted center">{t('disclaimer.health')}</p>
        <p className="tiny muted center">{t('welcome.legalPrefix')} <Link to="/terms">{t('legal.terms.nav')}</Link> {t('auth.register.and')} <Link to="/privacy">{t('legal.privacy.nav')}</Link>.</p>
      </div>
    </div>
  );
}
