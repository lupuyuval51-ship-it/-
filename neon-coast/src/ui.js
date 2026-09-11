import { WEAPONS, VEHICLES } from './config.js';
import { T, lang, setLang, LANGS } from './i18n.js';
import { fmtMoney, fmtTime } from './utils.js';

export class UI {
  constructor(game) {
    this.g = game; const $ = id => document.getElementById(id); this.$ = $;
    this.screens = { title: $('title'), pause: $('pause'), map: $('map'), shop: $('shop'), loading: $('loading') }; this.open = null;
    $('btnNew').onclick = () => game.startNew(); $('btnContinue').onclick = () => game.continueGame(); $('btnControls').onclick = () => $('titleControls').classList.toggle('on');
    $('btnResume').onclick = () => game.resume(); $('btnSave').onclick = () => { game.saveGame(); }; $('btnLoad').onclick = () => { if (game.loadGame()) game.resume(); }; $('btnQuit').onclick = () => game.toTitle();
    $('btnMapClose').onclick = () => game.resume(); $('btnShopClose').onclick = () => game.resume();
    for (const b of document.querySelectorAll('[data-lang]')) b.onclick = () => { setLang(b.dataset.lang); game.settings.lang = b.dataset.lang; game.saveSettings(); this.applyLanguage(); };
    $('selQuality').onchange = e => game.setQuality(e.target.value); $('rangeVolume').oninput = e => game.setVolume(+e.target.value); $('rangeSens').oninput = e => { game.settings.sensitivity = +e.target.value; game.saveSettings(); };
    this.applyLanguage();
  }
  applyLanguage() {
    const $ = this.$; document.title = T.title;
    for (const el of document.querySelectorAll('[data-t]')) { const path = el.dataset.t.split('.'); let v = T; for (const p of path) v = v?.[p]; if (typeof v === 'string') el.textContent = v; }
    for (const list of document.querySelectorAll('.controls-list')) list.innerHTML = T.ctrl.map(([k, d]) => `<li><kbd>${k}</kbd><span>${d}</span></li>`).join('');
    $('legend').innerHTML = T.ui.legendItems.map(([dot, name, c]) => `<li><i style="background:${c}"></i>${name}</li>`).join('');
    $('selQuality').innerHTML = `<option value="low">${T.qLow}</option><option value="med">${T.qMed}</option><option value="high">${T.qHigh}</option>`; $('selQuality').value = this.g.settings.quality;
    $('rangeVolume').value = this.g.settings.volume; $('rangeSens').value = this.g.settings.sensitivity;
    for (const b of document.querySelectorAll('[data-lang]')) b.classList.toggle('on', b.dataset.lang === lang);
    $('btnContinue').disabled = !this.g.hasSave();
    if (this.open === 'shop' && this.shopType) this.openShop(this.shopType); if (this.open === 'pause') this.renderStats();
  }
  show(name) { for (const k in this.screens) this.screens[k].hidden = k !== name; this.open = name; if (name === 'pause') this.renderStats(); if (name === 'map') this.g.hud.drawBigMap(this.$('bigmap')); }
  hideAll() { for (const k in this.screens) this.screens[k].hidden = true; this.open = null; }
  setLoading(on) { this.screens.loading.hidden = !on; }
  renderStats() {
    const g = this.g, s = g.stats; const rows = [[T.ui.money, fmtMoney(g.money)], [T.ui.missions, `${g.missions.completed.size} / 8`], [T.ui.tokens, `${s.tokens} / 20`], [T.ui.kills, s.kills], [T.ui.carsStolen, s.carsStolen], [T.ui.distance, (s.distance / 1000).toFixed(1) + ' km'], [T.ui.playtime, fmtTime(s.playtime)]];
    this.$('stats').innerHTML = rows.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
  }
  openShop(type) {
    const g = this.g, P = g.player, $ = this.$; this.shopType = type; const items = [];
    const titleKey = { guns: 'shopGuns', cars: 'shopCars', spray: 'shopSpray', hospital: 'shopHospital', safehouse: 'safehouse' }[type]; $('shopTitle').textContent = T[titleKey];
    if (type === 'guns') { for (const w of WEAPONS.slice(1)) { const owned = !!P.weapons[w.id]; items.push({ name: T.weapon[w.id], sub: owned ? `${T.ammoPack} ×${w.ammoPack}` : `${w.dmg} dmg`, price: owned ? w.ammoPrice : w.price, tag: owned ? T.owned : '', buy: () => owned ? P.giveAmmo(w.id, w.ammoPack) : P.giveWeapon(w.id, w.ammoPack) }); } items.push({ name: T.armor, price: 500, buy: () => { P.armor = 100; } }); }
    else if (type === 'cars') { for (const id in VEHICLES) { const v = VEHICLES[id]; if (!v.price) continue; items.push({ name: T.vehicle[id], sub: `${Math.round(v.maxSpeed * 3.6)} ${T.kmh}`, price: v.price, buy: () => { g.deliverCar(id); g.hud.notify(T.spawnHere, 'cash'); } }); } }
    else if (type === 'spray') { items.push({ name: T.spray, price: 300, disabled: !P.vehicle, buy: () => { P.vehicle.repair(); g.police.clear(); g.hud.notify(T.sprayDone, 'cash'); g.resume(); } }); }
    else if (type === 'hospital') { items.push({ name: T.heal, price: 150, buy: () => { P.health = 100; g.hud.notify(T.healDone, 'cash'); } }); items.push({ name: T.armor, price: 500, buy: () => { P.armor = 100; } }); }
    else if (type === 'safehouse') { items.push({ name: T.save, price: 0, buy: () => { g.saveGame(); g.resume(); } }); items.push({ name: T.sleep, price: 0, buy: () => { g.sleep(); g.resume(); } }); }
    $('shopList').innerHTML = items.map((it, i) => `<li class="${it.disabled ? 'off' : ''}"><div><b>${it.name}</b>${it.sub ? `<small>${it.sub}</small>` : ''}</div><span class="tag">${it.tag || ''}</span><button data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.price ? fmtMoney(it.price) : T.buy}</button></li>`).join('');
    $('shopList').querySelectorAll('button').forEach(b => b.onclick = () => { const it = items[+b.dataset.i]; if (it.price > g.money) { g.hud.notify(T.notEnough, 'warn'); g.audio.click(); return; } if (it.price) g.addMoney(-it.price); it.buy(); g.audio.cash(); if (this.open === 'shop') this.openShop(type); });
    this.show('shop');
  }
}
