/** The mini-map is redrawn at about 15 Hz: it never needs the display's full rate. */
export const MINIMAP_INTERVAL_MS = 66;

/**
 * Calls `draw` at most every `MINIMAP_INTERVAL_MS`, and only while the canvas is actually shown. Below the `sm` breakpoint (a phone
 * held upright) the canvas is `display: none`: its `clientWidth` is 0 and nothing it draws can be seen, so the floor plan is not
 * walked and drawn for nothing. The loop keeps checking, so turning the phone to a wide screen starts the drawing again.
 * Returns the function that stops it.
 */
export function startMinimapLoop(
  el: { readonly clientWidth: number },
  draw: (now: number) => void,
  raf: (cb: (now: number) => void) => number = (cb) => requestAnimationFrame(cb),
  cancel: (id: number) => void = (id) => cancelAnimationFrame(id),
): () => void {
  let id = 0;
  let last = 0;
  const tick = (now: number) => {
    id = raf(tick);
    if (now - last < MINIMAP_INTERVAL_MS) return;
    last = now;
    if (el.clientWidth === 0) return;
    draw(now);
  };
  id = raf(tick);
  return () => cancel(id);
}
