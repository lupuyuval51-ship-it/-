import { dayOfWeek } from '@shared/dates';
import type { DashboardDTO } from '@shared/types';
import { Card, Icon, ProgressRing } from '../../components/ui';
import { useI18n } from '../../i18n';
import { LevelProgress } from '../gamification/LevelProgress';
import { weekOutlook } from './today';

/** "X of Y workouts" with week-day dots, the streak and the level/XP bar. */
export function WeeklyGoalCard({ data }: { data: Pick<DashboardDTO, 'today' | 'weeklyGoal' | 'weekDays' | 'streakWeeks' | 'level'> }) {
  const { t, tx } = useI18n();
  const { weeklyGoal: goal, weekDays, streakWeeks, today } = data;
  const remaining = Math.max(0, goal.target - goal.completed);
  const outlook = weekOutlook(data);
  return (
    <Card
      title={t('dashboard.weekly.title')}
      className="dash-weekly"
      actions={
        <span className={`streak-pill${streakWeeks ? '' : ' streak-pill-empty'}`}>
          <Icon name="flame" size={16} />
          {streakWeeks ? t('dashboard.weekly.streak', { count: streakWeeks }) : t('dashboard.weekly.noStreak')}
        </span>
      }
    >
      <div className="weekly-hero">
        <ProgressRing
          value={goal.completed}
          max={goal.target}
          size={132}
          stroke={12}
          tone={goal.met ? 'success' : 'primary'}
          label={t('dashboard.weekly.progress', { completed: goal.completed, target: goal.target })}
        >
          <strong className="ring-value ring-value-lg num">
            {goal.completed}
            <span className="ring-of">/{goal.target}</span>
          </strong>
          <span className="ring-sub">{goal.met ? <Icon name="check" size={14} /> : t('dashboard.weekly.title')}</span>
        </ProgressRing>
        <div className="stack-sm weekly-text">
          <strong className="weekly-count num">{t('dashboard.weekly.progress', { completed: goal.completed, target: goal.target })}</strong>
          <p className={goal.met ? 'weekly-met' : 'muted'}>{goal.met ? t('dashboard.weekly.met') : t('dashboard.weekly.remaining', { count: remaining })}</p>
          {!goal.met && (
            <p className="small muted" data-testid="week-outlook">
              {outlook.status === 'tight'
                ? t('dashboard.weekly.tight')
                : outlook.status === 'out_of_reach'
                  ? t('dashboard.weekly.outOfReach')
                  : t('dashboard.weekly.daysLeft', { count: outlook.daysLeft })}
            </p>
          )}
          <p className="faint small">{t('dashboard.weekly.rule')}</p>
        </div>
      </div>
      <ul className="week-dots" aria-label={t('dashboard.weekly.days')}>
        {weekDays.map((d) => {
          const dow = String(dayOfWeek(d.date));
          const name = tx(`common.time.weekdays.${dow}`);
          const done = d.workouts > 0;
          return (
            <li key={d.date} className={`week-dot${done ? ' week-dot-done' : ''}${d.date === today ? ' week-dot-today' : ''}`}>
              <span className="week-dot-mark" aria-hidden="true">
                {done ? <Icon name="check" size={14} /> : null}
              </span>
              <span className="week-dot-label" aria-hidden="true">
                {tx(`common.time.weekdaysShort.${dow}`)}
              </span>
              <span className="visually-hidden">{t(done ? 'dashboard.weekly.dayTrained' : 'dashboard.weekly.dayRest', { day: name })}</span>
            </li>
          );
        })}
      </ul>
      <hr className="divider" />
      <LevelProgress level={data.level} />
    </Card>
  );
}
