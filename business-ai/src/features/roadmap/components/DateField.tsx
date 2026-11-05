import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Divider, Icon, IconButton, Sheet, Text } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { formatDate, formatRelativeDue, isolate } from '@/i18n/format';
import { intlLocale, type Locale } from '@/i18n/types';
import { useTheme } from '@/theme/ThemeProvider';
import { DENSE_MAX_FONT_SCALE, layout, radii, spacing } from '@/theme/tokens';
import {
  addMonths,
  monthGrid,
  parseISODate,
  QUICK_DATE_KEYS,
  quickDate,
  todayISO,
  toDisplayDate,
  weekdayReferenceDate,
  yearMonthOf,
  type ISODate,
  type YearMonth,
} from '../dates';

export interface DateFieldProps {
  label: string;
  /** 'YYYY-MM-DD' or null. */
  value: string | null;
  onChange(v: string | null): void;
  error?: string;
  hint?: string;
  /** Offer "No date" in the picker (default true). */
  clearable?: boolean;
  disabled?: boolean;
  testID?: string;
}

/** Both he-IL and en-US calendars start on Sunday. */
const WEEK_STARTS_ON = 0;

function weekdayDate(value: ISODate, locale: Locale): string {
  return isolate(new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', day: 'numeric', month: 'short' }).format(toDisplayDate(value)));
}

/**
 * Date input without a native picker dependency: shows the formatted date; tapping opens a sheet
 * with quick choices and a compact month calendar. Works with 'YYYY-MM-DD' strings only, so the
 * selected day never shifts with the device time zone.
 */
export function DateField({ label, value, onChange, error, hint, clearable = true, disabled = false, testID }: DateFieldProps) {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const valid = value && parseISODate(value) ? value : null;
  const relative = valid ? formatRelativeDue(valid) : null;

  const display = valid ? formatDate(valid, locale, { style: 'medium' }) : t('roadmap.dateField.none');
  const borderColor = error ? colors.danger : colors.borderStrong;

  const select = (next: string | null) => {
    setOpen(false);
    if (next !== value) onChange(next);
  };

  return (
    <View style={styles.container} testID={testID}>
      <Text variant="callout" weight={500}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        accessibilityHint={error ?? hint ?? t('roadmap.dateField.openHint')}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        testID={testID ? `${testID}-open` : undefined}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor,
            backgroundColor: disabled ? colors.backgroundAlt : pressed ? colors.backgroundAlt : colors.surface,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <Icon name="calendar" size={18} tone="secondary" />
        <Text variant="body" tone={valid ? 'default' : 'secondary'} style={styles.flex} numberOfLines={1}>
          {display}
        </Text>
        {relative ? (
          <Text variant="caption" tone={relative.status === 'overdue' ? 'danger' : 'secondary'} numberOfLines={1}>
            {t(relative.key, relative.vars)}
          </Text>
        ) : null}
      </Pressable>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon name="alert-circle" size={14} tone="danger" style={styles.messageIcon} />
          <Text variant="caption" tone="danger" style={styles.flexShrink}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text variant="caption" tone="secondary">
          {hint}
        </Text>
      ) : null}

      <Sheet visible={open} onClose={() => setOpen(false)} title={label} testID={testID ? `${testID}-sheet` : undefined}>
        {open ? <DatePickerBody value={valid} clearable={clearable} onSelect={select} /> : null}
      </Sheet>
    </View>
  );
}

interface DatePickerBodyProps {
  value: ISODate | null;
  clearable: boolean;
  onSelect: (value: ISODate | null) => void;
}

