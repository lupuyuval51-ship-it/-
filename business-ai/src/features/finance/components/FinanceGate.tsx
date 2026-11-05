import type { ReactNode } from 'react';
import type { FinanceInputs } from '@domain/finance';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import type { FinanceLines, FinancialModelRow } from '../mapping';
import type { ActiveFinance } from '../hooks';

export interface ReadyFinance {
  businessId: string;
  inputs: FinanceInputs;
  model: FinancialModelRow;
  lines: FinanceLines;
  currency: string;
}

export function readyFinance(f: ActiveFinance): ReadyFinance | null {
  if (!f.businessId || !f.inputs || !f.model || !f.lines) return null;
  return { businessId: f.businessId, inputs: f.inputs, model: f.model, lines: f.lines, currency: f.currency };
}

/**
 * Loading / error / no-business states shared by every finance screen. Cached data (offline)
 * renders normally; an error is only shown when there is nothing cached to show.
 */
export function FinanceGate({ finance, children }: { finance: ActiveFinance; children: (ready: ReadyFinance) => ReactNode }) {
  const t = useT();
  const ready = readyFinance(finance);
  if (ready) return <>{children(ready)}</>;
  if (finance.error) return <ErrorState error={finance.error} onRetry={() => void finance.refetch()} retrying={finance.isRefetching} />;
  if (!finance.businessId && !finance.businessLoading) return <EmptyState title={t('common.states.emptyTitle')} />;
  return <LoadingState variant="screen" count={4} />;
}
