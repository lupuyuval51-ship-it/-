import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { registerSchema } from '@shared/schemas/auth';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Card, Notice, PasswordField, TextField } from '../../components/ui';
import { useFocusFirstInvalid } from '../../features/auth/focus';
import { PasswordStrength } from '../../features/auth/PasswordStrength';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useI18n } from '../../i18n';
import { browserTimeZone } from '../../lib/dates';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';

type Field = 'displayName' | 'email' | 'password';

export default function RegisterPage() {
  const i18n = useI18n();
  const { t, locale } = i18n;
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [pending, setPending] = useState(false);
  const strengthId = useId();
  const { ref: formRef, requestFocus } = useFocusFirstInvalid<HTMLFormElement>();
  useDocumentTitle(t('auth.register.title'));

  const validateAll = () => {
    const parsed = registerSchema.safeParse({ ...form, locale, timezone: browserTimeZone() });
    if (parsed.success) return { data: parsed.data, errs: {} as Partial<Record<Field, string>> };
    const errs: Partial<Record<Field, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]) as Field;
      // An empty required field reads "Required"; otherwise the schema code gets a specific message.
      const empty = form[key] === undefined || form[key].trim() === '';
      errs[key] ??= empty ? t('errors.fields.required') : fieldErrorMessage(issue.message, i18n);
    }
    return { data: null, errs };
  };

  const set = (k: Field) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    // The error clears as soon as the user starts fixing that field.
    if (errors[k]) setErrors((errs) => ({ ...errs, [k]: undefined }));
    if (k === 'email') setEmailTaken(false);
  };

  /** Inline validation when leaving a field that has content (never nag an untouched field). */
  const onBlur = (k: Field) => () => {
    if (form[k].trim() === '') return;
    const msg = validateAll().errs[k];
    if (msg) setErrors((errs) => ({ ...errs, [k]: msg }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setFormError(null);
    setEmailTaken(false);
    const { data, errs } = validateAll();
    if (!data) {
      setErrors(errs);
      requestFocus();
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await register(data);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_taken') {
        setErrors({ email: t('errors.email_taken') });
        setEmailTaken(true);
      } else if (err instanceof ApiError && err.code === 'validation_error') {
        setErrors(Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, fieldErrorMessage(v, i18n) ?? ''])));
        setFormError(errorMessage(err, i18n));
      } else {
        setFormError(errorMessage(err, i18n));
      }
      requestFocus();
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
        <form ref={formRef} onSubmit={onSubmit} noValidate className="stack">
          <TextField
            label={t('auth.fields.displayName')}
            name="displayName"
            autoComplete="nickname"
            autoFocus
            enterKeyHint="next"
            value={form.displayName}
            onChange={set('displayName')}
            onBlur={onBlur('displayName')}
            error={errors.displayName}
            required
            maxLength={60}
          />
          <TextField
            label={t('auth.fields.email')}
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            value={form.email}
            onChange={set('email')}
            onBlur={onBlur('email')}
            error={errors.email}
            required
            dir="ltr"
          />
          {emailTaken && (
            <p className="field-hint auth-inline-link">
              <Link to="/login" state={{ email: form.email }} className="link">
                {t('auth.register.emailTakenLogin')}
              </Link>
            </p>
          )}
          <PasswordField
            label={t('auth.fields.password')}
            name="password"
            autoComplete="new-password"
            enterKeyHint="go"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            required
            dir="ltr"
          />
          <PasswordStrength password={form.password} id={strengthId} />
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
