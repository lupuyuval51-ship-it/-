/**
 * One checklist row: status box (todo ⇄ done; "not applicable" items show a dash and return to
 * todo), title + description (opens the item), and the official source link.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from '@/components/ui';
import { useLocale, useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { DENSE_MAX_FONT_SCALE, layout, radii, spacing } from '@/theme/tokens';
import { displayLaunchItem, type LaunchItem } from '../logic';

export interface LaunchItemRowProps {
  item: LaunchItem;
  onToggle: () => void;
  onOpen: () => void;
  onOpenSource: (url: string) => void;
  /** Writes disabled (offline). */
  disabled?: boolean;
}

const BOX = 22;

export function LaunchItemRow({ item, onToggle, onOpen, onOpenSource, disabled = false }: LaunchItemRowProps) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const display = displayLaunchItem(item, locale);
  const done = item.status === 'done';
  const notApplicable = item.status === 'not_applicable';
  const statusLabel = t(`launch.status.${item.status}`);

  return (
    <View style={styles.row} testID={`launch-item-${item.template_key ?? item.id}`}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`${display.title}. ${statusLabel}`}
        accessibilityHint={t('launch.row.toggleA11y')}
        accessibilityState={{ checked: done ? true : notApplicable ? 'mixed' : false, disabled }}
        disabled={disabled}
        onPress={onToggle}
        hitSlop={4}
        style={({ pressed }) => [styles.boxHit, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
        testID="launch-item-toggle"
      >
        <View
          style={[
            styles.box,
            done
              ? { backgroundColor: colors.accent, borderColor: colors.accent }
              : { backgroundColor: notApplicable ? colors.backgroundAlt : colors.surface, borderColor: colors.borderStrong },
          ]}
        >
          {done ? <Icon name="check" size={15} tone="onAccent" /> : notApplicable ? <Icon name="minus" size={15} tone="secondary" /> : null}
        </View>
      </Pressable>

      <View style={styles.body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={[display.title, display.description, statusLabel].filter(Boolean).join('. ')}
          accessibilityHint={t('launch.row.openItemA11y')}
          onPress={onOpen}
          style={({ pressed }) => [styles.textBlock, { opacity: pressed ? 0.7 : 1 }]}
          testID="launch-item-open"
        >
          <Text variant="body" tone={done || notApplicable ? 'secondary' : 'default'} style={done ? styles.struck : null}>
            {display.title}
          </Text>
          {display.description ? (
            <Text variant="caption" tone="secondary" numberOfLines={3}>
              {display.description}
            </Text>
          ) : null}
          {notApplicable ? (
            <Text variant="caption" tone="secondary" weight={500}>
              {statusLabel}
            </Text>
          ) : null}
        </Pressable>

        {display.sourceUrl ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t('launch.row.openSourceA11y', { name: display.sourceName ?? display.sourceUrl })}
            onPress={() => onOpenSource(display.sourceUrl as string)}
            hitSlop={{ top: 10, bottom: 10 }}
            style={({ pressed }) => [styles.source, { opacity: pressed ? 0.6 : 1 }]}
            testID="launch-item-source"
          >
            <Text variant="caption" tone="accent" weight={500} numberOfLines={2} maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE} style={styles.sourceText}>
              {t('launch.row.source', { name: display.sourceName ?? display.sourceUrl })}
            </Text>
            <Icon name="external-link" size={12} tone="accent" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], paddingVertical: spacing[3] },
  boxHit: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center', marginTop: -10, marginStart: -11 },
  box: { width: BOX, height: BOX, borderRadius: radii.control, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: spacing[2] },
  textBlock: { gap: 2 },
  struck: { textDecorationLine: 'line-through' },
  source: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], alignSelf: 'flex-start', minHeight: 24 },
  sourceText: { flexShrink: 1 },
});
