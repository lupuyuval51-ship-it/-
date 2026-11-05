import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';
import { ROADMAP_PHASES, TASK_PRIORITIES, TASK_STATUSES } from '@domain/plan';
import { Button, ChoiceList, InlineNotice, Screen, SegmentedControl, Text, TextField } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { fieldMessage, useFieldError } from '@/lib/forms';
import { spacing } from '@/theme/tokens';
import type { MilestoneRow, RoadmapPhase, TaskPriority, TaskStatus } from '../types';
import { addDays, isISODate, todayISO } from '../dates';
import { sortMilestones } from '../logic';
import { DateField } from './DateField';

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 2000;

export const taskFormSchema = z.object({
  title: z
    .string()
    .refine((v) => v.trim().length > 0, { message: fieldMessage('errors.field.required') })
    .refine((v) => v.trim().length <= TITLE_MAX, { message: fieldMessage('errors.field.tooLong', { max: TITLE_MAX }) }),
  description: z.string().refine((v) => v.trim().length <= DESCRIPTION_MAX, {
    message: fieldMessage('errors.field.tooLong', { max: DESCRIPTION_MAX }),
  }),
  phase: z.enum(ROADMAP_PHASES).nullable(),
  milestoneId: z.string().nullable(),
  priority: z.enum(TASK_PRIORITIES),
  status: z.enum(TASK_STATUSES),
  dueDate: z
    .string()
    .nullable()
    .refine((v) => v === null || isISODate(v), { message: fieldMessage('errors.invalidRequest') }),
});

export interface TaskFormValues {
  title: string;
  description: string;
  phase: RoadmapPhase | null;
  milestoneId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
}

type PhaseChoice = RoadmapPhase | 'none';
const PHASE_CHOICES: readonly PhaseChoice[] = [...ROADMAP_PHASES, 'none'];
const NO_MILESTONE = '__none__';

export interface TaskFormProps {
  mode: 'create' | 'edit';
  defaultValues: TaskFormValues;
  milestones: readonly MilestoneRow[];
  submitLabel: string;
  submitting: boolean;
  /** Disables saving (offline). */
  disabled?: boolean;
  /** Translated error from the last submit. */
  submitError?: string | null;
  /** Resolve to keep the form state as saved; throw to keep the edits. */
  onSubmit: (values: TaskFormValues) => Promise<void>;
  /** Content above the fields (e.g. provenance). */
  header?: ReactNode;
  /** Content below the fields (dependencies, delete). */
  children?: ReactNode;
}

/** Task editor used by /roadmap/task/new and /roadmap/task/[id]. Save lives in the footer. */
export function TaskForm({ mode, defaultValues, milestones, submitLabel, submitting, disabled = false, submitError, onSubmit, header, children }: TaskFormProps) {
  const t = useT();
  const fieldError = useFieldError();
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues });

  const phase = useWatch({ control, name: 'phase' });
  const milestoneId = useWatch({ control, name: 'milestoneId' });

  const milestoneOptions = useMemo(() => {
    const inPhase = sortMilestones(milestones.filter((m) => m.phase === phase || m.id === milestoneId));
    return [
      { value: NO_MILESTONE, label: t('roadmap.task.noMilestone') },
      ...inPhase.map((m) => ({ value: m.id, label: m.title, description: m.phase !== phase ? t(`roadmap.phase.${m.phase}`) : undefined })),
    ];
  }, [milestones, phase, milestoneId, t]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      if (mode === 'edit') reset(values);
    } catch {
      // The caller surfaces the error (submitError); keep the user's edits.
    }
  });

  const reschedule = (next: string) => setValue('dueDate', next, { shouldDirty: true, shouldValidate: true });

  return (
    <Screen
      edges={['bottom']}
      footer={
        <Button
          label={submitLabel}
          fullWidth
          loading={submitting}
          disabled={disabled || (mode === 'edit' && !isDirty)}
          onPress={() => void submit()}
          testID="task-form-submit"
        />
      }
    >
      {header}
      {submitError ? <InlineNotice tone="error" message={submitError} /> : null}

      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField
            label={t('roadmap.task.fields.title')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(errors.title)}
            maxLength={TITLE_MAX}
            autoFocus={mode === 'create' && !defaultValues.title}
            returnKeyType="done"
            testID="task-form-title"
          />
        )}
      />

      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <View style={styles.group}>
            <Text variant="callout" weight={500}>
              {t('roadmap.task.fields.status')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('roadmap.task.fields.status')}
              options={TASK_STATUSES.map((s) => ({ value: s, label: t(`roadmap.task.status.${s}`) }))}
              value={field.value}
              onChange={field.onChange}
              testID="task-form-status"
            />
          </View>
        )}
      />

      <View style={styles.group}>
        <Controller
          control={control}
          name="dueDate"
          render={({ field }) => (
            <DateField label={t('roadmap.task.fields.dueDate')} value={field.value} onChange={field.onChange} error={fieldError(errors.dueDate)} testID="task-form-due" />
          )}
        />
        <View style={styles.chips} accessibilityLabel={t('roadmap.task.reschedule.label')}>
          <Button variant="secondary" size="compact" label={t('roadmap.task.reschedule.today')} onPress={() => reschedule(todayISO())} />
          <Button variant="secondary" size="compact" label={t('roadmap.task.reschedule.tomorrow')} onPress={() => reschedule(addDays(todayISO(), 1))} />
          <Button
            variant="secondary"
            size="compact"
            label={t('roadmap.task.reschedule.plusWeek')}
            onPress={() => {
              const current = getValues('dueDate');
              reschedule(addDays(current && isISODate(current) ? current : todayISO(), 7));
            }}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <View style={styles.group}>
            <Text variant="callout" weight={500}>
              {t('roadmap.task.fields.priority')}
            </Text>
            <SegmentedControl
              accessibilityLabel={t('roadmap.task.fields.priority')}
              options={TASK_PRIORITIES.map((p) => ({ value: p, label: t(`roadmap.task.priority.${p}`) }))}
              value={field.value}
              onChange={field.onChange}
              testID="task-form-priority"
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="phase"
        render={({ field }) => (
          <View style={styles.group}>
            <Text variant="callout" weight={500}>
              {t('roadmap.task.fields.phase')}
            </Text>
            <SegmentedControl<PhaseChoice>
              accessibilityLabel={t('roadmap.task.fields.phase')}
              options={PHASE_CHOICES.map((p) => ({
                value: p,
                label: t(`roadmap.phaseShort.${p}`),
                accessibilityLabel: p === 'none' ? t('roadmap.phaseNone') : t(`roadmap.phase.${p}`),
              }))}
              value={field.value ?? 'none'}
              onChange={(v) => field.onChange(v === 'none' ? null : v)}
              testID="task-form-phase"
            />
          </View>
        )}
      />

      {milestoneOptions.length > 1 ? (
        <Controller
          control={control}
          name="milestoneId"
          render={({ field }) => (
            <View style={styles.group}>
              <Text variant="callout" weight={500}>
                {t('roadmap.task.fields.milestone')}
              </Text>
              <ChoiceList
                accessibilityLabel={t('roadmap.task.fields.milestone')}
                options={milestoneOptions}
                value={field.value ?? NO_MILESTONE}
                onChange={(v) => field.onChange(v === NO_MILESTONE ? null : v)}
              />
            </View>
          )}
        />
      ) : null}

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label={t('roadmap.task.fields.description')}
            hint={t('roadmap.task.fields.descriptionHint')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(errors.description)}
            maxLength={DESCRIPTION_MAX}
            multiline
            testID="task-form-description"
          />
        )}
      />

      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing[2] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
});
