import type { I18nValue } from '../../i18n';

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "14:05" for today, otherwise "3 Oct, 14:05" (in the browser's time zone). */
export function formatWhen(iso: string, i18n: Pick<I18nValue, 'formatDate' | 'formatTime'>, now = new Date()): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return i18n.formatTime(iso);
  return `${i18n.formatDate(iso, d.getFullYear() === now.getFullYear() ? undefined : { year: 'numeric' })}, ${i18n.formatTime(iso)}`;
}

/** Plain text of a Markdown-lite reply, for screen-reader announcements. */
export function plainText(markdown: string, max = 400): string {
  const text = markdown
    .replace(/[*`#]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
