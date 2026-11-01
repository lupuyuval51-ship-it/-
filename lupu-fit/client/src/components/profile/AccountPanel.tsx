import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../../api/client.ts';
import { IS_DEVICE, RUN_MODE } from '../../env.ts';
import { useT } from '../../i18n/index.tsx';
import { Banner, Button, errorMessage } from '../../ui/kit.tsx';
import pkg from '../../../package.json';

/** onboardingDraft.ts is owned by another author: load it defensively (absent module => nothing to clear). */
const draftModules = import.meta.glob<{ clearOnboardingDraft?: () => void }>('../../lib/onboardingDraft.ts');
export async function clearDraftSafely(): Promise<void> {
  try {
    const load = Object.values(draftModules)[0];
    if (load) (await load()).clearOnboardingDraft?.();
  } catch { /* draft module missing or failed: nothing to clear */ }
}

export function AccountPanel(): ReactNode {
  const t = useT(); const qc = useQueryClient(); const nav = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const logout = async () => {
    setBusy(true); setErr(null);
    try {
      await api.post('/api/auth/logout');
      qc.clear();
      await clearDraftSafely();
      nav('/login', { replace: true });
    } catch (e) { setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };
  return (
    <div className="stack">
      <div className="row-between"><span>{t('profile.account.mode')}</span><strong>{t(RUN_MODE === 'device' ? 'profile.account.modeDevice' : 'profile.account.modeHosted')}</strong></div>
      <div className="row-between"><span>{t('profile.account.version')}</span><span className="num">{pkg.version}</span></div>
      <div className="row-wrap">
        <Link className="btn" to="/privacy">{t('profile.account.privacy')}</Link>
        <Link className="btn" to="/terms">{t('profile.account.terms')}</Link>
        <Link className="btn btn-danger" to="/account-deletion">{t('profile.account.delete')}</Link>
      </div>
      {IS_DEVICE ? <span className="small muted">{t('profile.account.deviceNote')}</span> : (
        <>
          <Button onClick={() => void logout()} disabled={busy}>{t('profile.account.logout')}</Button>
          {err ? <Banner tone="danger">{err}</Banner> : null}
        </>
      )}
    </div>
  );
}
