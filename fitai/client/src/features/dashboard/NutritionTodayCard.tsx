import type { DashboardDTO } from '@shared/types';
import { Card, LinkButton, Notice, ProgressBar, ProgressRing } from '../../components/ui';
import { useI18n } from '../../i18n';

const MACROS = [
  { key: 'protein', value: 'proteinG', target: 'proteinG', tone: 'primary' },
  { key: 'carbs', value: 'carbsG', target: 'carbsG', tone: 'info' },
  { key: 'fat', value: 'fatG', target: 'fatG', tone: 'warning' },
] as const;

/** Calories ring and macro bars for today, from logged entries vs. the profile targets. */
export function NutritionTodayCard({ nutrition }: { nutrition: DashboardDTO['nutritionToday'] }) {
  const { t, formatNumber } = useI18n();
  const { totals, targets, entryCount } = nutrition;
  const kcal = Math.round(totals.kcal);
  const target = targets?.calories ?? null;
  const diff = target != null ? target - kcal : null;

  return (
    <Card
      title={t('dashboard.nutrition.title')}
      className="dash-nutrition"
      actions={
        <LinkButton to="/nutrition" variant="ghost" size="sm" iconEnd="chevronRight">
          {t('nav.nutrition')}
        </LinkButton>
      }
    >
      <div className="nutrition-today">
        <ProgressRing
          value={kcal}
          max={target ?? Math.max(1, kcal)}
          size={116}
          tone={diff != null && diff < 0 ? 'warning' : 'primary'}
          label={target != null ? t('dashboard.nutrition.ringLabel', { value: formatNumber(kcal), target: formatNumber(target) }) : t('dashboard.nutrition.consumed', { value: formatNumber(kcal) })}
        >
          <strong className="ring-value num">{formatNumber(kcal)}</strong>
          <span className="ring-sub">{target != null ? t('dashboard.nutrition.ofTarget', { target: formatNumber(target) }) : t('common.units.kcal')}</span>
        </ProgressRing>
        <div className="macro-bars">
          {MACROS.map((m) => {
            const value = totals[m.value];
            const goal = targets ? targets[m.target] : null;
            return (
              <div key={m.key} className="macro-row">
                <div className="row-between small">
                  <span className="macro-name">{t(`common.macros.${m.key}`)}</span>
                  <bdi dir="ltr" className="muted num">
                    {goal != null ? t('dashboard.nutrition.macro', { value: formatNumber(value), target: formatNumber(goal) }) : `${formatNumber(value)} ${t('common.units.g')}`}
                  </bdi>
                </div>
                <ProgressBar value={value} max={goal ?? Math.max(1, value)} tone={m.tone} label={t(`common.macros.${m.key}`)} />
              </div>
            );
          })}
        </div>
      </div>
      {!targets && (
        <Notice tone="info">
          {t('dashboard.nutrition.noTargets')}
        </Notice>
      )}
      <div className="row-between dash-nutrition-footer">
        <p className="muted small" aria-live="polite">
          {entryCount === 0
            ? t('dashboard.nutrition.nothingLogged')
            : diff == null
              ? t('dashboard.nutrition.entries', { count: entryCount })
              : diff >= 0
                ? t('dashboard.nutrition.remaining', { value: formatNumber(diff) })
                : t('dashboard.nutrition.over', { value: formatNumber(-diff) })}
        </p>
        <LinkButton to="/nutrition/log" variant="primary" icon="plus" size="sm">
          {t('dashboard.nutrition.logFood')}
        </LinkButton>
      </div>
    </Card>
  );
}
