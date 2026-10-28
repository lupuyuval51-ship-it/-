import { useId, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { passwordSchema } from '@shared/schemas/auth';
import { ApiError, api } from '../../api/client';
import { Button, Card, LinkButton, Notice, PasswordField } from '../../components/ui';
import { PasswordStrength } from '../../features/auth/PasswordStrength';
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
  const [invalidLink, setInvalidLink] = useState(false);
  const strengthId = useId();
  const [pending, setPending] = useState(false);
  useDocumentTitle(t('auth.reset.title'));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setError(password === '' ? t('errors.fields.required') : (fieldErrorMessage(parsed.error.issues[0]?.message, i18n) ?? null));
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api('/auth/password-reset/confirm', { method: 'POST', body: { token, newPassword: password } });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_reset_token') setInvalidLink(true);
      else setError(errorMessage(err, i18n));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1 className="auth-title">{t('auth.reset.title')}</h1>
        {!token || invalidLink ? (
          <div className="stack">
            <Notice tone="warning">{invalidLink ? t('auth.reset.invalidLink') : t('auth.reset.missingToken')}</Notice>
            <LinkButton to="/forgot-password" variant="primary" block>
              {t('auth.reset.requestNew')}
            </LinkButton>
          </div>
        ) : done ? (
          <div className="stack">
            <Notice tone="success">{t('auth.reset.success')}</Notice>
            <LinkButton to="/login" variant="primary" block autoFocus>
              {t('auth.reset.goLogin')}
            </LinkButton>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="stack">
            <PasswordField
              label={t('auth.fields.newPassword')}
              autoComplete="new-password"
              name="newPassword"
              autoFocus
              enterKeyHint="go"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              error={error}
              required
              dir="ltr"
            />
            <PasswordStrength password={password} id={strengthId} />
            <Button type="submit" variant="primary" block loading={pending}>
              {t('auth.reset.submit')}
            </Button>
          </form>
        )}
        {!done && (
          <p className="auth-alt">
            <Link to="/login" className="link">
              {t('auth.forgot.backToLogin')}
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
