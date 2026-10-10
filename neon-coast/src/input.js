// Touch tuning: floating stick radius (px) and dead zone (fraction of the radius), auto-sprint thresholds (stick magnitude, with hysteresis so the rim does not flicker),
// the share of the screen width where a touch starts the stick, the look gain, and the fallback stick size (px) when the element is not laid out.
const STICK_R = 56, STICK_DEAD = 0.12, RUN_ON = 0.92, RUN_OFF = 0.86, STICK_ZONE = 0.45, LOOK_GAIN = 2.2, STICK_SIZE = 124;

// Keyboard uses physical key codes so Hebrew keyboard layouts work. Mouse look uses pointer lock with a drag fallback.
export class Input {
  constructor(canvas) {
    this.canvas = canvas; this.keys = new Set(); this.pressed = new Set(); this.mouse = { dx: 0, dy: 0, wheel: 0, left: false, right: false, leftPressed: false, rightPressed: false }; this.locked = false; this.dragging = false; this.touch = { active: false, x: 0, y: 0, look: { dx: 0, dy: 0 }, buttons: new Set(), pressed: new Set() }; this.enabled = false; this.isTouch = matchMedia('(pointer: coarse)').matches;
    this._axis = { x: 0, y: 0 }; this._cm = { dx: 0, dy: 0, wheel: 0, leftPressed: false, rightPressed: false }; // reused results of axis() and consumeMouse(): nothing is allocated per frame
    window.addEventListener('keydown', e => { if (e.repeat) return; if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); this.keys.add(e.code); this.pressed.add(e.code); });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.left = this.mouse.right = false; this.resetTouch(); });
    window.addEventListener('touchstart', () => { this.isTouch = true; }, { once: true, passive: true }); // a real touch means a touch device, whatever matchMedia said
    canvas.addEventListener('mousedown', e => { if (!this.enabled) return; if (e.button === 0) { this.mouse.left = true; this.mouse.leftPressed = true; } if (e.button === 2) { this.mouse.right = true; this.mouse.rightPressed = true; } this.dragging = true; if (!this.locked) this.requestLock(); });
    window.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.left = false; if (e.button === 2) this.mouse.right = false; this.dragging = false; });
    window.addEventListener('mousemove', e => { if (!this.enabled) return; if (this.locked || this.dragging) { this.mouse.dx += e.movementX || 0; this.mouse.dy += e.movementY || 0; } });
    canvas.addEventListener('wheel', e => { if (!this.enabled) return; e.preventDefault(); this.mouse.wheel += Math.sign(e.deltaY); }, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
    document.addEventListener('pointerlockerror', () => { this.locked = false; });
    this.setupTouch();
  }
  requestLock() { try { const p = this.canvas.requestPointerLock?.({ unadjustedMovement: true }); if (p && p.catch) p.catch(() => { try { this.canvas.requestPointerLock(); } catch {} }); } catch { try { this.canvas.requestPointerLock(); } catch {} } }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }
  key(c) { return this.keys.has(c); }
  once(c) { if (this.pressed.has(c)) { this.pressed.delete(c); return true; } return false; }
  btn(name) { return this.touch.buttons.has(name); }
  btnOnce(name) { if (this.touch.pressed.has(name)) { this.touch.pressed.delete(name); return true; } return false; }
  axis() { // -1..1 x (right positive), y (forward positive). The returned object is reused: read it, do not keep it.
    let x = 0, y = 0;
    if (this.key('KeyD') || this.key('ArrowRight')) x += 1; if (this.key('KeyA') || this.key('ArrowLeft')) x -= 1;
    if (this.key('KeyW') || this.key('ArrowUp')) y += 1; if (this.key('KeyS') || this.key('ArrowDown')) y -= 1;
    if (this.touch.active) { x += this.touch.x; y += -this.touch.y; }
    const a = this._axis; a.x = Math.max(-1, Math.min(1, x)); a.y = Math.max(-1, Math.min(1, y)); return a;
  }
  // Mouse and touch look deltas since the last call. The returned object is reused: read it, do not keep it.
  consumeMouse() { const m = this.mouse, r = this._cm; r.dx = m.dx + this.touch.look.dx; r.dy = m.dy + this.touch.look.dy; r.wheel = m.wheel; r.leftPressed = m.leftPressed; r.rightPressed = m.rightPressed; m.dx = m.dy = m.wheel = 0; m.leftPressed = m.rightPressed = false; this.touch.look.dx = this.touch.look.dy = 0; return r; }
  endFrame() { this.pressed.clear(); this.touch.pressed.clear(); }
  resetTouch() {} // replaced by setupTouch(): lets go of every finger (stick, look, held buttons). Called on blur / tab hidden; the game may call it when a menu opens.
  // Touch controls. The `.touch-look` layer (first child of #touch, below the buttons) takes every touch that is not on a button:
  // the left 45% of the screen starts a floating stick under the thumb, anywhere else drags the camera. Each finger is tracked by its
  // identifier, so the stick, look and a held button work at the same time. Holding the stick near its rim sprints (adds 'run').
  setupTouch() {
    const root = document.getElementById('touch'); if (!root) return;
    const stick = root.querySelector('.stick'), knob = root.querySelector('.knob'), T = this.touch;
    const held = new Map(); // touch id -> { name, el } for every button that is down
    let stickId = null, lookId = null, lx = 0, ly = 0, sx = 0, sy = 0, autoRun = false;
    root.style.touchAction = 'none';
    const holds = name => { for (const h of held.values()) if (h.name === name) return true; return false; };
    const sync = name => { if (holds(name) || (name === 'run' && autoRun)) T.buttons.add(name); else T.buttons.delete(name); }; // a button is "down" while a finger holds it; 'run' is also down during auto-sprint
    const homeStick = () => { if (knob) knob.style.transform = ''; if (!stick) return; stick.classList.remove('on'); const s = stick.style; s.left = s.top = s.right = s.bottom = ''; }; // back to the CSS position
    const press = (id, b) => { const name = b.dataset.btn; held.set(id, { name, el: b }); T.buttons.add(name); T.pressed.add(name); b.classList.add('on'); };
    const release = id => { const h = held.get(id); if (!h) return; held.delete(id); if (!holds(h.name)) h.el.classList.remove('on'); sync(h.name); };
    const startStick = t => {
      stickId = t.identifier; sx = t.clientX; sy = t.clientY; T.active = true; T.x = T.y = 0; autoRun = false;
      if (knob) knob.style.transform = '';
      if (stick) { // the stick appears under the thumb (coordinates relative to #touch)
        const rr = root.getBoundingClientRect(), s = stick.style; s.left = (sx - rr.left - (stick.offsetWidth || STICK_SIZE) / 2) + 'px'; s.top = (sy - rr.top - (stick.offsetHeight || STICK_SIZE) / 2) + 'px'; s.right = s.bottom = 'auto'; stick.classList.add('on');
      }
    };
    const moveStick = t => {
      const ox = t.clientX - sx, oy = t.clientY - sy, d = Math.hypot(ox, oy), m = Math.min(1, d / STICK_R), c = d > STICK_R ? STICK_R / d : 1;
      if (knob) knob.style.transform = `translate(${ox * c}px,${oy * c}px)`;
      const v = m < STICK_DEAD ? 0 : (m - STICK_DEAD) / (1 - STICK_DEAD); // radial dead zone, rescaled so the output still reaches 1 at the rim
      T.x = d > 1e-6 ? ox / d * v : 0; T.y = d > 1e-6 ? oy / d * v : 0;
      const run = v > (autoRun ? RUN_OFF : RUN_ON); if (run !== autoRun) { autoRun = run; sync('run'); }
    };
    root.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        const el = t.target instanceof Element ? t.target : document.elementFromPoint(t.clientX, t.clientY), b = el?.closest?.('[data-btn]');
        if (b) { press(t.identifier, b); continue; }
        if (stickId === null && t.clientX < innerWidth * STICK_ZONE) startStick(t);
        else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
      }
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    root.addEventListener('touchmove', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === stickId) moveStick(t);
        else if (t.identifier === lookId) { T.look.dx += (t.clientX - lx) * LOOK_GAIN; T.look.dy += (t.clientY - ly) * LOOK_GAIN; lx = t.clientX; ly = t.clientY; }
      }
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    const end = e => {
      for (const t of e.changedTouches) {
        const id = t.identifier; release(id);
        if (id === stickId) { stickId = null; T.active = false; T.x = T.y = 0; if (autoRun) { autoRun = false; sync('run'); } homeStick(); }
        if (id === lookId) lookId = null;
      }
    };
    root.addEventListener('touchend', end); root.addEventListener('touchcancel', end);
    this.resetTouch = () => { for (const h of held.values()) h.el.classList.remove('on'); held.clear(); T.buttons.clear(); stickId = lookId = null; autoRun = false; T.active = false; T.x = T.y = 0; T.look.dx = T.look.dy = 0; homeStick(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.resetTouch(); });
  }
}
