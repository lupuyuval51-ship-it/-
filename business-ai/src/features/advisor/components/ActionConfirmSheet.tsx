import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { BasisTag, Button, Divider, InlineNotice, Sheet, Text } from '@/components/ui';
import { formatDate, formatMoney } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import type { AppError } from '@/lib/errors';
import { spacing } from '@/theme/tokens';
import type { ActionPreview } from '../actions';

export interface ActionConfirmSheetProps {
  /** What will be written; null hides the sheet. */
  preview: ActionPreview | null;
  currency: string;
  submitting: boolean;
  error: AppError | null;
  online: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      {typeof children === 'string' ? (
        <Text variant="body" selectable>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

/** Shows exactly the row the app will write for a proposed action, and writes it on confirm. */
export function ActionConfirmSheet({ preview, currency, submitting, error, online, onConfirm, onClose }: ActionConfirmSheetProps) {
  const t = useT();
  const { locale } = useLocale();
  if (!preview) return <Sheet visible={false} onClose={onClose} />;

  const title =
    preview.kind === 'task'
      ? t('advisor.actions.confirm.taskTitle')
      : preview.kind === 'milestone'
        ? t('advisor.actions.confirm.milestoneTitle')
        : preview.kind === 'recurring_expense'
          ? t('advisor.actions.confirm.recurringExpenseTitle')
          : t('advisor.actions.confirm.startupCostTitle');

  const date = (value: string | null) => (value ? formatDate(value, locale, { style: 'long' }) : t('advisor.actions.confirm.noDueDate'));
  const rows: { label: string; value: ReactNode }[] = [];
  switch (preview.kind) {
    case 'task':
      rows.push(
        { label: t('advisor.actions.confirm.fields.title'), value: preview.title },
        { label: t('advisor.actions.confirm.fields.description'), value: preview.description || t('advisor.actions.confirm.noDescription') },
        { label: t('advisor.actions.confirm.fields.phase'), value: t(`advisor.phases.${preview.phase}`) },
        { label: t('advisor.actions.confirm.fields.priority'), value: t(`advisor.priorities.${preview.priority}`) },
        { label: t('advisor.actions.confirm.fields.dueDate'), value: date(preview.dueDate) },
      );
      break;
    case 'milestone':
      rows.push(
        { label: t('advisor.actions.confirm.fields.title'), value: preview.title },
        { label: t('advisor.actions.confirm.fields.phase'), value: t(`advisor.phases.${preview.phase}`) },
        { label: t('advisor.actions.confirm.fields.dueDate'), value: date(preview.targetDate) },
      );
      break;
    case 'recurring_expense':
    case 'startup_cost':
      rows.push(
        { label: t('advisor.actions.confirm.fields.label'), value: preview.label },
        {
          label: preview.kind === 'recurring_expense' ? t('advisor.actions.confirm.fields.monthlyAmount') : t('advisor.actions.confirm.fields.amount'),
          value: (
            <Text variant="body" numeric>
              {formatMoney(preview.kind === 'recurring_expense' ? preview.monthlyAmountMinor : preview.amountMinor, currency, locale)}
            </Text>
          ),
        },
        { label: t('advisor.actions.confirm.fields.basis'), value: <BasisTag basis={preview.basis} style={styles.tag} /> },
      );
      break;
  }
  rows.push({ label: t('advisor.actions.confirm.fields.source'), value: t('advisor.actions.confirm.sourceAdvisor') });

  const finance = preview.kind === 'recurring_expense' || preview.kind === 'startup_cost';

  return (
    <Sheet
      visible
      onClose={onClose}
      title={title}
      testID="advisor-action-sheet"
      footer={
        <Button
          label={t('advisor.actions.confirm.submit')}
          onPress={onConfirm}
          loading={submitting}
          disabled={!online}
          fullWidth
          testID="advisor-action-confirm"
        />
      }
    >
      <Text variant="callout" tone="secondary">
        {t('advisor.actions.confirm.intro')}
      </Text>
      <View>
        {rows.map((row, i) => (
          <View key={row.label}>
            {i > 0 ? <Divider spacing={3} /> : null}
            <Field label={row.label}>{row.value}</Field>
          </View>
        ))}
      </View>
      {finance ? (
        <Text variant="caption" tone="secondary">
          {t('advisor.actions.confirm.estimateNote')}
        </Text>
      ) : null}
      {!online ? <InlineNotice tone="warning" message={t('advisor.actions.offline')} /> : null}
      {error ? <InlineNotice tone="error" message={t(error.messageKey)} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: { gap: 2 },
  tag: { alignSelf: 'flex-start', marginTop: spacing[1] },
});
