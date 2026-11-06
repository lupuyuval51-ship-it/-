import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type ReactNode } from 'react';
import { api, ApiRequestError } from '../../api/client.ts';
import { useMe } from '../../app/session.ts';
import { IS_DEVICE } from '../../env.ts';
import { fmt, useLang, type TFn } from '../../i18n/index.tsx';
import { Banner, Button, errorMessage, Sheet } from '../../ui/kit.tsx';
import { IconChevron } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { markBackupDone } from '../../automation/checkin.ts';
import { downloadJson, parseBackupText, readFileText, withClientSettings, type BackupCounts, type ParsedBackup, type RestoreResult } from './backup.ts';
import { applyClientSettings, collectClientSettings } from './clientSettings.ts';

const MAX_BYTES = IS_DEVICE ? 200 * 1024 * 1024 : 8 * 1024 * 1024;
const MAX_MB = MAX_BYTES / (1024 * 1024);
const FILENAME = 'lupu-fit-export.json';
/** The live workout screen caches the running session here; after a restore that session no longer exists. */
const LIVE_SESSION_KEY = 'lf_live_session';

type Staged = Extract<ParsedBackup, { ok: true }>;
const n = (v: number | undefined): string => fmt.num(v ?? 0);

/** One line per kind of data, with a count. `v2` adds the sections only a version 2 file carries. */
function itemLines(t: TFn, c: Record<keyof BackupCounts, number>, v2: boolean): string[] {
  const lines = [t('profile.backup.item.workouts', { n: n(c.workouts) }), t('profile.backup.item.foods', { n: n(c.foods) }), t('profile.backup.item.weights', { n: n(c.weights) })];
  if (v2) lines.push(
    t('profile.backup.item.readiness', { n: n(c.readiness) }), t('profile.backup.item.plans', { n: n(c.plans) }), t('profile.backup.item.savedMeals', { n: n(c.savedMeals) }),
    t('profile.backup.item.customFoods', { n: n(c.customFoods) }), t('profile.backup.item.coach', { n: n(c.threads), m: n(c.messages) }),
  );
  return lines;
}
const SKIP_KEYS = ['unknownExercises', 'unfinishedWorkouts', 'duplicateDays', 'invalidItems', 'xpEvents', 'achievements'] as const;

