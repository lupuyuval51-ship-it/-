/** Backup file with the changes that only live on this device, and restoring from such a file. */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type ChangeEvent } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Modal, Notice, ProgressBar, useToast } from '../../components/ui';
import { buildBackup, MAX_BACKUP_BYTES, parseBackup, planIsEmpty, planRestore, type RestorePlan } from '../../features/backup/backup';
import { runRestore, type RestoreResult } from '../../features/backup/restore';
import { outboxSync } from '../../features/offline/sync';
import { downloadJson, fetchAccountExport } from '../../features/profile/api';
import { currentWorkoutPrefs } from '../../features/sessions/prefsSync';
import { useI18n } from '../../i18n';
import { today as todayIn } from '../../lib/dates';
import { errorMessage } from '../../lib/errors';

function deviceState() {
  return { outbox: outboxSync.getSnapshot().entries, workoutPrefs: currentWorkoutPrefs() };
}

export function BackupSection() {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<RestorePlan | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<RestoreResult | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const account = await fetchAccountExport();
      return downloadJson(buildBackup(account, deviceState()), `lupu-fit-backup-${account.exportDate}.json`);
    },
    onSuccess: (result) => {
      if (result !== 'cancelled') toast.success(t('settings.backup.saved'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'settings')),
  });

  const analyse = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('too_large');
      const parsed = parseBackup(await file.text(), file.size);
      if (!parsed.ok) throw new Error(parsed.reason);
      const server = await fetchAccountExport();
      const ids = new Set(outboxSync.getSnapshot().entries.map((e) => e.id));
      return planRestore(parsed.backup, server, ids, todayIn(user?.timezone), currentWorkoutPrefs());
    },
    onSuccess: (p) => {
      setResult(null);
      setProgress(null);
      setPlan(p);
    },
    onError: (err) => {
      const reason = err instanceof Error ? err.message : '';
      const known = ['too_large', 'not_json', 'not_a_backup', 'unsupported_version'];
      toast.error(known.includes(reason) ? t(`settings.backup.errors.${reason}` as 'settings.backup.errors.not_json') : errorMessage(err, i18n, 'settings'));
    },
  });

  const restore = useMutation({
    mutationFn: (p: RestorePlan) => runRestore(p, (done, total) => setProgress({ done, total })),
    onSuccess: async (r) => {
      setResult(r);
      for (const key of [['nutrition'], ['progress'], ['dashboard'], ['profile'], ['gamification']]) void qc.invalidateQueries({ queryKey: key });
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'settings')),
  });

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // the same file can be chosen again
    if (file) analyse.mutate(file);
  };
  const close = () => {
    if (restore.isPending) return;
    setPlan(null);
    setResult(null);
    setProgress(null);
  };

  return (
    <>
      <div className="row-between">
        <div>
          <h3 className="section-title">{t('settings.backup.title')}</h3>
          <p className="small muted">{t('settings.backup.hint')}</p>
        </div>
        <div className="row">
          <Button icon="download" loading={save.isPending} onClick={() => save.mutate()}>
            {t('settings.backup.save')}
          </Button>
          <Button icon="refresh" loading={analyse.isPending} onClick={() => fileInput.current?.click()}>
            {t('settings.backup.restore')}
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden data-testid="backup-file" onChange={onPick} />
        </div>
      </div>
      <Modal
        open={plan != null}
        onClose={close}
        title={t('settings.backup.restoreTitle')}
        footer={
          result ? (
            <Button variant="primary" onClick={close}>
              {t('common.actions.close')}
            </Button>
          ) : (
            <>
              <Button onClick={close} disabled={restore.isPending}>
                {t('common.actions.cancel')}
              </Button>
              {/* Nothing to restore: no button that could still apply the file's settings. */}
              {plan && !planIsEmpty(plan) && (
                <Button variant="primary" loading={restore.isPending} onClick={() => restore.mutate(plan)}>
                  {t('settings.backup.confirm')}
                </Button>
              )}
            </>
          )
        }
      >
        {plan && (
          <div className="stack">
            {result ? (
              <Notice tone={result.failed > 0 ? 'warning' : 'success'} title={t('settings.backup.done')}>
                {t('settings.backup.doneBody', { weights: result.weights, foods: result.foods, outbox: result.outbox })}
                {result.failed > 0 && ` ${t('settings.backup.failedCount', { count: result.failed })}`}
              </Notice>
            ) : planIsEmpty(plan) ? (
              <p>{t('settings.backup.nothingNew')}</p>
            ) : (
              <>
                <p className="small muted">{t('settings.backup.intro')}</p>
                <ul className="list" aria-label={t('settings.backup.restoreTitle')}>
                  <li className="list-item">{t('settings.backup.weights', { count: plan.weights.length })}</li>
                  <li className="list-item">{t('settings.backup.foods', { count: plan.foods.length })}</li>
                  {plan.outbox.length > 0 && <li className="list-item">{t('settings.backup.outbox', { count: plan.outbox.length })}</li>}
                  {plan.workoutPrefs && <li className="list-item">{t('settings.backup.prefs')}</li>}
                </ul>
                {(plan.alreadyThere > 0 || plan.unreadable > 0) && <p className="small faint">{t('settings.backup.skipped', { there: plan.alreadyThere, bad: plan.unreadable })}</p>}
                <p className="small muted">{t('settings.backup.notRestored')}</p>
              </>
            )}
            {progress && !result && <ProgressBar value={progress.done} max={progress.total} label={t('settings.backup.progress', { done: progress.done, total: progress.total })} />}
          </div>
        )}
      </Modal>
    </>
  );
}
