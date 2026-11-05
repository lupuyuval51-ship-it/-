import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radii, spacing } from '@/theme/tokens';
import { DirectionRoot } from './DirectionRoot';
import { IconButton } from './IconButton';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  /** Pinned below the scrollable content (e.g. the primary action). */
  footer?: ReactNode;
  testID?: string;
}

/**
 * Modal bottom sheet (all platforms). Fades in (no slide when reduce motion is on). Scrim tap,
 * the close button, Android back and Escape on web all call `onClose`.
 */
export function Sheet({ visible, onClose, title, children, footer, testID }: SheetProps) {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <DirectionRoot style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.a11y.closeSheet')}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoider} pointerEvents="box-none">
          <View
            accessibilityViewIsModal
            testID={testID}
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing[4]) },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            <View style={styles.header}>
              <View style={styles.title}>{title ? <Text variant="heading">{title}</Text> : null}</View>
              <IconButton icon="x" size="compact" tone="secondary" accessibilityLabel={t('common.a11y.closeSheet')} onPress={onClose} />
            </View>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </DirectionRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  avoider: { width: '100%', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    maxHeight: '90%',
    borderTopLeftRadius: radii.surface,
    borderTopRightRadius: radii.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingTop: spacing[2],
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: radii.control },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingStart: layout.gutter,
    paddingEnd: spacing[3],
    paddingTop: spacing[2],
    minHeight: 48,
  },
  title: { flex: 1 },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: layout.gutter, paddingBottom: spacing[4], gap: spacing[4] },
  footer: { paddingHorizontal: layout.gutter, paddingTop: spacing[2] },
});
