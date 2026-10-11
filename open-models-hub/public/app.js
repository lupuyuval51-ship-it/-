import { I18N } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const session = {
  get(k) { try { return sessionStorage.getItem(k) || ''; } catch { return ''; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} }
};

const state = {
  lang: store.get('omh.lang', 'he'), theme: store.get('omh.theme', ''),
  data: { models: [], families: [], source: 'empty', updatedAt: null }, providers: [], cfg: { accessRequired: false },
  filters: { q: '', family: 'all', sort: 'new', caps: new Set(), ready: false }, shown: 60,
  compare: [], chat: { modelId: '', provider: '', messages: [], busy: null }
};
const t = (k, ...a) => { const v = I18N[state.lang][k] ?? I18N.en[k] ?? k; return typeof v === 'function' ? v(...a) : v; };
const byId = id => state.data.models.find(m => m.id === id);
const keys = () => store.get('omh.keys', {});

function toast(msg) { const el = $('#toast'); el.innerHTML = `<span>${esc(msg)}</span>`; clearTimeout(toast.t); toast.t = setTimeout(() => (el.innerHTML = ''), 2600); }

function applyChrome() {
  const root = document.documentElement;
  root.lang = state.lang; root.dir = state.lang === 'he' ? 'rtl' : 'ltr';
  if (state.theme) root.dataset.theme = state.theme; else delete root.dataset.theme;
  $('#btn-lang').textContent = state.lang === 'he' ? 'EN' : 'עב';
  document.querySelectorAll('[data-i18n]').forEach(el => (el.textContent = t(el.dataset.i18n)));
}

// ---------- formatting ----------
const fmtParams = m => {
  if (!m.paramsB) return t('na');
  const f = n => (n >= 1000 ? `${(n / 1000).toFixed(1)}T` : `${Math.round(n)}B`);
  return f(m.paramsB) + (m.activeB ? ` (${f(m.activeB)} ${t('active')})` : '');
};
const fmtCtx = n => (!n ? t('na') : n >= 1e6 ? `${+(n / (n % 1048576 === 0 ? 1048576 : 1e6)).toFixed(1)}M` : `${Math.round(n / (n % 1024 === 0 ? 1024 : 1000))}K`);
const money = n => n.toFixed(n < 0.01 ? 4 : 2).replace(/\.?0+$/, '') || '0';
const fmtPrice = m => (m.free ? t('free') : m.pricing.promptPerM == null ? t('na') : `$${money(m.pricing.promptPerM)} / $${money(m.pricing.completionPerM ?? 0)}`);
const providerStatus = id => state.providers.find(p => p.id === id)?.status;
const isReady = m => m.routes.some(r => providerStatus(r.provider) === 'ready');

// ---------- data ----------
async function api(path, opts) {
  const res = await fetch(path, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error?.message || t('e_generic')), { code: body.error?.code });
  return body;
}
async function loadAll() {
  const [data, providers, cfg] = await Promise.all([api('/api/models'), api('/api/providers'), api('/api/config')]);
  Object.assign(state, { data, providers, cfg });
}

// ---------- router ----------
const routes = { '': viewCatalog, chat: viewChat, compare: viewCompare };
function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.dataset.nav === (name || 'catalog')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  state.chat.busy?.abort(); state.chat.busy = null; // a stream must not outlive the view that shows it
  if (name === 'chat' && arg) {
    const id = decodeURIComponent(arg), same = state.chat.modelId === id;
    state.chat = { ...state.chat, modelId: id, provider: '', messages: same ? state.chat.messages : [] };
  }
  (routes[name] || viewCatalog)($('#main'));
}

// ---------- catalog ----------
const pinned = () => new Set(state.data.families.filter(x => x.order < 100).map(x => x.id));
function filtered() {
  const f = state.filters, q = f.q.trim().toLowerCase();
  let list = state.data.models.filter(m =>
    (f.family === 'all' || (f.family === 'other' ? !pinned().has(m.family) : m.family === f.family)) &&
    (!q || `${m.name} ${m.id} ${m.familyLabel} ${m.org} ${m.license || ''}`.toLowerCase().includes(q)) &&
    [...f.caps].every(c => (c === 'free' ? m.free : c === 'local' ? m.local : m.capabilities[c])) &&
    (!f.ready || isReady(m)));
  const key = { new: m => -(m.created || 0), ctx: m => -(m.contextLength || 0), price: m => (m.free ? -1 : m.pricing.promptPerM ?? 1e9), size: m => -(m.paramsB || 0) }[f.sort];
  return list.sort((a, b) => key(a) - key(b));
}

