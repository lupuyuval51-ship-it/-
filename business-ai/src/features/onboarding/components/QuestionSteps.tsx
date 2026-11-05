import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { Controller, useForm, useWatch, type DefaultValues, type FieldError, type UseFormReturn } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import type { z } from 'zod';
import {
  EXPERIENCE_LEVELS,
  LAUNCH_TIMELINES,
  PRIMARY_GOALS,
  WEEKLY_HOURS,
  type OnboardingAnswers,
  type OnboardingKey,
  type OnboardingValue,
} from '@domain/onboarding';
import { ChoiceList, Text, TextField } from '@/components/ui';
import { useLocale, useT, type TFunction } from '@/i18n/I18nProvider';
import { hasTranslation } from '@/i18n/translate';
import { spacing } from '@/theme/tokens';
import { draftDiffers, fieldMax, initialFields, stepSchemas, type FieldDefaults, type StepFields } from '../forms';
import { answerValue, budgetCurrencyOptions, countryName, isSkippable, suggestCurrency } from '../logic';
import { getDraft, useOnboardingDraftStore, type DraftFields } from '../store';
import { CountryPicker } from './CountryPicker';
import { CurrencyField } from './CurrencyField';
import { StepLayout } from './StepLayout';

export type SavePhase = 'continue' | 'skip' | null;

/** Everything a question step needs from the onboarding screen. */
export interface StepContext {
  /** Draft scope (business id, or the "new business" scope before step 1 is saved). */
  scope: string;
  answers: OnboardingAnswers;
  defaults: FieldDefaults;
  pending: SavePhase;
  error: string | null;
  /** Informational line for this step (e.g. "Picking up where you left off"). */
  notice: string | null;
  /** Whether a restored draft may be announced on this step (first step shown after launch). */
  announceRestoredDraft: boolean;
  offline: boolean;
  onBack?: () => void;
  backLabel?: string;
  onSave: <K extends OnboardingKey>(key: K, value: OnboardingValue<K> | null, phase: Exclude<SavePhase, null>) => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Shared form plumbing                                                */
/* ------------------------------------------------------------------ */

function errorText(t: TFunction, error: FieldError | undefined, field: string): string | undefined {
  const message = error?.message;
  if (!message) return undefined;
  if (!hasTranslation(message)) return t('errors.invalidRequest');
  const max = fieldMax(field);
  return t(message, max ? { max } : undefined);
}

interface StepForm<K extends OnboardingKey> {
  form: UseFormReturn<StepFields<K>, unknown, OnboardingValue<K>>;
  submit: () => void;
  skip: (() => void) | undefined;
  restored: boolean;
}

/**
 * react-hook-form + zod for one step, seeded from draft → saved answer → defaults, with the
 * values mirrored (debounced) into the persisted draft so an app close mid-step loses nothing.
 */
function useStepForm<K extends OnboardingKey>(key: K, ctx: StepContext): StepForm<K> {
  const setDraft = useOnboardingDraftStore((s) => s.setDraft);
  const [initial] = useState(() => {
    const draft = getDraft(ctx.scope, key)?.fields;
    const saved = answerValue(ctx.answers, key);
    return { values: initialFields(key, saved, draft, ctx.defaults), restored: draftDiffers(key, saved, draft, ctx.defaults) };
  });
  const form = useForm<StepFields<K>, unknown, OnboardingValue<K>>({
    defaultValues: initial.values as DefaultValues<StepFields<K>>,
    resolver: zodResolver(stepSchemas[key] as unknown as z.ZodType<OnboardingValue<K>, StepFields<K>>),
  });

  const pendingDraft = useRef<DraftFields | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scope = ctx.scope;

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pendingDraft.current) setDraft(scope, key, pendingDraft.current);
    pendingDraft.current = null;
  }, [scope, key, setDraft]);

  const { subscribe } = form;
  useEffect(() => {
    const unsubscribe = subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        pendingDraft.current = { ...values } as DraftFields;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, 300);
      },
    });
    return () => {
      unsubscribe();
      flush(); // keep what was typed when leaving the step without saving (Back)
    };
  }, [subscribe, flush]);

  const { onSave } = ctx;
  const submit = () => {
    flush();
    void form.handleSubmit((value) => onSave(key, value, 'continue'))();
  };
  const skip = isSkippable(key)
    ? () => {
        flush();
        void onSave(key, null, 'skip');
      }
    : undefined;

  return { form, submit, skip, restored: initial.restored && ctx.announceRestoredDraft };
}

