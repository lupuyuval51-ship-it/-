import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import type { LiveExercise } from '../../lib/liveSession.ts';
import { Button } from '../../ui/kit.tsx';

type Phase = { kind: 'idle' } | { kind: 'work' | 'rest'; round: number; endsAt: number };

/** Work/rest countdown per round (rounds = planned sets). Each finished work interval logs a set through `onRound`. */
export function FinisherTimer({ ex, onRound }: { ex: LiveExercise; onRound: (durationSec: number) => Promise<void> }): ReactNode {
  const t = useT();
  const rounds = ex.planned.sets; const work = ex.planned.durationSec ?? 0; const rest = ex.planned.restSec;
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [now, setNow] = useState(() => Date.now());
  const roundRef = useRef(onRound); roundRef.current = onRound;
  const done = ex.sets.length >= rounds;
  const buzz = () => { try { navigator.vibrate?.(150); } catch { /* ignore */ } };

  useEffect(() => {
    if (phase.kind === 'idle') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase.kind]);

  useEffect(() => {
    if (phase.kind === 'idle' || now < phase.endsAt) return;
    buzz();
    const t0 = Date.now();
    if (phase.kind === 'work') {
      void roundRef.current(work);
      if (phase.round >= rounds) setPhase({ kind: 'idle' });
      else setPhase(rest > 0 ? { kind: 'rest', round: phase.round, endsAt: t0 + rest * 1000 } : { kind: 'work', round: phase.round + 1, endsAt: t0 + work * 1000 });
    } else setPhase({ kind: 'work', round: phase.round + 1, endsAt: t0 + work * 1000 });
  }, [now, phase, rounds, rest, work]);

  if (done && phase.kind === 'idle') return <span className="success">{t('live.finisher.done')}</span>;
  const start = () => { const t0 = Date.now(); setNow(t0); setPhase({ kind: 'work', round: Math.min(rounds, ex.sets.length + 1), endsAt: t0 + work * 1000 }); };
  if (phase.kind === 'idle') return <Button onClick={start}>{t('live.finisher.start')}</Button>;
  return (
    <div className="stack-sm" aria-live="off">
      <div className="row-between">
        <span>{t('live.finisher.round', { n: phase.round, total: rounds })} · <strong>{phase.kind === 'work' ? t('live.finisher.work') : t('live.rest.title')}</strong></span>
        <span className="num-lg" role="timer">{fmt.duration(Math.max(0, Math.ceil((phase.endsAt - now) / 1000)))}</span>
      </div>
      <Button size="sm" variant="ghost" onClick={() => setPhase({ kind: 'idle' })}>{t('live.finisher.stop')}</Button>
    </div>
  );
}
