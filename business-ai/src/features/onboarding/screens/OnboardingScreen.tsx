/**
 * Onboarding: 8 calm, skippable questions (only the idea is required) and a review step.
 *
 * - Step 1 Continue creates the business (name = working name or "העסק שלי"/"My business"),
 *   makes it active and saves the first answer. Every later Continue / Skip upserts its row.
 * - What is being typed is mirrored to a device draft (./store) and restored after an app close.
 * - Resume: an active business with `onboarding_completed_at = null` continues at the first
 *   question neither answered nor skipped. `?new=1` always starts a new (additional) business.
 * - Completion sets `onboarding_completed_at` and hands over to the Plan tab (`/plan?generate=1`),
 *   which starts generation. This screen never calls the AI.
 */
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler } from 'react-native';
import type { OnboardingKey, OnboardingValue } from '@domain/onboarding';
import { ErrorState, LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthProvider';
import { useActiveBusiness, useCreateBusiness, useUpdateBusiness, type Business, type BusinessPatch } from '@/features/business/api';
import { useEntitlement } from '@/features/settings/api';
import { useT } from '@/i18n/I18nProvider';
import { announce } from '@/lib/a11y';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { useCompleteOnboarding, useOnboardingResponses, useSaveOnboardingAnswer } from '../api';
import { LimitNotice } from '../components/LimitNotice';
import { QuestionStep, type SavePhase, type StepContext } from '../components/QuestionSteps';
import { ReviewStep } from '../components/ReviewStep';
import type { FieldDefaults } from '../forms';
import {
  answerStatus,
  answerValue,
  canCreateBusiness,
  firstUnansweredStep,
  nextStep,
  previousStep,
  resolveBusinessName,
  resolveStartMode,
  responsesToAnswers,
  REVIEW_STEP,
  suggestCurrency,
  type OnboardingStep,
  type StartMode,
} from '../logic';
import { newScope, useDraftHydrated, useOnboardingDraftStore } from '../store';

interface Session {
  /** The business being onboarded; null until step 1 creates it (fresh mode). */
  businessId: string | null;
  step: OnboardingStep;
  /** The step shown first in this session (restored-draft notice only appears there). */
  firstStep: OnboardingStep;
  resumed: boolean;
}

export default function OnboardingScreen() {
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ new?: string }>();
  const [isNew] = useState(() => params.new === '1'); // read once: setParams below must not reset the flow
  const { user } = useAuth();
  const online = useIsOnline();
  const draftsHydrated = useDraftHydrated();
  const clearDraft = useOnboardingDraftStore((s) => s.clearDraft);
  const clearScope = useOnboardingDraftStore((s) => s.clearScope);

  const active = useActiveBusiness();
  const entitlement = useEntitlement();
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const saveAnswer = useSaveOnboardingAnswer();
  const complete = useCompleteOnboarding();

  // Decide fresh vs resume once, as soon as the business list is known (state adjusted during
  // render — the decision must not change when this screen later creates / activates a business).
  const [mode, setMode] = useState<StartMode | null>(null);
  const listKnown = !active.isLoading && !(active.businesses.length === 0 && active.error);
  if (!mode && listKnown) setMode(resolveStartMode({ isNew, activeBusiness: active.business }));

  const [session, setSession] = useState<Session | null>(null);
  const businessId = session?.businessId ?? (mode?.kind === 'resume' ? mode.businessId : null);
  const responses = useOnboardingResponses(businessId);
  const answers = useMemo(() => responsesToAnswers(responses.data), [responses.data]);

  // Start the session once the drafts and (when resuming) the saved answers are loaded.
  if (!session && mode && draftsHydrated) {
    if (mode.kind === 'fresh') {
      setSession({ businessId: null, step: 'business_idea', firstStep: 'business_idea', resumed: false });
    } else if (responses.data) {
      const step = firstUnansweredStep(answers);
      setSession({ businessId: mode.businessId, step, firstStep: step, resumed: step !== 'business_idea' });
    }
  }

  const [returnToReview, setReturnToReview] = useState(false);
  const [pending, setPending] = useState<SavePhase>(null);
  const [error, setError] = useState<string | null>(null);
  /** Business count when the database refused a new business (`business_limit_reached`). */
  const [limitHitAt, setLimitHitAt] = useState<number | null>(null);

  const business: Business | null = useMemo(
    () => (businessId ? (active.businesses.find((b) => b.id === businessId) ?? null) : null),
    [active.businesses, businessId],
  );
  const scope = businessId ?? newScope(user?.id);
  const defaults: FieldDefaults = { countryCode: business?.country_code ?? null, currency: business?.currency ?? 'ILS' };

  // Business limit (fresh mode, before the business exists). Only trust a loaded entitlement;
  // the database enforces the limit anyway (`business_limit_reached`). Not evaluated once creation
  // has started: the new business is already in the list before this screen learns its id.
  const atLimit =
    !businessId &&
    (createBusiness.isIdle || createBusiness.isError) &&
    !entitlement.isLoading &&
    !entitlement.error &&
    !canCreateBusiness(active.businesses.length, entitlement.limits.maxBusinesses);
  const showLimit = !businessId && (atLimit || (limitHitAt !== null && active.businesses.length >= limitHitAt));

  const goTo = useCallback(
    (step: OnboardingStep) => {
      setError(null);
      setSession((s) => (s ? { ...s, step } : s));
    },
    [setSession],
  );

  const currentStep = session?.step ?? null;
  const stepTitleKey = currentStep && currentStep !== REVIEW_STEP ? (`onboarding.${currentStep}.title` as const) : null;
  useEffect(() => {
    if (currentStep) announce(currentStep === REVIEW_STEP ? t('onboarding.review.title') : t(stepTitleKey ?? 'onboarding.screenTitle'));
  }, [currentStep, stepTitleKey, t]);

  const back = useCallback((): boolean => {
    if (!session) return false;
    if (returnToReview && session.step !== REVIEW_STEP) {
      setReturnToReview(false);
      goTo(REVIEW_STEP);
      return true;
    }
    const prev = previousStep(session.step);
    if (!prev) return false;
    goTo(prev);
    return true;
  }, [session, returnToReview, goTo]);

  // Android back steps through the questions before leaving the screen.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', back);
      return () => sub.remove();
    }, [back]),
  );

  const failureMessage = (e: unknown, fallback: 'onboarding.errors.saveFailed' | 'onboarding.errors.completeFailed') => {
    const appError = toAppError(e);
    return appError.code === 'network' || appError.code === 'offline' || appError.code === 'session_expired'
      ? t(appError.messageKey)
      : t(fallback);
  };

  /** Ensures the business exists (step 1) and keeps its name / idea in sync with the answer. */
  const ensureBusiness = async (value: OnboardingValue<'business_idea'>): Promise<string> => {
    const defaultName = t('onboarding.defaultBusinessName');
    if (!businessId) {
      const created = await createBusiness.mutateAsync({
        name: resolveBusinessName({ workingName: value.name, defaultName }),
        idea: value.idea,
      });
      setSession((s) => (s ? { ...s, businessId: created.id } : s));
      if (isNew) router.setParams({ new: undefined }); // a reload now resumes this business
      return created.id;
    }
    const previous = answerValue(answers, 'business_idea');
    const name = resolveBusinessName({
      workingName: value.name,
      defaultName,
      currentName: business?.name,
      previousWorkingName: previous?.name,
    });
    const patch: BusinessPatch = {};
    if (name !== business?.name) patch.name = name;
    if (value.idea !== business?.idea) patch.idea = value.idea;
    if (Object.keys(patch).length) await updateBusiness.mutateAsync({ id: businessId, patch });
    return businessId;
  };

  const onSave: StepContext['onSave'] = async <K extends OnboardingKey>(key: K, value: OnboardingValue<K> | null, phase: Exclude<SavePhase, null>) => {
    if (pending) return;
    if (!online) {
      setError(t('onboarding.errors.offline'));
      return;
    }
    setPending(phase);
    setError(null);
    try {
      const id = key === 'business_idea' ? await ensureBusiness(value as OnboardingValue<'business_idea'>) : businessId;
      if (!id) {
        goTo('business_idea');
        return;
      }
      await saveAnswer.mutateAsync({ businessId: id, key, value });
      if (key === 'country' && value) {
        const code = (value as OnboardingValue<'country'>).code;
        const currency = suggestCurrency(code);
        const patch: BusinessPatch = {};
        if (business?.country_code !== code) patch.country_code = code;
        if (currency && business?.currency !== currency) patch.currency = currency;
        if (Object.keys(patch).length) await updateBusiness.mutateAsync({ id, patch });
      }
      clearDraft(id, key);
      if (key === 'business_idea') clearScope(newScope(user?.id));
      const next = returnToReview ? REVIEW_STEP : nextStep(key);
      if (next === REVIEW_STEP) setReturnToReview(false);
      goTo(next);
    } catch (e) {
      if (toAppError(e).code === 'business_limit_reached') setLimitHitAt(active.businesses.length);
      else setError(failureMessage(e, 'onboarding.errors.saveFailed'));
    } finally {
      setPending(null);
    }
  };

  const onCreatePlan = async () => {
    if (!businessId || answerStatus(answers, 'business_idea') !== 'answered') {
      goTo('business_idea');
      return;
    }
    if (!online) {
      setError(t('onboarding.errors.offline'));
      return;
    }
    setError(null);
    try {
      await complete.mutateAsync({ businessId });
      clearScope(businessId);
      router.replace('/plan?generate=1');
    } catch (e) {
      setError(failureMessage(e, 'onboarding.errors.completeFailed'));
    }
  };

  const header = <Stack.Screen options={{ title: t('onboarding.screenTitle') }} />;

  // --- Loading / error before the session starts --------------------------------------------
  if (!session) {
    const loadError = (!active.businesses.length && active.error) || (mode?.kind === 'resume' && !responses.data && responses.error);
    return (
      <>
        {header}
        <Screen>
          {loadError ? (
            <ErrorState
              error={loadError}
              title={t('onboarding.errors.loadFailed')}
              onRetry={() => {
                active.refetch();
                void responses.refetch();
              }}
              retrying={responses.isFetching}
            />
          ) : (
            <LoadingState variant="screen" accessibilityLabel={t('common.states.loading')} />
          )}
        </Screen>
      </>
    );
  }

  if (showLimit) {
    return (
      <>
        {header}
        <LimitNotice tier={entitlement.tier} maxBusinesses={entitlement.limits.maxBusinesses} />
      </>
    );
  }

  if (session.step === REVIEW_STEP) {
    return (
      <>
        {header}
        <ReviewStep
          answers={answers}
          onEdit={(key) => {
            setReturnToReview(true);
            goTo(key);
          }}
          onCreate={() => void onCreatePlan()}
          creating={complete.isPending}
          onBack={() => goTo(previousStep(REVIEW_STEP) ?? 'business_idea')}
          error={error}
          offline={!online}
        />
      </>
    );
  }

  const step = session.step;
  const ctx: StepContext = {
    scope,
    answers,
    defaults,
    pending,
    error,
    notice: session.resumed && step === session.firstStep ? t('onboarding.resumed') : null,
    announceRestoredDraft: step === session.firstStep,
    offline: !online,
    onBack:
      returnToReview || previousStep(step)
        ? () => void back()
        : isNew && router.canGoBack()
          ? () => router.back() // leave the "new business" flow from its first question
          : undefined,
    backLabel: returnToReview ? t('onboarding.actions.backToReview') : undefined,
    onSave,
  };

  return (
    <>
      {header}
      <QuestionStep key={step} step={step} ctx={ctx} />
    </>
  );
}