function useLayoutProps(step: OnboardingKey, ctx: StepContext, f: Pick<StepForm<OnboardingKey>, 'submit' | 'skip' | 'restored'>) {
  const t = useT();
  const notice = ctx.offline ? t('onboarding.errors.offline') : f.restored ? t('onboarding.draftRestored') : ctx.notice;
  return {
    step,
    onPrimary: f.submit,
    primaryLoading: ctx.pending === 'continue',
    onSkip: f.skip,
    skipLoading: ctx.pending === 'skip',
    onBack: ctx.onBack,
    backLabel: ctx.backLabel,
    actionsDisabled: ctx.offline,
    error: ctx.error,
    notice,
    noticeTone: ctx.offline ? ('warning' as const) : ('info' as const),
    testID: `onboarding-step-${step}`,
  };
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function IdeaStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const f = useStepForm('business_idea', ctx);
  const layout = useLayoutProps('business_idea', ctx, f);
  const [emptyAtStart] = useState(() => !f.form.getValues('idea'));
  return (
    <StepLayout {...layout} title={t('onboarding.business_idea.title')} why={t('onboarding.business_idea.why')}>
      <Controller
        control={f.form.control}
        name="idea"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('onboarding.business_idea.ideaLabel')}
            placeholder={t('onboarding.business_idea.ideaPlaceholder')}
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={4000}
            autoFocus={emptyAtStart}
            error={errorText(t, fieldState.error, 'idea')}
            testID="onboarding-idea"
          />
        )}
      />
      <Controller
        control={f.form.control}
        name="name"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('onboarding.business_idea.nameLabel')}
            hint={t('onboarding.business_idea.nameHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={120}
            returnKeyType="done"
            onSubmitEditing={f.submit}
            error={errorText(t, fieldState.error, 'name')}
            testID="onboarding-name"
          />
        )}
      />
    </StepLayout>
  );
}

function CountryStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const { locale } = useLocale();
  const f = useStepForm('country', ctx);
  const layout = useLayoutProps('country', ctx, f);
  const code = useWatch({ control: f.form.control, name: 'code' });
  const currency = suggestCurrency(code) ?? ctx.defaults.currency;
  return (
    <StepLayout {...layout} title={t('onboarding.country.title')} why={t('onboarding.country.why')}>
      {code ? (
        <View style={styles.selection} accessibilityLiveRegion="polite">
          <Text variant="bodyStrong">{t('onboarding.country.selected', { country: countryName(code, locale) ?? code })}</Text>
          <Text variant="caption" tone="secondary">
            {t('onboarding.country.currencyNote', { currency })}
          </Text>
        </View>
      ) : null}
      <Controller
        control={f.form.control}
        name="code"
        render={({ field, fieldState }) => (
          <CountryPicker value={field.value} onChange={field.onChange} error={errorText(t, fieldState.error, 'code')} testID="onboarding-country" />
        )}
      />
    </StepLayout>
  );
}

function BudgetStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const f = useStepForm('starting_budget', ctx);
  const layout = useLayoutProps('starting_budget', ctx, f);
  const currency = useWatch({ control: f.form.control, name: 'currency' });
  return (
    <StepLayout {...layout} title={t('onboarding.starting_budget.title')} why={t('onboarding.starting_budget.why')}>
      <Controller
        control={f.form.control}
        name="amount"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            mode="money"
            currency={currency}
            label={t('onboarding.starting_budget.amountLabel')}
            hint={t('onboarding.starting_budget.amountHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            returnKeyType="done"
            onSubmitEditing={f.submit}
            error={errorText(t, fieldState.error, 'amount')}
            testID="onboarding-budget-amount"
          />
        )}
      />
      <Controller
        control={f.form.control}
        name="currency"
        render={({ field }) => (
          <CurrencyField
            label={t('onboarding.starting_budget.currencyLabel')}
            sheetTitle={t('onboarding.starting_budget.currencySheetTitle')}
            value={field.value}
            options={budgetCurrencyOptions(ctx.defaults.currency, field.value)}
            onChange={field.onChange}
            testID="onboarding-budget-currency"
          />
        )}
      />
    </StepLayout>
  );
}

function ExperienceStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const f = useStepForm('experience', ctx);
  const layout = useLayoutProps('experience', ctx, f);
  return (
    <StepLayout {...layout} title={t('onboarding.experience.title')} why={t('onboarding.experience.why')}>
      <Controller
        control={f.form.control}
        name="level"
        render={({ field, fieldState }) => (
          <ChoiceList
            accessibilityLabel={t('onboarding.experience.title')}
            value={field.value || null}
            onChange={field.onChange}
            error={errorText(t, fieldState.error, 'level')}
            options={EXPERIENCE_LEVELS.map((level) => ({
              value: level,
              label: t(`onboarding.experience.options.${level}.label`),
              description: t(`onboarding.experience.options.${level}.description`),
            }))}
            testID="onboarding-experience"
          />
        )}
      />
      <Controller
        control={f.form.control}
        name="details"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('onboarding.experience.detailsLabel')}
            hint={t('onboarding.experience.detailsHint')}
            placeholder={t('onboarding.experience.detailsPlaceholder')}
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={1000}
            error={errorText(t, fieldState.error, 'details')}
            testID="onboarding-experience-details"
          />
        )}
      />
    </StepLayout>
  );
}

function CustomersStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const f = useStepForm('target_customers', ctx);
  const layout = useLayoutProps('target_customers', ctx, f);
  return (
    <StepLayout {...layout} title={t('onboarding.target_customers.title')} why={t('onboarding.target_customers.why')}>
      <Controller
        control={f.form.control}
        name="text"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('onboarding.target_customers.inputLabel')}
            hint={t('onboarding.target_customers.hint')}
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={2000}
            error={errorText(t, fieldState.error, 'text')}
            testID="onboarding-customers"
          />
        )}
      />
      <Text variant="callout" tone="secondary">
        {t('onboarding.target_customers.example')}
      </Text>
    </StepLayout>
  );
}

function GoalStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const f = useStepForm('primary_goal', ctx);
  const layout = useLayoutProps('primary_goal', ctx, f);
  return (
    <StepLayout {...layout} title={t('onboarding.primary_goal.title')} why={t('onboarding.primary_goal.why')}>
      <Controller
        control={f.form.control}
        name="goal"
        render={({ field, fieldState }) => (
          <ChoiceList
            accessibilityLabel={t('onboarding.primary_goal.title')}
            value={field.value || null}
            onChange={field.onChange}
            error={errorText(t, fieldState.error, 'goal')}
            options={PRIMARY_GOALS.map((goal) => ({
              value: goal,
              label: t(`onboarding.primary_goal.options.${goal}.label`),
              description: t(`onboarding.primary_goal.options.${goal}.description`),
            }))}
            testID="onboarding-goal"
          />
        )}
      />
      <Controller
        control={f.form.control}
        name="details"
        render={({ field, fieldState }) => (
          <TextField
            ref={field.ref}
            label={t('onboarding.primary_goal.detailsLabel')}
            hint={t('onboarding.primary_goal.detailsHint')}
            placeholder={t('onboarding.primary_goal.detailsPlaceholder')}
            multiline
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            maxLength={1000}
            error={errorText(t, fieldState.error, 'details')}
            testID="onboarding-goal-details"
          />
        )}
      />
    </StepLayout>
  );
}

function HoursStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const f = useStepForm('weekly_hours', ctx);
  const layout = useLayoutProps('weekly_hours', ctx, f);
  return (
    <StepLayout {...layout} title={t('onboarding.weekly_hours.title')} why={t('onboarding.weekly_hours.why')}>
      <Controller
        control={f.form.control}
        name="range"
        render={({ field, fieldState }) => (
          <ChoiceList
            accessibilityLabel={t('onboarding.weekly_hours.title')}
            value={field.value || null}
            onChange={field.onChange}
            error={errorText(t, fieldState.error, 'range')}
            options={WEEKLY_HOURS.map((range) => ({ value: range, label: t(`onboarding.weekly_hours.options.${range}`) }))}
            testID="onboarding-hours"
          />
        )}
      />
    </StepLayout>
  );
}

function TimelineStep({ ctx }: { ctx: StepContext }) {
  const t = useT();
  const f = useStepForm('launch_timeline', ctx);
  const layout = useLayoutProps('launch_timeline', ctx, f);
  return (
    <StepLayout {...layout} title={t('onboarding.launch_timeline.title')} why={t('onboarding.launch_timeline.why')}>
      <Controller
        control={f.form.control}
        name="timeline"
        render={({ field, fieldState }) => (
          <ChoiceList
            accessibilityLabel={t('onboarding.launch_timeline.title')}
            value={field.value || null}
            onChange={field.onChange}
            error={errorText(t, fieldState.error, 'timeline')}
            options={LAUNCH_TIMELINES.map((timeline) => ({ value: timeline, label: t(`onboarding.launch_timeline.options.${timeline}`) }))}
            testID="onboarding-timeline"
          />
        )}
      />
    </StepLayout>
  );
}

const STEP_COMPONENTS: Record<OnboardingKey, ComponentType<{ ctx: StepContext }>> = {
  business_idea: IdeaStep,
  country: CountryStep,
  starting_budget: BudgetStep,
  experience: ExperienceStep,
  target_customers: CustomersStep,
  primary_goal: GoalStep,
  weekly_hours: HoursStep,
  launch_timeline: TimelineStep,
};

/** Renders the step for `step`. Key it by step (and scope) so each step gets a fresh form. */
export function QuestionStep({ step, ctx }: { step: OnboardingKey; ctx: StepContext }) {
  const Component = STEP_COMPONENTS[step];
  return <Component ctx={ctx} />;
}

const styles = StyleSheet.create({
  selection: { gap: spacing[1] },
});
