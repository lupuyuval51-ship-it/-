import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import { rpeOptions, type Defaults } from '../../lib/liveSession.ts';
import { IconCheck, IconUndo } from '../../ui/icons.tsx';
import { Button, NumberStepper, Select } from '../../ui/kit.tsx';
import { PlateCalculator } from './PlateCalculator.tsx';

export interface LoggedValues { reps?: number; weightKg?: number; durationSec?: number; rpe: number }
export interface RowData { key: string; setNo: number; reps: number | null; weightKg: number | null; durationSec: number | null; rpe: number | null; state: 'done' | 'pending' | 'rejected' }

export function SetRows({ rows, plannedSets, plannedLabel }: { rows: RowData[]; plannedSets: number; plannedLabel: string }): ReactNode {
  const t = useT();
  const future = Math.max(0, plannedSets - rows.length);
  return (
    <ol className="live-sets list" aria-label={t('live.setsDone', { done: rows.length, total: plannedSets })}>
      {rows.map((r, i) => (
        <li key={r.key} className={`live-set-row ${r.state}`}>
          <span className="strong">{t('live.set.n', { n: i + 1 })}</span>
          <span className="grow">
            {r.reps === null && r.durationSec !== null ? <><span className="num">{fmt.num(r.durationSec)}</span> {t('unit.sec')}</> : <>{r.weightKg ? <><span className="num">{fmt.num(r.weightKg, 2)}</span> {t('unit.kg')} × </> : null}<span className="num">{fmt.num(r.reps ?? 0)}</span></>}
            {r.rpe !== null ? <span className="muted"> · {t('live.chip.rpe', { rpe: fmt.num(r.rpe, 1) })}</span> : null}
          </span>
          {r.state === 'pending' ? <span className="tag warning">{t('live.set.pending')}</span> : r.state === 'rejected' ? <span className="tag danger">{t('outbox.rejected')}</span> : <><IconCheck /><span className="sr-only">{t('live.status.done')}</span></>}
        </li>
      ))}
      {Array.from({ length: future }, (_, k) => (
        <li key={`f${k}`} className="live-set-row planned muted">
          <span>{t('live.set.n', { n: rows.length + k + 1 })}</span>
          <span className="grow">{plannedLabel}</span>
        </li>
      ))}
    </ol>
  );
}

export function SetLogger({ timed, showWeight, defaults, maxRpe, primary, busy, canUndo, onLog, onUndo }: {
  timed: boolean; showWeight: boolean; defaults: Defaults; maxRpe: number; primary: boolean; busy: boolean; canUndo: boolean;
  onLog: (v: LoggedValues) => void; onUndo: () => void;
}): ReactNode {
  const t = useT();
  const touched = useRef(false);
  const [weight, setWeight] = useState<number | null>(defaults.weightKg);
  const [reps, setReps] = useState<number | null>(defaults.reps);
  const [dur, setDur] = useState<number | null>(defaults.durationSec);
  const [rpe, setRpe] = useState<number>(defaults.rpe);
  const [plates, setPlates] = useState(false);
  // History/progression arrives asynchronously: refresh the prefill until the user edits the weight.
  useEffect(() => { if (!touched.current) setWeight(defaults.weightKg); }, [defaults.weightKg]);

  const submit = () => {
    const v: LoggedValues = { rpe: Math.min(rpe, maxRpe) };
    if (timed) v.durationSec = Math.max(0, Math.round(dur ?? 0)); else v.reps = Math.max(0, Math.round(reps ?? 0));
    if (showWeight && weight !== null && weight > 0) v.weightKg = weight;
    onLog(v);
  };
  return (
    <div className="stack">
      <div className="grid-2">
        {showWeight ? <NumberStepper label={t('live.set.weight')} suffix={t('unit.kg')} value={weight} onChange={(v) => { touched.current = true; setWeight(v); }} step={0.5} min={0} max={1000} decimals={2} /> : null}
        {timed
          ? <NumberStepper label={t('live.set.seconds')} value={dur} onChange={setDur} step={5} min={0} max={7200} />
          : <NumberStepper label={t('live.set.reps')} value={reps} onChange={setReps} step={1} min={0} max={100} />}
      </div>
      <Select label={t('live.set.rpe')} value={String(rpe)} onChange={(e) => setRpe(Number(e.target.value))} options={rpeOptions(maxRpe).map((v) => ({ value: String(v), label: fmt.num(v, 1) }))} />
      <div className="row-wrap">
        {showWeight ? <Button size="sm" onClick={() => setPlates(true)}>{t('live.plates.open')}</Button> : null}
        <Button size="sm" variant="ghost" disabled={!canUndo} onClick={onUndo}><IconUndo />{t('live.set.undo')}</Button>
      </div>
      <Button variant={primary ? 'primary' : 'default'} block disabled={busy} onClick={submit}><IconCheck />{t('live.set.finish')}</Button>
      {showWeight ? <PlateCalculator open={plates} onClose={() => setPlates(false)} initialKg={weight} onApply={(kg) => { touched.current = true; setWeight(kg); }} /> : null}
    </div>
  );
}
