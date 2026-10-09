/**
 * Dependency-free responsive SVG charts. Charts render left-to-right in both languages
 * (time flows LTR in numeric charts); each includes a visually-hidden data table for
 * screen readers.
 */
import { useId, useMemo, useState, type ReactNode } from 'react';

export interface ChartPoint {
  /** Category / x label (already formatted for display). */
  label: string;
  value: number | null;
}

interface ChartProps {
  data: ChartPoint[];
  /** Accessible chart title. */
  title: string;
  height?: number;
  formatValue?: (v: number) => string;
  tone?: 'primary' | 'info' | 'success' | 'warning';
  /** Optional horizontal reference line (e.g. target). */
  reference?: { value: number; label: string };
  emptyMessage?: ReactNode;
}

const W = 600;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function scales(data: ChartPoint[], height: number, reference?: { value: number }, includeZero = true) {
  const values = data.map((d) => d.value).filter((v): v is number => v != null);
  if (reference) values.push(reference.value);
  const rawMax = Math.max(...values, 0);
  const rawMin = includeZero ? 0 : Math.min(...values);
  const span = rawMax - rawMin || Math.abs(rawMax) || 1;
  const min = includeZero ? 0 : Math.max(0, rawMin - span * 0.15);
  const max = includeZero ? niceMax(rawMax * 1.05) : rawMax + span * 0.15;
  const innerH = height - PAD.top - PAD.bottom;
  const innerW = W - PAD.left - PAD.right;
  const y = (v: number) => PAD.top + innerH - ((v - min) / (max - min || 1)) * innerH;
  return { min, max, y, innerW, innerH };
}

function labelEvery(n: number): number {
  return Math.max(1, Math.ceil(n / 8));
}

function DataTable({ data, title, formatValue }: { data: ChartPoint[]; title: string; formatValue: (v: number) => string }) {
  return (
    <table className="visually-hidden">
      <caption>{title}</caption>
      <tbody>
        {data.map((d, i) => (
          <tr key={i}>
            <th scope="row">{d.label}</th>
            <td>{d.value == null ? '—' : formatValue(d.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function LineChart({ data, title, height = 220, formatValue = (v) => String(Math.round(v * 10) / 10), tone = 'primary', reference, emptyMessage }: ChartProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const points = data.filter((d) => d.value != null);
  const s = useMemo(() => scales(data, height, reference, false), [data, height, reference]);
  if (points.length === 0) return <div className="chart-empty">{emptyMessage}</div>;
  const step = data.length > 1 ? s.innerW / (data.length - 1) : 0;
  const x = (i: number) => PAD.left + (data.length > 1 ? i * step : s.innerW / 2);
  const path = data
    .map((d, i) => (d.value == null ? null : `${x(i)},${s.y(d.value)}`))
    .filter(Boolean)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`)
    .join(' ');
  const ticks = [s.min, (s.min + s.max) / 2, s.max];
  const every = labelEvery(data.length);
  const hovered = hover != null ? data[hover] : null;
  return (
    <figure className="chart" dir="ltr">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-labelledby={`${id}-t`} className={`chart-svg chart-${tone}`} onMouseLeave={() => setHover(null)}>
        <title id={`${id}-t`}>{title}</title>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={s.y(t)} y2={s.y(t)} className="chart-grid" />
            <text x={PAD.left - 6} y={s.y(t) + 4} textAnchor="end" className="chart-axis">
              {formatValue(t)}
            </text>
          </g>
        ))}
        {reference && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={s.y(reference.value)} y2={s.y(reference.value)} className="chart-ref" />
            <text x={W - PAD.right} y={s.y(reference.value) - 4} textAnchor="end" className="chart-ref-label">
              {reference.label}
            </text>
          </g>
        )}
        <path d={path} className="chart-line" fill="none" />
        {data.map((d, i) =>
          d.value == null ? null : (
            <circle key={i} cx={x(i)} cy={s.y(d.value)} r={hover === i ? 5 : 3.5} className="chart-dot" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} tabIndex={-1} />
          ),
        )}
        {data.map((d, i) =>
          i % every === 0 || i === data.length - 1 ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="chart-axis">
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      {hovered && hovered.value != null && (
        <div className="chart-tooltip">
          {hovered.label}: <strong>{formatValue(hovered.value)}</strong>
        </div>
      )}
      <DataTable data={data} title={title} formatValue={formatValue} />
    </figure>
  );
}

export function BarChart({ data, title, height = 200, formatValue = (v) => String(Math.round(v * 10) / 10), tone = 'primary', reference, emptyMessage }: ChartProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const s = useMemo(() => scales(data, height, reference, true), [data, height, reference]);
  if (!data.length || data.every((d) => !d.value)) return <div className="chart-empty">{emptyMessage}</div>;
  const band = s.innerW / data.length;
  const barW = Math.max(2, Math.min(36, band * 0.7));
  const every = labelEvery(data.length);
  const hovered = hover != null ? data[hover] : null;
  return (
    <figure className="chart" dir="ltr">
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-labelledby={`${id}-t`} className={`chart-svg chart-${tone}`} onMouseLeave={() => setHover(null)}>
        <title id={`${id}-t`}>{title}</title>
        {[s.min, s.max / 2, s.max].map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={s.y(t)} y2={s.y(t)} className="chart-grid" />
            <text x={PAD.left - 6} y={s.y(t) + 4} textAnchor="end" className="chart-axis">
              {formatValue(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const v = d.value ?? 0;
          const x = PAD.left + i * band + (band - barW) / 2;
          const y = s.y(v);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(0, PAD.top + s.innerH - y)}
              rx={3}
              className={`chart-bar${hover === i ? ' chart-bar-hover' : ''}`}
              onMouseEnter={() => setHover(i)}
            />
          );
        })}
        {reference && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={s.y(reference.value)} y2={s.y(reference.value)} className="chart-ref" />
            <text x={W - PAD.right} y={s.y(reference.value) - 4} textAnchor="end" className="chart-ref-label">
              {reference.label}
            </text>
          </g>
        )}
        {data.map((d, i) =>
          i % every === 0 || i === data.length - 1 ? (
            <text key={i} x={PAD.left + i * band + band / 2} y={height - 8} textAnchor="middle" className="chart-axis">
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      {hovered && (
        <div className="chart-tooltip">
          {hovered.label}: <strong>{formatValue(hovered.value ?? 0)}</strong>
        </div>
      )}
      <DataTable data={data} title={title} formatValue={formatValue} />
    </figure>
  );
}
