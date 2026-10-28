import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * A single query-string parameter as state: survives reloads, back/forward and shared links.
 * Invalid or missing values fall back to `fallback`; the default value is kept out of the URL.
 */
export function useUrlState<T extends string | number>(name: string, parse: (raw: string | null) => T | null, fallback: T): [T, (value: T) => void] {
  const [params, setParams] = useSearchParams();
  const value = parse(params.get(name)) ?? fallback;
  const set = useCallback(
    (next: T) =>
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          if (next === fallback) out.delete(name);
          else out.set(name, String(next));
          return out;
        },
        { replace: true },
      ),
    [name, fallback, setParams],
  );
  return [value, set];
}

/** Parser for a parameter that must be one of `allowed` (matched on its string form). */
export function oneOf<T extends string | number>(allowed: readonly T[]): (raw: string | null) => T | null {
  return (raw) => (raw == null ? null : (allowed.find((a) => String(a) === raw) ?? null));
}
