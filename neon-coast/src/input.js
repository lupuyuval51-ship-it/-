// Keyboard uses physical key codes so Hebrew keyboard layouts work. Mouse look uses pointer lock with a drag fallback.
export class Input {
  constructor(canvas) {
    this.canvas = canvas; this.keys = new Set(); this.pressed = new Set(); this.mouse = { dx: 0, dy: 0, wheel: 0, left: false, right: false, leftPressed: false, rightPressed: false }; this.locked = false; this.dragging = false; this.touch = { active: false, x: 0, y: 0, look: { dx: 0, dy: 0 }, buttons: new Set(), pressed: new Set() }; this.enabled = false; this.isTouch = matchMedia('(pointer: coarse)').matches;
    window.addEventListener('keydown', e => { if (e.repeat) return; if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); this.keys.add(e.code); this.pressed.add(e.code); });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.left = this.mouse.right = false; });
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
  axis() { // -1..1 x (right positive), y (forward positive)
    let x = 0, y = 0;
    if (this.key('KeyD') || this.key('ArrowRight')) x += 1; if (this.key('KeyA') || this.key('ArrowLeft')) x -= 1;
    if (this.key('KeyW') || this.key('ArrowUp')) y += 1; if (this.key('KeyS') || this.key('ArrowDown')) y -= 1;
    if (this.touch.active) { x += this.touch.x; y += -this.touch.y; }
    return { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
  }
  consumeMouse() { const m = this.mouse; const r = { dx: m.dx + this.touch.look.dx, dy: m.dy + this.touch.look.dy, wheel: m.wheel, leftPressed: m.leftPressed, rightPressed: m.rightPressed }; m.dx = m.dy = m.wheel = 0; m.leftPressed = m.rightPressed = false; this.touch.look.dx = this.touch.look.dy = 0; return r; }
  endFrame() { this.pressed.clear(); this.touch.pressed.clear(); }
  setupTouch() {
    const root = document.getElementById('touch'); if (!root) return; const stick = root.querySelector('.stick'), knob = root.querySelector('.knob'); let stickId = null, lookId = null, lx = 0, ly = 0, sx = 0, sy = 0;
    const R = 46;
    root.addEventListener('touchstart', e => { for (const t of e.changedTouches) { const el = document.elementFromPoint(t.clientX, t.clientY); const b = el?.closest?.('[data-btn]'); if (b) { const n = b.dataset.btn; this.touch.buttons.add(n); this.touch.pressed.add(n); b.classList.add('on'); b.dataset.tid = t.identifier; continue; } if (t.clientX < innerWidth / 2 && stickId === null) { stickId = t.identifier; const r = stick.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; this.touch.active = true; } else if (lookId === null) { lookId = t.identifier; lx = t.clientX; ly = t.clientY; } } e.preventDefault(); }, { passive: false });
    root.addEventListener('touchmove', e => { for (const t of e.changedTouches) { if (t.identifier === stickId) { let dx = t.clientX - sx, dy = t.clientY - sy; const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.touch.x = dx / R; this.touch.y = dy / R; } else if (t.identifier === lookId) { this.touch.look.dx += (t.clientX - lx) * 2.2; this.touch.look.dy += (t.clientY - ly) * 2.2; lx = t.clientX; ly = t.clientY; } } e.preventDefault(); }, { passive: false });
    const end = e => { for (const t of e.changedTouches) { if (t.identifier === stickId) { stickId = null; this.touch.active = false; this.touch.x = this.touch.y = 0; knob.style.transform = ''; } if (t.identifier === lookId) lookId = null; root.querySelectorAll('[data-btn]').forEach(b => { if (String(t.identifier) === b.dataset.tid) { this.touch.buttons.delete(b.dataset.btn); b.classList.remove('on'); delete b.dataset.tid; } }); } };
    root.addEventListener('touchend', end); root.addEventListener('touchcancel', end);
  }
}
