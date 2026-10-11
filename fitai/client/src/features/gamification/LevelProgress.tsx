import type { LevelInfo } from '@shared/gamification';
import { ProgressBar } from '../../components/ui';
import { useI18n } from '../../i18n';

/** Level medal + XP progress toward the next level. */
export function LevelProgress({ level }: { level: LevelInfo }) {
  const { t, formatNumber } = useI18n();
  const span = Math.max(1, level.nextLevelXp - level.levelStartXp);
  return (
    <div className="level-progress">
      <span className="level-medal num" aria-hidden="true">
        {level.level}
      </span>
      <div className="level-main">
        <div className="row-between">
          <span className="level-badge">{t('achievements.level', { level: level.level })}</span>
          <bdi dir="ltr" className="muted small num">
            {t('achievements.xpProgress', { current: formatNumber(level.totalXp), next: formatNumber(level.nextLevelXp) })}
          </bdi>
        </div>
        <ProgressBar value={level.totalXp - level.levelStartXp} max={span} tone="info" label={t('achievements.levelLabel')} />
        <p className="faint small">{t('achievements.xpToNext', { xp: formatNumber(level.nextLevelXp - level.totalXp), level: level.level + 1 })}</p>
      </div>
    </div>
  );
}
