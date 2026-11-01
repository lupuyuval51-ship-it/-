import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type ReactNode } from 'react';
import { api, ApiRequestError } from '../../api/client.ts';
import { IS_DEVICE } from '../../env.ts';
import { fmt, useT } from '../../i18n/index.tsx';
import { Banner, Button, errorMessage, Sheet } from '../../ui/kit.tsx';
import { useToast } from '../../ui/toast.tsx';
import { downloadJson, parseBackupText, readFileText, type BackupCounts, type ParsedBackup } from './backup.ts';

const MAX_BYTES = IS_DEVICE ? 200 * 1024 * 1024 : 8 * 1024 * 1024;
const FILENAME = 'lupu-fit-export.json';

export function BackupPanel(): ReactNode {
  const t = useT(); const toast = useToast(); const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [staged, setStaged] = useState<Extract<ParsedBackup, { ok: true }> | null>(null);
  const [restored, setRestored] = useState<BackupCounts | null>(null);

  const fetchExport = () => api.get<unknown>('/api/export');
  const doExport = async () => {
    setBusy(true); setErr(null);
    try { const data = await fetchExport(); downloadJson(FILENAME, data); toast(t('profile.backup.exported'), 'ok'); } catch (e) { setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };
  const doShare = async () => {
    setBusy(true); setErr(null);
    try {
      const data = await fetchExport();
      const file = new File([JSON.stringify(data, null, 2)], FILENAME, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: FILENAME });
      else { downloadJson(FILENAME, data); toast(t('profile.backup.exported'), 'ok'); }
    } catch (e) { if ((e as { name?: string }).name !== 'AbortError') setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };

  const onFile = async (f: File | undefined) => {
    setErr(null); setRestored(null); setStaged(null);
    if (!f) return;
    if (f.size > MAX_BYTES) { setErr(t('error.payload_too_large')); return; }
    let text: string;
    try { text = await readFileText(f); } catch { setErr(t('profile.backup.unreadable')); return; }
    const parsed = parseBackupText(text);
    if (!parsed.ok) { setErr(parsed.reason === 'json' ? t('profile.backup.notJson') : t('profile.backup.invalid', { path: parsed.path ?? '—' })); return; }
    setStaged(parsed);
  };

  const confirm = async () => {
    if (!staged) return;
    setBusy(true); setErr(null);
    try {
      const r = await api.post<{ ok: boolean; restored: BackupCounts }>('/api/device/restore', staged.backup);
      setRestored(r.restored); setStaged(null);
      void qc.invalidateQueries();
      toast(t('profile.backup.restoredToast'), 'ok');
    } catch (e) {
      setStaged(null);
      if (e instanceof ApiRequestError && e.status === 413) setErr(t('error.payload_too_large'));
      else if (e instanceof ApiRequestError && e.status === 400) setErr(t('profile.backup.rejected'));
      else setErr(errorMessage(e, t));
    } finally { setBusy(false); }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  return (
    <div className="stack">
      <p className="small muted">{t('profile.backup.hint')}</p>
      <div className="row-wrap">
        <Button onClick={() => void doExport()} disabled={busy}>{t('profile.backup.export')}</Button>
        {canShare ? <Button onClick={() => void doShare()} disabled={busy}>{t('action.share')}</Button> : null}
        <Button onClick={() => fileInput.current?.click()} disabled={busy}>{t('profile.backup.restore')}</Button>
        <input ref={fileInput} className="sr-only" type="file" accept=".json,application/json" aria-label={t('profile.backup.pick')} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {err ? <Banner tone="danger">{err}</Banner> : null}
      {restored ? <Banner tone="ok"><span data-testid="restore-result">{t('profile.backup.result', { w: fmt.num(restored.weights), f: fmt.num(restored.foodEntries), s: fmt.num(restored.sessions) })}</span></Banner> : null}
      <Sheet open={!!staged} onClose={() => setStaged(null)} title={t('profile.backup.confirmTitle')}>
        <Banner tone="warn">{t('profile.backup.confirmBody')}</Banner>
        {staged ? <p>{t('profile.backup.confirmCounts', { w: fmt.num(staged.counts.weights), f: fmt.num(staged.counts.foodEntries), s: fmt.num(staged.counts.sessions) })}</p> : null}
        <div className="row-wrap">
          <Button variant="danger" onClick={() => void confirm()} disabled={busy}>{t('profile.backup.confirmGo')}</Button>
          <Button variant="ghost" onClick={() => setStaged(null)}>{t('action.cancel')}</Button>
        </div>
      </Sheet>
    </div>
  );
}
