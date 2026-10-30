/**
 * Device mode settings: "Your data on this phone" (what replaces the account, security and privacy cards of
 * the website): where the data lives and what that means, the backup file, restoring one, and erasing
 * everything on the phone. Plus the privacy/terms links and redoing the questionnaire.
 */
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Card, LinkButton, Modal, Notice, Spinner, useToast } from '../../components/ui';
import { saveDeviceBackup } from '../../features/device/backup';
import { eraseThisPhone, lastBackupAt, lastBackupShared } from '../../features/device/control';
import { DeviceRestoreButton } from '../../features/device/DeviceRestore';
import { LEGAL_PAGES } from '../../features/legal/links';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { usePageGuard } from './sectionForm';

function useSaveBackup() {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const [last, setLast] = useState(lastBackupAt);
  const [shared, setShared] = useState(lastBackupShared);
  const save = useMutation({
    mutationFn: () => saveDeviceBackup(),
    onSuccess: ({ result, restorable }) => {
      if (result === 'cancelled') return;
      if (!restorable) {
        toast.error(t('device.settings.backupTooLarge'));
        return;
      }
      setLast(lastBackupAt());
      setShared(lastBackupShared());
      toast.success(t(result === 'shared' ? 'device.settings.backupShared' : 'device.settings.backupSaved'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'settings')),
  });
  return { save, last, shared };
}

function EraseDialog({ open, onClose, onBackup, backingUp }: { open: boolean; onClose(): void; onBackup(): void; backingUp: boolean }) {
  const { t } = useI18n();
  const { allowLeave } = usePageGuard();
  const [step, setStep] = useState<1 | 2>(1);
  const erase = useMutation({
    mutationFn: async () => {
      allowLeave();
      await eraseThisPhone();
    },
  });
  const close = () => {
    if (erase.isPending || erase.isSuccess) return;
    setStep(1);
    onClose();
  };
  const busy = erase.isPending || erase.isSuccess;
  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      title={step === 1 ? t('device.erase.step1Title') : t('device.erase.step2Title')}
      footer={
        <>
          <Button onClick={close} disabled={busy}>
            {t('common.actions.cancel')}
          </Button>
          {step === 1 ? (
            <Button variant="danger" iconEnd="chevronRight" onClick={() => setStep(2)}>
              {t('device.erase.continue')}
            </Button>
          ) : (
            <Button variant="danger" icon="trash" loading={busy} onClick={() => erase.mutate()}>
              {t('device.erase.confirm')}
            </Button>
          )}
        </>
      }
    >
      {step === 1 ? (
        <div className="stack">
          <Notice tone="danger">{t('device.erase.step1Body')}</Notice>
          <div>
            <Button icon="download" loading={backingUp} onClick={onBackup}>
              {t('device.erase.backupFirst')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="stack" aria-live="polite">
          <p>{t('device.erase.step2Body')}</p>
          {busy && (
            <p className="device-inline-status">
              <Spinner size={16} />
              <span>{t('device.erase.erasing')}</span>
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

export function DeviceDataSection() {
  const { t, formatDate } = useI18n();
  const { save, last, shared } = useSaveBackup();
  const [eraseOpen, setEraseOpen] = useState(false);
  const lastDate = last ? formatDate(last, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  // Android cannot tell whether the app picked in the share sheet really kept the file.
  const lastText = last ? t(shared ? 'device.settings.lastShared' : 'device.settings.lastBackup', { date: lastDate }) : t('device.settings.noBackupYet');

  return (
    <Card id="settings-data" title={t('device.settings.dataTitle')} subtitle={t('device.settings.dataSubtitle')} className="settings-section device-data">
      <div className="stack">
        <Notice tone="warning" icon="warning">
          <p>{t('device.settings.onlyHere')}</p>
          <p>{t('device.settings.lossWarning')}</p>
        </Notice>
        <p className="small muted">{t('device.settings.androidBackup')}</p>

        <section className="device-data-block" aria-labelledby="device-backup-title">
          <h3 id="device-backup-title" className="section-title">
            {t('device.settings.backupTitle')}
          </h3>
          <p className="small muted">{t('device.settings.backupHint')}</p>
          <p className="small">{t('device.settings.backupPrivate')}</p>
          <p className={`small ${last ? 'muted' : 'device-data-attention'}`} aria-live="polite">
            {lastText}
          </p>
          <Button variant="primary" icon="download" block loading={save.isPending} onClick={() => save.mutate()}>
            {t('device.settings.saveBackup')}
          </Button>
        </section>

        <hr className="divider" />
        <section className="device-data-block" aria-labelledby="device-restore-title">
          <h3 id="device-restore-title" className="section-title">
            {t('device.settings.restoreTitle')}
          </h3>
          <p className="small muted">{t('device.settings.restoreHint')}</p>
          <DeviceRestoreButton replacing block />
        </section>

        <hr className="divider" />
        <section className="device-data-block" aria-labelledby="device-erase-title">
          <h3 id="device-erase-title" className="section-title">
            {t('device.settings.eraseTitle')}
          </h3>
          <p className="small muted">{t('device.settings.eraseHint')}</p>
          <div>
            <Button variant="danger" icon="trash" onClick={() => setEraseOpen(true)}>
              {t('device.settings.erase')}
            </Button>
          </div>
        </section>
      </div>
      <EraseDialog open={eraseOpen} onClose={() => setEraseOpen(false)} onBackup={() => save.mutate()} backingUp={save.isPending} />
    </Card>
  );
}

/** Privacy policy / terms links and redoing the questionnaire (device mode's part of the privacy card). */
export function DevicePrivacySection() {
  const { t } = useI18n();
  return (
    <Card id="settings-privacy" title={t('device.settings.legalTitle')} className="settings-section">
      <div className="stack">
        <nav aria-label={t('legal.nav.label')}>
          <ul className="settings-legal-links">
            {LEGAL_PAGES.map((p) => (
              <li key={p.to}>
                <Link to={p.to} className="link link-block">
                  {t(p.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <hr className="divider" />
        <div className="row-between">
          <div>
            <h3 className="section-title">{t('settings.privacy.redoTitle')}</h3>
            <p className="small muted">{t('settings.privacy.redoHint')}</p>
          </div>
          <LinkButton to="/onboarding" icon="refresh">
            {t('settings.privacy.redo')}
          </LinkButton>
        </div>
      </div>
    </Card>
  );
}
