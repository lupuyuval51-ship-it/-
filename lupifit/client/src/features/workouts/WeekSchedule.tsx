import type { WorkoutPlanDTO } from '@shared/types';
import { Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { focusLabel } from './format';

/**
 * Scannable overview of the training week: one tile per workout day (in plan order) that
 * jumps to the day's card, plus the number of rest days implied by the plan length.
 */
export function WeekSchedule({ plan, nextIndex }: { plan: Pick<WorkoutPlanDTO, 'workouts'>; nextIndex: number }) {
  const i18n = useI18n();
  const { t, formatNumber } = i18n;
  const days = plan.workouts;
  if (days.length === 0) return null;
  const rest = Math.max(0, 7 - days.length);
  return (
    <section className="week" aria-labelledby="week-title">
      <div className="row-between">
        <h2 className="section-title" id="week-title">
          {t('workouts.detail.schedule')}
        </h2>
        <span className="small muted">{t('workouts.detail.scheduleHint')}</span>
      </div>
      <ol className="week-strip">
        {days.map((w, i) => {
          const focus = focusLabel(w.focus, i18n);
          return (
            <li key={w.id} className="week-item">
              <a href={`#day-${w.id}`} className={`week-day${i === nextIndex ? ' week-day-next' : ''}`} aria-current={i === nextIndex ? 'step' : undefined}>
                <span className="week-day-num">{t('workouts.detail.dayNumber', { n: formatNumber(i + 1) })}</span>
                <strong className="week-day-name">{w.name}</strong>
                {focus && focus !== w.name && <span className="week-day-focus">{focus}</span>}
                <span className="week-day-meta">
                  <span>{t('workouts.list.exercisesCount', { count: w.exercises.length })}</span>
                  {w.estimatedMinutes != null && (
                    <span className="week-day-time">
                      <Icon name="clock" size={13} />
                      {t('workouts.detail.estimated', { minutes: formatNumber(w.estimatedMinutes) })}
                    </span>
                  )}
                </span>
                {i === nextIndex && <span className="week-day-badge" aria-hidden="true" />}
              </a>
            </li>
          );
        })}
        {rest > 0 && (
          <li className="week-item week-item-rest">
            <div className="week-day week-day-rest">
              <Icon name="timer" size={18} />
              <span>{t('workouts.detail.restDays', { count: rest })}</span>
            </div>
          </li>
        )}
      </ol>
    </section>
  );
}
