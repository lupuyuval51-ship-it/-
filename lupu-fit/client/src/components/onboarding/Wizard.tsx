import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProfileInput } from '@lupu-fit/shared';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../api/client.ts';
import { qk } from '../../app/session.ts';
import { useLang, useT } from '../../i18n/index.tsx';
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from '../../lib/onboardingDraft.ts';
import { getTheme } from '../../lib/theme.ts';
import { BrandMark } from '../../ui/BrandMark.tsx';
import { Banner, Button, ErrorState } from '../../ui/kit.tsx';
import { AboutStep, ExperienceStep, GoalStep, NutritionStep, PreferencesStep, ReviewStep, TrainingStep } from './Steps.tsx';
import { fmt } from '../../i18n/index.tsx';
import { STEP_IDS, defaultDraft, draftFromProfile, hasErrors, reviewNutrition, sanitizeDraft, stepErrors, toProfileInput, type DraftData, type StepId } from './model.ts';

/** Fields owned by each step; Skip resets exactly these back to the base values. */
const STEP_FIELDS: Record<StepId, (keyof DraftData)[]> = {
  about: ['displayName', 'sex', 'age', 'heightCm', 'weightKg'], experience: ['experience', 'injuries'], goal: ['goal'],
  training: ['place', 'equipment', 'daysPerWeek', 'sessionMinutes'], preferences: [], nutrition: ['activityLevel', 'diet', 'allergies', 'restrictions', 'customKcal'], review: [],
};

export function Wizard({ existing }: { existing: ProfileInput | null }): ReactNode {
  const t = useT(); const { lang } = useLang(); const qc = useQueryClient(); const nav = useNavigate();
  const base = useMemo(() => (existing ? draftFromProfile(existing) : defaultDraft(lang, getTheme())), [existing, lang]);
  const [{ step, data }, setState] = useState<{ step: number; data: DraftData }>(() => {
    const stored = loadOnboardingDraft();
    if (stored) return { step: Math.min(Math.max(0, Math.trunc(stored.step)), STEP_IDS.length - 1), data: sanitizeDraft(stored.data, base) };
    return { step: 0, data: base };
  });
  const [done, setDone] = useState(false);
  const id = STEP_IDS[step] as StepId;
  const finished = useRef(false); const first = useRef(true); const heading = useRef<HTMLHeadingElement>(null);

  // The interface language is the source of truth for the draft's language (top-bar switch or the preferences step).
  useEffect(() => { setState((s) => (s.data.language === lang ? s : { ...s, data: { ...s.data, language: lang } })); }, [lang]);

  useEffect(() => {
    if (finished.current) return;
    saveOnboardingDraft(step, data as unknown as Record<string, unknown>);
  }, [step, data]);
  useEffect(() => { if (first.current) { first.current = false; return; } heading.current?.focus(); }, [step]);

  const set = useCallback((patch: Partial<DraftData>) => setState((s) => ({ ...s, data: { ...s.data, ...patch } })), []);
  const go = (n: number) => setState((s) => ({ ...s, step: Math.min(STEP_IDS.length - 1, Math.max(0, n)) }));
  const errors = stepErrors(data, id);
  const targets = useMemo(() => reviewNutrition(data), [data]);

  const skip = () => setState((s) => {
    const reset: Partial<DraftData> = {};
    for (const f of STEP_FIELDS[id]) (reset as Record<string, unknown>)[f] = base[f];
    return { step: Math.min(STEP_IDS.length - 1, s.step + 1), data: { ...s.data, ...reset } };
  });
  const startOver = () => { finished.current = false; clearOnboardingDraft(); setState({ step: 0, data: { ...base, language: lang } }); };

  const save = useMutation({
    mutationFn: () => api.put('/api/profile', toProfileInput(data)),
    onSuccess: async () => {
      finished.current = true; clearOnboardingDraft();
      await Promise.all([qc.invalidateQueries({ queryKey: qk.profile }), qc.invalidateQueries({ queryKey: qk.me })]);
      clearOnboardingDraft();
      setDone(true);
    },
  });
  // A short, calm "plan ready" beat before landing on Home.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => nav('/', { replace: true }), 700);
    return () => clearTimeout(timer);
  }, [done, nav]);

  const isReview = id === 'review';
  if (done) {
    return (
      <div className="onb-done stack-lg center" role="status">
        <BrandMark size={96} animate />
        <div className="stack-sm"><h1>{t('onboarding.done.title')}</h1><p className="muted">{t('onboarding.done.lead')}</p></div>
        {targets ? <p><span className="num-hero">{fmt.num(targets.kcal)}</span> <span className="muted">{t('unit.kcal')} · {t('onboarding.review.perDay')}</span></p> : null}
      </div>
    );
  }
  const blocked = save.isPending || !targets || (['about', 'training', 'nutrition'] as const).some((x) => hasErrors(stepErrors(data, x)));
  return (
    <div className="onb" data-step={id}>
      <div className="onb-body stack-lg">
        <div className="stack-sm">
          <div className="row-between">
            <span className="small muted" aria-live="polite">{t('onboarding.stepLabel')} <span className="num">{step + 1}/{STEP_IDS.length}</span></span>
            <Button variant="ghost" size="sm" onClick={startOver}>{t('onboarding.startOver')}</Button>
          </div>
          <div className="step-dots onb-dots" role="progressbar" aria-label={t('onboarding.progress')} aria-valuemin={0} aria-valuemax={STEP_IDS.length} aria-valuenow={step + 1}>
            {STEP_IDS.map((sid, i) => <i key={sid} className={i < step ? 'done' : i === step ? 'now' : undefined} />)}
          </div>
        </div>
        <div className="stack-sm">
          <h1 ref={heading} tabIndex={-1}>{t(`onboarding.steps.${id}.title`)}</h1>
          <p className="muted">{t(`onboarding.steps.${id}.intro`)}</p>
        </div>
        {id === 'about' ? <AboutStep d={data} set={set} errors={errors} /> : null}
        {id === 'experience' ? <ExperienceStep d={data} set={set} errors={errors} /> : null}
        {id === 'goal' ? <GoalStep d={data} set={set} errors={errors} /> : null}
        {id === 'training' ? <TrainingStep d={data} set={set} errors={errors} /> : null}
        {id === 'preferences' ? <PreferencesStep d={data} set={set} errors={errors} /> : null}
        {id === 'nutrition' ? <NutritionStep d={data} set={set} errors={errors} kcalNow={targets?.kcal ?? null} /> : null}
        {isReview ? <ReviewStep d={data} targets={targets} onEdit={(sid) => go(STEP_IDS.indexOf(sid))} /> : null}
        {isReview && save.isError ? <ErrorState error={save.error} /> : null}
        {isReview && !targets ? <Banner tone="danger">{t('onboarding.review.fixFirst')}</Banner> : null}
      </div>
      <div className="onb-bar onb-nav">
        <div className="onb-bar-inner">
          {step > 0 ? <Button onClick={() => go(step - 1)}>{t('action.back')}</Button> : <span />}
          {isReview ? (
            <Button variant="primary" className="onb-primary" onClick={() => save.mutate()} disabled={blocked}>{t('onboarding.save')}</Button>
          ) : (
            <div className="row onb-bar-end">
              <Button variant="ghost" onClick={skip}>{t('action.skip')}</Button>
              <Button variant="primary" className="onb-primary" onClick={() => go(step + 1)} disabled={hasErrors(errors)}>{t('action.next')}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
