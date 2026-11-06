/**
 * Settings that live only in this browser/app (localStorage) and travel in the backup file's own `clientSettings` block.
 *
 * A fixed list of typed values, never a dump of `lf_*` keys: the whitelist below is the ONLY thing read or written. Credentials and
 * session state (`lf_username`, `lf_last_uid`, `lf_ephemeral`), the live workout and its rest timer, drafts, the monthly backup
 * reminder state, the custom-language cache and anything keyed by a person's id (other than the automation settings and the remembered
 * sport, which are exported WITHOUT the id and re-keyed to the person restoring) are deliberately not in it.
 */
import { SPORTS, type ClientSettings, type Language } from '@lupu-fit/shared';
import { loadSettings, normalizeSettings, saveSettings } from '../../automation/settings.ts';
import { setTheme, storedTheme } from '../../lib/theme.ts';
import { READY_FILTER_STORE } from '../../lib/workoutCompose.ts';
import { BUDGETS_MB } from './sw.ts';
import { readSport, writeSport } from '../workouts/FinisherPicker.tsx';

const LANG_KEY = 'lf_lang';
const LANG_CUSTOM_KEY = 'lf_lang_custom';
const WIFI_KEY = 'lf_video_wifi_only';
const BUDGET_KEY = 'lf_video_budget_mb';
const MEAL_COUNT_KEY = 'lf_menu_mealcount';
const CHECKED_KEY = 'lf_shop_checked_v1';
const MENU_PREFIX = 'lf_menu_v1_';
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_MENUS = 400;

const get = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* storage unavailable: the setting is simply not restored */ } };
const json = (raw: string | null): unknown => { try { return raw === null ? undefined : JSON.parse(raw); } catch { return undefined; } };
const isMealCount = (v: unknown): v is 3 | 4 | 5 => v === 3 || v === 4 || v === 5;

/** What this browser holds, in the shape of the backup file's `clientSettings` block (only what is actually set). */
export function collectClientSettings(userId: string | null): ClientSettings {
  const out: ClientSettings = { v: 1 };
  const theme = storedTheme(); if (theme) out.theme = theme;
  const lang = get(LANG_KEY); if (lang === 'he' || lang === 'en') out.language = lang;
  if (userId) { const sport = readSport(userId); if (sport) out.sport = sport; }
  const wifi = get(WIFI_KEY); if (wifi === '1' || wifi === '0') out.videoWifiOnly = wifi === '1';
  const budget = Number(get(BUDGET_KEY)); if ((BUDGETS_MB as readonly number[]).includes(budget)) out.videoBudgetMb = budget;
  const filter = get(READY_FILTER_STORE); if (filter && filter.length <= 2000 && typeof json(filter) === 'object' && json(filter) !== null) out.readyFilter = filter;
  const count = Number(get(MEAL_COUNT_KEY)); if (isMealCount(count)) out.menuMealCount = count;
  const checked = json(get(CHECKED_KEY)); if (Array.isArray(checked)) { const l = checked.filter((x): x is string => typeof x === 'string' && x.length <= 80).slice(0, 1000); if (l.length) out.shopChecked = l; }
  const menus: NonNullable<ClientSettings['menus']> = {};
  try {
    const dates: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(MENU_PREFIX) && DATE_KEY.test(k.slice(MENU_PREFIX.length))) dates.push(k.slice(MENU_PREFIX.length)); }
    for (const date of dates.sort().reverse().slice(0, MAX_MENUS)) {
      const j = json(get(`${MENU_PREFIX}${date}`)) as { mealCount?: unknown; shuffle?: unknown; swaps?: unknown } | undefined;
      if (j && isMealCount(j.mealCount) && Number.isInteger(j.shuffle) && (j.shuffle as number) >= 0 && (j.shuffle as number) <= 100_000) {
        menus[date] = { mealCount: j.mealCount, shuffle: j.shuffle as number, swaps: Array.isArray(j.swaps) ? j.swaps.filter((x): x is number => Number.isInteger(x) && x >= 0 && x <= 4).slice(0, 5) : [] };
      }
    }
  } catch { /* storage unavailable */ }
  if (Object.keys(menus).length) out.menus = menus;
  if (get(`lf_automation_v1:${userId ?? 'anon'}`) !== null) out.automation = loadSettings(userId) as unknown as Record<string, unknown>;
  return out;
}

/**
 * Writes a validated block back. Returns the language the app should switch to (the caller owns the language context); theme and
 * everything else is applied here. Each value is checked again, the file is never trusted.
 */
export function applyClientSettings(s: ClientSettings, userId: string | null): { language?: Language } {
  const result: { language?: Language } = {};
  if (s.theme) setTheme(s.theme);
  if (s.language) { put(LANG_KEY, s.language); try { localStorage.removeItem(LANG_CUSTOM_KEY); } catch { /* ignore */ } result.language = s.language; }
  if (s.sport && userId && (SPORTS as readonly string[]).includes(s.sport)) writeSport(userId, s.sport);
  if (s.videoWifiOnly !== undefined) put(WIFI_KEY, s.videoWifiOnly ? '1' : '0');
  if (s.videoBudgetMb !== undefined && (BUDGETS_MB as readonly number[]).includes(s.videoBudgetMb)) put(BUDGET_KEY, String(s.videoBudgetMb));
  if (s.readyFilter !== undefined && typeof json(s.readyFilter) === 'object' && json(s.readyFilter) !== null) put(READY_FILTER_STORE, s.readyFilter);
  if (s.shopChecked) put(CHECKED_KEY, JSON.stringify(s.shopChecked));
  for (const [date, c] of Object.entries(s.menus ?? {})) if (DATE_KEY.test(date)) put(`${MENU_PREFIX}${date}`, JSON.stringify(c));
  if (s.menuMealCount !== undefined) put(MEAL_COUNT_KEY, String(s.menuMealCount));
  if (s.automation) saveSettings(userId, normalizeSettings(s.automation));
  return result;
}
