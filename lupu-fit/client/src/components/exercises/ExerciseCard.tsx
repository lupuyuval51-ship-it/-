import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useLang } from '../../i18n/index.tsx';
import { exName, type ExerciseContent } from '../../data/content.ts';
import { Tag } from '../../ui/kit.tsx';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';

export function ExerciseCard({ ex, unsafe }: { ex: ExerciseContent; unsafe?: boolean }): ReactNode {
  const { lang, t } = useLang();
  const name = exName(ex, lang);
  return (
    <li>
      <Link to={`/exercises/${ex.id}`} className="card card-link ex-card">
        <ExerciseVideoThumb exerciseId={ex.id} alt={name} />
        <span className="stack-sm grow">
          <strong>{name}</strong>
          <span className="row-wrap">
            {ex.primary.map((m) => <Tag key={m}>{t(`label.muscle.${m}`)}</Tag>)}
            <Tag>{t(`label.difficulty.${ex.difficulty}`)}</Tag>
            {unsafe ? <Tag tone="warning">{t('exercises.unsafeTag')}</Tag> : null}
          </span>
        </span>
      </Link>
    </li>
  );
}
