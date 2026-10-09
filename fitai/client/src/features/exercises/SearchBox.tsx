import { useEffect, useRef, useState, type FormEvent } from 'react';
import { EXERCISE_SEARCH_MAX } from '@shared/schemas/exercises';
import { Icon, IconButton } from '../../components/ui';
import { useI18n } from '../../i18n';
import { cleanSearch } from './filters';

export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Debounced search input. Typing commits after a short pause; Enter commits at once;
 * the clear button / Escape clear immediately. External changes of `value` (back/forward,
 * "clear filters") replace the text unless they are the value this box just committed.
 */
export function SearchBox({ value, onCommit }: { value: string; onCommit(q: string): void }) {
  const { t } = useI18n();
  const [text, setText] = useState(value);
  const committed = useRef(value);
  const timer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    if (value !== committed.current) {
      // An outside change (back/forward, "clear") wins over text still waiting to be committed.
      if (timer.current != null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      committed.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    },
    [],
  );

  const commit = (raw: string) => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    const q = cleanSearch(raw);
    if (q === committed.current) return;
    committed.current = q;
    onCommitRef.current(q);
  };

  const schedule = (raw: string) => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(raw), SEARCH_DEBOUNCE_MS);
  };

  const clear = () => {
    setText('');
    commit('');
    inputRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    commit(text);
  };

  return (
    <form role="search" className="ex-search" onSubmit={onSubmit}>
      <span className="ex-search-icon" aria-hidden="true">
        <Icon name="search" size={18} />
      </span>
      <input
        ref={inputRef}
        className="input ex-search-input"
        type="search"
        aria-label={t('exercises.search.label')}
        placeholder={t('exercises.search.placeholder')}
        value={text}
        maxLength={EXERCISE_SEARCH_MAX}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        onChange={(e) => {
          setText(e.target.value);
          schedule(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && text) {
            e.preventDefault();
            clear();
          }
        }}
      />
      {text && <IconButton icon="close" size="sm" label={t('exercises.search.clear')} className="ex-search-clear" onClick={clear} />}
    </form>
  );
}