export function BackupPanel(): ReactNode {
  const { t, lang, setLang } = useLang(); const toast = useToast(); const qc = useQueryClient();
  const userId = (useMe().data as { user?: { id?: string } } | null | undefined)?.user?.id ?? null; // defensive: tests and offline caches may hand back partial data
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [staged, setStaged] = useState<Staged | null>(null);
  const [result, setResult] = useState<{ r: RestoreResult; v2: boolean; withSettings: boolean } | null>(null);

  /** The server's export, plus the settings that only this browser knows. */
  const fetchExport = async () => withClientSettings(await api.get<unknown>('/api/export'), collectClientSettings(userId));
  const doExport = async () => {
    setBusy(true); setErr(null);
    try { const data = await fetchExport(); downloadJson(FILENAME, data); markBackupDone(); toast(t('profile.backup.exported'), 'ok'); } catch (e) { setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };
  const doShare = async () => {
    setBusy(true); setErr(null);
    try {
      const data = await fetchExport();
      const file = new File([JSON.stringify(data, null, 2)], FILENAME, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: FILENAME }); markBackupDone(); }
      else { downloadJson(FILENAME, data); markBackupDone(); toast(t('profile.backup.exported'), 'ok'); }
    } catch (e) { if ((e as { name?: string }).name !== 'AbortError') setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };

  const onFile = async (f: File | undefined) => {
    setErr(null); setResult(null); setStaged(null);
    if (!f) return;
    if (f.size > MAX_BYTES) { setErr(t('profile.backup.tooLarge', { mb: n(MAX_MB) })); return; }
    let text: string;
    try { text = await readFileText(f); } catch { setErr(t('profile.backup.unreadable')); return; }
    const parsed = parseBackupText(text);
    if (parsed.ok) { setStaged(parsed); return; }
    setErr(parsed.reason === 'json' ? t('profile.backup.notJson')
      : parsed.reason === 'shape' || parsed.reason === 'notBackup' ? t('profile.backup.wrongFile')
      : parsed.reason === 'newer' ? t('profile.backup.newer', { v: n(parsed.version) })
      : t('profile.backup.invalid', { path: parsed.path ?? '—' }));
  };

  const confirm = async () => {
    if (!staged) return;
    setBusy(true); setErr(null);
    try {
      // Only the validated backup goes to the restore route; the browser-only settings block is applied here, after the data is in.
      const r = await api.post<RestoreResult>('/api/device/restore', staged.backup);
      let withSettings = false;
      try { localStorage.removeItem(LIVE_SESSION_KEY); } catch { /* storage unavailable */ }
      if (staged.clientSettings) { const out = applyClientSettings(staged.clientSettings, userId); if (out.language) setLang(out.language); withSettings = true; }
      setResult({ r, v2: staged.version === 2, withSettings }); setStaged(null);
      void qc.invalidateQueries();
      toast(t('profile.backup.restoredToast'), 'ok');
    } catch (e) {
      setStaged(null);
      const issues = e instanceof ApiRequestError ? (e.body as { issues?: { message?: string }[] } | null)?.issues : undefined;
      if (e instanceof ApiRequestError && e.status === 413) setErr(t('profile.backup.tooLarge', { mb: n(MAX_MB) }));
      else if (e instanceof ApiRequestError && e.status === 400 && issues?.some((i) => i.message === 'newer_version')) setErr(t('profile.backup.newer', { v: '?' }));
      else if (e instanceof ApiRequestError && e.status === 400) setErr(t('profile.backup.rejected'));
      else setErr(errorMessage(e, t));
    } finally { setBusy(false); }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const skippedLines = result ? SKIP_KEYS.filter((k) => (result.r.skipped?.[k] ?? 0) > 0).map((k) => t(`profile.backup.skip.${k}`, { n: n(result.r.skipped?.[k]) })) : [];
  const left = result ? (result.r.untouched ?? []).map((s) => t(`profile.backup.section.${s}`)).join(', ') : '';
  const stagedCounts = staged?.counts;
  return (
    <div className="stack">
      <p className="small muted">{t('profile.backup.hint')}</p>
      <div>
        <button type="button" className="list-link pf-rowbtn" onClick={() => void doExport()} disabled={busy}><span className="grow start"><strong>{t('profile.backup.export')}</strong><br /><span className="small muted">{t('profile.nu.exportHint')}</span></span><IconChevron className="chev" /></button>
        {canShare ? <button type="button" className="list-link pf-rowbtn" onClick={() => void doShare()} disabled={busy}><span className="grow start"><strong>{t('action.share')}</strong><br /><span className="small muted">{t('profile.nu.shareHint')}</span></span><IconChevron className="chev" /></button> : null}
        <button type="button" className="list-link pf-rowbtn" onClick={() => fileInput.current?.click()} disabled={busy}><span className="grow start"><strong>{t('profile.backup.restore')}</strong><br /><span className="small muted">{t('profile.nu.restoreHint')}</span></span><IconChevron className="chev" /></button>
        <input ref={fileInput} className="sr-only" type="file" accept=".json,application/json" aria-label={t('profile.backup.pick')} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {err ? <Banner tone="danger">{err}</Banner> : null}
      {result ? (
        <Banner tone="ok">
          <div data-testid="restore-result" className="stack">
            <strong>{t('profile.backup.done.title')}</strong>
            <ul className="small">
              {result.r.restored.profile ? <li>{t('profile.backup.item.profile')}</li> : null}
              {itemLines(t, { workouts: result.r.restored.workouts ?? 0, foods: result.r.restored.foods ?? 0, weights: result.r.restored.weights ?? 0, readiness: result.r.restored.readiness ?? 0, plans: result.r.restored.plans ?? 0, savedMeals: result.r.restored.savedMeals ?? 0, customFoods: result.r.restored.customFoods ?? 0, threads: result.r.restored.threads ?? 0, messages: result.r.restored.messages ?? 0 }, result.v2).map((l) => <li key={l}>{l}</li>)}
              {result.withSettings ? <li>{t('profile.backup.item.settings')}</li> : null}
            </ul>
            {skippedLines.length ? <div className="small"><strong>{t('profile.backup.done.skipped')}</strong><ul>{skippedLines.map((l) => <li key={l}>{l}</li>)}</ul></div> : null}
            {(result.r.skipped?.profile ?? 0) > 0 ? <p className="small">{t('profile.backup.skip.profile')}</p> : null}
            {left ? <p className="small">{t('profile.backup.done.untouched', { list: left })}</p> : null}
          </div>
        </Banner>
      ) : null}
      <Sheet open={!!staged} onClose={() => setStaged(null)} title={t('profile.backup.confirmTitle')}>
        <Banner tone="warn">{t(staged?.version === 1 ? 'profile.backup.confirmBodyV1' : 'profile.backup.confirmBody')}</Banner>
        {staged && stagedCounts ? (
          <div className="stack">
            <p>{t('profile.backup.confirmFile', { date: staged.exportedAt.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(staged.exportedAt) ? fmt.date(staged.exportedAt.slice(0, 10), lang, { day: 'numeric', month: 'short', year: 'numeric' }) : '—' })}</p>
            <ul className="small">
              {staged.backup.profile ? <li>{t('profile.backup.item.profile')}</li> : null}
              {itemLines(t, stagedCounts, staged.version === 2).map((l) => <li key={l}>{l}</li>)}
              {staged.clientSettings ? <li>{t('profile.backup.item.settings')}</li> : null}
            </ul>
            {staged.version === 2 ? <p className="small">{t('profile.backup.confirmV2Extra')}</p> : <p className="small">{t('profile.backup.confirmKeep')}</p>}
          </div>
        ) : null}
        <div className="row-wrap">
          <Button variant="danger" onClick={() => void confirm()} disabled={busy}>{t('profile.backup.confirmGo')}</Button>
          <Button variant="ghost" onClick={() => setStaged(null)}>{t('action.cancel')}</Button>
        </div>
      </Sheet>
    </div>
  );
}
