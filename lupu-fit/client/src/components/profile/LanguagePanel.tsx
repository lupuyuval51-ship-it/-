import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, ApiRequestError } from '../../api/client.ts';
import { AI_AVAILABLE } from '../../env.ts';
import { DICT, useLang, useT } from '../../i18n/index.tsx';
import { LANGUAGES_LIST, customCode, dirFor, searchLanguages, type LangInfo } from '../../i18n/custom/languages.ts';
import { ensureTranslation, flatten, idbStore, type LangStore, type Poster, type StoredLang } from '../../i18n/custom/translate.ts';
import { Banner, Button, Segmented, Sheet, TextInput } from '../../ui/kit.tsx';
import { IconChevron } from '../../ui/icons.tsx';
import { useToast } from '../../ui/toast.tsx';
import '../../styles/language.css';

const defaultPost: Poster = (target, keys) => api.post('/api/i18n/translate', { target, keys });
type Phase = { k: 'idle' } | { k: 'run'; lang: string; n: number; total: number } | { k: 'err'; target: { code: string; name: string }; msg: string } | { k: 'cancelled'; target: { code: string; name: string } };

export function errorKey(e: unknown): string {
  if (e instanceof ApiRequestError) {
    if (e.status === 503 || e.code === 'ai_unavailable') return 'profile.ml.needAi';
    if (e.code === 'ai_busy') return 'profile.ml.busy';
    if (e.status === 429) return 'profile.ml.quota';
    return 'profile.ml.failed';
  }
  if (e instanceof Error && (e.name === 'NetworkError' || e.message === 'network_error')) return 'profile.ml.needAi';
  return 'profile.ml.failed';
}

