import { followUpTargetIndex, mergeMessages, parseMessage, type AdvisorMessage, type PendingExchange } from '../conversation';

function msg(id: string, role: 'user' | 'assistant', content = id, extra: Partial<AdvisorMessage> = {}): AdvisorMessage {
  return { id, role, content, actions: [], followUps: [], appliedActionIds: [], status: 'complete', createdAt: '2026-11-05T10:00:00Z', ...extra };
}

function pending(extra: Partial<PendingExchange> = {}): PendingExchange {
  return {
    localId: 'L',
    text: 'question',
    conversationId: 'c1',
    userMessageId: null,
    assistantMessageId: null,
    reply: '',
    actions: [],
    followUps: [],
    status: 'streaming',
    error: null,
    ...extra,
  };
}

const history = [msg('u0', 'user'), msg('a0', 'assistant')];

describe('mergeMessages', () => {
  it('returns server messages when nothing is pending', () => {
    expect(mergeMessages(history, null).map((i) => i.key)).toEqual(['u0', 'a0']);
  });

  it('appends the optimistic exchange while streaming', () => {
    const items = mergeMessages(history, pending({ reply: 'part' }));
    expect(items.map((i) => i.key)).toEqual(['u0', 'a0', 'L:user', 'L:assistant']);
    expect(items[2]).toMatchObject({ kind: 'user', text: 'question', pending: true });
    expect(items[3]).toMatchObject({ kind: 'assistant', text: 'part', state: 'streaming', messageId: null });
  });

  it('hides the server copy of the in-flight exchange (no duplicates after a refetch)', () => {
    const server = [...history, msg('u1', 'user', 'question')];
    const items = mergeMessages(server, pending({ userMessageId: 'u1', reply: 'part' }));
    expect(items.map((i) => i.key)).toEqual(['u0', 'a0', 'L:user', 'L:assistant']);
    expect(items[2]).toMatchObject({ pending: false });
  });

  it('lets the server copy win once the finished reply is persisted', () => {
    const p = pending({ userMessageId: 'u1', assistantMessageId: 'a1', status: 'done', reply: 'full' });
    expect(mergeMessages([...history, msg('u1', 'user')], p).map((i) => i.key)).toEqual(['u0', 'a0', 'L:user', 'L:assistant']);
    const items = mergeMessages([...history, msg('u1', 'user'), msg('a1', 'assistant', 'full')], p);
    expect(items.map((i) => i.key)).toEqual(['u0', 'a0', 'u1', 'a1']);
  });

  it('makes a done reply actionable before the refetch lands', () => {
    const items = mergeMessages(history, pending({ userMessageId: 'u1', assistantMessageId: 'a1', status: 'done' }));
    expect(items[3]).toMatchObject({ kind: 'assistant', messageId: 'a1', state: 'complete' });
  });

  it('keeps a stopped reply locally until the server has one', () => {
    const p = pending({ userMessageId: 'u1', status: 'stopped', reply: 'half' });
    expect(mergeMessages([...history, msg('u1', 'user')], p).map((i) => i.key)).toEqual(['u0', 'a0', 'L:user', 'L:assistant']);
    expect(mergeMessages([...history, msg('u1', 'user'), msg('a1', 'assistant', 'half')], p).map((i) => i.key)).toEqual(['u0', 'a0', 'u1', 'a1']);
  });

  it('shows an error with the text to retry, replacing any partial server copy', () => {
    const error = { code: 'ai_unavailable' as const, messageKey: 'errors.aiUnavailable' as const, message: 'x', retryable: true };
    const server = [...history, msg('u1', 'user'), msg('a1', 'assistant', '', { status: 'error' })];
    const items = mergeMessages(server, pending({ userMessageId: 'u1', status: 'error', error }));
    expect(items.map((i) => i.key)).toEqual(['u0', 'a0', 'L:user', 'L:assistant']);
    expect(items[3]).toMatchObject({ state: 'error', retryText: 'question', error });
  });

  it('marks persisted error replies as incomplete', () => {
    const items = mergeMessages([msg('a9', 'assistant', '', { status: 'error' })], null);
    expect(items[0]).toMatchObject({ state: 'incomplete' });
  });
});

describe('followUpTargetIndex', () => {
  it('targets only a complete last assistant reply with follow-ups', () => {
    const withFollowUps = [msg('u0', 'user'), msg('a0', 'assistant', 'x', { followUps: ['next?'] })];
    expect(followUpTargetIndex(mergeMessages(withFollowUps, null))).toBe(1);
    expect(followUpTargetIndex(mergeMessages([...withFollowUps, msg('u1', 'user')], null))).toBe(-1);
    expect(followUpTargetIndex(mergeMessages(withFollowUps, pending({ followUps: ['x'] })))).toBe(-1);
  });
});

describe('parseMessage', () => {
  it('sanitizes jsonb columns', () => {
    const message = parseMessage({
      id: 'a1',
      role: 'assistant',
      content: 'hi',
      actions: [{ type: 'open_plan_section', id: 'o1', label: 'Open', sectionKey: 'pricing_strategy' }, { bogus: true }],
      follow_ups: ['a', 3],
      applied_action_ids: ['o1'],
      status: 'complete',
      created_at: '2026-11-05T10:00:00Z',
    });
    expect(message.actions).toHaveLength(1);
    expect(message.followUps).toEqual(['a']);
    expect(message.appliedActionIds).toEqual(['o1']);
  });
});
