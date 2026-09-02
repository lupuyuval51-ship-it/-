#!/usr/bin/env node
// ============================================================
//  בניית האתר: node build.mjs
//  פלט: dist/  (אתר סטטי מלא)  +  preview/omri-dotan-law.html (קובץ יחיד לתצוגה מקדימה)
// ============================================================
import { mkdir, writeFile, readFile, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { site, practiceAreas, articles } from './src/content.mjs';
import * as P from './src/pages.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const src = path.join(here, 'src');

const pages = [
  { file: 'index.html', html: P.homePage(), title: 'דף הבית' },
  { file: 'about.html', html: P.aboutPage(), title: 'אודות' },
  { file: 'practice.html', html: P.practiceIndexPage(), title: 'תחומי עיסוק' },
  ...practiceAreas.map((p) => ({ file: `practice/${p.slug}.html`, html: P.practicePage(p), title: p.name })),
  { file: 'articles.html', html: P.articlesIndexPage(), title: 'מאמרים' },
  ...articles.map((a) => ({ file: `articles/${a.slug}.html`, html: P.articlePage(a), title: a.title })),
  { file: 'contact.html', html: P.contactPage(), title: 'צור קשר' },
  { file: 'accessibility.html', html: P.accessibilityPage(), title: 'הצהרת נגישות' },
  { file: 'privacy.html', html: P.privacyPage(), title: 'מדיניות פרטיות' },
  { file: 'terms.html', html: P.termsPage(), title: 'תנאי שימוש' },
  { file: '404.html', html: P.notFoundPage(), title: '404' },
];

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, 'articles'), { recursive: true });
await mkdir(path.join(dist, 'practice'), { recursive: true });
await cp(path.join(src, 'assets'), path.join(dist, 'assets'), { recursive: true });

for (const p of pages) await writeFile(path.join(dist, p.file), p.html, 'utf8');

