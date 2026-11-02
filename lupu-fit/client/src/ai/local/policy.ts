import type { AiKind, AiMode } from './types.ts';

export interface PolicyInput {
  mode: AiMode;
  installed: boolean;
  supported: boolean;
  /** The user downloaded the model on purpose. */
  enabled: boolean;
  kind: AiKind;
  /** Settings toggle for on-device translation (default off). */
  translateLocal: boolean;
}
export interface Choice {
  first: 'local' | 'cloud';
  /** After a local failure/timeout, may the cloud path (proxy) be tried? false only for "On-device only". */
  fallbackToCloud: boolean;
}

/**
 * Which provider answers first.
 *  - cloud: never local.
 *  - local ("On-device only"): local only, never the cloud (a failure ends in the rules-based coach on the route).
 *  - auto: local ONLY if installed + supported + user enabled it (and, for translation, the translate toggle), otherwise cloud; local errors fall back to cloud.
 * Safety classification, snapshot-only numbers, minors caps and the rules-coach fallback all live in the route, not here.
 */
export function chooseProvider(i: PolicyInput): Choice {
  if (i.mode === 'cloud') return { first: 'cloud', fallbackToCloud: false };
  if (i.mode === 'local') return { first: 'local', fallbackToCloud: false };
  const usable = i.installed && i.supported && i.enabled && (i.kind === 'coach' || i.translateLocal);
  return usable ? { first: 'local', fallbackToCloud: true } : { first: 'cloud', fallbackToCloud: false };
}
