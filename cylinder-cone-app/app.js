/*
 * Lesson UI for the cylinder and cone surface-area app.
 * All formulas and practice logic come from geometry.js (window.Geometry).
 */
(function () {
  'use strict';

  var G = window.Geometry;
  var PI = G.PI;

  var STRINGS = {
    he: {
      pageTitle: 'שטח פנים של גליל וחרוט',
      appName: 'שטח פנים: גליל וחרוט',
      skip: 'דלגו לתוכן',
      langSwitch: 'English',
      heroTitle: 'שטח הפנים של גליל וחרוט',
      heroText: 'למדו מאיפה מגיעות הנוסחאות, חשבו בעצמכם עם מחוונים ובדקו את הידע בתרגול.',
      shapeGroup: 'בחירת צורה',
      shapeCylinder: 'גליל',
      shapeCone: 'חרוט',
      tabLearn: 'למידה',
      tabCalc: 'מחשבון',
      tabPractice: 'תרגול',
      cm: 'ס״מ',
      cm2: 'ס״מ²',
      radiusLabel: 'רדיוס הבסיס r',
      heightLabel: 'גובה h',
      leadCylinder: 'שטח הפנים הוא סכום שטחי כל החלקים שמקיפים את הצורה. לגליל יש שלושה חלקים: שטח הצד ושני הבסיסים. כשפורסים את הגליל למישור רואים את כולם יחד.',
      leadCone: 'שטח הפנים של החרוט הוא סכום שטח הצד (גזרה עיגולית) ושטח הבסיס (עיגול). כשפורסים את החרוט למישור רואים את שני החלקים.',
      netTitle: 'הפיתוח של הצורה',
      netNoteCylinder: 'הפיתוח עבור r = {r} ו־h = {h}',
      netNoteCone: 'הפיתוח עבור r = {r} ו־h = {h}. זווית הגזרה: <span class="math">θ = 360° · r / l ≈ {angle}°</span>',
      cylLateralTitle: 'שטח הצד',
      cylLateralText: 'כשפורסים את שטח הצד מקבלים מלבן. צלע אחת שלו היא היקף הבסיס <span class="math">2πr</span>, והצלע השנייה היא הגובה h.',
      cylBasesTitle: 'שטח שני הבסיסים',
      cylBasesText: 'יש שני עיגולים זהים, ושטח כל אחד מהם הוא <span class="math">πr²</span>.',
      cylTotalTitle: 'השטח הכולל',
      cylTotalText: 'מחברים את שטח הצד ואת שטחי הבסיסים.',
      coneSlantTitle: 'היוצרת l',
      coneSlantText: 'היוצרת היא הקטע מהקודקוד אל שפת הבסיס. במשולש ישר הזווית מתקיים משפט פיתגורס.',
      coneLateralTitle: 'שטח הצד',
      coneLateralText: 'הגזרה היא חלק מעיגול ברדיוס l. היקף העיגול הגדול הוא <span class="math">2πl</span>, והקשת של הגזרה היא <span class="math">2πr</span>, לכן הגזרה היא <span class="math">r/l</span> מהעיגול: <span class="math">(r/l)·πl² = πrl</span>.',
      coneBaseTitle: 'שטח הבסיס',
      coneBaseText: 'הבסיס הוא עיגול ברדיוס r.',
      coneTotalTitle: 'השטח הכולל',
      coneTotalText: 'מחברים את שטח הצד ואת שטח הבסיס.',
      calcTitle: 'חישוב צעד אחר צעד',
      figureLabel: 'ציור של {shape} לפי המידות שבחרתם',
      stepSlant: 'חישוב היוצרת l',
      stepLateral: 'שטח הצד',
      stepBase: 'שטח הבסיס',
      stepBases: 'שטח שני הבסיסים',
      stepTotal: 'השטח הכולל',
      partLateral: 'שטח הצד',
      partBasesBoth: 'שטח שני הבסיסים',
      partBase: 'שטח הבסיס',
      partTotal: 'השטח הכולל',
      partCircumference: 'היקף הבסיס',
      stepCircumference: 'היקף הבסיס',
      circumferenceTitle: 'היקף הבסיס',
      circumferenceText: 'היקף הבסיס הוא אורך המעגל שמקיף את הבסיס. בפיתוח הוא צלע המלבן (בגליל) או אורך הקשת של הגזרה (בחרוט).',
      hintCircumference: 'היקף הבסיס הוא היקף העיגול: 2πr.',
      scoreLine: 'עניתם נכון על {correct} מתוך {asked} שאלות',
      questionText: '{shape} עם רדיוס בסיס r = {r} ס״מ וגובה h = {h} ס״מ. מהו {part}?',
      answerLabel: 'התשובה שלכם',
      answerSuffix: '× π',
      answerHelp: 'הקלידו את המקדם של π: לדוגמה, עבור 48π הקלידו 48. תשובה עשרונית קרובה (לפי π ≈ 3.14) גם תתקבל.',
      checkBtn: 'בדיקה',
      hintBtn: 'רמז',
      solutionBtn: 'הצגת הפתרון',
      nextBtn: 'שאלה הבאה',
      correctMsg: 'נכון! מעולה.',
      wrongMsg: 'לא מדויק. בדקו את החישוב ונסו שוב, או הציגו את הפתרון.',
      invalidMsg: 'הקלידו מספר, לדוגמה 48.',
      hintCylinder: 'שטח הצד הוא מלבן שצלעותיו <span class="math">2πr</span> ו־<span class="math">h</span>. שטח כל בסיס הוא <span class="math">πr²</span>.',
      hintCone: 'קודם מחשבים את היוצרת l בעזרת פיתגורס, ואז משתמשים בנוסחאות <span class="math">πrl</span> ו־<span class="math">πr²</span>.',
      solutionTitle: 'הפתרון המלא',
      answerIs: 'התשובה: {coef}π ≈ {value} {unit}',
      footerNote: 'כל החישובים נעשים בדפדפן שלכם. אין צורך בשרת או בהרשמה.',
    },
    en: {
      pageTitle: 'Surface Area of a Cylinder and a Cone',
      appName: 'Surface Area: Cylinder & Cone',
      skip: 'Skip to content',
      langSwitch: 'עברית',
      heroTitle: 'Surface area of a cylinder and a cone',
      heroText: 'Learn where the formulas come from, try values with sliders, and test yourself in practice.',
      shapeGroup: 'Choose a shape',
      shapeCylinder: 'Cylinder',
      shapeCone: 'Cone',
      tabLearn: 'Learn',
      tabCalc: 'Calculator',
      tabPractice: 'Practice',
      cm: 'cm',
      cm2: 'cm²',
      radiusLabel: 'Base radius r',
      heightLabel: 'Height h',
      leadCylinder: 'The surface area is the sum of the areas of all the parts that cover the shape. A cylinder has three parts: the lateral area and two bases. When we unroll the cylinder onto a flat plane, we can see all of them together.',
      leadCone: 'The surface area of a cone is the sum of the lateral area (a sector) and the base area (a circle). When we unroll the cone, we can see both parts.',
      netTitle: 'The net (the unrolled shape)',
      netNoteCylinder: 'Net for r = {r} and h = {h}',
      netNoteCone: 'Net for r = {r} and h = {h}. Sector angle θ = 360° · r / l ≈ {angle}°',
      cylLateralTitle: 'Lateral area',
      cylLateralText: 'Unrolled, the side is a rectangle. One side is the base circumference 2πr and the other side is the height h.',
      cylBasesTitle: 'Area of both bases',
      cylBasesText: 'There are two identical circles, each with area πr².',
      cylTotalTitle: 'Total area',
      cylTotalText: 'Add the lateral area and the areas of the two bases.',
      coneSlantTitle: 'Slant height l',
      coneSlantText: 'The slant height runs from the apex to the edge of the base. By the Pythagorean theorem, l² = r² + h².',
      coneLateralTitle: 'Lateral area',
      coneLateralText: 'The sector is part of a circle with radius l. That circle has circumference 2πl, and the arc of the sector is 2πr, so the sector is r/l of the circle: (r/l)·πl² = πrl.',
      coneBaseTitle: 'Base area',
      coneBaseText: 'The base is a circle with radius r.',
      coneTotalTitle: 'Total area',
      coneTotalText: 'Add the lateral area and the base area.',
      calcTitle: 'Step by step',
      figureLabel: 'Drawing of a {shape} with the chosen dimensions',
      stepSlant: 'Slant height l',
      stepLateral: 'Lateral area',
      stepBase: 'Base area',
      stepBases: 'Area of both bases',
      stepTotal: 'Total area',
      partLateral: 'lateral area',
      partBasesBoth: 'area of both bases',
      partBase: 'base area',
      partTotal: 'total surface area',
      partCircumference: 'base circumference',
      stepCircumference: 'Base circumference',
      circumferenceTitle: 'Base circumference',
      circumferenceText: 'The base circumference is the length of the circle around the base. In the net it is the side of the rectangle (cylinder) or the arc of the sector (cone).',
      hintCircumference: 'The base circumference is the circumference of the circle: 2πr.',
      scoreLine: 'Correct answers: {correct} out of {asked}',
      questionText: 'A {shape} has base radius r = {r} cm and height h = {h} cm. What is its {part}?',
      answerLabel: 'Your answer',
      answerSuffix: '× π',
      answerHelp: 'Type the coefficient of π: for 48π, type 48. A decimal answer close to the value (using π ≈ 3.14) is also accepted.',
      checkBtn: 'Check',
      hintBtn: 'Hint',
      solutionBtn: 'Show solution',
      nextBtn: 'Next question',
      correctMsg: 'Correct! Well done.',
      wrongMsg: 'Not quite. Check your calculation and try again, or show the solution.',
      invalidMsg: 'Type a number, for example 48.',
      hintCylinder: 'The side is a rectangle with sides 2πr and h. Each base has area πr².',
      hintCone: 'First find the slant height l with the Pythagorean theorem, then use πrl and πr².',
      solutionTitle: 'Full solution',
      answerIs: 'Answer: {coef}π ≈ {value} {unit}',
      footerNote: 'All calculations run in your browser. No server and no account needed.',
    },
  };

  var state = {
    lang: 'he',
    shape: 'cylinder',
    tab: 'learn',
    r: 3,
    h: 5,
    practice: null,
  };

  var appRoot = document.getElementById('app');

  /* ---------- helpers ---------- */

  function t(key, vars) {
    var dict = STRINGS[state.lang];
    var text = dict[key] !== undefined ? dict[key] : STRINGS.en[key];
    if (!vars) {
      return text;
    }
    return text.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match;
    });
  }

  function fmt(x) {
    return Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100);
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function shapeName(shape) {
    return t(shape === 'cylinder' ? 'shapeCylinder' : 'shapeCone');
  }

  function partName(shape, part) {
    if (part === 'circumference') {
      return t('partCircumference');
    }
    if (part === 'lateral') {
      return t('partLateral');
    }
    if (part === 'total') {
      return t('partTotal');
    }
    return t(shape === 'cylinder' ? 'partBasesBoth' : 'partBase');
  }

  function areasFor(shape, r, h) {
    return shape === 'cylinder' ? G.cylinderArea(r, h) : G.coneArea(r, h);
  }

  function decimal(coef, unit) {
    return '≈ ' + fmt(coef * PI) + ' ' + (unit || t('cm2'));
  }

  /* ---------- worked steps ---------- */

  function step(title, lines) {
    return { title: title, lines: lines };
  }

  function shapeSteps(shape, r, h) {
    var circumference = step(t('stepCircumference'), [
      '2πr = 2π · ' + r,
      '= ' + fmt(2 * r) + 'π ' + decimal(2 * r, t('cm')),
    ]);
    return [circumference].concat(areaSteps(shape, r, h));
  }

  function areaSteps(shape, r, h) {
    if (shape === 'cylinder') {
      var lateral = 2 * r * h;
      var bases = 2 * r * r;
      var total = lateral + bases;
      return [
        step(t('stepLateral'), [
          '2πr·h = 2π · ' + r + ' · ' + h,
          '= ' + fmt(lateral) + 'π ' + decimal(lateral),
        ]),
        step(t('stepBases'), [
          '2 · πr² = 2 · π · ' + r + '²',
          '= ' + fmt(bases) + 'π ' + decimal(bases),
        ]),
        step(t('stepTotal'), [
          '2πr·h + 2πr² = ' + fmt(lateral) + 'π + ' + fmt(bases) + 'π',
          '= ' + fmt(total) + 'π ' + decimal(total),
        ]),
      ];
    }

    var radicand = r * r + h * h;
    var slant = Math.sqrt(radicand);
    var sign = Number.isInteger(slant) ? '=' : '≈';
    var lateralCone = r * slant;
    var baseCone = r * r;
    var totalCone = lateralCone + baseCone;
    return [
      step(t('stepSlant'), [
        'l = √(r² + h²) = √(' + r * r + ' + ' + h * h + ')',
        '= √' + radicand + ' ' + sign + ' ' + fmt(slant),
      ]),
      step(t('stepLateral'), [
        'πrl = π · ' + r + ' · ' + fmt(slant),
        sign + ' ' + fmt(lateralCone) + 'π ' + decimal(lateralCone),
      ]),
      step(t('stepBase'), [
        'πr² = π · ' + r + '²',
        '= ' + fmt(baseCone) + 'π ' + decimal(baseCone),
      ]),
      step(t('stepTotal'), [
        'πrl + πr² = ' + fmt(lateralCone) + 'π + ' + fmt(baseCone) + 'π',
        sign + ' ' + fmt(totalCone) + 'π ' + decimal(totalCone),
      ]),
    ];
  }

  function stepsHtml(steps) {
    return steps
      .map(function (s) {
        var lines = s.lines
          .map(function (line) {
            return '<p class="ltr">' + line + '</p>';
          })
          .join('');
        return '<li class="step"><h4>' + s.title + '</h4>' + lines + '</li>';
      })
      .join('');
  }

  function metricsHtml(shape, areas) {
    return ['lateral', 'base', 'total']
      .map(function (part) {
        var area = areas[part];
        return (
          '<div class="metric' + (part === 'total' ? ' metric-total' : '') + '">' +
          '<span class="metric-label">' + partName(shape, part) + '</span>' +
          '<strong class="ltr">' + fmt(area.coef) + 'π</strong>' +
          '<span class="metric-value ltr">' + decimal(area.coef) + '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  /* ---------- SVG drawings ---------- */

  function fmtAll(values) {
    return values.map(fmt).join(' ');
  }

  function label(x, y, text, size, anchor) {
    return (
      '<text class="dim-label" x="' + fmt(x) + '" y="' + fmt(y) +
      '" font-size="' + fmt(size) + '" text-anchor="' + (anchor || 'middle') +
      '" dominant-baseline="middle">' + text + '</text>'
    );
  }

  function line(x1, y1, x2, y2, cls) {
    return (
      '<line class="' + cls + '" x1="' + fmt(x1) + '" y1="' + fmt(y1) +
      '" x2="' + fmt(x2) + '" y2="' + fmt(y2) + '"/>'
    );
  }

  function circle(cx, cy, radius) {
    return '<circle class="net-face" cx="' + fmt(cx) + '" cy="' + fmt(cy) + '" r="' + fmt(radius) + '"/>';
  }

  function ellipse(cx, cy, rx, ry) {
    return '<ellipse class="solid-face" cx="' + fmt(cx) + '" cy="' + fmt(cy) + '" rx="' + fmt(rx) + '" ry="' + fmt(ry) + '"/>';
  }

  function netSvg(x, y, w, h, content) {
    return (
      '<svg class="net-svg" viewBox="' + fmtAll([x, y, w, h]) + '" role="img" aria-label="' +
      t('netTitle') + '">' + content + '</svg>'
    );
  }

  // Unrolled cylinder: a rectangle (the side) with a circle above and below.
  function cylinderNetSvg(r, h) {
    var width = 2 * Math.PI * r;
    var height = 4 * r + h;
    var pad = 0.12 * Math.max(width, height);
    var vbW = width + 2 * pad;
    var vbH = height + 2 * pad;
    var fs = 0.045 * Math.max(vbW, vbH);
    var cx = width / 2;
    var content =
      '<rect class="net-side" x="0" y="' + fmt(2 * r) + '" width="' + fmt(width) + '" height="' + fmt(h) + '"/>' +
      circle(cx, r, r) +
      circle(cx, 3 * r + h, r) +
      label(cx, 2 * r + h / 2, '2πr', fs) +
      label(-pad / 2, 2 * r + h / 2, 'h', fs) +
      label(cx, r, 'r', fs) +
      label(cx, 3 * r + h, 'r', fs);
    return netSvg(-pad, -pad, vbW, vbH, content);
  }

  // Unrolled cone: a sector with radius l (the side) and a circle (the base).
  function coneNetSvg(r, h) {
    var l = Math.sqrt(r * r + h * h);
    var half = (Math.PI * r) / l; // half of the sector angle 2πr / l
    var large = half > Math.PI / 2 ? 1 : 0;
    var sx = l * Math.sin(half);
    var sy = -l * Math.cos(half);
    var baseCx = 1.25 * l + r;
    var x0 = -1.1 * l;
    var x1 = baseCx + r + 0.1 * l;
    var y0 = -1.25 * l;
    var y1 = 0.1 * l;
    var vbW = x1 - x0;
    var vbH = y1 - y0;
    var fs = 0.045 * Math.max(vbW, vbH);
    var content =
      '<path class="net-side" d="M0 0 L' + fmt(-sx) + ' ' + fmt(sy) +
      ' A' + fmt(l) + ' ' + fmt(l) + ' 0 ' + large + ' 1 ' + fmt(sx) + ' ' + fmt(sy) + ' Z"/>' +
      circle(baseCx, -r, r) +
      label(0, -1.12 * l, '2πr', fs) +
      label(sx / 2 + 0.1 * l, sy / 2, 'l', fs) +
      label(0, -0.4 * l, 'θ', fs * 1.2) +
      label(baseCx, -r, 'r', fs);
    return netSvg(x0, y0, vbW, vbH, content);
  }

  // Solid drawing with the chosen proportions, used in the calculator.
  function solidSvg(shape, r, h) {
    var scale = 170 / Math.max(2 * r, h);
    var rx = r * scale;
    var ry = Math.max(8, rx * 0.28);
    var height = h * scale;
    var cx = 120;
    var x0 = cx - rx;
    var x1 = cx + rx;
    var viewHeight;
    var content;

    if (shape === 'cylinder') {
      var top = 24 + ry;
      var bottom = top + height;
      viewHeight = bottom + ry + 24;
      content =
        '<path class="solid-body" d="M' + fmt(x0) + ' ' + fmt(top) +
        ' V' + fmt(bottom) + ' A' + fmt(rx) + ' ' + fmt(ry) + ' 0 0 0 ' +
        fmt(x1) + ' ' + fmt(bottom) + ' V' + fmt(top) + ' Z"/>' +
        ellipse(cx, bottom, rx, ry) +
        ellipse(cx, top, rx, ry) +
        line(cx, top, x1, top, 'dim-line') +
        label(cx + rx / 2, top - 8, 'r', 13) +
        line(x1 + 12, top, x1 + 12, bottom, 'dim-line') +
        label(x1 + 24, (top + bottom) / 2, 'h', 13);
    } else {
      var apexY = 24;
      var baseY = apexY + height;
      viewHeight = baseY + ry + 24;
      content =
        '<path class="solid-body" d="M' + fmt(cx) + ' ' + fmt(apexY) +
        ' L' + fmt(x0) + ' ' + fmt(baseY) + ' A' + fmt(rx) + ' ' + fmt(ry) + ' 0 0 0 ' +
        fmt(x1) + ' ' + fmt(baseY) + ' Z"/>' +
        ellipse(cx, baseY, rx, ry) +
        line(cx, apexY, cx, baseY, 'dim-line dashed') +
        label(cx - 10, (apexY + baseY) / 2, 'h', 13, 'end') +
        line(cx, apexY, x1, baseY, 'dim-line') +
        label((cx + x1) / 2 + 10, (apexY + baseY) / 2, 'l', 13) +
        line(cx, baseY, x1, baseY, 'dim-line') +
        label(cx + rx / 2, baseY + 14, 'r', 13);
    }

    return (
      '<svg class="solid-svg" viewBox="0 0 240 ' + fmt(viewHeight) + '" role="img" aria-label="' +
      t('figureLabel', { shape: shapeName(shape).toLowerCase() }) + '">' + content + '</svg>'
    );
  }

  /* ---------- learn tab ---------- */

  function cardHtml(card) {
    return (
      '<article class="panel card"><h3>' + card.title + '</h3>' +
      '<p class="card-text">' + card.text + '</p>' +
      '<p class="formula">' + card.formula + '</p></article>'
    );
  }

  function learnHtml() {
    var shape = state.shape;
    var r = state.r;
    var h = state.h;
    var isCylinder = shape === 'cylinder';
    var areas = areasFor(shape, r, h);
    var net = isCylinder ? cylinderNetSvg(r, h) : coneNetSvg(r, h);
    var netNote = isCylinder
      ? t('netNoteCylinder', { r: r, h: h })
      : t('netNoteCone', { r: r, h: h, angle: fmt(areas.sectorAngle) });
    var circumferenceCard = { title: t('circumferenceTitle'), text: t('circumferenceText'), formula: '2πr' };
    var cards = isCylinder
      ? [
          circumferenceCard,
          { title: t('cylLateralTitle'), text: t('cylLateralText'), formula: '2πr·h' },
          { title: t('cylBasesTitle'), text: t('cylBasesText'), formula: '2πr²' },
          { title: t('cylTotalTitle'), text: t('cylTotalText'), formula: '2πr·h + 2πr² = 2πr(r + h)' },
        ]
      : [
          circumferenceCard,
          { title: t('coneSlantTitle'), text: t('coneSlantText'), formula: 'l = √(r² + h²)' },
          { title: t('coneLateralTitle'), text: t('coneLateralText'), formula: 'πrl' },
          { title: t('coneBaseTitle'), text: t('coneBaseText'), formula: 'πr²' },
          { title: t('coneTotalTitle'), text: t('coneTotalText'), formula: 'πr(r + l) = πrl + πr²' },
        ];

    return (
      '<div class="learn">' +
        '<p class="lead">' + t(isCylinder ? 'leadCylinder' : 'leadCone') + '</p>' +
        '<div class="learn-grid">' +
          '<figure class="panel net-panel">' +
            '<h3>' + t('netTitle') + '</h3>' + net +
            '<figcaption>' + netNote + '</figcaption>' +
          '</figure>' +
          '<div class="card-list">' + cards.map(cardHtml).join('') + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* ---------- calculator tab ---------- */

  function sliderHtml(field, text, value) {
    return (
      '<div class="slider-row">' +
        '<div class="slider-head"><label for="' + field + '-range">' + text + '</label>' +
        '<output id="' + field + '-out">' + value + ' ' + t('cm') + '</output></div>' +
        '<input type="range" id="' + field + '-range" data-field="' + field +
        '" min="1" max="20" step="1" value="' + value + '">' +
      '</div>'
    );
  }

  function calcHtml() {
    return (
      '<div class="calc-layout">' +
        '<div class="calc-side">' +
          '<div class="panel">' +
            sliderHtml('r', t('radiusLabel'), state.r) +
            sliderHtml('h', t('heightLabel'), state.h) +
          '</div>' +
          '<figure class="panel figure-panel" id="calc-figure"></figure>' +
        '</div>' +
        '<section class="panel calc-result">' +
          '<h3>' + t('calcTitle') + '</h3>' +
          '<div class="metrics" id="calc-metrics" aria-live="polite"></div>' +
          '<ol class="steps" id="calc-steps"></ol>' +
        '</section>' +
      '</div>'
    );
  }

  function renderCalcOutput() {
    var shape = state.shape;
    var r = state.r;
    var h = state.h;
    document.getElementById('calc-figure').innerHTML = solidSvg(shape, r, h);
    document.getElementById('calc-metrics').innerHTML = metricsHtml(shape, areasFor(shape, r, h));
    document.getElementById('calc-steps').innerHTML = stepsHtml(shapeSteps(shape, r, h));
  }

  /* ---------- practice tab ---------- */

  function nextQuestion(session) {
    session.question = G.createQuestion(state.shape);
    session.scored = false;
    session.done = false;
    session.feedback = null;
    session.showHint = false;
    session.lastInput = '';
  }

  function newPracticeSession() {
    var session = { correct: 0, asked: 0 };
    nextQuestion(session);
    return session;
  }

  function solutionHtml(q) {
    return (
      '<div class="solution"><h4>' + t('solutionTitle') + '</h4>' +
      '<ol class="steps">' + stepsHtml(shapeSteps(q.shape, q.r, q.h)) + '</ol>' +
      '<p class="answer-line">' + t('answerIs', {
        coef: fmt(q.coef),
        value: fmt(q.coef * PI),
        unit: t(q.part === 'circumference' ? 'cm' : 'cm2'),
      }) + '</p>' +
      '</div>'
    );
  }

  function feedbackHtml(p) {
    var messages = {
      correct: ['correctMsg', 'ok'],
      wrong: ['wrongMsg', 'bad'],
      invalid: ['invalidMsg', 'bad'],
    };
    var entry = messages[p.feedback];
    return entry ? '<p class="feedback ' + entry[1] + '" role="status">' + t(entry[0]) + '</p>' : '';
  }

  function practiceHtml() {
    var p = state.practice;
    var q = p.question;
    var disabled = p.done ? ' disabled' : '';
    var question = t('questionText', {
      shape: shapeName(q.shape).toLowerCase(),
      r: q.r,
      h: q.h,
      part: partName(q.shape, q.part).toLowerCase(),
    });
    var hintKey = q.part === 'circumference'
      ? 'hintCircumference'
      : q.shape === 'cylinder' ? 'hintCylinder' : 'hintCone';
    var hint = p.showHint ? '<p class="hint">' + t(hintKey) + '</p>' : '';
    var solutionButton = p.done
      ? ''
      : '<button type="button" class="btn secondary" data-action="solution">' + t('solutionBtn') + '</button>';
    var hintButton =
      '<button type="button" class="btn secondary" data-action="hint"' +
      (p.showHint || p.done ? ' disabled' : '') + '>' + t('hintBtn') + '</button>';
    var nextButton = p.done
      ? '<div class="actions"><button type="button" class="btn primary" data-action="next">' + t('nextBtn') + '</button></div>'
      : '';

    return (
      '<section class="panel practice">' +
        '<p class="score">' + t('scoreLine', { correct: p.correct, asked: p.asked }) + '</p>' +
        '<h3 class="question">' + question + '</h3>' +
        '<form id="practice-form" class="answer-form">' +
          '<label class="answer-label" for="answer-input">' + t('answerLabel') + '</label>' +
          '<div class="answer-row">' +
            '<input id="answer-input" class="answer-input" type="text" dir="ltr" inputmode="decimal" autocomplete="off" value="' +
            escapeHtml(p.lastInput) + '"' + disabled + '>' +
            '<span class="answer-suffix">' + t('answerSuffix') + '</span>' +
          '</div>' +
          '<p class="help">' + t('answerHelp') + '</p>' +
          '<div class="actions">' +
            '<button type="submit" class="btn primary"' + disabled + '>' + t('checkBtn') + '</button>' +
            hintButton +
            solutionButton +
          '</div>' +
        '</form>' +
        hint +
        feedbackHtml(p) +
        (p.done ? solutionHtml(q) : '') +
        nextButton +
      '</section>'
    );
  }

  function renderPractice() {
    document.getElementById('panel').innerHTML = practiceHtml();
    if (!state.practice.done) {
      document.getElementById('answer-input').focus({ preventScroll: true });
    }
  }

  function submitAnswer() {
    var p = state.practice;
    if (p.done) {
      return;
    }
    var result = G.checkAnswer(p.question, p.lastInput);
    if (result.status === 'invalid') {
      p.feedback = 'invalid';
    } else {
      if (!p.scored) {
        p.scored = true;
        p.asked += 1;
      }
      p.feedback = result.status;
      if (result.status === 'correct') {
        p.correct += 1;
        p.done = true;
      }
    }
    renderPractice();
  }

  /* ---------- page ---------- */

  function tabButton(tab, text) {
    var selected = state.tab === tab;
    return (
      '<button type="button" role="tab" id="tab-' + tab + '" class="tab' + (selected ? ' active' : '') +
      '" aria-selected="' + selected + '" aria-controls="panel" data-tab="' + tab + '">' + text + '</button>'
    );
  }

  function shapeButton(shape) {
    var pressed = state.shape === shape;
    return (
      '<button type="button" class="seg' + (pressed ? ' active' : '') + '" aria-pressed="' + pressed +
      '" data-shape="' + shape + '">' + shapeName(shape) + '</button>'
    );
  }

  function pageHtml() {
    var otherLang = state.lang === 'he' ? 'en' : 'he';
    return (
      '<a class="skip" href="#main">' + t('skip') + '</a>' +
      '<header class="topbar"><div class="container topbar-inner">' +
        '<div class="brand"><span class="brand-mark" aria-hidden="true">π</span><span>' + t('appName') + '</span></div>' +
        '<button type="button" class="lang-btn" data-lang="' + otherLang + '">' + t('langSwitch') + '</button>' +
      '</div></header>' +
      '<main id="main" class="container">' +
        '<section class="hero"><h1>' + t('heroTitle') + '</h1><p>' + t('heroText') + '</p></section>' +
        '<div class="controls">' +
          '<div class="seg-group" role="group" aria-label="' + t('shapeGroup') + '">' +
            shapeButton('cylinder') + shapeButton('cone') +
          '</div>' +
          '<div class="tab-list" role="tablist">' +
            tabButton('learn', t('tabLearn')) + tabButton('calc', t('tabCalc')) + tabButton('practice', t('tabPractice')) +
          '</div>' +
        '</div>' +
        '<section id="panel" class="tab-panel" role="tabpanel" aria-labelledby="tab-' + state.tab + '"></section>' +
      '</main>' +
      '<footer class="container footer">' + t('footerNote') + '</footer>'
    );
  }

  function renderTab() {
    var panel = document.getElementById('panel');
    if (state.tab === 'learn') {
      panel.innerHTML = learnHtml();
    } else if (state.tab === 'calc') {
      panel.innerHTML = calcHtml();
      renderCalcOutput();
    } else {
      if (!state.practice) {
        state.practice = newPracticeSession();
      }
      renderPractice();
    }
  }

  function render() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('pageTitle');
    appRoot.innerHTML = pageHtml();
    renderTab();
  }

  /* ---------- events (delegated on the stable root) ---------- */

  appRoot.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) {
      return;
    }
    if (button.dataset.lang) {
      state.lang = button.dataset.lang;
      render();
    } else if (button.dataset.shape) {
      state.shape = button.dataset.shape;
      state.practice = null;
      render();
    } else if (button.dataset.tab) {
      state.tab = button.dataset.tab;
      render();
    } else if (button.dataset.action === 'hint') {
      state.practice.showHint = true;
      renderPractice();
    } else if (button.dataset.action === 'solution') {
      state.practice.done = true;
      state.practice.feedback = null;
      renderPractice();
    } else if (button.dataset.action === 'next') {
      nextQuestion(state.practice);
      renderPractice();
    }
  });

  appRoot.addEventListener('submit', function (event) {
    if (event.target.id !== 'practice-form') {
      return;
    }
    event.preventDefault();
    submitAnswer();
  });

  appRoot.addEventListener('input', function (event) {
    var target = event.target;
    if (target.dataset.field) {
      state[target.dataset.field] = Number(target.value);
      document.getElementById(target.dataset.field + '-out').textContent = target.value + ' ' + t('cm');
      renderCalcOutput();
    } else if (target.id === 'answer-input') {
      state.practice.lastInput = target.value;
    }
  });

  render();
})();
