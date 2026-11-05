import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Shared "reduce motion" state. One subscription to the OS setting for the whole app; components
 * read it synchronously with `useReducedMotion()`. Defaults to `false` until the OS answers.
 */
let reduceMotion = false;
const listeners = new Set<() => void>();
let started = false;

function emit(value: boolean) {
  if (value === reduceMotion) return;
  reduceMotion = value;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  AccessibilityInfo.isReduceMotionEnabled()
    .then(emit)
    .catch(() => undefined);
  AccessibilityInfo.addEventListener('reduceMotionChanged', emit);
}

function subscribe(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => reduceMotion,
    () => false,
  );
}

/** Current value outside React (e.g. in callbacks). */
export function isReducedMotion(): boolean {
  start();
  return reduceMotion;
}

/** Announces a message to screen readers (VoiceOver / TalkBack / web live region). */
export function announce(message: string): void {
  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch {
    // ignore
  }
}
