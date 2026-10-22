import * as THREE from '../vendor/three.module.min.js';
import { WEAPONS } from './config.js';
import { T } from './i18n.js';
import { fmtMoney, fmtTime, clamp, damp, wrapAngle } from './utils.js';
import { ICONS, iconPath } from './icons.js';

// Module-level scratch and tunables: nothing in update()/drawMinimap() allocates.
const _pv = new THREE.Vector3(); // objective pin projection
const HM_RANK = { hit: 1, head: 2, kill: 3 }, HM_TIME = { hit: 0.12, head: 0.18, kill: 0.26 }; // hitmarker priority and on-screen seconds
const HM_SOFT_OPACITY = '0.45';                                                                  // vehicle-only hits
const DMG_SLOTS = 4, DMG_LIFE = 0.9, DMG_SAME_DIR = 0.35, DMG_MIN_DIST2 = 2.25;                  // damage wedges: pool size, seconds, merge angle (rad), no wedge for hits from < 1.5 m
const MM_STEP_FOOT = 1 / 20, MM_STEP_CAR = 1 / 30, MM_CONE = 35 * Math.PI / 360;                 // minimap redraw interval (s), half of the 35 degree view cone
const PIN_MAX = 5, PIN_PAD_X = 56, PIN_PAD_Y = 64, PIN_MIN_DIST = 6, PIN_EDGE_X = 0.92, PIN_EDGE_Y = 0.88;
const PIN_CENTER = 120, PIN_CENTER_SCALE = 0.55, PIN_ARW_PUSH = 24, PIN_LIFT = 2.2;              // shrink radius (px) / floor scale, arrow distance from the pin centre (px), pin height above the marker
const PROMPT_CHIP = /^([A-Z]) – (.+)$/;

