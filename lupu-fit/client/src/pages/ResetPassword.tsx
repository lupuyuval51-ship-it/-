import { useMutation } from '@tanstack/react-query';
import { ResetPasswordBodySchema } from '@lupu-fit/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { api } from '../api/client.ts';
import { FailureBanner, PasswordField, describeFailure, useCountdown, validateForm, type FieldErrors, type ServerFailure } from '../components/onboarding/AuthParts.tsx';
import { useT } from '../i18n/index.tsx';
import { Banner, Button, LinkButton } from '../ui/kit.tsx';
import '../styles/auth.css';

export default function ResetPassword(): ReactNode {
  const t = useT(); const [params] = useSearchParams(); const token = params.get('token') ?? '';
  const [password, setPassword] = useState(''); const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<ServerFailure | null>(null); const [done, setDone] = useState(false); const [badToken, setBadToken] = useState(false);
  const cd = useCountdown();

  const reset = useMutation({
    mutationFn: (body: { token: string; password: string }) => api.post('/api/auth/reset-password', body),
    onSuccess: () => setDone(true),
    onError: (e) => {
      const f = describeFailure(e, t);
      if (f.kind === 'form' && f.message === t('auth.err.tokenInvalid')) { setBadToken(true); return; }
      setFailure(f);
      if (f.kind === 'rate' && f.seconds) cd.start(Math.ceil(f.seconds));
    },
  });

  const submit = (ev: FormEvent) => {
    ev.preventDefault(); setFailure(null);
    const r = validateForm(ResetPasswordBodySchema, { token, password }, t);
    setErrors(r.errors ?? {});
    if (r.data) reset.mutate(r.data);
  };

  if (done) {
    return (
      <div className="stack-lg auth">
        <h1>{t('auth.reset.title')}</h1>
        <Banner tone="ok"><span role="status">{t('auth.reset.done')}</span></Banner>
        <LinkButton to="/login" variant="primary" block>{t('auth.reset.toLogin')}</LinkButton>
      </div>
    );
  }
  if (badToken || errors['token'] || token.length < 16) {
    return (
      <div className="stack-lg auth">
        <h1>{t('auth.reset.title')}</h1>
        <Banner tone="danger">{t('auth.err.tokenInvalid')}</Banner>
        <Link to="/forgot-password" className="btn btn-block">{t('auth.reset.requestNew')}</Link>
        <div className="auth-links"><Link to="/login">{t('auth.backToLogin')}</Link></div>
      </div>
    );
  }
  return (
    <div className="stack-lg auth">
      <div className="stack-sm"><h1>{t('auth.reset.title')}</h1><p className="muted">{t('auth.reset.intro')}</p></div>
      <form className="stack" onSubmit={submit} noValidate>
        <FailureBanner failure={failure} left={cd.left} />
        <PasswordField label={t('auth.reset.newPassword')} value={password} onChange={setPassword} autoComplete="new-password" error={errors['password']} hint={t('auth.passwordHint')} />
        <Button type="submit" variant="primary" block disabled={reset.isPending || cd.left > 0}>{t('auth.reset.submit')}</Button>
      </form>
      <div className="auth-links"><Link to="/login">{t('auth.backToLogin')}</Link></div>
    </div>
  );
}
