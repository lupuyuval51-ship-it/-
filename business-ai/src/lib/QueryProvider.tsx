import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { ReactNode } from 'react';
import { PERSIST_BUSTER, PERSIST_MAX_AGE, queryClient, queryPersister, wireQueryManagers } from './queryClient';

wireQueryManagers();

/** QueryClient + AsyncStorage persistence. Only successful queries are persisted. */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: PERSIST_MAX_AGE,
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success' && query.meta?.persist !== false,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
