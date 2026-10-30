import { forwardRef, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { LIMITS } from '@shared/constants';
import { coachMessageSchema } from '@shared/schemas/coach';
import { Button } from '../../components/ui';
import { useI18n } from '../../i18n';
import { fieldErrorMessage } from '../../lib/errors';

export interface ComposerHandle {
  focus(): void;
}

const MAX = LIMITS.coachMessageMaxChars;

/** Message box: Enter sends, Shift+Enter adds a new line; grows with its content. */
export const Composer = forwardRef<ComposerHandle, {
  value: string;
  onChange(value: string): void;
  onSend(content: string): void;
  pending: boolean;
  disabled?: boolean;
}>(function Composer({ value, onChange, onSend, pending, disabled }, ref) {
  const i18n = useI18n();
  const { t } = i18n;
  const id = useId();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);
  useImperativeHandle(ref, () => ({ focus: () => textarea.current?.focus() }), []);

  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const submit = () => {
    if (pending || disabled) return;
    const parsed = coachMessageSchema.safeParse({ content: value });
    if (!parsed.success) {
      // Empty/whitespace-only input simply does nothing; other problems are shown.
      if (value.trim()) setError(fieldErrorMessage(parsed.error.issues[0]?.message ?? parsed.error.issues[0]?.code, i18n) ?? null);
      return;
    }
    setError(null);
    onSend(parsed.data.content);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const length = value.length;
  const canSend = value.trim().length > 0 && length <= MAX && !disabled;
  return (
    <form className="coach-composer" onSubmit={onSubmit} noValidate>
      <label htmlFor={id} className="visually-hidden">
        {t('coach.composer.label')}
      </label>
      <div className="coach-composer-row">
        <textarea
          ref={textarea}
          id={id}
          className="input textarea coach-input"
          rows={1}
          enterKeyHint="send"
          value={value}
          maxLength={MAX}
          placeholder={t('coach.composer.placeholder')}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-hint ${id}-count${error ? ` ${id}-error` : ''}`}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={onKeyDown}
        />
        <Button type="submit" variant="primary" icon="send" loading={pending} disabled={!canSend} aria-label={t('coach.composer.send')} className="coach-send">
          <span className="coach-send-label">{t('coach.composer.send')}</span>
        </Button>
      </div>
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      <div className="coach-composer-meta">
        <span id={`${id}-hint`}>{t('coach.composer.hint')}</span>
        <span id={`${id}-count`} className={`tabular${length > MAX * 0.9 ? ' coach-count-warn' : ''}`}>
          {t('coach.composer.counter', { count: i18n.formatNumber(length), max: i18n.formatNumber(MAX) })}
        </span>
      </div>
    </form>
  );
});
