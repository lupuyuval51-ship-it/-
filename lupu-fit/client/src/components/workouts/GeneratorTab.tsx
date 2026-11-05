import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LIMITS, type GeneratedPlan, type WorkoutMode } from '@lupu-fit/shared';
import { api } from '../../api/client.ts';
import { useProfile } from '../../app/session.ts';
import { EXERCISES, exName } from '../../data/content.ts';
import { useLang } from '../../i18n/index.tsx';
import { localDateStr, mergeAvoidIds, parsePreferences } from '../../lib/workoutCompose.ts';
import { Banner, Button, Card, Chip, ErrorState, NumberStepper, TextArea, TextInput, Toggle, Tag, errorMessage } from '../../ui/kit.tsx';
import { Disclosure, SkeletonList, StickyAction } from '../../ui/patterns.tsx';
import { ChoiceCards } from './ChoiceCards.tsx';
import { IconBody, IconKettle } from './wkIcons.tsx';
import { useToast } from '../../ui/toast.tsx';
import { PLANS_KEY, usePlans } from './plansApi.ts';
import { PlanNotes, PlanPreview } from './PlanPreview.tsx';

export function GeneratorTab(): ReactNode {
  const { t, lang } = useLang();
  const prof = useProfile();
  if (prof.isLoading) return <SkeletonList rows={3} />;
  if (prof.isError) return <ErrorState error={prof.error} onRetry={() => void prof.refetch()} />;
  if (!prof.data) return <Banner tone="warn">{t('workouts.ready.profileMissing')}</Banner>;
  const p = prof.data.profile;
  return <GeneratorForm key={lang} defaults={{ days: p.daysPerWeek, minutes: p.sessionMinutes, mode: p.place === 'gym' || p.equipment.length > 0 ? 'weights' : 'bodyweight' }} />;
}

