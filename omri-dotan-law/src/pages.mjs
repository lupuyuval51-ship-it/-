// ============================================================
//  בוני עמודים
// ============================================================
import { site, practiceAreas, process, values, testimonials, faq, team, articles, categories, readingTime } from './content.mjs';
import { icon, esc, formatDate, shell, pageHero, ctaBand, faqBlock, contactForm } from './layout.mjs';

const abs = (p) => `${site.url}/${p}`.replace(/\/index\.html$/, '/');

const orgLd = {
  '@context': 'https://schema.org', '@type': 'LegalService', name: site.name, url: site.url, telephone: site.phone, email: site.email,
  description: site.description, image: `${site.url}/assets/img/logo.svg`, priceRange: '₪₪',
  address: { '@type': 'PostalAddress', streetAddress: site.address.street, addressLocality: site.address.city, addressCountry: 'IL' },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:30', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Friday', opens: '09:00', closes: '12:30' },
  ],
  founder: { '@type': 'Person', name: team.founder.name },
  areaServed: 'IL',
  knowsAbout: practiceAreas.map((p) => p.name),
};
const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.label, item: it.abs })),
});

function articleCard(a, root, featured = false) {
  return `<a class="acard${featured ? ' acard--featured' : ''} reveal" href="${root}articles/${a.slug}.html" data-cat-item="${esc(a.category)}">
    <div class="acard__meta"><span class="acard__cat">${a.category}</span><span class="num">${formatDate(a.date)}</span><span class="num">${readingTime(a.body)} דק׳ קריאה</span></div>
    <h3>${a.title}</h3>
    <p>${a.excerpt}</p>
    <span class="acard__more">${featured ? 'לקריאת המאמר המלא' : 'לקריאה'} ←</span>
  </a>`;
}

function practiceCard(p, root) {
  return `<a class="pcard reveal" href="${root}practice/${p.slug}.html">
    <span class="pcard__glare"></span>
    <span class="pcard__icon">${icon(p.icon)}</span>
    <h3>${p.name}</h3>
    <p>${p.short}</p>
    <span class="pcard__more">${icon('arrow')} לפרטים</span>
  </a>`;
}

function processBlock() {
  return `<div class="process" data-stagger>${process.map((s, i) => `<div class="process__step reveal"><span class="process__n num">0${i + 1}</span><h3>${s.title}</h3><p>${s.text}</p></div>`).join('')}</div>`;
}

// כרטיס נתון עם מונה (motion.js סופר מ-0 לערך; הערך הסופי כבר בטקסט כמצב מנוחה וללא JS)
function stat(value, label, { prefix = '', suffix = '' } = {}) {
  return `<div class="stat reveal"><strong data-counter="${value}" data-prefix="${prefix}" data-suffix="${suffix}">${prefix}${value}${suffix}</strong><span>${label}</span></div>`;
}

// "המשרד במספרים" – ארבעה נתונים, מיד אחרי ה-Hero
function statsSection() {
  const years = new Date().getFullYear() - site.founded;
  return `<section class="section section--tight" aria-labelledby="stats-title">
  <div class="container">
    <h2 class="sr-only" id="stats-title">המשרד במספרים</h2>
    <div class="stat-row stat-row--4" data-stagger>
      ${stat(years, 'שנות פעילות וייצוג בכל הערכאות', { suffix: '+' })}
      ${stat(practiceAreas.length, 'תחומי עיסוק במיקוד מלא')}
      ${stat(1, 'יום עסקים למענה על כל פנייה')}
      ${stat(100, 'שקיפות בשכר הטרחה – הצעה כתובה מראש', { suffix: '%' })}
    </div>
  </div>
</section>`;
}

// רצועת מרקיז דקורטיבית: שמות תחומי העיסוק ושירות בולט (הקצר ביותר) מכל תחום, מופרדים בנקודת פליז
function marqueeStrip() {
  const shortest = (arr) => arr.reduce((a, b) => (b.length < a.length ? b : a));
  const items = practiceAreas.flatMap((p) => [p.name, shortest(p.services)]);
  const dot = '<span class="marquee__dot"></span>';
  return `<div class="marquee" data-marquee aria-hidden="true"><div class="marquee__track">${items.map((t) => `<span class="marquee__item">${t}</span>`).join(dot)}${dot}</div></div>`;
}

function valuesSection() {
  return `<section class="section section--dark"><div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">למה אנחנו</span><h2>ארבע התחייבויות שלא נסוג מהן</h2></div>
    <div class="values" data-stagger>${values.map((v) => `<div class="value reveal"><span class="value__icon">${icon(v.icon)}</span><h3>${v.title}</h3><p>${v.text}</p></div>`).join('')}</div>
  </div></section>`;
}