function cardHtml(m) {
  const caps = Object.entries(m.capabilities).filter(([, v]) => v).map(([k]) => `<span class="badge">${esc(t('f_' + k) !== 'f_' + k ? t('f_' + k) : k)}</span>`).join('');
  const inCmp = state.compare.includes(m.id);
  return `<article class="card">
    <header><span class="fam">${esc(m.familyLabel)}</span>${m.local ? `<span class="badge ok">${esc(t('local_badge'))}</span>` : ''}${m.free && !m.local ? `<span class="badge ok">${esc(t('free'))}</span>` : ''}${caps}</header>
    <h3>${esc(m.name)}</h3><code>${esc(m.id)}</code>
    ${m.description ? `<p dir="auto">${esc(m.description)}</p>` : ''}
    <dl class="spec">
      <div><dt>${esc(t('params'))}</dt><dd><bdi dir="ltr">${esc(fmtParams(m))}</bdi></dd></div><div><dt>${esc(t('context'))}</dt><dd><bdi dir="ltr">${esc(fmtCtx(m.contextLength))}</bdi></dd></div>
      <div><dt>${esc(t('price'))}</dt><dd><bdi dir="ltr">${esc(fmtPrice(m))}</bdi></dd></div><div><dt>${esc(t('license'))}</dt><dd><bdi dir="ltr">${esc(m.license || t('na'))}</bdi></dd></div>
    </dl>
    <footer><button class="primary" data-chat="${esc(m.id)}">${esc(t('chat'))}</button>
      <button data-cmp="${esc(m.id)}" aria-pressed="${inCmp}">${esc(inCmp ? t('in_compare') : t('add_compare'))}</button>
      ${m.hfUrl ? `<a href="${esc(m.hfUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('hf'))} ↗</a>` : ''}</footer>
  </article>`;
}

function viewCatalog(main) {
  const d = state.data, f = state.filters;
  main.innerHTML = `<h1>${esc(t('hero'))}</h1><p class="sub">${esc(t('hero_sub'))}</p>
    <ul class="stats"><li>${esc(t('models_n', d.models.length))}</li><li>${esc(d.source === 'live' ? t('src_live') : t('src_snapshot'))}${d.updatedAt ? ` · ${esc(new Date(d.updatedAt).toLocaleDateString(state.lang === 'he' ? 'he-IL' : 'en-GB'))}` : ''}</li>
      ${state.providers.filter(p => p.status === 'ready').map(p => `<li class="ok">${esc(p.name)} ✓</li>`).join('')}
      ${state.providers.some(p => p.status !== 'ready') ? `<li>${esc(t('providers_missing', state.providers.filter(p => p.status !== 'ready').length))}</li>` : ''}</ul>
    <div class="bar"><input type="search" id="q" value="${esc(f.q)}" placeholder="${esc(t('search'))}" aria-label="${esc(t('search'))}">
      <label class="check">${esc(t('sort'))} <select id="sort">${['new', 'ctx', 'price', 'size'].map(s => `<option value="${s}" ${f.sort === s ? 'selected' : ''}>${esc(t('sort_' + s))}</option>`).join('')}</select></label>
      <button class="ghost" id="refresh" type="button">${esc(t('refresh'))}</button></div>
    <div class="chips" role="group" aria-label="Family"><button class="chip" data-fam="all" aria-pressed="${f.family === 'all'}">${esc(t('all'))}<small>${d.models.length}</small></button>
      ${d.families.filter(x => x.order < 100).map(x => `<button class="chip" data-fam="${esc(x.id)}" aria-pressed="${f.family === x.id}">${esc(x.label)}<small>${x.count}</small></button>`).join('')}
      <button class="chip" data-fam="other" aria-pressed="${f.family === 'other'}">${esc(t('other'))}<small>${d.models.filter(m => !pinned().has(m.family)).length}</small></button></div>
    <div class="bar">${['reasoning', 'tools', 'vision', 'free', 'local'].map(c => `<label class="check"><input type="checkbox" data-cap="${c}" ${f.caps.has(c) ? 'checked' : ''}> ${esc(t('f_' + c))}</label>`).join('')}
      <label class="check"><input type="checkbox" id="ready" ${f.ready ? 'checked' : ''}> ${esc(t('f_ready'))}</label></div>
    <div id="grid" class="grid"></div><div id="dock"></div>`;
  const paint = () => {
    const list = filtered();
    $('#grid').innerHTML = list.length ? list.slice(0, state.shown).map(cardHtml).join('') : `<p class="empty">${esc(t('no_results'))}</p>`;
    const more = $('#more'); if (more) more.remove();
    if (list.length > state.shown) $('#grid').insertAdjacentHTML('afterend', `<button id="more" class="more">${esc(t('show_more'))} (${list.length - state.shown})</button>`);
    const n = state.compare.length;
    $('#dock').innerHTML = n ? `<div class="dock"><span>${esc(t('compare_dock', n))}</span><button class="primary" data-go="compare">${esc(t('go_compare'))}</button><button data-clear>${esc(t('clear'))}</button></div>` : '';
  };
  paint();
  main.oninput = e => { if (e.target.id === 'q') { f.q = e.target.value; state.shown = 60; paint(); } };
  main.onchange = e => {
    const el = e.target;
    if (el.id === 'sort') f.sort = el.value;
    else if (el.id === 'ready') f.ready = el.checked;
    else if (el.dataset.cap) el.checked ? f.caps.add(el.dataset.cap) : f.caps.delete(el.dataset.cap);
    else return;
    state.shown = 60; paint();
  };
  main.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.fam) { f.family = b.dataset.fam; state.shown = 60; viewCatalog(main); }
    else if (b.dataset.chat) location.hash = `#/chat/${encodeURIComponent(b.dataset.chat)}`;
    else if (b.dataset.cmp) {
      const id = b.dataset.cmp, i = state.compare.indexOf(id);
      if (i >= 0) state.compare.splice(i, 1); else if (state.compare.length < 4) state.compare.push(id); else return toast(t('cmp_sub'));
      paint();
    } else if (b.dataset.go) location.hash = '#/compare';
    else if ('clear' in b.dataset) { state.compare = []; paint(); }
    else if (b.id === 'more') { state.shown += 60; paint(); }
    else if (b.id === 'refresh') {
      b.disabled = true;
      try { await api('/api/refresh', { method: 'POST', headers: authHeaders() }); await loadAll(); toast(t('e_refreshed')); viewCatalog(main); }
      catch (err) { toast(err.message); b.disabled = false; }
    }
  };
}

