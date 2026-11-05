/**
 * `/finance/proposal` — review AI-proposed assumptions (from plan generation or a fresh
 * `finance.propose` call). Each item is accepted or skipped explicitly; accepted lines are saved
 * with basis `ai_estimate`; starting capital changes only when its item is accepted.
 */
import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FinanceProposal } from '@domain/ai-api';
import { BasisTag, Button, EmptyState, ErrorState, InlineNotice, LoadingState, Screen, Section, Text, useNotice } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { toAppError } from '@/lib/errors';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useAcceptProposalItems, useActiveProposal, useProposeAssumptions, useSkipProposalItems } from '../api';
import { FinanceGate, readyFinance, type ReadyFinance } from '../components/FinanceGate';
import { useActiveFinance, useFinanceFormat, type FinanceFormat } from '../hooks';
import type { ProposalItem } from '../mapping';

export default function ProposalScreen() {
  const t = useT();
  const finance = useActiveFinance();
  const ready = readyFinance(finance);
  return ready ? (
    <ProposalContent ready={ready} />
  ) : (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: t('finance.proposal.title') }} />
      <FinanceGate finance={finance}>{() => null}</FinanceGate>
    </Screen>
  );
}

function ProposalContent({ ready }: { ready: ReadyFinance }) {
  const t = useT();
  const notice = useNotice();
  const online = useIsOnline();
  const format = useFinanceFormat(ready.currency);
  const active = useActiveProposal(ready.businessId);
  const propose = useProposeAssumptions(ready.businessId);
  const accept = useAcceptProposalItems(ready.businessId, t('finance.proposal.fallbackLabel'));
  const skip = useSkipProposalItems(ready.businessId);
  const pending = active.pending;

  const acceptItems = async (items: readonly ProposalItem[]) => {
    try {
      const count = await accept.mutateAsync(items);
      notice.show({ message: items.length === 1 ? t('finance.proposal.accepted') : t('finance.proposal.acceptedAll', { count }) });
    } catch {
      // Shown inline.
    }
  };

  const askButton = (variant: 'primary' | 'quiet') => (
    <Button
      variant={variant}
      inline={variant === 'quiet'}
      label={variant === 'primary' ? t('finance.proposal.askAi') : t('finance.proposal.askAgain')}
      onPress={() => propose.mutate()}
      loading={propose.isPending}
      disabled={!online || accept.isPending}
      testID="finance-proposal-ask"
    />
  );
  const proposeError = propose.error ? <InlineNotice tone="error" message={t(toAppError(propose.error).messageKey)} /> : null;

  let body: ReactNode;
  let footer: ReactNode;
  if (active.isLoading) body = <LoadingState variant="list" count={4} />;
  else if (active.error && !active.proposal) body = <ErrorState error={active.error} onRetry={() => void active.refetch()} />;
  else if (!active.proposal) {
    body = (
      <>
        <EmptyState title={t('finance.proposal.noneTitle')} body={t('finance.proposal.noneBody')} testID="finance-proposal-none" />
        {askButton('primary')}
        {proposeError}
      </>
    );
  } else if (pending.length === 0) {
    body = (
      <>
        <EmptyState
          icon="check-circle"
          title={t('finance.proposal.reviewedTitle')}
          body={t('finance.proposal.reviewedBody')}
          action={{ label: t('finance.proposal.backToFinance'), onPress: () => router.replace('/finance'), variant: 'secondary' }}
          testID="finance-proposal-reviewed"
        />
        <View style={styles.center}>{askButton('quiet')}</View>
        {proposeError}
      </>
    );
  } else {
    footer = (
      <Button
        label={t('finance.proposal.acceptAll')}
        onPress={() => void acceptItems(pending)}
        loading={accept.isPending && (accept.variables?.length ?? 0) > 1}
        disabled={!online || accept.isPending || propose.isPending}
        fullWidth
        testID="finance-proposal-accept-all"
      />
    );
    body = (
      <PendingItems
        proposal={active.proposal}
        pending={pending}
        ready={ready}
        format={format}
        busyKey={accept.isPending && accept.variables?.length === 1 ? (accept.variables[0]?.key ?? null) : null}
        disabled={!online || accept.isPending || propose.isPending}
        onAccept={(item) => void acceptItems([item])}
        onSkip={(item) => {
          skip([item]);
          notice.show({ message: t('finance.proposal.skipped'), tone: 'info' });
        }}
        footer={
          <>
            {accept.error ? <InlineNotice tone="error" message={t(accept.error.messageKey)} /> : null}
            {!online ? <InlineNotice tone="info" message={t('errors.offline')} /> : null}
            <View style={styles.center}>{askButton('quiet')}</View>
            {proposeError}
          </>
        }
      />
    );
  }

  return (
    <Screen edges={['bottom']} footer={footer} testID="finance-proposal">
      <Stack.Screen options={{ title: t('finance.proposal.title') }} />
      {body}
    </Screen>
  );
}