// ---------- דף הבית ----------
export function homePage() {
  const root = '';
  const latest = articles.slice(0, 3);
  const body = `
<section class="hero" aria-labelledby="hero-title">
  <div class="hero__canvas" id="hero-3d" aria-hidden="true"></div>
  <div class="hero__fallback" id="hero-3d-fallback" aria-hidden="true">
    <svg viewBox="0 0 400 400" fill="none" stroke="#d8b978" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M200 60v260M140 320h120M80 120h240"/><path d="M80 120l-40 100h80zM320 120l-40 100h80z"/><circle cx="200" cy="52" r="10"/><ellipse cx="200" cy="330" rx="90" ry="10" opacity=".5"/></svg>
  </div>
  <div class="hero__vignette" aria-hidden="true"></div>
  <div class="container hero__inner">
    <div class="hero__content">
      <span class="eyebrow reveal--line">משרד עורכי דין עומרי דותן</span>
      <h1 class="hero__title" id="hero-title" data-split>ייצוג משפטי<br>שמדבר <em>תכלית.</em></h1>
      <p class="hero__lede">ליווי אישי, אסטרטגיה כתובה ותוצאות – בדיני עבודה, מקרקעין, משפחה וירושה, נזיקין וליטיגציה מסחרית. אתם מבינים בדיוק איפה אתם עומדים, בכל שלב.</p>
      <div class="hero__actions">
        <a class="btn btn--brass" href="${root}contact.html" data-magnetic>${icon('calendar')} לתיאום פגישת ייעוץ</a>
        <a class="btn btn--ghost" href="${root}practice.html">תחומי העיסוק</a>
      </div>
      <div class="hero__trust">
        <span>${icon('check')} פגישה ראשונה ללא התחייבות</span>
        <span>${icon('check')} מענה תוך יום עסקים</span>
        <span>${icon('check')} ייצוג בכל הערכאות</span>
      </div>
    </div>
  </div>
  <span class="hero__scroll" aria-hidden="true">גללו</span>
</section>

${statsSection()}

${marqueeStrip()}

<section class="section section--tight" aria-labelledby="process-title">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">איך זה עובד</span><h2 id="process-title">שלושה שלבים, בלי הפתעות</h2></div>
    ${processBlock()}
  </div>
</section>

<section class="section" aria-labelledby="practice-title">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">תחומי עיסוק</span><h2 id="practice-title">מומחיות ממוקדת בתחומים שמשנים חיים ועסקים</h2><p class="lede">שישה תחומי ליבה, גישה אחת: להבין קודם מה חשוב לכם, ורק אז לבנות את הדרך המשפטית.</p></div>
    <div class="practice-grid" data-stagger>${practiceAreas.map((p) => practiceCard(p, root)).join('')}</div>
  </div>
</section>

<section class="section section--surface" aria-labelledby="about-title">
  <div class="container about-split">
    <div class="portrait reveal" data-parallax="0.12">
      <span class="portrait__grain" aria-hidden="true"></span>
      <svg class="portrait__mark" viewBox="0 0 400 400" fill="none" stroke="#d8b978" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M200 60v260M140 320h120M80 120h240"/><path d="M80 120l-40 100h80zM320 120l-40 100h80z"/><circle cx="200" cy="52" r="10"/></svg>
      <p class="portrait__quote">„${team.founder.quote}”</p>
      <p class="portrait__by">${team.founder.name}, ${team.founder.title}</p>
    </div>
    <div class="about-split__text reveal" data-delay="1">
      <span class="eyebrow reveal--line">אודות המשרד</span>
      <h2 id="about-title">משרד בוטיק עם סטנדרט של משרד גדול</h2>
      <p>${team.founder.bio[0]}</p>
      <p>${team.teamText}</p>
      <ul class="about-list" data-stagger>
        <li class="reveal">${icon('check')} <span>הצעת שכר טרחה כתובה לפני תחילת העבודה</span></li>
        <li class="reveal">${icon('check')} <span>עורך הדין שפגשתם הוא עורך הדין שמטפל בתיק</span></li>
        <li class="reveal">${icon('check')} <span>פגישות במשרד, בווידאו או אצל הלקוח</span></li>
      </ul>
      <div><a class="link-arrow" href="${root}about.html">להכיר את המשרד ${icon('arrow')}</a></div>
    </div>
  </div>
</section>

${valuesSection()}

<section class="section" aria-labelledby="testimonials-title">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">לקוחות מספרים</span><h2 id="testimonials-title">מה אומרים מי שכבר עברו את זה איתנו</h2></div>
    <div class="testimonials" data-slider role="region" aria-roledescription="carousel" aria-label="המלצות לקוחות">${testimonials.map((t, i) => `<article class="tcard reveal" data-delay="${i + 1}"><span class="tcard__mark">${icon('quote')}</span><blockquote>${t.quote}</blockquote><footer><strong>${t.name}</strong><span>${t.role}</span></footer></article>`).join('')}</div>
  </div>
</section>

<section class="section section--surface" aria-labelledby="articles-title">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">מאמרים ומדריכים</span><h2 id="articles-title">ידע משפטי בשפה של בני אדם</h2><p class="lede">מדריכים מעשיים שכתבנו כדי שתגיעו לפגישה – או להחלטה – עם פחות שאלות פתוחות.</p></div>
    <div class="articles-grid" data-stagger>${latest.map((a) => articleCard(a, root)).join('')}</div>
    <p style="margin-block-start:2rem"><a class="link-arrow" href="${root}articles.html">לכל המאמרים ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section" aria-labelledby="faq-title">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">שאלות נפוצות</span><h2 id="faq-title">לפני שמרימים טלפון</h2></div>
    ${faqBlock(faq)}
  </div>
</section>

<section class="section section--dark" id="contact" aria-labelledby="contact-title">
  <div class="container contact-band">
    <div class="contact-info reveal">
      <span class="eyebrow reveal--line">צור קשר</span>
      <h2 id="contact-title">ספרו לנו במה מדובר. נחזור אליכם תוך יום עסקים.</h2>
      <p>השאירו פרטים, או התקשרו ישירות. בפגישה הראשונה נקשיב, נשאל, וניתן לכם הערכה כנה – גם אם המסקנה היא שלא כדאי לכם לתבוע.</p>
      <ul class="contact-lines" data-stagger>
        <li class="reveal">${icon('phone')}<div><small>טלפון</small><a href="${site.phoneHref}" class="num">${site.phone}</a></div></li>
        <li class="reveal">${icon('whatsapp')}<div><small>וואטסאפ</small><a href="${site.whatsappHref}" target="_blank" rel="noopener" class="num">${site.whatsapp}</a></div></li>
        <li class="reveal">${icon('mail')}<div><small>אימייל</small><a href="mailto:${site.email}">${site.email}</a></div></li>
        <li class="reveal">${icon('pin')}<div><small>כתובת</small>${esc(site.address.street)}, ${esc(site.address.city)}</div></li>
      </ul>
    </div>
    <div class="reveal" data-delay="1">${contactForm(root)}</div>
  </div>
</section>`;
  return shell({ root, active: 'index.html', title: '', description: site.description, canonical: abs('index.html'), body, jsonLd: [orgLd], includeHero3d: true, includePreloader: true });
}

