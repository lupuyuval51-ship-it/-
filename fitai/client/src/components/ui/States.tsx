import type { ReactNode } from 'react';
import { useI18n } from '../../i18n';
import { errorMessage } from '../../lib/errors';
import { Icon, type IconName } from './Icon';

export function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} role={label ? 'status' : undefined} aria-label={label}>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}

export function LoadingState({ label, compact }: { label?: string; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={`state state-loading${compact ? ' state-compact' : ''}`} role="status" aria-live="polite">
      <Spinner size={compact ? 20 : 28} />
      <span>{label ?? t('common.states.loading')}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, title, compact }: { error?: unknown; onRetry?: () => void; title?: string; compact?: boolean }) {
  const i18n = useI18n();
  return (
    <div className={`state state-error${compact ? ' state-compact' : ''}`} role="alert">
      <Icon name="warning" size={compact ? 20 : 28} />
      <strong>{title ?? i18n.t('common.states.error')}</strong>
      {error != null && <span className="muted">{errorMessage(error, i18n)}</span>}
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <Icon name="refresh" size={16} />
          <span className="btn-label">{i18n.t('common.actions.retry')}</span>
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'info', title, body, action, compact }: { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={`state state-empty${compact ? ' state-compact' : ''}`}>
      <span className="state-icon">
        <Icon name={icon} size={compact ? 22 : 32} />
      </span>
      <strong>{title}</strong>
      {body && <div className="muted">{body}</div>}
      {action}
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', radius = 8 }: { height?: number | string; width?: number | string; radius?: number }) {
  return <span className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />;
}

/** Renders loading / error / content for a react-query result. */
export function QueryState<T>({
  query,
  children,
  loading,
  empty,
  isEmpty,
}: {
  query: { data: T | undefined; isPending: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  children: (data: T) => ReactNode;
  loading?: ReactNode;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
}) {
  if (query.isPending) return <>{loading ?? <LoadingState />}</>;
  if (query.isError || query.data === undefined) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (empty && isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
