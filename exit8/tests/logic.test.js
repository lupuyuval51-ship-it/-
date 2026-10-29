// EXIT 8 — logic and world tests. Run with: node --test exit8/tests/
import test from 'node:test';
import assert from 'node:assert/strict';

await import('../js/logic.js');
await import('../js/i18n.js');
await import('../js/textures.js');
await import('../js/world.js');
await import('../js/renderer.js'); // only for its matrix helpers
await import('../js/actors.js');
const E = globalThis.EXIT8;

test('the rule: turn back only when something is wrong', () => {
  assert.deepEqual(E.resolve(0, null, 'forward'), { correct: true, count: 1 });
  assert.deepEqual(E.resolve(3, 'man_giant', 'back'), { correct: true, count: 4 });
  assert.deepEqual(E.resolve(5, null, 'back'), { correct: false, count: 0 });
  assert.deepEqual(E.resolve(7, 'light_red', 'forward'), { correct: false, count: 0 });
  assert.equal(E.resolve(8, null, 'forward').count, 8, 'count never passes 8');
});

test('crossing the far connector moves forward by D', () => {
  const lay = E.layout({});
  const tr = E.transition(lay, { x: 13.4, z: 43 }, { x: 13.6, z: 43 }, true);
  assert.equal(tr.type, 'forward');
  assert.equal(tr.turn, 0);
  assert.ok(Math.abs(tr.x - (13.6 - 18)) < 1e-9 && Math.abs(tr.z - 1) < 1e-9);
  const long = E.layout({ hl: E.HALL_LONG });
  const tr2 = E.transition(long, { x: 13.4, z: 59 }, { x: 13.6, z: 59 }, true);
  assert.equal(tr2.type, 'forward');
  assert.ok(Math.abs(tr2.z - 1) < 1e-9, 'long corridor arrives at the same spot');
});

test('turning back through C1 counts only after entering it', () => {
  const lay = E.layout({});
  assert.equal(E.transition(lay, { x: 4.6, z: 14 }, { x: 4.4, z: 14 }, false), null);
  const tr = E.transition(lay, { x: 4.6, z: 14 }, { x: 4.4, z: 14 }, true);
  assert.equal(tr.type, 'back');
  assert.equal(tr.turn, Math.PI);
  assert.ok(Math.abs(tr.x + 4.4) < 1e-9 && Math.abs(tr.z - 2) < 1e-9);
});

test('walking back out of the start also counts as turning back', () => {
  const lay = E.layout({});
  const tr = E.transition(lay, { x: -4.9, z: 1 }, { x: -5.1, z: 1 }, false);
  assert.equal(tr.type, 'back');
  assert.ok(Math.abs(tr.x - (-9 + 5.1)) < 1e-9 && Math.abs(tr.z - 2) < 1e-9);
  // Arrival points are never on a trigger line, so the player cannot bounce.
  assert.ok(tr.x > E.TRIG_START);
});

test('no transition while walking inside the loop', () => {
  const lay = E.layout({});
  for (const [a, b] of [[[0, 3], [0, 3.2]], [[9, 20], [9, 21]], [[6, 14], [6.2, 14]], [[12, 43], [12.5, 43]]]) {
    assert.equal(E.transition(lay, { x: a[0], z: a[1] }, { x: b[0], z: b[1] }, true), null);
  }
});

// Each seam is invisible only if the space around it is identical after the mapping.
const SEAMS = [
  { name: 'C1 (turn back)', cx: 4.5, cz: 14.5, map: (x, z) => [-x, 16 - z], hl: E.HALL },
  { name: 'start (turn back)', cx: -4.5, cz: 1.5, map: (x, z) => [-9 - x, 3 - z], hl: E.HALL },
  { name: 'C2 (forward)', cx: 13.5, cz: 43.5, map: (x, z) => [x - 18, z - 42], hl: E.HALL },
  { name: 'C2 long (forward)', cx: 13.5, cz: 59.5, map: (x, z) => [x - 18, z - 58], hl: E.HALL_LONG },
];

test('walkable space is identical on both sides of every seam', () => {
  const next = E.layout({});
  for (const s of SEAMS) {
    const lay = E.layout({ hl: s.hl });
    const rnd = E.mulberry32(7);
    for (let i = 0; i < 4000; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 7.5;
      const x = s.cx + Math.cos(a) * r, z = s.cz + Math.sin(a) * r;
      const [mx, mz] = s.map(x, z);
      assert.equal(E.walkable(lay, x, z), E.walkable(next, mx, mz), `${s.name}: (${x.toFixed(2)}, ${z.toFixed(2)})`);
    }
  }
});

