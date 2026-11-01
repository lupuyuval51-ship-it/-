import { useEffect, useState, type ReactNode } from 'react';
import { ApiRequestError } from '../../api/client.ts';
import { useT, type TFn } from '../../i18n/index.tsx';
import { Banner, errorMessage, Field, cx } from '../../ui/kit.tsx';

export type FieldErrors = Record<string, string>;
interface Issue { path: PropertyKey[]; code: string }
interface Parser<T> { safeParse(v: unknown): { success: true; data: T } | { success: false; error: { issues: Issue[] } } }

/** Runs a shared zod schema and turns its issues into friendly, translated field-level messages. */
export function validateForm<T>(schema: Parser<T>, input: Record<string, string>, t: TFn): { data: T; errors: null } | { data: null; errors: FieldErrors } {
  const r = schema.safeParse(input);
  if (r.success) return { data: r.data, errors: null };
  const errors: FieldErrors = {};
  for (const issue of r.error.issues) {
    const field = String(issue.path[0] ?? '');
    if (!field || errors[field]) continue;
    const empty = (input[field] ?? '').trim() === '';
    errors[field] = empty ? t('state.required') : field === 'email' ? t('auth.err.email') : field === 'password' && issue.code === 'too_small' ? t('auth.err.passwordShort') : field === 'token' ? t('auth.err.tokenInvalid') : t('state.invalid');
  }
  return { data: null, errors };
}

export type ServerFailure =
  | { kind: 'rate'; seconds: number | null; message: string }
  | { kind: 'field'; field: string; message: string }
  | { kind: 'form'; message: string };

/** Maps ApiRequestError / network failures to what the screen shows. */
export function describeFailure(e: unknown, t: TFn): ServerFailure {
  if (e instanceof ApiRequestError) {
    if (e.code === 'too_many_attempts' || e.status === 429) return { kind: 'rate', seconds: e.retryAfterSec, message: t('error.too_many_attempts') };
    if (e.code === 'email_taken') return { kind: 'field', field: 'email', message: t('error.email_taken') };
    if (e.code === 'invalid_credentials') return { kind: 'form', message: t('error.invalid_credentials') };
    if (e.code === 'invalid_or_expired_token') return { kind: 'form', message: t('auth.err.tokenInvalid') };
    if (e.code === 'validation_error') return { kind: 'form', message: t('error.validation_error') };
  }
  return { kind: 'form', message: errorMessage(e, t) };
}

/** Whole-second countdown; `start(n)` begins, `left` reaches 0 when the wait is over. */
export function useCountdown(): { left: number; start: (s: number) => void } {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return { left, start: setLeft };
}

export function PasswordField({ label, value, onChange, error, autoComplete, hint }: { label: string; value: string; onChange: (v: string) => void; error?: string | undefined; autoComplete: 'current-password' | 'new-password'; hint?: string }): ReactNode {
  const t = useT(); const [shown, setShown] = useState(false);
  return (
    <Field label={label} {...(hint ? { hint } : {})} error={error}>
      {(id, d) => (
        <div className="pw-wrap">
          <input id={id} className={cx('input')} type={shown ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} autoCapitalize="none" spellCheck={false} aria-describedby={d} aria-invalid={error ? true : undefined} />
          <button type="button" className="btn btn-ghost btn-sm" aria-pressed={shown} onClick={() => setShown((s) => !s)}>{t('auth.showPassword')}</button>
        </div>
      )}
    </Field>
  );
}

/** Form-level server failure. A 429 shows a live countdown while `left` > 0. */
export function FailureBanner({ failure, left }: { failure: ServerFailure | null; left: number }): ReactNode {
  const t = useT();
  if (!failure || failure.kind === 'field') return null;
  if (failure.kind === 'rate' && failure.seconds !== null) {
    if (left <= 0) return null;
    return <Banner tone="warn"><span>{t('auth.retryPrefix')} <span className="num">{left}</span> {t('unit.sec')}</span></Banner>;
  }
  return <Banner tone="danger">{failure.message}</Banner>;
}
