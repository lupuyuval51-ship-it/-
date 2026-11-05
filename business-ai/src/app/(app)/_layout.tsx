import { Stack } from 'expo-router';
import { useStackScreenOptions } from '@/components/navigation/stackOptions';
import { useT } from '@/i18n/I18nProvider';

export const unstable_settings = { anchor: '(tabs)' };

/**
 * Authenticated stack: the tab bar plus detail routes (plan/…, roadmap/…, settings, …).
 * Detail screens get the minimal header; set `options={{ title }}` per screen or via
 * <Stack.Screen options={{ title: t('…') }} /> inside the screen. Detail screens render
 * <Screen edges={['bottom']}> because the header owns the top inset.
 */
export default function AppLayout() {
  const screenOptions = useStackScreenOptions();
  const t = useT();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings/index" options={{ title: t('settings.title') }} />
    </Stack>
  );
}