export class HUD {
  constructor(game) {
    this.g = game; const $ = id => document.getElementById(id);
    this.el = { hud: $('hud'), money: $('money'), moneyDelta: $('moneyDelta'), starsBox: $('stars'), stars: [...$('stars').children], weapon: $('weaponName'), ammo: $('ammo'), clock: $('clock'), objective: $('objective'), notify: $('notify'), health: $('healthBar'), armor: $('armorBar'), armorBox: $('armorBar')?.parentElement || null, speedo: $('speedo'), speed: $('speed'), subtitle: $('subtitle'), radio: $('radioPopup'), cross: $('crosshair'), prompt: $('prompt'), timer: $('missionTimer'), overlay: $('overlay'), hurt: $('hurt'), result: $('missionResult'), mtitle: $('missionTitle'), evade: $('evade'), wicon: $('weaponIcon').querySelector('path'), scope: $('scope'), hitmarker: $('hitmarker'), dmgDir: $('dmgDir'), carHp: $('carHp'), touch: $('touch'), vig: document.querySelector('#touch [data-btn="vig"]') };
    this.mm = $('minimap'); this.mmCtx = this.mm.getContext('2d'); this.dpr = Math.min(2, devicePixelRatio || 1); this.mm.width = 240 * this.dpr; this.mm.height = 160 * this.dpr;
    this.el.hurt.remove(); this.moneyShown = 0; this.hurtLevel = 0; this.starFlash = 0; this.subT = 0; this.timerOn = false; this.kick = 0; this.hurtT = 0; this.radioT = 0; this.resultT = 0; this.titleT = 0; this.mmT = 0;
    // Last value written to the DOM. update() compares against these and touches the DOM only when something really changed.
    this.c = { money: null, stars: -1, flash: null, wname: null, wid: null, ammoW: null, clip: -1, ammo: -1, mins: -1, hp: -1, hpLow: null, ap: -1, apOn: null, speedoOn: null, spd: -1, carHp: -1, carLow: null, cross: null, crossScale: -1, evade: null, touchCar: null, vig: null };
    this.timerSec = -1; this.timerLabel = null; this.timerLow = null; this.promptText = null; this.promptOn = false; this.promptKbd = null; this.promptSpan = null;
    this.hmT = 0; this.hmRank = 0; this.hmSoft = false; // hitmarker state
    this.dmg = []; for (let i = 0; i < DMG_SLOTS; i++) this.dmg.push({ x: 0, z: 0, t: 0, a: NaN, o: -1, el: this.el.dmgDir ? this.el.dmgDir.children[i] || null : null }); // damage wedge pool
    this._blips = []; this._bp = []; this._bn = 0; // minimap blips: one array and one pool of blip objects, reused every call
    const tpl = document.querySelector('#hud .obj-pin'); if (tpl) tpl.remove(); this.pinTpl = tpl; this.pins = []; // objective pins: DOM template (taken out of the page) and the pool cloned from it
  }
  show(v) { this.el.hud.hidden = !v; }
  notify(text, kind = '', dur = 4) { const d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = text; this.el.notify.prepend(d); while (this.el.notify.children.length > 4) this.el.notify.lastChild.remove(); setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, dur * 1000); }
  moneyDelta(n) { const e = this.el.moneyDelta; e.textContent = (n >= 0 ? '+' : '-') + fmtMoney(Math.abs(n)); e.className = 'money-delta ' + (n >= 0 ? 'plus' : 'minus'); e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; }
  flashStars() { this.starFlash = 1.2; }
  subtitle(text, dur = 4) { const e = this.el.subtitle; if (!text) { e.classList.remove('on'); return; } const i = text.indexOf(':'); e.innerHTML = i > 0 && i < 18 ? `<b>${text.slice(0, i)}:</b>${text.slice(i + 1)}` : text; e.classList.add('on'); this.subT = dur; }
  // "E – Enter vehicle" is drawn as a key chip plus its action (DOM nodes, never innerHTML). game.js and player.js call this every frame, so it only touches the DOM when the text changes.
  prompt(text) {
    const e = this.el.prompt;
    if (!text) { if (this.promptOn) { this.promptOn = false; e.classList.remove('on'); } return; }
    if (text !== this.promptText) {
      this.promptText = text; const m = PROMPT_CHIP.exec(text);
      if (m) {
        if (!this.promptKbd) { this.promptKbd = document.createElement('kbd'); this.promptKbd.className = 'key'; this.promptKbd.style.cssText = 'min-width:0;margin-inline-end:8px'; this.promptSpan = document.createElement('span'); }
        this.promptKbd.textContent = m[1]; this.promptSpan.textContent = m[2]; e.replaceChildren(this.promptKbd, this.promptSpan);
      } else e.textContent = text;
    }
    if (!this.promptOn) { this.promptOn = true; e.classList.add('on'); }
  }
  setObjective(text) { const e = this.el.objective; if (!text) { e.classList.remove('on'); return; } if (e.textContent !== text) e.textContent = text; e.classList.add('on'); }
  // missions call this every frame while a timer runs, so the markup is rebuilt only when the displayed second (or the label) changes
  setTimer(s, label) {
    const e = this.el.timer, sec = Math.max(0, Math.floor(s)), lab = label || '';
    if (sec !== this.timerSec || lab !== this.timerLabel) { this.timerSec = sec; this.timerLabel = lab; e.innerHTML = `<small>${lab}</small>${fmtTime(sec)}`; }
    if (!this.timerOn) { this.timerOn = true; e.classList.add('on'); }
    const low = s < 15; if (low !== this.timerLow) { this.timerLow = low; e.classList.toggle('low', low); }
  }
  clearTimer() { this.timerOn = false; this.timerSec = -1; this.timerLabel = null; this.el.timer.classList.remove('on'); }
  missionTitle(name) { this.el.mtitle.textContent = name; this.el.mtitle.classList.add('on'); this.titleT = 4; }
  missionResult(passed, title, sub) { const e = this.el.result; e.querySelector('.title').textContent = title; e.querySelector('.sub').textContent = sub || ''; e.className = 'mission-result on ' + (passed ? 'pass' : 'fail'); this.resultT = 5; }
  hurt() { this.hurtT = 0.5; }
  scope(on) { if (this.scoped === on) return; this.scoped = on; this.el.scope.classList.toggle('on', on); }
  recoil() { this.kick = 1; }
  radio(id, show = true) { const e = this.el.radio; e.textContent = '♪ ' + T.stations[id]; if (show) { e.classList.add('on'); this.radioT = 2.5; } }
  overlay(kind) { const e = this.el.overlay; if (!kind) { e.classList.remove('on'); return; } e.querySelector('.big').textContent = kind === 'wasted' ? T.wasted : T.busted; e.querySelector('.sub').textContent = kind === 'wasted' ? T.respawnHospital : T.respawnPolice; e.classList.add('on'); }
  // ---------- hit confirmation ----------
  // kind: 'hit' | 'head' | 'kill'. A stronger cue that is still showing is never downgraded; soft = faint marker for hits on vehicles.
  hitmarker(kind = 'hit', soft = false) {
    const e = this.el.hitmarker; if (!e) return;
    if (HM_RANK[kind] === undefined) kind = 'hit';
    const rank = HM_RANK[kind]; if (this.hmT > 0 && (rank < this.hmRank || (rank === this.hmRank && soft && !this.hmSoft))) return;
    e.classList.remove('hit', 'head', 'kill', 'soft'); void e.offsetWidth; // reflow so the CSS animation restarts on every shot
    e.classList.add(kind); if (soft) e.classList.add('soft'); e.style.opacity = soft ? HM_SOFT_OPACITY : '';
    this.hmRank = rank; this.hmSoft = soft; this.hmT = HM_TIME[kind];
  }
  // x, z: world position of whatever hurt the player. Hits from roughly the same direction share one wedge so automatic fire does not fill the pool.
  damageFrom(x, z) {
    if (!this.el.dmgDir) return;
    const P = this.g.player, dx = x - P.x, dz = z - P.z; if (dx * dx + dz * dz < DMG_MIN_DIST2) return;
    const ang = Math.atan2(dx, dz), S = this.dmg; let slot = -1, low = 0, lowT = Infinity;
    for (let i = 0; i < S.length; i++) { const s = S[i]; if (s.t > 0 && Math.abs(wrapAngle(Math.atan2(s.x - P.x, s.z - P.z) - ang)) < DMG_SAME_DIR) { slot = i; break; } if (s.t < lowT) { lowT = s.t; low = i; } }
    const s = S[slot >= 0 ? slot : low]; s.x = x; s.z = z; s.t = DMG_LIFE;
  }
  updateHitFeedback(dt) {
    if (this.hmT > 0) { this.hmT -= dt; if (this.hmT <= 0) { this.hmRank = 0; const e = this.el.hitmarker; if (e) e.classList.remove('hit', 'head', 'kill', 'soft'); } }
    const P = this.g.player, S = this.dmg;
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (s.t <= 0) continue; s.t -= dt; const el = s.el; if (!el) { if (s.t < 0) s.t = 0; continue; }
      if (s.t <= 0) { s.t = 0; if (s.o !== 0) { s.o = 0; el.style.opacity = '0'; } continue; }
      // screen-right is (-cos yaw, sin yaw), so a source on the right turns the wedge clockwise: angle = camYaw - bearing to the source
      const a = Math.round(wrapAngle(P.camYaw - Math.atan2(s.x - P.x, s.z - P.z)) * 100) / 100; if (a !== s.a) { s.a = a; el.style.transform = 'rotate(' + a + 'rad)'; }
      const o = Math.round(s.t / DMG_LIFE * 50) / 50; if (o !== s.o) { s.o = o; el.style.opacity = String(o); }
    }
  }
  update(dt) {
    const g = this.g, P = g.player, E = this.el, c = this.c;
    // money eases towards the real value; the text is formatted only when the whole-dollar figure changes
    this.moneyShown += (g.money - this.moneyShown) * Math.min(1, dt * 7); if (Math.abs(g.money - this.moneyShown) < 1) this.moneyShown = g.money;
    const mr = Math.round(this.moneyShown); if (mr !== c.money) { c.money = mr; E.money.textContent = fmtMoney(mr); }
    // wanted stars (level and the "hidden" blink) and the flash on a level change
    const lvl = g.police.level; this.starFlash = Math.max(0, this.starFlash - dt); const blink = !!g.police.hidden && Math.floor(g.time * 3) % 2 === 0;
    const sk = lvl * 2 + (blink ? 1 : 0); if (sk !== c.stars) { c.stars = sk; for (let i = 0; i < E.stars.length; i++) E.stars[i].className = i < lvl ? (blink ? 'on dim' : 'on') : ''; }
    const flash = this.starFlash > 0; if (flash !== c.flash) { c.flash = flash; E.starsBox.classList.toggle('flash', flash); }
    // weapon name (compared as text so a language switch refreshes it), icon, ammo
    const W = P.weapon, st = P.ammoState, wname = T.weapon[W.id]; if (wname !== c.wname) { c.wname = wname; E.weapon.textContent = wname; }
    if (W.id !== c.wid) { c.wid = W.id; E.wicon.setAttribute('d', ICONS[W.id] || ''); }
    if (W.id !== c.ammoW || st.clip !== c.clip || st.ammo !== c.ammo) { c.ammoW = W.id; c.clip = st.clip; c.ammo = st.ammo; E.ammo.textContent = W.melee ? '' : W.thrown ? `${st.clip + st.ammo}` : `${st.clip} / ${st.ammo === Infinity ? '∞' : st.ammo}`; }
    const mins = Math.floor(g.clock); if (mins !== c.mins) { c.mins = mins; E.clock.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`; }
    // health and armour bars; the armour bar is hidden while there is no armour
    const hp = Math.round(clamp(P.health, 0, 100)); if (hp !== c.hp) { c.hp = hp; E.health.style.width = hp + '%'; }
    const hpLow = P.health < 30; if (hpLow !== c.hpLow) { c.hpLow = hpLow; E.health.classList.toggle('low', hpLow); }
    const ap = Math.round(clamp(P.armor, 0, 100)); if (ap !== c.ap) { c.ap = ap; E.armor.style.width = ap + '%'; }
    const apOn = P.armor > 0; if (apOn !== c.apOn) { c.apOn = apOn; if (E.armorBox) E.armorBox.style.display = apOn ? '' : 'none'; }
    // speedometer and car health
    const veh = P.vehicle, inCar = !!veh; if (inCar !== c.speedoOn) { c.speedoOn = inCar; E.speedo.classList.toggle('on', inCar); E.prompt.classList.toggle('in-car', inCar); }
    if (veh) {
      const kmh = Math.round(veh.speed * 3.6); if (kmh !== c.spd) { c.spd = kmh; E.speed.textContent = kmh; }
      if (E.carHp) { const f = clamp(veh.hp / (veh.maxHp || 1), 0, 1), pct = Math.round(f * 100); if (pct !== c.carHp) { c.carHp = pct; E.carHp.style.width = pct + '%'; } const low = f < 0.35; if (low !== c.carLow) { c.carLow = low; E.carHp.classList.toggle('low', low); } }
    }
    // touch layout: #touch.in-car follows the vehicle state; the vigilante (V) button exists only while its prompt is showing (both touch the DOM only on change)
    if (E.touch) {
      if (inCar !== c.touchCar) { c.touchCar = inCar; E.touch.classList.toggle('in-car', inCar); }
      const vig = !!g.interactPrompt && g.interactPrompt === T.vigilanteStart; if (vig !== c.vig) { c.vig = vig; if (E.vig) { E.vig.style.display = vig ? '' : 'none'; E.vig.classList.toggle('show', vig); } }
    }
    if (this.subT > 0) { this.subT -= dt; if (this.subT <= 0) E.subtitle.classList.remove('on'); }
    if (this.radioT > 0) { this.radioT -= dt; if (this.radioT <= 0) E.radio.classList.remove('on'); }
    if (this.resultT > 0) { this.resultT -= dt; if (this.resultT <= 0) E.result.classList.remove('on'); }
    if (this.titleT > 0) { this.titleT -= dt; if (this.titleT <= 0) E.mtitle.classList.remove('on'); }
    this.hurtT = Math.max(0, this.hurtT - dt); this.hurtLevel = Math.min(1, this.hurtT * 2.2 + (P.health < 25 && !P.dead ? 0.3 + Math.sin(g.time * 5) * 0.12 : 0));
    // crosshair: visibility toggles on change; the recoil scale is written only while the kick is alive (plus once to settle back at 1)
    const aimCross = !!((P.aiming || (inCar && !P.weapon.melee && !P.weapon.thrown)) && !P.dead && !P.zoom); if (aimCross !== c.cross) { c.cross = aimCross; E.cross.classList.toggle('on', aimCross); }
    this.kick = this.kick > 0.001 ? damp(this.kick, 0, 14, dt) : 0; const ks = this.kick > 0.001 ? Math.round((1 + this.kick * 0.5) * 1000) / 1000 : 1;
    if (ks !== c.crossScale) { c.crossScale = ks; E.cross.style.transform = `translate(-50%,-50%) scale(${ks})`; }
    const evade = lvl > 0 && !!g.police.hidden; if (evade !== c.evade) { c.evade = evade; E.evade.classList.toggle('on', evade); }
    this.updateHitFeedback(dt);
    this.mmT -= dt; if (this.mmT <= 0) { this.mmT = Math.max(0, this.mmT + (inCar ? MM_STEP_CAR : MM_STEP_FOOT)); this.drawMinimap(); } // 20 Hz on foot, 30 Hz in a car
    this.updatePins();
  }
  // ---------- objective pins ----------
  // One pin per mission objective marker (at most PIN_MAX): a diamond with the distance floating over the marker, or clamped to an ellipse near the screen edge with an arrow when the objective is off-screen or behind the camera.
  makePin() {
    let el;
    if (this.pinTpl) { el = this.pinTpl.cloneNode(true); el.hidden = false; el.removeAttribute('hidden'); }
    else { // no template in the page: a self-contained pin whose origin is its centre
      el = document.createElement('div'); el.className = 'obj-pin'; el.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;will-change:transform;color:#fff;font:600 15px Heebo,sans-serif;text-shadow:0 1px 3px #000';
      const dia = document.createElement('span'); dia.style.cssText = 'position:absolute;left:-9px;top:-9px;width:18px;height:18px;box-sizing:border-box;background:var(--c,#ffd34e);border:2px solid #0b0f1e;transform:rotate(45deg)';
      const arw = document.createElement('i'); arw.className = 'arw'; arw.style.cssText = 'position:absolute;left:-6px;top:-7px;width:0;height:0;border-left:12px solid var(--c,#ffd34e);border-top:7px solid transparent;border-bottom:7px solid transparent';
      const lab = document.createElement('b'); lab.style.cssText = 'position:absolute;top:16px;left:0;transform:translateX(-50%);white-space:nowrap;font-weight:600';
      el.append(dia, arw, lab);
    }
    el.style.display = 'none'; (el.querySelector('b') || el).appendChild(document.createElement('bdi')); this.el.hud.appendChild(el);
    const pin = { el, arw: el.querySelector('.arw'), lab: el.querySelector('bdi'), on: false, x: NaN, y: NaN, s: 0, o: -1, ra: NaN, arwOn: null, col: null, lk: -1, lu: null };
    this.pins.push(pin); return pin;
  }
  hidePin(p) { if (p.on) { p.on = false; p.el.style.display = 'none'; } }
  updatePins() {
    const g = this.g, P = g.player, ms = g.missions.objMarkers, pins = this.pins;
    const n = !ms || P.dead || g.uiOpen || P.zoom ? 0 : Math.min(ms.length, PIN_MAX);
    for (let i = n; i < pins.length; i++) this.hidePin(pins[i]);
    if (!n) return;
    const cam = g.camera; cam.updateMatrixWorld(); // the render has not refreshed the camera matrices for this frame yet
    const hw = innerWidth / 2, hh = innerHeight / 2, ax2 = (hw - PIN_PAD_X) ** 2, ay2 = (hh - PIN_PAD_Y) ** 2, o = P.aiming ? 0.5 : 1;
    for (let i = 0; i < n; i++) {
      const m = ms[i], p = pins[i] || this.makePin(), d = Math.hypot(m.x - P.x, m.z - P.z);
      if (d < PIN_MIN_DIST) { this.hidePin(p); continue; }
      // project through the view matrix first: view-space z > 0 means the target is behind the camera, where the perspective divide mirrors x and y
      _pv.set(m.x, (m.y || 0) + PIN_LIFT, m.z).applyMatrix4(cam.matrixWorldInverse); let behind = _pv.z > 0; const vx = _pv.x, vz = _pv.z; _pv.applyMatrix4(cam.projectionMatrix);
      let sx = _pv.x * hw, sy = -_pv.y * hh; // pixel offset from the screen centre
      if (!behind && !(Math.abs(sx) < 1e9 && Math.abs(sy) < 1e9)) behind = true; // on the camera plane: no usable projection
      if (behind) { const hz = Math.hypot(vx, vz); if (hz > 1e-6) { sx = vx / hz; sy = vz / hz; } else { sx = 0; sy = 1; } } // behind: a compass direction (left/right of the view axis, straight behind = down), so a height difference of a few decimetres cannot flip the pin between top and bottom
      const onScreen = !behind && _pv.z < 1 && Math.abs(_pv.x) < PIN_EDGE_X && Math.abs(_pv.y) < PIN_EDGE_Y;
      let e2 = sx * sx / ax2 + sy * sy / ay2;
      if (behind || e2 > 1) { const k = 1 / Math.sqrt(e2); sx *= k; sy *= k; } // outside the ellipse (or behind): slide along the same ray onto the ellipse, so the pin never jumps when it leaves the screen
      const r = Math.hypot(sx, sy), sc = Math.round((r < PIN_CENTER ? PIN_CENTER_SCALE + (1 - PIN_CENTER_SCALE) * r / PIN_CENTER : 1) * 50) / 50; // shrink inside the centre 120 px so it does not cover the crosshair
      const tx = Math.round((hw + sx) * 2) / 2, ty = Math.round((hh + sy) * 2) / 2;
      if (tx !== p.x || ty !== p.y || sc !== p.s) { p.x = tx; p.y = ty; p.s = sc; p.el.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + sc + ')'; }
      const col = m.color || '#ffd34e'; if (col !== p.col) { p.col = col; p.el.style.setProperty('--c', col); }
      if (o !== p.o) { p.o = o; p.el.style.opacity = String(o); }
      const far = d >= 1000, key = far ? 1e6 + Math.round(d / 100) : Math.round(d), unit = far ? (T.km ?? 'km') : (T.meters ?? 'm');
      if (key !== p.lk || unit !== p.lu) { p.lk = key; p.lu = unit; p.lab.textContent = (far ? (Math.round(d / 100) / 10).toFixed(1) : Math.round(d)) + ' ' + unit; }
      if (p.arw) {
        if (onScreen) { if (p.arwOn !== false) { p.arwOn = false; p.arw.style.display = 'none'; } }
        else {
          if (p.arwOn !== true) { p.arwOn = true; p.ra = NaN; p.arw.style.display = ''; }
          const ra = Math.round(Math.atan2(sy, sx) * 50) / 50; if (ra !== p.ra) { p.ra = ra; p.arw.style.transform = 'rotate(' + ra + 'rad) translateX(' + PIN_ARW_PUSH + 'px)'; }
        }
      }
      if (!p.on) { p.on = true; p.el.style.display = ''; }
    }
  }
  // ---------- minimap ----------
  // Fills the reused blips array from pooled blip objects; the array is only valid until the next call.
  blip(x, z, color, kind, icon, label) {
    const n = this._bn++; let b = this._bp[n]; if (!b) b = this._bp[n] = { x: 0, z: 0, color: '', kind: '', icon: '', label: '' };
    b.x = x; b.z = z; b.color = color; b.kind = kind; b.icon = icon; b.label = label; this._blips[n] = b;
  }
  blips() {
    const g = this.g, W = g.world; this._bn = 0;
    for (const id in W.pois) { const p = W.pois[id]; if (p.noMarker && id !== 'docks') continue; if (p.mission) continue; this.blip(p.x, p.z, p.color, 'poi', p.type || id, T[p.label]); }
    for (const b of g.missions.blips) this.blip(b.x, b.z, b.color, b.kind, b.icon || '', b.label || '');
    const cops = g.police.cars, flash = Math.floor(g.time * 4) % 2 ? '#ff3b3b' : '#4d8cff';
    for (let i = 0; i < cops.length; i++) this.blip(cops[i].x, cops[i].z, flash, 'cop', '', '');
    for (const p of g.peds) { if (p.dead) continue; if (p.team === 'gang' && p.hostile) this.blip(p.x, p.z, '#ff3b3b', 'enemy', '', ''); else if (p.team === 'cop' || p.team === 'swat') this.blip(p.x, p.z, '#4d8cff', 'copped', '', ''); }
    this._blips.length = this._bn; return this._blips;
  }
  drawMinimap() {
    const g = this.g, P = g.player, W = g.world, ctx = this.mmCtx, dpr = this.dpr, w = this.mm.width, h = this.mm.height; if (!W.mapCanvas) return;
    ctx.clearRect(0, 0, w, h); ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, w, h, 10 * dpr); ctx.clip(); ctx.fillStyle = '#0b0f1e'; ctx.fillRect(0, 0, w, h);
    const scale = 0.72 * dpr, cx = w / 2, cy = h * 0.6, yaw = P.camYaw; ctx.translate(cx, cy); const ang = Math.atan2(Math.cos(yaw), Math.sin(yaw)); ctx.rotate(-Math.PI / 2 - ang);
    const k = scale / W.mapScale; ctx.save(); ctx.translate(-(P.x - W.mapX0) * scale, -(P.z - W.mapZ0) * scale); ctx.drawImage(W.mapCanvas, 0, 0, W.mapCanvas.width * k, W.mapCanvas.height * k); ctx.restore();
    const R = Math.min(w, h) * 0.46;
    // 35 degree view cone along the camera heading (the map is rotated so that camYaw points up; here the origin is the player)
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, ang - MM_CONE, ang + MM_CONE); ctx.closePath(); ctx.fill();
    const bl = this.blips();
    for (let i = 0; i < bl.length; i++) {
      const b = bl[i]; let bx = (b.x - P.x) * scale, bz = (b.z - P.z) * scale; const d = Math.hypot(bx, bz); const clampIt = b.kind === 'objective' || b.kind === 'mission'; if (d > R) { if (!clampIt && b.kind !== 'cop') continue; bx *= R / d; bz *= R / d; }
      ctx.fillStyle = b.color; ctx.beginPath(); const r = (b.kind === 'objective' ? 5.5 + Math.sin(g.time * 6) * 1.2 : b.kind === 'cop' ? 4 : b.kind === 'copped' || b.kind === 'enemy' ? 2.6 : b.kind === 'poi' ? 6.5 : 5) * dpr; ctx.arc(bx, bz, r, 0, 6.28); ctx.fill();
      if (b.kind === 'objective' || b.kind === 'mission') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2 * dpr; ctx.stroke(); }
      if (b.kind === 'poi' || b.kind === 'mission') { ctx.save(); ctx.translate(bx, bz); ctx.rotate(Math.PI / 2 + ang); const sc = (b.kind === 'poi' ? 0.15 : 0.12) * dpr; ctx.scale(sc, sc); ctx.translate(-32, -32); ctx.fillStyle = '#0b0f1e'; ctx.fill(iconPath(b.kind === 'mission' ? 'mission' : b.icon), 'evenodd'); ctx.restore(); }
    }
    // player arrow (world facing direction) with a black outline so it reads on any map colour
    const fy = P.vehicle ? Math.atan2(P.vehicle.fx, P.vehicle.fz) : P.yaw; const dx = Math.sin(fy), dz = Math.cos(fy), px = -dz, pz = dx; const L = 7 * dpr;
    ctx.beginPath(); ctx.moveTo(dx * L, dz * L); ctx.lineTo(-dx * L * 0.7 + px * L * 0.6, -dz * L * 0.7 + pz * L * 0.6); ctx.lineTo(-dx * L * 0.3, -dz * L * 0.3); ctx.lineTo(-dx * L * 0.7 - px * L * 0.6, -dz * L * 0.7 - pz * L * 0.6); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.lineWidth = 2 * dpr; ctx.strokeStyle = '#000'; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
    // north marker
    const na = -Math.PI / 2 - ang + Math.atan2(-1, 0); const nx = cx + Math.cos(na) * (h * 0.5 - 12 * dpr), ny = cy + Math.sin(na) * (h * 0.5 - 12 * dpr);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = `${11 * dpr}px Bebas Neue, Heebo, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', clamp(nx, 8 * dpr, w - 8 * dpr), clamp(ny, 8 * dpr, h - 8 * dpr));
  }
  drawBigMap(canvas) {
    const g = this.g, W = g.world, P = g.player; const dpr = this.dpr; const cw = canvas.clientWidth, ch = canvas.clientHeight; canvas.width = cw * dpr; canvas.height = ch * dpr; const ctx = canvas.getContext('2d');
    const mw = W.mapCanvas.width, mh = W.mapCanvas.height; const k = Math.min(canvas.width / mw, canvas.height / mh) * 0.96; const ox = (canvas.width - mw * k) / 2, oy = (canvas.height - mh * k) / 2;
    ctx.fillStyle = '#0b0f1e'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(W.mapCanvas, ox, oy, mw * k, mh * k);
    const X = x => ox + (x - W.mapX0) * W.mapScale * k, Z = z => oy + (z - W.mapZ0) * W.mapScale * k;
    ctx.font = `${12 * dpr}px Heebo, sans-serif`; ctx.textBaseline = 'middle';
    for (const b of this.blips()) { if (b.kind === 'copped' || b.kind === 'enemy') continue; const r = (b.kind === 'objective' ? 8 : b.kind === 'mission' ? 7 : b.kind === 'poi' ? 8 : 5) * dpr; ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(X(b.x), Z(b.z), r, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5 * dpr; ctx.stroke();
      if (b.kind === 'poi' || b.kind === 'mission') { ctx.save(); ctx.translate(X(b.x), Z(b.z)); const sc = 0.18 * dpr; ctx.scale(sc, sc); ctx.translate(-32, -32); ctx.fillStyle = '#0b0f1e'; ctx.fill(iconPath(b.kind === 'mission' ? 'mission' : b.icon), 'evenodd'); ctx.restore(); }
      if (b.label) { ctx.fillStyle = '#f3f0fa'; ctx.textAlign = 'left'; ctx.shadowColor = '#000'; ctx.shadowBlur = 4; ctx.fillText(b.label, X(b.x) + 11 * dpr, Z(b.z)); ctx.shadowBlur = 0; } }
    const fy = P.vehicle ? Math.atan2(P.vehicle.fx, P.vehicle.fz) : P.yaw; const dx = Math.sin(fy), dz = Math.cos(fy), px = -dz, pz = dx, L = 9 * dpr, cx = X(P.x), cy = Z(P.z);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx + dx * L, cy + dz * L); ctx.lineTo(cx - dx * L * 0.7 + px * L * 0.6, cy - dz * L * 0.7 + pz * L * 0.6); ctx.lineTo(cx - dx * L * 0.3, cy - dz * L * 0.3); ctx.lineTo(cx - dx * L * 0.7 - px * L * 0.6, cy - dz * L * 0.7 - pz * L * 0.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.stroke();
  }
}
