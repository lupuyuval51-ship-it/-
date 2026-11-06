import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { qk, type Me } from '../app/session.ts';
import { useBackupRestore } from '../components/profile/backupRestore.tsx';
import { IS_DEVICE } from '../env.ts';
import { useT } from '../i18n/index.tsx';
import { BrandMark } from '../ui/BrandMark.tsx';
import { IconChart, IconDumbbell, IconFork } from '../ui/icons.tsx';
import { Banner, Button, LinkButton } from '../ui/kit.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/auth.css';

const POINTS = [{ key: 'welcome.v1', Icon: IconDumbbell }, { key: 'welcome.v2', Icon: IconFork }, { key: 'welcome.v3', Icon: IconChart }] as const;

/**
 * Device Mode only: "I already have a backup". A new phone (or a reinstall) can restore the exported file BEFORE onboarding. It is the
 * same flow as Profile > Backup and restore (backupRestore.tsx). When the file carried a profile the app is onboarded afterwards and the
 * person lands on Home; a file without one (format 1 from before the first setup) continues to the normal onboarding.
 * The orange Start button stays the one primary action; this is a secondary button.
 */
function RestoreEntry(): ReactNode {
  const t = useT(); const toast = useToast(); const qc = useQueryClient(); const go = useNavigate();
  const restore = useBackupRestore({
    onRestored: async () => {
      // `onboarded` is decided by the restored data (does it hold a profile?), so ask the app, do not guess from the file.
      await qc.refetchQueries({ queryKey: qk.me });
      const onboarded = qc.getQueryData<Me | null>(qk.me)?.onboarded === true;
      toast(t(onboarded ? 'welcome.restore.toastHome' : 'welcome.restore.toastSetup'), 'ok');
      go(onboarded ? '/' : '/onboarding', { replace: true });
    },
  });
  return (
    <div className="stack-sm welcome-restore">
      {restore.err ? <Banner tone="danger">{restore.err}</Banner> : null}
      <Button block onClick={restore.open} disabled={restore.busy}>{t('welcome.restore.cta')}</Button>
      <p className="small muted center">{t('welcome.restore.hint')}</p>
      {restore.input}
      {restore.sheet}
    </div>
  );
}

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
        {IS_DEVICE ? <RestoreEntry /> : null}
        <p className="tiny muted center">{t('disclaimer.health')}</p>
        <p className="tiny muted center">{t('welcome.legalPrefix')} <Link to="/terms">{t('legal.terms.nav')}</Link> {t('auth.register.and')} <Link to="/privacy">{t('legal.privacy.nav')}</Link>.</p>
      </div>
    </div>
  );
}
