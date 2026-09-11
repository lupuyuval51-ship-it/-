import { WEAPONS } from './config.js';
import { T } from './i18n.js';
import { fmtMoney, fmtTime, clamp, damp } from './utils.js';
import { ICONS, iconPath } from './icons.js';

export class HUD {
  constructor(game) {
    this.g = game; const $ = id => document.getElementById(id);
    this.el = { hud: $('hud'), money: $('money'), moneyDelta: $('moneyDelta'), stars: [...$('stars').children], weapon: $('weaponName'), ammo: $('ammo'), clock: $('clock'), objective: $('objective'), notify: $('notify'), health: $('healthBar'), armor: $('armorBar'), speedo: $('speedo'), speed: $('speed'), subtitle: $('subtitle'), radio: $('radioPopup'), cross: $('crosshair'), prompt: $('prompt'), timer: $('missionTimer'), overlay: $('overlay'), hurt: $('hurt'), result: $('missionResult'), mtitle: $('missionTitle'), evade: $('evade'), wicon: $('weaponIcon').querySelector('path'), scope: $('scope') };
    this.mm = $('minimap'); this.mmCtx = this.mm.getContext('2d'); this.dpr = Math.min(2, devicePixelRatio || 1); this.mm.width = 240 * this.dpr; this.mm.height = 160 * this.dpr;
    this.el.hurt.remove(); this.moneyShown = 0; this.hurtLevel = 0; this.starFlash = 0; this.subT = 0; this.timerOn = false; this.kick = 0; this.hurtT = 0; this.radioT = 0; this.resultT = 0; this.titleT = 0; this.mmT = 0;
  }
  show(v) { this.el.hud.hidden = !v; }
  notify(text, kind = '', dur = 4) { const d = document.createElement('div'); d.className = 'toast ' + kind; d.textContent = text; this.el.notify.prepend(d); while (this.el.notify.children.length > 4) this.el.notify.lastChild.remove(); setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, dur * 1000); }
  moneyDelta(n) { const e = this.el.moneyDelta; e.textContent = (n >= 0 ? '+' : '-') + fmtMoney(Math.abs(n)); e.className = 'money-delta ' + (n >= 0 ? 'plus' : 'minus'); e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; }
  flashStars() { this.starFlash = 1.2; }
  subtitle(text, dur = 4) { const e = this.el.subtitle; if (!text) { e.classList.remove('on'); return; } const i = text.indexOf(':'); e.innerHTML = i > 0 && i < 18 ? `<b>${text.slice(0, i)}:</b>${text.slice(i + 1)}` : text; e.classList.add('on'); this.subT = dur; }
  prompt(text) { const e = this.el.prompt; if (text) { if (e.textContent !== text) e.textContent = text; e.classList.add('on'); } else e.classList.remove('on'); }
  setObjective(text) { const e = this.el.objective; if (!text) { e.classList.remove('on'); return; } if (e.textContent !== text) e.textContent = text; e.classList.add('on'); }
  setTimer(s, label) { this.timerOn = true; this.el.timer.innerHTML = `<small>${label || ''}</small>${fmtTime(s)}`; this.el.timer.classList.add('on'); this.el.timer.classList.toggle('low', s < 15); }
  clearTimer() { this.timerOn = false; this.el.timer.classList.remove('on'); }
  missionTitle(name) { this.el.mtitle.textContent = name; this.el.mtitle.classList.add('on'); this.titleT = 4; }
  missionResult(passed, title, sub) { const e = this.el.result; e.querySelector('.title').textContent = title; e.querySelector('.sub').textContent = sub || ''; e.className = 'mission-result on ' + (passed ? 'pass' : 'fail'); this.resultT = 5; }
  hurt() { this.hurtT = 0.5; }
  scope(on) { if (this.scoped === on) return; this.scoped = on; this.el.scope.classList.toggle('on', on); }
  recoil() { this.kick = 1; }
  radio(id, show = true) { const e = this.el.radio; e.textContent = '♪ ' + T.stations[id]; if (show) { e.classList.add('on'); this.radioT = 2.5; } }
  overlay(kind) { const e = this.el.overlay; if (!kind) { e.classList.remove('on'); return; } e.querySelector('.big').textContent = kind === 'wasted' ? T.wasted : T.busted; e.querySelector('.sub').textContent = kind === 'wasted' ? T.respawnHospital : T.respawnPolice; e.classList.add('on'); }
  update(dt) {
    const g = this.g, P = g.player, E = this.el;
    this.moneyShown += (g.money - this.moneyShown) * Math.min(1, dt * 7); if (Math.abs(g.money - this.moneyShown) < 1) this.moneyShown = g.money; E.money.textContent = fmtMoney(this.moneyShown);
    const lvl = g.police.level; this.starFlash = Math.max(0, this.starFlash - dt); const blink = g.police.hidden && Math.floor(g.time * 3) % 2 === 0;
    E.stars.forEach((s, i) => { s.className = i < lvl ? (blink ? 'on dim' : 'on') : ''; }); E.stars[0].parentElement.classList.toggle('flash', this.starFlash > 0);
    E.weapon.textContent = T.weapon[P.weapon.id]; const st = P.ammoState; E.ammo.textContent = P.weapon.melee ? '' : P.weapon.thrown ? `${st.clip + st.ammo}` : `${st.clip} / ${st.ammo === Infinity ? '∞' : st.ammo}`; if (this.lastWeapon !== P.weapon.id) { this.lastWeapon = P.weapon.id; E.wicon.setAttribute('d', ICONS[P.weapon.id] || ''); }
    const mins = Math.floor(g.clock); E.clock.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    E.health.style.width = clamp(P.health, 0, 100) + '%'; E.health.classList.toggle('low', P.health < 30); E.armor.style.width = clamp(P.armor, 0, 100) + '%';
    if (P.vehicle) { E.speedo.classList.add('on'); E.speed.textContent = Math.round(P.vehicle.speed * 3.6); } else E.speedo.classList.remove('on');
    if (this.subT > 0) { this.subT -= dt; if (this.subT <= 0) E.subtitle.classList.remove('on'); }
    if (this.radioT > 0) { this.radioT -= dt; if (this.radioT <= 0) E.radio.classList.remove('on'); }
    if (this.resultT > 0) { this.resultT -= dt; if (this.resultT <= 0) E.result.classList.remove('on'); }
    if (this.titleT > 0) { this.titleT -= dt; if (this.titleT <= 0) E.mtitle.classList.remove('on'); }
    this.hurtT = Math.max(0, this.hurtT - dt); this.hurtLevel = Math.min(1, this.hurtT * 2.2 + (P.health < 25 && !P.dead ? 0.3 + Math.sin(g.time * 5) * 0.12 : 0));
    const aimCross = (P.aiming || (P.vehicle && !P.weapon.melee && !P.weapon.thrown)) && !P.dead && !P.zoom; E.cross.classList.toggle('on', aimCross); this.kick = damp(this.kick, 0, 14, dt); E.cross.style.transform = `translate(-50%,-50%) scale(${1 + this.kick * 0.5})`;
    E.evade.classList.toggle('on', lvl > 0 && g.police.hidden);
    this.mmT -= dt; if (this.mmT <= 0) { this.mmT = 1 / 30; this.drawMinimap(); }
  }
  blips() {
    const g = this.g, W = g.world, out = [];
    for (const id in W.pois) { const p = W.pois[id]; if (p.noMarker && id !== 'docks') continue; if (p.mission) continue; out.push({ x: p.x, z: p.z, color: p.color, kind: 'poi', icon: p.type || id, label: T[p.label] }); }
    for (const b of g.missions.blips) out.push(b);
    for (const v of g.police.cars) out.push({ x: v.x, z: v.z, color: Math.floor(g.time * 4) % 2 ? '#ff3b3b' : '#4d8cff', kind: 'cop' });
    for (const p of g.peds) if (!p.dead && (p.team === 'gang' && p.hostile)) out.push({ x: p.x, z: p.z, color: '#ff3b3b', kind: 'enemy' });
    for (const p of g.peds) if (!p.dead && (p.team === 'cop' || p.team === 'swat')) out.push({ x: p.x, z: p.z, color: '#4d8cff', kind: 'copped' });
    return out;
  }
  drawMinimap() {
    const g = this.g, P = g.player, W = g.world, ctx = this.mmCtx, dpr = this.dpr, w = this.mm.width, h = this.mm.height; if (!W.mapCanvas) return;
    ctx.clearRect(0, 0, w, h); ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, w, h, 10 * dpr); ctx.clip(); ctx.fillStyle = '#0b0f1e'; ctx.fillRect(0, 0, w, h);
    const scale = 0.72 * dpr, cx = w / 2, cy = h * 0.6, yaw = P.camYaw; ctx.translate(cx, cy); const ang = Math.atan2(Math.cos(yaw), Math.sin(yaw)); ctx.rotate(-Math.PI / 2 - ang);
    const k = scale / W.mapScale; ctx.save(); ctx.translate(-(P.x - W.mapX0) * scale, -(P.z - W.mapZ0) * scale); ctx.drawImage(W.mapCanvas, 0, 0, W.mapCanvas.width * k, W.mapCanvas.height * k); ctx.restore();
    const R = Math.min(w, h) * 0.46;
    for (const b of this.blips()) {
      let bx = (b.x - P.x) * scale, bz = (b.z - P.z) * scale; const d = Math.hypot(bx, bz); const clampIt = b.kind === 'objective' || b.kind === 'mission'; if (d > R) { if (!clampIt && b.kind !== 'cop') continue; bx *= R / d; bz *= R / d; }
      ctx.fillStyle = b.color; ctx.beginPath(); const r = (b.kind === 'objective' ? 5.5 + Math.sin(g.time * 6) * 1.2 : b.kind === 'cop' ? 4 : b.kind === 'copped' || b.kind === 'enemy' ? 2.6 : b.kind === 'poi' ? 6.5 : 5) * dpr; ctx.arc(bx, bz, r, 0, 6.28); ctx.fill();
      if (b.kind === 'objective' || b.kind === 'mission') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.2 * dpr; ctx.stroke(); }
      if (b.kind === 'poi' || b.kind === 'mission') { ctx.save(); ctx.translate(bx, bz); ctx.rotate(Math.PI / 2 + ang); const sc = (b.kind === 'poi' ? 0.15 : 0.12) * dpr; ctx.scale(sc, sc); ctx.translate(-32, -32); ctx.fillStyle = '#0b0f1e'; ctx.fill(iconPath(b.kind === 'mission' ? 'mission' : b.icon), 'evenodd'); ctx.restore(); }
    }
    // player arrow (world facing direction)
    const fy = P.vehicle ? Math.atan2(P.vehicle.fx, P.vehicle.fz) : P.yaw; const dx = Math.sin(fy), dz = Math.cos(fy), px = -dz, pz = dx; const L = 7 * dpr;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(dx * L, dz * L); ctx.lineTo(-dx * L * 0.7 + px * L * 0.6, -dz * L * 0.7 + pz * L * 0.6); ctx.lineTo(-dx * L * 0.3, -dz * L * 0.3); ctx.lineTo(-dx * L * 0.7 - px * L * 0.6, -dz * L * 0.7 - pz * L * 0.6); ctx.closePath(); ctx.fill();
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
