import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';
import { useSession } from '@/store/session';

import { createLocalRepositories } from './local';
import { createSupabaseRepositories } from './supabase';
import type { Repositories } from './types';

export * from './types';

/** The local repositories are a process-wide singleton so caches stay warm. */
export const localRepositories: Repositories = createLocalRepositories();

const RepositoriesContext = createContext<Repositories>(localRepositories);

export function RepositoriesProvider({ children }: PropsWithChildren) {
  const user = useSession((s) => s.user);
  const status = useSession((s) => s.status);

  const repositories = useMemo<Repositories>(() => {
    if (supabase && status === 'signedIn' && user) {
      return createSupabaseRepositories(supabase, user.id);
    }
    return localRepositories;
  }, [status, user]);

  return <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>;
}

export function useRepositories(): Repositories {
  return useContext(RepositoriesContext);
}
