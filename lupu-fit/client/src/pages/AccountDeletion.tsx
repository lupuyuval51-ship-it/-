import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../api/client.ts';
import { useMe } from '../app/session.ts';
import { LegalTabs, supportEmail } from '../components/onboarding/LegalDoc.tsx';
import { IS_DEVICE } from '../env.ts';
import { useT } from '../i18n/index.tsx';
import { clearOnboardingDraft } from '../lib/onboardingDraft.ts';
import { Banner, Button, ErrorState, Loading, LinkButton, Sheet, TextInput } from '../ui/kit.tsx';
import '../styles/onboarding.css';

export default function AccountDeletion(): ReactNode {
  const t = useT(); const qc = useQueryClient(); const nav = useNavigate(); const me = useMe();
  const [open, setOpen] = useState(false); const [typed, setTyped] = useState('');
  const email = supportEmail();

  const del = useMutation({
    mutationFn: () => api.delete('/api/account', { confirm: 'DELETE' }),
    onSuccess: () => {
      qc.clear(); clearOnboardingDraft();
      setOpen(false);
      nav(IS_DEVICE ? '/welcome' : '/login', { replace: true });
    },
  });
  const close = () => { if (!del.isPending) { setOpen(false); setTyped(''); del.reset(); } };
  const submit = (ev: FormEvent) => { ev.preventDefault(); if (typed === 'DELETE') del.mutate(); };

  if (me.isPending) return <Loading />;
  const signedIn = !!me.data;
  return (
    <article className="stack-lg legal">
      <LegalTabs />
      <header className="stack-sm"><h1>{t('legal.deletion.title')}</h1><p>{t('legal.deletion.intro')}</p></header>
      <section className="stack-sm">
        <h2>{t('legal.deletion.pathH')}</h2>
        <p>{t('legal.deletion.path')}</p>
      </section>
      <section className="stack-sm">
        <h2>{t('legal.deletion.whatH')}</h2>
        <p>{t('legal.deletion.what')}</p>
        <ul><li>{t('legal.deletion.b1')}</li><li>{t('legal.deletion.b2')}</li><li>{t('legal.deletion.b3')}</li></ul>
        <p>{t('legal.deletion.immediate')}</p>
      </section>
      <section className="stack-sm">
        <h2>{t('legal.deletion.exportH')}</h2>
        <p>{t('legal.deletion.export')}</p>
      </section>
      {signedIn ? (
        <section className="stack-sm">
          <h2>{t('legal.deletion.nowH')}</h2>
          <Banner tone="warn">{t('legal.deletion.warn')}</Banner>
          <Button variant="danger" onClick={() => setOpen(true)}>{t('legal.deletion.open')}</Button>
        </section>
      ) : (
        <section className="stack-sm">
          <h2>{t('legal.deletion.nowH')}</h2>
          <p>{t('legal.deletion.signedOut')}</p>
          {IS_DEVICE ? null : <LinkButton to="/login" variant="primary">{t('legal.deletion.toLogin')}</LinkButton>}
          {email ? <p>{t('legal.contact.withEmail')} <a href={`mailto:${email}`}>{email}</a></p> : <p>{t('legal.contact.noEmail')}</p>}
        </section>
      )}
      <Sheet open={open} onClose={close} title={t('legal.deletion.sheetTitle')}>
        <form className="stack" onSubmit={submit}>
          <p>{t('legal.deletion.sheetBody')}</p>
          <TextInput label={t('legal.deletion.typeLabel')} hint={t('legal.deletion.typeHint')} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} dir="ltr" />
          {del.isError ? <ErrorState error={del.error} /> : null}
          <div className="row">
            <Button onClick={close} disabled={del.isPending}>{t('action.cancel')}</Button>
            <Button type="submit" variant="danger" disabled={typed !== 'DELETE' || del.isPending}>{t('legal.deletion.confirm')}</Button>
          </div>
        </form>
      </Sheet>
    </article>
  );
}
