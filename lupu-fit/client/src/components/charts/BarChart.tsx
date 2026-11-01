import type { ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import '../../styles/progress.css';

export interface BarItem { id: string; label: string; value: number }

/** Horizontal SVG bars (e.g. sets per muscle group). All-zero / empty data renders the honest empty state. The longest bar is full-strength, the rest are muted. */
export function BarChart({ items, ariaLabel, caption, labelHeader, valueHeader, unit }: { items: readonly BarItem[]; ariaLabel: string; caption: string; labelHeader: string; valueHeader: string; unit?: string }): ReactNode {
  const t = useT();
  const max = Math.max(0, ...items.map((i) => i.value));
  if (items.length === 0 || max <= 0) return <p className="chart-empty muted" role="note">{t('state.noData')}</p>;
  return (
    <figure className="chart">
      <div role="img" aria-label={ariaLabel} className="bars">
        {items.map((i) => (
          <div className={i.value === 0 ? 'bar-row bar-zero' : 'bar-row'} key={i.id} aria-hidden="true">
            <span className="bar-label small">{i.label}</span>
            <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="bar-svg" focusable="false">
              <rect className="bar-track" x="0" y="0" width="100" height="10" />
              <rect className={i.value === max ? 'bar-fill top' : 'bar-fill'} x="0" y="0" width={(i.value / max) * 100} height="10" />
            </svg>
            <span className="bar-value"><span className="num">{i.value}</span>{unit ? <small className="tiny muted"> {unit}</small> : null}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">{labelHeader}</th><th scope="col">{valueHeader}</th></tr></thead>
        <tbody>{items.map((i) => <tr key={i.id}><th scope="row">{i.label}</th><td>{i.value}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