// ---------- streaming client ----------
function authHeaders(provider) {
  const h = { 'content-type': 'application/json' };
  const code = session.get('omh.code'); if (code) h['x-access-code'] = code;
  const key = provider && keys()[provider]; if (key) h['x-provider-key'] = key;
  return h;
}
function pickProvider(m, preferred) {
  const usable = r => providerStatus(r.provider) === 'ready' || (keys()[r.provider] && providerStatus(r.provider) !== 'unreachable');
  return (preferred && m.routes.find(r => r.provider === preferred && usable(r)) || m.routes.find(usable))?.provider || '';
}

async function streamChat({ modelId, provider, messages, params }, on, signal) {
  const m = byId(modelId);
  const chosen = pickProvider(m, provider);
  if (!chosen) throw Object.assign(new Error(t('e_no_key')), { code: 'no_key' });
  const res = await fetch('/api/chat', { method: 'POST', headers: authHeaders(chosen), body: JSON.stringify({ model: modelId, provider: chosen, messages, params }), signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error?.code === 'access_code' ? t('e_access') : body.error?.message || t('e_generic')), { code: body.error?.code });
  }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
      if (line.startsWith('data:')) { try { on(JSON.parse(line.slice(5))); } catch {} }
    }
  }
}

const renderMd = text => text.split('```').map((p, i) => i % 2
  ? `<pre dir="ltr"><code>${esc(p.replace(/^[\w+#.-]*\n/, ''))}</code></pre>`
  : esc(p).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')).join('');

function msgEl(who, cls) {
  const el = document.createElement('div');
  el.className = `msg ${cls}`;
  el.innerHTML = `<div class="who">${esc(who)}</div><details class="reasoning" hidden><summary>${esc(t('thinking'))}</summary><pre dir="auto"></pre></details><div class="body" dir="auto"></div><div class="meta"></div>`;
  return el;
}

// Streams one assistant turn into `el`; returns {text, stats}.
async function runInto(el, req, signal) {
  const body = $('.body', el), think = $('.reasoning', el), meta = $('.meta', el);
  let text = '', reasoning = '', usage = null, via = '';
  const t0 = performance.now(); let ttft = null, queued = false;
  const paint = () => { queued = false; body.innerHTML = renderMd(text); $('pre', think).textContent = reasoning; think.hidden = !reasoning; };
  try {
    await streamChat(req, ev => {
      if (ev.type === 'start') via = ev.providerName;
      else if (ev.type === 'delta' || ev.type === 'reasoning') {
        if (ttft === null) ttft = performance.now() - t0;
        ev.type === 'delta' ? (text += ev.text) : (reasoning += ev.text);
        if (!queued) { queued = true; requestAnimationFrame(paint); }
      } else if (ev.type === 'usage') usage = ev.usage;
      else if (ev.type === 'error') throw new Error(ev.message);
    }, signal);
  } catch (e) {
    if (e.name !== 'AbortError') { body.insertAdjacentHTML('beforeend', `<div class="err">${esc(e.message)}</div>`); if (e.code === 'access_code' || e.code === 'no_key' || e.code === 'no_provider_key') openSettings(); }
  }
  paint();
  const total = performance.now() - t0, out = usage?.completion ?? Math.round(text.length / 4);
  meta.textContent = [via && `${t('via')} ${via}`, ttft !== null && `${t('ttft')}: ${(ttft / 1000).toFixed(2)}s`, `${t('total')}: ${(total / 1000).toFixed(1)}s`, out && `${usage?.completion ? '' : '~'}${out} ${t('tokens')}`].filter(Boolean).join(' · ');
  return text;
}

// ---------- model picker ----------
function modelOptions(selected, { empty } = {}) {
  const groups = new Map();
  for (const m of state.data.models) (groups.get(m.familyLabel) || groups.set(m.familyLabel, []).get(m.familyLabel)).push(m);
  const order = state.data.families.map(f => f.label);
  return (empty ? `<option value="">${esc(empty)}</option>` : '') + [...groups].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
    .map(([label, ms]) => `<optgroup label="${esc(label)}">${ms.map(m => `<option value="${esc(m.id)}" ${m.id === selected ? 'selected' : ''}>${esc(m.name)}${m.local ? ' ·' + esc(t('local_badge')) : ''}</option>`).join('')}</optgroup>`).join('');
}

// ---------- chat ----------
function viewChat(main) {
  const c = state.chat;
  if (!byId(c.modelId)) c.modelId = (state.data.models.find(isReady) || state.data.models[0])?.id || '';
  const m = byId(c.modelId);
  main.innerHTML = `<div class="layout"><aside class="panel">
      <label class="field">${esc(t('model'))}<select id="model">${modelOptions(c.modelId)}</select></label>
      <label class="field">${esc(t('provider'))}<select id="prov">${(m?.routes || []).map(r => `<option value="${esc(r.provider)}" ${r.provider === (c.provider || pickProvider(m, '')) ? 'selected' : ''}>${esc(state.providers.find(p => p.id === r.provider)?.name || r.provider)} · ${esc(t('st_' + (providerStatus(r.provider) || 'needs_key')))}</option>`).join('')}</select></label>
      <label class="field">${esc(t('system'))}<textarea id="sys" rows="3" dir="auto" placeholder="${esc(t('system_ph'))}">${esc(c.system || '')}</textarea></label>
      <label class="field">${esc(t('temperature'))}: <output id="tv">${c.temperature ?? 0.7}</output><input id="temp" type="range" min="0" max="2" step="0.1" value="${c.temperature ?? 0.7}"></label>
      <label class="field">${esc(t('max_tokens'))}<input id="max" type="number" min="1" max="8192" value="${c.maxTokens ?? 2048}"></label>
      <button id="new" type="button">${esc(t('new_chat'))}</button><p class="note">${esc(t('open_weights'))}</p></aside>
    <section><div id="log" role="log" aria-label="${esc(t('nav_chat'))}"></div>
      <form class="composer" id="composer"><textarea id="input" rows="2" dir="auto" placeholder="${esc(t('msg_ph'))}" aria-label="${esc(t('msg_ph'))}"></textarea><button class="primary" id="send">${esc(t('send'))}</button></form></section></div>`;
  const log = $('#log');
  for (const msg of c.messages) { const el = msgEl(msg.role === 'user' ? t('you') : m?.name, msg.role); $('.body', el).innerHTML = renderMd(msg.content); log.append(el); }
  const sync = () => { c.system = $('#sys').value; c.temperature = +$('#temp').value; c.maxTokens = +$('#max').value || 2048; c.provider = $('#prov').value; };
  $('#temp').oninput = e => ($('#tv').textContent = e.target.value);
  $('#model').onchange = e => { location.hash = `#/chat/${encodeURIComponent(e.target.value)}`; };
  $('#new').onclick = () => { c.messages = []; viewChat(main); };
  const send = async () => {
    if (c.busy) return c.busy.abort();
    const input = $('#input'), text = input.value.trim(); if (!text) return;
    sync(); input.value = '';
    c.messages.push({ role: 'user', content: text });
    const u = msgEl(t('you'), 'user'); $('.body', u).textContent = text; log.append(u);
    const a = msgEl(m.name, 'assistant'); log.append(a); a.scrollIntoView({ block: 'nearest' });
    c.busy = new AbortController(); $('#send').textContent = t('stop');
    const history = [...(c.system ? [{ role: 'system', content: c.system }] : []), ...c.messages];
    const reply = await runInto(a, { modelId: c.modelId, provider: c.provider, messages: history, params: { temperature: c.temperature, max_tokens: c.maxTokens } }, c.busy.signal);
    if (reply) c.messages.push({ role: 'assistant', content: reply }); else c.messages.pop(); // drop the unanswered prompt
    c.busy = null; if ($('#send')) $('#send').textContent = t('send');
  };
  $('#composer').onsubmit = e => { e.preventDefault(); send(); };
  $('#input').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } };
  $('#input').focus();
}