function PendingItems({
  proposal,
  pending,
  ready,
  format,
  busyKey,
  disabled,
  onAccept,
  onSkip,
  footer,
}: {
  proposal: FinanceProposal;
  pending: ProposalItem[];
  ready: ReadyFinance;
  format: FinanceFormat;
  busyKey: string | null;
  disabled: boolean;
  onAccept: (item: ProposalItem) => void;
  onSkip: (item: ProposalItem) => void;
  footer: ReactNode;
}) {
  const t = useT();
  const capital = pending.find((i) => i.kind === 'capital');
  const groups = (['startup', 'expense', 'revenue'] as const)
    .map((kind) => ({ kind, items: pending.filter((i) => i.kind === kind) }))
    .filter((g) => g.items.length > 0);

  const row = (item: ProposalItem, title: string, value: string, detail?: string) => (
    <ProposalRow
      key={item.key}
      title={title}
      value={value}
      detail={detail}
      busy={busyKey === item.key}
      disabled={disabled}
      onAccept={() => onAccept(item)}
      onSkip={() => onSkip(item)}
      testID={`finance-proposal-item-${item.kind}`}
    />
  );

  return (
    <>
      <Text variant="body" tone="secondary">
        {t('finance.proposal.intro')}
      </Text>
      {proposal.notes.trim() !== '' ? (
        <View style={styles.notes}>
          <View style={styles.notesHeader}>
            <Text variant="overline" tone="secondary">
              {t('finance.proposal.notes')}
            </Text>
            <BasisTag basis="ai_estimate" />
          </View>
          <Text variant="callout">{proposal.notes}</Text>
        </View>
      ) : null}

      {capital && capital.kind === 'capital' ? (
        <Section title={t('finance.proposal.capital')} separated>
          {row(
            capital,
            t('finance.proposal.capital'),
            format.money(capital.amountMinor),
            t('finance.proposal.capitalBody', { current: format.money(ready.model.starting_capital_minor) }),
          )}
        </Section>
      ) : null}

      {groups.map((g) => (
        <Section key={g.kind} title={t(`finance.proposal.groups.${g.kind}`)} separated>
          {g.items.map((item) => {
            if (item.kind === 'startup') return row(item, item.item.label || t('finance.proposal.fallbackLabel'), format.money(item.item.amountMinor), item.item.category || undefined);
            if (item.kind === 'expense')
              return row(
                item,
                item.item.label || t('finance.proposal.fallbackLabel'),
                t('finance.sections.perMonth', { amount: format.money(item.item.monthlyAmountMinor) }),
                item.item.category || undefined,
              );
            if (item.kind === 'revenue') {
              const s = item.item;
              const detail = [
                t('finance.proposal.revenueDetail', {
                  price: format.money(s.unitPriceMinor),
                  cost: format.money(s.unitVariableCostMinor),
                  units: format.qty(s.monthlyUnits),
                }),
                s.monthlyGrowthPct !== 0 ? t('finance.proposal.growthDetail', { pct: format.pct(s.monthlyGrowthPct) ?? '' }) : null,
              ]
                .filter(Boolean)
                .join(' · ');
              return row(item, s.label || t('finance.proposal.fallbackLabel'), format.money(s.unitPriceMinor), detail);
            }
            return null;
          })}
        </Section>
      ))}
      {footer}
    </>
  );
}

function ProposalRow({
  title,
  value,
  detail,
  busy,
  disabled,
  onAccept,
  onSkip,
  testID,
}: {
  title: string;
  value: string;
  detail?: string;
  busy: boolean;
  disabled: boolean;
  onAccept: () => void;
  onSkip: () => void;
  testID?: string;
}) {
  const t = useT();
  return (
    <View style={styles.item} testID={testID}>
      <View style={styles.itemTop} accessible accessibilityLabel={[title, value, detail, t('common.basis.ai_estimate')].filter(Boolean).join(', ')}>
        <View style={styles.itemText}>
          <Text variant="body">{title}</Text>
          <BasisTag basis="ai_estimate" />
          {detail ? (
            <Text variant="caption" tone="secondary" numeric>
              {detail}
            </Text>
          ) : null}
        </View>
        <Text variant="bodyStrong" numeric style={styles.itemValue}>
          {value}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <Button variant="secondary" size="compact" label={t('finance.proposal.accept')} onPress={onAccept} loading={busy} disabled={disabled} accessibilityHint={title} />
        <Button variant="quiet" size="compact" label={t('finance.proposal.skip')} onPress={onSkip} disabled={disabled} accessibilityHint={title} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  notes: { gap: spacing[2] },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  item: { gap: spacing[3], paddingVertical: spacing[3] },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  itemText: { flex: 1, gap: spacing[1], alignItems: 'flex-start' },
  itemValue: { maxWidth: '45%' },
  itemActions: { flexDirection: 'row', gap: spacing[2] },
});
