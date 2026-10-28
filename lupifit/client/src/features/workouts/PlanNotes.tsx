import { MUSCLE_GROUPS } from '@shared/constants';
import type { GenerationNote, WorkoutPlanDTO } from '@shared/types';
import { Card, Icon, ProgressBar } from '../../components/ui';
import { useI18n } from '../../i18n';
import { noteText, weeklySets } from './format';

/** Generator explanations ("why this plan looks like this"), rendered from note codes. */
export function GenerationNotesCard({ notes }: { notes: GenerationNote[] }) {
  const i18n = useI18n();
  const texts = notes.map((n) => noteText(n, i18n)).filter((x): x is string => !!x);
  if (!texts.length) return null;
  return (
    <Card title={i18n.t('workouts.detail.notesTitle')} className="plan-notes-card">
      <ul className="plan-notes">
        {texts.map((text, i) => (
          <li key={i}>
            <Icon name="info" size={16} />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Weekly sets per muscle group, computed from the plan's current content. */
export function WeeklyVolumeCard({ plan }: { plan: Pick<WorkoutPlanDTO, 'workouts'> }) {
  const { t } = useI18n();
  const volume = weeklySets(plan);
  if (!plan.workouts.some((w) => w.exercises.length)) return null;
  return (
    <Card title={t('workouts.detail.volumeTitle')} subtitle={t('workouts.detail.volumeHint')}>
      <dl className="volume-list">
        {MUSCLE_GROUPS.map((g) => {
          const sets = volume[g];
          const tone = sets === 0 ? 'warning' : sets < 6 && g !== 'core' ? 'warning' : sets > 20 && g !== 'legs' && g !== 'arms' ? 'info' : 'success';
          return (
            <div key={g} className="volume-row">
              <dt>{t(`enums.muscleGroup.${g}`)}</dt>
              <dd>
                <ProgressBar value={sets} max={24} tone={tone} showOver={false} label={`${t(`enums.muscleGroup.${g}`)}: ${t('workouts.detail.volumeSets', { count: sets })}`} />
                <span className="num">{t('workouts.detail.volumeSets', { count: sets })}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
