import { useEffect, useState, type ReactNode } from 'react';
import { getController, downloadBlocker, type ModelState } from '../../ai/local/controller.ts';
import { GEMMA_LICENSE_URL } from '../../ai/local/modelConfig.ts';
import { getLocalTranslate, getMode, getWifiOnly, setLocalTranslate, setMode, setWifiOnly, subscribeSettings } from '../../ai/local/settings.ts';
import type { AiMode, LocalStatus } from '../../ai/local/types.ts';
import { fmt, useT } from '../../i18n/index.tsx';
import { Banner, Button, ProgressBar, Segmented, Sheet, Toggle } from '../../ui/kit.tsx';
import '../../styles/localai.css';

const pct = (a: number, b: number): number => (b > 0 ? Math.min(100, Math.floor((a / b) * 100)) : 0);

/** Profile > AI: choose the AI source and (Android app only) download / delete the optional on-device model. */
export function LocalAiCard(): ReactNode {
  const t = useT(); const ctl = getController();
  const [snap, setSnap] = useState(ctl.snapshot);
  const [mode, setModeState] = useState<AiMode>(getMode());
  const [wifi, setWifi] = useState(getWifiOnly()); const [tr, setTr] = useState(getLocalTranslate());
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const off = ctl.subscribe((state, status) => setSnap({ state, status }));
    const offS = subscribeSettings(() => { setModeState(getMode()); setWifi(getWifiOnly()); setTr(getLocalTranslate()); });
    void ctl.refresh();
    return () => { off(); offS(); };
  }, [ctl]);

  const cfg = ctl.config; const s: ModelState = snap.state; const st: LocalStatus | null = snap.status;
  const gb = (bytes: number): string => `${fmt.num(Math.round(bytes / 1e8) / 10, 1)} ${t('localai.gb')}`;
  const total = gb(cfg.sizeBytes);
  const blocker = s.k === 'loading' ? null : downloadBlocker(st, cfg);
  const blockText = blocker === 'space' ? t('localai.block.space', { need: gb(Math.ceil(cfg.sizeBytes * 1.2)) })
    : blocker === 'platform' ? t('localai.block.platform')
      : blocker === 'unsupported' ? t(st && st.reasonCode && st.reasonCode !== 'platform' ? `localai.block.${st.reasonCode}` : 'localai.block.unsupported') : null;
  const partial = s.k === 'none' || s.k === 'error' ? s.partialBytes : 0;
  const busy = s.k === 'downloading' || s.k === 'verifying';
  const errKey = s.k === 'error' ? (['network', 'wifi_required', 'sha_mismatch', 'size_mismatch', 'no_space', 'unsupported'].includes(s.code) ? s.code : 'generic') : null;

  return (
    <div className="stack localai" data-testid="localai-card">
      <p className="small muted">{t('localai.intro')}</p>
      <Segmented<AiMode> label={t('localai.modeLabel')} value={mode} onChange={(m) => { setMode(m); setModeState(m); }}
        options={[{ value: 'auto', label: t('localai.mode.auto') }, { value: 'cloud', label: t('localai.mode.cloud') }, { value: 'local', label: t('localai.mode.local') }]} />
      <p className="small muted" data-testid="localai-mode-hint">{t(`localai.modeHint.${mode}`)}</p>

      <h3 className="pf-sub">{t('localai.model')}</h3>
      <div className="la-status">
        <span data-testid="localai-status">
          {s.k === 'loading' ? t('localai.status.loading')
            : s.k === 'installed' ? t('localai.status.installed', { size: gb(s.sizeBytes) })
              : s.k === 'downloading' ? t('localai.status.downloading', { pct: fmt.num(pct(s.received, s.total)) })
                : s.k === 'verifying' ? t('localai.status.verifying', { pct: fmt.num(pct(s.received, s.total)) })
                  : t('localai.status.none')}
        </span>
        {s.k === 'installed' ? <Button size="sm" variant="danger" onClick={() => setConfirm(true)}>{t('localai.action.delete')}</Button> : null}
      </div>
      {busy ? <div className="la-bar"><ProgressBar value={s.received} max={s.total} label={t('localai.model')} /></div> : null}
      {partial > 0 && !busy ? <p className="small muted">{t('localai.status.partial', { pct: fmt.num(pct(partial, cfg.sizeBytes)) })}</p> : null}
      {errKey ? <Banner tone="warn"><span data-testid="localai-error">{t(`localai.err.${errKey}`)}</span></Banner> : null}
      {blockText && s.k !== 'installed' ? <Banner><span data-testid="localai-block">{blockText}</span></Banner> : null}

      {s.k !== 'installed' && s.k !== 'loading' ? (
        <div className="la-actions">
          {busy
            ? <Button onClick={() => void ctl.cancel()}>{t('localai.action.cancel')}</Button>
            : <Button disabled={blocker !== null} aria-describedby={blocker ? 'localai-block' : undefined} onClick={() => void ctl.start(wifi)}>{partial > 0 ? t('localai.action.resume') : t('localai.action.download', { size: total })}</Button>}
        </div>
      ) : null}

      <Toggle label={t('localai.wifiOnly')} checked={wifi} onChange={(v) => { setWifiOnly(v); setWifi(v); }} />
      <Toggle label={t('localai.translate')} checked={tr} onChange={(v) => { setLocalTranslate(v); setTr(v); }} />
      <p className="small muted">{t('localai.translateHint')}</p>

      <ul className="la-notes small muted">
        <li>{t('localai.notes.private')}</li>
        <li>{t('localai.notes.slow')}</li>
        <li>{t('localai.notes.storage', { size: total })}</li>
        <li>{t('localai.notes.safety')}</li>
      </ul>
      <p className="small muted">{t('localai.licenseNote')} <a className="la-license" href={GEMMA_LICENSE_URL} target="_blank" rel="noopener noreferrer">{t('localai.license')}</a></p>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title={t('localai.action.deleteTitle')}>
        <Banner tone="warn">{t('localai.action.deleteBody', { size: gb(s.k === 'installed' ? s.sizeBytes : cfg.sizeBytes) })}</Banner>
        <div className="row-wrap">
          <Button variant="danger" onClick={() => { setConfirm(false); void ctl.remove(); }}>{t('localai.action.deleteGo')}</Button>
          <Button onClick={() => setConfirm(false)}>{t('localai.action.keep')}</Button>
        </div>
      </Sheet>
    </div>
  );
}
