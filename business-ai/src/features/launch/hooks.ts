import { useCallback, useState } from 'react';

/**
 * Pull-to-refresh state that reflects only the user's pull (not background refetches after
 * mutations, which would otherwise flash the refresh spinner).
 */
export function usePullRefresh(refetch: () => Promise<unknown>): { refreshing: boolean; onRefresh: () => void } {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch()
      .catch(() => undefined)
      .finally(() => setRefreshing(false));
  }, [refetch]);
  return { refreshing, onRefresh };
}
