import { FrankRuhlLibre_500Medium, FrankRuhlLibre_700Bold } from '@expo-google-fonts/frank-ruhl-libre';
import { Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold, useFonts } from '@expo-google-fonts/heebo';
import { QueryClientProvider } from '@tanstack/react-query';
import { LocaleProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/ui/ToastHost';
import { I18nProvider, useI18n } from '@/i18n';
import { syncLayoutDirection } from '@/lib/direction';
import { queryClient } from '@/lib/query-client';
import { RepositoriesProvider } from '@/repositories';
import { usePreferences } from '@/store/preferences';
import { useSession } from '@/store/session';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';


SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { dir } = useI18n();
  const { colors, isDark } = useTheme();
  const onboardingCompleted = usePreferences((s) => s.onboardingCompleted);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof document !== 'undefined') document.body.style.backgroundColor = colors.background;
      return;
    }
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    <LocaleProvider direction={dir}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'slide_from_right' }}>
        <Stack.Protected guard={onboardingCompleted} redirectTo="/onboarding">
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="search" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="idea/[id]" />
        <Stack.Screen name="prompt/[ideaId]" />
        <Stack.Screen name="project/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <ToastHost />
    </LocaleProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
    FrankRuhlLibre_500Medium,
    FrankRuhlLibre_700Bold,
  });
  const hydrated = usePreferences((s) => s.hydrated);
  const locale = usePreferences((s) => s.locale);
  const initializeSession = useSession((s) => s.initialize);
  const directionSynced = useRef(false);

  useEffect(() => {
    void initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    if (!hydrated) return;
    // Apply the persisted direction once at startup. Later changes are handled
    // in the profile screen, which explains that a restart is required on native.
    if (!directionSynced.current) {
      directionSynced.current = true;
      syncLayoutDirection(locale);
    } else if (Platform.OS === 'web') {
      syncLayoutDirection(locale);
    }
  }, [hydrated, locale]);

  const ready = (fontsLoaded || Boolean(fontError)) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ThemeProvider>
            <RepositoriesProvider>
              <RootNavigator />
            </RepositoriesProvider>
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
