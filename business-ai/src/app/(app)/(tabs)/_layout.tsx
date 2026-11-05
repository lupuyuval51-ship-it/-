import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, Text, type IconName } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/translate';
import { useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';
import { DENSE_MAX_FONT_SCALE } from '@/theme/tokens';

export const unstable_settings = { anchor: 'index' };

const TABS: readonly { name: string; icon: IconName; label: TranslationKey }[] = [
  { name: 'index', icon: 'home', label: 'common.tabs.home' },
  { name: 'plan', icon: 'layers', label: 'common.tabs.plan' },
  { name: 'advisor', icon: 'message-square', label: 'common.tabs.advisor' },
  { name: 'finance', icon: 'pie-chart', label: 'common.tabs.finance' },
  { name: 'workspace', icon: 'grid', label: 'common.tabs.workspace' },
];

/**
 * Five tabs. Tab screens have no header: they render <Screen edges={['top']} title={…}>
 * (large editorial title; the tab bar owns the bottom inset).
 */
export default function TabsLayout() {
  const t = useT();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  // Icon (22) + label (14) + spacing must fit: the default bar height clipped the labels.
  const bottomPad = Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          shadowOpacity: 0,
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
        },
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: colors.background },
        animation: reduceMotion ? 'none' : 'fade',
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.label),
            tabBarAccessibilityLabel: t(tab.label),
            tabBarButtonTestID: `tab-${tab.name}`,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} size={22} color={typeof color === 'string' ? color : undefined} />,
            tabBarLabel: ({ color, focused }) => (
              <Text
                variant="caption"
                weight={focused ? 500 : 400}
                align="center"
                numberOfLines={1}
                maxFontSizeMultiplier={DENSE_MAX_FONT_SCALE}
                style={[styles.label, { color }]}
              >
                {t(tab.label)}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  item: { paddingTop: 4 },
  label: { fontSize: 11, lineHeight: 14 },
});
