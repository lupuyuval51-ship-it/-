import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { passwordResetRequestSchema } from '@shared/schemas/auth';
import { api } from '../../api/client';
import { Button, Card, Notice, TextField } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';

export default function ForgotPasswordPage() {
  const i18n = useI18n();
  const { t } = i18n;
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  useDocumentTitle(t('auth.forgot.title'));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = passwordResetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(fieldErrorMessage(parsed.error.issues[0]?.message, i18n) ?? null);
      return;
    }
    setError(null);
    setPending(true);
    try {
      await api('/auth/password-reset/request', { method: 'POST', body: parsed.data });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, i18n));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1 className="auth-title">{t('auth.forgot.title')}</h1>
        <p className="muted">{t('auth.forgot.subtitle')}</p>
        {sent ? (
          <Notice tone="success">
            {t('auth.forgot.sent')}
            <br />
            <small>{t('auth.forgot.emailNotConfigured')}</small>
          </Notice>
        ) : (
          <form onSubmit={onSubmit} noValidate className="stack">
            <TextField label={t('auth.fields.email')} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} required dir="ltr" />
            <Button type="submit" variant="primary" block loading={pending}>
              {t('auth.forgot.submit')}
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
