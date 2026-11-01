import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { api, ApiRequestError } from '../api/client.ts';
import { Message } from '../components/coach/Message.tsx';
import { ck, type CoachStatus, type ThreadDetail, type ThreadRow } from '../components/coach/types.ts';
import { fmt, useLang, useT } from '../i18n/index.tsx';
import { Banner, Button, Card, EmptyState, ErrorState, errorMessage, IconButton, Loading, Sheet, TextArea, TextInput } from '../ui/kit.tsx';
import { IconPlus, IconTrash } from '../ui/icons.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/coach.css';

const PROMPT_KEYS = ['workout', 'protein', 'weight', 'recovery'] as const;
interface Quota { window: 'minute' | 'day'; retry: number | null }

export default function Coach(): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const threadId = sp.get('thread');
  const selectThread = (id: string | null) => setSp(id ? { thread: id } : {}, { replace: true });

  const status = useQuery({ queryKey: ck.status, queryFn: () => api.get<CoachStatus>('/api/coach/status'), staleTime: 60_000 });
  const threads = useQuery({ queryKey: ck.threads, queryFn: async () => (await api.get<{ threads: ThreadRow[] }>('/api/coach/threads')).threads });
  const detail = useQuery({ queryKey: ck.thread(threadId ?? ''), enabled: !!threadId, queryFn: () => api.get<ThreadDetail>(`/api/coach/threads/${threadId}`) });

  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [sendErr, setSendErr] = useState<unknown>(null);
  const [renaming, setRenaming] = useState<ThreadRow | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleting, setDeleting] = useState<ThreadRow | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const messages = detail.data?.messages ?? [];
  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight; }, [messages.length, pending]);

  const createThread = useMutation({
    mutationFn: (title?: string) => api.post<{ id: string }>('/api/coach/threads', title ? { title: title.slice(0, 120) } : { title: t('coach.newChat') }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ck.threads }); },
  });
  const rename = useMutation({
    mutationFn: (v: { id: string; title: string }) => api.patch(`/api/coach/threads/${v.id}`, { title: v.title }),
    onSuccess: (_r, v) => { void qc.invalidateQueries({ queryKey: ck.threads }); void qc.invalidateQueries({ queryKey: ck.thread(v.id) }); setRenaming(null); toast(t('state.saved'), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/coach/threads/${id}`),
    onSuccess: (_r, id) => { void qc.invalidateQueries({ queryKey: ck.threads }); qc.removeQueries({ queryKey: ck.thread(id) }); if (threadId === id) selectThread(null); setDeleting(null); toast(t('state.deleted'), 'ok'); },
    onError: (e) => toast(errorMessage(e, t), 'error'),
  });

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || pending !== null) return;
    setQuota(null); setSendErr(null);
    let id = threadId;
    try {
      if (!id) { id = (await createThread.mutateAsync(text)).id; selectThread(id); }
      setPending(text); setDraft('');
      await api.post(`/api/coach/threads/${id}/messages`, { text, lang });
      await Promise.all([qc.invalidateQueries({ queryKey: ck.thread(id) }), qc.invalidateQueries({ queryKey: ck.threads })]);
    } catch (e) {
      setDraft(text);
      if (e instanceof ApiRequestError && e.status === 429) setQuota({ window: (e.body as { window?: string } | null)?.window === 'day' ? 'day' : 'minute', retry: e.retryAfterSec });
      else setSendErr(e);
    } finally { setPending(null); }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(draft); }
  };
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast(t('coach.copied'), 'ok'); } catch { toast(t('coach.copyFailed'), 'error'); } };

  const providerText = status.data ? (status.data.provider === 'rules' ? t('coach.provider.rules') : t('coach.provider.aiNamed', { name: status.data.provider })) : null;
  const list = threads.data ?? [];

  return (
    <div className={`coach ${threadId ? 'has-thread' : ''}`}>
      <aside className="coach-threads stack-sm" aria-label={t('coach.threads')}>
        <div className="row-between">
          <h1>{t('coach.title')}</h1>
          <IconButton label={t('coach.newChat')} onClick={() => createThread.mutate(undefined, { onSuccess: (r) => selectThread(r.id), onError: (e) => toast(errorMessage(e, t), 'error') })} disabled={createThread.isPending}><IconPlus /></IconButton>
        </div>
        {threads.isPending ? <Loading /> : threads.isError ? <ErrorState error={threads.error} onRetry={() => void threads.refetch()} /> : list.length === 0 ? <span className="small muted">{t('coach.noThreads')}</span> : (
          <ul className="list thread-list">
            {list.map((th) => (
              <li key={th.id} className={th.id === threadId ? 'active' : undefined}>
                <button type="button" className="thread-btn grow start" aria-current={th.id === threadId ? 'true' : undefined} onClick={() => selectThread(th.id)}><strong>{th.title}</strong><br /><span className="small muted">{fmt.date(th.updatedAt, lang)}</span></button>
                <Button size="sm" variant="ghost" onClick={() => { setRenaming(th); setRenameText(th.title); }}>{t('action.edit')}</Button>
                <IconButton label={t('coach.deleteThread', { name: th.title })} onClick={() => setDeleting(th)}><IconTrash /></IconButton>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="coach-chat stack" aria-label={t('coach.chat')}>
        <div className="row-between">
          <Button size="sm" variant="ghost" className="back-to-list" onClick={() => selectThread(null)}>{t('coach.backToList')}</Button>
          {providerText ? <span className="tag" data-testid="provider-label">{providerText}</span> : null}
        </div>
        {status.data?.freeTierNotice ? <Banner tone="warn">{t('coach.freeTier')}</Banner> : null}
        <p className="small muted">{t('disclaimer.health')}</p>

        <div className="chat-scroll" ref={scroller} role="log" aria-live="polite" aria-label={t('coach.messages')}>
          {threadId && detail.isPending ? <Loading /> : null}
          {threadId && detail.isError ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} /> : null}
          {(!threadId || (detail.isSuccess && messages.length === 0)) && pending === null ? (
            <Card className="stack">
              <EmptyState title={t('coach.emptyTitle')} hint={t('coach.emptyHint')} />
              <div className="stack-sm" role="group" aria-label={t('coach.suggested')}>
                {PROMPT_KEYS.map((k) => <Button key={k} className="start" onClick={() => void send(t(`coach.prompts.${k}`))} disabled={pending !== null || createThread.isPending}>{t(`coach.prompts.${k}`)}</Button>)}
              </div>
            </Card>
          ) : null}
          {messages.map((m) => <Message key={m.id} m={m} onCopy={(x) => void copy(x)} />)}
          {pending !== null ? (
            <>
              <div className="msg msg-user" data-testid="message-pending">{pending}</div>
              <div className="msg msg-assistant" role="status" aria-label={t('coach.thinking')}><span className="muted">{t('coach.thinking')}</span></div>
            </>
          ) : null}
        </div>

        {quota ? <Banner tone="warn">{quota.window === 'day' ? t('coach.quota.day') : t('coach.quota.minute', { s: quota.retry ?? 30 })}</Banner> : null}
        {sendErr ? <ErrorState error={sendErr} /> : null}
        <form className="composer stack-sm" onSubmit={(e) => { e.preventDefault(); void send(draft); }}>
          <TextArea label={t('coach.inputLabel')} hint={t('coach.inputHint')} value={draft} maxLength={2000} rows={3} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} />
          <Button type="submit" variant="primary" disabled={draft.trim() === '' || pending !== null}>{t('coach.send')}</Button>
        </form>
      </section>

      <Sheet open={!!renaming} onClose={() => setRenaming(null)} title={t('coach.renameTitle')}>
        <TextInput label={t('coach.renameLabel')} value={renameText} maxLength={120} onChange={(e) => setRenameText(e.target.value)} />
        <Button disabled={renameText.trim() === '' || rename.isPending} onClick={() => renaming && rename.mutate({ id: renaming.id, title: renameText.trim() })}>{t('action.save')}</Button>
      </Sheet>
      <Sheet open={!!deleting} onClose={() => setDeleting(null)} title={t('coach.deleteTitle')}>
        <p>{t('coach.deleteBody', { name: deleting?.title ?? '' })}</p>
        <div className="row-wrap">
          <Button variant="danger" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>{t('action.delete')}</Button>
          <Button variant="ghost" onClick={() => setDeleting(null)}>{t('action.cancel')}</Button>
        </div>
      </Sheet>
    </div>
  );
}
