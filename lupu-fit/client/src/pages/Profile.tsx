import type { NutritionNote } from '@lupu-fit/shared';
import type { ProfileInput } from '@lupu-fit/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { api } from '../api/client.ts';
import { qk, useProfile, type ProfileResponse } from '../app/session.ts';
import { AccountPanel } from '../components/profile/AccountPanel.tsx';
import { LocalAiCard } from '../components/profile/LocalAiCard.tsx';
import { LanguagePanel } from '../components/profile/LanguagePanel.tsx';
import { BackupPanel } from '../components/profile/BackupPanel.tsx';
import { OutboxPanel } from '../components/profile/OutboxPanel.tsx';
import { BodyGoalsFields, PreferenceFields, validateProfile } from '../components/profile/ProfileForm.tsx';
import { VideoPanel } from '../components/profile/VideoPanel.tsx';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { setTheme } from '../lib/theme.ts';
import { Banner, Button, Card, EmptyState, ErrorState, errorMessage } from '../ui/kit.tsx';
import { IconChevron } from '../ui/icons.tsx';
import { PageHeader, SkeletonList } from '../ui/patterns.tsx';
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

  if (q.isPending) return <SkeletonList rows={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  if (!q.data || !form) return <EmptyState title={t('profile.needOnboarding')} action={<Link className="btn" to="/onboarding">{t('profile.redo')}</Link>} />;
  const tg = q.data.targets;
  const clamped = notes && notes.requested !== undefined && notes.requested !== notes.effective;
  const dirty = JSON.stringify(form) !== JSON.stringify(q.data.profile);
  const name = form.displayName?.trim();

  return (
    <form className="stack profile-page" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
      <PageHeader title={t('profile.title')} subtitle={name || undefined} />

      {clamped ? <Banner tone="warn"><span data-testid="clamp-note">{t('profile.clamped', { asked: fmt.num(notes.requested!), got: fmt.num(notes.effective) })}</span></Banner> : null}
      {notes && notes.notes.length > 0 ? <Banner>{notes.notes.map((n) => t(`profile.note.${n}`)).join(' ')}</Banner> : null}

      <section className="card hero-card pf-targets" aria-label={t('profile.targets')}>
        <h2 className="section-title">{t('profile.targets')}</h2>
        <div className="pf-kcal"><span className="num-hero" data-testid="target-kcal">{fmt.num(tg.kcal)}</span><span className="muted small"> {t('unit.kcal')} / {t('profile.nu.day')}</span></div>
        <div className="grid-3 pf-macros">
          <div className="kpi"><span className="label">{t('nutrition.nu.protein')}</span><span className="num-lg">{fmt.num(tg.proteinG)}<small className="muted small"> {t('unit.g')}</small></span></div>
          <div className="kpi"><span className="label">{t('nutrition.nu.carbs')}</span><span className="num-lg">{fmt.num(tg.carbsG)}<small className="muted small"> {t('unit.g')}</small></span></div>
          <div className="kpi"><span className="label">{t('nutrition.nu.fat')}</span><span className="num-lg">{fmt.num(tg.fatG)}<small className="muted small"> {t('unit.g')}</small></span></div>
        </div>
        <div className="row-wrap small muted pf-meta"><span>{t('profile.bmr')}: <span className="num">{fmt.num(tg.bmr)}</span></span><span>{t('profile.tdee')}: <span className="num">{fmt.num(tg.tdee)}</span></span></div>
        <span className="small muted">{t('profile.targetsNote')}</span>
      </section>

      <Card className="stack pf-section">
        <h2 className="section-title">{t('profile.nu.body')}</h2>
        <BodyGoalsFields value={form} onChange={setForm} errors={errors} />
        <Link className="list-link pf-redo" to="/onboarding"><span className="grow"><strong>{t('profile.redo')}</strong><br /><span className="small muted">{t('profile.nu.redoHint')}</span></span><IconChevron className="chev" /></Link>
      </Card>

      <Card className="stack pf-section">
        <h2 className="section-title">{t('profile.ml.title')}</h2>
        {/* Custom (machine-translated) languages keep the server-side profile language at 'en' so generated plans/menus stay valid. */}
        <LanguagePanel onBuiltIn={(l) => { setLang(l); persistPref({ language: l }); }} onCustomActivated={() => persistPref({ language: 'en' })} />
      </Card>

      <Card className="stack pf-section">
        <h2 className="section-title">{t('profile.nu.prefs')}</h2>
        <PreferenceFields value={form} onChange={setForm} errors={errors}
          onTheme={(th) => { setTheme(th); persistPref({ theme: th }); }} />
      </Card>

      <div className={dirty ? 'sticky-cta' : undefined}><Button type="submit" variant="primary" block disabled={put.isPending || !dirty}>{put.isPending ? t('profile.saving') : dirty ? t('action.save') : t('profile.nu.saved')}</Button></div>

      <Card className="stack pf-section"><h2 className="section-title">{t('localai.title')}</h2><LocalAiCard /></Card>
      <Card className="stack pf-section"><h2 className="section-title">{t('profile.nu.storage')}</h2><VideoPanel /><OutboxPanel /></Card>
      <Card className="stack pf-section"><h2 className="section-title">{t('profile.backup.title')}</h2><BackupPanel /></Card>
      <Card className="stack pf-section"><h2 className="section-title">{t('profile.account.title')}</h2><AccountPanel /></Card>
      <p className="small muted">{t('disclaimer.health')}</p>
    </form>
  );
}
