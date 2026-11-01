/** Per-date menu choice + shopping check-offs in localStorage (preferences only, no tokens). All access is try/catch-guarded. */
import { DEFAULT_CHOICE, type MenuChoice } from './logic.ts';

const CHOICE = (date: string) => `lf_menu_v1_${date}`;
const PREF = 'lf_menu_mealcount';
const CHECKED = 'lf_shop_checked_v1';

const read = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export function prefMealCount(): 3 | 4 | 5 { const n = Number(read(PREF)); return n === 3 || n === 4 || n === 5 ? n : DEFAULT_CHOICE.mealCount; }
export function loadChoice(date: string): MenuChoice {
  const fallback: MenuChoice = { mealCount: prefMealCount(), shuffle: 0, swaps: [] };
  const raw = read(CHOICE(date));
  if (!raw) return fallback;
  try {
    const j = JSON.parse(raw) as Partial<MenuChoice>;
    const mealCount = j.mealCount === 3 || j.mealCount === 4 || j.mealCount === 5 ? j.mealCount : fallback.mealCount;
    return { mealCount, shuffle: Number.isInteger(j.shuffle) ? (j.shuffle as number) : 0, swaps: Array.isArray(j.swaps) ? j.swaps.filter((x) => Number.isInteger(x) && x >= 0 && x < 5) : [] };
  } catch { return fallback; }
}
export function saveChoice(date: string, c: MenuChoice): void { write(CHOICE(date), JSON.stringify(c)); write(PREF, String(c.mealCount)); }

export function loadChecked(): Set<string> {
  try { const a = JSON.parse(read(CHECKED) ?? '[]') as unknown; return new Set(Array.isArray(a) ? a.filter((x): x is string => typeof x === 'string') : []); } catch { return new Set(); }
}
export function saveChecked(s: ReadonlySet<string>): void { write(CHECKED, JSON.stringify([...s])); }