// ---------- אודות ----------
export function aboutPage() {
  const root = '';
  const body = `
${pageHero({ eyebrow: 'אודות', title: 'משרד שנבנה סביב שאלה אחת: מה הלקוח באמת צריך?', lede: 'לא כל בעיה משפטית מצדיקה תביעה, ולא כל חוזה צריך 40 עמודים. אנחנו כאן כדי לתת לכם את התמונה המלאה – ולפעול.', crumbs: [{ label: 'דף הבית', href: 'index.html' }, { label: 'אודות' }] })}
<section class="section">
  <div class="container team-grid">
    <div class="portrait reveal" data-parallax="0.12">
      <span class="portrait__grain" aria-hidden="true"></span>
      <svg class="portrait__mark" viewBox="0 0 400 400" fill="none" stroke="#d8b978" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M200 60v260M140 320h120M80 120h240"/><path d="M80 120l-40 100h80zM320 120l-40 100h80z"/><circle cx="200" cy="52" r="10"/></svg>
      <p class="portrait__quote">„${team.founder.quote}”</p>
      <p class="portrait__by">${team.founder.name}</p>
    </div>
    <div class="team-bio reveal" data-delay="1">
      <span class="role">${team.founder.title}</span>
      <h2>${team.founder.name}</h2>
      ${team.founder.bio.map((p) => `<p>${p}</p>`).join('')}
      <div class="stat-row" data-stagger>
        ${stat(new Date().getFullYear() - site.founded, 'שנות פעילות המשרד', { suffix: '+' })}
        ${stat(practiceAreas.length, 'תחומי עיסוק')}
        ${stat(1, 'יום עסקים למענה')}
      </div>
    </div>
  </div>
</section>
<section class="section section--surface">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">הצוות</span><h2>אנשים, לא מחלקות</h2><p class="lede">${team.teamText}</p></div>
    ${processBlock()}
  </div>
</section>
${valuesSection()}
<section class="section">
  <div class="container">
    <div class="section-head reveal"><span class="eyebrow reveal--line">תחומי עיסוק</span><h2>במה אנחנו עוסקים</h2></div>
    <div class="practice-grid" data-stagger>${practiceAreas.map((p) => practiceCard(p, root)).join('')}</div>
  </div>
</section>
${ctaBand(root)}`;
  return shell({ root, active: 'about.html', title: 'אודות המשרד', description: 'הכירו את עו״ד עומרי דותן ואת צוות המשרד: גישה אישית, שקיפות מלאה וייצוג נחוש בכל הערכאות.', canonical: abs('about.html'), body, jsonLd: [orgLd, breadcrumbLd([{ label: 'דף הבית', abs: abs('index.html') }, { label: 'אודות', abs: abs('about.html') }])] });
}

