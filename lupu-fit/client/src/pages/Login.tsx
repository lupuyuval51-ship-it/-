import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoginBodySchema } from '@lupu-fit/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { api } from '../api/client.ts';
import { qk } from '../app/session.ts';
import { FailureBanner, PasswordField, describeFailure, useCountdown, validateForm, type FieldErrors, type ServerFailure } from '../components/onboarding/AuthParts.tsx';
import { useT } from '../i18n/index.tsx';
import { Button, TextInput, Toggle } from '../ui/kit.tsx';
import '../styles/auth.css';

export default function Login(): ReactNode {
  const t = useT(); const qc = useQueryClient(); const nav = useNavigate(); const loc = useLocation();
  const from = (loc.state as { from?: unknown } | null)?.from;
  const [username, setUsername] = useState(() => { try { return localStorage.getItem('lf_username') ?? ''; } catch { return ''; } });
  const [password, setPassword] = useState(''); const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({}); const [failure, setFailure] = useState<ServerFailure | null>(null);
  const cd = useCountdown();

  const login = useMutation({
    mutationFn: (body: { username: string; password: string; remember: boolean }) => api.post('/api/auth/login', body),
    onSuccess: async (_d, vars) => {
      try { if (vars.remember) localStorage.setItem('lf_username', vars.username); else localStorage.removeItem('lf_username'); } catch { /* storage unavailable */ }
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
    const r = validateForm(LoginBodySchema, { username, password }, t);
    setErrors(r.errors ?? {});
    if (r.data) login.mutate({ username: r.data.username, password: r.data.password, remember });
  };

  return (
    <div className="stack-lg auth">
      <div className="stack-sm"><h1>{t('auth.login.title')}</h1><p className="muted">{t('auth.login.intro')}</p></div>
      <form className="stack auth-form" onSubmit={submit} noValidate>
        <FailureBanner failure={failure} left={cd.left} />
        <TextInput label={t('auth.username')} type="text" inputMode="text" autoComplete="username" autoCapitalize="off" autoCorrect="off" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} error={errors['username']} />
        <PasswordField label={t('auth.password')} value={password} onChange={setPassword} autoComplete="current-password" error={errors['password']} />
        <Toggle label={t('auth.login.remember')} checked={remember} onChange={setRemember} />
        <p className="small muted">{t('auth.login.rememberHint')}</p>
        <Button type="submit" variant="primary" block disabled={login.isPending || cd.left > 0}>{t('auth.login.submit')}</Button>
      </form>
      <div className="stack-sm auth-links">
        <span className="small muted">{t('auth.login.noRecovery')}</span>
        <span className="muted">{t('auth.login.noAccount')} <Link to="/register">{t('auth.login.toRegister')}</Link></span>
      </div>
    </div>
  );
}
