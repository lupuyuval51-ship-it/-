import { useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../../api/client.ts';
import { IS_DEVICE, RUN_MODE } from '../../env.ts';
import { useT } from '../../i18n/index.tsx';
import { Banner, Button, errorMessage } from '../../ui/kit.tsx';
import { IconChevron } from '../../ui/icons.tsx';
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
      <div>
        <div className="stat-row pf-row"><span className="muted">{t('profile.account.mode')}</span><strong>{t(RUN_MODE === 'device' ? 'profile.account.modeDevice' : 'profile.account.modeHosted')}</strong></div>
        <div className="stat-row pf-row"><span className="muted">{t('profile.account.version')}</span><span className="num">{pkg.version}</span></div>
        <Link className="list-link" to="/privacy"><span className="grow">{t('profile.account.privacy')}</span><IconChevron className="chev" /></Link>
        <Link className="list-link" to="/terms"><span className="grow">{t('profile.account.terms')}</span><IconChevron className="chev" /></Link>
      </div>
      {IS_DEVICE ? <span className="small muted">{t('profile.account.deviceNote')}</span> : (
        <>
          <Button onClick={() => void logout()} disabled={busy}>{t('profile.account.logout')}</Button>
          {err ? <Banner tone="danger">{err}</Banner> : null}
        </>
      )}
      <div className="pf-danger stack-sm">
        <h3>{t('profile.nu.danger')}</h3>
        <span className="small muted">{t('profile.nu.deleteHint')}</span>
        <Link className="btn btn-danger" to="/account-deletion">{t('profile.account.delete')}</Link>
      </div>
    </div>
  );
}