// ---------- תחומי עיסוק – סקירה ----------
export function practiceIndexPage() {
  const root = '';
  const body = `
${pageHero({ eyebrow: 'תחומי עיסוק', title: 'שישה תחומי ליבה. גישה אחת.', lede: 'אנו מעדיפים עומק על פני רוחב: בכל אחד מהתחומים הבאים המשרד מטפל בעשרות תיקים בשנה, ומכיר את הפסיקה, את השופטים ואת הצד השני.', crumbs: [{ label: 'דף הבית', href: 'index.html' }, { label: 'תחומי עיסוק' }] })}
<section class="section"><div class="container">
  <div class="practice-grid" data-stagger>${practiceAreas.map((p) => practiceCard(p, root)).join('')}</div>
</div></section>
<section class="section section--surface"><div class="container">
  <div class="section-head reveal"><span class="eyebrow reveal--line">איך זה עובד</span><h2>מהפגישה הראשונה ועד לתוצאה</h2></div>
  ${processBlock()}
</div></section>
<section class="section"><div class="container">
  <div class="section-head reveal"><span class="eyebrow reveal--line">שאלות נפוצות</span><h2>שכר טרחה, זמנים ומה להביא</h2></div>
  ${faqBlock(faq)}
</div></section>
${ctaBand(root)}`;
  return shell({ root, active: 'practice.html', title: 'תחומי עיסוק', description: 'דיני עבודה, מקרקעין, משפחה וירושה, נזיקין וביטוח, ליטיגציה מסחרית ודיני חברות – תחומי העיסוק של משרד עורכי דין עומרי דותן.', canonical: abs('practice.html'), body, jsonLd: [breadcrumbLd([{ label: 'דף הבית', abs: abs('index.html') }, { label: 'תחומי עיסוק', abs: abs('practice.html') }])] });
}

// ---------- תחום עיסוק ----------
export function practicePage(p) {
  const root = '../';
  const related = p.related.map((s) => articles.find((a) => a.slug === s)).filter(Boolean);
  const others = practiceAreas.filter((o) => o.slug !== p.slug);
  const body = `
${pageHero({ eyebrow: 'תחומי עיסוק', title: p.name, lede: p.short, crumbs: [{ label: 'דף הבית', href: `${root}index.html` }, { label: 'תחומי עיסוק', href: `${root}practice.html` }, { label: p.name }] })}
<section class="section"><div class="container practice-layout">
  <div>
    <div class="prose reveal">${p.intro.map((t) => `<p>${t}</p>`).join('')}</div>
    <h2 style="margin-block-start:2.5rem;font-size:var(--fs-xl)" class="reveal">מה אנחנו עושים</h2>
    <ul class="services" data-stagger>${p.services.map((s) => `<li class="reveal">${icon('check')}<span>${s}</span></li>`).join('')}</ul>
    <h2 style="margin-block-start:3rem;font-size:var(--fs-xl)" class="reveal">שאלות נפוצות ב${p.name}</h2>
    ${faqBlock(p.faq, 'faq-' + p.slug)}
  </div>
  <aside class="aside">
    <div class="aside__box aside__box--dark reveal">
      <h3>נתקלתם בבעיה ב${p.name}?</h3>
      <p>פגישת היכרות ראשונה ללא עלות. ספרו לנו מה קרה ונאמר לכם בכנות מה האפשרויות.</p>
      <a class="btn btn--brass" href="${root}contact.html">${icon('calendar')} לתיאום פגישה</a>
      <a class="btn btn--ghost" href="${site.phoneHref}">${icon('phone')} <span class="num">${site.phone}</span></a>
    </div>
    ${related.length ? `<div class="aside__box reveal"><h3>מאמרים קשורים</h3><ul class="aside__list">${related.map((a) => `<li><a href="${root}articles/${a.slug}.html">${a.title}</a></li>`).join('')}</ul></div>` : ''}
    <div class="aside__box reveal"><h3>תחומים נוספים</h3><ul class="aside__list">${others.map((o) => `<li><a href="${root}practice/${o.slug}.html">${o.name}</a></li>`).join('')}</ul></div>
  </aside>
</div></section>
${ctaBand(root)}`;
  return shell({ root, active: 'practice.html', title: p.name, description: `${p.name} – ${p.short} משרד עורכי דין עומרי דותן.`, canonical: abs(`practice/${p.slug}.html`), body, jsonLd: [breadcrumbLd([{ label: 'דף הבית', abs: abs('index.html') }, { label: 'תחומי עיסוק', abs: abs('practice.html') }, { label: p.name, abs: abs(`practice/${p.slug}.html`) }])] });
}

