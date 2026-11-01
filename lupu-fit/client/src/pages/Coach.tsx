import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { api, ApiRequestError } from '../api/client.ts';
import { Message } from '../components/coach/Message.tsx';
import { ck, type CoachStatus, type ThreadDetail, type ThreadRow } from '../components/coach/types.ts';
import { fmt, uiLanguageHint, useLang, useT } from '../i18n/index.tsx';
import { Banner, Button, ErrorState, errorMessage, IconButton, Sheet, TextArea, TextInput } from '../ui/kit.tsx';
import { IconChat, IconPlus, IconTrash, IconWarn } from '../ui/icons.tsx';
import { SkeletonList } from '../ui/patterns.tsx';
import { useToast } from '../ui/toast.tsx';
import '../styles/coach.css';

/** True from the two-pane breakpoint up. jsdom / SSR default to the phone layout. */
function useWide(): boolean {
  const q = '(min-width: 48rem)';
  const [w, setW] = useState(() => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(q).matches : false));
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const m = window.matchMedia(q); const f = () => setW(m.matches);
    m.addEventListener('change', f); f();
    return () => m.removeEventListener('change', f);
  }, []);
  return w;
}

const PROMPT_KEYS = ['workout', 'protein', 'weight', 'recovery'] as const;
interface Quota { window: 'minute' | 'day'; retry: number | null }

export default function Coach(): ReactNode {
  const t = useT(); const { lang } = useLang(); const toast = useToast(); const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const threadId = sp.get('thread');
  const selectThread = (id: string | null) => { setSp(id ? { thread: id } : {}, { replace: true }); setListOpen(false); };

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
  const wide = useWide();
  const [listOpen, setListOpen] = useState(false);

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
      await api.post(`/api/coach/threads/${id}/messages`, { text, lang, ...uiLanguageHint() });
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
  const empty = (!threadId || (detail.isSuccess && messages.length === 0)) && pending === null;
  const newChat = () => createThread.mutate(undefined, { onSuccess: (r) => selectThread(r.id), onError: (e) => toast(errorMessage(e, t), 'error') });

  const threadList = (
    <div className="stack-sm coach-threads-inner">
      <Button block onClick={newChat} disabled={createThread.isPending}><IconPlus aria-hidden="true" /> {t('coach.newChat')}</Button>
      {threads.isPending ? <SkeletonList rows={3} /> : threads.isError ? <ErrorState error={threads.error} onRetry={() => void threads.refetch()} /> : list.length === 0 ? <span className="small muted">{t('coach.noThreads')}</span> : (
        <ul className="list thread-list">
          {list.map((th) => (
            <li key={th.id} className={th.id === threadId ? 'active' : undefined}>
              <button type="button" className="thread-btn grow start" aria-current={th.id === threadId ? 'true' : undefined} onClick={() => selectThread(th.id)}><strong>{th.title}</strong><br /><span className="small muted">{fmt.date(th.updatedAt, lang)}</span></button>
              <Button size="sm" variant="ghost" className="nu-muted-btn" onClick={() => { setListOpen(false); setRenaming(th); setRenameText(th.title); }}>{t('action.edit')}</Button>
              <IconButton label={t('coach.deleteThread', { name: th.title })} onClick={() => { setListOpen(false); setDeleting(th); }}><IconTrash /></IconButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="coach">
      {wide ? <aside className="coach-threads" aria-label={t('coach.threads')}>{threadList}</aside> : null}

      <section className="coach-chat" aria-label={t('coach.chat')}>
        <header className="coach-head">
          <div className="grow" style={{ minInlineSize: 0 }}>
            <h1>{t('coach.title')}</h1>
            {providerText ? <span className="tag" data-testid="provider-label">{providerText}</span> : null}
          </div>
          {!wide ? <Button size="sm" onClick={() => setListOpen(true)} aria-haspopup="dialog"><IconChat aria-hidden="true" /> {t('coach.chats')}</Button> : null}
          {!wide ? <IconButton label={t('coach.newChat')} onClick={newChat} disabled={createThread.isPending}><IconPlus /></IconButton> : null}
        </header>
        {status.data?.freeTierNotice ? <Banner tone="warn">{t('coach.freeTier')}</Banner> : null}

        <div className="chat-scroll" ref={scroller} role="log" aria-live="polite" aria-label={t('coach.messages')}>
          <p className="tiny muted coach-disclaimer">{t('disclaimer.health')}</p>
          {threadId && detail.isPending ? <SkeletonList rows={2} /> : null}
          {threadId && detail.isError ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} /> : null}
          {empty ? (
            <div className="coach-empty">
              <IconChat aria-hidden="true" />
              <strong>{t('coach.emptyTitle')}</strong>
              <span className="small muted">{t('coach.emptyHint')}</span>
            </div>
          ) : null}
          {messages.map((m) => <Message key={m.id} m={m} onCopy={(x) => void copy(x)} />)}
          {pending !== null ? (
            <>
              <div className="msg msg-user" data-testid="message-pending">{pending}</div>
              <div className="msg msg-assistant msg-typing" role="status" aria-label={t('coach.thinking')}><span className="dots" aria-hidden="true"><i /><i /><i /></span><span className="small muted">{t('coach.thinking')}</span></div>
            </>
          ) : null}
        </div>

        <div className="composer-wrap">
          {quota ? (
            <div className="banner warn coach-quota" role="status"><IconWarn aria-hidden="true" /><div className="grow"><strong>{quota.window === 'day' ? t('coach.quotaDayTitle') : t('coach.quotaTitle')}</strong><br />{quota.window === 'day' ? t('coach.quota.day') : t('coach.quota.minute', { s: quota.retry ?? 30 })} {t('coach.draftKept')}</div></div>
          ) : null}
          {sendErr ? <ErrorState error={sendErr} /> : null}
          <div className="prompt-chips" role="group" aria-label={t('coach.suggested')}>
            {PROMPT_KEYS.map((k) => <button type="button" key={k} className="chip" onClick={() => void send(t(`coach.prompts.${k}`))} disabled={pending !== null || createThread.isPending}>{t(`coach.prompts.${k}`)}</button>)}
          </div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); void send(draft); }}>
            <TextArea label={t('coach.inputLabel')} hint={t('coach.inputHint')} placeholder={t('coach.composerHint')} value={draft} maxLength={2000} rows={1} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} />
            <Button type="submit" variant="primary" disabled={draft.trim() === '' || pending !== null}>{t('coach.send')}</Button>
          </form>
        </div>
      </section>

      <Sheet open={!wide && listOpen} onClose={() => setListOpen(false)} title={t('coach.threads')}>{threadList}</Sheet>
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
