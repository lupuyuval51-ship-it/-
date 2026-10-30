import { useId } from 'react';
import { SPORT_BLOCK_MINUTES, type SportId } from '@shared/constants';
import { useI18n } from '../../i18n';
import { sportLabel } from './format';

/** Title of a sport finisher with a quiet line under it ("about 10 minutes", plus an optional detail). */
export function SportSectionHeading({ sport, id, level, detail }: { sport: SportId; id: string; level: 2 | 3; detail?: string }) {
  const i18n = useI18n();
  const { t } = i18n;
  const Tag = level === 2 ? 'h2' : 'h3';
  const note = [detail, t('session.sportSection.duration', { minutes: SPORT_BLOCK_MINUTES })].filter(Boolean).join(' · ');
  return (
    <div className="session-section-head">
      <Tag id={id} className="session-section-title">
        {t('session.sportSection.title', { sport: sportLabel(i18n, sport) })}
      </Tag>
      <p className="small muted num session-section-note">{note}</p>
    </div>
  );
}

/**
 * Shown above the current exercise while it belongs to the sport finisher: it says which sport the last
 * minutes are for and how far along the finisher is. Calm on purpose (a thin line, no fill, no extra colour).
 */
export function FinisherBanner({ sport, position, total }: { sport: SportId; position: number; total: number }) {
  const { t } = useI18n();
  const id = useId();
  return (
    <section className="session-finisher" aria-labelledby={id}>
      <SportSectionHeading sport={sport} id={id} level={2} detail={t('session.sportSection.position', { current: position, total })} />
    </section>
  );
}

/** One quiet line for the summary and the history: "Sport finisher: Soccer". */
export function SportFinisherLine({ sport, className }: { sport: SportId; className?: string }) {
  const i18n = useI18n();
  return (
    <span className={className}>
      {i18n.t('session.sportSection.line', { sport: sportLabel(i18n, sport) })}
    </span>
  );
}
