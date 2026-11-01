export type ThemePref = 'dark' | 'light' | 'system';
const KEY = 'lf_theme';
export function getTheme(): ThemePref { try { const v = localStorage.getItem(KEY); if (v === 'dark' || v === 'light' || v === 'system') return v; } catch { /* ignore */ } return 'dark'; }
/** Dark is the default; "system" follows prefers-color-scheme (handled in tokens.css). */
export function applyTheme(pref: ThemePref): void {
  const el = document.documentElement;
  if (pref === 'system') el.removeAttribute('data-theme'); else el.setAttribute('data-theme', pref);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(el).getPropertyValue('--bg').trim() || 'black');
}
export function setTheme(pref: ThemePref): void { try { localStorage.setItem(KEY, pref); } catch { /* ignore */ } applyTheme(pref); }