// sitemap / robots / manifest
const today = new Date().toISOString().slice(0, 10);
const urls = pages.filter((p) => p.file !== '404.html').map((p) => {
  const loc = `${site.url}/${p.file}`.replace(/\/index\.html$/, '/');
  const pri = p.file === 'index.html' ? '1.0' : p.file.startsWith('articles/') ? '0.7' : p.file.match(/^(privacy|terms|accessibility)/) ? '0.3' : '0.8';
  return `  <url><loc>${loc}</loc><lastmod>${today}</lastmod><priority>${pri}</priority></url>`;
});
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
await writeFile(path.join(dist, 'manifest.webmanifest'), JSON.stringify({
  name: site.name, short_name: 'עומרי דותן עו״ד', start_url: '/', display: 'standalone', background_color: '#0e2a24', theme_color: '#0e2a24', lang: 'he', dir: 'rtl',
  icons: [{ src: 'assets/img/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2));
await writeFile(path.join(dist, '.htaccess'), `ErrorDocument 404 /404.html\nAddDefaultCharset UTF-8\n<IfModule mod_headers.c>\n  Header set X-Content-Type-Options "nosniff"\n  Header set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>\n`);

// ---------- תצוגה מקדימה בקובץ יחיד (ניתוב לפי hash) ----------
const css = await readFile(path.join(src, 'assets/css/style.css'), 'utf8');
const mainJs = await readFile(path.join(src, 'assets/js/main.js'), 'utf8');
const heroJs = await readFile(path.join(src, 'assets/js/hero3d.js'), 'utf8');
const favicon = await readFile(path.join(src, 'assets/img/favicon.svg'), 'utf8');
const faviconUri = 'data:image/svg+xml;utf8,' + encodeURIComponent(favicon);

const routeOf = (file) => '/' + file.replace(/\.html$/, '').replace(/^index$/, '');
const rewriteLinks = (html) => html
  .replace(/href="(?:\.\.\/)?((?:articles|practice)\/[a-z0-9-]+|[a-z0-9-]+)\.html(#[^"]*)?"/g, (m, f, hash) => `href="#${routeOf(f)}${hash ? '' : ''}"`)
  .replace(/(?:\.\.\/)?assets\/img\/favicon\.svg/g, faviconUri);

const homeDoc = pages[0].html;
const headerHtml = rewriteLinks(homeDoc.match(/<header class="header">[\s\S]*?<\/header>/)[0]);
const footerHtml = rewriteLinks(homeDoc.match(/<footer class="footer"[\s\S]*?<\/footer>/)[0] + homeDoc.match(/<a class="float-wa"[\s\S]*?<button class="a11y__btn"[\s\S]*?<\/button>\n<\/div>/)[0]);
const routes = pages.map((p) => {
  const main = p.html.match(/<main id="main">([\s\S]*?)<\/main>/)[1];
  const r = routeOf(p.file);
  return `<div data-route="${r}" data-title="${p.title.replace(/"/g, '&quot;')}"${r === '/' ? '' : ' hidden'}>${rewriteLinks(main)}</div>`;
}).join('\n');

const routerJs = `
(function(){
  var routes = document.querySelectorAll('[data-route]');
  function show(){
    var h = (location.hash || '#/').replace(/^#/, '');
    if (h === '') h = '/';
    var found = false;
    routes.forEach(function(r){ var on = r.getAttribute('data-route') === h; r.hidden = !on; if (on) { found = true; document.title = r.getAttribute('data-title') + ' | ${site.shortName}'; } });
    if (!found) { routes.forEach(function(r){ r.hidden = r.getAttribute('data-route') !== '/404'; }); }
    document.querySelectorAll('.nav__link').forEach(function(a){
      var t = a.getAttribute('href').replace(/^#/, '');
      var cur = t === h || (t === '/practice' && h.indexOf('/practice') === 0) || (t === '/articles' && h.indexOf('/articles') === 0);
      if (cur) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));
  }
  window.addEventListener('hashchange', show);
  show();
})();`;

const preview = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${site.name}</title>
<meta name="description" content="${site.description}">
<link rel="icon" href="${faviconUri}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&family=Heebo:wght@300;400;500;700&display=swap">
<style>
${css}
.preview-note{position:fixed;top:84px;inset-inline-start:0;z-index:99;background:#d8b978;color:#101915;font-size:.72rem;padding:.3rem .7rem;border-radius:0 4px 4px 0;letter-spacing:.06em}
[dir="rtl"] .preview-note{border-radius:4px 0 0 4px}
</style>
</head>
<body>
<a class="skip" href="#main">דלג לתוכן הראשי</a>
${headerHtml}
<main id="main">
${routes}
</main>
${footerHtml}
<span class="preview-note" aria-hidden="true">תצוגה מקדימה</span>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>${routerJs}</script>
<script>${mainJs}</script>
<script>${heroJs}</script>
</body>
</html>
`;
await mkdir(path.join(here, 'preview'), { recursive: true });
await writeFile(path.join(here, 'preview', 'omri-dotan-law.html'), preview, 'utf8');

// גרסה ל-Artifact (ללא עטיפת html/head/body – המארח מוסיף אותה)
const artifact = `<title>${site.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&family=Heebo:wght@300;400;500;700&display=swap">
<style>
${css}
html, body { direction: rtl; }
.preview-note{position:fixed;top:84px;inset-inline-start:0;z-index:99;background:#d8b978;color:#101915;font-size:.72rem;padding:.3rem .7rem;border-radius:4px 0 0 4px;letter-spacing:.06em}
</style>
<div lang="he" dir="rtl">
<a class="skip" href="#main">דלג לתוכן הראשי</a>
${headerHtml}
<main id="main">
${routes}
</main>
${footerHtml}
<span class="preview-note" aria-hidden="true">תצוגה מקדימה</span>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>document.documentElement.setAttribute('dir','rtl');document.documentElement.setAttribute('lang','he');</script>
<script>${routerJs}</script>
<script>${mainJs}</script>
<script>${heroJs}</script>
`;
await writeFile(path.join(here, 'preview', 'artifact.html'), artifact, 'utf8');

console.log(`✔ נבנו ${pages.length} עמודים ב-dist/  +  preview/omri-dotan-law.html`);
