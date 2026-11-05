/**
 * `/finance/pricing` — pricing calculator. Mode A: unit cost + target margin → suggested price.
 * Mode B: price + unit cost → margin, markup, contribution. Nothing is saved unless the user
 * explicitly applies the price to a revenue stream.
 */
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { grossMarginPct, markupPct, priceForTargetMargin, unitContributionMinor } from '@domain/finance';
import { Button, InlineNotice, ListRow, Screen, Section, SegmentedControl, Sheet, Text, TextField, useNotice } from '@/components/ui';
import { parseMoneyInput } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useIsOnline } from '@/lib/net';
import { spacing } from '@/theme/tokens';
import { useSetRevenueStreamPrice } from '../api';
import { FigureRow } from '../components/FigureRow';
import { FinanceGate, readyFinance, type ReadyFinance } from '../components/FinanceGate';
import { useActiveFinance, useFinanceFormat } from '../hooks';
import { parseTargetMargin, reformatMoneyText } from '../mapping';

type Mode = 'target' | 'check';

export default function PricingScreen() {
  const t = useT();
  const finance = useActiveFinance();
  const ready = readyFinance(finance);
  return (
    <Screen edges={['bottom']} testID="finance-pricing">
      <Stack.Screen options={{ title: t('finance.pricing.title') }} />
      {ready ? <PricingContent ready={ready} /> : <FinanceGate finance={finance}>{() => null}</FinanceGate>}
    </Screen>
  );
}

function MoneyInput({ label, value, onChange, currency, testID }: { label: string; value: string; onChange: (v: string) => void; currency: string; testID: string }) {
  const t = useT();
  const { locale } = useLocale();
  const invalid = value.trim() !== '' && parseMoneyInput(value, currency) === null;
  return (
    <TextField
      mode="money"
      currency={currency}
      label={label}
      value={value}
      onChangeText={onChange}
      onBlur={() => onChange(reformatMoneyText(value, currency, locale))}
      error={invalid ? t('errors.field.amountInvalid') : undefined}
      testID={testID}
    />
  );
}

