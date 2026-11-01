import type { ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import { Button } from '../../ui/kit.tsx';

/** Big countdown + ±15 s + skip. The sr-only live region is always mounted so the "rest is over" message is announced. */
export function RestTimerCard({ remaining, announce, onAdjust, onSkip }: { remaining: number | null; announce: string; onAdjust: (deltaSec: number) => void; onSkip: () => void }): ReactNode {
  const t = useT();
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite">{announce}</div>
      {remaining !== null ? (
        <section className="card live-rest" aria-label={t('live.rest.title')}>
          <div className="row-between">
            <strong>{t('live.rest.title')}</strong>
            <span className="num-timer" role="timer" data-testid="rest-readout">{fmt.duration(remaining)}</span>
          </div>
          <div className="row-wrap">
            <Button size="sm" onClick={() => onAdjust(-15)}>{t('live.rest.minus')}</Button>
            <Button size="sm" onClick={() => onAdjust(15)}>{t('live.rest.plus')}</Button>
            <Button size="sm" variant="ghost" onClick={onSkip}>{t('live.rest.skip')}</Button>
          </div>
        </section>
      ) : null}
    </>
  );
}
