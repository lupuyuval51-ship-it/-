import { WEAPONS, VEHICLES, OUTFITS } from './config.js';
import { T, L, setLang, LANGS } from './i18n.js';
import { fmtMoney, fmtTime } from './utils.js';
import { ICONS } from './icons.js';

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
    for (const b of document.querySelectorAll('[data-lang]')) b.classList.toggle('on', b.dataset.lang === L.code);
    $('btnContinue').disabled = !this.g.hasSave();
    if (this.open === 'shop' && this.shopType) this.openShop(this.shopType, this.shopLabel); if (this.open === 'pause') this.renderStats();
  }
  show(name) { for (const k in this.screens) this.screens[k].hidden = k !== name; this.open = name; if (name === 'pause') this.renderStats(); if (name === 'map') this.g.hud.drawBigMap(this.$('bigmap')); }
  hideAll() { for (const k in this.screens) this.screens[k].hidden = true; this.open = null; }
  setLoading(on) { this.screens.loading.hidden = !on; }
  renderCasino() {
    const g = this.g, $ = this.$; const SYM = ['7', '★', '♦', '●', '♥', '$']; this.bet = this.bet || 100;
    $('shopList').innerHTML = `<li class="casino"><div class="reels"><span>7</span><span>★</span><span>♦</span></div><p class="rules">${T.casinoRules}</p><div class="bets">${[100, 500, 2000].map(b => `<button class="btn small ${b === this.bet ? 'on' : ''}" data-bet="${b}">${fmtMoney(b)}</button>`).join('')}</div><button id="btnSpin" class="btn primary">${T.casinoSpin}</button><div id="casinoMsg" class="casino-msg"></div></li>`;
    $('shopList').querySelectorAll('[data-bet]').forEach(b => b.onclick = () => { this.bet = +b.dataset.bet; $('shopList').querySelectorAll('[data-bet]').forEach(x => x.classList.toggle('on', +x.dataset.bet === this.bet)); });
    const reels = [...$('shopList').querySelectorAll('.reels span')]; const msg = $('casinoMsg');
    $('btnSpin').onclick = () => {
      if (g.money < this.bet) { msg.textContent = T.notEnough; return; } const stake = this.bet; g.addMoney(-stake); g.audio.click(); const btn = $('btnSpin'); btn.disabled = true;
      const res = reels.map(() => SYM[Math.floor(Math.random() * SYM.length)]); let ticks = 0;
      const iv = setInterval(() => { ticks++; reels.forEach((r, i) => { if (ticks < 8 + i * 6) r.textContent = SYM[Math.floor(Math.random() * SYM.length)]; else r.textContent = res[i]; }); if (ticks >= 22) { clearInterval(iv); btn.disabled = false;
        const [a, b, c] = res; let mult = 0; if (a === b && b === c) mult = a === '7' ? 50 : 10; else if (a === b || b === c || a === c) mult = 2;
        if (mult) { const win = stake * mult; g.addMoney(win); g.audio.cash(); msg.textContent = `${mult >= 50 ? T.casinoJackpot + ' ' : ''}${T.casinoWin} ${fmtMoney(win)}`; msg.className = 'casino-msg win'; } else { msg.textContent = T.casinoLose; msg.className = 'casino-msg lose'; } } }, 70);
    };
  }
  renderStats() {
    const g = this.g, s = g.stats; const rows = [[T.ui.money, fmtMoney(g.money)], [T.ui.missions, `${['intro', 'taxi', 'race', 'repo', 'cleanup', 'packages', 'pursuit', 'heist'].filter(id => g.missions.completed.has(id)).length} / 8`], [T.ui.tokens, `${s.tokens} / 20`], [T.ui.kills, s.kills], [T.ui.carsStolen, s.carsStolen], [T.ui.distance, (s.distance / 1000).toFixed(1) + ' km'], [T.ui.playtime, fmtTime(s.playtime)]];
    this.$('stats').innerHTML = rows.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
  }
  openShop(type, label) {
    const g = this.g, P = g.player, $ = this.$; this.shopType = type; this.shopLabel = label; const items = [];
    const titleKey = label || { guns: 'shopGuns', cars: 'shopCars', spray: 'shopSpray', hospital: 'shopHospital', safehouse: 'safehouse', burger: 'shopBurger', clothes: 'shopClothes', casino: 'casino' }[type]; $('shopTitle').textContent = T[titleKey] || '';
    $('shopList').className = 'shop-list' + (type === 'casino' ? ' casino-list' : '');
    if (type === 'guns') { for (const w of WEAPONS.filter(w => w.price > 0)) { const owned = !!P.weapons[w.id]; const ammoOnly = owned && !w.melee; items.push({ name: T.weapon[w.id], icon: w.id, sub: ammoOnly ? `${T.ammoPack} ×${w.ammoPack}` : (w.melee ? '' : `${w.dmg} dmg`), price: ammoOnly ? w.ammoPrice : w.price, tag: owned ? T.owned : '', disabled: owned && w.melee, buy: () => ammoOnly ? P.giveAmmo(w.id, w.ammoPack) : P.giveWeapon(w.id, w.ammoPack || 0) }); } items.push({ name: T.armor, price: 500, buy: () => { P.armor = 100; } }); }
    else if (type === 'cars') { for (const id in VEHICLES) { const v = VEHICLES[id]; if (!v.price) continue; items.push({ name: T.vehicle[id], sub: `${Math.round(v.maxSpeed * 3.6)} ${T.kmh}`, price: v.price, buy: () => { g.deliverCar(id); g.hud.notify(T.spawnHere, 'cash'); } }); } }
    else if (type === 'spray') { items.push({ name: T.spray, price: 300, disabled: !P.vehicle, buy: () => { P.vehicle.repair(); g.police.clear(); g.hud.notify(T.sprayDone, 'cash'); g.resume(); } }); }
    else if (type === 'hospital') { items.push({ name: T.heal, price: 150, buy: () => { P.health = 100; g.hud.notify(T.healDone, 'cash'); } }); items.push({ name: T.armor, price: 500, buy: () => { P.armor = 100; } }); }
    else if (type === 'burger') { items.push({ name: T.meal, price: 20, buy: () => { P.health = 100; g.hud.notify(T.mealDone, 'cash'); g.resume(); } }); }
    else if (type === 'clothes') { for (const o of OUTFITS) { const owned = g.ownedOutfits.has(o.id), cur = g.outfit === o.id; items.push({ name: T.outfit[o.id], icon: 'clothes', price: owned ? 0 : o.price, tag: cur ? T.wearing : owned ? T.owned : '', label: owned ? T.wear : null, disabled: cur, buy: () => { g.ownedOutfits.add(o.id); g.applyOutfit(o.id); } }); } }
    else if (type === 'safehouse') { items.push({ name: T.save, price: 0, buy: () => { g.saveGame(); g.resume(); } }); items.push({ name: T.sleep, price: 0, buy: () => { g.sleep(); g.resume(); } }); }
    else if (type === 'casino') { this.renderCasino(); this.show('shop'); return; }
    $('shopList').innerHTML = items.map((it, i) => `<li class="${it.disabled ? 'off' : ''}">${it.icon ? `<svg viewBox="0 0 64 64" class="shop-icon"><path d="${ICONS[it.icon] || ''}" fill="currentColor" fill-rule="evenodd"/></svg>` : '<span></span>'}<div><b>${it.name}</b>${it.sub ? `<small>${it.sub}</small>` : ''}</div><span class="tag">${it.tag || ''}</span><button data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.price ? fmtMoney(it.price) : (it.label || T.buy)}</button></li>`).join('');
    $('shopList').querySelectorAll('button').forEach(b => b.onclick = () => { const it = items[+b.dataset.i]; if (it.price > g.money) { g.hud.notify(T.notEnough, 'warn'); g.audio.click(); return; } if (it.price) g.addMoney(-it.price); it.buy(); g.audio.cash(); if (this.open === 'shop') this.openShop(type); });
    this.show('shop');
  }
}
