/**
 * Test harness for UI components: theme + i18n (without storage) + safe area + notice/confirm.
 * Test files that import this must mock native storage first:
 *
 *   jest.mock('@react-native-async-storage/async-storage', () =>
 *     require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
 */
import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { NoticeProvider } from '@/components/ui/Notice';
import { I18nProvider } from '@/i18n/I18nProvider';
import type { Locale } from '@/i18n/types';
import { ThemeProvider, type ThemePreference } from '@/theme/ThemeProvider';

export interface ProviderOptions {
  locale?: Locale;
  theme?: ThemePreference;
  fontsAvailable?: boolean;
}

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function TestProviders({ children, locale = 'he', theme = 'light', fontsAvailable = true }: ProviderOptions & { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider fontsAvailable={fontsAvailable} initialPreference={theme}>
        <I18nProvider initialLocale={locale}>
          <NoticeProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </NoticeProvider>
        </I18nProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {}) {
  const { locale, theme, fontsAvailable, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders locale={locale} theme={theme} fontsAvailable={fontsAvailable}>
        {children}
      </TestProviders>
    ),
    ...rest,
  });
}
