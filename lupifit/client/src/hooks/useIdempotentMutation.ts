import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useRef } from 'react';
import { newIdempotencyKey } from '../lib/ids';

/**
 * Like useMutation, but every `mutate(vars)` call gets a fresh Idempotency-Key that is
 * reused if the same submission is retried via `retryLast()`. Combined with disabled
 * buttons while pending, this prevents duplicate submissions (double taps, flaky
 * networks, retries after timeouts).
 */
export function useIdempotentMutation<TData, TVars = void, TError = Error>(
  fn: (vars: TVars, idempotencyKey: string) => Promise<TData>,
  options: Omit<UseMutationOptions<TData, TError, { vars: TVars; key: string }>, 'mutationFn'> & {
    onSuccessVars?: (data: TData, vars: TVars) => void;
  } = {},
) {
  const last = useRef<{ vars: TVars; key: string } | null>(null);
  const { onSuccessVars, ...rest } = options;
  const m = useMutation<TData, TError, { vars: TVars; key: string }>({
    ...rest,
    mutationFn: ({ vars, key }) => fn(vars, key),
    onSuccess: (data, v, ctx, mctx) => {
      onSuccessVars?.(data, v.vars);
      return rest.onSuccess?.(data, v, ctx, mctx);
    },
  });
  return {
    ...m,
    mutate: (vars: TVars) => {
      const payload = { vars, key: newIdempotencyKey() };
      last.current = payload;
      m.mutate(payload);
    },
    mutateAsync: (vars: TVars) => {
      const payload = { vars, key: newIdempotencyKey() };
      last.current = payload;
      return m.mutateAsync(payload);
    },
    retryLast: () => {
      if (last.current) m.mutate(last.current);
    },
  };
}
