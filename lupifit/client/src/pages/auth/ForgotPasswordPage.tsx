import { useEffect, useRef, useState, type FormEvent } from 'react';
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
  const sentRef = useRef<HTMLDivElement>(null);
  useDocumentTitle(t('auth.forgot.title'));

  // Move focus to the confirmation so screen-reader users hear it and the (now gone) form does not strand focus.
  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    const parsed = passwordResetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(email.trim() === '' ? t('errors.fields.required') : (fieldErrorMessage(parsed.error.issues[0]?.message, i18n) ?? null));
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
          <div className="stack" ref={sentRef} tabIndex={-1} role="status">
            <Notice tone="success" title={t('auth.forgot.sentTo')}>
              {t('auth.forgot.sent')}
              <br />
              <small>{t('auth.forgot.emailNotConfigured')}</small>
            </Notice>
            <Button
              variant="ghost"
              onClick={() => {
                setSent(false);
              }}
            >
              {t('auth.forgot.useOther')}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="stack">
            <TextField
              label={t('auth.fields.email')}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="send"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              error={error}
              required
              dir="ltr"
            />
            <Button type="submit" variant="primary" block loading={pending}>
              {t('auth.forgot.submit')}
            </Button>
          </form>
        )}
        <p className="auth-alt">
          <Link to="/login" className="link link-block">
            {t('auth.forgot.backToLogin')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
