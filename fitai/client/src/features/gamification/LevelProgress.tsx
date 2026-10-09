import type { LevelInfo } from '@shared/gamification';
import { Icon, ProgressBar } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Level badge with XP progress toward the next level. */
export function LevelProgress({ level }: { level: LevelInfo }) {
  const { t, formatNumber } = useI18n();
  const span = Math.max(1, level.nextLevelXp - level.levelStartXp);
  return (
    <div className="level-progress">
      <div className="row-between">
        <span className="level-badge">
          <Icon name="sparkles" size={16} />
          {t('achievements.level', { level: level.level })}
        </span>
        <span className="muted small num">{t('achievements.xpProgress', { current: formatNumber(level.totalXp), next: formatNumber(level.nextLevelXp) })}</span>
      </div>
      <ProgressBar value={level.totalXp - level.levelStartXp} max={span} tone="info" label={t('achievements.levelLabel')} />
      <p className="faint small">{t('achievements.xpToNext', { xp: formatNumber(level.nextLevelXp - level.totalXp), level: level.level + 1 })}</p>
    </div>
  );
}
