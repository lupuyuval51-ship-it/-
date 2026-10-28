import type { ProgressOverviewDTO } from '@shared/types';
import { Card, EmptyState, LinkButton, Stat } from '../../../components/ui';
import { useI18n } from '../../../i18n';

/** Averages over logged days vs. targets, calorie adherence and protein-target days. */
export function NutritionHistoryCard({ overview }: { overview: ProgressOverviewDTO }) {
  const { t, formatNumber } = useI18n();
  const n = overview.nutrition;
  const kcal = t('common.units.kcal');
  const g = t('common.units.g');
  return (
    <Card
      title={t('progress.nutrition.title')}
      subtitle={n.daysLogged ? t('progress.nutrition.subtitle') : undefined}
      className="progress-nutrition"
      actions={
        <LinkButton to="/nutrition" variant="ghost" size="sm" iconEnd="chevronRight">
          {t('progress.nutrition.open')}
        </LinkButton>
      }
    >
      {n.daysLogged === 0 || !n.averages ? (
        <EmptyState
          compact
          icon="apple"
          title={t('progress.nutrition.empty')}
          action={
            <LinkButton to="/nutrition/log" variant="primary" size="sm" icon="plus">
              {t('progress.nutrition.logFood')}
            </LinkButton>
          }
        />
      ) : (
        <div className="nutrition-stats">
          <Stat icon="calendar" label={t('progress.nutrition.daysLogged')} value={t('progress.nutrition.daysLoggedValue', { count: n.daysLogged, total: overview.period })} />
          <Stat
            icon="flame"
            tone="warning"
            label={t('progress.nutrition.avgCalories')}
            value={`${formatNumber(n.averages.kcal)} ${kcal}`}
            hint={n.targetCalories != null ? t('progress.nutrition.target', { value: `${formatNumber(n.targetCalories)} ${kcal}` }) : t('progress.nutrition.noTarget')}
          />
          <Stat
            icon="target"
            label={t('progress.nutrition.avgProtein')}
            value={`${formatNumber(n.averages.proteinG)} ${g}`}
            hint={n.targetProteinG != null ? t('progress.nutrition.target', { value: `${formatNumber(n.targetProteinG)} ${g}` }) : t('progress.nutrition.noTarget')}
          />
          <Stat icon="check" tone="info" label={t('progress.nutrition.adherence')} value={n.calorieAdherencePercent != null ? `${n.calorieAdherencePercent}%` : '—'} />
          <Stat
            icon="trophy"
            tone="info"
            label={t('progress.nutrition.proteinDays')}
            value={n.targetProteinG != null ? t('progress.nutrition.daysLoggedValue', { count: n.proteinTargetDays, total: n.daysLogged }) : '—'}
          />
        </div>
      )}
    </Card>
  );
}
