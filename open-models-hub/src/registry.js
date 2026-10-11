import fs from 'node:fs';
import { familyOf, authorOf } from './families.js';
import { listProviderModels } from './providers.js';

export const CATALOG_URL = 'https://openrouter.ai/api/v1/models';
const HF_API = 'https://huggingface.co/api/models/';

const num = v => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const perMillion = v => { const n = num(v); return n === null ? null : Math.round(n * 1e6 * 1e4) / 1e4; };

// "qwen3.6-35b-a3b" -> { total: 35, active: 3 }; used only when Hugging Face has no tensor count.
export function paramsFromName(name) {
  const s = String(name || '');
  const total = s.match(/(?<![a-z\d.])(\d+(?:\.\d+)?)([bt])(?![a-z])/i);
  const active = s.match(/[-_]a(\d+(?:\.\d+)?)b(?![a-z])/i);
  return {
    total: total ? Number(total[1]) * (total[2].toLowerCase() === 't' ? 1000 : 1) : null,
    active: active ? Number(active[1]) : null
  };
}

export function isOpenChatModel(raw, nowMs = Date.now()) {
  if (!raw?.id || !raw.hugging_face_id) return false; // a Hugging Face repo id is what marks open weights
  if (raw.id.endsWith(':batch')) return false;
  if (!(raw.architecture?.output_modalities || ['text']).includes('text')) return false;
  if (raw.expiration_date && Date.parse(raw.expiration_date) < nowMs) return false;
  return true;
}

export function normalizeModel(raw, hf = {}) {
  const family = familyOf(raw.id);
  const input = raw.architecture?.input_modalities || ['text'];
  const sp = raw.supported_parameters || [];
  const fromName = paramsFromName(raw.hugging_face_id || raw.id);
  const promptPerM = perMillion(raw.pricing?.prompt);
  const completionPerM = perMillion(raw.pricing?.completion);
  return {
    id: raw.id,
    name: String(raw.name || raw.id).replace(/^[^:]{1,40}:\s*/, ''),
    family: family.id,
    familyLabel: family.label,
    org: family.org,
    hfId: raw.hugging_face_id,
    hfUrl: `https://huggingface.co/${raw.hugging_face_id}`,
    description: String(raw.description || '').replace(/\s+/g, ' ').slice(0, 320),
    created: num(raw.created),
    contextLength: num(raw.context_length) || num(raw.top_provider?.context_length),
    maxOutput: num(raw.top_provider?.max_completion_tokens),
    input,
    capabilities: {
      reasoning: sp.includes('reasoning') || sp.includes('include_reasoning') || Boolean(raw.reasoning),
      tools: sp.includes('tools'),
      json: sp.includes('response_format') || sp.includes('structured_outputs'),
      vision: input.includes('image'),
      audio: input.includes('audio'),
      video: input.includes('video')
    },
    pricing: { promptPerM, completionPerM },
    free: raw.id.endsWith(':free') || (promptPerM === 0 && completionPerM === 0),
    paramsB: hf.paramsB ?? fromName.total,
    activeB: fromName.active,
    license: hf.license ?? null
  };
}

async function pool(items, concurrency, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    for (let item; (item = queue.shift()) !== undefined;) await fn(item);
  }));
}