test('lamps around every seam match after the mapping, for every anomaly', () => {
  const nextLights = E.buildWorld({ anomaly: null, seed: 1 }).lights;
  const has = (lights, L, x, z) => lights.some(o => Math.abs(o.x - x) < 1e-6 && Math.abs(o.z - z) < 1e-6 &&
    Math.abs(o.y - L.y) < 1e-6 && o.group === L.group && o.I === L.I && o.col.every((c, k) => c === L.col[k]));
  for (const anomaly of [null, ...E.ANOMALY_IDS]) {
    const world = E.buildWorld({ anomaly, seed: 3 });
    for (const s of SEAMS) {
      if ((world.hl === E.HALL_LONG) !== (s.hl === E.HALL_LONG)) continue;
      for (const L of world.lights) {
        if (Math.hypot(L.x - s.cx, L.z - s.cz) > 6) continue;
        const [mx, mz] = s.map(L.x, L.z);
        assert.ok(has(nextLights, L, mx, mz), `${anomaly}: ${s.name} lamp at (${L.x}, ${L.z})`);
      }
    }
  }
});

test('every anomaly builds a valid world', () => {
  for (const anomaly of [null, ...E.ANOMALY_IDS]) {
    const w = E.buildWorld({ anomaly, seed: 11 });
    assert.equal(w.anomaly, anomaly);
    assert.ok(w.packed.vertices > 5000);
    assert.equal(w.packed.data.length, w.packed.vertices * 20);
    for (const v of w.packed.data) assert.ok(Number.isFinite(v));
    for (const i of w.packed.index) assert.ok(i < w.packed.vertices);
  }
});

test('the exit world has stairs that lead out', () => {
  const w = E.buildWorld({ exit: true });
  const lay = w.lay;
  assert.ok(E.rectById(lay, 'S'));
  assert.equal(E.rectById(lay, 'C2'), null);
  assert.equal(E.floorY(lay, 9, 30), 0);
  assert.ok(E.floorY(lay, 9, 52) > 1);
  assert.equal(E.floorY(lay, 9, 57.5), E.STAIR_RISE);
  assert.ok(E.reachedExit(lay, 9, 57));
  assert.ok(!E.reachedExit(lay, 9, 40));
});

test('anomaly picking honours chance, first loop and recent history', () => {
  const rnd = E.mulberry32(42);
  assert.equal(E.pickAnomaly(rnd, { first: true, chance: 1 }), null);
  assert.equal(E.pickAnomaly(rnd, { chance: 0 }), null);
  const recent = E.ANOMALY_IDS.slice(0, 25);
  for (let i = 0; i < 200; i++) {
    const id = E.pickAnomaly(rnd, { chance: 1, recent });
    assert.ok(E.ANOMALY_IDS.includes(id));
    assert.ok(!recent.includes(id));
  }
  let normal = 0;
  for (let i = 0; i < 2000; i++) if (E.pickAnomaly(rnd, { chance: 0.6 }) === null) normal++;
  assert.ok(normal > 700 && normal < 900, `about 40% normal loops, got ${normal / 20}%`);
});

test('anomaly catalogue is complete in both languages', () => {
  assert.equal(new Set(E.ANOMALY_IDS).size, E.ANOMALIES.length);
  for (const a of E.ANOMALIES) assert.ok(a.he && a.en, a.id);
  for (const key of Object.keys(E.STRINGS.he)) assert.ok(key in E.STRINGS.en, `missing en.${key}`);
  assert.equal(E.STRINGS.he.dir, 'rtl');
  assert.equal(E.STRINGS.en.dir, 'ltr');
});

test('route coordinates round-trip', () => {
  const lay = E.layout({});
  for (const s of [0, 5, 14.5, 18, 23.5, 30, 50]) {
    const p = E.routePoint(lay, s);
    assert.ok(Math.abs(E.routeS(lay, p.x, p.z) - s) < 1e-6, `s=${s}`);
  }
});