function PricingContent({ ready }: { ready: ReadyFinance }) {
  const t = useT();
  const { currency } = ready;
  const format = useFinanceFormat(currency);
  const [mode, setMode] = useState<Mode>('target');
  const [costText, setCostText] = useState('');
  const [marginText, setMarginText] = useState('');
  const [priceText, setPriceText] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);

  const cost = costText.trim() === '' ? null : parseMoneyInput(costText, currency);
  const margin = marginText.trim() === '' ? null : parseTargetMargin(marginText);
  const enteredPrice = priceText.trim() === '' ? null : parseMoneyInput(priceText, currency);
  const marginInvalid = marginText.trim() !== '' && margin === null;

  const result = useMemo(() => {
    if (cost === null) return null;
    if (mode === 'target') {
      if (margin === null) return null;
      const price = priceForTargetMargin(cost, margin);
      if (price === null) return null;
      return { price, margin: grossMarginPct(price, cost), markup: markupPct(price, cost), contribution: unitContributionMinor(price, cost) };
    }
    if (enteredPrice === null) return null;
    return {
      price: enteredPrice,
      margin: grossMarginPct(enteredPrice, cost),
      markup: markupPct(enteredPrice, cost),
      contribution: unitContributionMinor(enteredPrice, cost),
    };
  }, [mode, cost, margin, enteredPrice]);

  const na = t('finance.line.metrics.notApplicable');

  return (
    <>
      <Text variant="body" tone="secondary">
        {t('finance.pricing.intro')}
      </Text>
      <SegmentedControl
        accessibilityLabel={t('finance.pricing.title')}
        options={[
          { value: 'target', label: t('finance.pricing.modeTarget') },
          { value: 'check', label: t('finance.pricing.modeCheck') },
        ]}
        value={mode}
        onChange={setMode}
        testID="finance-pricing-mode"
      />
      <View style={styles.fields}>
        {mode === 'check' ? (
          <MoneyInput label={t('finance.pricing.price')} value={priceText} onChange={setPriceText} currency={currency} testID="finance-pricing-price" />
        ) : null}
        <MoneyInput label={t('finance.pricing.unitCost')} value={costText} onChange={setCostText} currency={currency} testID="finance-pricing-cost" />
        {mode === 'target' ? (
          <TextField
            mode="number"
            label={t('finance.pricing.targetMargin')}
            hint={t('finance.pricing.targetMarginHint')}
            value={marginText}
            onChangeText={setMarginText}
            error={marginInvalid ? t('finance.validation.marginInvalid') : undefined}
            testID="finance-pricing-margin"
          />
        ) : null}
      </View>

      <Section title={t('finance.pricing.resultsTitle')} titleVariant="overline" separated testID="finance-pricing-result">
        {result ? (
          <>
            {mode === 'target' ? <FigureRow label={t('finance.pricing.suggestedPrice')} value={format.money(result.price)} strong /> : null}
            {mode === 'check' ? (
              <FigureRow
                label={t('finance.pricing.grossMargin')}
                value={format.pct(result.margin) ?? na}
                valueTone={result.margin !== null && result.margin < 0 ? 'danger' : 'default'}
                strong
              />
            ) : null}
            <FigureRow label={t('finance.pricing.markup')} value={format.pct(result.markup) ?? na} valueTone={result.markup === null ? 'secondary' : 'default'} />
            <FigureRow
              label={t('finance.pricing.contribution')}
              value={format.money(result.contribution)}
              valueTone={result.contribution < 0 ? 'danger' : 'default'}
            />
          </>
        ) : (
          <Text variant="callout" tone="secondary">
            {t('finance.pricing.fillIn')}
          </Text>
        )}
      </Section>

      <Button
        variant="secondary"
        label={t('finance.pricing.apply')}
        onPress={() => setApplyOpen(true)}
        disabled={!result || ready.lines.revenueStreams.length === 0}
        accessibilityHint={ready.lines.revenueStreams.length === 0 ? t('finance.pricing.noStreams') : undefined}
        testID="finance-pricing-apply"
      />
      {ready.lines.revenueStreams.length === 0 ? (
        <Text variant="caption" tone="secondary">
          {t('finance.pricing.noStreams')}
        </Text>
      ) : null}

      {result ? <ApplySheet visible={applyOpen} onClose={() => setApplyOpen(false)} ready={ready} priceMinor={result.price} /> : null}
    </>
  );
}

function ApplySheet({ visible, onClose, ready, priceMinor }: { visible: boolean; onClose: () => void; ready: ReadyFinance; priceMinor: number }) {
  const t = useT();
  const notice = useNotice();
  const online = useIsOnline();
  const format = useFinanceFormat(ready.currency);
  const setPrice = useSetRevenueStreamPrice(ready.businessId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const apply = async (id: string, label: string) => {
    setPendingId(id);
    try {
      await setPrice.mutateAsync({ id, unitPriceMinor: priceMinor });
      notice.show({ message: t('finance.pricing.applied', { label }) });
      onClose();
    } catch {
      // Shown inline.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('finance.pricing.applyTitle')} testID="finance-pricing-apply-sheet">
      <Text variant="callout" tone="secondary">
        {t('finance.pricing.applyBody', { price: format.money(priceMinor) })}
      </Text>
      <Section separated>
        {ready.lines.revenueStreams.map((s) => (
          <ListRow
            key={s.id}
            title={s.label}
            subtitle={t('finance.pricing.applyCurrent', { price: format.money(s.unitPriceMinor) })}
            onPress={() => void apply(s.id, s.label)}
            disabled={!online || pendingId !== null}
            chevron={false}
            trailing={pendingId === s.id ? <Text variant="caption" tone="secondary">{t('common.actions.saving')}</Text> : undefined}
          />
        ))}
      </Section>
      {!online ? <InlineNotice tone="info" message={t('errors.offline')} /> : null}
      {setPrice.error ? <InlineNotice tone="error" message={t(setPrice.error.messageKey)} /> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing[5] },
});
