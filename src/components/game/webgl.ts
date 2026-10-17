/**
 * Is 3D graphics available? The answer is found by asking a throw-away canvas for a context. That is not free: every
 * context is a real GPU context, and browsers keep only about sixteen alive (phones fewer) before they start dropping the
 * oldest, which would be the game's own. So the probe runs once, frees its context at once, and a positive answer is kept.
 */

export interface ProbeContext {
  getExtension(name: string): { loseContext(): void } | null;
}
export interface ProbeCanvas {
  getContext(id: string): ProbeContext | null;
}

/** One probe, no caching: true when a WebGL (2 or 1) context could be created. The context is released straight away. */
export function probeWebgl(make: () => ProbeCanvas): boolean {
  try {
    const c = make();
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return false;
    try { gl.getExtension("WEBGL_lose_context")?.loseContext(); } catch { /* the probe context is garbage anyway */ }
    return true;
  } catch {
    return false;
  }
}

let known: boolean | null = null;

/** WebGL support of this browser; probes at most once while the answer is "yes". */
export function webglAvailable(make: () => ProbeCanvas = () => document.createElement("canvas") as unknown as ProbeCanvas): boolean {
  if (known) return true;
  const ok = probeWebgl(make);
  if (ok) known = true;
  return ok;
}

/** Test helper: forget a cached positive answer. */
export function resetWebglProbe(): void {
  known = null;
}
