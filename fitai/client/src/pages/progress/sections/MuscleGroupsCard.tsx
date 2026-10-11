import type { ProgressOverviewDTO } from '@shared/types';
import { Card, EmptyState, ProgressBar } from '../../../components/ui';
import { useI18n } from '../../../i18n';

/** Horizontal bars of completed sets per primary muscle group. */
export function MuscleGroupsCard({ groups }: { groups: ProgressOverviewDTO['muscleGroupSets'] }) {
  const { t, tx } = useI18n();
  const max = Math.max(1, ...groups.map((g) => g.sets));
  return (
    <Card title={t('progress.muscles.title')} subtitle={t('progress.muscles.subtitle')} className="progress-muscles">
      {groups.length === 0 ? (
        <EmptyState compact icon="dumbbell" title={t('progress.muscles.empty')} />
      ) : (
        <ul className="muscle-bars">
          {groups.map((g) => {
            const name = tx(`enums.muscleGroup.${g.group}`, undefined, g.group);
            const sets = t('progress.muscles.sets', { count: g.sets });
            return (
              <li key={g.group} className="muscle-row">
                <span className="muscle-name">{name}</span>
                <ProgressBar value={g.sets} max={max} tone={g.sets ? 'primary' : 'info'} label={`${name}: ${sets}`} showOver={false} />
                <span className="muscle-count muted small num">{sets}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
