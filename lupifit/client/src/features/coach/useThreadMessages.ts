import { useInfiniteQuery, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import type { CoachMessageDTO, CoachMessagesResponse } from '@shared/types';
import { qk } from '../../api/queryClient';
import { coachApi } from './api';

export type MessagesData = InfiniteData<CoachMessagesResponse, string | undefined>;

/** Pages of a thread's messages: page 0 is the newest; "load earlier" fetches older pages. */
export function useThreadMessages(threadId: string | null) {
  return useInfiniteQuery({
    queryKey: qk.coachMessages(threadId ?? 'none'),
    queryFn: ({ pageParam, signal }) => coachApi.messages(threadId!, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.messages[0]?.id : undefined),
    enabled: threadId != null,
    // Messages only change through this page; avoid refetches racing an in-flight send.
    refetchOnWindowFocus: false,
  });
}

/** Chronological, de-duplicated list from the cached pages. */
export function flattenMessages(data: { pages: CoachMessagesResponse[] } | undefined): CoachMessageDTO[] {
  if (!data) return [];
  const seen = new Set<string>();
  const out: CoachMessageDTO[] = [];
  for (const page of [...data.pages].reverse()) {
    for (const m of page.messages) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
  }
  return out;
}

export function emptyMessages(): MessagesData {
  return { pages: [{ messages: [], hasMore: false }], pageParams: [undefined] };
}

/** Appends newly stored messages to the newest cached page of a thread. */
export function appendMessages(queryClient: QueryClient, threadId: string, messages: CoachMessageDTO[]) {
  queryClient.setQueryData<MessagesData>(qk.coachMessages(threadId), (old) => {
    const base = old ?? emptyMessages();
    const [first, ...rest] = base.pages;
    const existing = new Set((first?.messages ?? []).map((m) => m.id));
    const merged = [...(first?.messages ?? []), ...messages.filter((m) => !existing.has(m.id))];
    return { ...base, pages: [{ messages: merged, hasMore: first?.hasMore ?? false }, ...rest] };
  });
}
