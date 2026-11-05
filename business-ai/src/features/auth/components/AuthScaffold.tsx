import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Screen, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { spacing } from '@/theme/tokens';
import { LanguageSwitch } from './LanguageSwitch';

export interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Quiet secondary navigation under the form ("New here? Create an account"). */
  footer?: ReactNode;
  /** Shows a back button instead of the wordmark. */
  onBack?: () => void;
  testID?: string;
}

const FORM_MAX_WIDTH = 420;

/**
 * Shared layout of the auth screens: wordmark (or back) + language switch on top, an editorial
 * title block, the form, and a quiet footer. Start-aligned, generous whitespace.
 */
export function AuthScaffold({ title, subtitle, children, footer, onBack, testID }: AuthScaffoldProps) {
  const t = useT();
  return (
    <Screen gap={0} contentStyle={styles.content} testID={testID}>
      <View style={styles.topBar}>
        {onBack ? (
          <IconButton icon="arrow-left" accessibilityLabel={t('common.a11y.goBack')} onPress={onBack} style={styles.back} testID="auth-back" />
        ) : (
          <Text variant="heading" accessibilityRole="text" testID="wordmark">
            {t('common.appName')}
          </Text>
        )}
        <LanguageSwitch />
      </View>

      <View style={styles.header}>
        <Text variant="display">{title}</Text>
        {subtitle ? (
          <Text variant="body" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.body}>{children}</View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { maxWidth: FORM_MAX_WIDTH },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: spacing[4] },
  back: { marginStart: -spacing[3] },
  header: { marginTop: spacing[12], gap: spacing[3] },
  body: { marginTop: spacing[8], gap: spacing[5] },
  footer: { marginTop: spacing[8], flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[2] },
});
