import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { loginSchema } from '@shared/schemas/auth';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Card, Notice, PasswordField, TextField } from '../../components/ui';
import { loginErrorMessage } from '../../features/auth/authErrors';
import { useFocusFirstInvalid } from '../../features/auth/focus';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { fieldErrorMessage } from '../../lib/errors';

export default function LoginPage() {
  const i18n = useI18n();
  const { t } = i18n;
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(() => (location.state as { email?: string } | null)?.email ?? '');
  const prefilled = useRef(email !== '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { ref: formRef, requestFocus } = useFocusFirstInvalid<HTMLFormElement>();
  useDocumentTitle(t('auth.login.submit'));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= fieldErrorMessage(issue.message, i18n) ?? '';
      setErrors(errs);
      requestFocus();
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const user = await login(parsed.data);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(user.onboardingCompleted ? from ?? '/' : '/onboarding', { replace: true });
    } catch (err) {
      const wrongCredentials = err instanceof ApiError && err.code === 'invalid_credentials';
      setFormError(err instanceof ApiError ? loginErrorMessage(err, i18n) : t('errors.generic'));
      // Wrong password: keep what was typed and put the cursor back on the password, selected for retyping.
      if (wrongCredentials) {
        const input = formRef.current?.querySelector<HTMLInputElement>('input[name="password"]');
        input?.focus();
        input?.select();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1 className="auth-title">{t('auth.login.title')}</h1>
        <p className="muted">{t('auth.login.subtitle')}</p>
        {formError && <Notice tone="danger">{formError}</Notice>}
        <form ref={formRef} onSubmit={onSubmit} noValidate className="stack">
          <TextField
            label={t('auth.fields.email')}
            type="email"
            autoComplete="email"
            name="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((errs) => ({ ...errs, email: '' }));
            }}
            autoFocus={!prefilled.current}
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            error={errors.email}
            required
            dir="ltr"
          />
          <PasswordField
            label={t('auth.fields.password')}
            autoComplete="current-password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((errs) => ({ ...errs, password: '' }));
            }}
            autoFocus={prefilled.current}
            enterKeyHint="go"
            error={errors.password}
            required
            dir="ltr"
          />
          <div className="row-between">
            <Link to="/forgot-password" className="link link-block">
              {t('auth.login.forgot')}
            </Link>
          </div>
          <Button type="submit" variant="primary" block loading={pending}>
            {t('auth.login.submit')}
          </Button>
        </form>
        <p className="auth-alt">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="link link-block">
            {t('auth.login.register')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