// ---------- מאמרים – רשימה ----------
export function articlesIndexPage() {
  const root = '';
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  const body = `
${pageHero({ eyebrow: 'מאמרים ומדריכים', title: 'ידע משפטי, בלי ז׳רגון', lede: 'מדריכים מעשיים בנושאים שמעסיקים את הלקוחות שלנו יום־יום. הכתיבה נגישה, אבל הדיוק המשפטי לא נפגע.', crumbs: [{ label: 'דף הבית', href: 'index.html' }, { label: 'מאמרים' }] })}
<section class="section"><div class="container">
  <div class="filters" role="group" aria-label="סינון מאמרים">
    <label class="filters__search">${icon('search')}<span class="sr-only">חיפוש במאמרים</span><input type="search" data-search placeholder="חיפוש במאמרים…"></label>
    <button class="chip" type="button" data-cat="all" aria-pressed="true">הכול</button>
    ${categories.map((c) => `<button class="chip" type="button" data-cat="${esc(c)}" aria-pressed="false">${c}</button>`).join('')}
  </div>
  <div class="articles-grid" data-stagger data-articles>${sorted.map((a, i) => articleCard(a, root, i === 0)).join('')}</div>
  <div class="empty" data-empty hidden>לא נמצאו מאמרים התואמים את החיפוש.</div>
</div></section>
${ctaBand(root, 'לא מצאתם תשובה?', 'כל מקרה שונה. שיחת ייעוץ קצרה תחסוך לכם שעות של חיפוש.')}`;
  return shell({ root, active: 'articles.html', title: 'מאמרים ומדריכים משפטיים', description: 'מאמרים ומדריכים משפטיים בשפה נגישה: דיני עבודה, מקרקעין, ירושה, נזיקין, לשון הרע ומיסוי – מאת משרד עורכי דין עומרי דותן.', canonical: abs('articles.html'), body, jsonLd: [breadcrumbLd([{ label: 'דף הבית', abs: abs('index.html') }, { label: 'מאמרים', abs: abs('articles.html') }])] });
}

// ---------- מאמר ----------
export function articlePage(a) {
  const root = '../';
  const sorted = [...articles].sort((x, y) => y.date.localeCompare(x.date));
  const idx = sorted.findIndex((x) => x.slug === a.slug);
  const prev = sorted[idx + 1]; // ישן יותר
  const next = sorted[idx - 1]; // חדש יותר
  const related = sorted.filter((x) => x.slug !== a.slug && x.category === a.category).slice(0, 3);
  const more = related.length ? related : sorted.filter((x) => x.slug !== a.slug).slice(0, 3);
  const area = practiceAreas.find((p) => p.related.includes(a.slug));
  const rt = readingTime(a.body);
  const body = `
${pageHero({ eyebrow: a.category, title: a.title, crumbs: [{ label: 'דף הבית', href: `${root}index.html` }, { label: 'מאמרים', href: `${root}articles.html` }, { label: a.category }],
  extra: `<div class="article-meta"><span>${icon('calendar')} <time datetime="${a.date}" class="num">${formatDate(a.date)}</time></span><span>${icon('clock')} <span class="num">${rt} דקות קריאה</span></span><span>${icon('scale')} ${team.founder.name}</span></div>` })}
<article class="section"><div class="container article-layout">
  <div class="article-body">
    <div class="prose">${a.body.trim()}</div>
    <div class="disclaimer"><strong>הבהרה:</strong> המידע במאמר זה הוא כללי, נכון למועד כתיבתו ואינו מהווה ייעוץ משפטי. הוראות החוק, הסכומים והתקרות משתנים מעת לעת, וכל מקרה נבחן לפי נסיבותיו. לקבלת ייעוץ המותאם לכם, <a href="${root}contact.html">צרו קשר</a>.</div>
    <div class="share"><span class="share__label">שיתוף:</span>
      <button type="button" data-share="whatsapp">${icon('whatsapp')} וואטסאפ</button>
      <button type="button" data-share="linkedin">${icon('linkedin')} לינקדאין</button>
      <button type="button" data-share="facebook">${icon('facebook')} פייסבוק</button>
      <button type="button" data-share="copy">${icon('link')} העתקת קישור</button>
    </div>
    <nav class="article-nav" aria-label="מאמרים סמוכים">
      ${next ? `<a href="${root}articles/${next.slug}.html"><small>המאמר החדש יותר</small><span>${next.title}</span></a>` : '<span></span>'}
      ${prev ? `<a href="${root}articles/${prev.slug}.html"><small>המאמר הקודם</small><span>${prev.title}</span></a>` : '<span></span>'}
    </nav>
  </div>
  <aside class="aside">
    <div class="aside__box reveal">
      <h3>${team.founder.name}</h3>
      <p>${team.founder.title}. ${team.founder.bio[0]}</p>
      <a class="link-arrow" href="${root}about.html">אודות המשרד ${icon('arrow')}</a>
    </div>
    <div class="aside__box aside__box--dark reveal">
      <h3>${area ? `צריכים עזרה ב${area.name}?` : 'צריכים ייעוץ?'}</h3>
      <p>פגישת היכרות ראשונה ללא עלות וללא התחייבות.</p>
      <a class="btn btn--brass" href="${root}contact.html">${icon('calendar')} לתיאום פגישה</a>
      ${area ? `<a class="link-arrow" style="color:var(--brass-bright)" href="${root}practice/${area.slug}.html">על ${area.name} במשרד ${icon('arrow')}</a>` : ''}
    </div>
    <div class="aside__box reveal"><h3>עוד בנושא</h3><ul class="aside__list">${more.map((m) => `<li><a href="${root}articles/${m.slug}.html">${m.title}</a></li>`).join('')}</ul></div>
  </aside>
</div></article>
<section class="section section--surface"><div class="container">
  <div class="section-head reveal"><span class="eyebrow reveal--line">המשך קריאה</span><h2>מאמרים נוספים</h2></div>
  <div class="articles-grid" data-stagger>${more.map((m) => articleCard(m, root)).join('')}</div>
</div></section>`;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'Article', headline: a.title, description: a.excerpt, datePublished: a.date, dateModified: a.date,
    inLanguage: 'he', articleSection: a.category, wordCount: a.body.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length,
    author: { '@type': 'Person', name: team.founder.name }, publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: `${site.url}/assets/img/logo.svg` } },
    mainEntityOfPage: abs(`articles/${a.slug}.html`),
  }, breadcrumbLd([{ label: 'דף הבית', abs: abs('index.html') }, { label: 'מאמרים', abs: abs('articles.html') }, { label: a.title, abs: abs(`articles/${a.slug}.html`) }])];
  return shell({ root, active: 'articles.html', title: a.title, description: a.excerpt, canonical: abs(`articles/${a.slug}.html`), body, jsonLd: ld, ogType: 'article', includeProgress: true });
}

