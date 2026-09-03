/* ============================================================
   שכבת תנועה – motion.js
   מרחיב את main.js (שכבר מוסיף .is-in ל-.reveal ואת html.js).
   כל פיצ'ר בפונקציה נפרדת, עם הגנות על markup חסר,
   על window.__PREVIEW__ ועל reduced-motion / html[data-motion="off"].
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  var preview = !!window.__PREVIEW__;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reducedMQ = mq('(prefers-reduced-motion: reduce)');
  var fineMQ = mq('(pointer: fine)');
  var isRTL = (root.getAttribute('dir') || '').toLowerCase() === 'rtl' || getComputedStyle(root).direction === 'rtl';

  function reduced() { return reducedMQ.matches || root.getAttribute('data-motion') === 'off'; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function inViewport(el) {
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
  }
  function onFrame(fn) {
    var queued = false;
    return function () {
      if (queued) return; queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }
  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function emit(name) {
    try { window.dispatchEvent(new CustomEvent(name)); } catch (e) { /* דפדפן ישן */ }
  }

  root.classList.add('has-motion');

  // ---------- html.is-ready – אחרי document.fonts.ready או timeout 800ms ----------
  var readyFired = false, readyCbs = [];
  function whenReady(cb) { if (readyFired) cb(); else readyCbs.push(cb); }
  function fireReady() {
    if (readyFired) return;
    readyFired = true;
    root.classList.add('is-ready');
    var cbs = readyCbs; readyCbs = [];
    cbs.forEach(function (f) { try { f(); } catch (e) { /* לא עוצרים את השאר */ } });
    emit('motion:ready');
  }
  if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
    document.fonts.ready.then(fireReady, fireReady);
  }
  setTimeout(fireReady, 800);

  // ---------- פרה-לואדר (דף הבית, ביקור ראשון ב-session) ----------
  // מסתיים עם is-ready / hero3d:ready / timeout 700ms (הראשון מביניהם), לא לפני 350ms.
  function initPreloader() {
    var pre = document.querySelector('.preloader');
    if (!pre) return;
    var seen = true;
    try { seen = sessionStorage.getItem('od-seen') === '1'; } catch (e) { seen = true; }
    if (preview || reduced() || seen) { pre.hidden = true; return; }
    try { sessionStorage.setItem('od-seen', '1'); } catch (e) { /* פרטי */ }
    root.classList.add('has-preloader');
    var t0 = Date.now();
    all('path, circle, line, polyline, polygon', pre).forEach(function (s) {
      var len = 0;
      try { len = s.getTotalLength(); } catch (e) { len = 0; }
      if (!len) return;
      s.style.strokeDasharray = String(len);
      s.style.strokeDashoffset = String(len);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        pre.classList.add('is-drawing');
        all('path, circle, line, polyline, polygon', pre).forEach(function (s) {
          if (!s.style.strokeDasharray) return;
          s.style.transition = 'stroke-dashoffset .55s ease';
          s.style.strokeDashoffset = '0';
        });
      });
    });
    var finished = false;
    function leave() {
      root.classList.add('is-loaded');          // הכיסוי עולה למעלה ב-500ms
      setTimeout(function () {
        root.classList.remove('has-preloader');
        root.classList.remove('is-loaded');
        pre.hidden = true;
      }, 500);
    }
    function finish() {
      if (finished) return; finished = true;
      var wait = 350 - (Date.now() - t0);
      if (wait > 0) setTimeout(leave, wait); else leave();
    }
    whenReady(finish);
    window.addEventListener('hero3d:ready', finish, { once: true });
    setTimeout(finish, 700);
  }

  // ---------- פיצול מילים ב-h1[data-split] ----------
  function initSplit() {
    all('[data-split]').forEach(function (el) {
      if (el.getAttribute('data-split-done') || reduced()) return;
      var label = (el.textContent || '').replace(/\s+/g, ' ').trim();
      var count = 0;
      function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            if (!n.nodeValue.trim()) return;                  // רווחים בין אלמנטים
            var frag = document.createDocumentFragment();
            n.nodeValue.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span'); w.className = 'w';
              var inner = document.createElement('span'); inner.className = 'w__in';
              inner.textContent = part;
              inner.style.setProperty('--wi', String(count++));
              w.appendChild(inner); frag.appendChild(w);
            });
            node.replaceChild(frag, n);
          } else if (n.nodeType === 1 && n.tagName !== 'BR') {
            walk(n);                                          // <em> וכד' – נשמרים
          }
        });
      }
      walk(el);
      if (label && !el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
      el.setAttribute('data-split-done', '1');
    });
  }

  // ---------- data-stagger: --i על ילדים ישירים ----------
  function initStagger() {
    all('[data-stagger]').forEach(function (box) {
      Array.prototype.slice.call(box.children).forEach(function (child, i) {
        child.style.setProperty('--i', String(Math.min(i, 8)));
      });
    });
  }

  // ---------- .reveal--line שאינו בתוך .reveal (Hero / page-hero / עצמאי) ----------
  function initLines() {
    var lines = all('.reveal--line').filter(function (l) {
      return !l.classList.contains('reveal') && !(l.parentElement && l.parentElement.closest('.reveal'));
    });
    if (!lines.length) return;
    var heroLines = lines.filter(function (l) { return !!l.closest('.hero__content, .page-hero__inner'); });
    var rest = lines.filter(function (l) { return heroLines.indexOf(l) === -1; });
    heroLines.forEach(function (l) { whenReady(function () { l.classList.add('is-in'); }); });
    if (!rest.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { threshold: 0.1 });
      rest.forEach(function (l) { io.observe(l); });
    } else {
      rest.forEach(function (l) { l.classList.add('is-in'); });
    }
  }

  // ---------- מונים ----------
  var counters = [];
  function initCounters() {
    var fmt = null;
    try { fmt = new Intl.NumberFormat('he-IL'); } catch (e) { fmt = null; }
    function fmtNum(n) { return fmt ? fmt.format(n) : String(n); }
    all('[data-counter]').forEach(function (el) {
      var raw = el.getAttribute('data-counter') || '';
      var target = parseFloat(raw);
      if (isNaN(target)) return;
      var decimals = (raw.split('.')[1] || '').length;
      var prefix = el.getAttribute('data-prefix') || '', suffix = el.getAttribute('data-suffix') || '';
      var started = false, finished = false;
      function render(v) { el.textContent = prefix + fmtNum(decimals ? +v.toFixed(decimals) : Math.round(v)) + suffix; }
      function markHost() { var host = el.closest ? el.closest('.stat') : null; if (host) host.classList.add('is-counting'); }
      function finish() { if (finished) return; finished = true; started = true; markHost(); render(target); }
      function start() {
        if (started) return; started = true; markHost();
        if (reduced()) { finish(); return; }
        var t0 = null;
        function step(ts) {
          if (finished) return;
          if (t0 === null) t0 = ts;
          var p = clamp((ts - t0) / 1400, 0, 1);
          var e = 1 - Math.pow(1 - p, 3);
          render(target * e);
          if (p < 1 && !reduced()) requestAnimationFrame(step); else finish();
        }
        requestAnimationFrame(step);
      }
      counters.push({ el: el, start: start, finish: finish });
    });
    if (!counters.length) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          counters.forEach(function (c) { if (c.el === en.target) c.start(); });
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { io.observe(c.el); });
    } else {
      counters.forEach(function (c) { c.finish(); });
    }
  }

  // ---------- fallback: כל מה שב-viewport גלוי גם אם ה-observer לא ירה ----------
  function revealFallback(force) {
    all('.reveal:not(.is-in), .reveal--line:not(.is-in)').forEach(function (el) {
      if (!inViewport(el)) return;
      el.style.transitionDelay = '0s';
      if (force) el.style.transitionDuration = '0s';
      el.classList.add('is-in');
      setTimeout(function () { el.style.transitionDelay = ''; el.style.transitionDuration = ''; }, 80);
    });
    counters.forEach(function (c) { if (inViewport(c.el)) (force ? c.finish : c.start)(); });
  }

  // ---------- סרגל התקדמות קריאה ----------
  function initProgress() {
    var bar = document.querySelector('[data-progress]');
    if (!bar) return;
    var body = document.querySelector('.article-body');
    var art = body ? (body.closest('article') || body) : document.querySelector('main article:not(.tcard)');
    if (!art) { bar.hidden = true; return; }
    var update = onFrame(function () {
      var r = art.getBoundingClientRect();
      var top = r.top + (window.scrollY || 0), h = r.height, vh = window.innerHeight;
      var p = h > vh ? ((window.scrollY || 0) - top) / (h - vh) : ((window.scrollY || 0) >= top ? 1 : 0);
      p = clamp(p, 0, 1);
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ---------- כפתורים מגנטיים ----------
  function initMagnetic() {
    if (!fineMQ.matches || reduced()) return;
    var els = all('[data-magnetic]');
    if (!els.length) return;
    var px = -9999, py = -9999;
    var RADIUS = 80, MAX = 8;
    function releaseEl(el) {
      if (!el.__mag) return;
      el.__mag = false;
      el.style.transition = 'transform .6s cubic-bezier(.2, 1.6, .4, 1)';
      el.style.transform = 'translate(0px, 0px)';
      clearTimeout(el.__magT);
      el.__magT = setTimeout(function () { if (!el.__mag) { el.style.transform = ''; el.style.transition = ''; } }, 650);
    }
    var tick = onFrame(function () {
      var off = reduced();
      els.forEach(function (el) {
        if (off) { releaseEl(el); return; }
        var r = el.getBoundingClientRect();
        if (!r.width) return;
        var ndx = Math.max(r.left - px, 0, px - r.right), ndy = Math.max(r.top - py, 0, py - r.bottom);
        var d = Math.sqrt(ndx * ndx + ndy * ndy);
        if (d > RADIUS) { releaseEl(el); return; }
        var strength = 1 - d / RADIUS;
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var tx = clamp((px - cx) / (r.width / 2 + RADIUS) * MAX * 1.6 * strength, -MAX, MAX);
        var ty = clamp((py - cy) / (r.height / 2 + RADIUS) * MAX * 1.6 * strength, -MAX, MAX);
        clearTimeout(el.__magT);
        el.__mag = true;
        el.style.transition = 'transform .16s ease-out';
        el.style.transform = 'translate(' + tx.toFixed(2) + 'px, ' + ty.toFixed(2) + 'px)';
      });
    });
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      px = e.clientX; py = e.clientY; tick();
    }, { passive: true });
    document.addEventListener('pointerout', function (e) { if (!e.relatedTarget) { px = py = -9999; tick(); } });
    window.addEventListener('scroll', function () { if (px > -9999) tick(); }, { passive: true });
  }

  // ---------- פרלקסה ----------
  function initParallax() {
    if (reduced()) return;
    var items = all('[data-parallax]').map(function (el) {
      return { el: el, speed: parseFloat(el.getAttribute('data-parallax')) || 0.12, cur: 0, armed: false, pending: false };
    });
    if (!items.length) return;
    function arm(it) { it.el.classList.add('is-parallax'); it.armed = true; }
    var update = onFrame(function () {
      var vh = window.innerHeight, off = reduced();
      items.forEach(function (it) {
        if (!it.armed) {
          // אלמנט .reveal – ממתינים שה-reveal יסתיים לפני שמתחילים להזיז אותו
          var ready = !it.el.classList.contains('reveal') || it.el.classList.contains('is-in');
          if (ready && !it.pending) { it.pending = true; setTimeout(function () { arm(it); update(); }, 760); }
          return;
        }
        if (off) {
          if (it.cur !== 0) { it.cur = 0; it.el.style.setProperty('--py', '0px'); }
          return;
        }
        var r = it.el.getBoundingClientRect();
        if (!r.height || r.bottom < -60 || r.top > vh + 60) return;
        var center = r.top + r.height / 2 - it.cur;
        var rel = (center - vh / 2) / vh;
        var y = clamp(-rel * it.speed * vh * 0.5, -30, 30);
        if (Math.abs(y - it.cur) > 0.15) { it.cur = y; it.el.style.setProperty('--py', y.toFixed(1) + 'px'); }
      });
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // .reveal שמקבל is-in בלי גלילה נוספת – מזהים את שינוי המחלקה ומחמשים
    if ('MutationObserver' in window) {
      items.forEach(function (it) {
        if (!it.el.classList.contains('reveal')) return;
        var mo = new MutationObserver(function () { if (it.el.classList.contains('is-in')) { mo.disconnect(); update(); } });
        mo.observe(it.el, { attributes: true, attributeFilter: ['class'] });
      });
    }
    update();
    setTimeout(update, 900);
  }

  // ---------- מרקיז ----------
  function initMarquee() {
    all('[data-marquee]').forEach(function (m) {
      var track = m.querySelector('.marquee__track');
      if (!track) return;
      if (!reduced() && !m.querySelector('[data-marquee-clone]')) {
        var clone = track.cloneNode(true);
        clone.setAttribute('data-marquee-clone', '');
        clone.setAttribute('aria-hidden', 'true');
        m.appendChild(clone);
      }
      function measure() {
        var w = track.getBoundingClientRect().width;
        if (w < 10) return;                                  // מוסתר (למשל route בתצוגה מקדימה)
        m.style.setProperty('--marquee-duration', Math.max(8, w / 60).toFixed(2) + 's');
      }
      measure();
      window.addEventListener('resize', debounce(measure, 150));
      if (document.fonts && document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(measure, measure);
      whenReady(measure);
    });
  }

  // ---------- סליידר / קרוסלה ----------
  function initSliders() {
    var chev = function (dir) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
        (dir === 'left' ? '<path d="M15 6l-6 6 6 6"/>' : '<path d="M9 6l6 6-6 6"/>') + '</svg>';
    };
    all('[data-slider]').forEach(function (track, idx) {
      if (track.__slider) return;
      var cards = Array.prototype.filter.call(track.children, function (c) { return c.nodeType === 1; });
      if (cards.length < 2) return;
      track.__slider = true;

      var wrap = document.createElement('div');
      wrap.className = 'slider';
      track.parentNode.insertBefore(wrap, track);
      wrap.appendChild(track);
      track.classList.add('slider__track');
      if (!track.id) track.id = 'slider-' + (idx + 1);
      if (!track.hasAttribute('tabindex')) track.setAttribute('tabindex', '0');
      track.setAttribute('aria-live', 'polite');
      cards.forEach(function (c, i) {
        c.setAttribute('role', 'group');
        c.setAttribute('aria-roledescription', 'slide');
        c.setAttribute('aria-label', (i + 1) + ' מתוך ' + cards.length);
      });

      var nav = document.createElement('div'); nav.className = 'slider__nav';
      function mkBtn(kind) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slider__btn slider__btn--' + kind;
        b.setAttribute('aria-label', kind === 'next' ? 'לעמוד הבא' : 'לעמוד הקודם');
        b.setAttribute('aria-controls', track.id);
        var left = kind === 'next' ? isRTL : !isRTL;
        b.innerHTML = chev(left ? 'left' : 'right');
        return b;
      }
      var prev = mkBtn('prev'), next = mkBtn('next');
      var dots = document.createElement('div'); dots.className = 'slider__dots';
      dots.setAttribute('role', 'group'); dots.setAttribute('aria-label', 'מעבר בין עמודי ההמלצות');
      nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(next);
      wrap.appendChild(nav);

      var current = 0, pages = 1, per = 1, timer = null;
      var paused = { hover: false, focus: false, touch: false, visible: true };

      function metrics() {
        var cw = cards[0].getBoundingClientRect().width, tw = track.clientWidth;
        var cs = getComputedStyle(track);
        var gap = parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0;
        per = cw > 0 && tw > 0 ? Math.max(1, Math.round((tw + gap) / (cw + gap))) : 1;
        var p = Math.max(1, Math.ceil(cards.length / per));
        if (p !== pages || dots.children.length !== p) { pages = p; buildDots(); }
        wrap.classList.toggle('is-static', pages < 2);
      }
      function buildDots() {
        dots.innerHTML = '';
        for (var i = 0; i < pages; i++) {
          var d = document.createElement('button');
          d.type = 'button'; d.className = 'slider__dot';
          d.setAttribute('aria-label', 'עמוד ' + (i + 1) + ' מתוך ' + pages);
          d.setAttribute('aria-controls', track.id);
          (function (n) { d.addEventListener('click', function () { goTo(n); restart(); }); })(i);
          dots.appendChild(d);
        }
        renderDots();
      }
      function renderDots() {
        Array.prototype.forEach.call(dots.children, function (d, i) {
          if (i === current) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
        });
      }
      function startEdge(el) { var r = el.getBoundingClientRect(); return isRTL ? r.right : r.left; }
      function goTo(p, instant) {
        metrics();
        p = ((p % pages) + pages) % pages;
        var card = cards[Math.min(p * per, cards.length - 1)];
        var delta = startEdge(card) - startEdge(track);
        if (Math.abs(delta) > 1) track.scrollBy({ left: delta, behavior: (instant || reduced()) ? 'auto' : 'smooth' });
        current = p; renderDots();
      }
      function atEnd() { return Math.abs(track.scrollLeft) + track.clientWidth >= track.scrollWidth - 2; }
      var onScroll = onFrame(function () {
        metrics();
        var t0 = startEdge(track), best = 0, bestD = Infinity;
        cards.forEach(function (c, i) { var d = Math.abs(startEdge(c) - t0); if (d < bestD) { bestD = d; best = i; } });
        var p = Math.floor(best / per);
        if (atEnd()) p = pages - 1;
        if (p !== current) { current = p; renderDots(); }
      });
      track.addEventListener('scroll', onScroll, { passive: true });

      function canPlay() { return !reduced() && !paused.hover && !paused.focus && !paused.touch && paused.visible && !document.hidden && pages > 1; }
      function stop() { if (timer) clearInterval(timer); timer = null; track.setAttribute('aria-live', 'polite'); }
      function play() {
        stop();
        if (!canPlay()) return;
        track.setAttribute('aria-live', 'off');
        timer = setInterval(function () { if (!canPlay()) { stop(); return; } goTo(current + 1); }, 6000);
      }
      function restart() { if (timer) play(); }

      prev.addEventListener('click', function () { goTo(current - 1); restart(); });
      next.addEventListener('click', function () { goTo(current + 1); restart(); });
      wrap.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') { paused.hover = true; stop(); } });
      wrap.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') { paused.hover = false; play(); } });
      wrap.addEventListener('focusin', function () { paused.focus = true; stop(); });
      wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) { paused.focus = false; play(); } });
      var touchT = null;
      track.addEventListener('touchstart', function () { paused.touch = true; stop(); clearTimeout(touchT); }, { passive: true });
      track.addEventListener('touchend', function () { clearTimeout(touchT); touchT = setTimeout(function () { paused.touch = false; play(); }, 8000); }, { passive: true });
      track.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); var fwd = (k === 'ArrowLeft') === isRTL; goTo(current + (fwd ? 1 : -1)); restart(); }
        else if (k === 'Home') { e.preventDefault(); goTo(0); restart(); }
        else if (k === 'End') { e.preventDefault(); goTo(pages - 1); restart(); }
      });
      document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else play(); });
      window.addEventListener('resize', debounce(function () { metrics(); goTo(current, true); }, 200));
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          paused.visible = entries[0].isIntersecting;
          if (paused.visible) play(); else stop();
        }, { threshold: 0.25 }).observe(wrap);
      } else {
        play();
      }
      metrics();
    });
  }

  // ---------- Header – הסתרה בגלילה מטה, הצגה בגלילה מעלה ----------
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header) return;
    var lastY = window.scrollY || 0;
    function show() { header.classList.remove('is-hidden'); }
    var tick = onFrame(function () {
      var y = window.scrollY || 0, d = y - lastY;
      var navOpen = !!document.querySelector('.nav.is-open');
      if (reduced() || navOpen || y < 120) { show(); lastY = y; return; }
      if (Math.abs(d) <= 8) return;
      if (d > 0) header.classList.add('is-hidden'); else show();
      lastY = y;
    });
    window.addEventListener('scroll', tick, { passive: true });
    header.addEventListener('focusin', show);
    var toggle = header.querySelector('.nav-toggle');
    if (toggle) toggle.addEventListener('click', show);
  }

  // ---------- מעבר עמודים ----------
  function initPageTransition() {
    var pt = document.querySelector('.page-transition');
    if (!pt || preview) return;
    var KEY = 'od-transition';
    var arrived = false;
    try { arrived = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) { arrived = false; }
    function clear() { root.classList.remove('is-leaving'); root.classList.remove('is-entering'); root.classList.remove('is-entered'); }
    if (arrived && !reduced()) {
      root.classList.add('is-entering');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          root.classList.remove('is-entering');
          root.classList.add('is-entered');
          setTimeout(function () { root.classList.remove('is-entered'); }, 700);
        });
      });
    }
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      if ((a.getAttribute('target') && a.getAttribute('target') !== '_self') || a.hasAttribute('download')) return;
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(mailto|tel|sms|javascript):/i.test(href)) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin || url.protocol !== location.protocol) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // אותו עמוד (hash)
      if (reduced() || root.classList.contains('is-leaving')) return;
      e.preventDefault();
      try { sessionStorage.setItem(KEY, '1'); } catch (err) { /* פרטי */ }
      root.classList.remove('is-entered');
      root.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 440);
      setTimeout(function () { root.classList.remove('is-leaving'); }, 3000); // אם הניווט נחסם
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) clear(); });
  }

  // ---------- זוהר סמן ----------
  function initGlow() {
    var glow = document.querySelector('.cursor-glow');
    if (!glow || !fineMQ.matches || reduced()) return;
    var gx = -1000, gy = -1000, tx = gx, ty = gy, on = false, raf = null, first = true;
    function loop() {
      gx += (tx - gx) * 0.16; gy += (ty - gy) * 0.16;
      glow.style.transform = 'translate3d(' + (gx - 180).toFixed(1) + 'px,' + (gy - 180).toFixed(1) + 'px,0)';
      if (Math.abs(tx - gx) > 0.4 || Math.abs(ty - gy) > 0.4) raf = requestAnimationFrame(loop); else raf = null;
    }
    function setOn(v) { if (v !== on) { on = v; glow.classList.toggle('is-on', on); } }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (first) { first = false; gx = tx; gy = ty; }
      var over = e.target && e.target.closest ? e.target.closest('.section--dark, .hero, .page-hero, .cta-band') : null;
      setOn(!!over && !reduced());
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerout', function (e) { if (!e.relatedTarget) setOn(false); });
    window.addEventListener('blur', function () { setOn(false); });
  }

  // ---------- FAQ – פתיחה/סגירה עם אנימציית גובה ----------
  function initFaq() {
    all('.faq details').forEach(function (d) {
      var sum = d.querySelector('summary');
      var body = sum ? sum.nextElementSibling : null;
      if (!sum || !body || typeof body.animate !== 'function') return;
      var anim = null;
      sum.addEventListener('click', function (e) {
        if (reduced()) return;                               // התנהגות מובנית
        e.preventDefault();
        if (anim) { anim.cancel(); anim = null; }
        var pad = getComputedStyle(body).paddingBottom || '0px';
        body.style.overflow = 'hidden';
        if (!d.open) {
          d.open = true;
          d.classList.remove('is-closing');
          var h = body.offsetHeight;
          anim = body.animate(
            [{ height: '0px', paddingBottom: '0px', opacity: 0 }, { height: h + 'px', paddingBottom: pad, opacity: 1 }],
            { duration: 340, easing: 'cubic-bezier(.2, .7, .2, 1)' }
          );
          anim.onfinish = anim.oncancel = function () { body.style.overflow = ''; anim = null; };
        } else {
          d.classList.add('is-closing');
          var h0 = body.offsetHeight;
          anim = body.animate(
            [{ height: h0 + 'px', paddingBottom: pad, opacity: 1 }, { height: '0px', paddingBottom: '0px', opacity: 0 }],
            { duration: 280, easing: 'cubic-bezier(.4, 0, .6, 1)' }
          );
          anim.onfinish = function () { d.open = false; d.classList.remove('is-closing'); body.style.overflow = ''; anim = null; };
          anim.oncancel = function () { d.classList.remove('is-closing'); body.style.overflow = ''; anim = null; };
        }
      });
    });
  }


  // ---------- v2: observer עצמאי לאלמנטים שמתויגים ב-JS ----------
  function observeIn(els, cls, threshold) {
    cls = cls || 'is-in';
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add(cls); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add(cls); io.unobserve(en.target); } });
    }, { threshold: threshold || 0.15, rootMargin: '0px 0px -6% 0px' });
    // שני פריימים כדי שמצב ההתחלה ייצבע לפני שהמעבר מתחיל
    requestAnimationFrame(function () { requestAnimationFrame(function () { els.forEach(function (el) { io.observe(el); }); }); });
  }

  // ---------- v2: כותרות ממסכה, קווי פליז, פוטר, קרוסלה ----------
  function initV2() {
    var masks = [], lines = [], footer = [];
    all('.section-head > h2, .team-bio > h2, .contact-info > h2, .cta-band h2, .process__n').forEach(function (el) {
      if (el.classList.contains('reveal--mask')) return;
      el.classList.add('reveal--mask');
      // בתוך .reveal – ה-CSS נפתח לפי is-in של ההורה (main.js); אחרת נצפה בהורה הלא-חתוך
      if (!(el.closest && el.closest('.reveal'))) masks.push(el.parentElement || el);
    });
    all('.prose > h2').forEach(function (el) { el.classList.add('line-draw'); lines.push(el); });
    all('.footer__grid > *').forEach(function (el, i) {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal'); el.style.setProperty('--i', String(i)); footer.push(el);
    });
    observeIn(masks, 'is-in', 0.1);
    observeIn(lines, 'is-in', 0.6);
    observeIn(footer, 'is-in', 0.1);
    observeIn(all('.process'), 'is-drawn', 0.35);

    // קרוסלה: כרטיסים שמחוץ לפריים מתעמעמים
    if ('IntersectionObserver' in window) {
      all('.slider__track').forEach(function (track) {
        var cards = Array.prototype.slice.call(track.children);
        if (cards.length < 2) return;
        var dim = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.target.classList.toggle('is-dim', en.intersectionRatio < 0.6); });
        }, { threshold: [0, 0.6, 1] });
        cards.forEach(function (c) { dim.observe(c); });
      });
    }
  }

  // ---------- v2: עומק לטקסט ה-Hero – סמן וגלילה ----------
  function initHeroDepth() {
    var hero = document.querySelector('.hero');
    var content = hero ? hero.querySelector('.hero__content') : null;
    if (!content || reduced()) return;
    var px = 0, py = 0, cx = 0, cy = 0, sy = window.scrollY || 0, raf = false;
    function frame() {
      raf = false;
      var off = reduced();
      var tx = off ? 0 : px, ty = off ? 0 : py;
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      var h = hero.offsetHeight || 1;
      var p = clamp(sy / h, 0, 1);
      var dx = cx * 10, dy = cy * 6 + (off ? 0 : sy * 0.22);
      content.style.transform = off ? '' : 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
      content.style.opacity = off ? '' : String(Math.max(0, 1 - p * 1.25).toFixed(3));
      if (!off && (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002)) tick();
    }
    function tick() { if (!raf) { raf = true; requestAnimationFrame(frame); } }
    if (fineMQ.matches) {
      window.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        px = (e.clientX / window.innerWidth) * 2 - 1; py = (e.clientY / window.innerHeight) * 2 - 1; tick();
      }, { passive: true });
    }
    window.addEventListener('scroll', function () { sy = window.scrollY || 0; tick(); }, { passive: true });
    tick();
  }

  // ---------- הפעלה ----------
  function safe(fn) { try { fn(); } catch (e) { if (window.console && console.warn) console.warn('motion:', e); } }
  safe(initPreloader);
  safe(initSplit);
  safe(initStagger);
  safe(initLines);
  safe(initCounters);
  safe(initProgress);
  safe(initMagnetic);
  safe(initParallax);
  safe(initMarquee);
  safe(initSliders);
  safe(initHeader);
  safe(initPageTransition);
  safe(initGlow);
  safe(initFaq);
  safe(initHeroDepth);
  safe(initV2);
  setTimeout(function () { safe(function () { revealFallback(false); }); }, 1500);
  setTimeout(function () { safe(function () { revealFallback(true); }); }, 2500);
})();
