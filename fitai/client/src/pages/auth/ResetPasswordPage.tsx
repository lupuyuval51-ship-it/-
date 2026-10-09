import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { passwordSchema } from '@shared/schemas/auth';
import { api } from '../../api/client';
import { Button, Card, Notice, PasswordField } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';

export default function ResetPasswordPage() {
  const i18n = useI18n();
  const { t } = i18n;
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  useDocumentTitle(t('auth.reset.title'));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(fieldErrorMessage(parsed.error.issues[0]?.message, i18n) ?? null);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api('/auth/password-reset/confirm', { method: 'POST', body: { token, newPassword: password } });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, i18n));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1 className="auth-title">{t('auth.reset.title')}</h1>
        {!token ? (
          <Notice tone="warning">{t('auth.reset.missingToken')}</Notice>
        ) : done ? (
          <Notice tone="success">{t('auth.reset.success')}</Notice>
        ) : (
          <form onSubmit={onSubmit} noValidate className="stack">
            <PasswordField
              label={t('auth.fields.newPassword')}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              hint={t('auth.fields.passwordHint')}
              required
              dir="ltr"
            />
            <Button type="submit" variant="primary" block loading={pending}>
              {t('auth.reset.submit')}
            </Button>
          </form>
        )}
        <p className="auth-alt">
          <Link to="/login" className="link">
            {t('auth.forgot.backToLogin')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
