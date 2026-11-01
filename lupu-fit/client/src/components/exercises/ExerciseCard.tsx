import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { useLang } from '../../i18n/index.tsx';
import { exName, type ExerciseContent } from '../../data/content.ts';
import { Tag } from '../../ui/kit.tsx';
import { IconChevron } from '../../ui/icons.tsx';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';

/** Scannable result row: thumbnail, name, then one meta line (muscle · equipment · level). */
export function ExerciseCard({ ex, unsafe }: { ex: ExerciseContent; unsafe?: boolean }): ReactNode {
  const { lang, t } = useLang();
  const name = exName(ex, lang);
  const gear = ex.equipment.filter((q) => q !== 'none').slice(0, 2).map((q) => t(`label.equipment.${q}`));
  const meta = [ex.primary.map((m) => t(`label.muscle.${m}`)).join(', '), gear.length ? gear.join(', ') : t('label.equipment.none'), t(`label.difficulty.${ex.difficulty}`)];
  return (
    <li>
      <Link to={`/exercises/${ex.id}`} className="ex-row">
        <ExerciseVideoThumb exerciseId={ex.id} alt={name} />
        <span className="stack-sm grow">
          <strong className="ex-row-name">{name}</strong>
          <span className="small muted ex-row-meta">{meta.join(' · ')}</span>
          {unsafe ? <span><Tag tone="warning">{t('exercises.unsafeTag')}</Tag></span> : null}
        </span>
        <IconChevron className="flip-rtl chev" />
      </Link>
    </li>
  );
}
