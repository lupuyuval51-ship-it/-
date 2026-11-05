import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { layout, spacing } from '@/theme/tokens';
import { OfflineBanner } from './OfflineBanner';
import { Text } from './Text';

export type ScreenEdge = 'top' | 'bottom';

export interface ScreenProps {
  children?: ReactNode;
  /**
   * Large editorial title at the top of the content (tab screens and header-less screens).
   * Stack screens with a native header usually pass the title to the header instead.
   */
  title?: string;
  subtitle?: string;
  /** Element at the end of the title row (e.g. an IconButton). */
  headerAction?: ReactNode;
  /** Scrollable content (default true). */
  scroll?: boolean;
  /**
   * Safe-area edges this screen pads. Default ['top', 'bottom'].
   * Under a stack header pass ['bottom']; in a tab screen pass ['top'] (the tab bar owns the bottom).
   */
  edges?: readonly ScreenEdge[];
  /** Pull-to-refresh. */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Pinned under the content, above the bottom safe area (primary action of forms). */
  footer?: ReactNode;
  /** Show the offline strip at the top while offline (default true). */
  offlineBanner?: boolean;
  /** Vertical gap between direct children (spacing key value in pt). Default 24. */
  gap?: number;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Page container: safe area, gutter (20), max content width (640, centered), optional scroll and
 * pull-to-refresh, keyboard avoidance and the offline banner.
 */
export function Screen({
  children,
  title,
  subtitle,
  headerAction,
  scroll = true,
  edges = ['top', 'bottom'],
  refreshing,
  onRefresh,
  footer,
  offlineBanner = true,
  gap = spacing[6],
  contentStyle,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const padTop = edges.includes('top') ? insets.top : 0;
  const padBottom = edges.includes('bottom') ? insets.bottom : 0;

  const header =
    title || headerAction ? (
      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          {title ? <Text variant="display">{title}</Text> : null}
          {subtitle ? (
            <Text variant="callout" tone="secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerAction}
      </View>
    ) : null;

  const inner = (
    <View style={[styles.inner, { gap }, contentStyle]}>
      {header}
      {children}
    </View>
  );

  const bottomSpace = footer ? spacing[4] : Math.max(padBottom, spacing[4]) + spacing[4];

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: padTop }]} testID={testID}>
      {offlineBanner ? <OfflineBanner /> : null}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpace }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            refreshControl={
              onRefresh ? <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.textSecondary} colors={[colors.accent]} /> : undefined
            }
          >
            {inner}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.scrollContent, { paddingBottom: bottomSpace }]}>{inner}</View>
        )}
        {footer ? (
          <View style={[styles.footer, { paddingBottom: Math.max(padBottom, spacing[4]), borderTopColor: colors.border }]}>
            <View style={styles.footerInner}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: layout.gutter, paddingTop: spacing[6] },
  inner: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  titleText: { flex: 1, gap: spacing[2] },
  footer: { paddingHorizontal: layout.gutter, paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth },
  footerInner: { width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center', gap: spacing[3] },
});
