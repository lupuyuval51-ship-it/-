import type { SimInput } from "@/lib/game/engine/sim";

const FORWARD = ["KeyW", "ArrowUp"];
const BACK = ["KeyS", "ArrowDown"];
const LEFT = ["KeyA", "ArrowLeft"];
const RIGHT = ["KeyD", "ArrowRight"];

const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);

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
      if (typing(e.target)) return;
      if (e.code === "Escape" || e.code === "KeyP") {
        this.onPause?.();
        return;
      }
      if (!this.enabled) return;
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
    const up = (e: KeyboardEvent) => this.keys.delete(e.code);
    const blur = () => this.keys.clear();
    const pdown = (e: PointerEvent) => {
      if (e.target !== canvasHost.querySelector("canvas")) return;
      if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return;
      this.dragging = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const pmove = (e: PointerEvent) => {
      const d = this.dragging;
      if (!d || d.id !== e.pointerId) return;
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
  }
}
