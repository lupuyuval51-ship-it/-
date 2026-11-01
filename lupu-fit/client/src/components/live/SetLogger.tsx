import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { fmt, useT } from '../../i18n/index.tsx';
import type { Defaults } from '../../lib/liveSession.ts';
import { IconCheck, IconUndo } from '../../ui/icons.tsx';
import { Button, IconButton } from '../../ui/kit.tsx';
import { LiveStepper } from './LiveStepper.tsx';
import { PlateCalculator } from './PlateCalculator.tsx';
import { IconBarbell } from './LiveIcons.tsx';
import { RpeChips } from './RpeChips.tsx';

export interface LoggedValues { reps?: number; weightKg?: number; durationSec?: number; rpe: number }
export interface RowData { key: string; setNo: number; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null; state: 'done' | 'pending' | 'rejected' }

/** Compact set strip: done sets are small cells, the set being logged is highlighted, the rest are quiet placeholders. */
export function SetRows({ rows, plannedSets }: { rows: RowData[]; plannedSets: number }): ReactNode {
  const t = useT();
  const future = Math.max(0, plannedSets - rows.length - 1);
  const showNow = rows.length < plannedSets;
  return (
    <ol className="lv-sets" aria-label={t('live.setsDone', { done: rows.length, total: plannedSets })}>
      {rows.map((r, i) => (
        <li key={r.key} className={`lv-cell ${r.state}${i === rows.length - 1 && r.state === 'done' ? ' fresh' : ''}`}>
          <span className="lv-cell-n">{i + 1}</span>
          <span className="lv-cell-v">
            {r.reps === null && r.durationSec !== null
              ? <><span className="num">{fmt.num(r.durationSec)}</span><span className="lv-cell-u">{t('unit.sec')}</span></>
              : <>{r.weightKg ? <><span className="num">{fmt.num(r.weightKg, 2)}</span><span className="lv-cell-x">×</span></> : null}<span className="num">{fmt.num(r.reps ?? 0)}</span>{r.weightKg ? <span className="sr-only">{t('unit.kg')}</span> : null}</>}
          </span>
          {r.state === 'pending' ? <span className="tag warning">{t('live.set.pending')}</span> : r.state === 'rejected' ? <span className="tag danger">{t('outbox.rejected')}</span> : <><IconCheck className="lv-cell-ok" /><span className="sr-only">{t('live.status.done')}</span></>}
        </li>
      ))}
      {showNow ? <li className="lv-cell now" aria-current="step"><span className="lv-cell-n">{rows.length + 1}</span></li> : null}
      {Array.from({ length: future }, (_, k) => <li key={`f${k}`} className="lv-cell todo"><span className="lv-cell-n">{rows.length + k + 2}</span></li>)}
    </ol>
  );
}

export function SetLogger({ timed, showWeight, defaults, maxRpe, primary, busy, canUndo, dock, platesSignal = 0, onLog, onUndo }: {
  timed: boolean; showWeight: boolean; defaults: Defaults; maxRpe: number; primary: boolean; busy: boolean; canUndo: boolean;
  /** Pinned bottom bar the action row is rendered into (thumb zone); inline when null. */
  dock?: HTMLElement | null; platesSignal?: number;
  onLog: (v: LoggedValues) => void; onUndo: () => void;
}): ReactNode {
  const t = useT();
  const touched = useRef(false);
  const [weight, setWeight] = useState<number | null>(defaults.weightKg);
  const [reps, setReps] = useState<number | null>(defaults.reps);
  const [dur, setDur] = useState<number | null>(defaults.durationSec);
  const [rpe, setRpe] = useState<number>(Math.min(defaults.rpe, maxRpe));
  const [plates, setPlates] = useState(false);
  // History/progression arrives asynchronously: refresh the prefill until the user edits the weight.
  useEffect(() => { if (!touched.current) setWeight(defaults.weightKg); }, [defaults.weightKg]);
  const lastSignal = useRef(platesSignal);
  useEffect(() => { if (platesSignal !== lastSignal.current) { lastSignal.current = platesSignal; if (showWeight) setPlates(true); } }, [platesSignal, showWeight]);

  const submit = (): void => {
    const v: LoggedValues = { rpe: Math.min(rpe, maxRpe) };
    if (timed) v.durationSec = Math.max(0, Math.round(dur ?? 0)); else v.reps = Math.max(0, Math.round(reps ?? 0));
    if (showWeight && weight !== null && weight > 0) v.weightKg = weight;
    onLog(v);
  };
  const actions = (
    <div className="lv-actions">
      <IconButton label={t('live.set.undo')} className="lv-undo" disabled={!canUndo} onClick={onUndo}><IconUndo /></IconButton>
      <Button variant={primary ? 'primary' : 'default'} block className="lv-finish" disabled={busy} onClick={submit}><IconCheck />{t('live.set.finish')}</Button>
    </div>
  );
  return (
    <div className="lv-logger">
      {showWeight ? <LiveStepper label={t('live.set.weight')} unit={t('unit.kg')} value={weight} onChange={(v) => { touched.current = true; setWeight(v); }} step={2.5} min={0} max={1000} decimals={2} /> : null}
      {timed
        ? <LiveStepper label={t('live.set.seconds')} unit={t('unit.sec')} value={dur} onChange={setDur} step={5} min={0} max={7200} />
        : <LiveStepper label={t('live.set.reps')} value={reps} onChange={setReps} step={1} min={0} max={100} />}
      <RpeChips value={rpe} max={maxRpe} onChange={setRpe} />
      {showWeight ? <Button size="sm" variant="ghost" className="lv-plates-btn" onClick={() => setPlates(true)}><IconBarbell />{t('live.plates.open')}</Button> : null}
      {dock ? createPortal(actions, dock) : actions}
      {showWeight ? <PlateCalculator open={plates} onClose={() => setPlates(false)} initialKg={weight} onApply={(kg) => { touched.current = true; setWeight(kg); }} /> : null}
    </div>
  );
}