function GeneratorForm({ defaults }: { defaults: { days: number; minutes: number; mode: WorkoutMode } }): ReactNode {
  const { t, lang } = useLang();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [days, setDays] = useState<number>(defaults.days);
  const [minutes, setMinutes] = useState<number>(defaults.minutes);
  const [mode, setMode] = useState<WorkoutMode>(defaults.mode);
  const [avoid, setAvoid] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [prefs, setPrefs] = useState('');
  const [seed, setSeed] = useState(1);
  const [generated, setGenerated] = useState<{ plan: GeneratedPlan; key: string; seed: number } | null>(null);
  const [name, setName] = useState('');
  // A first plan is activated by default so it reaches Home; with an active plan already, saving keeps that one unless switched on.
  const plans = usePlans();
  const hasActive = (plans.data ?? []).some((p) => p.active && !p.archived);
  const [activateChoice, setActivate] = useState<boolean | null>(null);
  const activate = activateChoice ?? (plans.isSuccess && !hasActive);

  const parsed = useMemo(() => parsePreferences(prefs, EXERCISES), [prefs]);
  const merged = useMemo(() => mergeAvoidIds(avoid, parsed.avoidIds), [avoid, parsed.avoidIds]);
  const paramKey = JSON.stringify([days, minutes, mode, merged.ids]);
  const stale = generated !== null && generated.key !== paramKey;

  const matches = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    return EXERCISES.filter((e) => !avoid.includes(e.id) && (e.nameHe.toLowerCase().includes(s) || e.nameEn.toLowerCase().includes(s))).slice(0, 8);
  }, [query, avoid]);

  const gen = useMutation({
    mutationFn: async (s: number) => (await api.post<{ plan: GeneratedPlan }>('/api/plans/generate', { seed: s, daysPerWeek: days, sessionMinutes: minutes, mode, avoidIds: merged.ids })).plan,
    onSuccess: (plan, s) => { setGenerated({ plan, key: paramKey, seed: s }); setSeed(s); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const save = useMutation({
    mutationFn: async () => (await api.post<{ id: string }>('/api/plans', { name: name.trim() || t('workouts.gen.defaultName', { date: localDateStr() }), plan: generated!.plan, activate })).id,
    onSuccess: (id) => { void qc.invalidateQueries({ queryKey: PLANS_KEY }); toast(t('workouts.gen.saved'), 'ok'); nav(`/workouts/plans/${id}`); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });

  const busy = gen.isPending || save.isPending;
  const showSave = generated !== null && !stale;

  return (
    <div className="stack">
      <Card className="stack">
        <h2>{t('workouts.gen.params')}</h2>
        <div className="grid-2">
          <NumberStepper label={t('workouts.gen.days')} value={days} min={LIMITS.daysPerWeek.min} max={LIMITS.daysPerWeek.max} onChange={(v) => setDays(v ?? defaults.days)} />
          <NumberStepper label={t('workouts.gen.minutes')} suffix={t('unit.min')} value={minutes} min={LIMITS.sessionMinutes.min} max={LIMITS.sessionMinutes.max} step={5} onChange={(v) => setMinutes(v ?? defaults.minutes)} />
        </div>
        {days === 7 ? <Banner>{t('workouts.gen.daysNote7')}</Banner> : null}
        <div className="stack-sm">
          <span className="field-label">{t('workouts.gen.mode')}</span>
          <ChoiceCards cols={2} label={t('workouts.gen.mode')} value={mode} onPick={setMode} options={[
            { value: 'bodyweight', label: t('label.mode.bodyweight'), hint: t('workouts.ready.modeHint.bodyweight'), icon: <IconBody /> },
            { value: 'weights', label: t('label.mode.weights'), hint: t('workouts.ready.modeHint.weights'), icon: <IconKettle /> },
          ]} />
        </div>
        <Disclosure summary={t('workouts.gen.advanced')} open={avoid.length > 0 || prefs.length > 0}>
        <div className="stack-sm">
          <TextInput label={t('workouts.gen.avoidSearch')} type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query.trim() && matches.length === 0 ? <span className="small muted">{t('workouts.gen.noResults')}</span> : null}
          <div className="wk-search-results">
            {matches.map((e) => <Chip key={e.id} onClick={() => { setAvoid((a) => [...a, e.id]); setQuery(''); }}>{t('workouts.gen.avoidAdd', { name: exName(e, lang) })}</Chip>)}
          </div>
          <strong className="small">{t('workouts.gen.avoidTitle')}</strong>
          {avoid.length === 0 ? <span className="small muted">{t('workouts.gen.avoidNone')}</span> : (
            <div className="row-wrap">
              {avoid.map((id) => {
                const e = EXERCISES.find((x) => x.id === id);
                const nm = e ? exName(e, lang) : id;
                return <Chip key={id} pressed onClick={() => setAvoid((a) => a.filter((x) => x !== id))}>{nm}<span className="sr-only">{t('workouts.gen.avoidRemove', { name: nm })}</span></Chip>;
              })}
            </div>
          )}
        </div>
        <TextArea label={t('workouts.gen.prefs')} hint={t('workouts.gen.prefsHint')} placeholder={t('workouts.gen.prefsPlaceholder')} value={prefs} onChange={(e) => setPrefs(e.target.value)} rows={3} maxLength={400} />
        {parsed.rules.length || parsed.focus.length ? (
          <div className="stack-sm">
            <div className="row-wrap">
              {parsed.rules.map((r) => <Tag key={r}>{t(`workouts.gen.rule.${r}`)}</Tag>)}
              {parsed.focus.map((f) => <Tag key={f}>{t(`workouts.gen.focusNote.${f}`)}</Tag>)}
            </div>
            {parsed.focus.length ? <span className="small muted">{t('workouts.gen.focusNoteHint')}</span> : null}
            {merged.truncated ? <Banner tone="warn">{t('workouts.gen.truncated', { n: merged.ids.length })}</Banner> : null}
          </div>
        ) : null}
        </Disclosure>
      </Card>

      {generated ? (
        <section className="stack" aria-label={t('workouts.gen.previewTitle')}>
          <div className="row-between"><h2>{t('workouts.gen.previewTitle')}</h2><Tag>{t('workouts.gen.variant', { n: generated.seed })}</Tag></div>
          {generated.plan.days.length ? <PlanPreview plan={generated.plan} /> : <PlanNotes notes={generated.plan.notes} />}
        </section>
      ) : null}

      {generated ? (
        <Card className="stack">
          <TextInput label={t('workouts.gen.planName')} value={name} placeholder={t('workouts.gen.defaultName', { date: localDateStr() })} maxLength={120} onChange={(e) => setName(e.target.value)} />
          <Toggle label={t('workouts.gen.activateAfter')} checked={activate} onChange={setActivate} />
        </Card>
      ) : null}

      <StickyAction>
        <div className="wk-sticky-row">
          {showSave
            ? <Button variant="primary" disabled={busy} onClick={() => save.mutate()}>{t('workouts.gen.save')}</Button>
            : <Button variant="primary" disabled={busy} onClick={() => gen.mutate(generated ? seed : 1)}>{gen.isPending ? t('workouts.gen.generating') : t('workouts.gen.generate')}</Button>}
          {generated ? <Button disabled={busy} onClick={() => gen.mutate(seed + 1)}>{t('workouts.gen.regenerate')}</Button> : null}
        </div>
      </StickyAction>
    </div>
  );
}
