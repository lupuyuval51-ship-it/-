import { useEffect, useRef, useState } from 'react';

/**
 * After a failed submit, moves keyboard focus to the first control marked `aria-invalid`
 * so screen-reader and keyboard users land on the problem instead of hunting for it.
 * Call `requestFocus()` right after setting the errors.
 */
export function useFocusFirstInvalid<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (tick === 0) return;
    ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [tick]);
  return { ref, requestFocus: () => setTick((n) => n + 1) };
}
