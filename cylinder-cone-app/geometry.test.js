'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('./geometry.js');

const near = (actual, expected) => {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`);
};

test('cylinder: lateral, bases and total area for r=3, h=5', () => {
  const a = G.cylinderArea(3, 5);
  assert.equal(a.lateral.coef, 30);
  assert.equal(a.base.coef, 18);
  assert.equal(a.total.coef, 48);
  near(a.total.value, 48 * Math.PI);
});

test('cylinder: total area equals 2πr(r+h) for every size in range', () => {
  for (let r = 1; r <= 9; r++) {
    for (let h = 1; h <= 12; h++) {
      assert.equal(G.cylinderArea(r, h).total.coef, 2 * r * (r + h));
    }
  }
});

test('cone: slant height from Pythagoras and the three areas for r=3, h=4', () => {
  const a = G.coneArea(3, 4);
  assert.equal(a.slant, 5);
  assert.equal(a.lateral.coef, 15);
  assert.equal(a.base.coef, 9);
  assert.equal(a.total.coef, 24);
  near(a.sectorAngle, 216);
});

test('cone: total area equals πr(r+l) for every Pythagorean triple', () => {
  for (const [r, h, l] of G.CONE_TRIPLES) {
    assert.equal(r * r + h * h, l * l, `triple ${r}, ${h}, ${l}`);
    const a = G.coneArea(r, h);
    assert.equal(a.slant, l);
    assert.equal(a.total.coef, r * (r + l));
  }
});

test('base circumference is 2πr for both shapes', () => {
  const c = G.cylinderArea(4, 7).circumference;
  assert.equal(c.coef, 8);
  near(c.value, 8 * Math.PI);
  assert.equal(G.coneArea(3, 4).circumference.coef, 6);
});

test('cone: non-integer slant height keeps decimal coefficients', () => {
  const a = G.coneArea(1, 1);
  near(a.slant, Math.SQRT2);
  near(a.lateral.coef, Math.SQRT2);
  near(a.total.coef, 1 + Math.SQRT2);
});

test('invalid dimensions are rejected', () => {
  for (const bad of [0, -1, NaN, Infinity, '3']) {
    assert.throws(() => G.cylinderArea(bad, 2), RangeError);
    assert.throws(() => G.coneArea(2, bad), RangeError);
  }
});

test('generated questions match the formulas for their shape and part', () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const shapes = new Set();
  for (let i = 0; i < 300; i++) {
    const q = G.createQuestion(undefined, random);
    shapes.add(q.shape);
    const area = q.shape === 'cylinder' ? G.cylinderArea(q.r, q.h) : G.coneArea(q.r, q.h);
    assert.equal(q.coef, area[q.part].coef);
    assert.ok(Number.isInteger(q.coef));
  }
  assert.deepEqual([...shapes].sort(), ['cone', 'cylinder']);
});

test('a question can be forced to a given shape', () => {
  const q = G.createQuestion('cone', () => 0.99);
  assert.equal(q.shape, 'cone');
  assert.throws(() => G.createQuestion('sphere', () => 0.5), RangeError);
});

test('answers are accepted as a multiple of π, with a comma, or as a decimal close to it', () => {
  const q = { coef: 48 };
  for (const ok of ['48', '48π', ' 48 ', '150.8', '150,8', '150.7']) {
    assert.equal(G.checkAnswer(q, ok).status, 'correct', ok);
  }
});

test('wrong and invalid answers are reported', () => {
  const q = { coef: 48 };
  assert.equal(G.checkAnswer(q, '49').status, 'wrong');
  assert.equal(G.checkAnswer(q, '48π²').status, 'invalid');
  assert.equal(G.checkAnswer(q, '').status, 'invalid');
  assert.equal(G.checkAnswer(q, 'abc').status, 'invalid');
});
