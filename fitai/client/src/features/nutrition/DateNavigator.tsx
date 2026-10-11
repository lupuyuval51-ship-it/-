import { addDays } from '@shared/dates';
import { Button, IconButton } from '../../components/ui';
import { useI18n } from '../../i18n';
import { useUserToday } from './hooks';
import { maxLogDate } from './portion';

/** Previous / next / today navigation plus a native date picker (future limited to tomorrow). */
export function DateNavigator({ date, onChange }: { date: string; onChange(date: string): void }) {
  const { t, formatDate } = useI18n();
  const today = useUserToday();
  const max = maxLogDate(today);
  const relative =
    date === today ? t('common.time.today') : date === addDays(today, -1) ? t('common.time.yesterday') : date === max ? t('common.time.tomorrow') : null;
  const long = formatDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="nutri-date-nav" role="group" aria-label={t('nutrition.date.label')}>
      <IconButton icon="chevronLeft" label={t('nutrition.date.previous')} onClick={() => onChange(addDays(date, -1))} />
      <div className="nutri-date-center">
        <strong className="nutri-date-title" aria-live="polite">
          {relative ?? formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}
        </strong>
        {relative && <span className="small muted">{long}</span>}
      </div>
      <IconButton icon="chevronRight" label={t('nutrition.date.next')} disabled={date >= max} onClick={() => onChange(addDays(date, 1))} />
      <input
        type="date"
        className="input nutri-date-input"
        aria-label={t('nutrition.date.label')}
        value={date}
        max={max}
        onChange={(e) => {
          const v = e.target.value;
          if (v && v <= max) onChange(v);
        }}
      />
      {date !== today && (
        <Button size="sm" variant="ghost" icon="calendar" onClick={() => onChange(today)}>
          {t('nutrition.date.today')}
        </Button>
      )}
    </div>
  );
}
