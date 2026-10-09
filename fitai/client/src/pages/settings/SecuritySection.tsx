/** Change password and sign out of every device. */
import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { changePasswordSchema } from '@shared/schemas/auth';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Card, Notice, PasswordField, useConfirm, useToast } from '../../components/ui';
import { changePassword, logoutAllDevices } from '../../features/profile/api';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { usePageGuard } from './sectionForm';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function SecuritySection() {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { allowLeave } = usePageGuard();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setForm(EMPTY);
      setErrors({});
      toast.success(t('settings.security.passwordChanged'));
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'invalid_current_password') {
        setErrors({ currentPassword: t('settings.errors.invalid_current_password') });
        return;
      }
      if (err instanceof ApiError && err.code === 'validation_error') {
        setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, fieldErrorMessage(v, i18n) ?? ''])));
      }
      setFormError(errorMessage(err, i18n, 'settings'));
    },
  });

  const logoutAll = useMutation({
    mutationFn: logoutAllDevices,
    onSuccess: async () => {
      allowLeave();
      // Every session is already gone; logout() only clears local state (ignore its request failing).
      await logout().catch(() => undefined);
      navigate('/login', { replace: true });
      toast.info(t('settings.security.loggedOutAll'));
    },
    onError: (err) => toast.error(errorMessage(err, i18n, 'settings')),
  });

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((errs) => ({ ...errs, [k]: undefined }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordMutation.isPending) return;
    setFormError(null);
    const parsed = changePasswordSchema.safeParse({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    const next: typeof errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]) as keyof typeof EMPTY;
        next[key] ??= issue.code === 'too_small' && key === 'currentPassword' ? t('errors.fields.required') : fieldErrorMessage(issue.message, i18n);
      }
    }
    if (form.newPassword !== form.confirmPassword) next.confirmPassword = t('settings.security.passwordMismatch');
    if (Object.values(next).some(Boolean)) {
      setErrors(next);
      return;
    }
    setErrors({});
    passwordMutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <Card id="settings-security" title={t('settings.security.title')} subtitle={t('settings.security.subtitle')} className="settings-section">
      <div className="stack-lg">
        <form onSubmit={onSubmit} noValidate className="stack">
          <h3 className="section-title">{t('settings.security.changePassword')}</h3>
          {/* Lets password managers associate the new password with this account. */}
          <input type="text" name="username" autoComplete="username" value={user?.email ?? ''} hidden readOnly />
          <div className="grid-3">
            <PasswordField
              label={t('settings.security.currentPassword')}
              autoComplete="current-password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={set('currentPassword')}
              error={errors.currentPassword}
              required
              dir="ltr"
            />
            <PasswordField
              label={t('settings.security.newPassword')}
              autoComplete="new-password"
              name="newPassword"
              value={form.newPassword}
              onChange={set('newPassword')}
              error={errors.newPassword}
              hint={t('auth.fields.passwordHint')}
              required
              dir="ltr"
            />
            <PasswordField
              label={t('settings.security.confirmPassword')}
              autoComplete="new-password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              error={errors.confirmPassword}
              required
              dir="ltr"
            />
          </div>
          {formError && <Notice tone="danger">{formError}</Notice>}
          <div className="settings-actions">
            <Button type="submit" variant="primary" icon="check" loading={passwordMutation.isPending}>
              {t('settings.security.submitPassword')}
            </Button>
          </div>
        </form>
        <hr className="divider" />
        <div className="row-between">
          <div>
            <h3 className="section-title">{t('settings.security.logoutAll')}</h3>
            <p className="small muted">{t('settings.security.logoutAllHint')}</p>
          </div>
          <Button
            icon="logout"
            loading={logoutAll.isPending}
            onClick={async () => {
              const ok = await confirm({
                title: t('settings.security.logoutAllConfirmTitle'),
                body: t('settings.security.logoutAllConfirmBody'),
                confirmLabel: t('settings.security.logoutAll'),
                danger: true,
              });
              if (ok) logoutAll.mutate();
            }}
          >
            {t('settings.security.logoutAll')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
