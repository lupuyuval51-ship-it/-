import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { UNITS, type Units } from '@shared/constants';
import type { ProfileDTO } from '@shared/types';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Card, ErrorState, LinkButton, LoadingState, Notice, ProgressBar, Segmented, useToast } from '../../components/ui';
import { applyProfileChange, saveOnboarding, updateSettings, useProfile } from '../../features/profile/api';
import {
  DEFAULT_DRAFT,
  EMPTY_ABILITY,
  ONBOARDING_DRAFT_KEY,
  ONBOARDING_STEPS,
  draftFromProfile,
  firstInvalidField,
  stepOfField,
  validateOnboarding,
  validateStep,
  type FieldIssues,
  type ProfileDraft,
} from '../../features/profile/draft';
import {
  AboutFields,
  AbilityFields,
  ExperienceField,
  GoalField,
  LifestyleFields,
  NutritionFields,
  PreferenceFields,
  TrainingFields,
} from '../../features/profile/fields';
import { focusField, localizeIssues, serverFieldErrors, type FieldErrors } from '../../features/profile/validation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { storage } from '../../lib/storage';
import { ReviewStep } from './ReviewStep';
import '../../styles/profile.css';

interface StoredDraft {
  v: 1;
  userId: string;
  savedAt: string;
  step: number;
  draft: ProfileDraft;
  weeklyGoalTouched: boolean;
}

const REVIEW_STEP = ONBOARDING_STEPS.length - 1;

/** A saved draft for this user that is newer than the stored profile, or null. */
function restoreDraft(userId: string, profile: ProfileDTO): StoredDraft | null {
  const stored = storage.get<StoredDraft>(ONBOARDING_DRAFT_KEY);
  if (!stored || stored.v !== 1 || stored.userId !== userId || !stored.draft || typeof stored.draft !== 'object') return null;
  if (profile.updatedAt && Date.parse(profile.updatedAt) > Date.parse(stored.savedAt)) return null;
  return {
    ...stored,
    step: Math.min(Math.max(0, Math.trunc(Number(stored.step) || 0)), REVIEW_STEP),
    draft: { ...DEFAULT_DRAFT, ...stored.draft, ability: { ...EMPTY_ABILITY, ...stored.draft.ability } },
    weeklyGoalTouched: Boolean(stored.weeklyGoalTouched),
  };
}

/** Starting point without a draft: the stored answers (re-run) or the defaults (new user). */
function freshState(profile: ProfileDTO) {
  return {
    step: 0,
    draft: draftFromProfile(profile),
    weeklyGoalTouched: profile.weeklyWorkoutGoal != null && profile.daysPerWeek != null && profile.weeklyWorkoutGoal !== profile.daysPerWeek,
  };
}

const issuesFromErrors = (errors: FieldErrors): FieldIssues => Object.fromEntries(Object.keys(errors).map((k) => [k, { code: 'invalid', message: '' }]));

export default function OnboardingPage() {
  const { t } = useI18n();
  const profile = useProfile();
  useDocumentTitle(t('onboarding.title'));
  if (profile.isPending) return <LoadingState />;
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  return <OnboardingWizard profile={profile.data} />;
}