// ---------- compare ----------
function viewCompare(main) {
  const slots = [0, 1, 2, 3].map(i => state.compare[i] || '');
  main.innerHTML = `<h1>${esc(t('cmp_title'))}</h1><p class="sub">${esc(t('cmp_sub'))}</p>
    <div class="slots">${slots.map((id, i) => `<label class="field">${esc(t('cmp_slot', i + 1))}<select data-slot="${i}">${modelOptions(id, { empty: t('cmp_none') })}</select></label>`).join('')}</div>
    <form id="cmp"><textarea id="prompt" rows="3" dir="auto" placeholder="${esc(t('cmp_ph'))}" aria-label="${esc(t('cmp_ph'))}"></textarea>
    <div class="actions"><button class="primary" id="run">${esc(t('run'))}</button></div></form><div class="cols" id="cols"></div>`;
  let ctl = null;
  $('#cmp').onsubmit = async e => {
    e.preventDefault();
    if (ctl) return ctl.abort();
    const prompt = $('#prompt').value.trim();
    const ids = [...document.querySelectorAll('[data-slot]')].map(s => s.value).filter(Boolean);
    state.compare = ids;
    if (!prompt || !ids.length) return;
    ctl = new AbortController(); $('#run').textContent = t('stop');
    const cols = $('#cols'); cols.innerHTML = '';
    await Promise.all(ids.map(id => {
      const el = msgEl(byId(id).name, 'assistant'); cols.append(el);
      return runInto(el, { modelId: id, provider: '', messages: [{ role: 'user', content: prompt }], params: { max_tokens: 1500 } }, ctl.signal);
    }));
    ctl = null; if ($('#run')) $('#run').textContent = t('run');
  };
}

