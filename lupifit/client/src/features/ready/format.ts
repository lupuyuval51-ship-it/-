/** Pure display helpers of the ready-workout pages (no React). */
import type { GenerationNote } from '@shared/types';
import type { I18nValue } from '../../i18n';

type T = Pick<I18nValue, 'tx' | 'formatNumber'>;

/** Notes that explain the sport finisher; they are shown next to the sport question, the rest under "adjusted for you". */
export const SPORT_NOTE_CODES: readonly string[] = ['sport_gentle', 'sport_none_fit'];

/**
 * Localized text of a server note (`ready.notes.<code>`). A sport id in the params becomes the sport's label,
 * numbers are formatted, exercise names arrive already localized. Unknown codes return null and are skipped.
 */
export function readyNoteText(note: GenerationNote, i18n: T): string | null {
  const params: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(note.params ?? {})) {
    params[k] = k === 'sport' && typeof v === 'string' ? i18n.tx(`enums.sport.${v}`, undefined, v) : typeof v === 'number' ? i18n.formatNumber(v) : v;
  }
  return i18n.tx(`ready.notes.${note.code}`, params, '') || null;
}

/** Notes split by where they are shown. */
export function splitNotes(notes: readonly GenerationNote[]): { sport: GenerationNote[]; adjusted: GenerationNote[] } {
  return { sport: notes.filter((n) => SPORT_NOTE_CODES.includes(n.code)), adjusted: notes.filter((n) => !SPORT_NOTE_CODES.includes(n.code)) };
}
