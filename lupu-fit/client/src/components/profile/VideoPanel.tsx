import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import { videoPrefs } from '../../lib/videoState.ts';
import { Button, Select, Toggle } from '../../ui/kit.tsx';
import { useToast } from '../../ui/toast.tsx';
import { BUDGETS_MB, bytesToMb, storedBudget, storeBudget, swRequest } from './sw.ts';

export function VideoPanel(): ReactNode {
  const t = useT(); const toast = useToast();
  const [wifi, setWifi] = useState(() => videoPrefs.wifiOnly);
  const [mb, setMb] = useState<number | null | undefined>(undefined); // undefined = loading, null = no service worker
  const [budget, setBudget] = useState(() => storedBudget());
  const refresh = useCallback(async () => { const r = await swRequest<{ bytes: number }>({ type: 'video-cache-size' }); setMb(r ? bytesToMb(r.bytes) : null); }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const changeBudget = async (v: number) => {
    setBudget(v);
    const r = await swRequest<{ ok: boolean }>({ type: 'set-video-budget', mb: v });
    if (r?.ok) { storeBudget(v); toast(t('state.saved'), 'ok'); } else toast(t('profile.video.noSw'), 'error');
  };
  const clear = async () => {
    const r = await swRequest<{ ok: boolean }>({ type: 'clear-video-cache' });
    if (r?.ok) { toast(t('profile.video.cleared'), 'ok'); void refresh(); } else toast(t('profile.video.noSw'), 'error');
  };

  return (
    <div className="stack">
      <h3 className="pf-sub">{t('profile.video.title')}</h3>
      <Toggle label={t('profile.video.wifiOnly')} checked={wifi} onChange={(v) => { videoPrefs.wifiOnly = v; setWifi(v); }} />
      <span className="small muted">{t('profile.video.wifiHint')}</span>
      {mb === undefined ? null : mb === null ? <span className="small muted" data-testid="no-sw">{t('profile.video.noSw')}</span> : (
        <>
          <div className="row-between"><span>{t('profile.video.cacheSize')}</span><span><span className="num">{fmt.num(mb, 1)}</span> {t('profile.video.mb')}</span></div>
          <Select label={t('profile.video.budget')} value={String(budget)} onChange={(e) => void changeBudget(Number(e.target.value))} options={BUDGETS_MB.map((b) => ({ value: String(b), label: `${b} ${t('profile.video.mb')}` }))} />
          <Button className="pf-secondary" onClick={() => void clear()} disabled={mb === 0}>{t('profile.video.clear')}</Button>
        </>
      )}
    </div>
  );
}
