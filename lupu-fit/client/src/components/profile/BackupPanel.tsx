import { useEffect, useState, type ReactNode } from 'react';
import { api } from '../../api/client.ts';
import { useMe } from '../../app/session.ts';
import { useLang, type TFn } from '../../i18n/index.tsx';
import { backupFilename, canSaveToDocuments, isNativeApp, saveAndShareBackup, saveBackupToDocuments, type SaveResult } from '../../lib/nativeFile.ts';
import { Banner, errorMessage } from '../../ui/kit.tsx';
import { IconChevron } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { markBackupDone } from '../../automation/checkin.ts';
import { downloadJson, withClientSettings } from './backup.ts';
import { useBackupRestore } from './backupRestore.tsx';
import { collectClientSettings } from './clientSettings.ts';

/** File name of the browser download (unchanged). The Android app uses `lupu-fit-backup-YYYY-MM-DD.json`. */
const FILENAME = 'lupu-fit-export.json';

/** Plain words for a failed save/share. Closing the share sheet is not an error and never gets here. */
function saveError(t: TFn, r: Extract<SaveResult, { status: 'error' }>): string {
  const base = t(r.stage === 'write' ? 'profile.backup.errWrite' : r.stage === 'documents' ? 'profile.backup.errDocuments' : 'profile.backup.errShare');
  return r.detail ? `${base} (${r.detail})` : base;
}

export function BackupPanel(): ReactNode {
  const { t } = useLang(); const toast = useToast();
  const userId = (useMe().data as { user?: { id?: string } } | null | undefined)?.user?.id ?? null; // defensive: tests and offline caches may hand back partial data
  const restore = useBackupRestore();
  const { err, setErr } = restore;
  const native = isNativeApp();
  const [busy, setBusy] = useState(false);
  const [docs, setDocs] = useState<boolean | null>(null); // can a copy go to Documents without any permission? (null = not asked yet)
  useEffect(() => {
    let live = true;
    void canSaveToDocuments().then((ok) => { if (live) setDocs(ok); });
    return () => { live = false; };
  }, []);

  /** The server's export, plus the settings that only this browser knows. */
  const fetchExport = async () => withClientSettings(await api.get<unknown>('/api/export'), collectClientSettings(userId));
  const pretty = (data: unknown): string => JSON.stringify(data, null, 2);

  const done = (r: SaveResult) => {
    if (r.status === 'cancelled') return; // closing the share sheet is a choice, not a failure
    if (r.status === 'error') { setErr(saveError(t, r)); return; }
    markBackupDone();
    if (r.status === 'shared') { if (native) toast(t('profile.backup.sharedToast'), 'ok'); } // the browser's own share dialog needs no toast
    else if (r.location) toast(t('profile.backup.savedDocs', { path: r.location }), 'ok');
    else toast(t('profile.backup.exported'), 'ok');
  };

  /** Browser: an `<a download>` link. Android app: the file goes to the system share sheet (Drive, Files, WhatsApp, ...). */
  const doExport = async () => {
    setBusy(true); setErr(null);
    try {
      const data = await fetchExport();
      if (native) done(await saveAndShareBackup(backupFilename(), pretty(data), { title: t('profile.backup.shareTitle'), dialogTitle: t('profile.backup.shareTitle') }));
      else { downloadJson(FILENAME, data); markBackupDone(); toast(t('profile.backup.exported'), 'ok'); }
    } catch (e) { setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };
  /** Browser only (the app's export already is the share sheet). */
  const doShare = async () => {
    setBusy(true); setErr(null);
    try { done(await saveAndShareBackup(FILENAME, pretty(await fetchExport()))); } catch (e) { setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };
  const doDocuments = async () => {
    setBusy(true); setErr(null);
    try { done(await saveBackupToDocuments(backupFilename(new Date(), true), pretty(await fetchExport()))); } catch (e) { setErr(errorMessage(e, t)); } finally { setBusy(false); }
  };

  const canWebShare = !native && typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const off = busy || restore.busy;
  return (
    <div className="stack">
      <p className="small muted">{t('profile.backup.hint')}</p>
      <div>
        <button type="button" className="list-link pf-rowbtn" onClick={() => void doExport()} disabled={off}><span className="grow start"><strong>{t('profile.backup.export')}</strong><br /><span className="small muted">{t(native ? 'profile.backup.nativeHint' : 'profile.nu.exportHint')}</span></span><IconChevron className="chev" /></button>
        {native && docs === true ? <button type="button" className="list-link pf-rowbtn" onClick={() => void doDocuments()} disabled={off}><span className="grow start"><strong>{t('profile.backup.saveDocs')}</strong><br /><span className="small muted">{t('profile.backup.saveDocsHint')}</span></span><IconChevron className="chev" /></button> : null}
        {canWebShare ? <button type="button" className="list-link pf-rowbtn" onClick={() => void doShare()} disabled={off}><span className="grow start"><strong>{t('action.share')}</strong><br /><span className="small muted">{t('profile.nu.shareHint')}</span></span><IconChevron className="chev" /></button> : null}
        <button type="button" className="list-link pf-rowbtn" onClick={restore.open} disabled={off}><span className="grow start"><strong>{t('profile.backup.restore')}</strong><br /><span className="small muted">{t('profile.nu.restoreHint')}</span></span><IconChevron className="chev" /></button>
        {restore.input}
      </div>
      {native && docs === false ? <p className="small muted">{t('profile.backup.noDocs')}</p> : null}
      {err ? <Banner tone="danger">{err}</Banner> : null}
      {restore.summary}
      {restore.sheet}
    </div>
  );
}
