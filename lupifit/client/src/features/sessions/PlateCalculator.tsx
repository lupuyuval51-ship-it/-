import { useEffect, useMemo, useState } from 'react';
import { BAR_WEIGHTS, platesFor, type PlateUnit } from '@shared/plates';
import { Modal } from '../../components/ui';
import { useUnits } from '../../hooks/useUnits';
import { useI18n } from '../../i18n';

/** How many plates go on each side of the bar for a target weight (in the user's unit). */
export function PlateCalculator({ open, onClose, initialWeightKg }: { open: boolean; onClose(): void; initialWeightKg: number | null }) {
  const { t, formatNumber } = useI18n();
  const { imperial, toDisplay, weightUnit } = useUnits();
  const unit: PlateUnit = imperial ? 'lb' : 'kg';
  const bars = BAR_WEIGHTS[unit];
  const [bar, setBar] = useState<number>(bars[0]!);
  const [text, setText] = useState('');

  // Start from the weight of the set being logged each time the dialog opens.
  useEffect(() => {
    if (open) {
      const w = toDisplay(initialWeightKg);
      setText(w != null && w > 0 ? String(w) : '');
      setBar(bars[0]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const target = text.trim() === '' ? NaN : Number(text.replace(',', '.'));
  const load = useMemo(() => platesFor(target, unit, bar), [target, unit, bar]);
  const num = (n: number) => formatNumber(n);

  return (
    <Modal open={open} onClose={onClose} title={t('session.plates.title')} size="sm">
      <div className="stack plate-calc">
        <label className="field">
          <span className="field-label">{t('session.plates.weight', { unit: weightUnit })}</span>
          <input className="input" type="text" inputMode="decimal" autoFocus value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <div role="radiogroup" aria-label={t('session.plates.bar')} className="plate-bars">
          {bars.map((b) => (
            <button key={b} type="button" role="radio" aria-checked={bar === b} className={`chip${bar === b ? ' chip-active' : ''}`} onClick={() => setBar(b)}>
              {t('session.plates.barOption', { weight: num(b), unit: weightUnit })}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="plate-result">
          {Number.isNaN(target) ? null : load.belowBar ? (
            <p className="muted">{t('session.plates.belowBar', { bar: num(bar), unit: weightUnit })}</p>
          ) : (
            <>
              <h3 className="section-title">{t('session.plates.perSide')}</h3>
              {load.perSide.length === 0 ? (
                <p>{t('session.plates.emptyBar')}</p>
              ) : (
                <ul className="plate-list">
                  {load.perSide.map((p) => (
                    <li key={p.plate} className="plate-chip num">
                      {t('session.plates.plateCount', { plate: num(p.plate), count: num(p.count) })}
                    </li>
                  ))}
                </ul>
              )}
              <p className="small muted">{t('session.plates.total', { total: num(load.total), unit: weightUnit })}</p>
              {load.remainder > 0 && (
                <p className="small plate-remainder" role="note">
                  {t('session.plates.remainder', { total: num(load.total), remainder: num(load.remainder), target: num(target), unit: weightUnit })}
                </p>
              )}
            </>
          )}
        </div>
        <p className="small muted">{t('session.plates.hint')}</p>
      </div>
    </Modal>
  );
}
