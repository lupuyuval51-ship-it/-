import { Stack } from 'expo-router';
import { useReducedMotion } from '@/lib/a11y';
import { useTheme } from '@/theme/ThemeProvider';

/** Onboarding flow container (header-less). The onboarding feature adds its step routes here. */
export default function OnboardingLayout() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: reduceMotion ? 'none' : 'default',
      }}
    />
  );
}