function DatePickerBody({ value, clearable, onSelect }: DatePickerBodyProps) {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const t = useT();
  const today = todayISO();
  const [month, setMonth] = useState<YearMonth>(() => yearMonthOf(value ?? today));

  const weeks = useMemo(() => monthGrid(month, WEEK_STARTS_ON), [month]);
  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }).format(
        toDisplayDate(`${String(month.year).padStart(4, '0')}-${String(month.month).padStart(2, '0')}-01`),
      ),
    [locale, month],
  );
  const weekdays = useMemo(() => {
    const narrow = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'narrow' });
    const long = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long' });
    return Array.from({ length: 7 }, (_, i) => {
      const date = toDisplayDate(weekdayReferenceDate((WEEK_STARTS_ON + i) % 7));
      return { short: narrow.format(date), long: long.format(date) };
    });
  }, [locale]);

  return (
    <View style={styles.body}>
      <View>
        {QUICK_DATE_KEYS.map((key) => {
          const date = quickDate(key, today);
          const selected = date === value;
          const name = t(`roadmap.dateField.quick.${key}`);
          const dateText = weekdayDate(date, locale);
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${name}, ${dateText}`}
              accessibilityState={{ selected }}
              onPress={() => onSelect(date)}
              style={({ pressed }) => [styles.quickRow, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
            >
              <Text variant="body" weight={selected ? 500 : 400} style={styles.flex}>
                {name}
              </Text>
              <Text variant="callout" tone="secondary" numeric>
                {dateText}
              </Text>
              <View style={styles.checkSlot}>{selected ? <Icon name="check" size={18} tone="accent" /> : null}</View>
            </Pressable>
          );
        })}
        {clearable && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('roadmap.dateField.clear')}
            onPress={() => onSelect(null)}
            style={({ pressed }) => [styles.quickRow, { backgroundColor: pressed ? colors.backgroundAlt : 'transparent' }]}
          >
            <Text variant="body" tone="secondary" style={styles.flex}>
              {t('roadmap.dateField.clear')}
            </Text>
            <View style={styles.checkSlot}>
              <Icon name="x" size={18} tone="secondary" />
            </View>
          </Pressable>
        ) : null}
      </View>

      <Divider />

      <View style={styles.calendar}>
        <View style={styles.monthHeader}>
          <IconButton
            icon="chevron-left"
            size="compact"
            tone="secondary"
            accessibilityLabel={t('roadmap.dateField.prevMonth')}
            onPress={() => setMonth((m) => addMonths(m, -1))}
          />
          <Text variant="bodyStrong" align="center" style={styles.flex} accessibilityRole="header" accessibilityLiveRegion="polite">
            {monthTitle}
          </Text>
          <IconButton
            icon="chevron-right"
            size="compact"
            tone="secondary"
            accessibilityLabel={t('roadmap.dateField.nextMonth')}
            onPress={() => setMonth((m) => addMonths(m, 1))}
          />
        </View>

        <View style={styles.week} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {weekdays.map((d) => (
            <View key={d.long} style={styles.weekdayCell}>
              <Text variant="caption" tone="secondary" align="center" maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}>
                {d.short}
              </Text>
            </View>
          ))}
        </View>

        {weeks.map((week) => (
          <View key={week[0]!.date} style={styles.week}>
            {week.map((cell) => {
              if (!cell.inMonth) return <View key={cell.date} style={styles.dayCell} />;
              const selected = cell.date === value;
              const isToday = cell.date === today;
              const long = formatDate(cell.date, locale, { style: 'long' });
              const a11y = selected
                ? t('roadmap.dateField.selectedA11y', { date: long })
                : isToday
                  ? t('roadmap.dateField.todayA11y', { date: long })
                  : long;
              return (
                <Pressable
                  key={cell.date}
                  accessibilityRole="button"
                  accessibilityLabel={a11y}
                  accessibilityState={{ selected }}
                  onPress={() => onSelect(cell.date)}
                  style={styles.dayCell}
                >
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.dayInner,
                        selected
                          ? { backgroundColor: colors.accent }
                          : isToday
                            ? { borderColor: colors.borderStrong, borderWidth: 1 }
                            : pressed
                              ? { backgroundColor: colors.backgroundAlt }
                              : null,
                      ]}
                    >
                      <Text
                        variant="callout"
                        numeric
                        align="center"
                        weight={selected || isToday ? 600 : 400}
                        tone={selected ? 'onAccent' : isToday ? 'accent' : 'default'}
                        maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
                      >
                        {cell.day}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const DAY = 40;

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', gap: spacing[2] },
  field: {
    minHeight: layout.controlHeight,
    borderWidth: 1,
    borderRadius: radii.control,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[1] + 2 },
  messageIcon: { marginTop: 2 },
  body: { gap: spacing[4] },
  quickRow: {
    minHeight: layout.touchTarget + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginHorizontal: -spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: radii.control,
  },
  checkSlot: { width: 20, alignItems: 'center' },
  calendar: { gap: spacing[1] },
  monthHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] },
  week: { flexDirection: 'row' },
  weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: spacing[1] },
  dayCell: { flex: 1, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  dayInner: { minWidth: DAY, height: DAY, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
});