test('exit8.html is the up-to-date single-file build', async () => {
  const fs = await import('node:fs');
  const { bundle } = await import('../build.mjs');
  const built = fs.readFileSync(new URL('../exit8.html', import.meta.url), 'utf8');
  assert.ok(!/<script src=/.test(built), 'every script is inlined');
  assert.equal(built, bundle(), 'run `npm run build:exit8` after changing the sources');
});

test('every anomaly has a fear rating and the scariest are common enough to matter', () => {
  for (const a of E.ANOMALIES) assert.ok([1, 2, 3].includes(a.scare), `${a.id}: scare must be 1, 2 or 3`);
  assert.ok(E.ANOMALIES.length >= 38);
  assert.ok(E.ANOMALIES.filter(a => a.scare === 3).length >= 11);
});

test('deeper runs favour the frightening anomalies', () => {
  const share = intensity => {
    const rnd = E.mulberry32(99);
    let n = 0;
    for (let i = 0; i < 4000; i++) {
      const id = E.pickAnomaly(rnd, { chance: 1, intensity });
      if (E.ANOMALIES.find(a => a.id === id).scare === 3) n++;
    }
    return n / 4000;
  };
  assert.ok(share(1) > share(0) * 1.4, `scare-3 share: ${share(0)} → ${share(1)}`);
  assert.ok(share(0) > 0.1, 'the scariest ones still appear early');
});

test('the new horror anomalies build and carry their decorations', () => {
  const T = E.TEX;
  const layers = (anomaly) => {
    const w = E.buildWorld({ anomaly, seed: 4 }), d = w.packed.data, found = new Set();
    for (let i = 0; i < w.packed.vertices; i++) found.add(d[i * 20 + 8]);
    return found;
  };
  assert.ok(layers('wall_face').has(T.wallFace));
  assert.ok(layers('wall_eyes').has(T.wallEyes));
  assert.ok(layers('scrawl').has(T.scrawl));
  assert.ok(layers('blood_pool').has(T.bloodPool));
  for (const [an, tex] of [[null, T.wallFace], [null, T.wallEyes], [null, T.scrawl], [null, T.bloodPool]]) {
    assert.ok(!layers(an).has(tex), 'a normal loop has none of them');
  }
});


test('the walking man wears a name tag that says Shlomi', () => {
  assert.deepEqual(E.NAME_TAG, { title: 'שם עובד', name: 'שלומי' });
  assert.ok(Number.isInteger(E.TEX.nametag) && E.TEX.nametag >= 0, 'the badge has its own texture');
  assert.ok(Number.isInteger(E.TEX.faceKiller), 'the killer has his own face');
});

test('door anomalies: a pounded door is drawn live, and eyes sit in the dark gap', () => {
  const T = E.TEX;
  const layers = w => { const d = w.packed.data, f = new Set(); for (let i = 0; i < w.packed.vertices; i++) f.add(d[i * 20 + 8]); return f; };
  const knock = E.buildWorld({ anomaly: 'door_knock', seed: 6 }), plain = E.buildWorld({ anomaly: null, seed: 6 });
  assert.ok(knock.decor.knock && Number.isFinite(knock.decor.knock.x) && Number.isFinite(knock.decor.knock.z));
  assert.equal(plain.decor.knock, null);
  const doorVerts = w => { const d = w.packed.data; let n = 0; for (let i = 0; i < w.packed.vertices; i++) if (d[i * 20 + 8] === T.door) n++; return n; };
  assert.ok(doorVerts(knock) < doorVerts(plain), 'one static door leaf is left out');
  const eyes = E.buildWorld({ anomaly: 'door_eyes', seed: 6 });
  assert.ok(layers(eyes).has(T.ventEyes) && !layers(plain).has(T.ventEyes));
});

test('the wall of eyes: 14 tracked pupils, all on the painted panel', () => {
  const w = E.buildWorld({ anomaly: 'wall_eyes', seed: 3 });
  assert.equal(w.decor.wallEyes.length, 14);
  assert.equal(E.WALL_EYES.length, 48);
  for (const e of w.decor.wallEyes) {
    assert.ok(e.z > 30.8 && e.z < 33.6 && e.y > 0.1 && e.y < 2.5, `pupil on the wall at (${e.z.toFixed(2)}, ${e.y.toFixed(2)})`);
    assert.ok(e.kz > 0 && e.ky > 0 && e.maxY > 0 && e.maxZ > 0);
  }
  assert.equal(E.buildWorld({ anomaly: null, seed: 3 }).decor.wallEyes.length, 0);
});

