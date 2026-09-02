/* ============================================================
   לוגיקת אתר – ניווט, נגישות, אנימציות, טפסים, מאמרים
   ============================================================ */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  // ---------- העדפות נגישות (נשמרות במכשיר) ----------
  var A11Y_KEY = 'od-a11y';
  var prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(A11Y_KEY) || '{}') || {}; } catch (e) { prefs = {}; }
  function applyPrefs() {
    root.style.setProperty('--a11y-scale', String(prefs.scale || 1));
    if (prefs.contrast) root.setAttribute('data-contrast', 'high'); else root.removeAttribute('data-contrast');
    if (prefs.underline) root.setAttribute('data-underline', 'on'); else root.removeAttribute('data-underline');
    if (prefs.motion === false) root.setAttribute('data-motion', 'off'); else root.removeAttribute('data-motion');
    if (prefs.theme) root.setAttribute('data-theme', prefs.theme); else root.removeAttribute('data-theme');
    document.querySelectorAll('[data-a11y]').forEach(function (b) {
      var k = b.getAttribute('data-a11y');
      var on = (k === 'contrast' && !!prefs.contrast) || (k === 'underline' && !!prefs.underline) ||
        (k === 'motion' && prefs.motion === false) || (k === 'dark' && prefs.theme === 'dark');
      if (['contrast', 'underline', 'motion', 'dark'].indexOf(k) > -1) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function savePrefs() { try { localStorage.setItem(A11Y_KEY, JSON.stringify(prefs)); } catch (e) {} applyPrefs(); }
  applyPrefs();

  var a11yBtn = document.querySelector('.a11y__btn');
  var a11yPanel = document.querySelector('.a11y__panel');
  if (a11yBtn && a11yPanel) {
    a11yBtn.addEventListener('click', function () {
      var open = a11yPanel.classList.toggle('is-open');
      a11yBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!a11yPanel.contains(e.target) && e.target !== a11yBtn && !a11yBtn.contains(e.target)) {
        a11yPanel.classList.remove('is-open'); a11yBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { a11yPanel.classList.remove('is-open'); a11yBtn.setAttribute('aria-expanded', 'false'); }
    });
    a11yPanel.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a11y]'); if (!b) return;
      var k = b.getAttribute('data-a11y');
      if (k === 'bigger') prefs.scale = Math.min(1.6, +(((prefs.scale || 1) + 0.1).toFixed(2)));
      if (k === 'smaller') prefs.scale = Math.max(0.8, +(((prefs.scale || 1) - 0.1).toFixed(2)));
      if (k === 'contrast') prefs.contrast = !prefs.contrast;
      if (k === 'underline') prefs.underline = !prefs.underline;
      if (k === 'motion') prefs.motion = prefs.motion === false ? true : false;
      if (k === 'dark') prefs.theme = prefs.theme === 'dark' ? '' : 'dark';
      if (k === 'reset') prefs = {};
      savePrefs();
    });
  }

  // ---------- כותרת וניווט ----------
  var header = document.querySelector('.header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
    });
  }
  var toTop = document.querySelector('.to-top');
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  // ---------- חשיפה בגלילה ----------
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- כרטיסי 3D (tilt) ----------
  var fine = window.matchMedia('(pointer: fine)').matches;
  var noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fine && !noMotion) {
    document.querySelectorAll('.pcard').forEach(function (card) {
      var glare = card.querySelector('.pcard__glare');
      card.addEventListener('pointermove', function (e) {
        if (root.getAttribute('data-motion') === 'off') return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * 10, ry = (px - 0.5) * 12;
        card.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
        if (glare) { glare.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); glare.style.setProperty('--gy', (py * 100).toFixed(1) + '%'); }
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  // ---------- סינון מאמרים ----------
  var grid = document.querySelector('[data-articles]');
  if (grid) {
    var chips = document.querySelectorAll('.chip[data-cat]');
    var search = document.querySelector('[data-search]');
    var empty = document.querySelector('[data-empty]');
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-cat-item]'));
    var state = { cat: 'all', q: '' };
    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var okCat = state.cat === 'all' || c.getAttribute('data-cat-item') === state.cat;
        var text = (c.textContent || '').toLowerCase();
        var okQ = !state.q || text.indexOf(state.q) > -1;
        var ok = okCat && okQ;
        c.hidden = !ok; if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    }
    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        ch.setAttribute('aria-pressed', 'true');
        state.cat = ch.getAttribute('data-cat'); apply();
      });
    });
    if (search) search.addEventListener('input', function () { state.q = search.value.trim().toLowerCase(); apply(); });
    var hashCat = decodeURIComponent((location.hash || '').replace('#cat=', ''));
    if (hashCat && location.hash.indexOf('#cat=') === 0) {
      chips.forEach(function (ch) { if (ch.getAttribute('data-cat') === hashCat) ch.click(); });
    }
  }

  // ---------- טופס יצירת קשר ----------
  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    var status = form.querySelector('.form__status');
    function setInvalid(field, bad) { field.closest('.field').classList.toggle('is-invalid', bad); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      var email = form.querySelector('[name="email"]');
      var message = form.querySelector('[name="message"]');
      var consent = form.querySelector('[name="consent"]');
      var honey = form.querySelector('[name="website"]');
      var ok = true;
      setInvalid(name, !(name.value.trim().length >= 2)); if (!(name.value.trim().length >= 2)) ok = false;
      var phoneOk = /^0(5\d|[2-4]|[8-9]|7\d)[\d\-\s]{6,9}$/.test(phone.value.trim());
      setInvalid(phone, !phoneOk); if (!phoneOk) ok = false;
      var emailOk = !email.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setInvalid(email, !emailOk); if (!emailOk) ok = false;
      setInvalid(message, !(message.value.trim().length >= 10)); if (!(message.value.trim().length >= 10)) ok = false;
      if (consent && !consent.checked) { ok = false; consent.focus(); }
      if (honey && honey.value) return;
      if (!ok) {
        status.className = 'form__status is-err';
        status.textContent = 'חסרים פרטים בטופס – אנא בדקו את השדות המסומנים.';
        return;
      }
      var endpoint = form.getAttribute('data-endpoint');
      var payload = {
        name: name.value.trim(), phone: phone.value.trim(), email: email.value.trim(),
        topic: (form.querySelector('[name="topic"]') || {}).value || '', message: message.value.trim(), page: location.href
      };
      var btn = form.querySelector('[type="submit"]');
      btn.disabled = true;
      function done(okSend) {
        btn.disabled = false;
        if (okSend) {
          status.className = 'form__status is-ok';
          status.textContent = 'תודה, הפנייה התקבלה. ניצור קשר תוך יום עסקים אחד.';
          form.reset();
        } else {
          status.className = 'form__status is-err';
          status.textContent = 'לא הצלחנו לשלוח את הטופס. אפשר להתקשר אלינו או לשלוח הודעת וואטסאפ.';
        }
      }
      if (endpoint) {
        fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { done(r.ok); }).catch(function () { done(false); });
      } else {
        // ללא שרת: פתיחת אימייל מוכן לשליחה
        var to = form.getAttribute('data-mailto') || '';
        var subject = encodeURIComponent('פנייה מהאתר – ' + payload.name);
        var body = encodeURIComponent('שם: ' + payload.name + '\nטלפון: ' + payload.phone + '\nאימייל: ' + payload.email + '\nנושא: ' + payload.topic + '\n\n' + payload.message);
        window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
        done(true);
      }
    });
  });

  // ---------- שיתוף מאמר ----------
  document.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var url = location.href, title = document.title;
      var kind = b.getAttribute('data-share');
      if (kind === 'native' && navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
      if (kind === 'copy') {
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { b.textContent = 'הקישור הועתק'; });
        return;
      }
      if (kind === 'whatsapp') window.open('https://wa.me/?text=' + encodeURIComponent(title + ' ' + url), '_blank', 'noopener');
      if (kind === 'linkedin') window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener');
      if (kind === 'facebook') window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener');
    });
  });

  // ---------- שנה נוכחית ----------
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
