import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '../../api/queryClient';
import { Button, Card, useToast } from '../../components/ui';
import { useIdempotentMutation } from '../../hooks/useIdempotentMutation';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { applyTargetAdjustment, dismissTargetAdjustment, fetchTargetSuggestion } from './api';

/**
 * Weight-trend calorie check. Appears only when the user's own weigh-ins have been off the goal's band
 * for four weeks; it explains the numbers, changes nothing until "Apply", and can be postponed.
 */
export function TargetSuggestionCard() {
  const i18n = useI18n();
  const { t, tx, formatNumber } = i18n;
  const toast = useToast();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: qk.targetSuggestion, queryFn: ({ signal }) => fetchTargetSuggestion(signal), staleTime: 5 * 60_000 });
  const suggestion = query.data?.suggestion;

  const refresh = () => {
    for (const key of [qk.targetSuggestion, qk.profile, qk.dashboard, ['nutrition']]) void qc.invalidateQueries({ queryKey: key });
  };
  const apply = useIdempotentMutation((offsetKcal: number, key: string) => applyTargetAdjustment(offsetKcal, key), {
    onSuccess: () => {
      toast.success(t('nutrition.adjust.applied'));
      refresh();
    },
    onError: (err) => {
      toast.error(errorMessage(err, i18n, 'nutrition'));
      refresh();
    },
  });
  const later = useMutation({
    mutationFn: dismissTargetAdjustment,
    onSuccess: refresh,
    onError: (err) => toast.error(errorMessage(err, i18n, 'nutrition')),
  });

  if (!suggestion) return null;
  const params = {
    rate: formatNumber(Math.abs(suggestion.weeklyRateKg), { maximumFractionDigits: 2 }),
    delta: Math.abs(suggestion.deltaKcal),
    proposed: formatNumber(suggestion.proposedCalories),
  };
  return (
    <Card title={t('nutrition.adjust.title')} className="target-suggestion">
      <p data-testid="target-suggestion-text">{tx(`nutrition.adjust.codes.${suggestion.code}`, params)}</p>
      <p className="small faint">{t('nutrition.adjust.basis', { weighIns: suggestion.weighIns })}</p>
      <div className="row">
        <Button variant="secondary" loading={apply.isPending} onClick={() => apply.mutate(suggestion.offsetKcal)}>
          {t('nutrition.adjust.apply', { proposed: params.proposed })}
        </Button>
        <Button variant="ghost" loading={later.isPending} onClick={() => later.mutate()}>
          {t('nutrition.adjust.later')}
        </Button>
      </div>
    </Card>
  );
}
