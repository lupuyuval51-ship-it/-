import type { SimInput } from "@/lib/game/engine/sim";

const FORWARD = ["KeyW", "ArrowUp"];
const BACK = ["KeyS", "ArrowDown"];
const LEFT = ["KeyA", "ArrowLeft"];
const RIGHT = ["KeyD", "ArrowRight"];

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
/** Inputs that take no typed text. */
const NO_TEXT = new Set(["checkbox", "radio", "range", "button", "submit", "reset", "color", "file", "image"]);
/** Typing text, where Escape and P belong to the field. A checkbox (the pause menu's own toggles) types nothing, so they still pause. */
const textEntry = (t: EventTarget | null) => typing(t) && !((t as HTMLElement).tagName === "INPUT" && NO_TEXT.has((t as HTMLInputElement).type));

/** Keyboard + touch + drag-to-look input, polled once per frame by the render loop. */
export class InputState {
  private keys = new Set<string>();
  stick = { x: 0, y: 0 };
  sprintHeld = false;
  yaw = 0;
  pitch = 0.42;
  private jumpQueued = false;
  private interactQueued = false;
  enabled = true;
  onPause: (() => void) | null = null;
  onInteractKey: (() => void) | null = null;
  private dragging: { id: number; x: number; y: number } | null = null;

  attach(canvasHost: HTMLElement): () => void {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyP") {
        // once per press: toggling on every repeat of a held key would flicker the menu open and shut
        if (!e.repeat && !textEntry(e.target)) this.onPause?.();
        return;
      }
      if (typing(e.target)) return;
      if (!this.enabled) return;
      // Ctrl / Cmd / Alt + a key is the browser's or the system's (find, select all, back), not a move. On a Mac it would also stay
      // held for ever: macOS sends no keyup for a key let go while Cmd is down.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === "Space") {
        this.jumpQueued = true;
        e.preventDefault();
      } else if (e.code === "KeyE" || e.code === "Enter" || e.code === "KeyF") {
        if (!e.repeat) this.interactQueued = true;
        e.preventDefault();
      }
      if ([...FORWARD, ...BACK, ...LEFT, ...RIGHT].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => {
      this.keys.delete(e.code);
      // macOS never reported the release of a key let go while Cmd was down: nothing can be trusted as still held
      if (e.key === "Meta") this.keys.clear();
    };
    const blur = () => {
      this.keys.clear();
      this.dragging = null; // the button may well be let go in the other window, where this page never hears of it
    };
    const pdown = (e: PointerEvent) => {
      if (e.target !== canvasHost.querySelector("canvas")) return;
      if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return;
      this.dragging = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const pmove = (e: PointerEvent) => {
      const d = this.dragging;
      if (!d || d.id !== e.pointerId) return;
      // no mouse button down any more: the release happened out of sight, so this is a bare move, not a look around
      if (e.pointerType === "mouse" && e.buttons === 0) {
        this.dragging = null;
        return;
      }
      this.yaw -= (e.clientX - d.x) * 0.0055;
      this.pitch = Math.max(0.08, Math.min(1.25, this.pitch + (e.clientY - d.y) * 0.0045));
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const pup = (e: PointerEvent) => {
      if (this.dragging?.id === e.pointerId) this.dragging = null;
    };
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    canvasHost.addEventListener("pointerdown", pdown);
    window.addEventListener("pointermove", pmove);
    window.addEventListener("pointerup", pup);
    window.addEventListener("pointercancel", pup);
    canvasHost.addEventListener("contextmenu", ctx);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      canvasHost.removeEventListener("pointerdown", pdown);
      window.removeEventListener("pointermove", pmove);
      window.removeEventListener("pointerup", pup);
      window.removeEventListener("pointercancel", pup);
      canvasHost.removeEventListener("contextmenu", ctx);
    };
  }

  queueJump(): void {
    this.jumpQueued = true;
  }
  queueInteract(): void {
    this.interactQueued = true;
  }

  /** Poll for the sim. Rotates the camera from Q / R and clears one-shot flags. */
  poll(dt: number): { sim: SimInput; interact: boolean } {
    if (this.keys.has("KeyQ")) this.yaw += 1.9 * dt;
    if (this.keys.has("KeyR")) this.yaw -= 1.9 * dt;
    let x = 0;
    let y = 0;
    if (this.enabled) {
      const any = (codes: string[]) => codes.some((c) => this.keys.has(c));
      x = (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0) + this.stick.x;
      y = (any(FORWARD) ? 1 : 0) - (any(BACK) ? 1 : 0) + this.stick.y;
    }
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }
    const sim: SimInput = { moveX: x, moveY: y, jump: this.enabled && this.jumpQueued, sprint: this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.sprintHeld };
    const interact = this.enabled && this.interactQueued;
    this.jumpQueued = false;
    this.interactQueued = false;
    return { sim, interact };
  }

  /** Test helper: true while a movement key is held. */
  get moving(): boolean {
    return [...FORWARD, ...BACK, ...LEFT, ...RIGHT].some((c) => this.keys.has(c)) || Math.hypot(this.stick.x, this.stick.y) > 0.05;
  }

  reset(): void {
    this.keys.clear();
    this.stick = { x: 0, y: 0 };
    this.jumpQueued = false;
    this.interactQueued = false;
    this.sprintHeld = false;
    this.dragging = null;
  }
}
