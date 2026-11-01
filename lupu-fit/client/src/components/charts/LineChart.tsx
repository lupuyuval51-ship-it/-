import type { ReactNode } from 'react';
import { useT } from '../../i18n/index.tsx';
import '../../styles/progress.css';

export interface LinePoint { x: string; y: number }
export interface LineSeries { id: string; label: string; points: readonly LinePoint[]; /** 'main' = --text line, 'accent' = --tally-active dots/line */ tone?: 'main' | 'accent'; dotsOnly?: boolean }

const W = 320; const H = 140; const PAD = 8;
const time = (x: string): number => Date.parse(x.length === 10 ? `${x}T12:00:00Z` : x);

/**
 * Dependency-free SVG line chart. Never draws invented points: with fewer than `minPoints` real points in every
 * series it renders the honest empty state instead. Accessible: role="img" + aria-label summary, and a visually
 * hidden table with the exact data.
 */
export function LineChart({ series, ariaLabel, caption, xHeader, unit, minPoints = 2, decimals = 1, formatX }: { series: readonly LineSeries[]; ariaLabel: string; caption: string; xHeader: string; unit?: string; minPoints?: number; decimals?: number; formatX?: (x: string) => string }): ReactNode {
  const t = useT();
  const usable = series.filter((s) => s.points.length >= minPoints || (s.dotsOnly && s.points.length >= 1));
  const lineSeries = series.filter((s) => s.points.length >= minPoints);
  if (lineSeries.length === 0) return <p className="chart-empty muted" role="note">{t('state.noData')}</p>;
  const all = usable.flatMap((s) => s.points);
  const xs = all.map((p) => time(p.x)); const ys = all.map((p) => p.y);
  const x0 = Math.min(...xs); const x1 = Math.max(...xs);
  let y0 = Math.min(...ys); let y1 = Math.max(...ys);
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const px = (x: string) => PAD + (x1 === x0 ? (W - 2 * PAD) / 2 : ((time(x) - x0) / (x1 - x0)) * (W - 2 * PAD));
  const py = (y: number) => H - PAD - ((y - y0) / (y1 - y0)) * (H - 2 * PAD);
  const fmtN = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n);
  const dates = [...new Set(all.map((p) => p.x))].sort();
  const fx = formatX ?? ((x: string) => x);
  const firstX = fx(dates[0] ?? ''); const lastX = fx(dates[dates.length - 1] ?? '');
  const ymin = Math.min(...ys); const ymaxV = Math.max(...ys);
  return (
    <figure className="chart">
      {unit ? <span className="tiny muted chart-unit">{unit}</span> : null}
      <div className="chart-plot">
        <div className="chart-yaxis tiny muted num" aria-hidden="true"><span>{fmtN(ymaxV)}</span><span>{fmtN((ymaxV + ymin) / 2)}</span><span>{fmtN(ymin)}</span></div>
        <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${W} ${H}`} className="chart-svg" focusable="false">
          {[0, 1, 2, 3].map((i) => <line key={i} className="chart-grid" x1={PAD} x2={W - PAD} y1={PAD + (i * (H - 2 * PAD)) / 3} y2={PAD + (i * (H - 2 * PAD)) / 3} />)}
          {usable.map((s) => {
            const cls = s.tone === 'accent' ? 'chart-line accent' : 'chart-line';
            const pts = [...s.points].sort((a, b) => time(a.x) - time(b.x));
            const last = pts[pts.length - 1];
            return (
              <g key={s.id} aria-hidden="true">
                {!s.dotsOnly && pts.length >= minPoints ? <polyline className={cls} points={pts.map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')} /> : null}
                {s.dotsOnly ? pts.map((p) => <circle key={p.x} className="chart-dot muted-dot" cx={px(p.x)} cy={py(p.y)} r={2.5} />) : null}
                {!s.dotsOnly && last ? <circle className="chart-dot accent" cx={px(last.x)} cy={py(last.y)} r={4} /> : null}
              </g>
            );
          })}
        </svg>
        <div className="chart-xs tiny muted num" aria-hidden="true"><span>{firstX}</span><span>{lastX}</span></div>
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">{xHeader}</th>{usable.map((s) => <th scope="col" key={s.id}>{s.label}</th>)}</tr></thead>
        <tbody>
          {dates.map((d) => <tr key={d}><th scope="row">{d}</th>{usable.map((s) => { const p = s.points.find((q) => q.x === d); return <td key={s.id}>{p ? fmtN(p.y) : ''}</td>; })}</tr>)}
        </tbody>
      </table>
    </figure>
  );
}
