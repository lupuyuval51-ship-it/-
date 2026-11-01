import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { plateCalculator } from '@lupu-fit/shared';
import { fmt, useT } from '../../i18n/index.tsx';
import { Button, NumberStepper, Segmented, Sheet, Tag } from '../../ui/kit.tsx';

type Bar = '15' | '20';

export function PlateCalculator({ open, onClose, initialKg, onApply }: { open: boolean; onClose: () => void; initialKg: number | null; onApply: (kg: number) => void }): ReactNode {
  const t = useT();
  const [target, setTarget] = useState<number | null>(initialKg);
  const [bar, setBar] = useState<Bar>('20');
  useEffect(() => { if (open) setTarget(initialKg); }, [open, initialKg]);
  const res = useMemo(() => plateCalculator(target ?? 0, Number(bar)), [target, bar]);
  const kg = t('unit.kg');
  return (
    <Sheet open={open} onClose={onClose} title={t('live.plates.title')}>
      <NumberStepper label={t('live.plates.target')} suffix={kg} value={target} onChange={setTarget} step={2.5} min={0} max={500} decimals={2} />
      <Segmented<Bar> label={t('live.plates.bar')} value={bar} onChange={setBar} options={[{ value: '15', label: `15 ${kg}` }, { value: '20', label: `20 ${kg}` }]} />
      <div className="stack-sm">
        <strong>{t('live.plates.perSide')}</strong>
        {res.perSide.length === 0 ? <span className="muted">{t('live.plates.barOnly')}</span> : <ul className="row-wrap list" aria-label={t('live.plates.perSide')}>{res.perSide.map((p, i) => <li key={i}><Tag><span className="num">{fmt.num(p, 2)}</span></Tag></li>)}</ul>}
      </div>
      <div className="row-between"><span>{t('live.plates.achieved')}</span><span><span className="num" data-testid="plates-achieved">{fmt.num(res.achievedKg, 2)}</span> {kg}</span></div>
      <div className="row-between"><span>{t('live.plates.remainder')}</span><span><span className="num" data-testid="plates-remainder">{fmt.num(res.remainderKg, 2)}</span> {kg}</span></div>
      <Button block onClick={() => { onApply(res.achievedKg); onClose(); }}>{t('live.plates.apply')}</Button>
    </Sheet>
  );
}
