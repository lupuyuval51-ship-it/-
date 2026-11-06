import { ClientSettingsSchema } from '@lupu-fit/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../../automation/settings.ts';
import { applyClientSettings, collectClientSettings } from './clientSettings.ts';

const USER = 'u-old';
beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute('data-theme'); });

describe('collectClientSettings', () => {
  it('exports only the whitelisted settings, as typed values, validated by the shared schema', () => {
    // Everything a browser can hold: the whitelist, plus credentials, session state, drafts, the live workout and caches that must stay out.
    const all: Record<string, string> = {
      lf_theme: 'light', lf_lang: 'he', lf_sport: JSON.stringify({ [USER]: 'running', other: 'soccer' }), lf_video_wifi_only: '1', lf_video_budget_mb: '600', lf_ready_filter: JSON.stringify({ place: 'gym' }),
      lf_menu_mealcount: '4', lf_shop_checked_v1: JSON.stringify(['rice', 'eggs']), 'lf_menu_v1_2026-11-02': JSON.stringify({ mealCount: 4, shuffle: 2, swaps: [1] }),
      [`lf_automation_v1:${USER}`]: JSON.stringify({ ...DEFAULT_SETTINGS, workout: { on: true, time: '07:30', days: [1, 3] } }),
      lf_username: 'dana', lf_last_uid: USER, lf_ephemeral: '1', lf_live_session: '{"id":"s"}', lf_live_age_bucket: 'adult', lf_onboarding_draft: '{"age":30}', lf_rest_x: '5', lf_auto_backup: '{}', lf_auto_checkin_seen: '2026-11-02', lf_lang_custom: '{"code":"fr"}',
      session_token: 'abc', lf_session: 'abc', password: 'p',
    };
    for (const [k, v] of Object.entries(all)) localStorage.setItem(k, v);
    const s = collectClientSettings(USER);
    expect(ClientSettingsSchema.safeParse(s).success).toBe(true);
    expect(s).toMatchObject({ v: 1, theme: 'light', language: 'he', sport: 'running', videoWifiOnly: true, videoBudgetMb: 600, readyFilter: '{"place":"gym"}', menuMealCount: 4, shopChecked: ['rice', 'eggs'], menus: { '2026-11-02': { mealCount: 4, shuffle: 2, swaps: [1] } } });
    expect((s.automation as { workout: { on: boolean } }).workout.on).toBe(true);
    const text = JSON.stringify(s);
    for (const secret of ['dana', USER, 'abc', 'lf_', 'adult', '"s"', 'fr', 'other', 'soccer']) expect(text, secret).not.toContain(secret);
    expect(Object.keys(s).sort()).toEqual(['automation', 'language', 'menuMealCount', 'menus', 'readyFilter', 'shopChecked', 'sport', 'theme', 'v', 'videoBudgetMb', 'videoWifiOnly']);
  });

  it('is just { v: 1 } on a browser with nothing set, and ignores junk values', () => {
    expect(collectClientSettings(null)).toEqual({ v: 1 });
    localStorage.setItem('lf_theme', 'neon'); localStorage.setItem('lf_lang', 'x-klingon'); localStorage.setItem('lf_menu_mealcount', '9'); localStorage.setItem('lf_video_budget_mb', '7'); localStorage.setItem('lf_ready_filter', 'not json');
    expect(collectClientSettings(USER)).toEqual({ v: 1 });
  });
});

describe('applyClientSettings', () => {
  it('writes validated values back, re-keys per-person ones to the person restoring, and reports the language', () => {
    const NEW = 'u-new';
    const out = applyClientSettings({
      v: 1, theme: 'dark', language: 'en', sport: 'cycling', videoWifiOnly: false, videoBudgetMb: 300, readyFilter: '{"place":"home"}', menuMealCount: 5, shopChecked: ['milk'],
      menus: { '2026-11-03': { mealCount: 5, shuffle: 1, swaps: [0, 2] } }, automation: { ...DEFAULT_SETTINGS, weigh: { on: true, day: 2, time: '07:00' } },
    }, NEW);
    expect(out).toEqual({ language: 'en' });
    expect(localStorage.getItem('lf_theme')).toBe('dark'); expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('lf_lang')).toBe('en'); expect(localStorage.getItem('lf_video_wifi_only')).toBe('0'); expect(localStorage.getItem('lf_video_budget_mb')).toBe('300');
    expect(JSON.parse(localStorage.getItem('lf_sport') as string)).toEqual({ [NEW]: 'cycling' });
    expect(localStorage.getItem('lf_menu_mealcount')).toBe('5'); expect(JSON.parse(localStorage.getItem('lf_shop_checked_v1') as string)).toEqual(['milk']);
    expect(JSON.parse(localStorage.getItem('lf_menu_v1_2026-11-03') as string)).toEqual({ mealCount: 5, shuffle: 1, swaps: [0, 2] });
    expect(loadSettings(NEW).weigh).toEqual({ on: true, day: 2, time: '07:00' });
    expect(localStorage.getItem('lf_automation_v1:u-old')).toBeNull();
  });

  it('never writes anything outside the whitelist, whatever a file claims, and re-checks every value', () => {
    const before = Object.keys(localStorage).length;
    applyClientSettings({ v: 1, videoBudgetMb: 7, readyFilter: 'not json', automation: { workout: { on: 'yes', time: '99:99', days: [9] }, evil: 'x' } } as never, null);
    const keys = Object.keys(localStorage);
    expect(keys.filter((k) => !['lf_automation_v1:anon'].includes(k)).length).toBe(before);
    expect(localStorage.getItem('lf_video_budget_mb')).toBeNull(); expect(localStorage.getItem('lf_ready_filter')).toBeNull();
    expect(loadSettings(null).workout).toMatchObject({ on: false, time: DEFAULT_SETTINGS.workout.time }); // damaged automation values fall back to the defaults
    saveSettings(null, DEFAULT_SETTINGS);
  });
});
