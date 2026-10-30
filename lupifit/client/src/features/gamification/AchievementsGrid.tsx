import { ACHIEVEMENTS } from '@shared/gamification';
import type { AchievementStatusDTO } from '@shared/types';
import { Badge, ProgressBar } from '../../components/ui';
import { useI18n } from '../../i18n';

const DEFS = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Every achievement: unlocked ones with their date, locked ones with real progress. */
export function AchievementsGrid({ achievements }: { achievements: AchievementStatusDTO[] }) {
  const { t, tx, formatDate, formatNumber } = useI18n();
  return (
    <ul className="achievement-grid">
      {achievements.map((a) => {
        const def = DEFS.get(a.id);
        const unlocked = a.unlockedAt != null;
        const title = tx(`achievements.${a.id}.title`, undefined, a.id);
        const current = Math.min(a.progress.current, a.progress.target);
        return (
          <li key={a.id} className={`achievement ${unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}>
            <span className="achievement-icon" aria-hidden="true">
              {def?.icon ?? '🏅'}
            </span>
            <div className="achievement-body">
              <strong className="achievement-title">{title}</strong>
              <span className="achievement-desc">{tx(`achievements.${a.id}.description`, undefined, '')}</span>
              {unlocked ? (
                <Badge tone="success" icon="check">
                  {t('achievements.unlockedOn', { date: formatDate(a.unlockedAt!, { day: 'numeric', month: 'short', year: 'numeric' }) })}
                </Badge>
              ) : (
                <div className="achievement-progress">
                  <ProgressBar value={current} max={a.progress.target} label={t('achievements.progressLabel', { title, current, target: a.progress.target })} />
                  <span className="small muted num">
                    {t('achievements.progress', { current: formatNumber(current), target: formatNumber(a.progress.target) })}
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
