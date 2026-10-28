import { useState } from 'react';
import { useNavigate } from 'react-router';
import { addDays } from '@shared/dates';
import type { MealType } from '@shared/constants';
import { Button, Modal, TextField, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { copyLogs } from './api';
import { useMealLabel, useNutritionInvalidation, useUserToday } from './hooks';
import { maxLogDate } from './portion';

/** Default target for "copy to another day": the next day, or the previous one when the next is out of range. */
export function defaultCopyTarget(from: string, today: string): string {
  const next = addDays(from, 1);
  return next <= maxLogDate(today) ? next : addDays(from, -1);
}

/** Copies one meal (with any corrections) to another day, then offers a shortcut to that day. */
export function CopyMealModal({ date, mealType, onClose }: { date: string; mealType: MealType; onClose(): void }) {
  const i18n = useI18n();
  const { t } = i18n;
  const toast = useToast();
  const navigate = useNavigate();
  const invalidate = useNutritionInvalidation();
  const labels = useMealLabel();
  const today = useUserToday();
  const [target, setTarget] = useState(() => defaultCopyTarget(date, today));
  const [error, setError] = useState<string | null>(null);
  const mealName = t(`enums.mealType.${mealType}`);

  const copy = useIdempotentMutation((to: string, key: string) => copyLogs({ fromDate: date, toDate: to, mealType }, key), {
    onSuccess: (res, { vars: to }) => {
      invalidate(res.day);
      toast.show(t('nutrition.meals.copiedTo', { count: res.copied, meal: mealName, date: labels.date(to) }), 'success', {
        label: t('nutrition.meals.goToDay'),
        onClick: () => navigate(`/nutrition?date=${to}`),
      });
      onClose();
    },
    onError: (err) => setError(errorMessage(err, i18n, 'nutrition')),
  });

  const submit = () => {
    if (copy.isPending) return;
    if (!target || target > maxLogDate(today)) return setError(t('nutrition.date.futureLimit'));
    if (target === date) return setError(t('nutrition.errors.copy_same_date'));
    setError(null);
    copy.mutate(target);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('nutrition.meals.copyToTitle', { meal: mealName })}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>{t('common.actions.cancel')}</Button>
          <Button variant="primary" icon="copy" loading={copy.isPending} onClick={submit}>
            {t('nutrition.meals.copyAction')}
          </Button>
        </>
      }
    >
      <form
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <p className="small muted">{t('nutrition.meals.copyToHint', { meal: mealName, date: labels.date(date) })}</p>
        <TextField label={t('nutrition.meals.copyToDate')} type="date" value={target} max={maxLogDate(today)} onChange={(e) => setTarget(e.target.value)} error={error} autoFocus />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
