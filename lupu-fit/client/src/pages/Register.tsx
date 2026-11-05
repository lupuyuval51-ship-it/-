import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RegisterBodySchema } from '@lupu-fit/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../api/client.ts';
import { qk } from '../app/session.ts';
import { FailureBanner, PasswordField, describeFailure, useCountdown, validateForm, type FieldErrors, type ServerFailure } from '../components/onboarding/AuthParts.tsx';
import { useT } from '../i18n/index.tsx';
import { Button, TextInput, Toggle } from '../ui/kit.tsx';
import '../styles/auth.css';

export default function Register(): ReactNode {
  const t = useT(); const qc = useQueryClient(); const nav = useNavigate();
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({}); const [failure, setFailure] = useState<ServerFailure | null>(null);
  const cd = useCountdown();

  const register = useMutation({
    mutationFn: (body: { username: string; password: string; remember: boolean }) => api.post('/api/auth/register', body),
    onSuccess: async (_d, vars) => {
      // Same promise as the hint shared with Login: the username is remembered only when "keep me signed in" is on.
      try { if (vars.remember) localStorage.setItem('lf_username', vars.username); else localStorage.removeItem('lf_username'); } catch { /* storage unavailable */ }
      await Promise.all([qc.invalidateQueries({ queryKey: qk.me }), qc.invalidateQueries({ queryKey: qk.profile })]);
      nav('/welcome', { replace: true });
    },
    onError: (e) => {
      const f = describeFailure(e, t); setFailure(f);
      if (f.kind === 'rate' && f.seconds) cd.start(Math.ceil(f.seconds));
      if (f.kind === 'field') setErrors({ [f.field]: f.message });
    },
  });

  const submit = (ev: FormEvent) => {
    ev.preventDefault(); setFailure(null);
    const r = validateForm(RegisterBodySchema, { username, password }, t);
    setErrors(r.errors ?? {});
    if (r.data) register.mutate({ username: r.data.username, password: r.data.password, remember });
  };

  return (
    <div className="stack-lg auth">
      <div className="stack-sm"><h1>{t('auth.register.title')}</h1><p className="muted">{t('auth.register.intro')}</p></div>
      <form className="stack auth-form" onSubmit={submit} noValidate>
        <FailureBanner failure={failure} left={cd.left} />
        <TextInput label={t('auth.username')} type="text" inputMode="text" autoComplete="username" autoCapitalize="off" autoCorrect="off" spellCheck={false} hint={t('auth.usernameHint')} value={username} onChange={(e) => setUsername(e.target.value)} error={errors['username']} />
        <PasswordField label={t('auth.register.choosePassword')} value={password} onChange={setPassword} autoComplete="new-password" error={errors['password']} hint={t('auth.passwordHint')} />
        <Toggle label={t('auth.login.remember')} checked={remember} onChange={setRemember} />
        <p className="small muted">{t('auth.login.rememberHint')}</p>
        <p className="small muted">{t('auth.register.legalPrefix')} <Link to="/terms">{t('auth.register.terms')}</Link> {t('auth.register.and')} <Link to="/privacy">{t('auth.register.privacy')}</Link>.</p>
        <Button type="submit" variant="primary" block disabled={register.isPending || cd.left > 0}>{t('auth.register.submit')}</Button>
      </form>
      <div className="auth-links"><span className="muted">{t('auth.register.haveAccount')} <Link to="/login">{t('auth.register.toLogin')}</Link></span></div>
    </div>
  );
}
