/** Data export, redo onboarding and account deletion. */
import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { DELETE_CONFIRMATION, deleteAccountSchema } from '@shared/schemas/profile';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Card, LinkButton, Modal, Notice, PasswordField, TextField, useToast } from '../../components/ui';
import { clearOutbox } from '../../features/offline/sync';
import { deleteAccount, downloadJson, fetchAccountExport } from '../../features/profile/api';
import { LEGAL_PAGES } from '../../features/legal/links';
import { ONBOARDING_DRAFT_KEY } from '../../features/profile/draft';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { storage } from '../../lib/storage';
import { BackupSection } from './BackupSection';
import { usePageGuard } from './sectionForm';

function DeleteAccountModal({ open, onClose }: { open: boolean; onClose(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { allowLeave } = usePageGuard();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const ready = password.length > 0 && confirmText === DELETE_CONFIRMATION;

  const mutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      storage.remove(ONBOARDING_DRAFT_KEY);
      // Unsynced food log / weigh-ins of a deleted account can never sync: remove them from the device.
      if (user) clearOutbox(user.id);
      allowLeave();
      // The server already ended the session; logout() only clears local state (ignore its request failing).
      await logout().catch(() => undefined);
      navigate('/login', { replace: true });
      toast.success(t('settings.privacy.deleted'));
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'invalid_current_password') {
        setPasswordError(t('settings.errors.invalid_current_password'));
        return;
      }
      setFormError(errorMessage(err, i18n, 'settings'));
    },
  });

  const close = () => {
    if (mutation.isPending) return;
    setPassword('');
    setConfirmText('');
    setPasswordError(null);
    setFormError(null);
    onClose();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    const parsed = deleteAccountSchema.safeParse({ password, confirm: confirmText });
    if (!parsed.success) {
      if (!password) setPasswordError(t('errors.fields.required'));
      return;
    }
    setFormError(null);
    mutation.mutate(parsed.data);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('settings.privacy.deleteModal.title')}
      footer={
        <>
          <Button onClick={close} disabled={mutation.isPending}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form="delete-account-form" variant="danger" icon="trash" loading={mutation.isPending} disabled={!ready}>
            {t('settings.privacy.deleteModal.submit')}
          </Button>
        </>
      }
    >
      <form id="delete-account-form" onSubmit={onSubmit} noValidate className="stack">
        <Notice tone="danger">{t('settings.privacy.deleteModal.body')}</Notice>
        <p className="small muted">{t('settings.privacy.deleteModal.suggestion')}</p>
        <PasswordField
          label={t('settings.privacy.deleteModal.password')}
          autoComplete="current-password"
          name="deletePassword"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          error={passwordError}
          required
          dir="ltr"
        />
        <TextField
          label={t('settings.privacy.deleteModal.confirm')}
          hint={t('settings.privacy.deleteModal.confirmHint')}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          dir="ltr"
          name="deleteConfirm"
        />
        {formError && <Notice tone="danger">{formError}</Notice>}
      </form>
    </Modal>
  );
}

export function PrivacySection() {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const data = await fetchAccountExport();
      return downloadJson(data, `fitai-export-${data.exportDate}.json`);
    },
    onSuccess: (result) => {
      if (result !== 'cancelled') toast.success(t('settings.privacy.exported'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'settings')),
  });

  return (
    <Card id="settings-privacy" title={t('settings.privacy.title')} subtitle={t('settings.privacy.subtitle')} className="settings-section">
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
            <h3 className="section-title">{t('settings.privacy.exportTitle')}</h3>
            <p className="small muted">{t('settings.privacy.exportHint')}</p>
          </div>
          <Button icon="download" loading={exportMutation.isPending} onClick={() => exportMutation.mutate()}>
            {t('settings.privacy.export')}
          </Button>
        </div>
        <hr className="divider" />
        <BackupSection />
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
        <hr className="divider" />
        <div className="row-between">
          <div>
            <h3 className="section-title">{t('settings.privacy.deleteTitle')}</h3>
            <p className="small muted">{t('settings.privacy.deleteHint')}</p>
          </div>
          <Button variant="danger" icon="trash" onClick={() => setDeleteOpen(true)}>
            {t('settings.privacy.delete')}
          </Button>
        </div>
      </div>
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Card>
  );
}
