import { useRef, type ReactNode } from 'react';
import { exById, exName } from '../../data/content.ts';
import { fmt, useLang, useT } from '../../i18n/index.tsx';
import type { NextUp } from '../../lib/liveSession.ts';
import { ExerciseVideoThumb } from '../ExerciseVideo.tsx';
import { Button } from '../../ui/kit.tsx';

/**
 * Rest takeover: 64 px countdown between -15 / +15, progress, a preview of what comes next and skip.
 * It never blocks logging (the logger stays below). The sr-only live region is always mounted so "rest is over" is announced.
 */
export function RestTimerCard({ remaining, announce, next, onAdjust, onSkip }: { remaining: number | null; announce: string; next: NextUp | null; onAdjust: (deltaSec: number) => void; onSkip: () => void }): ReactNode {
  const t = useT(); const { lang } = useLang();
  const peak = useRef(0);
  if (remaining === null) peak.current = 0; else if (remaining > peak.current) peak.current = remaining;
  const pct = remaining !== null && peak.current > 0 ? Math.round((remaining / peak.current) * 100) : 0;
  const def = next ? exById(next.exercise.exerciseId) : undefined;
  const nextName = next ? (def ? exName(def, lang) : next.exercise.exerciseId) : '';
  const p = next?.exercise.planned;
  const reps = p ? (p.repsMin === p.repsMax ? `${p.repsMax}` : `${p.repsMin}–${p.repsMax}`) : '';
  const target = p ? (p.durationSec ? t('live.set.plannedSec', { sec: p.durationSec }) : t('live.set.plannedReps', { reps })) : '';
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>
      {remaining !== null ? (
        <section className="lv-rest" aria-label={t('live.rest.title')}>
          <span className="lv-eyebrow">{t('live.rest.title')}</span>
          <div className="lv-rest-clock">
            <Button className="lv-rest-adj" onClick={() => onAdjust(-15)}>{t('live.rest.minus')}</Button>
            <span className="num-timer lv-rest-time" role="timer" data-testid="rest-readout">{fmt.duration(remaining)}</span>
            <Button className="lv-rest-adj" onClick={() => onAdjust(15)}>{t('live.rest.plus')}</Button>
          </div>
          <div className="lv-rest-bar" aria-hidden="true"><i style={{ inlineSize: `${pct}%` }} /></div>
          <div className="lv-rest-foot">
            {next ? (
              <div className="lv-next" data-testid="rest-next">
                <ExerciseVideoThumb exerciseId={next.exercise.exerciseId} alt="" />
                <div className="lv-next-text">
                  <span className="lv-eyebrow">{t('live.rest.next')}</span>
                  <strong className="lv-next-name">{nextName}</strong>
                  <span className="small muted">{t('live.set.n', { n: next.setNo })} · {target}{p?.loadKg ? <> · <span className="num">{fmt.num(p.loadKg, 2)}</span> {t('unit.kg')}</> : null}</span>
                </div>
              </div>
            ) : <span className="grow" />}
            <Button className="lv-rest-skip" onClick={onSkip}>{t('live.rest.skip')}</Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
