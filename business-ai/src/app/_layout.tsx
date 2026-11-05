import { useFonts } from 'expo-font';
import { LocaleProvider, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfigErrorScreen } from '@/components/app/ConfigErrorScreen';
import { BootErrorScreen } from '@/components/app/BootErrorScreen';
import { ConfirmProvider, DirectionRoot, NoticeProvider } from '@/components/ui';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { hasCompletedOnboarding, useBusinesses } from '@/features/business/api';
import { PreferencesSync } from '@/features/settings/PreferencesSync';
import { I18nProvider, useLocale } from '@/i18n/I18nProvider';
import { useReducedMotion } from '@/lib/a11y';
import { QueryProvider } from '@/lib/QueryProvider';
import { isSupabaseConfigured } from '@/lib/supabase';
import { FONT_SOURCES } from '@/theme/fonts';
import { buildNavigationTheme } from '@/theme/navigation';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Keep the native splash up until fonts, session, stored locale/theme and the first
// business list (for the onboarding guard) are known.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);
SplashScreen.setOptions({ fade: true, duration: 180 });

function RootNavigator({ fontsSettled }: { fontsSettled: boolean }) {
  const { ready: themeReady, scheme, colors, isDark, fontsAvailable } = useTheme();
  const { ready: localeReady, locale, isRTL } = useLocale();
  const { session, isLoading: authLoading } = useAuth();
  const businesses = useBusinesses();
  const reduceMotion = useReducedMotion();

  const navigationTheme = useMemo(
    () => buildNavigationTheme(scheme, colors, locale, fontsAvailable),
    [scheme, colors, locale, fontsAvailable],
  );

  const signedIn = session !== null;
  const shellReady = fontsSettled && themeReady && localeReady;
  const businessesKnown = !signedIn || businesses.data !== undefined;
  // First launch on this device without a connection (or a failing request): no cached list to route with.
  const bootBlocked = signedIn && businesses.data === undefined && (businesses.isError || businesses.fetchStatus === 'paused');
  const ready = !isSupabaseConfigured ? shellReady : shellReady && !authLoading && (businessesKnown || bootBlocked);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  const statusBar = <StatusBar style={isDark ? 'light' : 'dark'} />;

  if (!isSupabaseConfigured) {
    return (
      <>
        {statusBar}
        <ConfigErrorScreen />
      </>
    );
  }

  if (bootBlocked) {
    return (
      <>
        {statusBar}
        <BootErrorScreen error={businesses.error} offline={businesses.fetchStatus === 'paused'} onRetry={() => void businesses.refetch()} retrying={businesses.isFetching} />
      </>
    );
  }

  const needsOnboarding = signedIn && !hasCompletedOnboarding(businesses.data ?? []);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <LocaleProvider direction={isRTL ? 'rtl' : 'ltr'}>
        {statusBar}
        {signedIn ? <PreferencesSync /> : null}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: reduceMotion ? 'none' : 'fade',
          }}
        >
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          {/*
            Order matters: when a guard closes the current screen, the router falls back to the first
            available screen. (app) comes first so an onboarded user lands in the app after sign-in;
            while onboarding is required (app) is closed and the fallback is onboarding.
          */}
          <Stack.Protected guard={signedIn && !needsOnboarding}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          {/* Reachable whenever signed in: first business (forced while needsOnboarding) or an additional one (/onboarding?new=1). */}
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          {/* Reachable signed in (recovery link session) or signed out. */}
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </LocaleProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_SOURCES);
  return (
    <SafeAreaProvider>
      <ThemeProvider fontsAvailable={fontsLoaded}>
        <I18nProvider>
          <DirectionRoot style={styles.root}>
            <QueryProvider>
              <AuthProvider>
                <NoticeProvider>
                  <ConfirmProvider>
                    <View style={styles.root}>
                      <RootNavigator fontsSettled={fontsLoaded || fontError !== null} />
                    </View>
                  </ConfirmProvider>
                </NoticeProvider>
              </AuthProvider>
            </QueryProvider>
          </DirectionRoot>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
