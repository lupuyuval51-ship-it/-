import { useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { LIMITS } from '@shared/constants';
import { bodyWeightSchema, type BodyWeightInput } from '@shared/schemas/progress';
import type { BodyWeightLogResponse } from '@shared/types';
import type { ZodIssue } from 'zod';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthProvider';
import { Button, NumberField, TextField, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';
import { today } from '../../lib/dates';
import { errorMessage, fieldErrorMessage } from '../../lib/errors';
import { invalidateAfterBodyWeight, progressApi } from './api';

type Field = 'date' | 'weightKg' | 'note';

/** Log (or update) the body weight for a date. Weights are typed in the user's units and stored in kg. */
export function BodyWeightForm({ onSaved, autoFocus }: { onSaved?(res: BodyWeightLogResponse): void; autoFocus?: boolean }) {
  const i18n = useI18n();
  const { t } = i18n;
  const { user } = useAuth();
  const units = useUnits();
  const toast = useToast();
  const queryClient = useQueryClient();
  const maxDate = today(user?.timezone);
  const [date, setDate] = useState(maxDate);
  const [weight, setWeight] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const rangeMessage = t('progress.bodyWeight.weightRange', {
    min: units.formatWeight(LIMITS.weightKgMin),
    max: units.formatWeight(LIMITS.weightKgMax),
  });
  const messageFor = (field: Field, issue: Pick<ZodIssue, 'code' | 'message'>): string => {
    if (field === 'weightKg') return issue.code === 'invalid_type' ? t('errors.fields.required') : rangeMessage;
    if (issue.code === 'invalid_type') return t('errors.fields.required');
    return fieldErrorMessage(issue.message, i18n) ?? t('errors.fields.invalid');
  };

  const mutation = useIdempotentMutation((input: BodyWeightInput, key: string) => progressApi.logBodyWeight(input, key), {
    onSuccess: async (res) => {
      toast.success(res.rewards.xpAwarded > 0 ? t('progress.bodyWeight.savedXp', { xp: res.rewards.xpAwarded }) : t('progress.bodyWeight.saved'));
      await invalidateAfterBodyWeight(queryClient);
      onSaved?.(res);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'future_date') setErrors({ date: errorMessage(err, i18n, 'progress') });
      toast.error(errorMessage(err, i18n, 'progress'));
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    const kg = units.fromDisplay(weight);
    const parsed = bodyWeightSchema.safeParse({ date, weightKg: kg == null ? undefined : Math.round(kg * 100) / 100, note });
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field;
        next[field] ??= messageFor(field, issue);
      }
      setErrors(next);
      return;
    }
    if (parsed.data.date > maxDate) {
      setErrors({ date: t('progress.errors.future_date') });
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <form className="bw-form" onSubmit={submit} noValidate>
      <div className="bw-form-fields">
        <TextField
          label={t('progress.bodyWeight.date')}
          type="date"
          name="date"
          value={date}
          max={maxDate}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          required
        />
        <NumberField
          label={t('progress.bodyWeight.weight')}
          name="weight"
          value={weight}
          onChange={setWeight}
          step={0.1}
          min={units.toDisplay(LIMITS.weightKgMin) ?? undefined}
          max={units.toDisplay(LIMITS.weightKgMax) ?? undefined}
          unit={units.weightUnit}
          error={errors.weightKg}
          autoFocus={autoFocus}
          required
        />
      </div>
      <TextField label={t('progress.bodyWeight.note')} name="note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} error={errors.note} />
      <p className="field-hint">{t('progress.bodyWeight.hint')}</p>
      <Button type="submit" variant="primary" icon="check" loading={mutation.isPending}>
        {t('progress.bodyWeight.save')}
      </Button>
    </form>
  );
}
