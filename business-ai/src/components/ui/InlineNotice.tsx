import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { radii, spacing, type Palette } from '@/theme/tokens';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { Text, type TextTone } from './Text';

export type NoticeTone = 'info' | 'success' | 'warning' | 'error';

export interface InlineNoticeProps {
  tone?: NoticeTone;
  title?: string;
  message: string;
  action?: { label: string; onPress: () => void };
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const ICONS: Record<NoticeTone, IconName> = {
  info: 'info',
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'alert-circle',
};

function toneStyle(tone: NoticeTone, colors: Palette): { background: string; icon: Exclude<TextTone, 'inherit'> } {
  switch (tone) {
    case 'info':
      return { background: colors.backgroundAlt, icon: 'secondary' };
    case 'success':
      return { background: colors.accentSoft, icon: 'accent' };
    case 'warning':
      return { background: colors.warningSoft, icon: 'warning' };
    case 'error':
      return { background: colors.dangerSoft, icon: 'danger' };
  }
}

/** Quiet in-flow message. Errors and warnings are announced as alerts. */
export function InlineNotice({ tone = 'info', title, message, action, onDismiss, style, testID }: InlineNoticeProps) {
  const { colors } = useTheme();
  const t = useT();
  const s = toneStyle(tone, colors);
  const urgent = tone === 'error' || tone === 'warning';
  return (
    <View
      accessibilityRole={urgent ? 'alert' : undefined}
      accessibilityLiveRegion={urgent ? 'assertive' : 'polite'}
      testID={testID}
      style={[styles.notice, { backgroundColor: s.background }, style]}
    >
      <Icon name={ICONS[tone]} size={18} tone={s.icon} style={styles.icon} />
      <View style={styles.body}>
        {title ? <Text variant="bodyStrong">{title}</Text> : null}
        <Text variant="callout">{message}</Text>
        {action ? <Button variant="quiet" inline label={action.label} onPress={action.onPress} style={styles.action} /> : null}
      </View>
      {onDismiss ? (
        <IconButton icon="x" size="compact" tone="secondary" accessibilityLabel={t('common.a11y.dismissNotice')} onPress={onDismiss} style={styles.dismiss} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radii.control,
    alignSelf: 'stretch',
  },
  icon: { marginTop: 2 },
  body: { flex: 1, gap: spacing[1] },
  action: { marginTop: spacing[1] },
  dismiss: { marginVertical: -spacing[2], marginEnd: -spacing[3] },
});
