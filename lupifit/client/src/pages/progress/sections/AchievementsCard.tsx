import { useQuery } from '@tanstack/react-query';
import { qk } from '../../../api/queryClient';
import { Card, Icon, QueryState } from '../../../components/ui';
import { AchievementsGrid } from '../../../features/gamification/AchievementsGrid';
import { LevelProgress } from '../../../features/gamification/LevelProgress';
import { gamificationApi } from '../../../features/gamification/api';
import { useI18n } from '../../../i18n';

export function AchievementsCard() {
  const { t } = useI18n();
  const query = useQuery({ queryKey: qk.gamification, queryFn: gamificationApi.overview });
  const unlocked = query.data?.achievements.filter((a) => a.unlockedAt).length ?? 0;
  return (
    <Card
      id="achievements"
      title={t('achievements.title')}
      subtitle={query.data ? t('achievements.summary', { unlocked, total: query.data.achievements.length }) : undefined}
      className="progress-achievements"
    >
      <QueryState query={query}>
        {(g) => (
          <div className="stack">
            <div className="ach-header">
              <LevelProgress level={g.level} />
              <div className="stack-sm">
                <span className={`streak-pill${g.streak.currentWeeks ? '' : ' streak-pill-empty'}`}>
                  <Icon name="flame" size={16} />
                  {g.streak.currentWeeks ? t('progress.consistency.streak', { count: g.streak.currentWeeks }) : t('progress.consistency.noStreak')}
                </span>
                {g.streak.longestWeeks > 0 && <span className="muted small">{t('achievements.longestStreak', { count: g.streak.longestWeeks })}</span>}
              </div>
            </div>
            <AchievementsGrid achievements={g.achievements} />
            <p className="faint small">{t('achievements.howItWorks')}</p>
          </div>
        )}
      </QueryState>
    </Card>
  );
}
