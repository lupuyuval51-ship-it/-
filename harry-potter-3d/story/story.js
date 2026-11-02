/* Eldermoor: The Ninth Lantern — STORY module (chapters, dialogue, quests, boss).
 * Owner: STORY. Contract: story/ARCHITECTURE.md §6.
 * Classic script, one IIFE. Registers ELD.story; does no heavy work at load time.
 * All characters, places, dialogue and verse in this file are original. */
(function () {
  'use strict';
  const ELD = window.ELD = window.ELD || {};
  const PI = Math.PI;

  // =====================================================================
  // 0. TEXT HELPERS
  // =====================================================================
  // T(he, en)      neutral bilingual text
  // G(m, f, en)    Hebrew gendered by the PLAYER's gender (m = addressing a male player)
  // L(who, text, choices?)  dialogue line; who = char id | 'player' | null (narrator)
  // C(text, value) dialogue choice
  function T(he, en) { return { he: he, en: en }; }
  function G(m, f, en) { return { he: { m: m, f: f }, en: en }; }
  function L(who, text, choices) { const o = { who: who, text: text }; if (choices) o.choices = choices; return o; }
  function C(text, value) { return { text: text, value: value }; }
  const N = null; // narrator

  function noop() {}
  function warn() { try { console.warn.apply(console, ['[ELD story]'].concat(Array.prototype.slice.call(arguments))); } catch (e) { /* ignore */ } }
  function clone(o) { try { return JSON.parse(JSON.stringify(o || {})); } catch (e) { return {}; } }
  function tx(o) { try { return ELD.tx ? ELD.tx(o) : (o && o.en) || ''; } catch (e) { return ''; } }
  function ui(name) {
    const u = ELD.ui;
    if (!u || typeof u[name] !== 'function') return undefined;
    try { return u[name].apply(u, Array.prototype.slice.call(arguments, 1)); } catch (e) { warn('ui.' + name + ' failed', e); return undefined; }
  }
  function sfx(name) { try { if (ELD.audio && ELD.audio.play) ELD.audio.play(name); } catch (e) { /* ignore */ } }
  function areaApi(name) {
    const a = ELD.area && ELD.area.api;
    if (!a || typeof a[name] !== 'function') return undefined;
    try { return a[name].apply(a, Array.prototype.slice.call(arguments, 1)); } catch (e) { warn('area api ' + name + ' failed', e); return undefined; }
  }
  function anchor(name) { try { return ELD.getAnchor ? ELD.getAnchor(name) : null; } catch (e) { return null; } }
  function player() { return ELD.player || null; }
  // true when a player (radius 0.4) could stand at x,z in the current area
  function freeSpot(x, z) {
    const a = ELD.area;
    if (!a) return false;
    const b = a.bounds, r = 0.4;
    if (b && (x < b.minX + r || x > b.maxX - r || z < b.minZ + r || z > b.maxZ - r)) return false;
    const cs = a.colliders || [];
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i];
      if (x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r) return false;
    }
    return true;
  }
  // An elevated speaker (Pebble on his 4 m pillar) is hidden by his own perch when the player stands at its
  // foot. Returns the spot a few steps back from which the whole figure is in view, or null if not needed.
  function perchSpot(o) {
    const P = player();
    if (!P || !o || o.y < 1.2) return null;
    const dx = P.pos.x - o.x, dz = P.pos.z - o.z, d = Math.hypot(dx, dz);
    const want = 2.2 + o.y * 0.6;
    if (d > want - 0.3) return null;
    const ux = d > 0.05 ? dx / d : 0, uz = d > 0.05 ? dz / d : 1;
    const x = o.x + ux * want, z = o.z + uz * want;
    return freeSpot(x, z) ? { x: x, z: z } : null;
  }
  // smooth player move driven by 'tick'; calls done() at the end (also used outside a run token)
  function glidePlayer(tx, tz, dur, done) {
    const P = player();
    if (!P || !P.pos) { if (done) done(); return function () {}; }
    const sx = P.pos.x, sz = P.pos.z;
    let k = 0;
    const fn = function (dt) {
      k = Math.min(1, k + dt / (dur || 0.45));
      const e = k * k * (3 - 2 * k);
      P.pos.x = sx + (tx - sx) * e; P.pos.z = sz + (tz - sz) * e;
      if (k >= 1) { off(); if (done) done(); }
    };
    const off = function () { const j = R.tickFns.indexOf(fn); if (j >= 0) R.tickFns.splice(j, 1); };
    R.tickFns.push(fn);
    return off;
  }
  function setFrozen(v) { const p = player(); if (p) { try { p.frozen = !!v; } catch (e) { /* ignore */ } } }

  // =====================================================================
  // 1. SHARED TEXT
  // =====================================================================
  const TXT = {
    down: T('האופל הכריע אותך... אבל האור עוד לא כבה. נסו שוב.', "The Gloom overwhelmed you… but the light isn't out yet. Try again."),
    shardGot: T('רסיס של הפנס התשיעי נאסף!', 'A shard of the Ninth Lantern recovered!'),
    exitCombat: T('אי אפשר לברוח עכשיו — הצללים!', "You can't run now — the shades!"),
    exitDefault: T('עוד לא. יש לך משהו לעשות כאן.', "Not yet. There's something you need to do here."),
    morrowName: T('סֵלָה מורו', 'Sela Morrow')
  };

  function talkLabel(who) {
    let he = '', en = '';
    try {
      const info = ELD.chars && ELD.chars.info ? ELD.chars.info(who) : null;
      if (info && info.name) {
        he = typeof info.name.he === 'string' ? info.name.he : tx(info.name);
        en = typeof info.name.en === 'string' ? info.name.en : tx(info.name);
      }
    } catch (e) { /* ignore */ }
    if (!he) he = who; if (!en) en = who;
    return T('לדבר עם ' + he, 'Talk to ' + en);
  }

  // =====================================================================
  // 2. DOORS, ROUTES, LOCK REASONS
  // =====================================================================
  const DOORS = {
    'grounds.castleDoor': 'entrance',
    'entrance.toGrounds': 'grounds',
    'entrance.toGreatHall': 'greathall',
    'entrance.toClassroom': 'classroom',
    'entrance.toLibrary': 'library',
    'entrance.toTower': 'tower',
    'entrance.toCrypt': 'crypt',
    'greathall.toEntrance': 'entrance',
    'classroom.toEntrance': 'entrance',
    'library.toEntrance': 'entrance',
    'tower.toEntrance': 'entrance',
    'crypt.toEntrance': 'entrance'
  };
  const LOCK_MSG = {
    'grounds.castleDoor': T('הדלתות הגדולות סגורות. אולי הגרגויל שעל השער יודע משהו.', 'The great doors are shut tight. Maybe the gargoyle on the gate knows something.'),
    'entrance.toGrounds': T('בחוץ חשוך וקר. לא עכשיו.', "It's dark and cold out there. Not now."),
    'entrance.toGreatHall': T('דלתות האולם הגדול סגורות. מבפנים נשמע צלצול של צלחות.', 'The Great Hall doors are closed. You can hear plates clinking inside.'),
    'entrance.toClassroom': T('כיתת הלחשים נעולה. פתק על הדלת: ״השיעורים מתחילים בבוקר. בדיוק בזמן.״', 'The Charms classroom is locked. A note on the door: “Lessons begin in the morning. Precisely on time.”'),
    'entrance.toLibrary': T('שלט על דלת הספרייה: ״שקט. סגור. ושוב — שקט.״', 'A sign on the library door: “Silence. Closed. And again — silence.”'),
    'entrance.toTower': T('חבל קטיפה חוסם את המדרגות לחדר המועדון. עוד לא הזמן.', 'A velvet rope blocks the stairs to the common room. Not yet.'),
    'entrance.toCrypt': T('דלת ברזל כבדה, נעולה היטב. מתחתיה נושב משהו קר.', 'A heavy iron trapdoor, locked tight. Something cold breathes beneath it.')
  };
  // route table: from area -> to area -> door id ('_' = any other)
  const ROUTE = {
    grounds: { _: 'grounds.castleDoor' },
    entrance: {
      grounds: 'entrance.toGrounds', greathall: 'entrance.toGreatHall', classroom: 'entrance.toClassroom',
      library: 'entrance.toLibrary', tower: 'entrance.toTower', crypt: 'entrance.toCrypt'
    },
    greathall: { _: 'greathall.toEntrance' },
    classroom: { _: 'classroom.toEntrance' },
    library: { _: 'library.toEntrance' },
    tower: { _: 'tower.toEntrance' },
    crypt: { _: 'crypt.toEntrance' }
  };
  function routeDoor(from, to) {
    if (!from || !to || from === to) return null;
    const r = ROUTE[from];
    if (!r) return null;
    return r[to] || r._ || null;
  }

  // =====================================================================
  // 3. RUNTIME STATE
  // =====================================================================
  const ABORT = { eldAbort: true };
  const R = {
    chapter: 0, step: 0, flags: {}, snap: null, tok: null, gen: 0,
    active: false, completed: false, recovering: false,
    objective: null, goal: null,
    pendingTalk: {}, hints: {},
    ias: [], props: [], cast: [], castArea: null, castSig: '',
    tickFns: [], timers: [], ambIdx: {}, sparks: []
  };

  function normFlags(f) {
    f = (f && typeof f === 'object') ? f : {};
    if (!f.visited || typeof f.visited !== 'object') f.visited = {};
    if (!f.opened || typeof f.opened !== 'object') f.opened = {};
    if (!f.spells || typeof f.spells !== 'object') f.spells = {};
    if (typeof f.shards !== 'number') f.shards = 0;
    f.visited.grounds = 1;
    return f;
  }

  // Cumulative progress flags at the START of each chapter (used by goto()).
  const PRESETS = [
    {},
    { opened: { 'grounds.castleDoor': 1 }, pebble: 'wings' },
    { visited: { entrance: 1, greathall: 1, tower: 1 }, noaMet: 'friendly', talMet: 'snap', lanternOut: 1, morning: 1 },
    { visited: { classroom: 1 }, opened: { 'entrance.toClassroom': 1, 'entrance.toLibrary': 1 }, spells: { lumos: 1, stupefy: 1, expelliarmus: 1 } },
    { visited: { library: 1 }, shardsShown: 1, shards: 1, shelfOpen: 1 },
    { shards: 2, memory: 'crane', opened: { 'entrance.toCrypt': 1 }, spells: { patronum: 1 } },
    { visited: { crypt: 1 }, shards: 3, ambushDone: 1, gateOpen: 1 },
    { morrowShown: 1, bossDone: 1, mercy: 1, friendsCrypt: 1, relit: 1 }
  ];
  function presetFlags(ch) {
    const f = normFlags({});
    for (let i = 0; i <= ch && i < PRESETS.length; i++) {
      const p = PRESETS[i];
      for (const k in p) {
        if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
        if (p[k] && typeof p[k] === 'object') { f[k] = f[k] || {}; for (const j in p[k]) f[k][j] = p[k][j]; }
        else f[k] = p[k];
      }
    }
    return normFlags(f);
  }

  // =====================================================================
  // 4. RUN TOKENS & WAIT PRIMITIVES
  // =====================================================================
  function newToken() {
    if (R.tok) abortToken(R.tok);
    const tok = { id: ++R.gen, aborted: false, waits: [] };
    R.tok = tok;
    return tok;
  }
  function abortToken(tok) {
    if (!tok || tok.aborted) return;
    tok.aborted = true;
    const ws = tok.waits.slice();
    tok.waits.length = 0;
    for (let i = 0; i < ws.length; i++) ws[i].reject(ABORT);
  }
  // Every wait primitive goes through here: abortable by its token, skippable by skip().
  function tokWait(tok, setup) {
    const p = new Promise(function (resolve, reject) {
      if (!tok || tok.aborted) { reject(ABORT); return; }
      const w = { done: false, cleanup: null, skip: null };
      function finish() {
        w.done = true;
        const i = tok.waits.indexOf(w);
        if (i >= 0) tok.waits.splice(i, 1);
        const c = w.cleanup; w.cleanup = null;
        if (c) { try { c(); } catch (e) { warn('wait cleanup failed', e); } }
      }
      w.resolve = function (v) { if (w.done) return; finish(); resolve(v); };
      w.reject = function (e) { if (w.done) return; finish(); reject(e); };
      tok.waits.push(w);
      try { setup(w); } catch (e) { warn('wait setup failed', e); w.resolve(undefined); }
    });
    p.catch(noop); // mark handled; awaiters still receive the rejection
    return p;
  }

  // game-time timers (advance only while playing, via 'tick')
  function later(tok, ms, fn) {
    const t = { left: ms / 1000, fn: fn, tok: tok };
    R.timers.push(t);
    return t;
  }

  // dialogue flush (used by skip and when a run is aborted mid-dialogue)
  // CONTRACT-NOTE: there is no ui.closeDialogue(); story flushes an open dialogue through the core debug
  // hook ELD.debug.advance() (picks the first choice). Only used on skip/abort.
  function flushDialogue() {
    const d = ELD.debug;
    if (!d || typeof d.advance !== 'function' || !ELD.ui || !ELD.ui.isDialogueOpen) return;
    let n = 0;
    try { while (ELD.ui.isDialogueOpen() && n++ < 80) d.advance(); } catch (e) { /* ignore */ }
  }
  function lastFirstChoice(lines) {
    let v;
    for (let i = 0; i < lines.length; i++) if (lines[i] && lines[i].choices && lines[i].choices.length) v = lines[i].choices[0].value;
    return v;
  }

  // =====================================================================
  // 5. GOAL / MARKER
  // =====================================================================
  function setGoal(g) { R.goal = g || null; refreshMarker(); }
  function refreshMarker() {
    const g = R.goal;
    if (!g || !ELD.area) { ui('setMarker', null); return; }
    const cur = ELD.area.id;
    if (g.area && g.area !== cur) {
      const id = routeDoor(cur, g.area);
      const d = id && ELD.getDoor ? ELD.getDoor(id) : null;
      ui('setMarker', d ? { x: d.x, y: 2.3, z: d.z } : null);
      return;
    }
    if (g.who) {
      const c = findCast(g.who);
      if (c) {
        const o = c.npc.object3D.position;
        const h = (c.npc.height || 1.7);
        ui('setMarker', { x: o.x, y: o.y + h + 0.55, z: o.z });
      } else ui('setMarker', null);
      return;
    }
    if (g.anchor) {
      const a = anchor(g.anchor) || g.fb;
      ui('setMarker', a ? { x: a.x, y: (a.y || 0) + (g.lift === undefined ? 0.8 : g.lift), z: a.z } : null);
      return;
    }
    if (g.pos) { ui('setMarker', { x: g.pos.x, y: g.pos.y === undefined ? 1.5 : g.pos.y, z: g.pos.z }); return; }
    ui('setMarker', null); // area-only goal reached
  }

  // =====================================================================
  // 6. PERSISTENT INTERACTABLES & PROPS (survive leaving/re-entering an area)
  // =====================================================================
  let iaSeq = 0;
  function iaPos(def) {
    if (def.anchor) { const a = anchor(def.anchor) || def.fb; return a ? { x: a.x, y: a.y || 0, z: a.z } : null; }
    return def.pos || null;
  }
  function addIAToCore(def) {
    if (!ELD.addInteractable || !ELD.area || ELD.area.id !== def.area) return;
    const p = iaPos(def);
    if (!p) return;
    ELD.addInteractable({
      id: def.id, pos: p, radius: def.radius || 2.2, label: def.label,
      onInteract: def.onInteract, enabled: def.enabled
    });
  }
  function regIA(def) {
    def.id = def.id || ('story-ia-' + (++iaSeq));
    def.area = def.area || (ELD.area && ELD.area.id);
    R.ias.push(def);
    addIAToCore(def);
    return def;
  }
  function unregIA(def) {
    const i = R.ias.indexOf(def);
    if (i >= 0) R.ias.splice(i, 1);
    try { if (ELD.removeInteractable) ELD.removeInteractable(def.id); } catch (e) { /* ignore */ }
  }

  function makeNpc(id, opts) {
    if (!ELD.chars || typeof ELD.chars.create !== 'function') return null;
    try { const n = ELD.chars.create(id, opts || {}); return (n && n.object3D) ? n : null; } catch (e) { warn('chars.create(' + id + ') failed', e); return null; }
  }
  function disposeNpc(n) {
    if (!n) return;
    try { if (n.object3D && n.object3D.parent) n.object3D.parent.remove(n.object3D); } catch (e) { /* ignore */ }
    try { if (typeof n.dispose === 'function') n.dispose(); } catch (e) { /* ignore */ }
  }
  function addProp(def) {
    def.area = def.area || (ELD.area && ELD.area.id);
    def.npc = null;
    R.props.push(def);
    spawnProp(def);
    return def;
  }
  function spawnProp(def) {
    if (def.npc || !ELD.area || ELD.area.id !== def.area || !ELD.area.group) return;
    const p = iaPos(def);
    if (!p) return;
    const n = makeNpc(def.kind || 'shard');
    if (!n) return;
    n.object3D.position.set(p.x, p.y, p.z);
    ELD.area.group.add(n.object3D);
    def.npc = n;
  }
  function removeProp(def) {
    const i = R.props.indexOf(def);
    if (i >= 0) R.props.splice(i, 1);
    disposeNpc(def.npc); def.npc = null;
  }
  function clearProps() {
    const l = R.props.splice(0, R.props.length);
    for (let i = 0; i < l.length; i++) disposeNpc(l[i].npc);
  }

  // =====================================================================
  // 7. CAST SYSTEM
  // =====================================================================
  function curStep() { const c = CHAPTERS[R.chapter]; return c ? c.steps[R.step] || null : null; }
  function stepId() { const s = curStep(); return s ? s.id : null; }

  function crowd(out, n) {
    for (let i = 1; i <= n; i++) out.push({ who: 'student', anchor: 'seat' + i, decor: true, pose: 'sit', opts: { variant: (i * 5) % 12, pose: 'sit' } });
  }
  // the Great Hall dais collider stops the player ~2.9 m (XZ) short of Orla/Dov: widen their talk radius
  const DAIS_R = 3.6;
  // castFor(areaId) -> NPC placements for the current chapter / step / flags
  function castFor(areaId) {
    const c = R.chapter, s = stepId(), f = R.flags, out = [];
    function add(who, anc, extra) { const o = { who: who, anchor: anc }; if (extra) for (const k in extra) o[k] = extra[k]; out.push(o); }
    switch (areaId) {
      case 'grounds':
        if (c <= 6) add('pebble', 'pebble', { radius: 5.4, fb: { x: -4, y: 4, z: 40, yaw: PI } });
        if (c === 4) {
          add('tal', 'tal_court', { fb: { x: 5, y: 0, z: -6 } });
          if (f.orlaCourt) add('orla', 'orla_court', { fb: { x: 0, y: 0, z: -16 } });
        }
        break;
      case 'entrance':
        if (c === 1 && s === 'noa') add('noa', 'noa_entrance', { fb: { x: -3, y: 0, z: 3 } });
        if (c === 2 && s === 'toClass') add('noa', 'noa_entrance', { pose: 'point', fb: { x: -3, y: 0, z: 3 } });
        break;
      case 'greathall':
        if (c === 1 && (s === 'noa' || s === 'toHall' || s === 'feast')) {
          add('orla', 'orla', { radius: DAIS_R, fb: { x: 0, y: 0.5, z: -17.5, yaw: PI } });
          add('dov', 'dov', { radius: DAIS_R, fb: { x: -3.5, y: 0.5, z: -17.5, yaw: PI } });
          add('noa', 'noa', { fb: { x: -0.6, y: 0, z: 3 } });
          // Tal strolls over to the new student's seat to taunt: a few steps up the aisle, off the line of
          // sight to the dais (at the 'tal' anchor he would stand right in front of the Headmistress's speech)
          if (s === 'feast') add('tal', null, { fb: { x: -1.0, y: 0, z: -1.2 } });
          else add('tal', 'tal', { fb: { x: 0.7, y: 0, z: -5 } });
          crowd(out, 20);
        } else if (c === 1) {
          add('orla', 'orla', { radius: DAIS_R, fb: { x: 0, y: 0.5, z: -17.5, yaw: PI } });
          add('dov', 'dov', { radius: DAIS_R, fb: { x: -3.5, y: 0.5, z: -17.5, yaw: PI } });
        } else if (c >= 2 && c <= 6) {
          crowd(out, 8);
        } else if (c === 7) {
          add('orla', 'orla', { radius: DAIS_R, fb: { x: 0, y: 0.5, z: -17.5, yaw: PI } });
          add('dov', 'dov', { radius: DAIS_R, fb: { x: -3.5, y: 0.5, z: -17.5, yaw: PI } });
          add('noa', 'noa', { fb: { x: -0.6, y: 0, z: 3 } });
          add('tal', 'tal', { fb: { x: 0.7, y: 0, z: -5 } });
          add('pebble', 'pebble_feast', { fb: { x: -0.7, y: 0, z: -12 } });
          add('elkan', null, { fb: { x: 4.6, y: 1.3, z: -13.2, yaw: PI } });
          crowd(out, 22);
        }
        break;
      case 'tower':
        if (c === 1 && (s === 'toTower' || s === 'night')) {
          add('noa', 'noa', { fb: { x: -2.5, y: 0, z: -2 } });
          add('tal', 'tal', { fb: { x: 2.5, y: 0, z: 2 } });
        }
        if (c === 2 && s === 'wake') {
          add('noa', 'noa', { fb: { x: -2.5, y: 0, z: -2 } });
          add('tal', 'tal', { fb: { x: 2.5, y: 0, z: 2 } });
        }
        break;
      case 'classroom':
        if (c === 2 && s !== 'wake') {
          add('dov', 'dov', { fb: { x: 5, y: 0, z: -5.5, yaw: PI / 2 } });
          add('noa', 'noa', { fb: { x: -2.5, y: 0, z: 2.5 } });
          add('tal', 'tal', { fb: { x: 2.5, y: 0, z: 2.5 } });
        } else if (c >= 3 && c <= 6) {
          add('dov', 'dov', { fb: { x: 5, y: 0, z: -5.5, yaw: PI / 2 } });
        }
        break;
      case 'library':
        if (c === 2 && s === 'toLibrary') add('elkan', 'elkan', { fb: { x: 0, y: 1.3, z: -3 } });
        if (c === 3) {
          add('elkan', 'elkan', { fb: { x: 0, y: 1.3, z: -3 } });
          add('noa', 'noa', { fb: { x: -2, y: 0, z: 4 } });
        } else if (c >= 4 && c <= 6) {
          add('elkan', 'elkan', { fb: { x: 0, y: 1.3, z: -3 } });
        }
        break;
      case 'crypt':
        if (c === 6) {
          if (s === 'reveal' && f.morrowShown) add('morrow', 'morrow', { radius: 3, dz: 3.5, fb: { x: 0, y: 0, z: -26, yaw: PI } }); // steps out of the dark, into the wand-light
          if (s === 'mercy' || s === 'relight') {
            add('morrow', 'morrow', { pose: 'kneel', radius: 3, fb: { x: 0, y: 0, z: -26, yaw: PI } });
            if (f.friendsCrypt) {
              add('orla', 'orla_crypt', { fb: { x: 0, y: 0, z: -7 } });
              add('noa', 'orla_crypt', { dx: -1.7, dz: 1.1, fb: { x: 0, y: 0, z: -7 } });
              add('tal', 'orla_crypt', { dx: 1.7, dz: 1.1, fb: { x: 0, y: 0, z: -7 } });
            }
          }
        }
        break;
      default: break;
    }
    return out;
  }

  function placementPos(pl) {
    let a = pl.anchor ? anchor(pl.anchor) : null;
    if (!a) {
      if (pl.decor) return null; // crowd needs real seat anchors
      a = pl.fb || null;
    }
    if (!a) {
      // last resort: near the player so a pending talk can never soft-lock
      const P = player();
      a = P ? { x: P.pos.x + 2, y: 0, z: P.pos.z - 2 } : { x: 0, y: 0, z: 0 };
    }
    return { x: a.x + (pl.dx || 0), y: a.y || 0, z: a.z + (pl.dz || 0), yaw: typeof pl.yaw === 'number' ? pl.yaw : a.yaw };
  }

  function findCast(who) {
    for (let i = 0; i < R.cast.length; i++) if (R.cast[i].who === who && !R.cast[i].decor) return R.cast[i];
    return null;
  }

  function clearCast() {
    const l = R.cast.splice(0, R.cast.length);
    for (let i = 0; i < l.length; i++) {
      if (l[i].iaId) { try { ELD.removeInteractable(l[i].iaId); } catch (e) { /* ignore */ } }
      disposeNpc(l[i].npc);
    }
    R.castArea = null; R.castSig = '';
  }

  function refreshCast(force) {
    const area = ELD.area;
    if (!area || !area.group || !R.active) { clearCast(); return; }
    const list = castFor(area.id);
    const sig = area.id + '|' + JSON.stringify(list);
    if (!force && R.castArea === area && R.castSig === sig) return;
    clearCast();
    R.castArea = area; R.castSig = sig;
    for (let i = 0; i < list.length; i++) spawnCast(list[i], area);
    refreshMarker();
  }

  function spawnCast(pl, area) {
    const pos = placementPos(pl);
    if (!pos) return;
    const npc = makeNpc(pl.who, pl.opts || {});
    if (!npc) return;
    const o = npc.object3D;
    o.position.set(pos.x, pos.y, pos.z);
    const P = player();
    let yaw = pos.yaw;
    if (typeof yaw !== 'number' && P) yaw = Math.atan2(-(P.pos.x - pos.x), -(P.pos.z - pos.z));
    if (typeof yaw === 'number') {
      if (typeof npc.setYaw === 'function') npc.setYaw(yaw); else o.rotation.y = yaw;
    }
    if (pl.pose) { try { npc.setPose(pl.pose); } catch (e) { /* ignore */ } }
    area.group.add(o);
    const c = { who: pl.who, npc: npc, decor: !!pl.decor, home: yaw, look: false, posObj: { x: pos.x, y: pos.y + 1, z: pos.z }, iaId: null };
    if (!c.decor && ELD.addInteractable) {
      c.iaId = 'cast:' + pl.who;
      ELD.addInteractable({
        id: c.iaId,
        pos: function () { c.posObj.x = o.position.x; c.posObj.z = o.position.z; return c.posObj; },
        radius: pl.radius || 2.6,
        label: talkLabel(pl.who),
        onInteract: function () { onNpcInteract(pl.who); },
        enabled: function () { const p = player(); return !(p && p.frozen); }
      });
    }
    R.cast.push(c);
  }

  function setTalking(whos, on) {
    for (let i = 0; i < R.cast.length; i++) {
      const c = R.cast[i];
      if (c.decor || !whos[c.who]) continue;
      try { c.npc.setTalking(on); } catch (e) { /* ignore */ }
    }
  }

  function onNpcInteract(who) {
    const w = R.pendingTalk[who];
    if (w) { w.resolve(); return; }
    const c = findCast(who);
    const P = player();
    if (c && P && P.faceTowards) {
      try {
        const o = c.npc.object3D.position, lookY = o.y + (c.npc.height || 1.6) * 0.85;
        const look = function () { try { P.faceTowards(o.x, o.z, 300, lookY); } catch (e) { /* ignore */ } };
        const sp = perchSpot(o);
        if (sp) glidePlayer(sp.x, sp.z, 0.45, look); else look();
      } catch (e) { /* ignore */ }
    }
    const hint = R.hints[who];
    const lines = hint ? (typeof hint === 'function' ? hint() : hint) : [ambientLine(who)];
    if (!lines || !lines.length || !lines[0]) return;
    const whos = {}; whos[who] = 1; if (who === 'noa') whos.tik = 1;
    setTalking(whos, true);
    const p = ui('dialogue', lines);
    Promise.resolve(p).then(function () { setTalking(whos, false); }, function () { setTalking(whos, false); });
  }

  function updateCast(dt, t) {
    const P = player();
    for (let i = 0; i < R.cast.length; i++) {
      const c = R.cast[i];
      const n = c.npc;
      if (!c.decor && P && typeof n.lookAt === 'function') {
        const o = n.object3D.position;
        const dx = P.pos.x - o.x, dz = P.pos.z - o.z;
        const near = dx * dx + dz * dz < 25;
        if (near) { try { n.lookAt(P.pos.x, P.pos.z); } catch (e) { /* ignore */ } c.look = true; }
        else if (c.look) {
          c.look = false;
          if (typeof c.home === 'number' && typeof n.faceYaw === 'function') n.faceYaw(c.home);
        }
      }
      try { n.update(dt, t); } catch (e) { /* ignore */ }
    }
    for (let i = 0; i < R.props.length; i++) {
      const n = R.props[i].npc;
      if (n) { try { n.update(dt, t); } catch (e) { /* ignore */ } }
    }
  }

  // =====================================================================
  // 8. AMBIENT LINE POOLS (per character, chosen by the latest `from` chapter <= current)
  // =====================================================================
  const AMB = {
    pebble: [
      { from: 0, lines: [
        G('אם תראה עוד עגור נייר, תגיד לו שאני עדיין כועס. הוא קיפל לי את האוזן.', 'אם תראי עוד עגור נייר, תגידי לו שאני עדיין כועס. הוא קיפל לי את האוזן.', "If you see another paper crane, tell it I'm still cross. It folded my ear."),
        T('מאתיים שנה על העמוד הזה. הנוף? מדהים. הכרית? אבן.', 'Two hundred years on this pillar. The view? Stunning. The cushion? Stone.'),
        G('השמיני? איזה שמיני? לא אמרתי שמיני. לך לאכול משהו.', 'השמיני? איזה שמיני? לא אמרתי שמיני. לכי לאכול משהו.', 'The eighth? What eighth? I never said eighth. Go and eat something.')
      ] },
      { from: 2, lines: [
        T('אתמול בלילה מישהו כיבה פנס ואני ישנתי. כלומר, עשיתי מדיטציה. עמוקה מאוד.', 'Last night someone put out a lantern and I slept right through it. Meditated, I mean. Very deeply.'),
        T('השער שלי, החוקים שלי: בלי צללים, ובלי עגורים שלא קבעו תור מראש.', 'My gate, my rules: no shades, and no cranes without an appointment.'),
        G('אתה נראה עייף. גם אני הייתי, אם הייתי צריך ללמוד. לי יש כנפיים. מאבן. זה מספיק.', 'את נראית עייפה. גם אני הייתי, אם הייתי צריך ללמוד. לי יש כנפיים. מאבן. זה מספיק.', "You look tired. I would be too, if I had to study. I have wings. Stone ones. That's enough.")
      ] },
      { from: 4, lines: [
        T('אני מעודד מכאן! זה התפקיד הכי חשוב בקרב. אחרי כל השאר.', "I'm cheering from up here! The most important job in any battle. After all the others."),
        T('צללים בחצר שלי! פעם, האופל לפחות היה דופק בשער.', 'Shades in my courtyard! In the old days, the Gloom at least knocked at the gate.')
      ] },
      { from: 7, lines: [
        T('הכרית פה רכה מדי. אני לא סומך על כריות.', "The cushions in here are far too soft. I don't trust cushions."),
        T('עוגת שזיפים בדבש! אמרתי לך שמדברים עליה בשלושה מגדלים.', 'Honey-plum cake! I told you they talk about it in three towers.')
      ] }
    ],
    noa: [
      { from: 1, lines: [
        T('טיק מתקתק מהר מדי מאז שהגענו. אני חושבת שהוא מתרגש. או שזה הקפיץ.', "Tik's been ticking too fast since we got here. I think he's excited. Or it's the spring."),
        T('ניסיתי לספור את המגדלים. יצא לי עשר. טיק אומר תשע. טיק אף פעם לא טועה. חוץ מבבקרים.', "I tried to count the towers. I got ten. Tik says nine. Tik's never wrong. Except in the mornings."),
        T('אם יש פה לחמניות עם שומשום, אני נשארת לגור באולם.', "If there are sesame rolls here, I'm moving into the hall.")
      ] },
      { from: 2, lines: [
        T('אם ארקין שואל — הפיצוץ בשורה האחורית לא היה שלי. הוא היה של טיק. שזה בעצם שלי.', "If Arkin asks, the explosion in the back row wasn't me. It was Tik. Which is technically me."),
        G('אתה מכוון ממש טוב. איפה למדת? ...רק אל תגיד ״ביער״. כולם אומרים ״ביער״.', 'את מכוונת ממש טוב. איפה למדת? ...רק אל תגידי ״ביער״. כולם אומרים ״ביער״.', 'Your aim is really good. Where did you learn? ...Just don’t say “the woods.” Everyone says “the woods.”')
      ] },
      { from: 3, lines: [
        T('יש פה ספר שלם על קפיצים. אני לא עוזבת את הספרייה הזאת לעולם.', "There's an entire book about springs in here. I'm never leaving this library."),
        T('אלקן ביקש שאפסיק לתקתק. אני לא מתקתקת! זה טיק!', "Elkan asked me to stop ticking. I'm not ticking! That's Tik!")
      ] },
      { from: 6, lines: [
        T('טיק עדיין רועד. גם אני, אם להיות כנה.', "Tik's still shaking. So am I, to be honest."),
        T('ראיתי את הסוף מראש המדרגות. אני בונה לך פסל. מגלגלי שיניים.', "I saw the end from the top of the stairs. I'm building you a statue. Out of cogs.")
      ] },
      { from: 7, lines: [
        T('טיק אכל שלוש עוגיות. אין לו קיבה. אין לי מושג לאן הן הלכו.', 'Tik ate three biscuits. He has no stomach. I have no idea where they went.'),
        T('בשנה הבאה אני בונה פנס עשירי. ליתר ביטחון.', "Next year I'm building a tenth lantern. Just in case.")
      ] }
    ],
    tal: [
      { from: 1, lines: [
        T('מה? אני לא מחכה לאף אחד. אני פשוט עומד פה. בכוונה.', "What? I'm not waiting for anyone. I'm just standing here. On purpose."),
        G('כשהפנס כבה, אני נבהלתי הכי פחות מכולם. רק שתדע.', 'כשהפנס כבה, אני נבהלתי הכי פחות מכולם. רק שתדעי.', 'When the lantern went out, I was the least scared of anyone. Just so you know.'),
        T('האח נשארת דולקת כל הלילה. זה לא בגללי. זאת... מסורת.', "The fire stays lit all night. It's not because of me. It's... tradition.")
      ] },
      { from: 2, lines: [
        T('בובות לא נלחמות בחזרה. אני עדיין עומד מאחורי המשפט הזה.', "Dummies don't fight back. I still stand by that."),
        G('שמע, הלחש שלך היה... סביר. אל תתרגל.', 'שמעי, הלחש שלך היה... סביר. אל תתרגלי.', "Look, your spell was... adequate. Don't get used to it.")
      ] },
      { from: 4, lines: [
        T('אמרתי לך שהיה לי את זה בשליטה. ...תודה שבאת.', 'Told you I had it handled. ...Thanks for coming.'),
        T('אני נשאר לשמור על החצר. זה לא קשור לזה שלמטה חשוך. בכלל לא.', "I'm staying to guard the courtyard. It has nothing to do with how dark it is down there. Nothing at all.")
      ] },
      { from: 6, lines: [
        T('ירדתי במדרגות האלה בעיניים עצומות. זה עדיין נחשב, נכון?', 'I came down those stairs with my eyes shut. That still counts, right?')
      ] },
      { from: 7, lines: [
        T('נועה אומרת שאני חייב לך עוגה. אני חייב לך חצי עוגה. היא אכלה את השאר.', 'Noa says I owe you a cake. I owe you half a cake. She ate the rest.'),
        G('בפעם הבאה שאתה יורד לחושך — תגיד לי. אני בא. עם שלושה פנסים.', 'בפעם הבאה שאת יורדת לחושך — תגידי לי. אני בא. עם שלושה פנסים.', "Next time you head into the dark — tell me. I'm coming. With three lanterns.")
      ] }
    ],
    orla: [
      { from: 1, lines: [
        T('שש מאות שנה, ותשעת הפנסים לא החמיצו אף לילה. מעניין מה הם חושבים עלינו.', 'Six hundred years, and the nine lanterns have never missed a night. I wonder what they make of us.'),
        G('לחדר המועדון, {name}. את הלילה הזה תשאיר למבוגרים.', 'לחדר המועדון, {name}. את הלילה הזה תשאירי למבוגרים.', 'Off to the common room, {name}. Leave this night to the grown-ups.')
      ] },
      { from: 4, lines: [
        T('הפטרונוס שלך לא דומה לשום פטרונוס אחר. ככה זה צריך להיות.', "Your Patronus looks like no one else's. That's exactly how it should be."),
        G('המרתף ישן ועקשן. תדליק אור לפני שאתה סומך על הרגליים.', 'המרתף ישן ועקשן. תדליקי אור לפני שאת סומכת על הרגליים.', 'The crypt is old and stubborn. Light your way before you trust your feet.')
      ] },
      { from: 6, lines: [
        T('סלה הייתה החניכה המבריקה ביותר שהכרתי. אולי בגלל זה לא הקשבנו לה.', 'Sela was the brightest apprentice I ever knew. Perhaps that is why we never listened to her.'),
        G('הכן מחכה. אל תיתן לי לעכב אותך.', 'הכן מחכה. אל תתני לי לעכב אותך.', "The pedestal is waiting. Don't let me keep you.")
      ] },
      { from: 7, lines: [
        T('תשעה פנסים, וכולם דולקים. אני חושבת שהלילה אישן שמונה שעות. אולי אפילו תשע.', 'Nine lanterns, every one of them lit. I think I shall sleep eight hours tonight. Perhaps even nine.'),
        T('סלה ביקשה שאמסור לך תודה. היא לא אמרה את זה בקול. אבל היא ביקשה.', "Sela asked me to thank you. She didn't say it out loud. But she asked.")
      ] }
    ],
    dov: [
      { from: 1, lines: [
        T('נאום על שעונים? אני? לעולם לא! יש לי רק שלושים ושבע הערות קצרות.', 'A speech about clocks? Me? Never! I only have thirty-seven brief remarks.'),
        T('הפנס כבה בארבע דקות ושתים עשרה שניות אחרי שמונה. רשמתי. מישהו צריך.', 'The lantern went out at twelve seconds past four minutes past eight. I wrote it down. Somebody has to.')
      ] },
      { from: 2, lines: [
        G('זכור: יד יציבה, לב רגוע, ושום דבר שביר ברדיוס של שלושה מטרים.', 'זכרי: יד יציבה, לב רגוע, ושום דבר שביר ברדיוס של שלושה מטרים.', 'Remember: steady hand, calm heart, and nothing breakable within three metres.'),
        T('כל שעון בכיתה הזאת מכוון לשעה אחרת. ככה אני אף פעם לא מאחר. או תמיד.', "Every clock in this room is set to a different time. That way I'm never late. Or always.")
      ] },
      { from: 3, lines: [
        T('אלקן לא נשך אותך? מצוין! אותי הוא נשך בשנה הראשונה שלי. מטאפורית.', "Elkan didn't bite you? Splendid! He bit me in my first year. Metaphorically."),
        T('אם הצללים מתחילים לרקוד ואלס — זה סימן רע. אם טנגו — עוד יותר רע.', "If the shades start dancing a waltz, that's a bad sign. A tango is even worse.")
      ] },
      { from: 7, lines: [
        T('השעון הזה עמד מאז שהפנס כבה. ועכשיו הוא שוב מתקתק! אני מתרגש. סליחה. אני מתרגש.', "This clock stopped when the lantern went out. And now it's ticking again! I'm emotional. Sorry. I'm emotional."),
        G('מחר בבוקר: לחשי ריחוף. תביא מטרייה. אל תשאל למה.', 'מחר בבוקר: לחשי ריחוף. תביאי מטרייה. אל תשאלי למה.', "Tomorrow morning: levitation charms. Bring an umbrella. Don't ask why.")
      ] }
    ],
    elkan: [
      { from: 2, lines: [
        T('ששש.', 'Shh.'),
        G('אם תפיל ספר, אני אדע. אני תמיד יודע.', 'אם תפילי ספר, אני אדע. אני תמיד יודע.', "If you drop a book, I'll know. I always know.")
      ] },
      { from: 3, lines: [
        T('ששש.', 'Shh.'),
        T('החידה לא תפתור את עצמה. ניסיתי. מאתיים שנה.', "The riddle won't solve itself. I've tried. For two hundred years."),
        G('אם תפיל ספר, אני אדע. אני תמיד יודע.', 'אם תפילי ספר, אני אדע. אני תמיד יודע.', "If you drop a book, I'll know. I always know.")
      ] },
      { from: 4, lines: [
        T('עוד רסיסים? מהר מדי. מהר זה רועש.', 'More shards? Too fast. Fast is loud.'),
        T('המרתף... גם שם היה פעם שקט. לפני שהצללים למדו ללכת.', 'The crypt... it was quiet down there too, once. Before the shades learned to walk.')
      ] },
      { from: 7, lines: [
        T('יצאתי מהספרייה בפעם הראשונה מזה מאה שנה. יש פה יותר מדי מזלגות.', "I've left the library for the first time in a century. There are far too many forks here."),
        T('כתבתי עליך שורה בכרוניקה. אחת. אצלי זה הרבה.', 'I wrote a line about you in the chronicle. One line. For me, that is a great deal.')
      ] }
    ],
    morrow: [
      { from: 6, lines: [
        G('אל תסתכל עליי ככה. רחמים הם סוג של אור, ואני עייפה מאור.', 'אל תסתכלי עליי ככה. רחמים הם סוג של אור, ואני עייפה מאור.', 'Don’t look at me like that. Pity is a kind of light, and I am tired of light.'),
        T('עשרים שנה חשבתי שאם אחזיק חזק מספיק, הוא יישאר. אור לא אוהב שמחזיקים אותו.', 'For twenty years I believed that if I held on tightly enough, it would stay. Light does not like to be held.')
      ] }
    ]
  };
  function ambientLine(who) {
    const pools = AMB[who];
    if (!pools || !pools.length) return null;
    let pool = pools[0];
    for (let i = 0; i < pools.length; i++) if (pools[i].from <= R.chapter) pool = pools[i];
    const key = who + ':' + pool.from;
    const i = (R.ambIdx[key] || 0) % pool.lines.length;
    R.ambIdx[key] = i + 1;
    return L(who, pool.lines[i]);
  }

  // =====================================================================
  // 9. AREA STATE RESTORE (after a (re)load, re-apply world changes the story already made)
  // =====================================================================
  function restoreAreaState(id) {
    const f = R.flags;
    if (id === 'greathall') {
      if (f.relit) { for (let i = 1; i <= 9; i++) areaApi('setLanternLit', i, true); }
      else if (f.lanternOut) areaApi('setLanternLit', 9, false);
      if (R.chapter === 7) { areaApi('setFeast', true); try { ELD.audio.music('feast'); } catch (e) { /* ignore */ } }
    } else if (id === 'tower') {
      areaApi('setMorning', !!f.morning);
    } else if (id === 'library') {
      if (f.shelfOpen) { areaApi('setCandleLit', 2, true); areaApi('setCandleLit', 4, true); areaApi('setCandleLit', 5, true); areaApi('openSecretShelf'); }
    } else if (id === 'crypt') {
      if (f.gateOpen) areaApi('openGate');
      if (f.relit) areaApi('setPedestalLit', true);
      else if (f.chamberGlow) areaApi('setChamberGlow', true);
    }
  }

  // =====================================================================
  // 10. DOOR POLICY
  // =====================================================================
  function applyDoorPolicy(step) {
    if (!ELD.setDoor) return;
    const f = R.flags;
    const open = step.open || [];
    const lock = step.lock || {};
    for (const id in DOORS) {
      const dest = DOORS[id];
      const src = id.split('.')[0];
      let locked = !(f.visited[dest] || open.indexOf(id) >= 0 || f.opened[id]);
      let msg = LOCK_MSG[id] || TXT.exitDefault;
      if (lock[id]) { locked = true; msg = lock[id] === true ? msg : lock[id]; }
      if (step.lockExits && src === step.area) { locked = true; msg = step.exitMsg || TXT.exitCombat; }
      ELD.setDoor(id, locked, locked ? msg : null);
    }
  }

  function applySpells() {
    const sp = R.flags.spells || {};
    if (!ELD.spells || !ELD.spells.unlock) return;
    for (const k in sp) if (sp[k]) { try { ELD.spells.unlock(k, true); } catch (e) { /* ignore */ } }
  }

  function setupStep(ci, step, resumed) {
    const f = R.flags;
    if (ELD.area && ELD.area.id) f.visited[ELD.area.id] = 1;
    applyDoorPolicy(step);
    applySpells();
    // the crypt is near-black and only 'dark' asks for Lumos: a run resumed past it (Continue / goto /
    // retry — the session reset turned the wand light off) relights it; later steps just remind
    if (step.area === 'crypt' && step.id !== 'dark' && f.spells && f.spells.lumos && ELD.spells && !ELD.spells.lumosOn) {
      if (resumed && typeof ELD.spells.setLumos === 'function') { try { ELD.spells.setLumos(true); } catch (e) { /* ignore */ } }
      if (!ELD.spells.lumosOn) ui('toast', G('חשוך כאן מאוד — הדלק את השרביט (L)', 'חשוך כאן מאוד — הדליקי את השרביט (L)', 'It is pitch dark here — light your wand (L)'), 3400);
    }
    // a new chapter starts with a clean objective (the last one belonged to the previous chapter)
    if (CHAPTERS[ci] && CHAPTERS[ci].steps[0] === step) { R.objective = null; ui('setObjective', null); }
    ui('showHealth', ci >= 4 && ci <= 6);
    ui('bossBar', null);
    ui('setShards', (f.shardsShown && !f.relit) ? (f.shards || 0) : null);
    R.goal = null;
    refreshCast();
    refreshMarker();
  }

  // =====================================================================
  // 11. TAL'S COSMETIC SPARKS (courtyard battle) — pooled sprites, created once
  // =====================================================================
  function getSpark() {
    for (let i = 0; i < R.sparks.length; i++) if (!R.sparks[i].on) return R.sparks[i];
    if (R.sparks.length >= 4 || !ELD.util || !ELD.util.glowSprite) return null;
    let sp = null;
    try { sp = ELD.util.glowSprite('#ffd66e', 0.7, 1); } catch (e) { return null; }
    if (!sp) return null;
    if (ELD.util.keep) { ELD.util.keep(sp); if (sp.material) ELD.util.keep(sp.material); }
    sp.visible = false;
    const s = { sp: sp, on: false, t: 0, fx: 0, fy: 0, fz: 0, target: null };
    R.sparks.push(s);
    return s;
  }
  function hideSparks() { for (let i = 0; i < R.sparks.length; i++) { R.sparks[i].on = false; R.sparks[i].sp.visible = false; R.sparks[i].target = null; } }
  function updateSparks(dt) {
    for (let i = 0; i < R.sparks.length; i++) {
      const s = R.sparks[i];
      if (!s.on) continue;
      const e = s.target;
      if (!e || !e.alive) { s.on = false; s.sp.visible = false; continue; }
      s.t += dt / 0.35;
      const k = Math.min(1, s.t);
      s.sp.position.set(s.fx + (e.pos.x - s.fx) * k, s.fy + (e.pos.y - s.fy) * k + Math.sin(k * PI) * 0.6, s.fz + (e.pos.z - s.fz) * k);
      if (k >= 1) {
        e.stunned = Math.max(e.stunned || 0, 0.8);
        s.on = false; s.sp.visible = false; s.target = null;
      }
    }
  }
  function talCast(talState, dt) {
    talState.t -= dt;
    if (talState.poseT > 0) { talState.poseT -= dt; if (talState.poseT <= 0) { const c = findCast('tal'); if (c) try { c.npc.setPose('idle'); } catch (e) { /* ignore */ } } }
    if (talState.t > 0) return;
    talState.t = 1.4 + Math.random() * 0.8;
    const c = findCast('tal');
    const enemies = (ELD.combat && ELD.combat.enemies) || [];
    if (!c || !ELD.area || !ELD.area.group) return;
    const o = c.npc.object3D.position;
    let best = null, bd = 196;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.alive || !e.def || e.def.kind !== 'shade') continue;
      const dx = e.pos.x - o.x, dz = e.pos.z - o.z, d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = e; }
    }
    if (!best) return;
    const s = getSpark();
    if (!s) return;
    if (s.sp.parent !== ELD.area.group) ELD.area.group.add(s.sp);
    s.on = true; s.t = 0; s.target = best;
    s.fx = o.x; s.fy = o.y + 1.35; s.fz = o.z;
    s.sp.position.set(s.fx, s.fy, s.fz);
    s.sp.visible = true;
    try { c.npc.lookAt(best.pos.x, best.pos.z); c.npc.setPose('cast'); } catch (e) { /* ignore */ }
    talState.poseT = 0.45;
  }

  // =====================================================================
  // 12. S — THE STEP HELPER TOOLKIT (one instance per run token)
  // =====================================================================
  function makeS(tok) {
    function live() { if (tok.aborted) throw ABORT; }
    const S = {
      tok: tok,
      T: T, G: G, L: L, C: C,
      flags: function () { return R.flags; },
      flag: function (k, v) { live(); if (v !== undefined) R.flags[k] = v; return R.flags[k]; },
      anchor: anchor,
      api: function () { live(); return areaApi.apply(null, arguments); },
      toast: function (t, ms) { live(); ui('toast', t, ms); },
      sfx: function (n) { live(); sfx(n); },

      objective: function (t) { live(); R.objective = t || null; ui('setObjective', R.objective); },
      mark: function (g) { live(); setGoal(g ? Object.assign({ area: ELD.area && ELD.area.id }, g) : null); },
      // S.guide(areaId): marker on the door leading toward areaId (route table), cleared on arrival
      guide: function (areaId) { live(); setGoal(areaId ? { area: areaId } : null); },
      unlockDoor: function (id) { live(); R.flags.opened[id] = 1; if (ELD.setDoor) ELD.setDoor(id, false); },
      lockDoor: function (id, msg) { live(); delete R.flags.opened[id]; if (ELD.setDoor) ELD.setDoor(id, true, msg || LOCK_MSG[id] || TXT.exitDefault); },
      unlockSpell: function (id) { live(); R.flags.spells[id] = 1; try { ELD.spells.unlock(id); } catch (e) { /* ignore */ } },
      shards: function (n) { live(); R.flags.shards = n; R.flags.shardsShown = 1; ui('setShards', n); },
      heal: function () { live(); const P = player(); if (P && P.heal) P.heal(P.maxHealth || 100); },
      hint: function (who, lines) { live(); if (lines) R.hints[who] = lines; else delete R.hints[who]; },
      freeze: function (v) { live(); setFrozen(v); },
      refreshCast: function () { live(); refreshCast(); },

      // ---- waits ----
      wait: function (ms) {
        return tokWait(tok, function (w) {
          const t = later(tok, ms, function () { w.resolve(); });
          w.cleanup = function () { const i = R.timers.indexOf(t); if (i >= 0) R.timers.splice(i, 1); };
        });
      },
      waitUntil: function (pred) {
        return tokWait(tok, function (w) {
          let ok = false; try { ok = !!pred(); } catch (e) { ok = false; }
          if (ok) { w.resolve(); return; }
          const fn = function () { let r = false; try { r = !!pred(); } catch (e) { r = false; } if (r) w.resolve(); };
          R.tickFns.push(fn);
          w.cleanup = function () { const i = R.tickFns.indexOf(fn); if (i >= 0) R.tickFns.splice(i, 1); };
        });
      },
      waitNear: function (x, z, r) {
        return S.waitUntil(function () {
          const P = player();
          if (!P || !P.pos) return false;
          const dx = P.pos.x - x, dz = P.pos.z - z;
          return dx * dx + dz * dz <= r * r;
        });
      },
      waitArea: function (id) {
        return tokWait(tok, function (w) {
          if (ELD.area && ELD.area.id === id && !(ELD.isLoading && ELD.isLoading())) { w.resolve(); return; }
          const fn = function (d) { if (d && d.id === id) w.resolve(); };
          ELD.on('areaLoaded', fn);
          w.cleanup = function () { ELD.off('areaLoaded', fn); };
        });
      },
      waitEvent: function (name, predicate, opts) {
        return tokWait(tok, function (w) {
          const fn = function (a, b) {
            let ok = true;
            if (predicate) { try { ok = !!predicate(a, b); } catch (e) { ok = false; } }
            if (ok) w.resolve(a);
          };
          ELD.on(name, fn);
          w.cleanup = function () { ELD.off(name, fn); };
          if (opts && opts.skip) w.skip = function () { try { opts.skip(); } catch (e) { /* ignore */ } w.resolve(); };
        });
      },
      // resolves after n enemies with `tag` were killed; onKill(killedSoFar) for live objectives
      waitKills: function (tag, n, onKill) {
        return tokWait(tok, function (w) {
          if (!(n > 0)) { w.resolve(0); return; }
          let k = 0;
          const fn = function (d) {
            if (!d || !d.enemy || d.enemy.tag !== tag) return;
            k++;
            if (onKill) { try { onKill(k); } catch (e) { /* ignore */ } }
            if (k >= n) w.resolve(k);
          };
          ELD.on('enemyKilled', fn);
          w.cleanup = function () { ELD.off('enemyKilled', fn); };
          w.skip = function () {
            const l = ((ELD.combat && ELD.combat.enemies) || []).slice();
            for (let i = 0; i < l.length; i++) if (l[i].alive && l[i].tag === tag) { try { ELD.combat.kill(l[i]); } catch (e) { /* ignore */ } }
            w.resolve(n);
          };
        });
      },
      // {anchor|pos, label, radius, marker=true, area}
      waitInteract: function (o) {
        live();
        o = o || {};
        const area = o.area || (curStep() && curStep().area) || (ELD.area && ELD.area.id);
        if (o.marker !== false) setGoal({ area: area, anchor: o.anchor, pos: o.pos, fb: o.fb, lift: o.lift });
        return tokWait(tok, function (w) {
          const def = regIA({ area: area, anchor: o.anchor, pos: o.pos, fb: o.fb, radius: o.radius || 2.4, label: o.label, onInteract: function () { w.resolve(); } });
          w.cleanup = function () { unregIA(def); if (o.marker !== false) setGoal(null); };
        });
      },
      // shard pickup: spawns the prop, waits for E, removes it, chime + toast
      pickup: async function (o) {
        live();
        const area = (curStep() && curStep().area) || (ELD.area && ELD.area.id);
        const prop = addProp({ area: area, anchor: o.anchor, fb: o.fb, kind: 'shard' });
        try {
          await S.waitInteract({ anchor: o.anchor, fb: o.fb, label: o.label || T('לקחת את הרסיס', 'Take the shard'), radius: o.radius || 2.4, lift: 0.7 });
        } finally { removeProp(prop); }
        live();
        sfx('pickup');
        ui('toast', TXT.shardGot, 2600);
      },
      // custom wait: setup(w) with w.resolve / w.cleanup / w.skip
      custom: function (setup) { return tokWait(tok, setup); },
      onTick: function (fn) {
        live();
        R.tickFns.push(fn);
        return function () { const i = R.tickFns.indexOf(fn); if (i >= 0) R.tickFns.splice(i, 1); };
      },

      // ---- presentation ----
      say: function (lines) {
        live();
        const arr = (typeof lines === 'function' ? lines() : lines || []).filter(Boolean);
        if (!arr.length) return Promise.resolve(undefined);
        const whos = {};
        for (let i = 0; i < arr.length; i++) if (arr[i].who) { whos[arr[i].who] = 1; if (arr[i].who === 'tik') whos.noa = 1; }
        setTalking(whos, true);
        return tokWait(tok, function (w) {
          const p = ui('dialogue', arr);
          Promise.resolve(p).then(function (v) { w.resolve(v); }, function () { w.resolve(undefined); });
          w.cleanup = function () { setTalking(whos, false); };
          w.skip = function () { flushDialogue(); w.resolve(lastFirstChoice(arr)); };
        });
      },
      // marks the NPC (beacon + optional objective), waits for E on them, then plays the dialogue
      talkTo: async function (who, lines, opts) {
        live();
        opts = opts || {};
        if (opts.objective) S.objective(opts.objective);
        const area = opts.area || (curStep() && curStep().area) || (ELD.area && ELD.area.id);
        if (opts.marker !== false) setGoal({ area: area, who: who });
        await tokWait(tok, function (w) {
          R.pendingTalk[who] = w;
          w.cleanup = function () { if (R.pendingTalk[who] === w) delete R.pendingTalk[who]; };
        });
        live();
        if (opts.marker !== false) setGoal(null);
        await S.faceWho(who);
        return S.say(lines);
      },
      // several NPCs in any order; onDone(count) after each
      talkAny: async function (map, onDone) {
        live();
        const left = Object.keys(map);
        let count = 0;
        const area = (curStep() && curStep().area) || (ELD.area && ELD.area.id);
        while (left.length) {
          setGoal({ area: area, who: left[0] });
          const who = await tokWait(tok, function (w) {
            const regs = [];
            left.forEach(function (k) {
              const sub = { resolve: function () { w.resolve(k); } };
              R.pendingTalk[k] = sub; regs.push([k, sub]);
            });
            w.cleanup = function () { regs.forEach(function (r) { if (R.pendingTalk[r[0]] === r[1]) delete R.pendingTalk[r[0]]; }); };
            w.skip = function () { w.resolve(left[0]); };
          });
          live();
          left.splice(left.indexOf(who), 1);
          setGoal(null);
          await S.faceWho(who);
          await S.say(map[who]);
          count++;
          if (onDone) onDone(count);
        }
      },
      face: function (x, z, ms, lookY) {
        return tokWait(tok, function (w) {
          const P = player();
          if (!P || typeof P.faceTowards !== 'function') { w.resolve(); return; }
          let p; try { p = P.faceTowards(x, z, ms === undefined ? 450 : ms, lookY); } catch (e) { p = null; }
          Promise.resolve(p).then(function () { w.resolve(); }, function () { w.resolve(); });
        });
      },
      faceWho: function (who) {
        const c = findCast(who);
        if (!c) return Promise.resolve();
        const o = c.npc.object3D.position;
        const lookY = o.y + (c.npc.height || 1.6) * 0.85;
        // look at roughly face height (matters for Pebble on his 4 m pillar)
        const face = function () { return S.face(o.x, o.z, undefined, lookY); };
        const sp = perchSpot(o);
        return sp ? S.glide(sp.x, sp.z).then(face) : face();
      },
      freeSpot: freeSpot,
      // smoothly move the player to x,z (cutscene staging; no collision checks — callers pick free spots)
      glide: function (tx, tz, sec) {
        live();
        const P = player();
        if (!P || !P.pos || Math.hypot(tx - P.pos.x, tz - P.pos.z) < 0.05) return Promise.resolve();
        return tokWait(tok, function (w) {
          w.cleanup = glidePlayer(tx, tz, sec || 0.45, function () { w.resolve(); });
          w.skip = function () { P.pos.x = tx; P.pos.z = tz; w.resolve(); };
        });
      },
      faceAnchor: function (name) {
        const a = anchor(name);
        return a ? S.face(a.x, a.z) : Promise.resolve();
      },
      card: function (title, sub) {
        return tokWait(tok, function (w) {
          const p = ui('chapterCard', title, sub);
          Promise.resolve(p).then(function () { w.resolve(); }, function () { w.resolve(); });
        });
      },
      fade: function (toBlack, ms) {
        return tokWait(tok, function (w) {
          const p = ui('fade', toBlack, ms);
          Promise.resolve(p).then(function () { w.resolve(); }, function () { w.resolve(); });
        });
      },
      credits: function (sections) {
        return tokWait(tok, function (w) {
          const p = ui('credits', sections);
          Promise.resolve(p).then(function () { w.resolve(); }, function () { w.resolve(); });
        });
      },
      // freezes the player for the duration of fn (dialogue/camera beats), unfreezes after
      cutscene: async function (fn) {
        live();
        setFrozen(true);
        try { return await fn(); }
        finally { if (!tok.aborted) setFrozen(false); }
      },

      // ---- combat ----
      // spawnWave(anchorNames, tag, opts) -> number spawned
      spawnWave: function (names, tag, opts) {
        live();
        if (!ELD.combat || typeof ELD.combat.spawnShade !== 'function') return 0;
        let n = 0;
        for (let i = 0; i < names.length; i++) {
          let a = anchor(names[i]);
          if (!a) { const ang = (i / names.length) * PI * 2; const P = player(); a = { x: (P ? P.pos.x : 0) + Math.cos(ang) * 10, y: 1.5, z: (P ? P.pos.z : 0) + Math.sin(ang) * 10 }; }
          let e = null;
          try { e = ELD.combat.spawnShade(a.x, typeof a.y === 'number' && a.y > 0.5 ? a.y : 1.5, a.z, Object.assign({ tag: tag }, opts || {})); } catch (err) { warn('spawnShade failed', err); }
          if (e) n++;
        }
        return n;
      },
      spawnDummies: function (names, tag, moving) {
        live();
        const out = [];
        if (!ELD.combat || typeof ELD.combat.spawnDummy !== 'function') return out;
        for (let i = 0; i < names.length; i++) {
          const a = anchor(names[i]) || { x: -4 + i * 3.2, z: -3.5 };
          try { const e = ELD.combat.spawnDummy(a.x, a.z, { tag: tag, moving: !!moving }); if (e) out.push(e); } catch (err) { warn('spawnDummy failed', err); }
        }
        return out;
      },
      clearCombat: function () { live(); try { ELD.combat.clear(); } catch (e) { /* ignore */ } }
    };
    return S;
  }

  // =====================================================================
  // 13. DIALOGUE CONTENT
  // =====================================================================
  const RIDDLE = [
    L('elkan', T('״ראשון יידלק מושל הלילה החיוור,', '“First light the pale one who governs the night,')),
    L('elkan', T('אחריו — זה שהמלח לאורו יחזור,', 'then the one that steers sailors home by its light;')),
    L('elkan', T('ואחרון — המעיר את היום משנתו,', 'last, the one who shakes the day from its sleep —')),
    L('elkan', T('והאבן תזוז ותגלה את סודו.״', 'and the stone will yield the secret it keeps.”'))
  ];
  const CANDLE_NAMES = [
    null,
    T('סמל הגל', 'wave symbol'),
    T('סמל הסהר', 'crescent moon symbol'),
    T('סמל הלהבה', 'flame symbol'),
    T('סמל הכוכב', 'star symbol'),
    T('סמל השמש', 'sun symbol')
  ];
  const ELKAN_GRUMBLES = [
    T('אלקן: לא. פשוט לא.', 'Elkan: No. Simply no.'),
    T('אלקן (נאנח בקול רם מאוד): עוד פעם, מההתחלה.', 'Elkan (sighing very loudly): Again. From the top.'),
    G('אלקן: קרא שוב את החידה. לאט. בשקט.', 'אלקן: קראי שוב את החידה. לאט. בשקט.', 'Elkan: Read the riddle again. Slowly. Quietly.')
  ];
  const BOSS_TAUNTS = [
    T('סלה: האור הזה כבר שלי!', 'Sela: This light is mine now!'),
    G('סלה: אתה רק ילד עם מקל.', 'סלה: את רק ילדה עם מקל.', "Sela: You're only a child with a stick."),
    T('סלה: שומרי הפנסים גירשו אותי. ואותך הם שלחו? מצחיק.', 'Sela: The Keepers cast me out. And they send you? Amusing.'),
    T('סלה: האופל רעב — ואני זו שמאכילה אותו.', "Sela: The Gloom is hungry — and I'm the one who feeds it.")
  ];

  const CREDITS = [
    { title: T('סיפור', 'Story'), lines: [T('סיפור מאת Claude ומאתך', 'A story by Claude & you')] },
    { title: T('בתפקידים', 'Starring'), lines: [
      G('{name} — בתפקיד עצמו', '{name} — בתפקיד עצמה', '{name} — as themselves'),
      T('נועה לוין — ממציאה, חברה, ומגינת לחמניות', 'Noa Levin — inventor, friend, defender of bread rolls'),
      T('טיק — ינשוף מכני, צועק לפי הצורך', 'Tik — clockwork owl, shrieks as required'),
      T('טל שקד — יריב לשעבר, שותף לעתיד', 'Tal Shaked — former rival, future partner'),
      T('המנהלת אורלה טמסין — סופרת כוכבים', 'Headmistress Orla Tamsin — counter of stars'),
      T('פרופסור דב ארקין — לחשים ושעונים', 'Professor Dov Arkin — charms and clocks'),
      T('אלקן הסופר — שומר השקט', 'Elkan the Scribe — keeper of silence'),
      T('פבל — גרגויל השער, בעל פרופיל אצילי', 'Pebble — gargoyle of the gate, owner of a noble profile'),
      T('סֵלָה מורו — שומרת הפנסים שגורשה', 'Sela Morrow — the exiled Lantern Keeper'),
      T('הצללים — בתפקיד האופל', 'The shades — as the Gloom')
    ] },
    { title: T('תודות מיוחדות', 'Special thanks'), lines: [
      T('לעגור הנייר, שלא ויתר', 'The paper crane, who never gave up'),
      T('לבובות האימון, על סבלנות אין קץ', 'The training dummies, for their endless patience'),
      T('לשלוש מאות ושתים עשרה המדרגות', 'All three hundred and twelve stairs')
    ] },
    { title: T('תודה ששיחקת', 'Thanks for playing'), lines: [T('תשעה פנסים דולקים. לילה טוב, אלדרמור.', 'Nine lanterns burning. Good night, Eldermoor.')] }
  ];

  function objCount(he, en, k, n) { return T(he + ' (' + k + '/' + n + ')', en + ' (' + k + '/' + n + ')'); }
  function objLeft(k) { return T('להדוף את הצללים (נותרו ' + k + ')', 'Drive back the shades (' + k + ' left)'); }

  // =====================================================================
  // 14. CHAPTERS
  // =====================================================================
  const CHAPTERS = [
    // ------------------------------------------------------------- Ch 0
    { id: 'gate', title: T('השער', 'The Gate'), subtitle: T('פרק ראשון', 'Chapter One'), steps: [
      { id: 'arrive', area: 'grounds', spawn: 'start', run: async function (S) {
        await S.cutscene(function () {
          return S.say([
            L(N, T('המכתב הגיע בחצות, מקופל לעגור נייר שניקר בעקשנות בחלון שלך עד שפתחת.', 'The letter arrived at midnight, folded into a paper crane that pecked at your window until you let it in.')),
            L(N, G('בפנים, בדיו זהובה: ״{name}, אתה מוזמן לאקדמיית אלדרמור. באיחור קל. סליחה על העגור.״', 'בפנים, בדיו זהובה: ״{name}, את מוזמנת לאקדמיית אלדרמור. באיחור קל. סליחה על העגור.״', 'Inside, in golden ink: “{name}, you are invited to Eldermoor Academy. Slightly late. Sorry about the crane.”')),
            L(N, T('עכשיו, אחרי דרך ארוכה ביער, אורות הטירה מנצנצים מעל האגם השחור. תשעה פנסים בוערים על תשעה מגדלים.', 'Now, after a long road through the forest, the castle lights glimmer above the black lake. Nine lanterns burn on nine towers.'))
          ]);
        });
        S.objective(T('ללכת אל שער האקדמיה', 'Walk to the academy gate'));
        S.mark({ anchor: 'gate', fb: { x: 0, y: 0, z: 42 }, lift: 2 });
        await S.waitNear(0, 42, 4);
        S.mark(null);
      } },
      { id: 'pebble', area: 'grounds', spawn: 'start', run: async function (S) {
        await S.say([L(N, T('על העמוד השמאלי של השער רובץ גרגויל מאבן. מתוכו בוקעת... נחירה.', 'On the left pillar of the gate crouches a stone gargoyle. From it comes... a snore.'))]);
        const v = await S.talkTo('pebble', [
          L('pebble', T('חררר... פפפ... מה? מי? אני ער! הייתי ער כל הזמן. זאת הייתה... מדיטציה של שומרים.', 'Hrrrk... pfff... What? Who? I’m awake! I was awake the whole time. That was... guardian meditation.')),
          L('pebble', T('רגע. אני צריך לתפוס את הזווית. ככה. הפרופיל האצילי שלי, מצד שמאל.', 'Hold on. Let me find my angle. There. My noble profile, from the left.')),
          L('pebble', G('אז מה זה, משלוח? אם זה עוד ארגז נרות לספרייה, תשאיר אותו ליד ה... רגע. לארגזים אין רגליים.', 'אז מה זה, משלוח? אם זה עוד ארגז נרות לספרייה, תשאירי אותו ליד ה... רגע. לארגזים אין רגליים.', "So what's this, a delivery? If it’s another crate of candles for the library, leave it by the... wait. Crates don’t have legs.")),
          L('pebble', G('אתה התלמיד החדש! זה שהעגור הביא! למה לא אמרת? ברוך הבא לאלדרמור!', 'את התלמידה החדשה! זאת שהעגור הביא! למה לא אמרת? ברוכה הבאה לאלדרמור!', "You're the new student! The one the crane fetched! Why didn’t you say so? Welcome to Eldermoor!")),
          L('pebble', G('אז ככה, בנשימה אחת: זאת אקדמיה, יש קסמים, תשעה מייסדים, תשעה פנסים, האור שלהם מרחיק את האופל — תשעה, לא שמונה, אל תשאל על השמיני, הכול בסדר, הכול בסדר.', 'אז ככה, בנשימה אחת: זאת אקדמיה, יש קסמים, תשעה מייסדים, תשעה פנסים, האור שלהם מרחיק את האופל — תשעה, לא שמונה, אל תשאלי על השמיני, הכול בסדר, הכול בסדר.', "Right, in one breath: it’s an academy, there’s magic, nine founders, nine lanterns, their light keeps the Gloom away — nine, not eight, don’t ask about the eighth, it’s fine, it’s fine.")),
          L('pebble', T('ו... משתה הפתיחה כבר התחיל. לפני חצי שעה. יש שם עוגת שזיפים בדבש שמדברים עליה בשלושה מגדלים.', 'And... the welcome feast already started. Half an hour ago. There’s a honey-plum cake they talk about in three towers.')),
          L('pebble', T('נו? אין לך שום דבר להגיד לגרגויל שומר הסף הכי מרשים בצפון?', 'Well? Nothing to say to the most impressive gatekeeper in the north?'), [
            C(T('אתה... פסל?', 'Are you a statue?'), 'statue'),
            C(T('כנפיים יפות.', 'Nice wings.'), 'wings')
          ])
        ], { objective: T('לדבר עם הגרגויל שעל השער', 'Talk to the gargoyle on the gate') });
        S.flag('pebble', v || 'wings');
        if (v === 'statue') {
          await S.say([
            L('pebble', T('פסל?! פ-ס-ל?! פסלים לא נוחרים! כלומר — פסלים לא עושים מדיטציה! אני יצירת מופת חיה, תודה רבה.', 'A statue?! A S-T-A-T-U-E?! Statues don’t snore! I mean — statues don’t meditate! I am a living masterpiece, thank you very much.')),
            L('pebble', G('יאללה, תיכנס כבר, לפני שאני נעלב עוד יותר.', 'יאללה, תיכנסי כבר, לפני שאני נעלב עוד יותר.', 'Go on in, before I get even more offended.'))
          ]);
        } else {
          await S.say([
            L('pebble', T('שמת לב?! אף אחד לא שם לב! מאתיים שנה אני מבריק אותן בגשם!', 'You noticed?! Nobody notices! Two hundred years I’ve been polishing them in the rain!')),
            L('pebble', G('אתה. אתה תצליח פה. עכשיו רוץ למשתה, לפני שהעוגה נגמרת!', 'את. את תצליחי פה. עכשיו רוצי למשתה, לפני שהעוגה נגמרת!', 'You. You’re going to do well here. Now run along to the feast, before the cake runs out!'))
          ]);
        }
        S.unlockDoor('grounds.castleDoor');
        S.objective(T('להיכנס לטירה', 'Enter the castle'));
        S.guide('entrance');
      } },
      { id: 'enter', area: 'grounds', spawn: 'start', run: async function (S) {
        S.unlockDoor('grounds.castleDoor');
        S.objective(T('להיכנס לטירה', 'Enter the castle'));
        S.guide('entrance');
        await S.waitArea('entrance');
      } }
    ] },

    // ------------------------------------------------------------- Ch 1
    { id: 'feast', title: T('המשתה', 'The Feast'), subtitle: T('פרק שני', 'Chapter Two'), steps: [
      { id: 'noa', area: 'entrance', spawn: 'fromGrounds', open: ['entrance.toGreatHall'], run: async function (S) {
        let v;
        await S.cutscene(async function () {
          await S.say([L(N, T('צעדים מהירים על האבן — ומישהי כמעט נכנסת בך במלוא התנופה.', 'Quick footsteps on stone — and someone nearly crashes straight into you.'))]);
          await S.faceWho('noa');
          v = await S.say([
            L('noa', T('סליחה! סליחה! כמעט דרסתי אותך. אני נועה. נועה לוין. גם אני חדשה — הגעתי הבוקר וכבר הלכתי לאיבוד ארבע פעמים.', 'Sorry! Sorry! I nearly flattened you. I’m Noa. Noa Levin. I’m new too — got here this morning and I’ve already been lost four times.')),
            L('tik', T('קליק-קליק. קריייק!', 'Click-click. Skreeek!')),
            L('noa', T('וזה טיק. בניתי אותו מקופסת שעון של סבתא שלי. הוא אמור להיות ינשוף דואר, אבל בינתיים הוא בעיקר ינשוף צעקות.', 'And this is Tik. I built him out of my grandmother’s clock case. He’s meant to be a messenger owl, but so far he’s mostly a shouting owl.')),
            L('noa', G('רגע... אתה זה שהעגור הביא? כל הטירה מדברת על זה!', 'רגע... את זאת שהעגור הביא? כל הטירה מדברת על זה!', 'Wait... you’re the one the crane brought? The whole castle is talking about it!'), [
              C(T('נעים מאוד, נועה. אני {name}.', 'Nice to meet you, Noa. I’m {name}.'), 'friendly'),
              C(T('רגע, הינשוף הזה באמת עובד על קפיצים?', 'Hold on — does that owl really run on springs?'), 'tik')
            ])
          ]);
          S.flag('noaMet', v || 'friendly');
          if (v === 'tik') {
            await S.say([
              L('noa', G('קפיצים, גלגלי שיניים, ולחש קטן אחד שאני עדיין לא בטוחה איך עשיתי. אם הוא מתחיל לתקתק מהר — תתרחק.', 'קפיצים, גלגלי שיניים, ולחש קטן אחד שאני עדיין לא בטוחה איך עשיתי. אם הוא מתחיל לתקתק מהר — תתרחקי.', 'Springs, cogs, and one little charm I’m still not sure how I did. If he starts ticking fast — step back.')),
              L('tik', T('טיק-טיק-טיק-טיק!', 'Tick-tick-tick-tick!')),
              L('noa', T('...הוא מחבב אותך. אני כמעט בטוחה.', '...He likes you. I’m almost sure.'))
            ]);
          } else {
            await S.say([L('noa', T('{name}! שם טוב. אני כבר מחבבת אותך. גם טיק — הוא לא ניקר אותך, וזה סימן מצוין.', '{name}! Good name. I like you already. So does Tik — he didn’t peck you, which is an excellent sign.'))]);
          }
          await S.say([L('noa', G('בוא, המשתה באולם הגדול! אני רצה לשמור לך מקום!', 'בואי, המשתה באולם הגדול! אני רצה לשמור לך מקום!', 'Come on, the feast is in the Great Hall! I’ll run ahead and save you a seat!'))]);
        });
        S.flag('noaAhead', 1);
        S.objective(T('ללכת לאולם הגדול', 'Go to the Great Hall'));
        S.guide('greathall');
      } },
      { id: 'toHall', area: 'entrance', spawn: 'fromGrounds', open: ['entrance.toGreatHall'], run: async function (S) {
        S.refreshCast();
        S.objective(T('ללכת לאולם הגדול', 'Go to the Great Hall'));
        S.guide('greathall');
        await S.waitArea('greathall');
      } },
      { id: 'feast', area: 'greathall', spawn: 'fromEntrance', lock: { 'greathall.toEntrance': T('המשתה רק התחיל — ונועה שמרה לך מקום!', 'The feast has only just begun — and Noa saved you a seat!') }, run: async function (S) {
        // before the lantern goes out (and before Tal introduces himself) the chapter-1 ambient pools would be out of order
        S.hint('tal', [L('tal', AMB.tal[0].lines[0])]);
        S.hint('orla', [L('orla', AMB.orla[0].lines[0])]);
        S.hint('dov', [L('dov', AMB.dov[0].lines[0])]);
        await S.talkTo('noa', [
          L('noa', G('הנה אתה! שמרתי לך מקום. נאלצתי להילחם בשלושה תלמידי שנה שנייה ובמגש אחד של לחמניות.', 'הנה את! שמרתי לך מקום. נאלצתי להילחם בשלושה תלמידי שנה שנייה ובמגש אחד של לחמניות.', 'There you are! I saved you a seat. I had to fight off three second-years and one tray of bread rolls.')),
          L('noa', T('ששש — המנהלת קמה. אומרים שהיא סופרת כוכבים בעיניים עצומות.', 'Shh — the Headmistress is standing up. They say she can count stars with her eyes closed.'))
        ], { objective: T('לשבת ליד נועה', 'Sit with Noa') });
        S.objective(null);
        await S.cutscene(async function () {
          // take the seat Noa saved (beside her, so she doesn't block the view of the dais)
          await S.glide(0.75, 3.2, 0.6);
          await S.faceWho('orla');
          await S.say([
            L('orla', T('ערב טוב, אלדרמור. ולמי שהגיעו הלילה בפעם הראשונה — ברוכים הבאים הביתה.', 'Good evening, Eldermoor. And to those who arrived tonight for the first time — welcome home.')),
            L('orla', T('הביטו למעלה. תשעה פנסים. תשעה מייסדים הדליקו אותם לפני שש מאות שנה, ומאז הם בוערים כל לילה.', 'Look up. Nine lanterns. Nine founders lit them six hundred years ago, and they have burned every night since.')),
            L('orla', T('מעבר לאגם חי האופל. הוא לא רשע, לא באמת — הוא פשוט רעב. ומה שהוא נוגע בו, הופך לצל.', 'Beyond the lake lives the Gloom. It isn’t wicked, not truly — it is simply hungry. And whatever it touches becomes a shade.')),
            L('orla', T('הפנסים הם הסיבה שאתם ישנים בשקט. אבל פנס לא שומר על עצמו.', 'The lanterns are the reason you sleep soundly. But a lantern does not keep itself.')),
            L('orla', T('אור חזק רק כמו הידיים ששומרות עליו. ומהלילה — אלה גם הידיים שלכם.', 'A light is only as strong as the hands that keep it. And from tonight, those hands are yours too.')),
            L('orla', T('ועכשיו, לפני שפרופסור ארקין יתחיל לנאום על שעונים — תאכלו.', 'And now, before Professor Arkin begins a speech about clocks — eat.')),
            L('dov', T('זה היה נאום קצר! יחסית! במונחים של שעון חול!', 'It would have been a short speech! Relatively! By hourglass standards!'))
          ]);
          await S.faceWho('tal');
          const t = await S.say([
            L('tal', G('אז אתה החדש של העגור. חשבתי שתהיה... גבוה יותר.', 'אז את החדשה של העגור. חשבתי שתהיי... גבוהה יותר.', 'So you’re the crane’s new delivery. I thought you’d be... taller.')),
            L('tal', G('טל שקד. תזכור את השם. בעוד שנה כולם יזכרו אותו.', 'טל שקד. תזכרי את השם. בעוד שנה כולם יזכרו אותו.', 'Tal Shaked. Remember the name. In a year, everyone will.'), [
              C(T('אזכור. בעיקר את החלק שבו היית גס רוח.', 'I’ll remember. Mostly the part where you were rude.'), 'snap'),
              C(T('(להתעלם ולקחת לחמנייה)', '(Ignore him and grab a bread roll)'), 'ignore')
            ])
          ]);
          S.flag('talMet', t || 'snap');
          if (t === 'ignore') {
            await S.say([
              L('tal', T('אוקיי. השתיקה המסתורית. קלאסי.', 'Okay. The mysterious silence. Classic.')),
              L('noa', G('אל תתייחס אליו. הוא ככה עם כולם. אפילו עם הלחמניות.', 'אל תתייחסי אליו. הוא ככה עם כולם. אפילו עם הלחמניות.', 'Don’t mind him. He’s like that with everyone. Even the bread rolls.'))
            ]);
          } else {
            await S.say([L('tal', T('חה. יש לך לשון. נראה אם יש לך גם יד יציבה עם שרביט.', 'Ha. You’ve got a tongue on you. Let’s see if you’ve got a steady wand hand too.'))]);
          }
          S.api('setLanternLit', 9, false);
          S.flag('lanternOut', 1);
          S.hint('tal', null); S.hint('orla', null); S.hint('dov', null);
          S.sfx('shadeSpawn');
          S.toast(T('הפנס התשיעי כבה!', 'The Ninth Lantern has gone out!'), 3000);
          await S.wait(1200);
          await S.faceWho('orla');
          await S.say([
            L(N, T('ואז, בלי רוח ובלי קול — הפנס התשיעי כבה. מאות כפיות קופאות באוויר.', 'And then, with no wind and no sound — the Ninth Lantern goes out. Hundreds of spoons freeze in mid-air.')),
            L('orla', T('שקט, בבקשה. אין סיבה לפאניקה. יש סיבה לסדר.', 'Quiet, please. There is no cause for panic. There is cause for order.')),
            L('orla', T('כל התלמידים — לחדרי המועדון, עכשיו. המורים — אליי.', 'All students — to your common rooms, now. Staff — with me.')),
            L('noa', G('{name}... ראית את זה? ...בוא. נדבר למעלה.', '{name}... ראית את זה? ...בואי. נדבר למעלה.', '{name}... did you see that? ...Come on. We’ll talk upstairs.'))
          ]);
        });
        S.objective(T('ללכת לחדר המועדון', 'Go to the common room'));
        S.guide('tower');
      } },
      { id: 'toTower', area: 'greathall', spawn: 'fromEntrance', open: ['entrance.toTower'], run: async function (S) {
        S.objective(T('ללכת לחדר המועדון', 'Go to the common room'));
        S.guide('tower');
        await S.waitArea('tower');
      } },
      { id: 'night', area: 'tower', spawn: 'fromEntrance', lock: { 'tower.toEntrance': T('עוצר לילה. אפילו הגרגויל ישן עכשיו.', 'Curfew. Even the gargoyle is asleep by now.') }, run: async function (S) {
        await S.talkTo('noa', [
          L('noa', G('{name}, אתה חייב לשמוע את זה. כשהפנס כבה — ראיתי אור סגול. הוא החליק החוצה מהאולם, צמוד לקיר, כמו חתול שגנב משהו.', '{name}, את חייבת לשמוע את זה. כשהפנס כבה — ראיתי אור סגול. הוא החליק החוצה מהאולם, צמוד לקיר, כמו חתול שגנב משהו.', '{name}, you have to hear this. When the lantern died — I saw a violet light. It slid out of the hall, hugging the wall, like a cat that stole something.')),
          L('noa', G('וטיק הקליט את זה. יש לו זיכרון של שלושה צלילים בדיוק. תקשיב.', 'וטיק הקליט את זה. יש לו זיכרון של שלושה צלילים בדיוק. תקשיבי.', 'And Tik recorded it. He has a memory of exactly three sounds. Listen.')),
          L('tik', T('קליק... ווררררר... קליק.', 'Click... whirrrrr... click.')),
          L('noa', T('זה לא צליל של פנס שנגמר לו השמן. פנסים לא עושים קליק. מישהו כיבה אותו.', 'That’s not the sound of a lantern running dry. Lanterns don’t click. Someone put it out.')),
          L('tal', T('או שהאופל סתם התעטש. ...מה? גם אני גר פה.', 'Or the Gloom just sneezed. ...What? I live here too.')),
          L('noa', T('טוב. אני לא אירדם בחיים. ...אני נרדמת עוד שתי דקות. לילה טוב.', 'Right. I’ll never fall asleep. ...I’ll be asleep in two minutes. Good night.'))
        ], { objective: T('לדבר עם נועה', 'Talk to Noa') });
        S.objective(T('ללכת לישון', 'Go to sleep'));
        await S.waitInteract({ anchor: 'bed', fb: { x: 4.5, y: 0.6, z: -3.5 }, label: T('ללכת לישון', 'Go to sleep'), radius: 2.8, lift: 1.2 });
        await S.cutscene(async function () {
          await S.fade(true, 900);
          S.api('setMorning', true);
          S.flag('morning', 1);
          await S.wait(400);
          await S.fade(false, 900);
          await S.card(T('בוקר', 'Morning'), T('היום הראשון באלדרמור', 'Your first day at Eldermoor'));
        });
        S.objective(null);
      } }
    ] },

    // ------------------------------------------------------------- Ch 2
    { id: 'lesson', title: T('שיעור ראשון', 'First Lesson'), subtitle: T('פרק שלישי', 'Chapter Three'), steps: [
      { id: 'wake', area: 'tower', spawn: 'fromEntrance', run: async function (S) {
        await S.cutscene(async function () {
          await S.faceWho('noa');
          await S.say([
            L('noa', G('בוקר! קום! שיעור לחשים עם פרופסור ארקין בעוד... טיק, מה השעה?', 'בוקר! קומי! שיעור לחשים עם פרופסור ארקין בעוד... טיק, מה השעה?', 'Morning! Up you get! Charms with Professor Arkin in... Tik, what time is it?')),
            L('tik', T('קריייק! קריייק! קריייק!', 'Skreek! Skreek! Skreek!')),
            L('noa', G('שלוש צעקות. זה אומר שאנחנו מאחרים. או שהוא רעב. בכל מקרה — רוץ!', 'שלוש צעקות. זה אומר שאנחנו מאחרים. או שהוא רעב. בכל מקרה — רוצי!', 'Three shrieks. That means we’re late. Or he’s hungry. Either way — run!')),
            L('noa', G('כיתת הלחשים יוצאת מהצד המערבי של אולם הכניסה. אל תאחר — הוא סופר כל שנייה. ממש. יש לו שעונים בשביל זה.', 'כיתת הלחשים יוצאת מהצד המערבי של אולם הכניסה. אל תאחרי — הוא סופר כל שנייה. ממש. יש לו שעונים בשביל זה.', 'The Charms classroom is off the west side of the Entrance Hall. Don’t be late — he counts every second. Literally. He has clocks for it.')),
            L('tal', T('אני כבר הולך. לא כי אכפת לי. כי יש שם מקומות טובים ליד החלון.', 'I’m off already. Not because I care. There are good seats by the window.'))
          ]);
        });
        S.unlockDoor('entrance.toClassroom');
        S.objective(T('ללכת לכיתת הלחשים', 'Go to the Charms classroom'));
        S.guide('classroom');
      } },
      { id: 'toClass', area: 'tower', spawn: 'fromEntrance', open: ['entrance.toClassroom'], run: async function (S) {
        S.unlockDoor('entrance.toClassroom');
        S.hint('noa', [L('noa', T('לכאן! הדלת המערבית! טיק כבר רץ קדימה. כלומר, נגרר.', 'This way! The west door! Tik’s already run ahead. Well, been dragged.'))]);
        S.objective(T('ללכת לכיתת הלחשים', 'Go to the Charms classroom'));
        S.guide('classroom');
        await S.waitArea('classroom');
      } },
      { id: 'lumos', area: 'classroom', spawn: 'fromEntrance', lock: { 'classroom.toEntrance': T('פרופסור ארקין: השיעור עוד לא נגמר! לפי כל השעונים!', 'Professor Arkin: The lesson isn’t over! According to every clock!') }, run: async function (S) {
        await S.talkTo('dov', [
          L('dov', G('אה! עוד תלמיד! בדיוק בזמן! טוב, באיחור של ארבעים ושלוש שניות, אבל מי סופר? אני. אני סופר.', 'אה! עוד תלמידה! בדיוק בזמן! טוב, באיחור של ארבעים ושלוש שניות, אבל מי סופר? אני. אני סופר.', 'Ah! Another student! Right on time! Well, forty-three seconds late, but who’s counting? Me. I am counting.')),
          L('dov', T('פרופסור דב ארקין: לחשים, שעונים, ותיקון חלונות כשהשיעור משתבש.', 'Professor Dov Arkin: charms, clocks, and window repair whenever a lesson goes sideways.')),
          L('dov', T('קסם הוא כמו שעון: טיק, טאק, ומדי פעם פיצוץ קטן. העיקר לא לפחד מהפיצוץ ולא להתאהב בטיק.', 'Magic is like a clock: tick, tock, and occasionally a small explosion. The trick is not to fear the explosion and not to fall in love with the tick.')),
          L('noa', T('...אני לא בטוחה שהבנתי.', '...I’m not sure I followed that.')),
          L('dov', G('מצוין! אף אחד לא מבין בשיעור הראשון. נתחיל באור. הרם את השרביט ואמור בבירור: לומוס.', 'מצוין! אף אחד לא מבין בשיעור הראשון. נתחיל באור. הרימי את השרביט ואמרי בבירור: לומוס.', 'Splendid! Nobody understands in the first lesson. We begin with light. Raise your wand and say it clearly: Lumos.'))
        ], { objective: T('לדבר עם פרופסור ארקין', 'Talk to Professor Arkin') });
        S.unlockSpell('lumos');
        S.objective(T('להטיל לומוס (L)', 'Cast Lumos (L)'));
        if (!(ELD.spells && ELD.spells.lumosOn)) await S.waitEvent('spellCast', function (d) { return d && d.id === 'lumos'; });
        await S.say([L('dov', T('הנה! אור! תראו את זה — יציב כמו מטוטלת. ציון ראשון: מצוין, עם כוכבית.', 'There! Light! Look at that — steady as a pendulum. First mark: excellent, with a little star.'))]);
      } },
      { id: 'stupefy', area: 'classroom', spawn: 'fromEntrance', lock: { 'classroom.toEntrance': T('פרופסור ארקין: השיעור עוד לא נגמר! לפי כל השעונים!', 'Professor Arkin: The lesson isn’t over! According to every clock!') }, run: async function (S) {
        await S.cutscene(async function () {
          await S.faceWho('dov');
          await S.say([
            L('dov', T('עכשיו משהו עם קצת יותר... טאק. סטופפיי! לחש הלם. הוא לא פוגע — הוא רק אומר למטרה ״רגע, שב״.', 'Now something with a little more... tock. Stupefy! A stunning charm. It doesn’t hurt — it simply tells the target, “one moment, sit down.”')),
            L('dov', G('שלוש בובות אימון. אחת, שתיים, שלוש. פגע בכל אחת לפחות פעם אחת. קליק שמאלי — ובלי לצעוק על הבובות, הן רגישות.', 'שלוש בובות אימון. אחת, שתיים, שלוש. פגעי בכל אחת לפחות פעם אחת. קליק שמאלי — ובלי לצעוק על הבובות, הן רגישות.', 'Three training dummies. One, two, three. Hit each of them at least once. Left click — and no shouting at the dummies, they’re sensitive.'))
          ]);
        });
        S.unlockSpell('stupefy');
        const dummies = S.spawnDummies(['dummy1', 'dummy2', 'dummy3'], 'class', false);
        const need = Math.max(1, Math.min(3, dummies.length || 3));
        const hit = [];
        const o = function () { return objCount('לפגוע בבובות האימון בסטופפיי', 'Hit the training dummies with Stupefy', hit.length, need); };
        S.objective(o());
        S.mark({ anchor: 'dummy2', fb: { x: -1, y: 0, z: -4.5 }, lift: 2.4 });
        await S.waitEvent('dummyHit', function (d) {
          if (!d || d.spellId !== 'stupefy' || !d.enemy || d.enemy.tag !== 'class') return false;
          if (hit.indexOf(d.enemy) < 0) { hit.push(d.enemy); S.objective(o()); }
          return hit.length >= need;
        });
        S.mark(null);
        await S.say([L('dov', T('שלוש מתוך שלוש! הבובות יצטרכו כוס תה.', 'Three out of three! The dummies will need a cup of tea.'))]);
      } },
      { id: 'expelliarmus', area: 'classroom', spawn: 'fromEntrance', lock: { 'classroom.toEntrance': T('פרופסור ארקין: השיעור עוד לא נגמר! לפי כל השעונים!', 'Professor Arkin: The lesson isn’t over! According to every clock!') }, run: async function (S) {
        S.clearCombat();
        await S.cutscene(async function () {
          await S.faceWho('tal');
          await S.say([
            L('tal', G('וואו. פגעת בבובה שעומדת במקום. מרשים. בובות לא נלחמות בחזרה, אתה יודע.', 'וואו. פגעת בבובה שעומדת במקום. מרשים. בובות לא נלחמות בחזרה, את יודעת.', 'Wow. You hit a dummy that stands still. Impressive. Dummies don’t fight back, you know.'))
          ]);
          await S.faceWho('dov');
          await S.say([
            L('dov', T('נקודה מצוינת, אדון שקד! אז בוא נעיר אחת.', 'An excellent point, Mister Shaked! So let’s wake one up.')),
            L('dov', G('אקספליארמוס — לחש פירוק. הוא הודף, ומפיל מהיד כל מה שמחזיקים בה. קליק ימני. וכוון לאן שהיא תהיה, לא לאן שהיא נמצאת!', 'אקספליארמוס — לחש פירוק. הוא הודף, ומפיל מהיד כל מה שמחזיקים בה. קליק ימני. וכווני לאן שהיא תהיה, לא לאן שהיא נמצאת!', 'Expelliarmus — the disarming charm. It shoves, and knocks loose whatever is being held. Right click. And aim where it’s going to be, not where it is!'))
          ]);
        });
        S.unlockSpell('expelliarmus');
        S.spawnDummies(['dummy2'], 'move', true);
        S.objective(T('לפרק את הבובה הנעה (קליק ימני)', 'Disarm the moving dummy (right click)'));
        S.mark({ anchor: 'dummy2', fb: { x: -1, y: 0, z: -4.5 }, lift: 2.4 });
        await S.waitEvent('dummyHit', function (d) { return d && d.spellId === 'expelliarmus' && d.enemy && d.enemy.tag === 'move'; });
        S.mark(null);
        await S.cutscene(async function () {
          await S.faceWho('tal');
          await S.say([
            L('tal', G('...טוב. זה היה לא רע. בשביל מישהו חדש.', '...טוב. זה היה לא רע. בשביל מישהי חדשה.', '...Fine. That wasn’t bad. For a newcomer.')),
            L('noa', T('הוא אמר ״לא רע״! טיק, תקליט את זה, זה לא יקרה שוב.', 'He said “not bad”! Tik, record that, it’ll never happen again.')),
            L('tik', T('קליק.', 'Click.'))
          ]);
          await S.faceWho('dov');
          await S.say([
            L('dov', T('{name}, מילה קטנה, בשקט. שמעתי מה קרה אתמול באולם. מי שרוצה לדעת את סודות הפנסים — הולך לספרייה.', '{name}, a small word, quietly. I heard what happened in the hall last night. Whoever wants the secrets of the lanterns goes to the library.')),
            L('dov', T('יש שם רוח בשם אלקן. הוא היה הסופר של המייסדים. הוא שונא רעש, אוהב חידות, ויודע הכול. כמעט.', 'There’s a ghost there named Elkan. He was the founders’ scribe. He hates noise, loves riddles, and knows everything. Nearly.')),
            L('dov', T('וחוץ מזה — לא שמעת את זה ממני. אני רק מורה לשעונים. ללחשים! ללחשים.', 'And — you didn’t hear it from me. I’m only the clocks teacher. Charms! Charms teacher.'))
          ]);
        });
        S.clearCombat();
        S.unlockDoor('entrance.toLibrary');
        S.unlockDoor('classroom.toEntrance');
        S.objective(T('לבקר בספרייה', 'Visit the library'));
        S.guide('library');
      } },
      { id: 'toLibrary', area: 'classroom', spawn: 'fromEntrance', open: ['entrance.toLibrary'], run: async function (S) {
        S.unlockDoor('entrance.toLibrary');
        S.objective(T('לבקר בספרייה', 'Visit the library'));
        S.guide('library');
        await S.waitArea('library');
      } }
    ] },

    // ------------------------------------------------------------- Ch 3
    { id: 'scribe', title: T('הסופר הרפאי', 'The Ghostly Scribe'), subtitle: T('פרק רביעי', 'Chapter Four'), steps: [
      { id: 'elkan', area: 'library', spawn: 'fromEntrance', run: async function (S) {
        await S.talkTo('elkan', [
          L('elkan', T('ששש!', 'Shh!')),
          L('elkan', T('שש מאות שנה של שקט, ועכשיו צעדים. צעדים! עם נעליים!', 'Six hundred years of silence, and now footsteps. Footsteps! In shoes!')),
          L('elkan', G('מה אתה רוצה, ילד? לשאול ספר? הספרים שלי לא יוצאים. הם בקושי יוצאים מהמדף.', 'מה את רוצה, ילדה? לשאול ספר? הספרים שלי לא יוצאים. הם בקושי יוצאים מהמדף.', 'What do you want, child? To borrow a book? My books do not go out. They barely come off the shelf.')),
          L('player', T('הפנס התשיעי כבה. פרופסור ארקין אמר שאתה יודע איך להחזיר אותו.', 'The Ninth Lantern went out. Professor Arkin said you’d know how to bring it back.')),
          L('elkan', T('...כבה? ...מעניין. מאוד לא שקט, אבל מעניין.', '...Out? ...Interesting. Very un-quiet, but interesting.')),
          L('elkan', G('פנס שמת לא נעלם. הוא מתנפץ לשלושה רסיסים. תאסוף את שלושתם, והוא יידלק מחדש על הכן שלו, עמוק מתחת לטירה.', 'פנס שמת לא נעלם. הוא מתנפץ לשלושה רסיסים. תאספי את שלושתם, והוא יידלק מחדש על הכן שלו, עמוק מתחת לטירה.', 'A lantern that dies does not vanish. It shatters into three shards. Gather all three, and it can be rekindled on its pedestal, deep beneath the castle.')),
          L('elkan', T('רסיס אחד נפל לגומחת החידות של המייסדים — כאן, בספרייה שלי. השני נסחב בידי צללים אל החצר. והשלישי שקע אל המרתף.', 'One shard fell into the founders’ riddle-niche — here, in my library. The second was carried off by shades into the courtyard. The third sank into the crypt.')),
          L('elkan', G('הגומחה נפתחת רק למי שמדליק את הנרות בסדר הנכון. הקשב היטב, כי אני לא חוזר על עצמי. כמעט אף פעם.', 'הגומחה נפתחת רק למי שמדליקה את הנרות בסדר הנכון. הקשיבי היטב, כי אני לא חוזר על עצמי. כמעט אף פעם.', 'The niche opens only for one who lights the candles in the right order. Listen closely, for I do not repeat myself. Almost never.'))
        ].concat(RIDDLE).concat([
          L('elkan', T('חמישה נרות, חמישה סמלים. טעות אחת — וכולם כבים. ואני נאנח. בקול.', 'Five candles, five symbols. One mistake and they all go out. And I sigh. Loudly.'))
        ]), { objective: T('למצוא את אלקן הסופר', 'Find Elkan the Scribe') });
        S.shards(0);
        S.objective(T('להדליק את הנרות בסדר הנכון', 'Light the candles in the right order'));
      } },
      { id: 'riddle', area: 'library', spawn: 'fromEntrance', run: async function (S) {
        S.shards(0);
        S.objective(T('להדליק את הנרות בסדר הנכון', 'Light the candles in the right order'));
        S.hint('noa', [
          L('noa', T('״מושל הלילה החיוור״... זה חייב להיות הירח, לא? ומלחים מנווטים לפי כוכבים.', '“The pale one who governs the night”... that has to be the moon, right? And sailors navigate by the stars.')),
          L('noa', T('ומה מעיר את היום משנתו? ...טוב, את זה אפילו טיק יודע. תסתכלו על הלוחיות שמתחת לנרות.', 'And what shakes the day from its sleep? ...Okay, even Tik knows that one. Look at the plaques under the candles.')),
          L('tik', T('קריייק! (בטון של שמש)', 'Skreek! (in a sunny sort of tone)'))
        ]);
        S.hint('elkan', [L('elkan', T('אני לא חוזר על עצמי. ...טוב. פעם אחת.', 'I do not repeat myself. ...Fine. Once.'))].concat(RIDDLE));
        // guide to the approach of the candle row, not onto a specific (decoy) candle; drop it on arrival
        S.mark({ pos: { x: 0, y: 1.8, z: -4.5 } });
        const stopRowMark = S.onTick(function () {
          const P = player();
          if (!P || !P.pos || !ELD.area || ELD.area.id !== 'library') return;
          const dx = P.pos.x, dz = P.pos.z + 5.5;
          if (dx * dx + dz * dz <= 16) { stopRowMark(); setGoal(null); }
        });
        const SEQ = [2, 4, 5];
        let idx = 0, busy = false, grumble = 0;
        const lit = {};
        await S.custom(function (w) {
          const defs = [];
          const onArea = function (d) { if (d && d.id === 'library') { idx = 0; busy = false; for (const k in lit) delete lit[k]; } };
          ELD.on('areaLoaded', onArea);
          for (let i = 1; i <= 5; i++) {
            defs.push(regIA({
              area: 'library', anchor: 'candle' + i, fb: { x: -12 + i * 4, y: 1.1, z: -7 }, radius: 1.9,
              label: T('להדליק נר — ' + CANDLE_NAMES[i].he, 'Light candle — ' + CANDLE_NAMES[i].en),
              enabled: function () { return !lit[i] && !busy; },
              onInteract: function () {
                if (lit[i] || busy) return;
                lit[i] = 1;
                areaApi('setCandleLit', i, true);
                if (i === SEQ[idx]) {
                  idx++;
                  sfx('lumos');
                  if (idx >= SEQ.length) { w.resolve(); return; }
                  ui('toast', T('הנר נדלק. משהו בתוך הקיר מתקתק.', 'The candle catches. Something inside the wall ticks.'), 1800);
                } else {
                  busy = true;
                  sfx('nox');
                  later(S.tok, 750, function () {
                    areaApi('resetCandles');
                    sfx('thud');
                    ui('toast', ELKAN_GRUMBLES[grumble++ % ELKAN_GRUMBLES.length], 2600);
                    idx = 0; busy = false;
                    for (const k in lit) delete lit[k];
                  });
                }
              }
            }));
          }
          w.cleanup = function () { ELD.off('areaLoaded', onArea); defs.forEach(unregIA); };
        });
        stopRowMark();
        S.mark(null);
        S.hint('noa', null); S.hint('elkan', null);
        S.api('openSecretShelf');
        S.flag('shelfOpen', 1);
        S.sfx('door');
        await S.say([L(N, T('משהו נוקש בתוך הקיר. המדף המרכזי זז הצידה בחריקה ארוכה, ומאחוריו זוהרת גומחה.', 'Something clicks inside the wall. The centre shelf slides aside with a long creak, and behind it a niche begins to glow.'))]);
        S.objective(T('לקחת את הרסיס מהגומחה', 'Take the shard from the niche'));
        await S.pickup({ anchor: 'secretShelf', fb: { x: 0, y: 1.2, z: -9.2 }, label: T('לקחת את הרסיס', 'Take the shard'), radius: 2.4 });
        S.shards(1);
        await S.say([
          L('elkan', T('הממ. לא רע. בפעם הבאה — בשקט יותר.', 'Hmm. Not bad. Next time — quieter.')),
          L('noa', T('רסיס אחד! עוד שניים! טיק, אנחנו בעניין!', 'One shard! Two to go! Tik, we’re on the case!'))
        ]);
      } },
      { id: 'alarm', area: 'library', spawn: 'fromEntrance', open: ['entrance.toGrounds'], run: async function (S) {
        await S.cutscene(async function () {
          await S.faceWho('noa');
          await S.say([
            L('noa', T('{name}! {name}! פבל צורח מהשער — יש צללים בחצר! הרבה צללים!', '{name}! {name}! Pebble is yelling from the gate — there are shades in the courtyard! Lots of them!')),
            L('noa', T('וטל שם. הוא יצא להתאמן לבד, כי ברור שהוא יצא להתאמן לבד.', 'And Tal is out there. He went to practise alone, because of course he did.')),
            L('elkan', T('צללים בתוך החומות... זה לא קרה מאז... לכו. לכו כבר! ובשקט!', 'Shades within the walls... that has not happened since... Go. Go already! And quietly!')),
            L('noa', G('אני רצה להזעיק את המנהלת. אתה — לחצר!', 'אני רצה להזעיק את המנהלת. את — לחצר!', 'I’ll run and fetch the Headmistress. You — to the courtyard!'))
          ]);
        });
        S.objective(T('למהר אל החצר', 'Hurry to the courtyard'));
        S.guide('grounds');
        await S.waitArea('grounds');
      } }
    ] },

    // ------------------------------------------------------------- Ch 4
    { id: 'courtyard', title: T('צללים בחצר', 'Shadows in the Courtyard'), subtitle: T('פרק חמישי', 'Chapter Five'), steps: [
      { id: 'tal', area: 'grounds', spawn: 'fromCastle', lockExits: true, exitMsg: T('טל לבד מול הצללים — אי אפשר להשאיר אותו!', 'Tal is alone with the shades — you can’t leave him!'), run: async function (S) {
        await S.cutscene(async function () {
          await S.faceWho('tal');
          await S.say([
            L('tal', G('אל תתקרב! כלומר — תתקרב! כלומר... היה לי את זה בשליטה!', 'אל תתקרבי! כלומר — תתקרבי! כלומר... היה לי את זה בשליטה!', 'Stay back! I mean — come here! I mean... I had it handled!')),
            L('tal', G('הם יוצאים מהצל של המזרקה. ואני... אני לא כל כך מסתדר עם החושך. אל תספר לאף אחד.', 'הם יוצאים מהצל של המזרקה. ואני... אני לא כל כך מסתדר עם החושך. אל תספרי לאף אחד.', 'They’re coming out of the fountain’s shadow. And I... I don’t really get along with the dark. Don’t tell anyone.')),
            L('player', T('גב אל גב?', 'Back to back?')),
            L('tal', T('...גב אל גב.', '...Back to back.'))
          ]);
        });
        ui('showHealth', true);
      } },
      { id: 'battle', area: 'grounds', spawn: 'fromCastle', lockExits: true, run: async function (S) {
        ui('showHealth', true);
        const waves = [
          ['shade1', 'shade4', 'shade7'],
          ['shade2', 'shade4', 'shade6', 'shade8'],
          ['shade1', 'shade3', 'shade5', 'shade7', 'shade8']
        ];
        const waveToasts = [
          T('הצללים מקיפים את המזרקה!', 'The shades are circling the fountain!'),
          T('עוד צללים עולים מהאגם!', 'More shades are rising from the lake!'),
          T('הגל האחרון! תחזיקו מעמד!', 'The last wave! Hold on!')
        ];
        let total = 12, killed = 0;
        const tal = { t: 2, poseT: 0 };
        const offTal = S.onTick(function (dt) { talCast(tal, dt); });
        S.objective(objLeft(total));
        try {
          for (let wi = 0; wi < waves.length; wi++) {
            S.toast(waveToasts[wi], 2400);
            if (wi === 1) S.toast(T('פבל (מהשער): קדימה! אני מעודד! בקול!', 'Pebble (from the gate): Go on! I’m cheering! Loudly!'), 2600);
            if (wi > 0) await S.wait(1600);
            const n = S.spawnWave(waves[wi], 'court');
            total -= (waves[wi].length - n);
            S.objective(objLeft(Math.max(0, total - killed)));
            await S.waitKills('court', n, function () { killed++; S.objective(objLeft(Math.max(0, total - killed))); });
          }
        } finally { offTal(); hideSparks(); }
        S.objective(null);
        S.toast(T('החצר שקטה שוב.', 'The courtyard falls quiet again.'), 2400);
        await S.wait(900);
      } },
      { id: 'patronus', area: 'grounds', spawn: 'fromCastle', lockExits: true, exitMsg: T('המנהלת עוד מדברת איתך.', 'The Headmistress is still speaking with you.'), run: async function (S) {
        await S.cutscene(async function () {
          await S.faceWho('tal');
          await S.say([
            L('tal', T('...הם נעלמו. טוב. אני... תודה.', '...They’re gone. Good. I... thanks.')),
            L('tal', G('קח. חטפתי את זה מאחד הצללים לפני שהגעת. זה זהר בתוך העשן כמו גחלת.', 'קחי. חטפתי את זה מאחד הצללים לפני שהגעת. זה זהר בתוך העשן כמו גחלת.', 'Here. I snatched this off one of the shades before you got here. It was glowing inside the smoke like an ember.'))
          ]);
          S.shards(2);
          S.sfx('pickup');
          S.toast(TXT.shardGot, 2600);
          await S.say([
            L('tal', G('וכן, צרחתי. קצת. אני מפחד מהחושך, טוב? מאז שהייתי קטן. אם תספר למישהו, אכחיש בכל תוקף.', 'וכן, צרחתי. קצת. אני מפחד מהחושך, טוב? מאז שהייתי קטן. אם תספרי למישהו, אכחיש בכל תוקף.', 'And yes, I screamed. A little. I’m afraid of the dark, okay? Ever since I was small. Tell anyone and I’ll deny it with great dignity.'))
          ]);
          S.flag('orlaCourt', 1);
          S.refreshCast();
          S.sfx('door');
          await S.wait(500);
          await S.faceWho('orla');
          const mem = await S.say([
            L('orla', T('יפה מאוד, שניכם. אבל צללים לא נעלמים — הם רק מחכים לחושך הבא.', 'Very well done, both of you. But shades don’t vanish — they only wait for the next dark.')),
            L('orla', T('{name}, הגיע הזמן ללמוד את הלחש שהמייסדים שמרו לשעות כאלה. אקספקטו פטרונום.', '{name}, it is time you learned the charm the founders kept for hours like this. Expecto Patronum.')),
            L('orla', G('הוא לא נשען על כוח. הוא נשען על זיכרון — האור של רגע שהיית מגן עליו בכל מחיר.', 'הוא לא נשען על כוח. הוא נשען על זיכרון — האור של רגע שהיית מגינה עליו בכל מחיר.', 'It does not rest on strength. It rests on memory — the light of a moment you would protect at any cost.')),
            L('orla', G('איזה זיכרון תבחר?', 'איזה זיכרון תבחרי?', 'Which memory will you choose?'), [
              C(T('הבוקר שבו לימדו אותי לרכוב על אופניים', 'The morning someone taught me to ride a bike'), 'bike'),
              C(T('ריח הלחם בבית של סבתא', 'The smell of bread at my grandmother’s house'), 'bread'),
              C(T('הלילה שבו העגור ניקר בחלון', 'The night the crane tapped at my window'), 'crane')
            ])
          ]);
          S.flag('memory', mem || 'crane');
          const reply = mem === 'bike'
            ? T('זיכרון של מישהו שהחזיק — ואז שחרר. מתאים מאוד.', 'A memory of someone who held on — and then let go. Very fitting.')
            : mem === 'bread'
              ? T('חום שאפשר להריח. האופל שונא דברים כאלה.', 'Warmth you can smell. The Gloom hates that sort of thing.')
              : T('ההתחלה של הכול. בחירה אמיצה — הזיכרון הזה עוד צעיר, והוא יגדל יחד איתך.', 'The beginning of everything. A brave choice — that memory is still young, and it will grow along with you.');
          await S.say([
            L('orla', reply),
            L('orla', G('עכשיו. החזק את הזיכרון — ולחץ Q.', 'עכשיו. החזיקי את הזיכרון — ולחצי Q.', 'Now. Hold that memory — and press Q.'))
          ]);
        });
        S.unlockSpell('patronum');
        S.objective(T('להטיל אקספקטו פטרונום (Q)', 'Cast Expecto Patronum (Q)'));
        await S.waitEvent('spellCast', function (d) { return d && d.id === 'patronum'; });
        await S.wait(1400);
        await S.cutscene(async function () {
          await S.faceWho('orla');
          await S.say([
            L('orla', T('...הנה הוא. בכל פעם מחדש, זה עוצר לי את הנשימה.', '...There it is. Every single time, it takes my breath away.')),
            L('orla', G('קח את זה. מפתח המרתף. הרסיס השלישי שקע לשם — ואני חוששת שגם משהו אחר.', 'קחי את זה. מפתח המרתף. הרסיס השלישי שקע לשם — ואני חוששת שגם משהו אחר.', 'Take this. The crypt key. The third shard sank down there — and something else too, I fear.')),
            L('orla', G('האור הסגול שנועה ראתה לא בא מבחוץ. הוא בא מתוך הקירות. היזהר, {name}.', 'האור הסגול שנועה ראתה לא בא מבחוץ. הוא בא מתוך הקירות. היזהרי, {name}.', 'The violet light Noa saw didn’t come from outside. It came from within the walls. Be careful, {name}.')),
            L('tal', T('אני... אשמור על החצר. מישהו צריך. וזה לא קשור לזה שלמטה חשוך.', 'I’ll... guard the courtyard. Someone has to. And it has nothing to do with how dark it is down there.'))
          ]);
        });
        S.unlockDoor('entrance.toCrypt');
        S.unlockDoor('grounds.castleDoor');
        S.objective(T('לרדת אל המרתף', 'Descend into the crypt'));
        S.guide('crypt');
      } },
      { id: 'toCrypt', area: 'grounds', spawn: 'fromCastle', run: async function (S) {
        S.unlockDoor('entrance.toCrypt');
        S.objective(T('לרדת אל המרתף', 'Descend into the crypt'));
        S.guide('crypt');
        await S.waitArea('crypt');
      } }
    ] },

    // ------------------------------------------------------------- Ch 5
    { id: 'crypt', title: T('מתחת לטירה', 'Beneath the Castle'), subtitle: T('פרק שישי', 'Chapter Six'), steps: [
      { id: 'dark', area: 'crypt', spawn: 'fromEntrance', run: async function (S) {
        await S.cutscene(function () {
          return S.say([
            L(N, T('חושך. לא החושך של חדר בלילה — חושך סמיך, כזה שיש לו משקל.', 'Darkness. Not the darkness of a bedroom at night — a thick dark, the kind that has weight.')),
            L(N, G('אתה תופס את עצמך מחכה לקול של נועה, לצעקה של טיק. אבל אין כאן אף אחד. רק אתה.', 'את תופסת את עצמך מחכה לקול של נועה, לצעקה של טיק. אבל אין כאן אף אחד. רק את.', 'You catch yourself waiting for Noa’s voice, for one of Tik’s shrieks. But there is no one here. Only you.')),
            L(N, T('טוב. אז אור.', 'Fine. Light, then.'))
          ]);
        });
        if (!(ELD.spells && ELD.spells.lumosOn)) {
          S.objective(T('להדליק את השרביט (L)', 'Light your wand (L)'));
          await S.waitEvent('spellCast', function (d) { return d && d.id === 'lumos'; });
        }
      } },
      { id: 'ambush', area: 'crypt', spawn: 'fromEntrance', lockExits: true, run: async function (S) {
        S.objective(T('להתקדם לאורך המסדרון', 'Make your way down the corridor'));
        S.mark({ pos: { x: 0, y: 1.6, z: 22 } });
        await S.waitUntil(function () { const P = player(); return !!(P && P.pos && P.pos.z < 24); });
        S.mark(null);
        S.toast(T('משהו זז בחושך!', 'Something moves in the dark!'), 2200);
        S.sfx('shadeSpawn');
        const n = S.spawnWave(['cshade1', 'cshade2', 'cshade3', 'cshade4', 'cshade5'], 'crypt');
        let k = 0;
        S.objective(objLeft(n));
        await S.waitKills('crypt', n, function (c) { k = c; S.objective(objLeft(Math.max(0, n - k))); });
        S.flag('ambushDone', 1);
        S.objective(null);
        await S.say([L(N, G('הלב שלך דופק כמו שעון של ארקין. אבל אתה עדיין עומד.', 'הלב שלך דופק כמו שעון של ארקין. אבל את עדיין עומדת.', 'Your heart is pounding like one of Arkin’s clocks. But you are still standing.'))]);
      } },
      { id: 'shard3', area: 'crypt', spawn: 'fromEntrance', run: async function (S) {
        S.objective(T('למצוא את הרסיס השלישי', 'Find the third shard'));
        await S.pickup({ anchor: 'shard3', fb: { x: -5, y: 0.9, z: 10 }, label: T('לקחת את הרסיס', 'Take the shard'), radius: 2.4 });
        S.shards(3);
        await S.say([L(N, T('שלושת הרסיסים מזמזמים יחד בכיס שלך, חמים כמו כף יד.', 'All three shards hum together in your pocket, warm as a hand.'))]);
      } },
      { id: 'gate', area: 'crypt', spawn: 'fromEntrance', run: async function (S) {
        S.objective(T('לפתוח את שער הברזל', 'Open the iron gate'));
        await S.waitInteract({ anchor: 'gate', fb: { x: 0, y: 0, z: -4 }, label: T('להצמיד את הרסיסים לשער', 'Hold the shards to the gate'), radius: 2.6, lift: 1.8 });
        await S.cutscene(async function () {
          await S.say([L(N, T('הרסיסים מתחילים לזמזם. הסורגים רועדים, האבק נושר מהם — ואז, באנחה כבדה של ברזל, השער נפתח.', 'The shards begin to hum. The bars tremble, dust sifting down — and then, with a heavy iron sigh, the gate swings open.'))]);
          S.api('openGate');
          S.flag('gateOpen', 1);
          S.sfx('door');
          await S.wait(900);
        });
        S.objective(T('להיכנס לאולם הפנס', 'Enter the Lantern Chamber'));
        S.mark({ pos: { x: 0, y: 1.6, z: -12 } });
        await S.waitNear(0, -12, 5);
        S.mark(null);
      } }
    ] },

    // ------------------------------------------------------------- Ch 6
    { id: 'keeper', title: T('שומרת הפנסים', 'The Lantern Keeper'), subtitle: T('פרק שביעי', 'Chapter Seven'), steps: [
      { id: 'reveal', area: 'crypt', spawn: 'chamber', lockExits: true, exitMsg: T('אין דרך חזרה עכשיו.', 'There’s no turning back now.'), run: async function (S) {
        S.objective(null);
        await S.cutscene(async function () {
          await S.say([L(N, T('האור של השרביט שלך מתכווץ פתאום, כאילו משהו שותה אותו.', 'Your wand-light suddenly shrinks, as if something were drinking it.'))]);
          S.flag('morrowShown', 1);
          S.refreshCast();
          S.sfx('shadeSpawn');
          S.api('setChamberGlow', true); // her cracked lantern wakes the violet cracks
          // the pedestal and the dead lantern stand between the chamber mouth and Morrow: step aside to see her
          const spots = [[-4.2, -12.8], [4.2, -12.8], [-3, -11.5], [3, -11.5]];
          for (let i = 0; i < spots.length; i++) {
            if (S.freeSpot(spots[i][0], spots[i][1])) { await S.glide(spots[i][0], spots[i][1], 0.9); break; }
          }
          await S.faceWho('morrow');
          const v = await S.say([
            L('morrow', T('שלושה רסיסים. כל הכבוד. חסכת לי את החיפוש.', 'Three shards. Well done. You’ve saved me the trouble of looking.')),
            L('morrow', T('סֵלָה מורו. פעם — החניכה האחרונה של שומרי הפנסים. עד שהחליטו שאני... שאפתנית מדי.', 'Sela Morrow. Once — the last apprentice of the Lantern Keepers. Until they decided I was... too ambitious.')),
            L('morrow', T('רציתי רק שהאור יקשיב לי. במקום זה גירשו אותי. לפני עשרים שנה, בלילה בלי ירח.', 'All I wanted was for the light to listen to me. Instead, they cast me out. Twenty years ago, on a moonless night.')),
            L('morrow', T('אז כיביתי את התשיעי. כשפנס מת, כוחו של האופל זורם — ישר לתוך הפנס שלי.', 'So I put out the Ninth. When a lantern dies, the Gloom’s power flows — straight into my lantern.')),
            L('morrow', T('אור שרק מציית הוא אור מבוזבז, {name}. איתי, הוא יכול להיות הרבה יותר.', 'Light that only obeys is wasted light, {name}. With me, it could be so much more.'), [
              C(T('למה?', 'Why?'), 'why'),
              C(T('תחזירי את זה.', 'Give it back.'), 'back'),
              C(T('להצטרף אלייך? לעולם לא.', 'Join you? Never.'), 'never')
            ])
          ]);
          S.flag('revealChoice', v || 'never');
          let reply;
          if (v === 'why') reply = T('כי אף אחד לא שאל אותי אם אני רוצה לבלות את חיי בשמירה על האור של אחרים. אז עכשיו גם אני לא שואלת.', 'Because no one ever asked if I wanted to spend my life guarding other people’s light. So now, I don’t ask either.');
          else if (v === 'back') reply = G('להחזיר? איזו מילה מתוקה. בוא קח אותו, אם תוכל.', 'להחזיר? איזו מילה מתוקה. בואי קחי אותו, אם תוכלי.', 'Give it back? What a sweet phrase. Come and take it, if you can.');
          else reply = G('חבל. היית יכול להיות החניך שלי. אז תהיה המכשול שלי.', 'חבל. היית יכולה להיות החניכה שלי. אז תהיי המכשול שלי.', 'A pity. You could have been my apprentice. Then you’ll be my obstacle instead.');
          await S.say([L('morrow', reply)]);
          S.api('setChamberGlow', true);
          S.flag('chamberGlow', 1);
        });
      } },
      { id: 'boss', area: 'crypt', spawn: 'chamber', lockExits: true, run: async function (S) {
        ui('showHealth', true);
        S.heal();
        S.api('setChamberGlow', true);
        S.objective(T('להביס את סֵלָה מורו', 'Defeat Sela Morrow'));
        S.toast(T('המגן שלה סגול — אקספליארמוס (קליק ימני) ישבור אותו!', 'Her shield glows violet — Expelliarmus (right click) will break it!'), 3600);
        const boss = spawnBoss(S);
        if (!boss) { warn('boss could not be spawned; skipping fight'); S.flag('bossDone', 1); return; }
        ui('bossBar', TXT.morrowName, 1);
        await S.waitEvent('enemyKilled', function (d) { return d && d.enemy === boss; }, { skip: function () { try { ELD.combat.kill(boss); } catch (e) { /* ignore */ } } });
        ui('bossBar', null);
        const rest = ((ELD.combat && ELD.combat.enemies) || []).slice();
        for (let i = 0; i < rest.length; i++) if (rest[i].alive && rest[i].tag === 'bshade') { try { ELD.combat.kill(rest[i]); } catch (e) { /* ignore */ } }
        S.flag('bossDone', 1);
        S.objective(null);
        // the fight is won: bolts still in flight must not down the player (that would replay the fight)
        S.heal();
        await S.wait(600); // let the death animations (0.55 s) finish before sweeping the field
        S.clearCombat(); // also clears enemy bolts
        S.heal();
        await S.wait(600);
      } },
      { id: 'mercy', area: 'crypt', spawn: 'chamber', lockExits: true, exitMsg: T('לא עכשיו. הפנס מחכה.', 'Not now. The lantern is waiting.'), run: async function (S) {
        S.refreshCast();
        let v;
        await S.cutscene(async function () {
          await S.faceWho('morrow');
          v = await S.say([
            L(N, T('סֵלָה צונחת על ברכיה. הפנס הסדוק שלה מהבהב, סגול וחלש, כמו נשימה אחרונה.', 'Sela sinks to her knees. Her cracked lantern flickers, violet and faint, like a last breath.')),
            L('morrow', G('אז... זה נגמר. נו, גיבור קטן — מה עכשיו?', 'אז... זה נגמר. נו, גיבורה קטנה — מה עכשיו?', 'So... it’s over. Well, little hero — what now?'), [
              C(T('תחזירי את האור. עוד לא מאוחר מדי.', 'Give the light back. It isn’t too late.'), 'mercy'),
              C(T('המנהלת תשפוט אותך.', 'The Headmistress will judge you.'), 'judge')
            ])
          ]);
          const mercy = v !== 'judge';
          S.flag('mercy', mercy ? 1 : 0);
          S.flag('friendsCrypt', 1);
          S.refreshCast();
          S.sfx('door');
          await S.wait(600);
          await S.faceWho('orla');
          await S.say([
            L('orla', T('סֵלָה.', 'Sela.')),
            L('morrow', T('אורלה. עדיין מסתובבת עם האסטרולב הזה.', 'Orla. Still carrying that astrolabe around.'))
          ]);
          await S.faceWho('morrow');
          if (mercy) {
            await S.say([
              L('morrow', G('הילד הזה אמר לי שעוד לא מאוחר. אף אחד לא אמר לי את זה עשרים שנה.', 'הילדה הזאת אמרה לי שעוד לא מאוחר. אף אחד לא אמר לי את זה עשרים שנה.', 'This one told me it isn’t too late. No one has said that to me in twenty years.')),
              L('morrow', T('קחו אותו. את האור. הוא אף פעם לא באמת היה שלי.', 'Take it. The light. It was never really mine.')),
              L('orla', T('לא. אבל אולי, מתישהו, תעזרי לנו לשמור עליו. נדבר על זה. לאט.', 'No. But perhaps, one day, you’ll help us keep it. We will talk about that. Slowly.'))
            ]);
          } else {
            await S.say([
              L('morrow', T('לשפוט אותי. כמובן. בדיוק כמו בפעם הקודמת.', 'Judge me. Of course. Just like last time.')),
              L('orla', T('לא כמו בפעם הקודמת. הפעם אקשיב עד הסוף. אבל קודם — האור.', 'Not like last time. This time I will listen to the very end. But first — the light.')),
              L('morrow', T('...טוב. קחו אותו.', '...Fine. Take it.'))
            ]);
          }
          await S.say([L(N, T('סֵלָה פותחת את הפנס הסדוק. זרם של אור זהוב, שבוי ועייף, זולג ממנו ומתכרבל סביב הרסיסים שלך.', 'Sela opens the cracked lantern. A stream of golden light, captive and weary, spills out and curls around your shards.'))]);
          S.api('setChamberGlow', false);
          S.flag('chamberGlow', 0);
          await S.faceWho('noa');
          await S.say([
            L('noa', G('{name}! אתה בסדר? טיק כמעט התפוצץ מדאגה. מילולית. הוא מעלה קצת עשן.', '{name}! את בסדר? טיק כמעט התפוצץ מדאגה. מילולית. הוא מעלה קצת עשן.', '{name}! Are you okay? Tik nearly exploded with worry. Literally. He’s smoking a bit.')),
            L('tal', T('ירדתי. לחושך. בשבילך. שיירשם איפשהו.', 'I came down. Into the dark. For you. Let the record show.')),
            L('orla', T('{name} — הכן מחכה. הפנס התשיעי הוא שלך להדליק.', '{name} — the pedestal is waiting. The Ninth Lantern is yours to light.'))
          ]);
        });
        S.objective(T('להדליק מחדש את הפנס התשיעי', 'Rekindle the Ninth Lantern'));
      } },
      { id: 'relight', area: 'crypt', spawn: 'chamber', lockExits: true, exitMsg: T('לא עכשיו. הפנס מחכה.', 'Not now. The lantern is waiting.'), run: async function (S) {
        S.objective(T('להדליק מחדש את הפנס התשיעי', 'Rekindle the Ninth Lantern'));
        await S.waitInteract({ anchor: 'pedestal', fb: { x: 0, y: 1.2, z: -18 }, label: T('להניח את הרסיסים על הכן', 'Set the shards on the pedestal'), radius: 2.8, lift: 1 });
        await S.cutscene(async function () {
          S.api('setPedestalLit', true);
          S.api('setChamberGlow', false);
          S.flag('relit', 1);
          S.sfx('relight');
          ui('flash');
          ui('setShards', null);
          S.objective(null);
          await S.wait(1200);
          await S.say([
            L(N, T('האור פורץ מהכן כמו זריחה שהתחילה מתוך האדמה. הסדקים הסגולים נסגרים, אחד אחרי השני.', 'Light bursts from the pedestal like a sunrise that began underground. The violet cracks close, one after another.')),
            L('noa', T('טיק! תקליט את זה! ...הוא מקליט. הוא בוכה, אבל מקליט.', 'Tik! Record this! ...He’s recording. He’s crying, but he’s recording.')),
            L('orla', T('ועכשיו, לדעתי, מגיע לכולנו משתה. משתה אמיתי, הפעם.', 'And now, I believe, we have all earned a feast. A proper one, this time.'))
          ]);
          await S.fade(true, 900);
        });
      } }
    ] },

    // ------------------------------------------------------------- Epilogue
    { id: 'epilogue', title: T('האור התשיעי', 'The Ninth Light'), subtitle: T('אפילוג', 'Epilogue'), steps: [
      { id: 'celebrate', area: 'greathall', spawn: 'fromEntrance', run: async function (S) {
        for (let i = 1; i <= 9; i++) S.api('setLanternLit', i, true);
        S.api('setFeast', true);
        try { ELD.audio.music('feast'); } catch (e) { /* ignore */ }
        await S.cutscene(async function () {
          await S.faceWho('orla');
          await S.say([
            L('orla', T('תלמידים, מורים, ורוח רטנונית אחת שהסכימה לצאת מהספרייה לכבוד הערב.', 'Students, staff, and one grumpy ghost who agreed to leave the library for the occasion.')),
            L('elkan', T('ששש. ...כלומר, לחיים.', 'Shh. ...I mean, cheers.')),
            L('orla', G('אתמול כבה פנס. הלילה הוא בוער שוב — בזכות תלמיד שהגיע אלינו באיחור, על כנפי עגור נייר.', 'אתמול כבה פנס. הלילה הוא בוער שוב — בזכות תלמידה שהגיעה אלינו באיחור, על כנפי עגור נייר.', 'Last night a lantern went dark. Tonight it burns again — thanks to a student who reached us late, on the wings of a paper crane.')),
            L('orla', T('הרימו כוסות. לכבוד {name}!', 'Raise your cups. To {name}!')),
            L(N, T('האולם כולו מריע. פרופסור ארקין מפיל שעון מרוב התרגשות.', 'The whole hall cheers. Professor Arkin drops a clock from sheer excitement.')),
            L('dov', T('זה בסדר! הוא פיגר בשתי דקות בכל מקרה!', 'It’s fine! It was running two minutes slow anyway!')),
            L('orla', G('ועכשיו — לך אל החברים שלך. הם מחכים.', 'ועכשיו — לכי אל החברים שלך. הם מחכים.', 'And now — go to your friends. They’re waiting.'))
          ]);
        });
        const o = function (k) { return objCount('לדבר עם החברים שלך', 'Talk to your friends', k, 3); };
        S.objective(o(0));
        await S.talkAny({
          noa: [
            L('noa', T('{name}! אז ככה: בניתי לטיק כנפיים חדשות, והוא אמר את המילה הראשונה שלו. ...זה היה ״קריייק״, אבל בטון ממש חגיגי.', '{name}! So: I built Tik new wings, and he said his very first word. ...It was “skreek,” but in a really festive tone.')),
            L('tik', T('קריייק!', 'Skreek!')),
            L('noa', G('אתה יודע מה? אני שמחה שהעגור הביא דווקא אותך. החבר הכי טוב שלי בכל הטירה. ואני מכירה פה בדיוק שני אנשים.', 'את יודעת מה? אני שמחה שהעגור הביא דווקא אותך. החברה הכי טובה שלי בכל הטירה. ואני מכירה פה בדיוק שני אנשים.', 'You know what? I’m glad the crane brought you, of all people. My best friend in the whole castle. And I know exactly two people here.'))
          ],
          tal: [
            L('tal', T('אז... ניצחת שומרת פנסים בחושך. אני, בינתיים, החזקתי פנס בשביל פרופסור ארקין.', 'So... you beat a Lantern Keeper in the dark. Meanwhile, I held a lantern for Professor Arkin.')),
            L('tal', T('אני עדיין לא אוהב את החושך. אבל מסתבר שאני אוהב עוד פחות לתת לחברים שלי לרדת לשם לבד.', 'I still don’t like the dark. But it turns out I like letting my friends go down there alone even less.')),
            L('tal', T('יריבים? ...לא. שותפים. אבל בשיעור הבא אני מנצח אותך בבובות.', 'Rivals? ...No. Partners. But next lesson, I’m beating you at the dummies.'))
          ],
          pebble: [
            L('pebble', T('שלוש מאות ושתים עשרה מדרגות. ספרתי. לגרגויל אין ברכיים, {name}! יש לו אבן! אבן כואבת!', 'Three hundred and twelve stairs. I counted. A gargoyle has no knees, {name}! He has stone! Aching stone!')),
            L('pebble', T('אבל הייתי חייב לבוא. שמעתי שמישהו מהשער שלי הציל את הטירה.', 'But I had to come. I heard someone from MY gate saved the castle.')),
            L('pebble', G('אני... גאה בך, טוב? אל תספר לאף אחד. יש לי מוניטין. של אבן.', 'אני... גאה בך, טוב? אל תספרי לאף אחד. יש לי מוניטין. של אבן.', 'I’m... proud of you, all right? Don’t tell anyone. I have a reputation. Of stone.'))
          ]
        }, function (k) { S.objective(o(k)); });
        S.objective(null);
        await S.wait(600);
      } },
      { id: 'credits', area: 'greathall', spawn: 'fromEntrance', run: async function (S) {
        await S.cutscene(function () {
          return S.say([
            L(N, T('מאוחר יותר באותו לילה, תשעה פנסים בוערים מעל האגם השחור. האופל, אי שם מעבר למים, מחכה — כמו תמיד.', 'Later that night, nine lanterns burn above the black lake. The Gloom, somewhere beyond the water, waits — as it always does.')),
            L(N, G('אבל הלילה אתה ישן בשקט. גם טיק. בעיקר טיק.', 'אבל הלילה את ישנה בשקט. גם טיק. בעיקר טיק.', 'But tonight, you sleep soundly. So does Tik. Especially Tik.'))
          ]);
        });
        await S.fade(true, 900);
        markCompleted();
        const cr = S.credits(CREDITS);
        ui('fade', false, 400);
        await cr;
        markCompleted();
        R.active = false;
        ui('showTitle');
      } }
    ] }
  ];

  // =====================================================================
  // 15. BOSS (Sela Morrow) — via core combat API
  // =====================================================================
  function spawnBoss(S) {
    if (!ELD.combat || typeof ELD.combat.spawnEnemy !== 'function') return null;
    const model = makeNpc('morrow');
    const a = anchor('morrow') || { x: 0, y: 0, z: -26 };
    const ctr = anchor('pedestal') || { x: 0, z: -18 };
    const RAD = 8;
    const st = {
      cx: ctr.x, cz: ctr.z,
      ang: Math.atan2(a.z - ctr.z, a.x - ctr.x), target: 0,
      shieldT: 0, fireT: 2.2, moveT: 6, poseT: 0, tauntT: 9, tauntI: 0,
      p1: false, p2: false, hinted: false, patHint: false
    };
    st.target = st.ang;
    function summon() {
      const names = ['bshade1', 'bshade2', 'bshade3', 'bshade4'];
      const skip = Math.floor(Math.random() * 4);
      let n = 0;
      for (let i = 0; i < 4 && n < 3; i++) {
        if (i === skip) continue;
        const b = anchor(names[i]);
        const ang = i * PI / 2;
        const x = b ? b.x : ctr.x + Math.cos(ang) * 8, z = b ? b.z : ctr.z + Math.sin(ang) * 8;
        try { if (ELD.combat.spawnShade(x, 1.5, z, { tag: 'bshade' })) n++; } catch (e) { /* ignore */ }
      }
    }
    function bar(e) { ui('bossBar', TXT.morrowName, Math.max(0, e.hp / e.maxHp)); }
    function setPose(p) { if (model) { try { model.setPose(p); } catch (e) { /* ignore */ } } }
    const def = {
      kind: 'boss', model: model || undefined, x: a.x, z: a.z, hp: 24, speed: 0, radius: 1.25, tag: 'boss',
      onHit: function (e, spell) {
        if (!e.alive) return false;
        if (e.shielded) {
          if (spell === 'expelliarmus') {
            e.shielded = false;
            st.shieldT = 5;
            e.stunned = Math.max(e.stunned || 0, 1);
            sfx('shield');
            ui('toast', T('המגן הסגול מתנפץ! עכשיו!', 'The violet shield shatters! Now!'), 1600);
          } else {
            sfx('shield');
            if (spell === 'stupefy' && !st.hinted) {
              st.hinted = true;
              ui('toast', G('הלחש ניתז מהמגן! נסה אקספליארמוס (קליק ימני).', 'הלחש ניתז מהמגן! נסי אקספליארמוס (קליק ימני).', 'The spell bounces off the shield! Try Expelliarmus (right click).'), 2600);
            } else if (spell === 'patronum' && !st.patHint) {
              st.patHint = true;
              ui('toast', T('המגן בולע את הפטרונוס. קודם צריך לשבור אותו!', 'The shield swallows the Patronus. Break it first!'), 2600);
            }
          }
          return false;
        }
        const dmg = spell === 'patronum' ? 4 : 1;
        e.hp = Math.max(0, e.hp - dmg);
        sfx('bossHit');
        if (model && typeof model.flash === 'function') { try { model.flash(); } catch (err) { /* ignore */ } }
        if (spell === 'stupefy') e.stunned = Math.max(e.stunned || 0, 0.3);
        bar(e);
        if (e.hp <= 0) { try { ELD.combat.kill(e); } catch (err) { /* ignore */ } return false; }
        if (!st.p1 && e.hp <= e.maxHp * 0.5) {
          st.p1 = true; summon();
          ui('toast', T('סלה: צללים — אליי!', 'Sela: Shades — to me!'), 2400);
        } else if (!st.p2 && e.hp <= e.maxHp * 0.25) {
          st.p2 = true; summon();
          ui('toast', T('סלה: לא! האור שלי! שלי!', 'Sela: No! My light! Mine!'), 2400);
        }
        return false;
      },
      update: function (e, dt) {
        if (!e.alive) return;
        if (!e.shielded) {
          st.shieldT -= dt;
          if (st.shieldT <= 0) { e.shielded = true; sfx('shield'); ui('toast', T('סלה: חשבת שזה כל כך פשוט?', 'Sela: Did you think it would be that simple?'), 2000); }
        }
        if (st.poseT > 0) { st.poseT -= dt; if (st.poseT <= 0) setPose('idle'); }
        // glide along the chamber ring (never through the pedestal)
        let d = st.target - st.ang;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        const stepA = (e.stunned > 0 ? 0 : 0.7) * dt;
        st.ang += Math.abs(d) <= stepA ? d : Math.sign(d) * stepA;
        e.pos.x = st.cx + Math.cos(st.ang) * RAD;
        e.pos.z = st.cz + Math.sin(st.ang) * RAD;
        if (e.stunned > 0) return;
        st.moveT -= dt;
        if (st.moveT <= 0) { st.moveT = 6; st.target = st.ang + (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 1.6); }
        st.fireT -= dt;
        if (st.fireT <= 0) {
          st.fireT = 2.4;
          const P = player();
          if (P && P.pos) {
            try {
              ELD.combat.enemyBolt({ from: { x: e.pos.x, y: e.pos.y + 0.4, z: e.pos.z }, to: { x: P.pos.x, y: (P.pos.y || 0) + 1.45, z: P.pos.z }, speed: 14, damage: 12, color: '#b06cff' });
            } catch (err) { /* ignore */ }
            setPose('cast'); st.poseT = 0.5;
          }
        }
        st.tauntT -= dt;
        if (st.tauntT <= 0) { st.tauntT = 10 + Math.random() * 4; ui('toast', BOSS_TAUNTS[st.tauntI++ % BOSS_TAUNTS.length], 2200); }
      }
    };
    let boss = null;
    try { boss = ELD.combat.spawnEnemy(def); } catch (e) { warn('spawnEnemy(boss) failed', e); boss = null; }
    if (boss) boss.shielded = true;
    else disposeNpc(model);
    return boss;
  }

  // =====================================================================
  // 16. RUNNER
  // =====================================================================
  function saveData(completed) {
    const p = ELD.profile || {};
    return { v: 1, chapter: R.chapter, step: R.step, profile: { name: p.name, gender: p.gender === 'f' ? 'f' : 'm' }, flags: clone(R.flags), completed: !!completed };
  }
  function saveCheckpoint() {
    R.snap = clone(R.flags);
    try { if (ELD.save && ELD.save.store) ELD.save.store(saveData(false)); } catch (e) { /* ignore */ }
  }
  function markCompleted() {
    R.completed = true;
    try { if (ELD.save && ELD.save.store) ELD.save.store(saveData(true)); } catch (e) { /* ignore */ }
  }

  function abortRun() {
    if (R.tok) abortToken(R.tok);
    R.tok = null;
    flushDialogue();
    R.pendingTalk = {};
    R.hints = {};
    const ias = R.ias.splice(0, R.ias.length);
    for (let i = 0; i < ias.length; i++) { try { ELD.removeInteractable(ias[i].id); } catch (e) { /* ignore */ } }
    clearProps();
    R.tickFns.length = 0;
    R.timers.length = 0;
    hideSparks();
    R.goal = null;
    ui('setMarker', null);
    ui('bossBar', null);
    setFrozen(false);
  }

  async function runFrom(ch, st, opts) {
    opts = opts || {};
    abortRun();
    const tok = newToken();
    const S = makeS(tok);
    R.active = true;
    R.completed = false;
    R.chapter = Math.max(0, Math.min(CHAPTERS.length - 1, ch | 0));
    R.step = Math.max(0, st | 0);
    R.flags = normFlags(R.flags);
    let first = true;
    while (!tok.aborted && R.chapter < CHAPTERS.length) {
      const chap = CHAPTERS[R.chapter];
      if (R.step >= chap.steps.length) { R.chapter++; R.step = 0; continue; }
      const step = chap.steps[R.step];
      try {
        R.pendingTalk = {};
        R.hints = {};
        saveCheckpoint();
        const force = first && !!opts.force;
        if (force || !ELD.area || ELD.area.id !== step.area) {
          await tokWait(tok, function (w) {
            let p; try { p = ELD.loadArea(step.area, step.spawn); } catch (e) { p = null; }
            Promise.resolve(p).then(function () { w.resolve(); }, function () { w.resolve(); });
          });
        }
        if (tok.aborted) return;
        setupStep(R.chapter, step, first);
        if (R.step === 0 && !(first && opts.retry)) await S.card(chap.title, chap.subtitle);
        first = false;
        await step.run(S);
      } catch (e) {
        if (e === ABORT || tok.aborted) return;
        console.error('[ELD story] step "' + chap.id + '/' + step.id + '" failed:', e);
      }
      if (tok.aborted) return;
      first = false;
      R.step++;
    }
    if (!tok.aborted) R.active = false;
  }

  async function recover(withToast) {
    if (R.recovering) return;
    R.recovering = true;
    const ch = R.chapter, st = R.step;
    abortRun();
    try { if (ELD.combat) ELD.combat.clear(); } catch (e) { /* ignore */ }
    // a quit-to-title or a fresh start/Continue during the death fade supersedes this recovery
    const gen = R.gen;
    try {
      if (withToast) {
        await Promise.resolve(ui('fade', true, 600));
        if (!R.active || R.gen !== gen || ELD.state === 'title') return;
        ui('toast', TXT.down, 3400);
      }
      const P = player();
      if (P && P.heal) P.heal(P.maxHealth || 100);
      R.flags = normFlags(clone(R.snap || R.flags));
    } finally { R.recovering = false; }
    return runFrom(ch, st, { force: true, retry: true });
  }

  // =====================================================================
  // 17. GLOBAL LISTENERS (registered once at load; cheap)
  // =====================================================================
  if (typeof ELD.on === 'function') {
    ELD.on('areaLoaded', function (d) {
      if (!R.active || !d) return;
      R.flags.visited = R.flags.visited || {};
      R.flags.visited[d.id] = 1;
      restoreAreaState(d.id);
      for (let i = 0; i < R.props.length; i++) R.props[i].npc = null; // old group was disposed by core
      R.castArea = null;
      refreshCast(true);
      for (let i = 0; i < R.ias.length; i++) addIAToCore(R.ias[i]);
      for (let i = 0; i < R.props.length; i++) spawnProp(R.props[i]);
      refreshMarker();
    });
    ELD.on('tick', function (dt, t) {
      if (!R.active) return;
      dt = +dt || 0;
      if (R.timers.length) {
        const due = [];
        for (let i = R.timers.length - 1; i >= 0; i--) {
          const tm = R.timers[i];
          if (tm.tok && tm.tok.aborted) { R.timers.splice(i, 1); continue; }
          tm.left -= dt;
          if (tm.left <= 0) { R.timers.splice(i, 1); due.push(tm); }
        }
        for (let i = 0; i < due.length; i++) { try { due[i].fn(); } catch (e) { warn('timer failed', e); } }
      }
      if (R.tickFns.length) {
        const fns = R.tickFns.slice();
        for (let i = 0; i < fns.length; i++) { try { fns[i](dt, t); } catch (e) { warn('tick fn failed', e); } }
      }
      updateCast(dt, t);
      updateSparks(dt);
    });
    // a cast member who chimes in from outside the view gets the camera turned toward them
    ELD.on('dialogueLine', function (d) {
      if (!R.active || !d || !d.who || d.who === 'player') return;
      const c = findCast(d.who === 'tik' ? 'noa' : d.who);
      const P = player();
      if (!c || !P || !P.faceTowards || !ELD.three || !ELD.three.camera) return;
      const o = c.npc.object3D.position;
      const want = Math.atan2(-(o.x - P.pos.x), -(o.z - P.pos.z));
      const off = Math.abs(Math.atan2(Math.sin(want - P.yaw), Math.cos(want - P.yaw)));
      const halfFov = Math.atan(Math.tan((ELD.three.camera.fov || 70) * Math.PI / 360) * (ELD.three.camera.aspect || 1.6));
      if (off < halfFov * 0.7) return; // already comfortably in view
      try { P.faceTowards(o.x, o.z, 350, o.y + (c.npc.height || 1.6) * 0.85); } catch (e) { /* ignore */ }
    });
    ELD.on('playerDown', function () {
      if (!R.active || R.recovering) return;
      recover(true);
    });
    ELD.on('title', function () {
      abortRun();
      R.active = false;
      clearCast();
    });
  }

  // =====================================================================
  // 18. PUBLIC API
  // =====================================================================
  ELD.story = {
    CHAPTERS: CHAPTERS,
    start: function (save) {
      let ch = 0, st = 0;
      const ok = save && typeof save === 'object' && save.v === 1 && !save.completed &&
        typeof save.chapter === 'number' && save.chapter >= 0 && save.chapter < CHAPTERS.length &&
        typeof save.step === 'number' && save.step >= 0 && save.step < CHAPTERS[save.chapter].steps.length;
      if (ok) {
        R.flags = normFlags(clone(save.flags));
        if (save.profile && save.profile.name) ELD.profile = { name: String(save.profile.name).slice(0, 14), gender: save.profile.gender === 'f' ? 'f' : 'm' };
        ch = save.chapter; st = save.step;
      } else {
        R.flags = presetFlags(0);
      }
      R.snap = clone(R.flags);
      R.ambIdx = {};
      applySpells();
      return runFrom(ch, st, { force: true, retry: st > 0 });
    },
    restartStep: function () {
      if (!R.active) return;
      recover(false);
    },
    skip: function () {
      const tok = R.tok;
      if (!tok || tok.aborted || !tok.waits.length) return false;
      const w = tok.waits[tok.waits.length - 1];
      if (w.skip) w.skip(); else w.resolve();
      return true;
    },
    goto: function (chapterIndex) {
      const ch = Math.max(0, Math.min(CHAPTERS.length - 1, chapterIndex | 0));
      abortRun();
      try { if (ELD.combat) ELD.combat.clear(); } catch (e) { /* ignore */ }
      R.flags = presetFlags(ch);
      R.snap = clone(R.flags);
      const P = player();
      if (P && P.heal) P.heal(P.maxHealth || 100);
      applySpells();
      return runFrom(ch, 0, { force: true });
    },
    info: function () {
      const chap = CHAPTERS[R.chapter];
      const step = chap ? chap.steps[R.step] : null;
      return {
        chapter: R.chapter, step: R.step, stepId: step ? step.id : null, chapterId: chap ? chap.id : null,
        objective: R.objective ? tx(R.objective) : null, shards: R.flags.shards || 0,
        completed: R.completed, active: R.active
      };
    },
    // extras for debugging/tests
    castFor: function (areaId) { return castFor(areaId); },
    guide: function (areaId) { setGoal(areaId ? { area: areaId } : null); },
    flags: function () { return R.flags; }
  };
})();
