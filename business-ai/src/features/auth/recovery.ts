/**
 * Parses Supabase auth callback parameters (password recovery / email confirmation links).
 * With PKCE the link carries `?code=…`; failures carry `error`, `error_code`, `error_description`
 * in the query or the hash fragment.
 */
export interface AuthCallbackParams {
  code: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

type ParamValue = string | string[] | undefined;

function first(value: ParamValue): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

/** From expo-router `useLocalSearchParams()` (query params only). */
export function parseAuthCallbackParams(params: Readonly<Record<string, ParamValue>>): AuthCallbackParams {
  return {
    code: first(params.code),
    errorCode: first(params.error_code) ?? first(params.error),
    errorDescription: first(params.error_description),
  };
}

/** From a full URL, including the hash fragment (`#error=…`). */
export function parseAuthCallbackUrl(url: string | null | undefined): AuthCallbackParams {
  const empty: AuthCallbackParams = { code: null, errorCode: null, errorDescription: null };
  if (!url) return empty;
  const [beforeHash, hash = ''] = url.split('#', 2);
  const query = beforeHash?.includes('?') ? (beforeHash.split('?', 2)[1] ?? '') : '';
  const read = (source: string): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const pair of source.split('&')) {
      if (!pair) continue;
      const [k, v = ''] = pair.split('=');
      if (!k) continue;
      try {
        out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '));
      } catch {
        out[k] = v;
      }
    }
    return out;
  };
  const merged = { ...read(hash), ...read(query) };
  return parseAuthCallbackParams(merged);
}

export function hasAuthCallbackError(params: AuthCallbackParams): boolean {
  return params.errorCode !== null || params.errorDescription !== null;
}
