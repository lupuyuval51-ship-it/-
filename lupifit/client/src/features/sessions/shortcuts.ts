import { useEffect, useRef } from 'react';

export type ShortcutAction = 'complete' | 'undo' | 'previous' | 'next' | 'rest' | 'pause';

const KEYS: Record<string, ShortcutAction> = {
  c: 'complete',
  u: 'undo',
  '[': 'previous',
  ']': 'next',
  r: 'rest',
  p: 'pause',
};

interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  defaultPrevented?: boolean;
  target: { tagName?: string; isContentEditable?: boolean; closest?(sel: string): unknown } | null;
}

/** Maps a key press to a workout action; null while typing, with modifiers or inside a dialog/button. */
export function shortcutAction(e: KeyLike): ShortcutAction | null {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return null;
  const el = e.target;
  const tag = el?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || el?.isContentEditable) return null;
  if (el?.closest?.('[role="dialog"], [role="alertdialog"]')) return null;
  return KEYS[e.key.toLowerCase()] ?? null;
}

/** Desktop keyboard shortcuts for the live workout. Handlers are read through a ref, so they may change every render. */
export function useWorkoutShortcuts(handler: (action: ShortcutAction) => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = shortcutAction({ key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, altKey: e.altKey, defaultPrevented: e.defaultPrevented, target: e.target as KeyLike['target'] });
      if (!action) return;
      e.preventDefault();
      ref.current(action);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
