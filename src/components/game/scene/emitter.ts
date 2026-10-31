/**
 * Imperative handle so DOM/HUD code can trigger particle bursts without going through React state.
 *
 * Deliberately free of `three` and `@react-three/fiber`: the play screen (HUD, input, audio) creates the emitter, and it
 * must not pull the whole 3D runtime into the screens that open before a game starts (the Android app bundles the
 * play screen with the library). `Particles.tsx` re-exports it for the renderer.
 */
export class ParticleEmitter {
  queue: { x: number; y: number; z: number; color: string; count: number; kind: "pop" | "dust" }[] = [];
  /** `pop` sparks fly up and out (pick-ups, rewards); `dust` is a low, short puff (take-off and landing). */
  burst(x: number, y: number, z: number, color: string, count = 24, kind: "pop" | "dust" = "pop"): void {
    if (this.queue.length < 8) this.queue.push({ x, y, z, color, count, kind });
  }
}
