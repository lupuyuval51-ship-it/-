'use strict';

// Packs index.html, styles.css, geometry.js and app.js into one self-contained HTML file.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const read = (name) => fs.readFileSync(path.join(dir, name), 'utf8');

function inline(html, tag, placeholder, replacement) {
  if (!html.includes(placeholder)) {
    throw new Error(`index.html is missing the ${tag} reference: ${placeholder}`);
  }
  return html.replace(placeholder, () => replacement);
}

function assertSafeForInline(name, text, closingTag) {
  if (text.toLowerCase().includes(closingTag)) {
    throw new Error(`${name} contains ${closingTag}, which would end the inline ${closingTag.slice(2, -1)} early`);
  }
}

const styles = read('styles.css');
const geometry = read('geometry.js');
const app = read('app.js');
assertSafeForInline('styles.css', styles, '</style');
assertSafeForInline('geometry.js', geometry, '</script');
assertSafeForInline('app.js', app, '</script');

let html = read('index.html');
html = inline(html, 'stylesheet', '<link rel="stylesheet" href="styles.css">', `<style>\n${styles}</style>`);
html = inline(html, 'geometry script', '<script src="geometry.js"></script>', `<script>\n${geometry}</script>`);
html = inline(html, 'app script', '<script src="app.js"></script>', `<script>\n${app}</script>`);

const output = path.join(dir, 'cylinder-cone.html');
fs.writeFileSync(output, html);
console.log(`Wrote ${path.relative(process.cwd(), output)} (${Buffer.byteLength(html)} bytes)`);
