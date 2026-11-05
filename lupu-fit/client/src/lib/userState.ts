/**
 * Per-person data kept in localStorage that must not survive a change of person on a shared device.
 * Device-level preferences (language, theme, video options, the login-name prefill, ready-workout filter) stay.
 * Automation settings are keyed by user id already (`lf_automation_v1:<id>`) and are left alone.
 */
const EXACT = [
  'lf_live_session', 'lf_live_age_bucket', 'lf_auto_checkin_seen', 'lf_auto_backup', 'lf_onboarding_draft',
  'lf_shop_checked_v1', 'lf_menu_mealcount', 'lf_sport', /* = SPORT_STORE in workoutCompose.ts (checked in userState.test.ts) */
];
const PREFIXES = ['lf_rest_', 'lf_menu_v1_'];

export function wipeUserLocalState(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (EXACT.includes(k) || PREFIXES.some((p) => k.startsWith(p)))) doomed.push(k);
    }
    for (const k of doomed) localStorage.removeItem(k);
  } catch { /* storage unavailable: nothing was kept */ }
}
