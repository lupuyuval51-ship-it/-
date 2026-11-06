import { useQuery } from '@tanstack/react-query';

import { env } from '@/lib/env';
import { useSession } from '@/store/session';

import { checkAiHealth, type AiMode } from './client';

export type AiModeReason = 'not-configured' | 'signed-out' | 'server-disabled' | 'live';

export interface AiModeState {
  mode: AiMode;
  reason: AiModeReason;
  provider?: string;
  model?: string;
  isChecking: boolean;
  refresh: () => void;
}

/**
 * Decides whether real AI generation is possible right now:
 * Supabase configured + signed in + the Edge Function reports a provider.
 */
export function useAiMode(): AiModeState {
  const cloudAvailable = useSession((s) => s.cloudAvailable);
  const status = useSession((s) => s.status);
  const canAsk = cloudAvailable && status === 'signedIn';

  const health = useQuery({
    queryKey: ['ai-health', status],
    queryFn: () => checkAiHealth(),
    enabled: canAsk,
    staleTime: 5 * 60_000,
  });

  if (!cloudAvailable) return { mode: 'demo', reason: 'not-configured', isChecking: false, refresh: () => {} };
  if (status !== 'signedIn') return { mode: 'demo', reason: 'signed-out', isChecking: status === 'loading', refresh: () => {} };
  const enabled = health.data?.enabled ?? env.aiEnabledHint;
  return {
    mode: enabled ? 'live' : 'demo',
    reason: enabled ? 'live' : 'server-disabled',
    provider: health.data?.provider,
    model: health.data?.model,
    isChecking: health.isLoading,
    refresh: () => {
      void health.refetch();
    },
  };
}
