import { WEAPONS, VEHICLES, OUTFITS } from './config.js';
import { T, L, setLang, LANGS } from './i18n.js';
import { fmtMoney, fmtTime } from './utils.js';
import { ICONS } from './icons.js';

// Casino table. Reels are three independent draws from six symbols: P(pair) = 90/216, P(three of a kind) = 5/216, P(7-7-7) = 1/216,
// so the return is (90*1 + 5*12 + 1*60) / 216 = 97.2% of the stake.
export const CASINO_BETS = [100, 500, 2000, 5000];
export const CASINO_PAY = { pair: 1, triple: 12, jackpot: 60 };
export function casinoMult(a, b, c) { if (a === b && b === c) return a === '7' ? CASINO_PAY.jackpot : CASINO_PAY.triple; if (a === b || b === c || a === c) return CASINO_PAY.pair; return 0; }
// Spray shop price: a repair costs 250 and every wanted star adds 450.
export const sprayPrice = level => 250 + 450 * level;

// New strings of the shop screens: the language files may carry them as T.<key>; until they do these local copies (Hebrew and English) are used.
const SHOP_COLOR = { guns: '#ff4fa3', cars: '#3ce8f5', spray: '#c084fc', hospital: '#ff5a5a', burger: '#ff9a3c', clothes: '#ff9ad5', casino: '#ffd34e', safehouse: '#7cff8a' };
const SHOP_STR = {
  he: { grpMelee: 'נשק קר', grpHandguns: 'אקדחים', grpLongGuns: 'נשק ארוך', grpThrown: 'חומרי נפץ', grpGear: 'ציוד מגן', statDamage: 'עוצמה', statRate: 'קצב אש', statRange: 'טווח', statSpeed: 'מהירות', statAccel: 'תאוצה', statGrip: 'אחיזה',
    descArmor: 'שכפ״ץ מלא עד 100', descHeal: 'מחזיר את החיים ל־100', descSprayCar: 'צריך להגיע ברכב כדי לצבוע', snack: 'צ׳יפס וקולה', descSnack: '+15 חיים', snackDone: 'נשנשת. +15 חיים.', descMeal: '+35 חיים', feast: 'ארוחת ענק', descFeast: '+60 חיים', feastDone: 'אכלת ארוחת ענק. +60 חיים.',
    greet_guns: 'ברוכים הבאים. תסתכלו, תשאלו על הכול.', greet_cars: 'בחרו לכם. אנחנו מביאים את הרכב עד הדלת.', greet_spray: 'צבע חדש, בלי שאלות, בלי כוכבים.', greet_hospital: 'שבו, נטפל בכם.', greet_burger: 'מה אפשר להביא לכם?', greet_clothes: 'קולקציה חדשה, אתם חדשים.', greet_casino: 'בהצלחה הערב.', greet_safehouse: 'הבית שלכם. שמירה או שינה.' },
  en: { grpMelee: 'Melee', grpHandguns: 'Handguns', grpLongGuns: 'Long guns', grpThrown: 'Explosives', grpGear: 'Protection', statDamage: 'Damage', statRate: 'Fire rate', statRange: 'Range', statSpeed: 'Speed', statAccel: 'Accel', statGrip: 'Grip',
    descArmor: 'Full body armor, up to 100', descHeal: 'Restores health to 100', descSprayCar: 'Bring a vehicle to respray it', snack: 'Fries & cola', descSnack: '+15 health', snackDone: 'A quick snack. +15 health.', descMeal: '+35 health', feast: 'Double feast', descFeast: '+60 health', feastDone: 'You ate a feast. +60 health.',
    greet_guns: 'Welcome. Look around, ask about anything.', greet_cars: 'Take your pick. We deliver it to the door.', greet_spray: 'New paint, no questions, no stars.', greet_hospital: 'Sit down, we will patch you up.', greet_burger: 'What can I get you?', greet_clothes: 'New season, new you.', greet_casino: 'Good luck tonight.', greet_safehouse: 'Your place. Save or sleep.' },
};
const sx = k => T[k] ?? SHOP_STR[L.code]?.[k] ?? SHOP_STR.en[k] ?? k;