// ---------- צור קשר ----------
export function contactPage() {
  const root = '';
  const body = `
${pageHero({ eyebrow: 'צור קשר', title: 'נשמח לשמוע במה מדובר', lede: 'טלפון, וואטסאפ, אימייל או הטופס – מה שנוח לכם. מענה תוך יום עסקים אחד, והפגישה הראשונה ללא התחייבות.', crumbs: [{ label: 'דף הבית', href: 'index.html' }, { label: 'צור קשר' }] })}
<section class="section section--tight"><div class="container">
  <div class="contact-cards" data-stagger>
    <div class="ccard reveal">${icon('phone')}<h3>טלפון</h3><p>בשעות הפעילות. מחוץ להן – השאירו הודעה ונחזור אליכם.</p><a href="${site.phoneHref}" class="num">${site.phone}</a></div>
    <div class="ccard reveal">${icon('whatsapp')}<h3>וואטסאפ</h3><p>הדרך המהירה ביותר לתיאום פגישה או לשאלה קצרה.</p><a href="${site.whatsappHref}" target="_blank" rel="noopener" class="num">${site.whatsapp}</a></div>
    <div class="ccard reveal">${icon('mail')}<h3>אימייל</h3><p>למסמכים, לפניות מפורטות ולהצעות שכר טרחה.</p><a href="mailto:${site.email}">${site.email}</a></div>
  </div>
</div></section>
<section class="section section--dark" id="form"><div class="container contact-band">
  <div class="contact-info reveal">
    <span class="eyebrow reveal--line">השאירו פרטים</span>
    <h2>הטופס מגיע ישירות לעו״ד המטפל</h2>
    <p>כתבו בכמה משפטים מה קרה ומה הייתם רוצים שיקרה. אין צורך בניסוח משפטי – זה התפקיד שלנו.</p>
    <ul class="contact-lines" data-stagger>
      <li class="reveal">${icon('pin')}<div><small>המשרד</small>${esc(site.address.street)}<br>${esc(site.address.city)}, ${esc(site.address.floor)}</div></li>
      <li class="reveal">${icon('video')}<div><small>פגישות מרחוק</small>פגישות ייעוץ מתקיימות גם בזום ובווידאו־וואטסאפ</div></li>
    </ul>
    <div class="hours" aria-label="שעות פעילות">${site.hours.map((h) => `<div><span>${h.days}</span><span>${h.time}</span></div>`).join('')}</div>
  </div>
  <div class="reveal" data-delay="1">${contactForm(root, true)}</div>
</div></section>
<section class="section"><div class="container">
  <div class="map-box reveal">
    <div class="map-box__art" aria-hidden="true">
      <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="currentColor" stroke-opacity=".12"/></pattern></defs><rect width="800" height="300" fill="url(#grid)"/><g fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width="6" stroke-linecap="round"><path d="M-20 200 C120 180 200 120 330 140 S560 210 820 90"/><path d="M180 -20 C200 80 240 160 210 320"/><path d="M520 -20 C480 90 560 200 620 320"/></g><g transform="translate(400 150)"><circle r="26" fill="#d8b978" fill-opacity=".25"/><circle r="10" fill="#a8894f"/></g></svg>
    </div>
    <div class="map-box__body">
      <div><strong>${esc(site.address.street)}</strong><br><span style="color:var(--muted);font-size:var(--fs-sm)">${esc(site.address.city)}, ${esc(site.address.floor)} · חניה בחניון המגדל · תחנת רכבת סמוכה</span></div>
      <a class="btn btn--ghost-dark" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address.street + ' ' + site.address.city)}" target="_blank" rel="noopener">${icon('pin')} פתיחה בגוגל מפות</a>
    </div>
  </div>
</div></section>
<section class="section section--surface"><div class="container">
  <div class="section-head reveal"><span class="eyebrow reveal--line">שאלות נפוצות</span><h2>לפני הפגישה</h2></div>
  ${faqBlock(faq, 'faq-contact')}
</div></section>`;
  return shell({ root, active: 'contact.html', title: 'צור קשר', description: `יצירת קשר עם משרד עורכי דין עומרי דותן: טלפון ${site.phone}, וואטסאפ, אימייל וטופס פנייה. מענה תוך יום עסקים.`, canonical: abs('contact.html'), body, jsonLd: [orgLd, breadcrumbLd([{ label: 'דף הבית', abs: abs('index.html') }, { label: 'צור קשר', abs: abs('contact.html') }])] });
}