// ---------- settings ----------
function openSettings() {
  const dlg = $('#settings'), saved = keys();
  dlg.innerHTML = `<form method="dialog"><h2>${esc(t('settings'))}</h2>
    ${state.cfg.accessRequired ? `<label class="field">${esc(t('access_code'))}<input id="code" type="password" autocomplete="off" value="${esc(session.get('omh.code'))}"><span class="note">${esc(t('access_hint'))}</span></label>` : ''}
    <h2>${esc(t('keys'))}</h2>
    ${state.providers.filter(p => p.kind === 'cloud').map(p => `<div class="prov"><strong>${esc(p.name)} <span class="badge ${p.status === 'ready' ? 'ok' : 'warn'}">${esc(t('st_' + p.status))}</span></strong>${p.keyUrl ? `<a href="${esc(p.keyUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('get_key'))} ↗</a>` : '<span></span>'}<input type="password" autocomplete="off" data-key="${esc(p.id)}" value="${esc(saved[p.id] || '')}" aria-label="${esc(p.name)} API key" placeholder="sk-…"></div>`).join('')}
    <p class="note">${esc(t('keys_note'))}</p>
    <div class="actions"><button value="cancel">${esc(t('close'))}</button><button class="primary" value="save" id="save-settings">${esc(t('save'))}</button></div></form>`;
  $('#save-settings').onclick = () => {
    const next = {};
    dlg.querySelectorAll('[data-key]').forEach(i => { if (i.value.trim()) next[i.dataset.key] = i.value.trim(); });
    store.set('omh.keys', next);
    if ($('#code')) session.set('omh.code', $('#code').value);
    toast(t('saved'));
  };
  if (!dlg.open) dlg.showModal();
}

// ---------- boot ----------
$('#btn-settings').onclick = openSettings;
$('#btn-lang').onclick = () => { state.lang = state.lang === 'he' ? 'en' : 'he'; store.set('omh.lang', state.lang); applyChrome(); route(); };
$('#btn-theme').onclick = () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; store.set('omh.theme', state.theme); applyChrome(); };
window.addEventListener('hashchange', route);
applyChrome();
loadAll().then(route).catch(e => { $('#main').innerHTML = `<p class="empty err">${esc(e.message)}</p>`; });
