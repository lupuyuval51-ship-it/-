import { Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { ScalePressable } from './Pressable';

/** Renders the single active toast above the tab bar. Mount once in the root layout. */
export function ToastHost() {
  const toast = useToast((s) => s.current);
  const dismiss = useToast((s) => s.dismiss);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!toast) return null;

  const color = toast.tone === 'success' ? 'success' : toast.tone === 'danger' ? 'danger' : 'text';
  const icon = toast.icon ?? (toast.tone === 'success' ? 'check' : toast.tone === 'danger' ? 'alert' : undefined);

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 84 }]}>
      <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(160)} key={toast.id}>
        <ScalePressable
          onPress={() => dismiss(toast.id)}
          accessibilityRole="alert"
          style={[styles.toast, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }, Platform.OS === 'web' && styles.webShadow]}>
          {icon ? <Icon name={icon} size={16} color={color} /> : null}
          <AppText variant="bodySmall" weight="medium" style={styles.text}>
            {toast.message}
          </AppText>
        </ScalePressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 420,
  },
  webShadow: {
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  } as object,
  text: {
    flexShrink: 1,
  },
});
