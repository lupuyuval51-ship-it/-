import { AppErrorException, toAppError } from './errors';

/**
 * Unwraps a supabase-js `{ data, error }` result: returns data or throws AppErrorException
 * (so TanStack Query `error` is always an Error carrying a mapped AppError).
 */
export function unwrap<T>(result: { data: T; error: unknown }): NonNullable<T> {
  if (result.error) throw new AppErrorException(toAppError(result.error));
  if (result.data === null || result.data === undefined) {
    throw new AppErrorException(toAppError({ code: 'PGRST116', message: 'No rows returned' }));
  }
  return result.data as NonNullable<T>;
}

/** Like unwrap, but allows `null` data (maybeSingle). */
export function unwrapMaybe<T>(result: { data: T | null; error: unknown }): T | null {
  if (result.error) throw new AppErrorException(toAppError(result.error));
  return result.data ?? null;
}
