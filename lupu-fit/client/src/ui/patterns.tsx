import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { cx } from './kit.tsx';
import { IconChevron } from './icons.tsx';
import { useT } from '../i18n/index.tsx';

/** Page title row: one H1, optional subtitle and a single trailing action. Every screen starts with this. */
export function PageHeader({ title, subtitle, action, back }: { title: string; subtitle?: string; action?: ReactNode; back?: string }): ReactNode {
  const nav = useNavigate(); const t = useT();
  return (
    <header className="page-head">
      <div className="row" style={{ minInlineSize: 0 }}>
        {back ? <button type="button" className="icon-btn" aria-label={t('action.back')} onClick={() => nav(back)}><IconChevron className="flip-rtl-back" /></button> : null}
        <div className="stack-sm" style={{ minInlineSize: 0 }}><h1>{title}</h1>{subtitle ? <p className="muted small">{subtitle}</p> : null}</div>
      </div>
      {action}
    </header>
  );
}

/** Content-shaped placeholder shown while loading: no spinner flash, no layout jump. */
export function Skeleton({ lines = 3, height }: { lines?: number; height?: string }): ReactNode {
  return <div className="skeleton-block" aria-hidden="true">{Array.from({ length: lines }, (_, i) => <i key={i} className="skeleton" style={height ? { blockSize: height } : undefined} />)}</div>;
}
export function SkeletonCard(): ReactNode { return <div className="card" role="status" aria-busy="true"><Skeleton lines={3} /></div>; }
export function SkeletonList({ rows = 5 }: { rows?: number }): ReactNode { return <div className="stack" role="status" aria-busy="true">{Array.from({ length: rows }, (_, i) => <div key={i} className="card"><Skeleton lines={2} /></div>)}</div>; }

/** Big-number stat: label above, value in the numeric face, optional unit and hint. */
export function StatTile({ label, value, unit, hint, tone }: { label: string; value: ReactNode; unit?: string; hint?: string; tone?: 'success' | 'warning' | 'danger' }): ReactNode {
  return (
    <div className="stat-tile">
      <span className="tiny muted">{label}</span>
      <span className={cx('num-lg', tone)}>{value}{unit ? <small className="muted small"> {unit}</small> : null}</span>
      {hint ? <span className="tiny muted">{hint}</span> : null}
    </div>
  );
}

/** Pinned primary action. On phones it floats above the bottom nav so the ONE orange button is always in thumb reach. */
export function StickyAction({ children }: { children: ReactNode }): ReactNode { return <div className="sticky-cta">{children}</div>; }

/** Numbered progress of a multi-step flow, with a text alternative. */
export function StepDots({ current, total, label }: { current: number; total: number; label: string }): ReactNode {
  return <div className="step-dots" role="img" aria-label={label}>{Array.from({ length: total }, (_, i) => <i key={i} className={cx(i < current && 'done', i === current && 'now')} />)}</div>;
}

/** Collapsible detail so dense screens stay scannable (native <details>: keyboard + screen-reader friendly). */
export function Disclosure({ summary, children, open }: { summary: string; children: ReactNode; open?: boolean }): ReactNode {
  return <details className="disclosure" {...(open ? { open: true } : {})}><summary>{summary}</summary><div className="stack" style={{ marginBlockStart: '0.75rem' }}>{children}</div></details>;
}

/** Shows `children` only after `ms`, so fast requests never flash a loader. */
export function Delayed({ ms = 200, children }: { ms?: number; children: ReactNode }): ReactNode {
  const [on, setOn] = useState(false);
  useEffect(() => { const id = setTimeout(() => setOn(true), ms); return () => clearTimeout(id); }, [ms]);
  return on ? children : null;
}