// ---------- עמודים משפטיים ----------
function legalPage({ file, title, lede, content, active = '' }) {
  const body = `${pageHero({ title, lede, crumbs: [{ label: 'דף הבית', href: 'index.html' }, { label: title }] })}
<section class="section"><div class="container"><div class="legal">${content}</div></div></section>`;
  return shell({ root: '', active, title, description: lede, canonical: abs(file), body });
}

export function accessibilityPage() {
  return legalPage({ file: 'accessibility.html', title: 'הצהרת נגישות', lede: 'אנו רואים חשיבות רבה בהנגשת האתר לאנשים עם מוגבלות, מתוך אמונה בזכות לשוויון ולכבוד.', content: `
<p>משרד עורכי דין עומרי דותן פועל להנגשת האתר בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג–2013, ולתקן הישראלי ת״י 5568 המבוסס על הנחיות WCAG 2.1 ברמה AA.</p>
<h2>התאמות שבוצעו באתר</h2>
<ul>
<li>תפריט נגישות המאפשר הגדלת טקסט, ניגודיות גבוהה, מצב כהה, הדגשת קישורים ועצירת אנימציות.</li>
<li>מבנה סמנטי תקין: כותרות היררכיות, אזורי ניווט מסומנים, קישור דילוג לתוכן.</li>
<li>ניווט מלא באמצעות מקלדת עם סימון פוקוס ברור.</li>
<li>טקסט חלופי לאלמנטים גרפיים ותיאורי ARIA לרכיבים אינטראקטיביים.</li>
<li>תמיכה בהעדפת מערכת להפחתת תנועה (prefers-reduced-motion) – הסצנה התלת־ממדית מוצגת כתמונה סטטית.</li>
<li>ניגודיות צבעים העומדת בדרישות התקן, וטקסט הניתן להגדלה עד 200% ללא אובדן תוכן.</li>
<li>טפסים עם תוויות מקושרות, הודעות שגיאה ברורות והנחיות למילוי.</li>
</ul>
<h2>נגישות המשרד הפיזי</h2>
<p>המשרד ממוקם בבניין הכולל גישה נגישה, מעליות וחניות נכים בחניון. לתיאום סיוע מיוחד לקראת הגעה – אנא צרו קשר מראש.</p>
<h2>פנייה בנושא נגישות</h2>
<p>אם נתקלתם בקושי בגלישה באתר או בקבלת השירות, נשמח שתיידעו אותנו כדי שנוכל לתקן: רכז/ת הנגישות של המשרד, בטלפון <a href="${site.phoneHref}" class="num">${site.phone}</a> או באימייל <a href="mailto:${site.email}">${site.email}</a>.</p>
<p><em>הצהרה זו עודכנה לאחרונה ב־${formatDate('2026-09-01')}.</em></p>` });
}

