import { useState, type ReactNode } from 'react';
import { fmt, useT } from '../../i18n/index.tsx';
import { rpeOptions } from '../../lib/liveSession.ts';

/** Quick RPE: five whole-number chips (top of the allowed range) plus a "…" that reveals every half step. */
export function RpeChips({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }): ReactNode {
  const t = useT();
  const [more, setMore] = useState(false);
  const top = Math.floor(max);
  const quick = Array.from({ length: 5 }, (_, i) => top - 4 + i).filter((v) => v >= 1);
  const offQuick = !quick.includes(value);
  const all = rpeOptions(max);
  return (
    <div className="lv-rpe stack-sm">
      <div className="lv-rpe-head"><span className="field-label">{t('live.set.rpe')}</span><span className="tiny muted">{t('live.rpe.hint')}</span></div>
      <div className="lv-rpe-row" role="group" aria-label={t('live.set.rpe')}>
        {quick.map((v) => <button type="button" key={v} className="lv-rpe-chip" aria-pressed={value === v} onClick={() => onChange(v)}><span className="num">{fmt.num(v, 0)}</span></button>)}
        <button type="button" className="lv-rpe-chip lv-rpe-more" aria-pressed={offQuick} aria-expanded={more} aria-label={t('live.rpe.more')} onClick={() => setMore((m) => !m)}>
          {offQuick ? <span className="num">{fmt.num(value, 1)}</span> : <span aria-hidden="true">…</span>}
        </button>
      </div>
      {more ? (
        <div className="lv-rpe-grid" role="group" aria-label={t('live.rpe.more')}>
          {all.map((v) => <button type="button" key={v} className="lv-rpe-chip" aria-pressed={value === v} onClick={() => { onChange(v); setMore(false); }}><span className="num">{fmt.num(v, 1)}</span></button>)}
        </div>
      ) : null}
    </div>
  );
}
