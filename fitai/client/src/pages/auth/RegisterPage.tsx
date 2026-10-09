import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { registerSchema } from '@shared/schemas/auth';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Card, Notice, PasswordField, TextField } from '../../components/ui';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { browserTimeZone } from '../../lib/dates';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';

export default function RegisterPage() {
  const i18n = useI18n();
  const { t, locale } = i18n;
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  useDocumentTitle(t('auth.register.title'));

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    const parsed = registerSchema.safeParse({ ...form, locale, timezone: browserTimeZone() });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= fieldErrorMessage(issue.message, i18n) ?? '';
      setErrors(errs);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await register(parsed.data);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'validation_error') {
        const fe = err.fieldErrors;
        setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, fieldErrorMessage(v, i18n) ?? ''])));
      }
      setFormError(errorMessage(err, i18n));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h1 className="auth-title">{t('auth.register.title')}</h1>
        <p className="muted">{t('auth.register.subtitle')}</p>
        {formError && <Notice tone="danger">{formError}</Notice>}
        <form onSubmit={onSubmit} noValidate className="stack">
          <TextField label={t('auth.fields.displayName')} name="displayName" autoComplete="nickname" value={form.displayName} onChange={set('displayName')} error={errors.displayName} required maxLength={60} />
          <TextField label={t('auth.fields.email')} type="email" name="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} required dir="ltr" />
          <PasswordField
            label={t('auth.fields.password')}
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint={t('auth.fields.passwordHint')}
            required
            dir="ltr"
          />
          <p className="field-hint">{t('auth.register.ageNote')}</p>
          <Button type="submit" variant="primary" block loading={pending}>
            {t('auth.register.submit')}
          </Button>
          <p className="field-hint">{t('auth.register.terms')}</p>
        </form>
        <p className="auth-alt">
          {t('auth.register.haveAccount')}{' '}
          <Link to="/login" className="link">
            {t('auth.register.login')}
          </Link>
        </p>
      </Card>
    </div>
  );
}
