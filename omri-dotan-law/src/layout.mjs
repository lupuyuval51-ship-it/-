// ============================================================
//  תבניות משותפות – head, header, footer, אייקונים
// ============================================================
import { site, nav, practiceAreas } from './content.mjs';

const ICONS = {
  briefcase: '<path d="M4 8h16v11H4z"/><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M4 13h16"/>',
  building: '<path d="M5 21V5l7-3 7 3v16"/><path d="M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2"/><path d="M3 21h18"/>',
  family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2"/><path d="M14 21v-1.5a4 4 0 0 1 4-4h.5a3.5 3.5 0 0 1 3.5 3.5V21"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  gavel: '<path d="M14 4l6 6-3 3-6-6z"/><path d="M11 7l-8 8 3 3 8-8"/><path d="M3 21h10"/>',
  scale: '<path d="M12 3v18M7 21h10M4 7h16"/><path d="M4 7l-2.5 7h5zM20 7l-2.5 7h5z"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  check: '<path d="M5 12l4 4L19 6"/>',
  arrow: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
  arrowUp: '<path d="M12 19V5"/><path d="M6 11l6-6 6 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6" />',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.5 11l7-4.5M8.5 13l7 4.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  a11y: '<circle cx="12" cy="4.5" r="1.8"/><path d="M4 8.5l8 1.5 8-1.5M12 10v5l-3 6M12 15l3 6"/>',
  linkedin: '<path d="M4 9h4v12H4zM6 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 9h4v2c1-1.5 2.5-2 4-2 3 0 4 2 4 5v7h-4v-6c0-1.5-.5-2.5-2-2.5S14 13.5 14 15v6h-4z"/>',
  facebook: '<path d="M14 8h3V4h-3c-2.5 0-4 1.5-4 4v2H7v4h3v7h4v-7h3l1-4h-4V8z"/>',
  whatsapp: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/><path d="M8.5 8.5c0 3.5 3.5 7 7 7l1.5-1.5-2-1.5-1 1a5 5 0 0 1-3-3l1-1-1.5-2z"/>',
};
export function icon(name, cls = '') {
  const fill = name === 'linkedin' || name === 'facebook' ? 'currentColor' : 'none';
  const stroke = fill === 'none' ? ' stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"' : '';
  return `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="${fill}"${stroke} aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
}

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function formatDate(iso) {
  return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso + 'T00:00:00'));
}

const logoInline = `<svg class="brand__mark" viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="6" fill="#0e2a24" stroke="#d8b978" stroke-width="1.5"/><g fill="none" stroke="#d8b978" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M32 14v34M22 48h20M14 22h36M14 22l-6 14h12zM50 22l-6 14h12z"/><circle cx="32" cy="13" r="2.5" fill="#d8b978"/></g></svg>`;

export function brand(root, small = false) {
  return `<a class="brand" href="${root}index.html" aria-label="${esc(site.name)} – דף הבית">
    ${logoInline}
    <span class="brand__text"><span class="brand__name">${small ? esc(site.shortName) : 'עומרי דותן'}</span><span class="brand__sub">משרד עורכי דין</span></span>
  </a>`;
}

export function header(root, active) {
  const items = nav.map((n) => {
    const isActive = n.href === active || (n.children && active.startsWith('practice'));
    const cur = isActive ? ' aria-current="page"' : '';
    if (n.children) {
      return `<li class="nav__item"><a class="nav__link" href="${root}${n.href}"${cur}>${n.label} ${icon('chevron')}</a>
        <ul class="nav__dropdown">${practiceAreas.map((p) => `<li><a href="${root}practice/${p.slug}.html">${p.name}</a></li>`).join('')}</ul></li>`;
    }
    return `<li class="nav__item"><a class="nav__link" href="${root}${n.href}"${cur}>${n.label}</a></li>`;
  }).join('');
  return `<header class="header">
  <div class="container header__inner">
    ${brand(root)}
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="פתיחת תפריט"><span></span></button>
    <nav class="nav" id="site-nav" aria-label="ניווט ראשי">
      <ul class="nav__list">${items}</ul>
      <div class="nav__mobile-cta">
        <a class="btn btn--brass" href="${root}contact.html">${icon('calendar')} תיאום פגישת ייעוץ</a>
        <a class="btn btn--ghost" href="${site.phoneHref}">${icon('phone')} ${site.phone}</a>
      </div>
    </nav>
    <div class="header__cta">
      <a class="header__phone" href="${site.phoneHref}">${icon('phone')} <span class="num">${site.phone}</span></a>
      <a class="btn btn--brass btn--sm" href="${root}contact.html">תיאום ייעוץ</a>
    </div>
  </div>
</header>`;
}

export function footer(root) {
  return `<footer class="footer" id="footer">
  <div class="container">
    <div class="footer__grid">
      <div class="footer__brand">
        ${brand(root)}
        <p>ליווי משפטי אישי, שקוף ותכליתי בדיני עבודה, מקרקעין, משפחה וירושה, נזיקין וליטיגציה מסחרית. פגישת היכרות ראשונה ללא התחייבות.</p>
        <div class="social">
          <a href="${site.social.linkedin}" target="_blank" rel="noopener" aria-label="לינקדאין">${icon('linkedin')}</a>
          <a href="${site.social.facebook}" target="_blank" rel="noopener" aria-label="פייסבוק">${icon('facebook')}</a>
        </div>
      </div>
      <div>
        <h3>ניווט</h3>
        <ul>${nav.map((n) => `<li><a href="${root}${n.href}">${n.label}</a></li>`).join('')}<li><a href="${root}accessibility.html">הצהרת נגישות</a></li></ul>
      </div>
      <div>
        <h3>תחומי עיסוק</h3>
        <ul>${practiceAreas.map((p) => `<li><a href="${root}practice/${p.slug}.html">${p.name}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h3>יצירת קשר</h3>
        <ul>
          <li><a href="${site.phoneHref}" class="num">${site.phone}</a></li>
          <li><a href="${site.whatsappHref}" target="_blank" rel="noopener">וואטסאפ: <span class="num">${site.whatsapp}</span></a></li>
          <li><a href="mailto:${site.email}">${site.email}</a></li>
          <li>${esc(site.address.street)}, ${esc(site.address.city)}</li>
          <li>${site.hours[0].days}: <span class="num">${site.hours[0].time}</span></li>
        </ul>
      </div>
    </div>
    <p class="footer__note">האמור באתר זה הינו מידע כללי בלבד ואינו מהווה ייעוץ משפטי או תחליף לו. אין להסתמך על המידע ללא קבלת ייעוץ פרטני מעורך דין. השימוש באתר כפוף ל<a href="${root}terms.html">תנאי השימוש</a>.</p>
    <div class="footer__bottom">
      <span>© <span data-year>${new Date().getFullYear()}</span> ${esc(site.name)}. כל הזכויות שמורות.</span>
      <ul class="footer__legal">
        <li><a href="${root}privacy.html">מדיניות פרטיות</a></li>
        <li><a href="${root}terms.html">תנאי שימוש</a></li>
        <li><a href="${root}accessibility.html">נגישות</a></li>
      </ul>
    </div>
  </div>
</footer>
<a class="float-wa" href="${site.whatsappHref}" target="_blank" rel="noopener" aria-label="שיחת וואטסאפ עם המשרד">${icon('whatsapp')}</a>
<button class="to-top" type="button" aria-label="חזרה לראש העמוד">${icon('arrowUp')}</button>
<div class="a11y">
  <div class="a11y__panel" id="a11y-panel" role="region" aria-label="הגדרות נגישות">
    <h2>הגדרות נגישות</h2>
    <button type="button" data-a11y="bigger">הגדלת טקסט <span>A+</span></button>
    <button type="button" data-a11y="smaller">הקטנת טקסט <span>A−</span></button>
    <button type="button" data-a11y="contrast" aria-pressed="false">ניגודיות גבוהה</button>
    <button type="button" data-a11y="dark" aria-pressed="false">מצב כהה</button>
    <button type="button" data-a11y="underline" aria-pressed="false">הדגשת קישורים</button>
    <button type="button" data-a11y="motion" aria-pressed="false">עצירת אנימציות</button>
    <button type="button" class="a11y__reset" data-a11y="reset">איפוס</button>
    <a href="${root}accessibility.html">הצהרת נגישות</a>
  </div>
  <button class="a11y__btn" type="button" aria-expanded="false" aria-controls="a11y-panel" aria-label="תפריט נגישות">${icon('a11y')}</button>
</div>`;
}

export function ctaBand(root, title = 'רוצים לדעת איפה אתם עומדים?', text = 'פגישת היכרות ראשונה ללא עלות וללא התחייבות – במשרד או בווידאו.') {
  return `<section class="section section--tight"><div class="container"><div class="cta-band reveal">
    <div><h2>${title}</h2><p>${text}</p></div>
    <div class="cta-band__actions">
      <a class="btn btn--brass" href="${root}contact.html">${icon('calendar')} לתיאום פגישה</a>
      <a class="btn btn--ghost" href="${site.whatsappHref}" target="_blank" rel="noopener">${icon('whatsapp')} וואטסאפ</a>
    </div>
  </div></div></section>`;
}

export function pageHero({ eyebrow, title, lede, crumbs = [], extra = '' }) {
  const bc = crumbs.length ? `<nav aria-label="פירורי לחם"><ol class="breadcrumbs">${crumbs.map((c) => c.href ? `<li><a href="${c.href}">${c.label}</a></li>` : `<li aria-current="page">${c.label}</li>`).join('')}</ol></nav>` : '';
  return `<section class="page-hero"><div class="container page-hero__inner">
    ${bc}
    ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}
    <h1>${title}</h1>
    ${lede ? `<p class="lede">${lede}</p>` : ''}
    ${extra}
  </div></section>`;
}

export function faqBlock(items, id = 'faq') {
  return `<div class="faq" id="${id}">${items.map((f) => `<details><summary>${f.q}</summary><div><p>${f.a}</p></div></details>`).join('')}</div>`;
}

export function contactForm(root, compact = false) {
  return `<form class="form" data-contact-form data-mailto="${site.email}" data-endpoint="" novalidate aria-label="טופס יצירת קשר">
    <div class="form__row">
      <div class="field"><label for="f-name-${compact ? 'c' : 'h'}">שם מלא *</label><input id="f-name-${compact ? 'c' : 'h'}" name="name" type="text" autocomplete="name" required><span class="field__error">אנא הזינו שם מלא.</span></div>
      <div class="field"><label for="f-phone-${compact ? 'c' : 'h'}">טלפון *</label><input id="f-phone-${compact ? 'c' : 'h'}" name="phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" required><span class="field__error">אנא הזינו מספר טלפון ישראלי תקין.</span></div>
    </div>
    <div class="form__row">
      <div class="field"><label for="f-email-${compact ? 'c' : 'h'}">אימייל</label><input id="f-email-${compact ? 'c' : 'h'}" name="email" type="email" autocomplete="email" dir="ltr"><span class="field__error">כתובת האימייל אינה תקינה.</span></div>
      <div class="field"><label for="f-topic-${compact ? 'c' : 'h'}">תחום הפנייה</label><select id="f-topic-${compact ? 'c' : 'h'}" name="topic"><option value="">בחרו תחום</option>${practiceAreas.map((p) => `<option>${p.name}</option>`).join('')}<option>אחר</option></select></div>
    </div>
    <div class="field"><label for="f-msg-${compact ? 'c' : 'h'}">במה נוכל לעזור? *</label><textarea id="f-msg-${compact ? 'c' : 'h'}" name="message" required></textarea><span class="field__error">אנא תארו את הפנייה בכמה מילים (לפחות 10 תווים).</span></div>
    <div class="field hp" aria-hidden="true"><label for="f-web-${compact ? 'c' : 'h'}">אתר</label><input id="f-web-${compact ? 'c' : 'h'}" name="website" type="text" tabindex="-1" autocomplete="off"></div>
    <label class="form__consent"><input type="checkbox" name="consent" required> אני מאשר/ת שהפרטים ישמשו ליצירת קשר בלבד, בהתאם ל<a href="${root}privacy.html">מדיניות הפרטיות</a>. שליחת הטופס אינה יוצרת יחסי עו״ד–לקוח.</label>
    <div class="form__status" role="status" aria-live="polite"></div>
    <div class="form__actions">
      <button class="btn btn--ink" type="submit">${icon('arrow')} שליחת הפנייה</button>
      <span class="form__consent">מענה תוך יום עסקים אחד</span>
    </div>
  </form>`;
}

export function shell({ root, active, title, description, canonical, body, jsonLd = [], includeHero3d = false, ogType = 'website' }) {
  const fullTitle = title ? `${title} | ${site.shortName}` : site.name;
  const ld = jsonLd.length ? `<script type="application/ld+json">${JSON.stringify(jsonLd.length === 1 ? jsonLd[0] : jsonLd)}</script>` : '';
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(description || site.description)}">
  <meta name="theme-color" content="#0e2a24">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(description || site.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="he_IL">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="${root}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="${root}manifest.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&family=Heebo:wght@300;400;500;700&display=swap">
  <link rel="stylesheet" href="${root}assets/css/style.css">
  ${ld}
</head>
<body>
  <a class="skip" href="#main">דלג לתוכן הראשי</a>
  ${header(root, active)}
  <main id="main">
${body}
  </main>
  ${footer(root)}
  ${includeHero3d ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" defer></script>\n  <script src="' + root + 'assets/js/hero3d.js" defer></script>' : ''}
  <script src="${root}assets/js/main.js" defer></script>
</body>
</html>
`;
}
