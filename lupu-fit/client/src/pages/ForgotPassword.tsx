import { useMutation } from '@tanstack/react-query';
import { ForgotPasswordBodySchema } from '@lupu-fit/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ApiRequestError, NetworkError, api } from '../api/client.ts';
import { FailureBanner, describeFailure, useCountdown, validateForm, type FieldErrors, type ServerFailure } from '../components/onboarding/AuthParts.tsx';
import { useT } from '../i18n/index.tsx';
import { Banner, Button, TextInput } from '../ui/kit.tsx';
import '../styles/auth.css';

export default function ForgotPassword(): ReactNode {
  const t = useT();
  const [email, setEmail] = useState(''); const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<ServerFailure | null>(null); const [sent, setSent] = useState(false);
  const cd = useCountdown();

  const forgot = useMutation({
    mutationFn: (body: { email: string }) => api.post('/api/auth/forgot-password', body),
    onSuccess: () => setSent(true),
    onError: (e) => {
      // Only connectivity and rate limiting are surfaced; every other outcome looks identical so the form can never reveal whether an e-mail exists.
      if (e instanceof ApiRequestError && e.status !== 429 && e.code !== 'too_many_attempts') { setSent(true); return; }
      if (!(e instanceof ApiRequestError) && !(e instanceof NetworkError)) { setSent(true); return; }
      const f = describeFailure(e, t); setFailure(f);
      if (f.kind === 'rate' && f.seconds) cd.start(Math.ceil(f.seconds));
    },
  });

  const submit = (ev: FormEvent) => {
    ev.preventDefault(); setFailure(null);
    const r = validateForm(ForgotPasswordBodySchema, { email }, t);
    setErrors(r.errors ?? {});
    if (r.data) forgot.mutate(r.data);
  };

  if (sent) {
    return (
      <div className="stack-lg auth">
        <h1>{t('auth.forgot.title')}</h1>
        <Banner tone="ok"><span role="status">{t('auth.forgot.sent')}</span></Banner>
        <div className="auth-links"><Link to="/login">{t('auth.backToLogin')}</Link></div>
      </div>
    );
  }
  return (
    <div className="stack-lg auth">
      <div className="stack-sm"><h1>{t('auth.forgot.title')}</h1><p className="muted">{t('auth.forgot.intro')}</p></div>
      <form className="stack" onSubmit={submit} noValidate>
        <FailureBanner failure={failure} left={cd.left} />
        <TextInput label={t('auth.email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} error={errors['email']} />
        <Button type="submit" variant="primary" block disabled={forgot.isPending || cd.left > 0}>{t('auth.forgot.submit')}</Button>
      </form>
      <div className="auth-links"><Link to="/login">{t('auth.backToLogin')}</Link></div>
    </div>
  );
}
