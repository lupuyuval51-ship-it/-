/** Renders a notification's structured payload (`kind` + `data`) as localized text. */
import type { LocalizedText } from '@shared/content';
import type { NotificationDTO } from '@shared/types';
import type { IconName } from '../../components/ui';
import { recordValueText, type Fmt } from '../progress/format';

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const localized = (v: unknown): LocalizedText | null =>
  v && typeof v === 'object' && 'en' in v && 'he' in v ? { en: str((v as LocalizedText).en), he: str((v as LocalizedText).he) } : null;

export function notificationMessage(n: Pick<NotificationDTO, 'kind' | 'data'>, f: Fmt): string {
  const d = n.data ?? {};
  switch (n.kind) {
    case 'achievement': {
      const id = str(d.achievementId);
      return f.tx('notifications.kinds.achievement', { title: f.tx(`achievements.${id}.title`, undefined, id) });
    }
    case 'level_up':
      return f.tx('notifications.kinds.level_up', { level: num(d.level) ?? '' });
    case 'personal_record': {
      const recordType = str(d.recordType);
      const value = num(d.value);
      const previous = num(d.previousValue);
      const params = {
        exercise: f.lt(localized(d.exerciseName)) || str(d.exerciseId),
        recordType: f.tx(`enums.prType.${recordType}`, undefined, recordType),
        value: value == null ? '' : recordValueText(recordType, value, f),
        previous: previous == null ? '' : recordValueText(recordType, previous, f),
      };
      return f.tx(previous == null ? 'notifications.kinds.personal_record' : 'notifications.kinds.personal_record_previous', params);
    }
    case 'weekly_goal':
      return f.tx('notifications.kinds.weekly_goal', { completed: num(d.completed) ?? '', goal: num(d.goal) ?? '' });
    default:
      return f.tx(`notifications.kinds.${n.kind}`, undefined, f.tx('notifications.kinds.info'));
  }
}

export const NOTIFICATION_ICONS: Record<NotificationDTO['kind'], IconName> = {
  achievement: 'trophy',
  level_up: 'sparkles',
  personal_record: 'chart',
  weekly_goal: 'target',
  reminder: 'clock',
  info: 'info',
};
