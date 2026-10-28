/**
 * Dependency-free responsive SVG charts. Charts render left-to-right in both languages
 * (time flows LTR in numeric charts); each includes a visually-hidden data table for
 * screen readers.
 */
import { useEffect, useId, useMemo, useState, type KeyboardEvent as _KE, type ReactNode } from 'react';

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

/** Default drawing width (used until the container is measured, e.g. in tests). */
const DEFAULT_W = 600;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/**
 * Draws the SVG at the container's real pixel width so axis labels keep their CSS font size
 * on phones (a fixed 600-unit viewBox shrank 11px labels to ~5px at 360px).
 */
function useChartSize(height: number) {
  // Callback ref: the figure mounts later when the chart starts out empty.
  const [el, ref] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_W);
  useEffect(() => {
    if (!el) return;
    const measure = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      if (w > 0) setWidth(w);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  const h = width < 480 ? Math.max(140, Math.round(height * 0.75)) : height;
  return { ref, W: width, height: h };
}

/** Which x labels to draw: evenly spaced, always the last, never two that would collide. */
function showLabel(i: number, n: number, every: number): boolean {
  if (i === n - 1) return true;
  return i % every === 0 && n - 1 - i >= Math.max(1, Math.ceil(every / 2));
}

function scales(data: ChartPoint[], height: number, W: number, reference?: { value: number }, includeZero = true) {
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

function labelEvery(n: number, W: number): number {
  const fit = Math.max(2, Math.floor((W - PAD.left - PAD.right) / 64));
  return Math.max(1, Math.ceil(n / fit));
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

/** Floating tooltip anchored above a data point; clamped so it never leaves the chart. */
function Tooltip({ x, y, W, label, value }: { x: number; y: number; W: number; label: string; value: string }) {
  const half = 64;
  const left = Math.max(half, Math.min(W - half, x));
  return (
    <div className="chart-tip" style={{ insetInlineStart: left, insetBlockStart: Math.max(0, y - 10) }} role="status">
      <span className="chart-tip-label">{label}</span>
      <strong className="chart-tip-value num">{value}</strong>
    </div>
  );
}

/** Left/right arrows move the active point so keyboard users get the same tooltip as hover. */
function useArrowKeys(count: number, setHover: (fn: (i: number | null) => number | null) => void) {
  return (e: _KE<Element>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    setHover((i) => (e.key === 'Home' ? 0 : e.key === 'End' ? count - 1 : Math.max(0, Math.min(count - 1, (i ?? (e.key === 'ArrowRight' ? -1 : count)) + (e.key === 'ArrowRight' ? 1 : -1)))));
  };
}

export function LineChart({ data, title, height: baseHeight = 220, formatValue = (v) => String(Math.round(v * 10) / 10), tone = 'primary', reference, emptyMessage }: ChartProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const { ref, W, height } = useChartSize(baseHeight);
  const points = data.filter((d) => d.value != null);
  const s = useMemo(() => scales(data, height, W, reference, false), [data, height, W, reference]);
  if (points.length === 0) return <div className="chart-empty">{emptyMessage}</div>;
  const step = data.length > 1 ? s.innerW / (data.length - 1) : 0;
  const x = (i: number) => PAD.left + (data.length > 1 ? i * step : s.innerW / 2);
  const path = data
    .map((d, i) => (d.value == null ? null : `${x(i)},${s.y(d.value)}`))
    .filter(Boolean)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`)
    .join(' ');
  const ticks = [s.min, (s.min + s.max) / 2, s.max];
  const every = labelEvery(data.length, W);
  const hovered = hover != null ? data[hover] : null;
  const onKey = useArrowKeys(data.length, setHover);
  const baseY = PAD.top + s.innerH;
  const firstI = data.findIndex((d) => d.value != null);
  const lastI = data.length - 1 - [...data].reverse().findIndex((d) => d.value != null);
  const area = `${path} L${x(lastI)},${baseY} L${x(firstI)},${baseY} Z`;
  return (
    <figure className="chart" dir="ltr" ref={ref}>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-labelledby={`${id}-t`} className={`chart-svg chart-${tone}`} tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)} onMouseLeave={() => setHover(null)}>
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
        {points.length > 1 && <path d={area} className="chart-area" />}
        {hover != null && data[hover]?.value != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={baseY} className="chart-cursor" />}
        <path d={path} className="chart-line" fill="none" />
        {data.map((d, i) =>
          d.value == null ? null : (
            <circle key={i} cx={x(i)} cy={s.y(d.value)} r={hover === i ? 5.5 : data.length > 40 ? 0 : 3.5} className={`chart-dot${hover === i ? ' chart-dot-active' : ''}`} />
          ),
        )}
        {data.map((d, i) => (d.value == null ? null : <rect key={`h${i}`} x={x(i) - Math.max(step, 12) / 2} y={PAD.top} width={Math.max(step, 12)} height={s.innerH} fill="transparent" onMouseEnter={() => setHover(i)} onPointerDown={() => setHover(i)} />))}
        {data.map((d, i) =>
          showLabel(i, data.length, every) ? (
            <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className="chart-axis">
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      {hovered && hover != null && hovered.value != null && <Tooltip x={x(hover)} y={s.y(hovered.value)} W={W} label={hovered.label} value={formatValue(hovered.value)} />}
      <DataTable data={data} title={title} formatValue={formatValue} />
    </figure>
  );
}

export function BarChart({ data, title, height: baseHeight = 200, formatValue = (v) => String(Math.round(v * 10) / 10), tone = 'primary', reference, emptyMessage }: ChartProps) {
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const { ref, W, height } = useChartSize(baseHeight);
  const s = useMemo(() => scales(data, height, W, reference, true), [data, height, W, reference]);
  if (!data.length || data.every((d) => !d.value)) return <div className="chart-empty">{emptyMessage}</div>;
  const band = s.innerW / data.length;
  const barW = Math.max(2, Math.min(36, band * 0.7));
  const every = labelEvery(data.length, W);
  const hovered = hover != null ? data[hover] : null;
  const onKey = useArrowKeys(data.length, setHover);
  return (
    <figure className="chart" dir="ltr" ref={ref}>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-labelledby={`${id}-t`} className={`chart-svg chart-${tone}`} tabIndex={0} onKeyDown={onKey} onBlur={() => setHover(null)} onMouseLeave={() => setHover(null)}>
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
              rx={Math.min(5, barW / 2)}
              className={`chart-bar${hover === i ? ' chart-bar-hover' : ''}${reference && v >= reference.value ? ' chart-bar-met' : ''}`}
            />
          );
        })}
        {data.map((_, i) => (
          <rect key={`h${i}`} x={PAD.left + i * band} y={PAD.top} width={band} height={s.innerH} fill="transparent" onMouseEnter={() => setHover(i)} onPointerDown={() => setHover(i)} />
        ))}
        {data.map(() => {
          return null;
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
          showLabel(i, data.length, every) ? (
            <text key={i} x={PAD.left + i * band + band / 2} y={height - 8} textAnchor="middle" className="chart-axis">
              {d.label}
            </text>
          ) : null,
        )}
      </svg>
      {hovered && hover != null && <Tooltip x={PAD.left + hover * band + band / 2} y={s.y(hovered.value ?? 0)} W={W} label={hovered.label} value={formatValue(hovered.value ?? 0)} />}
      <DataTable data={data} title={title} formatValue={formatValue} />
    </figure>
  );
}
