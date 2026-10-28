import type { LocalizedText } from '../content';

export type { LocalizedText };
/** ISO-8601 timestamp, e.g. 2026-10-09T18:30:00.000Z */
export type ISODateTime = string;
/** Calendar date YYYY-MM-DD in the user's time zone. */
export type ISODate = string;

/** Every non-2xx API response has this body. `code` maps to i18n key `errors.<code>`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OkResponse {
  ok: true;
}
