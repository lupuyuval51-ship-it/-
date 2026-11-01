import type { NutritionNote } from '@lupu-fit/shared';
import type { ProfileInput } from '@lupu-fit/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client.ts';
import { qk, useProfile, type ProfileResponse } from '../app/session.ts';
import { AccountPanel } from '../components/profile/AccountPanel.tsx';
import { BackupPanel } from '../components/profile/BackupPanel.tsx';
import { OutboxPanel } from '../components/profile/OutboxPanel.tsx';
import { ProfileForm, validateProfile } from '../components/profile/ProfileForm.tsx';
import { VideoPanel } from '../components/profile/VideoPanel.tsx';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { setTheme } from '../lib/theme.ts';
import { Banner, Card, EmptyState, ErrorState, errorMessage, Loading } from '../ui/kit.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/profile.css';

export default function Profile(): ReactNode {
  const t = useT(); const { setLang } = useLang(); const toast = useToast(); const qc = useQueryClient();
  const q = useProfile();
  const [form, setForm] = useState<ProfileInput | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notes, setNotes] = useState<{ notes: NutritionNote[]; requested: number | undefined; effective: number } | null>(null);

  useEffect(() => { if (q.data) setForm((cur) => cur ?? q.data!.profile); }, [q.data]);

  const put = useMutation({
    mutationFn: (p: ProfileInput) => api.put<ProfileResponse>('/api/profile', p),
    onSuccess: (r, p) => { qc.setQueryData(qk.profile, r); void qc.invalidateQueries({ queryKey: ['food-log'] }); setForm(r.profile); setNotes({ notes: r.targets.notes, requested: p.customKcal, effective: r.targets.kcal }); },
  });

  const save = () => {
    if (!form) return;
    const v = validateProfile(form);
    if (!v.ok) { setErrors(v.paths); toast(t('state.invalid'), 'error'); return; }
    setErrors([]);
    put.mutate(v.data, { onSuccess: () => toast(t('profile.saved'), 'ok'), onError: (e) => toast(errorMessage(e, t), 'error') });
  };
  /** Language / theme apply instantly and are persisted to the profile right away. */
  const persistPref = (patch: Partial<ProfileInput>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    const base = q.data?.profile;
    if (base) api.put<ProfileResponse>('/api/profile', { ...base, ...patch }).then((r) => qc.setQueryData(qk.profile, r)).catch((e) => toast(errorMessage(e, t), 'error'));
  };

  if (q.isPending) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  if (!q.data || !form) return <EmptyState title={t('profile.needOnboarding')} action={<Link className="btn" to="/onboarding">{t('profile.redo')}</Link>} />;
  const tg = q.data.targets;
  const clamped = notes && notes.requested !== undefined && notes.requested !== notes.effective;

  return (
    <div className="stack profile-page">
      <div className="row-between">
        <h1>{t('profile.title')}</h1>
        <Link className="btn" to="/onboarding">{t('profile.redo')}</Link>
      </div>

      {clamped ? <Banner tone="warn"><span data-testid="clamp-note">{t('profile.clamped', { asked: fmt.num(notes.requested!), got: fmt.num(notes.effective) })}</span></Banner> : null}
      {notes && notes.notes.length > 0 ? <Banner>{notes.notes.map((n) => t(`profile.note.${n}`)).join(' ')}</Banner> : null}

      <Card className="stack">
        <h2 className="section-title">{t('profile.targets')}</h2>
        <div className="grid-3">
          <div className="kpi"><span className="label">{t('profile.bmr')}</span><span className="num-lg">{fmt.num(tg.bmr)}</span></div>
          <div className="kpi"><span className="label">{t('profile.tdee')}</span><span className="num-lg">{fmt.num(tg.tdee)}</span></div>
          <div className="kpi"><span className="label">{t('profile.dailyKcal')}</span><span className="num-lg">{fmt.num(tg.kcal)}</span></div>
          <div className="kpi"><span className="label">{t('nutrition.protein')}</span><span className="num-lg">{fmt.num(tg.proteinG)}</span></div>
          <div className="kpi"><span className="label">{t('nutrition.carbs')}</span><span className="num-lg">{fmt.num(tg.carbsG)}</span></div>
          <div className="kpi"><span className="label">{t('nutrition.fat')}</span><span className="num-lg">{fmt.num(tg.fatG)}</span></div>
        </div>
        <span className="small muted">{t('profile.targetsNote')}</span>
      </Card>

      <Card className="stack">
        <h2 className="section-title">{t('profile.details')}</h2>
        <ProfileForm value={form} onChange={setForm} errors={errors} saving={put.isPending} onSave={save}
          onLanguage={(l) => { setLang(l); persistPref({ language: l }); }}
          onTheme={(th) => { setTheme(th); persistPref({ theme: th }); }} />
      </Card>

      <Card className="stack"><h2 className="section-title">{t('profile.video.title')}</h2><VideoPanel /></Card>
      <Card className="stack"><h2 className="section-title">{t('outbox.title')}</h2><OutboxPanel /></Card>
      <Card className="stack"><h2 className="section-title">{t('profile.backup.title')}</h2><BackupPanel /></Card>
      <Card className="stack"><h2 className="section-title">{t('profile.account.title')}</h2><AccountPanel /></Card>
      <p className="small muted">{t('disclaimer.health')}</p>
    </div>
  );
}
