import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { layout, space } from '@/theme/tokens';

/** Space reserved for the floating tab bar on tab screens. */
export const TAB_BAR_SPACE = 92;

export interface ScreenProps extends PropsWithChildren {
  /** Render children inside a ScrollView. */
  scroll?: boolean;
  /** Add bottom space for the tab bar. */
  withTabBar?: boolean;
  /** Wrap in KeyboardAvoidingView (forms). */
  keyboard?: boolean;
  header?: ReactNode;
  /** Disable the horizontal gutter (e.g. when the screen manages its own). */
  noGutter?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollProps?: ScrollViewProps;
  testID?: string;
}

/**
 * Base screen container: themed background, safe-area top inset, centred
 * max-width column on wide screens, optional scrolling and keyboard handling.
 */
export function Screen({ children, scroll = false, withTabBar = false, keyboard = false, header, noGutter = false, style, contentStyle, refreshing, onRefresh, scrollProps, testID }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = (withTabBar ? TAB_BAR_SPACE : space.xxl) + insets.bottom;

  const column = (
    <View style={[styles.column, !noGutter && styles.gutter, contentStyle]}>
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      {...scrollProps}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }, scrollProps?.contentContainerStyle]}
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.textSecondary} /> : undefined}>
      {column}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingBottom: withTabBar ? 0 : insets.bottom }]}>{column}</View>
  );

  const content = keyboard ? (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top }, style]} testID={testID}>
      {header}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'stretch',
  },
  column: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  gutter: {
    paddingHorizontal: layout.gutter,
  },
});