test('the exit route goes up the stairs', () => {
  const lay = E.layout({ exit: true });
  assert.deepEqual(E.route(lay).slice(-1)[0], [9, lay.hl + 13 + E.STAIRS]);
  assert.ok(E.routeS(lay, 9, 50) > E.routeS(lay, 9, lay.hl + 13));
});

function simulate(world, seconds, onFrame) {
  const ac = new E.Actors(world), events = [], p = { x: 9, z: 22, pushX: 0, pushZ: 0 };
  for (let t = 0; t < seconds; t += 1 / 60) {
    const stop = onFrame && onFrame(p, t, ac);
    const ev = ac.update(1 / 60, p, { armed: true, inView: () => false });
    for (const e of ev) events.push(Object.assign({ t }, e));
    if (stop || ev.some(e => e.type === 'caught')) break;
  }
  return { ac, events, p };
}

test('finale: running outruns the wave from behind, walking does not, and the stairs end it', () => {
  const run = speed => {
    const w = E.buildWorld({ exit: true, seed: 2 });
    const r = simulate(w, 40, p => { p.z += speed / 60; return p.z > 56; });
    return { caught: r.events.some(e => e.type === 'caught' && e.by === 'wave'), waveStarted: r.events.some(e => e.type === 'waveStart'), vanished: r.events.some(e => e.type === 'vanish'), z: r.p.z };
  };
  const sprint = run(3.6), walk = run(1.85);
  assert.ok(sprint.waveStarted && !sprint.caught && sprint.vanished, JSON.stringify(sprint));
  assert.ok(walk.waveStarted && walk.caught && walk.z > 30 && walk.z < 46, `caught somewhere in the corridor: ${JSON.stringify(walk)}`);
  const normal = simulate(E.buildWorld({ anomaly: null, seed: 2 }), 6, p => { p.z += 1.85 / 60; });
  assert.ok(!normal.events.some(e => e.type === 'waveStart'), 'ordinary corridors have no finale');
});

test('the stuttering man freezes, then jumps, and only makes noise when he jumps', () => {
  const w = E.buildWorld({ anomaly: 'man_glitch', seed: 4 });
  const zs = [];
  const r = simulate(w, 8, (p, t, ac) => { const m = ac.men.find(x => x.alive); if (m) zs.push(m.z); });
  const jumps = r.events.filter(e => e.type === 'glitch');
  assert.ok(jumps.length >= 12 && jumps.length <= 22, `${jumps.length} jumps in 8 s`);
  for (let i = 1; i < jumps.length; i++) assert.ok(jumps[i].t - jumps[i - 1].t >= 0.4, 'a freeze lasts at least 0.4 s');
  let moves = 0;
  for (let i = 1; i < zs.length; i++) if (zs[i] !== zs[i - 1]) moves++;
  assert.ok(moves <= jumps.length + 1, `he moved on ${moves} frames for ${jumps.length} jumps`);
  assert.ok(!r.events.some(e => e.type === 'step'), 'no footsteps while stuttering');
});

test('a door pounded from inside: bursts of knocks, then a long silence', () => {
  const w = E.buildWorld({ anomaly: 'door_knock', seed: 5 });
  const r = simulate(w, 30);
  const knocks = r.events.filter(e => e.type === 'knock');
  assert.ok(knocks.length >= 6, `${knocks.length} knocks in 30 s`);
  let longest = 0;
  for (let i = 1; i < knocks.length; i++) longest = Math.max(longest, knocks[i].t - knocks[i - 1].t);
  assert.ok(longest >= 2, 'a held silence between bursts');
  for (const k of knocks) assert.ok(Math.abs(k.z - w.decor.knock.z) < 0.01, 'the sound comes from the door');
});

test('the crawling man and the stuttering man count towards danger; ordinary ones do not', () => {
  const near = (anomaly, mutate) => {
    const w = E.buildWorld({ anomaly, seed: 8 });
    const r = simulate(w, 0.2);
    const m = r.ac.men[0];
    m.x = r.p.x; m.z = r.p.z + 3;
    if (mutate) mutate(m);
    return r.ac.danger(r.p);
  };
  assert.ok(near('man_crawl') > 0.2);
  assert.ok(near('man_glitch') > 0.2);
  assert.equal(near(null), 0);
});
