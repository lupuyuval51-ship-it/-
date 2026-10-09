import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The game is a single HTML file, so pull the logic section out of it and
// load it as a module from a data URL.
const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const logic = html.slice(html.indexOf('/* @world-start */'), html.indexOf('/* @world-end */'));
const {
  World, BLOCKS, CHUNK_W, CHUNK_H, CHUNK_D, localIndex, terrainHeight,
  raycast, createBody, moveBody, isGrounded, overlapsBlock,
} = await import('data:text/javascript;base64,' + Buffer.from(logic).toString('base64'));

// A chunk at (0,0) cleared to air with a stone floor whose top is at y=10.
function flatWorld() {
  const w = new World(1);
  const c = w.chunk(0, 0);
  c.data.fill(BLOCKS.AIR);
  for (let z = 0; z < CHUNK_D; z++) {
    for (let x = 0; x < CHUNK_W; x++) {
      for (let y = 0; y < 10; y++) c.data[localIndex(x, y, z)] = BLOCKS.STONE;
    }
  }
  return w;
}

test('terrain is deterministic and stays in range', () => {
  for (let x = -100; x < 100; x += 7) {
    for (let z = -100; z < 100; z += 7) {
      const h = terrainHeight(x, z, 42);
      assert.equal(h, terrainHeight(x, z, 42));
      assert.ok(h >= 18 && h < CHUNK_H - 10, `height ${h} out of range`);
    }
  }
});

test('same seed gives the same world, different seed differs', () => {
  const a = new World(7);
  const b = new World(7);
  const c = new World(8);
  let differs = false;
  for (let x = 0; x < 40; x++) {
    for (let z = 0; z < 40; z++) {
      assert.equal(a.surfaceY(x, z), b.surfaceY(x, z));
      if (a.surfaceY(x, z) !== c.surfaceY(x, z)) differs = true;
    }
  }
  assert.ok(differs);
});

test('topmost block of each column is terrain or a tree, never air', () => {
  const w = new World(99);
  const allowed = [BLOCKS.GRASS, BLOCKS.SAND, BLOCKS.WOOD, BLOCKS.LEAVES];
  for (let x = 0; x < 32; x++) {
    for (let z = 0; z < 32; z++) {
      const y = w.surfaceY(x, z);
      assert.ok(y > 0);
      const id = w.get(x, y, z);
      assert.ok(allowed.includes(id), `top id ${id}`);
    }
  }
});

test('set/get works across chunk borders and returns neighbours to rebuild', () => {
  const w = new World(3);
  const dirty = w.set(-1, 30, 16, BLOCKS.BRICK);
  assert.equal(w.get(-1, 30, 16), BLOCKS.BRICK);
  // x=-1 is local x 15 of chunk (-1,·) and z=16 is local z 0 of chunk (·,1),
  // so the block borders chunks (0,1) and (-1,0) as well as its own (-1,1).
  assert.deepEqual(dirty.map(([cx, cz]) => `${cx},${cz}`).sort(), ['-1,0', '-1,1', '0,1']);
  assert.equal(w.get(-1, CHUNK_H, 16), BLOCKS.AIR);
});

test('raycast hits the floor from above with an upward normal', () => {
  const w = flatWorld();
  const hit = raycast(w, 8.5, 15.5, 8.5, 0, -1, 0, 10);
  assert.ok(hit);
  assert.deepEqual(hit.block, { x: 8, y: 9, z: 8 });
  assert.deepEqual(hit.normal, { x: 0, y: 1, z: 0 });
  assert.deepEqual(hit.place, { x: 8, y: 10, z: 8 });
});

test('raycast hits a wall from the side with the correct normal', () => {
  const w = flatWorld();
  w.set(12, 10, 8, BLOCKS.WOOD);
  const hit = raycast(w, 8.5, 10.5, 8.5, 1, 0, 0, 10);
  assert.ok(hit);
  assert.deepEqual(hit.block, { x: 12, y: 10, z: 8 });
  assert.deepEqual(hit.normal, { x: -1, y: 0, z: 0 });
});

test('raycast returns null when nothing is within range', () => {
  const w = flatWorld();
  assert.equal(raycast(w, 8.5, 20.5, 8.5, 0, -1, 0, 3), null);
});

test('falling body lands on the floor and reports ground', () => {
  const w = flatWorld();
  const body = createBody(8.5, 14, 8.5);
  for (let i = 0; i < 240; i++) {
    body.vy -= 28 / 60;
    const hit = moveBody(w, body, 0, body.vy / 60, 0);
    if (hit.y && body.vy < 0) body.vy = 0;
    body.onGround = isGrounded(w, body);
  }
  assert.ok(Math.abs(body.y - 10) < 0.01, `feet at ${body.y}`);
  assert.equal(body.onGround, true);
});

test('horizontal movement is blocked by a wall', () => {
  const w = flatWorld();
  for (let y = 10; y <= 12; y++) w.set(12, y, 8, BLOCKS.STONE);
  const body = createBody(8.5, 10, 8.5);
  moveBody(w, body, 0, 0, 0);
  for (let i = 0; i < 180; i++) {
    const hit = moveBody(w, body, 3 / 60, 0, 0);
    if (hit.x) break;
  }
  assert.ok(body.x < 12 - body.w, `x=${body.x}`);
  assert.ok(body.x > 11.6, `x=${body.x}`);
});

test('overlapsBlock detects the player standing inside a cell', () => {
  const body = createBody(8.5, 10, 8.5);
  assert.equal(overlapsBlock(body, { x: 8, y: 10, z: 8 }), true);
  assert.equal(overlapsBlock(body, { x: 8, y: 9, z: 8 }), false);
  assert.equal(overlapsBlock(body, { x: 10, y: 10, z: 8 }), false);
});