function OnboardingWizard({ profile }: { profile: ProfileDTO }) {
  const i18n = useI18n();
  const { t } = i18n;
  const { user, setUser, refresh, logout } = useAuth();
  const { imperial } = useUnits();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Fixed for the lifetime of the page (the user flips to "onboarded" while submitting).
  const [redo] = useState(() => Boolean(user?.onboardingCompleted));

  const [initial] = useState(() => {
    const restored = user ? restoreDraft(user.id, profile) : null;
    return restored ? { ...restored, restored: true } : { ...freshState(profile), restored: false };
  });
  const [step, setStep] = useState(initial.step);
  const [draft, setDraft] = useState<ProfileDraft>(initial.draft);
  const [weeklyGoalTouched, setWeeklyGoalTouched] = useState(initial.weeklyGoalTouched);
  const [showRestored, setShowRestored] = useState(initial.restored);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [returnToReview, setReturnToReview] = useState(false);
  const [pendingFocus, setPendingFocus] = useState<string | null>(null);
  // Only persist once the user has actually answered or moved (no empty drafts).
  const changed = useRef(initial.restored);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstRender = useRef(true);

  // Persist the draft so a refresh (or coming back later) resumes where the user left off.
  useEffect(() => {
    if (!changed.current || !user) return;
    const stored: StoredDraft = { v: 1, userId: user.id, savedAt: new Date().toISOString(), step, draft, weeklyGoalTouched };
    storage.set(ONBOARDING_DRAFT_KEY, stored);
  }, [step, draft, weeklyGoalTouched, user]);

  // Announce the new step to screen readers by moving focus to its heading.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  useEffect(() => {
    if (!pendingFocus) return;
    focusField(pendingFocus, formRef.current ?? document);
    setPendingFocus(null);
  }, [pendingFocus]);

  const update = (patch: Partial<ProfileDraft>) => {
    changed.current = true;
    setDraft((d) => ({ ...d, ...patch }));
    const keys = Object.keys(patch);
    setErrors((errs) => {
      const remaining = Object.entries(errs).filter(([path]) => !keys.includes(path.split('.')[0] ?? ''));
      return remaining.length === Object.keys(errs).length ? errs : Object.fromEntries(remaining);
    });
  };

  const goTo = (index: number, opts: { fromReview?: boolean } = {}) => {
    changed.current = true;
    setErrors({});
    setSubmitError(null);
    setReturnToReview(Boolean(opts.fromReview));
    setStep(index);
  };

  const showIssues = (stepIndex: number, fieldErrors: FieldErrors) => {
    setErrors(fieldErrors);
    const fields = ONBOARDING_STEPS[stepIndex]?.fields ?? [];
    setPendingFocus(firstInvalidField(fields, issuesFromErrors(fieldErrors)));
  };

  const unitsMutation = useMutation({
    mutationFn: (units: Units) => updateSettings({ units }),
    onSuccess: (res) => setUser(res.user),
    onError: () => toast.error(t('onboarding.units.saveFailed')),
  });

  const submit = useIdempotentMutation((input: Parameters<typeof saveOnboarding>[0], key: string) => saveOnboarding(input, key));

  const finish = async () => {
    const result = validateOnboarding(draft);
    if (!result.ok) {
      setReturnToReview(true);
      setStep(result.step);
      showIssues(result.step, localizeIssues(result.issues, i18n, imperial));
      return;
    }
    setSubmitError(null);
    try {
      const res = await submit.mutateAsync(result.data);
      storage.remove(ONBOARDING_DRAFT_KEY);
      changed.current = false;
      setUser(res.user);
      await applyProfileChange(queryClient, res.profile);
      await refresh();
      navigate('/', { replace: true });
      toast.show(t('onboarding.submitted'), 'success', { label: t('onboarding.createPlan'), onClick: () => navigate('/workouts') });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'validation_error') {
        const fieldErrors = serverFieldErrors(err.details, i18n);
        const target = stepOfField(Object.keys(fieldErrors)[0] ?? '');
        setReturnToReview(true);
        setStep(target);
        showIssues(target, fieldErrors);
        return;
      }
      setSubmitError(errorMessage(err, i18n, 'onboarding'));
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (submit.isPending) return;
    if (step === REVIEW_STEP) {
      void finish();
      return;
    }
    const issues = validateStep(step, draft);
    if (Object.keys(issues).length > 0) {
      showIssues(step, localizeIssues(issues, i18n, imperial));
      return;
    }
    goTo(returnToReview ? REVIEW_STEP : step + 1);
  };

  const startOver = () => {
    const fresh = freshState(profile);
    storage.remove(ONBOARDING_DRAFT_KEY);
    changed.current = false;
    setDraft(fresh.draft);
    setWeeklyGoalTouched(fresh.weeklyGoalTouched);
    setShowRestored(false);
    setErrors({});
    setSubmitError(null);
    setReturnToReview(false);
    setStep(0);
  };

  const current = ONBOARDING_STEPS[step] ?? ONBOARDING_STEPS[0];
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="onboarding">
      <header className="onboarding-header">
        <div>
          <h1 className="page-title">{redo ? t('onboarding.redoTitle') : t('onboarding.title')}</h1>
          <p className="page-subtitle">{redo ? t('onboarding.redoSubtitle') : t('onboarding.subtitle')}</p>
        </div>
        {redo ? (
          <LinkButton to="/profile" variant="ghost" size="sm" icon="chevronLeft">
            {t('onboarding.actions.cancel')}
          </LinkButton>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            icon="logout"
            onClick={async () => {
              await logout().catch(() => undefined);
              navigate('/login', { replace: true });
            }}
          >
            {t('onboarding.actions.logout')}
          </Button>
        )}
      </header>

      {showRestored && (
        <Notice tone="info" title={t('onboarding.restored.title')}>
          <div className="row-between">
            <span>{t('onboarding.restored.body')}</span>
            <Button size="sm" variant="ghost" icon="refresh" onClick={startOver}>
              {t('onboarding.restored.startOver')}
            </Button>
          </div>
        </Notice>
      )}

      <div className="onboarding-progress">
        <p className="small muted" aria-live="polite">
          {t('onboarding.stepOf', { current: step + 1, total: ONBOARDING_STEPS.length })}
        </p>
        <ProgressBar value={step + 1} max={ONBOARDING_STEPS.length} label={t('onboarding.progressLabel')} />
        <ol className="onboarding-steps">
          {ONBOARDING_STEPS.map((s, i) => (
            <li key={s.id} aria-current={i === step ? 'step' : undefined} className={i === step ? 'current' : i < step ? 'done' : undefined}>
              {i < step ? (
                <button type="button" className="link" onClick={() => goTo(i)}>
                  {t(`onboarding.steps.${s.id}.title`)}
                </button>
              ) : (
                <span>{t(`onboarding.steps.${s.id}.title`)}</span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <Card className="onboarding-card">
        <form ref={formRef} onSubmit={onSubmit} noValidate className="stack-lg">
          <div>
            <h2 className="onboarding-step-title" ref={headingRef} tabIndex={-1}>
              {t(`onboarding.steps.${current.id}.title`)}
            </h2>
            <p className="muted">{t(`onboarding.steps.${current.id}.subtitle`)}</p>
          </div>

          {hasErrors && <Notice tone="danger">{t('onboarding.errors.fixErrors')}</Notice>}

          {current.id === 'about' && (
            <div className="stack">
              <Segmented
                label={t('onboarding.units.label')}
                size="sm"
                value={user?.units ?? 'metric'}
                onChange={(u) => {
                  if (u !== user?.units && !unitsMutation.isPending) unitsMutation.mutate(u);
                }}
                options={UNITS.map((u) => ({ value: u, label: t(`enums.units.${u}`) }))}
              />
              <AboutFields values={draft} onChange={update} errors={errors} />
              <Notice tone="info" icon="info" title={t('onboarding.notices.whyAskedTitle')}>
                {t('onboarding.notices.whyAsked')}
              </Notice>
            </div>
          )}
          {current.id === 'experience' && (
            <div className="stack-lg">
              <ExperienceField values={draft} onChange={update} errors={errors} />
              <AbilityFields values={draft} onChange={update} errors={errors} />
            </div>
          )}
          {current.id === 'goal' && <GoalField values={draft} onChange={update} errors={errors} age={draft.ageYears} />}
          {current.id === 'training' && (
            <TrainingFields
              values={draft}
              onChange={update}
              errors={errors}
              weeklyGoalFollowsDays={!weeklyGoalTouched}
              onWeeklyGoalTouched={() => setWeeklyGoalTouched(true)}
            />
          )}
          {current.id === 'preferences' && <PreferenceFields values={draft} onChange={update} errors={errors} />}
          {current.id === 'nutrition' && (
            <div className="stack-lg">
              <NutritionFields values={draft} onChange={update} errors={errors} />
              <LifestyleFields values={draft} onChange={update} errors={errors} />
            </div>
          )}
          {current.id === 'review' && <ReviewStep draft={draft} onEdit={(i) => goTo(i, { fromReview: true })} />}

          {submitError && <Notice tone="danger">{submitError}</Notice>}

          <div className="onboarding-actions">
            <Button icon="chevronLeft" onClick={() => goTo(step - 1)} disabled={step === 0 || submit.isPending}>
              {t('onboarding.actions.back')}
            </Button>
            {step === REVIEW_STEP ? (
              <Button type="submit" variant="primary" icon="check" loading={submit.isPending}>
                {t('onboarding.actions.finish')}
              </Button>
            ) : (
              <Button type="submit" variant="primary" iconEnd="chevronRight">
                {returnToReview ? t('onboarding.actions.backToReview') : t('onboarding.actions.next')}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
