// EXIT 8 — logic and world tests. Run with: node --test exit8/tests/
import test from 'node:test';
import assert from 'node:assert/strict';

await import('../js/logic.js');
await import('../js/i18n.js');
await import('../js/textures.js');
await import('../js/world.js');
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
