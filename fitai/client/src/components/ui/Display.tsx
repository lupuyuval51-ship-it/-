import { useId, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from './Icon';

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  as: Tag = 'section',
  padded = true,
  id,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
  padded?: boolean;
  id?: string;
}) {
  const headingId = useId();
  return (
    <Tag className={`card${padded ? '' : ' card-flush'}${className ? ` ${className}` : ''}`} aria-labelledby={title ? headingId : undefined} id={id}>
      {(title || actions) && (
        <header className="card-header">
          <div>
            {title && (
              <h2 className="card-title" id={headingId}>
                {title}
              </h2>
            )}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function PageHeader({ title, subtitle, actions, backTo, backLabel }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; backTo?: string; backLabel?: string }) {
  return (
    <header className="page-header">
      {backTo && (
        <Link to={backTo} className="back-link">
          <Icon name="chevronLeft" size={18} />
          <span>{backLabel}</span>
        </Link>
      )}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </header>
  );
}

export function Badge({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'; icon?: IconName }) {
  return (
    <span className={`badge badge-${tone}`}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export function ProgressBar({ value, max = 1, label, tone = 'primary', showOver = true }: { value: number; max?: number; label?: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info'; showOver?: boolean }) {
  const ratio = max > 0 ? value / max : 0;
  const pct = Math.max(0, Math.min(100, ratio * 100));
  const over = showOver && ratio > 1.05;
  return (
    <div
      className={`progress progress-${over ? 'warning' : tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
    >
      <span className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ProgressRing({ value, max = 1, size = 96, stroke = 9, children, label, tone = 'primary' }: { value: number; max?: number; size?: number; stroke?: number; children?: ReactNode; label?: string; tone?: 'primary' | 'success' | 'info' | 'warning' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={`ring-fill ring-${tone}`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}

export function Stat({ label, value, hint, icon, tone }: { label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: IconName; tone?: 'primary' | 'success' | 'warning' | 'info' }) {
  return (
    <div className={`stat${tone ? ` stat-${tone}` : ''}`}>
      {icon && (
        <span className="stat-icon">
          <Icon name={icon} size={18} />
        </span>
      )}
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { value: T; label: ReactNode }[]; value: T; onChange(v: T): void; label: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={`tab${value === tab.value ? ' tab-active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Notice({ tone = 'info', icon, title, children }: { tone?: 'info' | 'warning' | 'success' | 'danger'; icon?: IconName; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'note'}>
      <Icon name={icon ?? (tone === 'success' ? 'check' : tone === 'info' ? 'info' : 'warning')} size={18} />
      <div>
        {title && <strong className="notice-title">{title}</strong>}
        {children && <div className="notice-body">{children}</div>}
      </div>
    </div>
  );
}
