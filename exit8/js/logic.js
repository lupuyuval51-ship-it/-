/* EXIT 8 — pure game logic (no DOM, no WebGL).
 * Loaded as a classic <script> in the browser and imported by the node tests.
 *
 * The corridor loop lives in a fixed "loop frame" (metres, X right, Z forward, Y up):
 *
 *   Lnext ┐                  each loop is   L ─ C1 ─ H ─ C2 ─ (next L)
 *         C2 ┐               L  = lobby with the exit-number sign
 *            H (hallway)     C1 = connector from the lobby into the hallway
 *         C1 ┘               H  = the long hallway where anomalies live
 *   L ────┘                  C2 = connector to the next lobby
 *   C2prev┘
 *
 * Every connector is point-symmetric about its own centre, so walking back through
 * C1 can be mapped onto walking forward through C2prev with a 180° turn, and walking
 * forward through C2 is a pure translation by D. The player never sees the seam.
 */
(function (root) {
  'use strict';
  const E = (root.EXIT8 = root.EXIT8 || {});

  const W = 3;              // corridor width
  const CEIL = 3;           // ceiling height
  const LOBBY = 16;         // lobby length
  const HALL = 32;          // normal hallway length
  const HALL_LONG = 48;     // "corridor too long" anomaly
  const STAIRS = 13;        // exit staircase run
  const STAIR_RISE = 4.5;

  const TRIG_FWD = 13.5;    // C2 midline: crossing it +X means "kept going"
  const TRIG_BACK = 4.5;    // C1 midline: crossing it -X (after arming) means "turned back"
  const TRIG_START = -5;    // just behind the arrival point in C2prev: crossing -X means "turned back"
  const ARM_X = 5.5;        // the player must reach this far into C1 before C1 counts as a turn-back
  const SPAWN = { x: 0, z: 2.2, yaw: 0 };
  const ARRIVAL_X = -4.5;
  const MAX_COUNT = 8;

  function layout(opts) {
    const hl = (opts && opts.hl) || HALL;
    const exit = !!(opts && opts.exit);
    const rects = [
      { id: 'Lprev', x0: -19.5, x1: -16.5, z0: -32, z1: -26 },
      { id: 'C1prev', x0: -16.5, x1: -10.5, z0: -29, z1: -26 },
      { id: 'Hprev', x0: -10.5, x1: -7.5, z0: -29, z1: 3 },
      { id: 'C2prev', x0: -7.5, x1: -1.5, z0: 0, z1: 3 },
      { id: 'L', x0: -1.5, x1: 1.5, z0: 0, z1: LOBBY },
      { id: 'C1', x0: 1.5, x1: 7.5, z0: 13, z1: 16 },
      { id: 'H', x0: 7.5, x1: 10.5, z0: 13, z1: 13 + hl },
    ];
    if (exit) {
      rects.push({ id: 'S', x0: 7.5, x1: 10.5, z0: 13 + hl, z1: 13 + hl + STAIRS, stairs: true });
    } else {
      rects.push({ id: 'C2', x0: 10.5, x1: 16.5, z0: 10 + hl, z1: 13 + hl });
      rects.push({ id: 'Lnext', x0: 16.5, x1: 19.5, z0: 10 + hl, z1: 26 + hl });
    }
    return { hl, exit, D: { x: 18, z: hl + 10 }, rects };
  }

  function rectById(lay, id) {
    for (const r of lay.rects) if (r.id === id) return r;
    return null;
  }

  function inRect(r, x, z, pad) {
    const p = pad || 0;
    return x >= r.x0 - p && x <= r.x1 + p && z >= r.z0 - p && z <= r.z1 + p;
  }

  function walkable(lay, x, z) {
    for (const r of lay.rects) if (inRect(r, x, z, 1e-6)) return true;
    return false;
  }

  /** True when a player of radius rad can stand at (x, z). */
  function canStand(lay, x, z, rad) {
    return walkable(lay, x - rad, z - rad) && walkable(lay, x + rad, z - rad) &&
      walkable(lay, x - rad, z + rad) && walkable(lay, x + rad, z + rad);
  }

  function floorY(lay, x, z) {
    if (!lay.exit) return 0;
    const s = rectById(lay, 'S');
    if (!s || !inRect(s, x, z)) return 0;
    const t = (z - (s.z0 + 1)) / (STAIRS - 3);
    return Math.max(0, Math.min(1, t)) * STAIR_RISE;
  }

  function reachedExit(lay, x, z) {
    return lay.exit && z > 13 + lay.hl + STAIRS - 2.2;
  }

  /**
   * Checks whether moving from prev to cur leaves the current loop.
   * Returns null, or { type: 'forward' | 'back', x, z, turn } where (x, z) is the
   * player's new position in the next loop frame and turn is added to the yaw.
   */
  function transition(lay, prev, cur, armed) {
    const hl = lay.hl;
    if (!lay.exit && prev.x < TRIG_FWD && cur.x >= TRIG_FWD && cur.z >= 9.5 + hl && cur.z <= 13.5 + hl) {
      return { type: 'forward', via: 'C2', x: cur.x - lay.D.x, z: cur.z - lay.D.z, turn: 0 };
    }
    if (armed && prev.x > TRIG_BACK && cur.x <= TRIG_BACK && cur.z >= 12.5 && cur.z <= 16.5) {
      return { type: 'back', via: 'C1', x: -cur.x, z: LOBBY - cur.z, turn: Math.PI };
    }
    if (prev.x > TRIG_START && cur.x <= TRIG_START && cur.z >= -0.5 && cur.z <= 3.5) {
      return { type: 'back', via: 'start', x: -9 - cur.x, z: 3 - cur.z, turn: Math.PI };
    }
    return null;
  }

  /** The rule of the game: turn back if and only if something is wrong. */
  function resolve(count, anomaly, type) {
    const correct = (type === 'back') === !!anomaly;
    return { correct, count: correct ? Math.min(count + 1, MAX_COUNT) : 0 };
  }

  // scare: 1 = unsettling, 2 = creepy, 3 = frightening. Deeper in a run, the frightening ones get likelier.
  const ANOMALIES = [
    { id: 'lights_off', he: 'האורות כבו', en: 'Lights out', scare: 2 },
    { id: 'light_red', he: 'מנורה אדומה', en: 'Red lamp', scare: 2 },
    { id: 'light_flicker', he: 'מנורה מהבהבת', en: 'Flickering lamp', scare: 1 },
    { id: 'poster_eyes', he: 'העיניים בפוסטר עוקבות אחריך', en: 'The poster is watching', scare: 2 },
    { id: 'poster_face', he: 'הפנים שלו על פוסטר', en: 'His face on a poster', scare: 2 },
    { id: 'poster_upside', he: 'פוסטר הפוך', en: 'Upside-down poster', scare: 1 },
    { id: 'poster_blank', he: 'פוסטר חסר', en: 'Missing poster', scare: 1 },
    { id: 'door_ajar', he: 'דלת פתוחה לחושך', en: 'Door ajar', scare: 2 },
    { id: 'door_extra', he: 'דלת שלא הייתה שם', en: 'An extra door', scare: 1 },
    { id: 'extinguisher_missing', he: 'ארון המטף נעלם', en: 'Missing extinguisher', scare: 1 },
    { id: 'exit_sign_flip', he: 'שלט יציאת חירום במראה', en: 'Mirrored emergency sign', scare: 1 },
    { id: 'clock_spin', he: 'השעון משתולל', en: 'Racing clock', scare: 1 },
    { id: 'vent_eyes', he: 'עיניים בפתח האוורור', en: 'Eyes in the vent', scare: 2 },
    { id: 'handprints', he: 'טביעות ידיים אדומות', en: 'Red handprints', scare: 2 },
    { id: 'footprints', he: 'עקבות רטובים לתוך הקיר', en: 'Wet footprints into the wall', scare: 2 },
    { id: 'ceiling_low', he: 'התקרה ירדה', en: 'Low ceiling', scare: 1 },
    { id: 'wall_stain', he: 'כתם שחור על הקיר', en: 'Black stain', scare: 1 },
    { id: 'tactile_veer', he: 'פס ההכוונה סוטה לקיר', en: 'Tactile path veers into the wall', scare: 1 },
    { id: 'corridor_long', he: 'המסדרון ארוך מדי', en: 'Corridor too long', scare: 1 },
    { id: 'red_wave', he: 'גל אדום', en: 'Red wave', scare: 3 },
    { id: 'man_giant', he: 'האיש הענק', en: 'Giant man', scare: 2 },
    { id: 'man_ceiling', he: 'האיש הולך על התקרה', en: 'Man on the ceiling', scare: 3 },
    { id: 'man_stare', he: 'האיש לא מוריד ממך את העיניים', en: 'Staring man', scare: 2 },
    { id: 'man_stop', he: 'האיש עוצר ומסתכל', en: 'Man stops and stares', scare: 2 },
    { id: 'man_chase', he: 'האיש רודף אחריך', en: 'Man gives chase', scare: 3 },
    { id: 'man_many', he: 'יותר מדי אנשים', en: 'Too many men', scare: 2 },
    { id: 'man_follow', he: 'מישהו הולך מאחוריך', en: 'Someone behind you', scare: 3 },
    { id: 'man_smile', he: 'חיוך מפחיד', en: 'Creepy smile', scare: 3 },
    { id: 'man_backward', he: 'האיש הולך אחורה', en: 'Walking backward', scare: 2 },
    { id: 'shadow_figure', he: 'צללית בסוף המסדרון', en: 'Shadow at the end', scare: 2 },
    { id: 'man_crawl', he: 'האיש זוחל על הרצפה', en: 'The man crawls', scare: 3 },
    { id: 'wall_face', he: 'פנים בתוך הקיר', en: 'A face in the wall', scare: 3 },
    { id: 'wall_eyes', he: 'עיניים על הקיר', en: 'Eyes on the wall', scare: 3 },
    { id: 'scrawl', he: 'כתובת אדומה על הקיר', en: 'Red scrawl', scare: 2 },
    { id: 'blood_pool', he: 'שלולית אדומה מתחת לדלת', en: 'Red pool under the door', scare: 2 },
  ];
  const ANOMALY_IDS = ANOMALIES.map(a => a.id);

  /**
   * Picks the anomaly (or null) for the next loop.
   * opts: { first, chance, recent: [ids], found: Set|Array, intensity: 0..1 }
   */
  function pickAnomaly(rng, opts) {
    const o = opts || {};
    if (o.first) return null;
    const chance = o.chance == null ? 0.6 : o.chance;
    if (rng() >= chance) return null;
    const recent = new Set(o.recent || []);
    const found = new Set(o.found || []);
    const intensity = Math.max(0, Math.min(1, o.intensity || 0));
    let pool = ANOMALIES.filter(a => !recent.has(a.id));
    if (!pool.length) pool = ANOMALIES.slice();
    // Unseen anomalies are twice as likely, so a run keeps surprising the player;
    // the deeper the run, the more the frightening ones are favoured.
    const weights = pool.map(a => (found.has(a.id) ? 1 : 2) * (1 + intensity * (a.scare - 1)));
    let r = rng() * weights.reduce((sum, w) => sum + w, 0);
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r < 0) return pool[i].id;
    }
    return pool[pool.length - 1].id;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Main walking route used by chasers: lobby → C1 → hallway centre lines. */
  function route(lay) {
    return [[0, 0], [0, 14.5], [9, 14.5], [9, lay.hl + 13]];
  }

  /** Arc-length coordinate of (x, z) projected on the route. */
  function routeS(lay, x, z) {
    const pts = route(lay);
    let best = Infinity, bestS = 0, acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      let t = ((x - ax) * dx + (z - az) * dz) / (len * len);
      t = Math.max(0, Math.min(1, t));
      const px = ax + dx * t, pz = az + dz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < best) { best = d; bestS = acc + t * len; }
      acc += len;
    }
    return bestS;
  }

  /** Point and heading on the route at arc length s. */
  function routePoint(lay, s) {
    const pts = route(lay);
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      if (s <= acc + len || i === pts.length - 2) {
        const t = Math.max(0, Math.min(1, (s - acc) / len));
        return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, dx: (bx - ax) / len, dz: (bz - az) / len };
      }
      acc += len;
    }
    return { x: 0, z: 0, dx: 0, dz: 1 };
  }

  function formatTime(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  }

  Object.assign(E, {
    W, CEIL, LOBBY, HALL, HALL_LONG, STAIRS, STAIR_RISE, MAX_COUNT,
    TRIG_FWD, TRIG_BACK, TRIG_START, ARM_X, SPAWN, ARRIVAL_X,
    layout, rectById, inRect, walkable, canStand, floorY, reachedExit,
    transition, resolve, ANOMALIES, ANOMALY_IDS, pickAnomaly, mulberry32,
    route, routeS, routePoint, formatTime,
  });
})(typeof window !== 'undefined' ? window : globalThis);
