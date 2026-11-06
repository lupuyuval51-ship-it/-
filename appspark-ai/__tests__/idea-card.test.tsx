import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { IdeaCard } from '@/components/ideas/IdeaCard';
import { ideas } from '@/data/seed/ai';
import { I18nProvider } from '@/i18n';
import { RepositoriesProvider } from '@/repositories';
import { LOCAL_KEYS } from '@/repositories/local/collection';
import { usePreferences } from '@/store/preferences';
import { useToast } from '@/store/toast';
import { ThemeProvider } from '@/theme/ThemeProvider';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false }),
}));

function Providers({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <ThemeProvider>
          <RepositoriesProvider>{children}</RepositoriesProvider>
        </ThemeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

const idea = ideas[0];

describe('<IdeaCard />', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useToast.setState({ current: null });
  });

  it('renders Hebrew content by default and English after switching locale', async () => {
    await render(<IdeaCard idea={idea} />, { wrapper: Providers });
    expect(await screen.findByText(idea.name.he)).toBeTruthy();
    usePreferences.getState().setLocale('en');
    expect(await screen.findByText(idea.name.en)).toBeTruthy();
    usePreferences.getState().setLocale('he');
  });

  it('saves the idea to local storage when the bookmark is pressed', async () => {
    await render(<IdeaCard idea={idea} />, { wrapper: Providers });
    const button = await screen.findByTestId(`save-${idea.id}`);
    await fireEvent.press(button);
    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(LOCAL_KEYS.savedIdeas);
      expect(raw).toContain(idea.id);
    });
    await waitFor(() => expect(useToast.getState().current?.message).toBeTruthy());
  });
});
