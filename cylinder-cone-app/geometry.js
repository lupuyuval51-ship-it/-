/*
 * Surface-area formulas for a cylinder and a cone, plus the practice question
 * generator and answer checker used by the lesson app.
 *
 * Areas are returned as a coefficient of π (48 means 48π) together with their
 * decimal value. Works as a classic browser script (window.Geometry) and in Node.
 */
(function (root) {
  'use strict';

  var PI = Math.PI;

  // Pythagorean triples [r, h, l]: the slant height l is a whole number,
  // so every practice answer is a whole multiple of π.
  var CONE_TRIPLES = [
    [3, 4, 5],
    [5, 12, 13],
    [6, 8, 10],
    [8, 15, 17],
    [9, 12, 15],
    [7, 24, 25],
    [12, 16, 20],
  ];

  var PARTS = ['lateral', 'base', 'total'];

  function requirePositive(name, value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new RangeError(name + ' must be a positive finite number');
    }
  }

  function area(coef) {
    return { coef: coef, value: coef * PI };
  }

  // For a cylinder, `base` means both bases together (2 × πr²).
  function cylinderArea(r, h) {
    requirePositive('r', r);
    requirePositive('h', h);
    var lateral = 2 * r * h;
    var bases = 2 * r * r;
    return {
      shape: 'cylinder',
      r: r,
      h: h,
      lateral: area(lateral),
      base: area(bases),
      total: area(lateral + bases),
    };
  }

  function coneArea(r, h) {
    requirePositive('r', r);
    requirePositive('h', h);
    var slant = Math.sqrt(r * r + h * h);
    var lateral = r * slant;
    var base = r * r;
    return {
      shape: 'cone',
      r: r,
      h: h,
      slant: slant,
      sectorAngle: (360 * r) / slant,
      lateral: area(lateral),
      base: area(base),
      total: area(lateral + base),
    };
  }

  function pick(list, random) {
    return list[Math.floor(random() * list.length)];
  }

  function createQuestion(shape, random) {
    var rnd = random || Math.random;
    var chosenShape = shape || pick(['cylinder', 'cone'], rnd);
    if (chosenShape !== 'cylinder' && chosenShape !== 'cone') {
      throw new RangeError('shape must be "cylinder" or "cone"');
    }
    var part = pick(PARTS, rnd);
    var r;
    var h;
    var result;
    if (chosenShape === 'cylinder') {
      r = 1 + Math.floor(rnd() * 9);
      h = 2 + Math.floor(rnd() * 12);
      result = cylinderArea(r, h);
    } else {
      var triple = pick(CONE_TRIPLES, rnd);
      var swap = rnd() < 0.5;
      r = swap ? triple[1] : triple[0];
      h = swap ? triple[0] : triple[1];
      result = coneArea(r, h);
    }
    return {
      shape: chosenShape,
      part: part,
      r: r,
      h: h,
      coef: result[part].coef,
    };
  }

  // Accepts the coefficient ("48"), the written form ("48π"), a comma decimal
  // ("150,8") or a decimal close to the value with π ≈ 3.14 ("150.8").
  function checkAnswer(question, input) {
    var cleaned = String(input).replace(/\s+/g, '').replace(',', '.');
    var writtenWithPi = cleaned.indexOf('π') !== -1;
    var numeric = cleaned.replace('π', '');
    if (writtenWithPi && numeric === '') {
      numeric = '1';
    }
    var value = Number(numeric);
    if (numeric === '' || !Number.isFinite(value)) {
      return { status: 'invalid' };
    }
    var exact = Math.abs(value - question.coef) < 1e-9;
    var decimalValue = question.coef * PI;
    var decimal = Math.abs(value - decimalValue) <= decimalValue * 0.01;
    var correct = writtenWithPi ? exact : exact || decimal;
    return { status: correct ? 'correct' : 'wrong', value: value };
  }

  var api = {
    PI: PI,
    CONE_TRIPLES: CONE_TRIPLES,
    cylinderArea: cylinderArea,
    coneArea: coneArea,
    createQuestion: createQuestion,
    checkAnswer: checkAnswer,
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.Geometry = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
