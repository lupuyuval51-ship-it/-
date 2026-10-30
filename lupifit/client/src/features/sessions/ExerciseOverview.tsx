import { useId } from 'react';
import type { SessionExerciseDTO } from '@shared/types';
import { Badge, Icon } from '../../components/ui';
import { useI18n } from '../../i18n';
import { groupBySport, type ExerciseSection } from './logic';
import { SportSectionHeading } from './SportSection';

/**
 * The list of all exercises of the live workout (side panel on desktop, dialog on phones). A sport
 * finisher gets its own heading before its first exercise; a workout without one is a single plain list.
 */
export function ExerciseOverview({ exercises, index, onSelect }: { exercises: SessionExerciseDTO[]; index: number; onSelect(i: number): void }) {
  const { t, lt } = useI18n();
  const baseId = useId();
  const sections = groupBySport(exercises);

  const row = (ex: SessionExerciseDTO, i: number) => {
    const exDone = ex.sets.filter((s) => s.completed).length;
    const complete = ex.sets.length > 0 && exDone === ex.sets.length;
    return (
      <li key={ex.id}>
        <button
          type="button"
          className={`session-overview-item${i === index ? ' is-current' : ''}`}
          aria-current={i === index ? 'step' : undefined}
          onClick={() => onSelect(i)}
        >
          <span className={`session-overview-dot${complete ? ' is-done' : ''}`} aria-hidden="true">
            {complete ? <Icon name="check" size={14} /> : i + 1}
          </span>
          <span className="session-overview-name">{lt(ex.exercise.name)}</span>
          <span className="small muted num">{t('session.overview.setsDone', { done: exDone, total: ex.sets.length })}</span>
          {complete ? <Badge tone="success">{t('session.overview.complete')}</Badge> : i === index ? <Badge tone="primary">{t('session.overview.current')}</Badge> : null}
        </button>
      </li>
    );
  };

  const list = (section: ExerciseSection) => (
    <ol className="session-overview" start={(section.items[0]?.index ?? 0) + 1}>
      {section.items.map(({ exercise, index: i }) => row(exercise, i))}
    </ol>
  );

  if (!sections.some((s) => s.sport != null || s.afterFinisher)) {
    return <ol className="session-overview">{exercises.map((ex, i) => row(ex, i))}</ol>;
  }

  return (
    <div className="session-overview-groups">
      {sections.map((section, n) => {
        const headingId = `${baseId}-${n}`;
        if (section.sport) {
          return (
            <section key={headingId} className="session-overview-section" aria-labelledby={headingId}>
              <SportSectionHeading sport={section.sport} id={headingId} level={3} />
              {list(section)}
            </section>
          );
        }
        if (section.afterFinisher) {
          return (
            <section key={headingId} className="session-overview-section" aria-labelledby={headingId}>
              <h3 id={headingId} className="session-section-title">
                {t('session.sportSection.added')}
              </h3>
              {list(section)}
            </section>
          );
        }
        return <div key={headingId}>{list(section)}</div>;
      })}
    </div>
  );
}
