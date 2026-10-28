import { useQuery } from '@tanstack/react-query';
import { qk } from '../../api/queryClient';
import { Badge, ErrorState, LinkButton, LoadingState, Modal } from '../../components/ui';
import { useI18n } from '../../i18n';
import { ExerciseAnimation } from '../animation/ExerciseAnimation';
import { fetchExercise } from '../exercises/api';

/** Technique instructions for an exercise, opened from the live workout without leaving it. */
export function ExerciseInfoModal({ exerciseId, onClose }: { exerciseId: string | null; onClose(): void }) {
  const { t, lt, locale } = useI18n();
  const query = useQuery({
    queryKey: qk.exercise(exerciseId ?? ''),
    queryFn: () => fetchExercise(exerciseId!),
    enabled: exerciseId != null,
    staleTime: 10 * 60_000,
  });
  const ex = query.data;
  return (
    <Modal
      open={exerciseId != null}
      onClose={onClose}
      title={ex ? lt(ex.name) : t('session.exercise.steps')}
      size="lg"
      footer={
        exerciseId ? (
          <LinkButton to={`/exercises/${exerciseId}`} variant="ghost" iconEnd="external" onClick={onClose}>
            {t('session.exercise.openPage')}
          </LinkButton>
        ) : undefined
      }
    >
      {query.isPending ? (
        <LoadingState compact />
      ) : query.isError || !ex ? (
        <ErrorState compact error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <div className="stack exercise-info">
          <ExerciseAnimation exerciseId={ex.id} muscles={ex.primaryMuscles} size="md" />
          <div className="row">
            {ex.primaryMuscles.map((m) => (
              <Badge key={m} tone="primary">
                {t(`enums.muscle.${m}`)}
              </Badge>
            ))}
            <Badge>{t(`enums.difficulty.${ex.difficulty}`)}</Badge>
          </div>
          <section>
            <h3 className="section-title">{t('session.exercise.description')}</h3>
            <p>{lt(ex.description)}</p>
          </section>
          <section>
            <h3 className="section-title">{t('session.exercise.steps')}</h3>
            <ol className="exercise-info-list">
              {ex.instructions[locale].map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
          {ex.safety[locale].length > 0 && (
            <section>
              <h3 className="section-title">{t('session.exercise.safety')}</h3>
              <ul className="exercise-info-list">
                {ex.safety[locale].map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          {ex.mistakes[locale].length > 0 && (
            <section>
              <h3 className="section-title">{t('session.exercise.mistakes')}</h3>
              <ul className="exercise-info-list">
                {ex.mistakes[locale].map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Modal>
  );
}