export class UI {
  constructor(game) {
    this.g = game; const $ = id => document.getElementById(id); this.$ = $;
    this.screens = { title: $('title'), pause: $('pause'), map: $('map'), shop: $('shop'), loading: $('loading') }; this.open = null;
    $('btnNew').onclick = () => game.startNew(); $('btnContinue').onclick = () => game.continueGame(); $('btnControls').onclick = () => $('titleControls').classList.toggle('on');
    $('btnResume').onclick = () => game.resume(); $('btnSave').onclick = () => { game.saveGame(); }; $('btnLoad').onclick = () => { if (game.loadGame()) game.resume(); }; $('btnQuit').onclick = () => game.toTitle();
    $('btnMapClose').onclick = () => game.resume(); $('btnShopClose').onclick = () => game.resume();
    for (const b of document.querySelectorAll('[data-lang]')) b.onclick = () => { setLang(b.dataset.lang); game.settings.lang = b.dataset.lang; game.saveSettings(); this.applyLanguage(); };
    $('selQuality').onchange = e => { game.settings.qualityUser = true; game.setQuality(e.target.value); }; $('rangeVolume').oninput = e => game.setVolume(+e.target.value); $('rangeSens').oninput = e => { game.settings.sensitivity = +e.target.value; game.saveSettings(); };
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
    if (this.open === 'shop' && this.shopType) this.openShop(this.shopType, this.shopLabel); if (this.open === 'pause') { this.renderStats(); this.renderJobs(); }
  }
  show(name) { for (const k in this.screens) this.screens[k].hidden = k !== name; this.open = name; if (name === 'pause') { this.renderStats(); this.renderJobs(); } if (name === 'map') this.g.hud.drawBigMap(this.$('bigmap')); }
  hideAll() { for (const k in this.screens) this.screens[k].hidden = true; this.open = null; }
  setLoading(on) { this.screens.loading.hidden = !on; }
  renderCasino() {
    const g = this.g, $ = this.$; const SYM = ['7', '★', '♦', '●', '♥', '$']; this.bet = this.bet || 100;
    $('shopList').innerHTML = `<li class="casino"><div class="reels"><span>7</span><span>★</span><span>♦</span></div><p class="rules">${T.casinoRules}</p><div class="bets">${CASINO_BETS.map(b => `<button class="btn small ${b === this.bet ? 'on' : ''}" data-bet="${b}">${fmtMoney(b)}</button>`).join('')}</div><button id="btnSpin" class="btn primary">${T.casinoSpin}</button><div id="casinoMsg" class="casino-msg"></div></li>`;
    $('shopList').querySelectorAll('[data-bet]').forEach(b => b.onclick = () => { this.bet = +b.dataset.bet; $('shopList').querySelectorAll('[data-bet]').forEach(x => x.classList.toggle('on', +x.dataset.bet === this.bet)); });
    const reels = [...$('shopList').querySelectorAll('.reels span')]; const msg = $('casinoMsg');
    $('btnSpin').onclick = () => {
      if (g.money < this.bet) { msg.textContent = T.notEnough; return; } const stake = this.bet; g.addMoney(-stake); g.audio.click(); const btn = $('btnSpin'); btn.disabled = true;
      const res = reels.map(() => SYM[Math.floor(Math.random() * SYM.length)]); let ticks = 0;
      const iv = setInterval(() => { ticks++; reels.forEach((r, i) => { if (ticks < 8 + i * 6) r.textContent = SYM[Math.floor(Math.random() * SYM.length)]; else r.textContent = res[i]; }); if (ticks >= 22) { clearInterval(iv); btn.disabled = false;
        const mult = casinoMult(res[0], res[1], res[2]);
        if (mult) { const win = stake * mult; g.addMoney(win); g.audio.cash(); if (mult === CASINO_PAY.pair) { msg.textContent = `${T.casinoPush ?? 'Pair: stake back'} ${fmtMoney(win)}`; msg.className = 'casino-msg'; } else { msg.textContent = `${mult >= CASINO_PAY.jackpot ? T.casinoJackpot + ' ' : ''}${T.casinoWin} ${fmtMoney(win)}`; msg.className = 'casino-msg win'; } } else { msg.textContent = T.casinoLose; msg.className = 'casino-msg lose'; } } }, 70);
    };
  }
  renderStats() {
    const g = this.g, s = g.stats; const rows = [[T.ui.money, fmtMoney(g.money)], [T.ui.missions, `${['intro', 'taxi', 'race', 'repo', 'cleanup', 'packages', 'pursuit', 'heist'].filter(id => g.missions.completed.has(id)).length} / 8`], [T.ui.tokens, `${s.tokens} / 20`], [T.ui.kills, s.kills], [T.ui.carsStolen, s.carsStolen], [T.ui.distance, (s.distance / 1000).toFixed(1) + ' km'], [T.ui.playtime, fmtTime(s.playtime)]];
    this.$('stats').innerHTML = rows.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
  }
  // the pause screen's job board (#jobsStats, .job-card): one card per job with its level and XP toward the next, shifts, best call and total earned; the board stays hidden until something is filled
  renderJobs() {
    const box = this.$('jobsStats'); if (!box) return; const J = this.g.jobs, U = T.ui, defs = J ? J.definitions : [];
    if (!defs.some(d => d.stats.shifts > 0)) { box.innerHTML = `<p class="jobs-none">${U.jobsNone}</p>`; return; }
    const ICO = { paramedic: 'ambulance' };
    box.innerHTML = defs.map(d => {
      const s = d.stats, pct = d.xpNext ? Math.max(0, Math.min(100, 100 * (d.xp - d.xpThis) / (d.xpNext - d.xpThis))) : 100;
      const note = d.active ? U.jobOnShift : d.xpNext ? U.jobNext.replace('{0}', d.xpNext - d.xp).replace('{1}', d.level + 1) : U.jobMax;
      return `<div class="job-card${d.active ? ' on-shift' : ''}" style="--jc:${d.color}"><span class="jc-ico"><svg viewBox="0 0 64 64"><path d="${ICONS[ICO[d.id] || d.id] || ICONS.mission}" fill="currentColor" fill-rule="evenodd"/></svg></span><div class="jc-main"><div class="jc-top"><b class="jc-name">${J.name(d.id)}</b><span class="jc-lv">${d.level}</span></div><div class="jc-xp"><i style="width:${pct}%"></i></div><div class="jc-meta"><span>${U.jobShifts} ${s.shifts}</span><span>${U.jobEarned} <b>${fmtMoney(s.earned)}</b></span></div><div class="jc-meta"><span>${U.jobBest}</span><b>${fmtMoney(s.best)}</b></div><div class="jc-note">${note}</div></div></div>`;
    }).join('');
  }
  // ---------- shop screens ----------
  // Every shop opens the same layout: a header (icon in the colour of the shop, a line from the keeper, the cash in hand), items in groups with an icon, a name, a
  // short description or stat bars, a tag and a buy button whose price turns red when it cannot be paid. The style is injected here (shopUiStyle), the markup is
  // written into #shopList and a #shopHead element that this method creates in front of it.
  shopStyle() {
    if (document.getElementById('shopUiStyle')) return; const st = document.createElement('style'); st.id = 'shopUiStyle';
    st.textContent = `#shop .shop-panel{width:min(96vw,700px)}
#shop .shop-head{display:flex;align-items:center;gap:14px;margin:0 0 10px;padding:12px 14px;border-radius:14px;background:linear-gradient(90deg,color-mix(in srgb,var(--sc,#ff4fa3) 26%,transparent),rgba(255,255,255,.03));border:1px solid color-mix(in srgb,var(--sc,#ff4fa3) 45%,transparent)}
#shop .sh-ico{flex:0 0 auto;width:48px;height:48px;border-radius:13px;display:grid;place-items:center;background:var(--sc,#ff4fa3);color:#0b0f1e;box-shadow:0 0 18px color-mix(in srgb,var(--sc,#ff4fa3) 60%,transparent)}
#shop .sh-ico svg{width:30px;height:30px}
#shop .sh-msg{flex:1;min-width:0;font-size:15px;line-height:1.35;color:#e6e3f4}
#shop .sh-msg small{display:block;color:var(--muted);font-size:12px;margin-top:2px}
#shop .sh-cash{flex:0 0 auto;text-align:end;font-family:var(--display);font-size:30px;line-height:1;color:var(--green);direction:ltr}
#shop .sh-cash small{display:block;font-family:inherit;font-size:11px;letter-spacing:1.5px;color:var(--muted);margin-bottom:2px}
#shop .shop-list{max-height:min(62vh,560px);overflow:auto;padding-inline-end:4px}
#shop .shop-list li.shop-grp{display:block;font-family:var(--display);letter-spacing:1.6px;font-size:15px;color:var(--sc,#ff4fa3);margin:12px 0 2px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.12);list-style:none}
#shop .shop-list li:not(.shop-grp):not(.casino){grid-template-columns:48px 1fr auto auto;padding:10px 4px}
#shop .shop-list li.off{opacity:.5}
#shop .shop-ico{width:42px;height:42px;border-radius:11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);display:grid;place-items:center;color:var(--sc,#ff4fa3)}
#shop .shop-ico svg{width:28px;height:28px}
#shop .shop-list b{font-size:16px}
#shop .shop-list .desc{display:block;color:var(--muted);font-size:12.5px;margin-top:1px}
#shop .bars{display:grid;grid-template-columns:repeat(3,minmax(60px,1fr));gap:3px 12px;margin-top:6px;max-width:330px}
#shop .bars span{font-size:10.5px;color:var(--muted);display:block;line-height:1.2}
#shop .bars i{display:block;height:4px;margin-top:2px;border-radius:2px;background:rgba(255,255,255,.12);position:relative;overflow:hidden}
#shop .bars i:after{content:"";position:absolute;inset:0 auto 0 0;width:var(--v);background:var(--sc,#ff4fa3);border-radius:2px}
html[dir=rtl] #shop .bars i:after{inset:0 0 0 auto}
#shop .swatch{display:flex;gap:4px;margin-top:6px}
#shop .swatch i{width:17px;height:17px;border-radius:50%;border:1px solid rgba(255,255,255,.4)}
#shop .shop-list li.poor button{color:var(--red);border-color:rgba(255,90,90,.35)}
#shop .shop-list li button:not([disabled]):hover{background:color-mix(in srgb,var(--sc,#ff4fa3) 24%,transparent)}
@media (max-width:560px){#shop .sh-cash{font-size:22px}#shop .shop-list li:not(.shop-grp):not(.casino){grid-template-columns:40px 1fr auto}#shop .shop-list .tag{display:none}}`;
    document.head.appendChild(st);
  }
  openShop(type, label) {
    const g = this.g, P = g.player, $ = this.$; this.shopType = type; this.shopLabel = label; const items = []; this.shopStyle();
    const titleKey = label || { guns: 'shopGuns', cars: 'shopCars', spray: 'shopSpray', hospital: 'shopHospital', safehouse: 'safehouse', burger: 'shopBurger', clothes: 'shopClothes', casino: 'casino' }[type]; $('shopTitle').textContent = T[titleKey] || '';
    $('shopList').className = 'shop-list' + (type === 'casino' ? ' casino-list' : '');
    const stat = (k, v) => ({ k, v: Math.max(0.04, Math.min(1, v)) });
    if (type === 'guns') {
      for (const w of WEAPONS.filter(w => w.price > 0)) { const owned = !!P.weapons[w.id]; const ammoOnly = owned && !w.melee; const grp = w.melee ? 'grpMelee' : w.thrown ? 'grpThrown' : w.id === 'pistol' || w.id === 'revolver' ? 'grpHandguns' : 'grpLongGuns';
        items.push({ name: T.weapon[w.id], icon: w.id, grp, sub: ammoOnly ? `${T.ammoPack} ×${w.ammoPack}` : '', bars: w.thrown ? null : [stat('statDamage', w.dmg * (w.pellets || 1) / 130), stat('statRate', (1 / w.rate) / 12), stat('statRange', w.range / 320)], price: ammoOnly ? w.ammoPrice : w.price, tag: owned ? T.owned : '', disabled: owned && w.melee, buy: () => ammoOnly ? P.giveAmmo(w.id, w.ammoPack) : P.giveWeapon(w.id, w.ammoPack || 0) }); }
      items.push({ name: T.armor, icon: 'police', grp: 'grpGear', sub: sx('descArmor'), price: 500, buy: () => { P.armor = 100; } });
    }
    else if (type === 'cars') { for (const id in VEHICLES) { const v = VEHICLES[id]; if (!v.price) continue; items.push({ name: T.vehicle[id], icon: 'dealer', sub: `${Math.round(v.maxSpeed * 3.6)} ${T.kmh}`, bars: [stat('statSpeed', v.maxSpeed / 66), stat('statAccel', v.accel / 20), stat('statGrip', v.grip / 10.5)], price: v.price, buy: () => { g.deliverCar(id); g.hud.notify(T.spawnHere, 'cash'); } }); } }
    else if (type === 'spray') { const lvl = g.police.level, watched = lvl > 0 && !g.police.hidden; // a respray hides nothing while the cops can see the car, and every star adds to the price
      items.push({ name: T.spray, icon: 'spray', sub: !P.vehicle ? sx('descSprayCar') : '', price: sprayPrice(lvl), tag: watched ? (T.sprayWatched ?? 'The police can see you') : '', disabled: !P.vehicle || watched, buy: () => { if (!P.vehicle) return; P.vehicle.repair(); g.police.clear(); g.hud.notify(T.sprayDone, 'cash'); g.resume(); } }); }
    else if (type === 'hospital') { items.push({ name: T.heal, icon: 'hospital', sub: sx('descHeal'), price: 90, buy: () => { P.health = 100; g.hud.notify(T.healDone, 'cash'); } }); items.push({ name: T.armor, icon: 'police', sub: sx('descArmor'), price: 500, buy: () => { P.armor = 100; } }); }
    else if (type === 'burger') { // +health per item and the shop stays open, so several can be bought
      items.push({ name: sx('snack'), icon: 'burger', sub: sx('descSnack'), price: 8, buy: () => { P.health = Math.min(100, P.health + 15); g.hud.notify(sx('snackDone'), 'cash'); } });
      items.push({ name: T.meal, icon: 'burger', sub: sx('descMeal'), price: 20, buy: () => { P.health = Math.min(100, P.health + 35); g.hud.notify(T.mealDone, 'cash'); } });
      items.push({ name: sx('feast'), icon: 'burger', sub: sx('descFeast'), price: 38, buy: () => { P.health = Math.min(100, P.health + 60); g.hud.notify(sx('feastDone'), 'cash'); } }); }
    else if (type === 'clothes') { for (const o of OUTFITS) { const owned = g.ownedOutfits.has(o.id), cur = g.outfit === o.id; const L = o.look, hex = c => '#' + (c ?? 0x888888).toString(16).padStart(6, '0'); items.push({ name: T.outfit[o.id], icon: 'clothes', swatch: [L.jacket ?? L.shirt, L.shirt, L.pants].map(hex), price: owned ? 0 : o.price, tag: cur ? T.wearing : owned ? T.owned : '', label: owned ? T.wear : null, disabled: cur, buy: () => { g.ownedOutfits.add(o.id); g.applyOutfit(o.id); } }); } }
    else if (type === 'safehouse') { items.push({ name: T.save, icon: 'safehouse', price: 0, buy: () => { g.saveGame(); g.resume(); } }); items.push({ name: T.sleep, icon: 'safehouse', price: 0, buy: () => { g.sleep(); g.resume(); } }); }
    this.renderShopHead(type);
    if (type === 'casino') { this.renderCasino(); this.show('shop'); return; }
    let html = '', last = null;
    items.forEach((it, i) => {
      if (it.grp && it.grp !== last) { last = it.grp; html += `<li class="shop-grp">${sx(it.grp)}</li>`; }
      const poor = it.price > g.money && !it.disabled;
      html += `<li class="${it.disabled ? 'off' : ''} ${poor ? 'poor' : ''}"><span class="shop-ico"><svg viewBox="0 0 64 64"><path d="${ICONS[it.icon] || ICONS.mission}" fill="currentColor" fill-rule="evenodd"/></svg></span><div><b>${it.name}</b>${it.sub ? `<small class="desc">${it.sub}</small>` : ''}${it.bars ? `<div class="bars">${it.bars.map(b => `<div><span>${sx(b.k)}</span><i style="--v:${Math.round(b.v * 100)}%"></i></div>`).join('')}</div>` : ''}${it.swatch ? `<div class="swatch">${it.swatch.map(c => `<i style="background:${c}"></i>`).join('')}</div>` : ''}</div><span class="tag">${it.tag || ''}</span><button data-i="${i}" ${it.disabled ? 'disabled' : ''}>${it.price ? fmtMoney(it.price) : (it.label || T.buy)}</button></li>`;
    });
    $('shopList').innerHTML = html;
    $('shopList').querySelectorAll('button').forEach(b => b.onclick = () => { const it = items[+b.dataset.i]; if (!it || it.disabled) return; if (it.price > g.money) { g.hud.notify(T.notEnough, 'warn'); g.audio.click(); return; } if (it.price) g.addMoney(-it.price); it.buy(); g.audio.cash(); if (this.open === 'shop') this.openShop(type, this.shopLabel); });
    this.show('shop');
  }
  // the header of a shop screen: icon, the keeper's greeting, the cash in hand
  renderShopHead(type) {
    const $ = this.$, list = $('shopList'); let head = $('shopHead'); if (!head) { head = document.createElement('div'); head.id = 'shopHead'; head.className = 'shop-head'; list.parentNode.insertBefore(head, list); }
    const col = SHOP_COLOR[type] || '#ff4fa3', ico = { cars: 'dealer' }[type] || type; head.style.setProperty('--sc', col); list.style.setProperty('--sc', col);
    head.innerHTML = `<span class="sh-ico"><svg viewBox="0 0 64 64"><path d="${ICONS[ico] || ICONS.mission}" fill="currentColor" fill-rule="evenodd"/></svg></span><div class="sh-msg">${sx('greet_' + type)}</div><div class="sh-cash"><small>${T.ui?.money ?? 'Cash'}</small>${fmtMoney(this.g.money)}</div>`;
  }
}
