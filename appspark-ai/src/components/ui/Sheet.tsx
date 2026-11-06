import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

export interface SheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  footer?: ReactNode;
  /** Let the sheet grow to this fraction of the screen. */
  maxHeightRatio?: number;
  testID?: string;
}

/** Bottom sheet built on the core Modal so it works identically on native and web. */
export function Sheet({ visible, onClose, title, footer, children, maxHeightRatio = 0.86, testID }: SheetProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root} testID={testID}>
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(140)} style={StyleSheet.absoluteFill}>
          <Pressable accessibilityLabel={t('common.close')} onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]} />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav} pointerEvents="box-none">
          <Animated.View
            entering={SlideInDown.duration(260)}
            exiting={SlideOutDown.duration(200)}
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, borderColor: colors.border, paddingBottom: insets.bottom + space.lg, maxHeight: `${Math.round(maxHeightRatio * 100)}%` },
            ]}>
            <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />
            {title ? (
              <View style={styles.titleRow}>
                <AppText variant="heading" style={styles.title}>
                  {title}
                </AppText>
                <IconButton icon="x" size={16} variant="plain" accessibilityLabel={t('common.close')} onPress={onClose} />
              </View>
            ) : null}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  kav: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: layout.maxWidth,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: space.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.gutter,
    paddingVertical: space.sm,
  },
  title: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.gutter,
    paddingBottom: space.lg,
    gap: space.lg,
  },
  footer: {
    paddingHorizontal: layout.gutter,
    paddingTop: space.md,
    gap: space.sm,
  },
});