export function privacyPage() {
  return legalPage({ file: 'privacy.html', title: 'מדיניות פרטיות', lede: 'אילו פרטים אנו אוספים באתר, לשם מה, ומהן זכויותיכם.', content: `
<p>מדיניות זו מתארת את אופן הטיפול במידע אישי הנמסר באתר ${esc(site.name)} (״האתר״). השימוש באתר מהווה הסכמה למדיניות זו.</p>
<h2>איזה מידע נאסף</h2>
<ul>
<li><strong>פרטים שאתם מוסרים</strong> – שם, טלפון, אימייל ותוכן הפנייה בטופס יצירת הקשר.</li>
<li><strong>מידע טכני</strong> – סוג הדפדפן, מערכת ההפעלה וכתובת IP, כפי שנאספים בשרתי האחסון לצורכי אבטחה ותפעול.</li>
<li><strong>העדפות נגישות</strong> – נשמרות באחסון המקומי של הדפדפן שלכם בלבד ואינן מועברות אלינו.</li>
</ul>
<h2>מטרות השימוש</h2>
<p>המידע משמש למתן מענה לפנייתכם, לתיאום פגישות, ולשיפור השירות והאתר. לא נעשה במידע שימוש לדיוור פרסומי ללא הסכמתכם המפורשת.</p>
<h2>העברה לצדדים שלישיים</h2>
<p>המידע אינו נמכר ואינו מועבר לצדדים שלישיים, למעט ספקי שירות הפועלים מטעמנו (אחסון, דוא״ל) והמחויבים בסודיות, או כשהדבר נדרש על פי דין.</p>
<h2>סודיות עורך דין–לקוח</h2>
<p>מידע הנמסר לצורך קבלת ייעוץ משפטי חוסה תחת חובת הסודיות המקצועית של עורך הדין. עם זאת, פנייה דרך האתר אינה יוצרת לכשעצמה יחסי עורך דין–לקוח.</p>
<h2>עוגיות (Cookies)</h2>
<p>האתר אינו עושה שימוש בעוגיות מעקב או פרסום. שירותי גופנים חיצוניים (Google Fonts) עשויים לרשום את כתובת ה־IP שלכם בהתאם למדיניות הפרטיות שלהם.</p>
<h2>זכויותיכם</h2>
<p>על פי חוק הגנת הפרטיות, התשמ״א–1981, אתם זכאים לעיין במידע שנשמר אודותיכם ולבקש את תיקונו או מחיקתו. לפניות: <a href="mailto:${site.email}">${site.email}</a>.</p>
<h2>עדכונים</h2>
<p>אנו רשאים לעדכן מדיניות זו מעת לעת. הנוסח המחייב הוא זה המפורסם באתר. עודכן לאחרונה: ${formatDate('2026-09-01')}.</p>` });
}

export function termsPage() {
  return legalPage({ file: 'terms.html', title: 'תנאי שימוש', lede: 'הכללים לשימוש באתר ובתכניו.', content: `
<h2>כללי</h2>
<p>אתר זה מופעל על ידי ${esc(site.name)}. הגלישה באתר והשימוש בתכניו כפופים לתנאים אלה. אם אינכם מסכימים לתנאים – אנא הימנעו משימוש באתר.</p>
<h2>המידע באתר אינו ייעוץ משפטי</h2>
<p>התכנים באתר, לרבות המאמרים והמדריכים, נועדו למתן מידע כללי בלבד. הם אינם מהווים ייעוץ משפטי, חוות דעת או תחליף לייעוץ פרטני המותאם לנסיבות המקרה. הדין, הפסיקה והסכומים הנקובים משתנים מעת לעת, והמשרד אינו מתחייב לעדכניותם.</p>
<h2>היעדר יחסי עורך דין–לקוח</h2>
<p>גלישה באתר, קריאת תכניו או שליחת פנייה באמצעותו אינן יוצרות יחסי עורך דין–לקוח. יחסים כאלה נוצרים רק עם חתימה על הסכם שכר טרחה.</p>
<h2>קניין רוחני</h2>
<p>כל התכנים באתר – טקסטים, עיצוב, סמלים וקוד – הם קניינו של המשרד או של צדדים שלישיים שהתירו את השימוש בהם. אין להעתיק, לפרסם או לעשות שימוש מסחרי בתכנים ללא אישור בכתב. ניתן לשתף קישורים למאמרים.</p>
<h2>הגבלת אחריות</h2>
<p>המשרד לא יישא באחריות לכל נזק, ישיר או עקיף, הנובע מהסתמכות על תכני האתר או מהשימוש בו, לרבות תקלות טכניות או אי־זמינות.</p>
<h2>קישורים חיצוניים</h2>
<p>האתר עשוי לכלול קישורים לאתרים חיצוניים. המשרד אינו אחראי לתכניהם או למדיניות הפרטיות שלהם.</p>
<h2>דין וסמכות שיפוט</h2>
<p>על תנאים אלה יחול הדין הישראלי, וסמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים במחוז תל אביב.</p>
<p>עודכן לאחרונה: ${formatDate('2026-09-01')}.</p>` });
}

export function notFoundPage() {
  const body = `<section class="container notfound">
    <span class="big num">404</span>
    <h1>העמוד לא נמצא</h1>
    <p class="lede">ייתכן שהכתובת השתנתה או שהקישור שגוי. אפשר לחזור לדף הבית או לעיין במאמרים.</p>
    <div class="hero__actions"><a class="btn btn--ink" href="index.html">לדף הבית</a><a class="btn btn--ghost-dark" href="articles.html">למאמרים</a></div>
  </section>`;
  return shell({ root: '', active: '', title: 'העמוד לא נמצא', description: 'העמוד המבוקש לא נמצא.', canonical: abs('404.html'), body });
}
