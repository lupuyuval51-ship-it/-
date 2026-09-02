import assert from "node:assert/strict";
import test from "node:test";
import { advanceAttackWindup, createAttackWindup, firstCoverImpact, turnToward } from "../src/components/game/arena-combat";

test("enemy attack warns before firing and keeps its original aim when the player dodges", () => {
  const hero = { x: 3, z: 4 };
  let windup = createAttackWindup({ x: 0, z: 0 }, hero);
  hero.x = -7;
  assert.deepEqual(windup.direction, { x: .6, z: .8 });
  const warned = advanceAttackWindup(windup, .4);
  assert.equal(warned.fire, false);
  assert.ok(warned.progress > 0 && warned.progress < 1);
  windup = warned.next;
  const fired = advanceAttackWindup(windup, .5);
  assert.equal(fired.fire, true);
  assert.deepEqual(fired.next.direction, { x: .6, z: .8 });
  assert.equal(advanceAttackWindup(fired.next, .1).fire, false, "An expired warning must not repeatedly shoot.");
  assert.equal(advanceAttackWindup(createAttackWindup({ x: 0, z: 0 }, hero), -1).progress, 0);
});

test("aim guide stops at the nearest cover face from either direction", () => {
  const covers = [{ x: 0, z: 0, width: 2, depth: 2 }, { x: 0, z: -4, width: 2, depth: 2 }];
  assert.deepEqual(firstCoverImpact({ x: 0, z: 5 }, { x: 0, z: -8 }, covers, 0), { x: 0, z: 1 });
  assert.deepEqual(firstCoverImpact({ x: 0, z: -8 }, { x: 0, z: 5 }, covers, 0), { x: 0, z: -5 });
  assert.equal(firstCoverImpact({ x: 3, z: 5 }, { x: 3, z: -8 }, covers), null);
  assert.deepEqual(firstCoverImpact({ x: 0, z: 0 }, { x: 0, z: 0 }, covers), { x: 0, z: 0 });
  assert.equal(firstCoverImpact({ x: 3, z: 3 }, { x: 3, z: 3 }, covers), null);
});

test("hero turns across the angle boundary by the short arc", () => {
  const next = turnToward(Math.PI - .1, -Math.PI + .1, .5);
  assert.ok(Math.abs(next - Math.PI) < 1e-9);
  assert.equal(turnToward(0, 1, 0), 0);
  assert.equal(turnToward(0, 1, 2), 1);
});
