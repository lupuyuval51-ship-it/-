/**
 * "Restore from a backup file" in device mode (welcome screen and settings): pick a file, see what it
 * holds, confirm, and the worker replaces the phone's data with it in one transaction. The app then starts
 * again on the restored data.
 */
import { useMutation } from '@tanstack/react-query';
import { useRef, useState, type ChangeEvent } from 'react';
import { ApiError } from '../../api/client';
import { Button, Modal, Notice, Spinner, useToast } from '../../components/ui';
import { useI18n, type TKey } from '../../i18n';
import { readDeviceBackup, restoreDeviceBackup, type ReadBackupResult } from './backup';
import { reloadAfterRestore } from './control';

type Candidate = Extract<ReadBackupResult, { ok: true }>;

const RESTORE_ERRORS = new Set(['not_a_snapshot', 'snapshot_invalid', 'unsupported_version']);

export function DeviceRestoreButton({
  variant = 'secondary',
  block,
  replacing,
}: {
  variant?: 'secondary' | 'ghost';
  block?: boolean;
  /** There is data on the phone that the restore replaces (settings); not on the first-run welcome. */
  replacing: boolean;
}) {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const read = useMutation({
    mutationFn: (file: File) => readDeviceBackup(file),
    onSuccess: (r) => {
      if (r.ok) {
        setError(null);
        setCandidate(r);
      } else toast.error(t(`device.restore.errors.${r.reason}` as TKey));
    },
    onError: () => toast.error(t('device.restore.errors.not_json')),
  });

  const restore = useMutation({
    mutationFn: (c: Candidate) => restoreDeviceBackup(c.snapshot),
    onSuccess: () => reloadAfterRestore(),
    onError: (err) => {
      const code = err instanceof ApiError ? err.code : '';
      setError(t(RESTORE_ERRORS.has(code) ? (`device.restore.errors.${code}` as TKey) : 'device.restore.failed'));
    },
  });

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // the same file can be picked again
    if (file) read.mutate(file);
  };
  const close = () => {
    if (restore.isPending) return;
    setCandidate(null);
    setError(null);
  };
  const summary = candidate?.summary;
  const date = candidate?.createdAt && !Number.isNaN(Date.parse(candidate.createdAt)) ? formatDate(candidate.createdAt, { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <>
      <Button variant={variant} block={block} icon="refresh" loading={read.isPending} onClick={() => input.current?.click()}>
        {t('device.settings.restore')}
      </Button>
      <input ref={input} type="file" accept="application/json,.json" hidden data-testid="device-backup-file" onChange={onPick} />
      <Modal
        open={candidate != null}
        onClose={close}
        title={t('device.restore.title')}
        footer={
          <>
            <Button onClick={close} disabled={restore.isPending}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="primary" icon="check" loading={restore.isPending} onClick={() => candidate && restore.mutate(candidate)}>
              {t('device.restore.confirm')}
            </Button>
          </>
        }
      >
        {summary && (
          <div className="stack">
            {date && <p>{t('device.restore.from', { date })}</p>}
            <div className="stack-sm">
              <p className="small muted">{t('device.restore.contains')}</p>
              <ul className="list" aria-label={t('device.restore.contains')}>
                <li className="list-item">{t('device.restore.profile')}</li>
                {summary.plans > 0 && <li className="list-item">{t('device.restore.plans', { count: summary.plans })}</li>}
                {summary.workouts > 0 && <li className="list-item">{t('device.restore.workouts', { count: summary.workouts })}</li>}
                {summary.foods > 0 && <li className="list-item">{t('device.restore.foods', { count: summary.foods })}</li>}
                {summary.weights > 0 && <li className="list-item">{t('device.restore.weights', { count: summary.weights })}</li>}
                {summary.coachThreads > 0 && <li className="list-item">{t('device.restore.coach', { count: summary.coachThreads })}</li>}
              </ul>
            </div>
            {replacing && (
              <Notice tone="warning" icon="warning">
                {t('device.restore.replaceWarning')}
              </Notice>
            )}
            <div aria-live="polite">
              {restore.isPending && (
                <p className="device-inline-status">
                  <Spinner size={16} />
                  <span>{t('device.restore.restoring')}</span>
                </p>
              )}
              {error && <Notice tone="danger">{error}</Notice>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