export function createRegistry({ providers = [], fetchImpl = fetch, snapshotPath, now = Date.now, log = () => {} } = {}) {
  let base = new Map();
  let hf = {};
  const catalogs = new Map(); // provider id -> { ok, error, at, models }
  const meta = { source: 'empty', updatedAt: null, lastError: null };
  let cache = null;

  if (snapshotPath) {
    try {
      const snap = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
      base = new Map(snap.models.map(m => [m.id, m]));
      hf = snap.hf || {};
      Object.assign(meta, { source: 'snapshot', updatedAt: snap.generatedAt });
    } catch {}
  }

  async function enrich(hfIds, { limit = Infinity } = {}) {
    const todo = [...new Set(hfIds)].filter(id => !(id in hf)).slice(0, limit);
    await pool(todo, 6, async id => {
      try {
        const res = await fetchImpl(HF_API + id.split('/').map(encodeURIComponent).join('/'), { signal: AbortSignal.timeout(10000) });
        if (res.status === 404 || res.status === 401 || res.status === 403) { hf[id] = { license: null, paramsB: null }; return; }
        if (!res.ok) return; // transient: try again on the next refresh
        const j = await res.json();
        const tag = (j.tags || []).find(t => t.startsWith('license:'));
        const total = j.safetensors?.total;
        hf[id] = { license: j.cardData?.license || (tag && tag.slice(8)) || null, paramsB: total ? Math.round(total / 1e8) / 10 : null };
      } catch {}
    });
  }

  async function refresh({ enrichAll = false } = {}) {
    try {
      const res = await fetchImpl(CATALOG_URL, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`catalog_http_${res.status}`);
      const rows = ((await res.json()).data || []).filter(r => isOpenChatModel(r, now()));
      await enrich(rows.map(r => r.hugging_face_id), { limit: enrichAll ? Infinity : 30 });
      base = new Map(rows.map(r => [r.id, normalizeModel(r, hf[r.hugging_face_id])]));
      Object.assign(meta, { source: 'live', updatedAt: new Date(now()).toISOString(), lastError: null });
      cache = null;
    } catch (e) {
      meta.lastError = String(e?.message || e).slice(0, 200);
      log(`catalog refresh failed, keeping ${meta.source} data: ${meta.lastError}`);
    }
    await refreshProviders();
    return status();
  }

  async function refreshProviders() {
    await Promise.all(providers.filter(p => p.id !== 'openrouter' && (p.hasKey || p.keyless)).map(async p => {
      try {
        catalogs.set(p.id, { ok: true, at: now(), models: await listProviderModels(p, { fetchImpl }) });
      } catch (e) {
        catalogs.set(p.id, { ok: false, at: now(), error: String(e?.message || e).slice(0, 200), models: [] });
      }
    }));
    cache = null;
  }

  function build() {
    const byKey = new Map();
    const models = new Map();
    const sorted = [...base.values()].sort((a, b) => Number(a.free) - Number(b.free));
    for (const m of sorted) {
      models.set(m.id, { ...m, local: false, routes: [{ provider: 'openrouter', modelId: m.id }] });
      for (const k of [m.id.toLowerCase(), m.hfId.toLowerCase()]) if (!byKey.has(k)) byKey.set(k, m.id);
    }
    for (const [providerId, cat] of catalogs) {
      const p = providers.find(x => x.id === providerId);
      for (const pm of cat.models) {
        const hit = byKey.get(pm.id.toLowerCase());
        if (hit) {
          const routes = models.get(hit).routes;
          if (!routes.some(r => r.provider === providerId)) routes.push({ provider: providerId, modelId: pm.id });
          continue;
        }
        const id = `${providerId}:${pm.id}`;
        const fam = familyOf(pm.id);
        models.set(id, {
          id, name: pm.id.includes('/') ? pm.id.split('/').pop() : pm.id,
          family: fam.id, familyLabel: fam.label, org: fam.org, hfId: null, hfUrl: null, description: '',
          created: null, contextLength: pm.context, maxOutput: null, input: ['text'],
          capabilities: { reasoning: false, tools: false, json: false, vision: false, audio: false, video: false },
          pricing: { promptPerM: null, completionPerM: null }, free: p?.kind === 'local',
          paramsB: paramsFromName(pm.id).total, activeB: paramsFromName(pm.id).active, license: null,
          local: p?.kind === 'local', providerOnly: true, routes: [{ provider: providerId, modelId: pm.id }]
        });
      }
    }
    const list = [...models.values()].sort((a, b) => (b.created || 0) - (a.created || 0) || a.name.localeCompare(b.name));
    const fams = new Map();
    for (const m of list) {
      const f = fams.get(m.family) || { id: m.family, label: m.familyLabel, org: m.org, order: familyOf(m.family + '/x').order, count: 0 };
      f.count++;
      fams.set(m.family, f);
    }
    return { list, byId: new Map(list.map(m => [m.id, m])), families: [...fams.values()].sort((a, b) => a.order - b.order || b.count - a.count) };
  }

  const view = () => (cache ||= build());
  function status() {
    return { ...meta, count: view().list.length, providers: Object.fromEntries([...catalogs].map(([id, c]) => [id, { ok: c.ok, error: c.error || null, models: c.models.length }])) };
  }

  return {
    refresh, refreshProviders, status,
    list: () => view().list,
    families: () => view().families,
    get: id => view().byId.get(id),
    providerCatalog: id => catalogs.get(id),
    exportSnapshot: () => ({ generatedAt: meta.updatedAt || new Date(now()).toISOString(), source: 'openrouter+huggingface', hf, models: [...base.values()] }),
    authorOf
  };
}
