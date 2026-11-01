import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RegisterBodySchema } from '@lupu-fit/shared';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { api } from '../api/client.ts';
import { qk } from '../app/session.ts';
import { FailureBanner, PasswordField, describeFailure, useCountdown, validateForm, type FieldErrors, type ServerFailure } from '../components/onboarding/AuthParts.tsx';
import { useT } from '../i18n/index.tsx';
import { Button, TextInput } from '../ui/kit.tsx';
import '../styles/auth.css';

export default function Register(): ReactNode {
  const t = useT(); const qc = useQueryClient(); const nav = useNavigate();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({}); const [failure, setFailure] = useState<ServerFailure | null>(null);
  const cd = useCountdown();

  const register = useMutation({
    mutationFn: (body: { email: string; password: string }) => api.post('/api/auth/register', body),
    onSuccess: async () => {
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
    const r = validateForm(RegisterBodySchema, { email, password }, t);
    setErrors(r.errors ?? {});
    if (r.data) register.mutate(r.data);
  };

  return (
    <div className="stack-lg auth">
      <div className="stack-sm"><h1>{t('auth.register.title')}</h1><p className="muted">{t('auth.register.intro')}</p></div>
      <form className="stack auth-form" onSubmit={submit} noValidate>
        <FailureBanner failure={failure} left={cd.left} />
        <TextInput label={t('auth.email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} error={errors['email']} />
        <PasswordField label={t('auth.password')} value={password} onChange={setPassword} autoComplete="new-password" error={errors['password']} hint={t('auth.passwordHint')} />
        <p className="small muted">{t('auth.register.legalPrefix')} <Link to="/terms">{t('auth.register.terms')}</Link> {t('auth.register.and')} <Link to="/privacy">{t('auth.register.privacy')}</Link>.</p>
        <Button type="submit" variant="primary" block disabled={register.isPending || cd.left > 0}>{t('auth.register.submit')}</Button>
      </form>
      <div className="auth-links"><span className="muted">{t('auth.register.haveAccount')} <Link to="/login">{t('auth.register.toLogin')}</Link></span></div>
    </div>
  );
}