/** Language section: built-in he/en segmented control + "translate the app to another language" sheet (machine translation, cached offline). */
export function LanguagePanel({ onBuiltIn, onCustomActivated, store = idbStore, post = defaultPost }: { onBuiltIn: (l: 'he' | 'en') => void; onCustomActivated?: () => void; store?: LangStore; post?: Poster }): ReactNode {
  const t = useT(); const { lang, custom, setLang, activateCustom } = useLang(); const toast = useToast();
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [other, setOther] = useState(''); const [otherErr, setOtherErr] = useState(false);
  const [phase, setPhase] = useState<Phase>({ k: 'idle' }); const [saved, setSaved] = useState<StoredLang[]>([]);
  const abort = useRef<AbortController | null>(null);

  const refresh = useCallback(() => { void store.list().then((l) => setSaved(l.sort((a, b) => b.updatedAt - a.updatedAt))); }, [store]);
  useEffect(() => { if (open) refresh(); }, [open, refresh]);
  useEffect(() => () => abort.current?.abort(), []);

  const start = useCallback(async (target: { code: string; name: string }) => {
    const ac = new AbortController(); abort.current = ac;
    setPhase({ k: 'run', lang: target.name, n: 0, total: 0 });
    try {
      const res = await ensureTranslation({ target, dir: dirFor(target.code), source: flatten(DICT.en), store, post, signal: ac.signal, onProgress: (n, total) => setPhase({ k: 'run', lang: target.name, n, total }) });
      activateCustom(res.lang); onCustomActivated?.();
      setPhase({ k: 'idle' }); setOpen(false);
      toast(res.lang.fallbackKeys > 0 ? t('profile.ml.partial', { n: res.lang.fallbackKeys }) : res.status === 'cached' ? t('profile.ml.cached') : t('profile.ml.switched', { lang: target.name }), 'ok');
    } catch (e) {
      if (ac.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) { setPhase({ k: 'cancelled', target }); refresh(); return; }
      setPhase({ k: 'err', target, msg: t(errorKey(e)) }); refresh();
    }
  }, [store, post, activateCustom, onCustomActivated, toast, t, refresh]);

  // Translation is an AI feature. Without an AI service (Device Mode without a proxy) only the two built-in languages are offered, and
  // a machine-translated language that is already active (from a backup of an older build) can still be switched away from.
  const canTranslate = AI_AVAILABLE;
  const results = useMemo(() => searchLanguages(q), [q]);
  const busy = phase.k === 'run';
  const useSaved = (s: StoredLang) => { activateCustom(s); onCustomActivated?.(); setOpen(false); toast(t('profile.ml.switched', { lang: s.name }), 'ok'); };
  const remove = async (s: StoredLang) => { if (custom?.code === s.code) setLang('en'); await store.remove(s.code); refresh(); toast(t('profile.ml.deleted', { lang: s.name }), 'ok'); };
  const submitOther = () => { const c = customCode(other); if (!c) { setOtherErr(true); return; } setOtherErr(false); void start(c); };
  const row = (l: LangInfo) => (
    <li key={l.code}><button type="button" className="ml-row" disabled={busy} onClick={() => void start({ code: l.code, name: l.native })} lang={l.code}>
      <span className="grow"><strong>{l.native}</strong><br /><span className="small muted" dir="ltr">{l.en} · {l.code}</span></span><IconChevron className="chev" />
    </button></li>
  );

  return (
    <div className="stack ml-panel">
      <Segmented label={t('profile.f.language')} value={custom ? 'custom' : lang} onChange={(v) => { if (v !== 'custom') onBuiltIn(v); }}
        options={[{ value: 'he' as const, label: t('profile.lang.he') }, { value: 'en' as const, label: t('profile.lang.en') }, ...(custom ? [{ value: 'custom' as const, label: custom.name }] : [])]} />
      {custom ? <span className="small muted" data-testid="ml-now">{t('profile.ml.now', { lang: custom.name })}</span> : null}
      {canTranslate ? (
        <>
          <button type="button" className="list-link ml-open" onClick={() => setOpen(true)}><span className="grow"><strong>{t('profile.ml.more')}</strong><br /><span className="small muted">{t('profile.ml.moreHint')}</span></span><IconChevron className="chev" /></button>
          <span className="small muted">{t('profile.ml.note')}</span>
        </>
      ) : <span className="small muted" data-testid="ml-builtin-only">{t('profile.ml.builtInOnly')}</span>}

      {canTranslate ? <Sheet open={open} onClose={() => { abort.current?.abort(); setPhase({ k: 'idle' }); setOpen(false); }} title={t('profile.ml.sheetTitle')}>
        {phase.k === 'run' ? (
          <div className="stack ml-progress" role="status" aria-live="polite">
            <div className="row"><span className="spinner" aria-hidden="true" /><strong>{phase.total === 0 ? t('profile.ml.preparing') : t('profile.ml.progress', { lang: phase.lang, n: Math.min(phase.n + 1, phase.total), total: phase.total })}</strong></div>
            <progress max={Math.max(phase.total, 1)} value={phase.n} aria-label={t('profile.ml.sheetTitle')} />
            <div className="skeleton-block" aria-hidden="true"><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>
            <Button onClick={() => abort.current?.abort()}>{t('profile.ml.cancel')}</Button>
          </div>
        ) : (
          <>
            {phase.k === 'err' ? <Banner tone="danger"><div className="stack-sm"><span data-testid="ml-error">{phase.msg}</span><Button size="sm" onClick={() => void start(phase.target)}>{t('app.retry')}</Button></div></Banner> : null}
            {phase.k === 'cancelled' ? <Banner tone="warn"><div className="stack-sm"><span>{t('profile.ml.cancelled')}</span><Button size="sm" onClick={() => void start(phase.target)}>{t('app.retry')}</Button></div></Banner> : null}
            {saved.length > 0 ? (
              <section className="stack-sm" aria-label={t('profile.ml.downloaded')}>
                <h4 className="small muted">{t('profile.ml.downloaded')}</h4>
                <ul className="ml-list">{saved.map((s) => (
                  <li key={s.code} className="ml-saved"><span className="grow" lang={s.code.startsWith('x-') ? undefined : s.code}><strong>{s.name}</strong>{custom?.code === s.code ? <span className="chip-note small"> · {t('profile.ml.active')}</span> : null}<br /><span className="small muted">{t('profile.ml.strings', { n: Object.keys(s.entries).length })}</span></span>
                    {custom?.code === s.code ? null : <Button size="sm" onClick={() => useSaved(s)}>{t('profile.ml.use')}</Button>}
                    <Button size="sm" variant="ghost" aria-label={t('profile.ml.delLabel', { lang: s.name })} onClick={() => void remove(s)}>{t('profile.ml.del')}</Button></li>
                ))}</ul>
              </section>
            ) : null}
            <TextInput label={t('profile.ml.search')} type="search" value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="ml-list" aria-label={t('profile.ml.sheetTitle')}>{results.map(row)}</ul>
            {results.length === 0 ? <p className="muted small">{t('profile.ml.noMatch')}</p> : null}
            <form className="stack-sm ml-other" onSubmit={(e) => { e.preventDefault(); submitOther(); }}>
              <TextInput label={t('profile.ml.other')} hint={t('profile.ml.otherHint')} value={other} maxLength={60} error={otherErr ? t('profile.ml.otherBad') : undefined} onChange={(e) => { setOther(e.target.value); setOtherErr(false); }} />
              <Button type="submit" disabled={other.trim().length < 2}>{t('profile.ml.otherGo')}</Button>
            </form>
            <Banner>{t('profile.ml.note')}</Banner>
          </>
        )}
      </Sheet> : null}
    </div>
  );
}
export { LANGUAGES_LIST };
