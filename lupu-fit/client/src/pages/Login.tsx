import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoginBodySchema } from '@lupu-fit/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { api } from '../api/client.ts';
import { qk } from '../app/session.ts';
import { FailureBanner, PasswordField, describeFailure, useCountdown, validateForm, type FieldErrors, type ServerFailure } from '../components/onboarding/AuthParts.tsx';
import { useT } from '../i18n/index.tsx';
import { Button, TextInput } from '../ui/kit.tsx';
import '../styles/auth.css';

export default function Login(): ReactNode {
  const t = useT(); const qc = useQueryClient(); const nav = useNavigate(); const loc = useLocation();
  const from = (loc.state as { from?: unknown } | null)?.from;
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({}); const [failure, setFailure] = useState<ServerFailure | null>(null);
  const cd = useCountdown();

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) => api.post('/api/auth/login', body),
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: qk.me }), qc.invalidateQueries({ queryKey: qk.profile })]);
      nav(typeof from === 'string' && from.startsWith('/') ? from : '/', { replace: true });
    },
    onError: (e) => {
      const f = describeFailure(e, t); setFailure(f);
      if (f.kind === 'rate' && f.seconds) cd.start(Math.ceil(f.seconds));
      if (f.kind === 'field') setErrors({ [f.field]: f.message });
    },
  });

  const submit = (ev: FormEvent) => {
    ev.preventDefault(); setFailure(null);
    const r = validateForm(LoginBodySchema, { email, password }, t);
    setErrors(r.errors ?? {});
    if (r.data) login.mutate(r.data);
  };

  return (
    <div className="stack-lg auth">
      <div className="stack-sm"><h1>{t('auth.login.title')}</h1><p className="muted">{t('auth.login.intro')}</p></div>
      <form className="stack" onSubmit={submit} noValidate>
        <FailureBanner failure={failure} left={cd.left} />
        <TextInput label={t('auth.email')} type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} error={errors['email']} />
        <PasswordField label={t('auth.password')} value={password} onChange={setPassword} autoComplete="current-password" error={errors['password']} />
        <Button type="submit" variant="primary" block disabled={login.isPending || cd.left > 0}>{t('auth.login.submit')}</Button>
      </form>
      <div className="stack-sm auth-links">
        <Link to="/forgot-password">{t('auth.login.forgot')}</Link>
        <span className="muted">{t('auth.login.noAccount')} <Link to="/register">{t('auth.login.toRegister')}</Link></span>
      </div>
    </div>
  );
}
