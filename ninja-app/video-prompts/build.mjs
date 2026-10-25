// Builds the Gemini video prompts from the app's own exercise list, so no exercise can be missed.
// Run: node build.mjs   ->   prompts.json, gemini-technique-prompts.md, prompts-page.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { M, CAM, CAM_HE } from './motions.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(here, '..', 'index.html'), 'utf8');
const a = src.indexOf('const EX_RAW = ['), b = src.indexOf('\n];\nconst EX = {};');
const EX_RAW = new Function('return ' + src.slice(a + 'const EX_RAW = '.length, b + 3))();

const CATS = [
  { key: 'warm', he: 'חימום', en: 'warm-up' }, { key: 'grip', he: 'אחיזה', en: 'grip' }, { key: 'pull', he: 'משיכה', en: 'pulling' },
  { key: 'push', he: 'דחיפה', en: 'pushing' }, { key: 'core', he: 'ליבה', en: 'core' }, { key: 'legs', he: 'רגליים', en: 'leg' },
  { key: 'balance', he: 'איזון', en: 'balance' }, { key: 'swing', he: 'תנופה', en: 'swinging' }, { key: 'cool', he: 'שחרור', en: 'stretching and recovery' }
];
const MISTAKE_HE = {
  'scap-pulls': 'כיפוף מרפקים ותנופה', 'dead-hang': 'כתפיים פסיביות ומכווצות', 'farmer-carry': 'הטיה ותנופת משקולות', pullup: 'חצי חזרות עם בעיטות',
  'aus-row': 'אגן שוקע וטווח קצר', pushup: 'אגן שוקע ומרפקים פתוחים', hollow: 'קשת בגב התחתון', plank: 'אגן שוקע',
  'squat-jump': 'ברכיים נכנסות פנימה', 'box-jump': 'קפיצה חזרה למטה', 'glute-bridge': 'קשת מוגזמת בגב'
};

const STYLE = 'Photorealistic vertical 9:16 video, 8 seconds, clear instructional look. One athlete only: an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. Setting: a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Bright, even front lighting so every joint stays clearly visible; the background is slightly out of focus. Natural gym ambience and quiet breathing only, no music, no speech.';
const AVOID = 'No on-screen text, captions, logos or watermarks. No other people. No camera shake, zoom or cuts. Natural human anatomy with correct hands and five fingers per hand, no extra limbs, no warped equipment, nothing passing through the body.';

// Lesson from the first Kling test: on a low bar the athlete's feet touched the floor in the bottom position.
const HANGERS = new Set(['scap-pulls', 'dead-hang', 'towel-hang', 'hang-switch', 'monkey', 'rope-hang', 'rings-hang', 'neg-pullup', 'pullup', 'chinup', 'wide-pullup', 'towel-pullup', 'explosive-pullup', 'hang-knee', 'toes-bar', 'kip-swing', 'ring-swing', 'ring-traverse', 'lache']);
const HANG_NOTE = ' The bar is set high enough that the athlete\'s feet always stay at least 30 cm above the mat, never touching it.';
const RIG_ONLY = new Set(['rope-hang', 'rings-hang', 'ring-swing', 'ring-traverse']); // no bar in the scene, so say "rig"
for (const id of HANGERS) if (M[id]) M[id].setup += RIG_ONLY.has(id) ? HANG_NOTE.replace('The bar', 'The rig') : HANG_NOTE;

const ids = EX_RAW.map(r => r[0]);
const missing = ids.filter(id => !M[id]), extra = Object.keys(M).filter(id => !ids.includes(id));
if (missing.length || extra.length) { console.error('Motion scripts out of sync with the app.\n  missing:', missing, '\n  not in app:', extra); process.exit(1); }

const items = [];
const R = [
  { id: 'ref-athlete', he: 'תמונת ייחוס: הספורטאי', en: 'Reference photo: the athlete', cue: 'פנים רגועות, ידיים לצדדים, כל הגוף בפריים, תאורה אחידה. אם Gemini מאפשר, השתמשו בתמונה הזו בכל סרטון.',
    prompt: 'Photorealistic full-body portrait photo, vertical 9:16, of an athletic adult in their late 20s with short dark hair, wearing a fitted black training t-shirt, charcoal shorts and black low-profile training shoes. The athlete stands relaxed with the arms at the sides and a neutral expression, in a modern dark ninja-warrior training gym with matte black walls, a steel truss overhead, thick dark-blue crash mats and soft cyan and orange LED strip lights glowing in the background. Shot at eye level from about 4 m away, bright even front lighting, background slightly out of focus. Natural human anatomy, correct hands. No text, no logos, no watermarks, no other people.' },
  { id: 'ref-gym', he: 'תמונת ייחוס: האולם', en: 'Reference photo: the gym', cue: 'אולם ריק עם מוט מתח, טבעות, מתקן קופים, קיר ענק וקורות. אפשר להשתמש בו כרקע עקבי.',
    prompt: 'Photorealistic wide photo, vertical 9:16, of an empty modern dark ninja-warrior training gym: matte black walls, a steel truss overhead, a pull-up bar rig, gymnastic rings, overhead monkey bars, a curved warped wall in the background, a low balance beam, plyometric boxes, thick dark-blue crash mats on the floor, and soft cyan and orange LED strip lights glowing along the structures. Bright even lighting, no people, no text, no logos, no watermarks.' }
];
for (const r of R) items.push({ key: r.id, id: r.id, kind: 'ref', cat: 'ref', he: r.he, en: r.en, cue: r.cue, diff: '', camHe: '', file: r.id + '.png', prompt: r.prompt });

for (const c of CATS) for (const row of EX_RAW.filter(r => r[1] === c.key)) {
  const [id, , , , , , , he, en, cueHe] = row, m = M[id];
  items.push({
    key: id, id, kind: 'tech', cat: c.key, he, en, cue: cueHe, diff: m.diff, camHe: CAM_HE[m.cam], file: id + '.mp4',
    prompt: `${STYLE}\n\nExercise: ${en} (a ${c.en} exercise).\nCamera: ${CAM[m.cam]}.\nSetup: ${m.setup}\nAction: ${m.action}\nShow clearly: ${m.key}.\n\n${AVOID}`
  });
}
for (const id of ids) {
  const m = M[id]; if (!m.mistake) continue;
  const row = EX_RAW.find(r => r[0] === id), c = CATS.find(x => x.key === row[1]);
  items.push({
    key: id + '-mistake', id: id + '-mistake', kind: 'mistake', cat: row[1], he: `${row[7]}: ${MISTAKE_HE[id] || m.mistake.title}`, en: `${row[8]}: common mistake (${m.mistake.title})`,
    cue: `הסרטון מציג טעות בכוונה. הנכון: ${row[9]}`, diff: m.diff === 'hard' ? 'hard' : 'mixed', camHe: CAM_HE[m.cam], file: id + '-mistake.mp4',
    prompt: `${STYLE}\n\nCommon-mistake demonstration of ${row[8]} (a ${c.en} exercise), performed with bad form on purpose so that viewers learn what to avoid: ${m.mistake.title}.\nCamera: ${CAM[m.cam]}.\nSetup: ${m.setup}\nAction: ${m.mistake.what} Keep the movement realistic and not dangerous.\n\n${AVOID}`
  });
}
for (const it of items) { const mk = it.kind === 'mistake'; if (mk && !MISTAKE_HE[it.id.replace('-mistake', '')]) console.warn('no Hebrew label for', it.id); }

fs.writeFileSync(path.join(here, 'prompts.json'), JSON.stringify({ cats: CATS, items }, null, 2));

// ───────── Markdown ─────────
const diffHe = { safe: 'סיכוי טוב', mixed: 'יוצא לפעמים', hard: 'קשה ל־AI' };
let md = `# פרומטים לסרטוני טכניקה: NINJA CIRCUIT

${items.filter(i => i.kind === 'tech').length} פרומטים לתרגילי האפליקציה, ${items.filter(i => i.kind === 'mistake').length} להדגמת טעויות נפוצות ושני פרומטים לתמונות ייחוס. כל פרומט עומד בפני עצמו ומוכן להדבקה ב־Gemini במצב יצירת סרטון.

## לפני שמתחילים

- **הסרטונים הם הדגמה, לא מאמן.** מודלי וידאו נוטים לטעות בתנועה: ספירת חזרות, כיוון התנועה, ידיים ואצבעות. צפו בכל סרטון מול "מה לבדוק" ויצרו שוב אם משהו לא נכון. כדאי ליצור 2–3 גרסאות לכל תרגיל.
- **תרגילים שמסומנים "קשה ל־AI"** (שכיבות סמיכה ביד אחת, לאץ׳, קיר ענק, בהונות למוט ועוד) יוצאים שגויים לעיתים קרובות. אפשר לדלג עליהם ולצלם אדם אמיתי.
- **לפני שמציגים את הסרטונים באפליקציה כהוראת ביצוע, כדאי שמאמן יעבור עליהם.** טכניקה שגויה בסרטון יכולה לגרום לפציעה.
- הפרומטים באנגלית כי מודלי הווידאו מבינים אותה הכי טוב. אורך סרטון כ־8 שניות. אם אפשר לבחור יחס מסך, בחרו אנכי 9:16, ואם אי אפשר, בחרו 16:9 וחתכו אחר כך.
- יש הגבלה יומית על כמות הסרטונים ב־Gemini. בדקו אותה בחשבון שלכם.

## איך עובדים

1. (אופציונלי) צרו את שתי תמונות הייחוס, והעלו את תמונת הספורטאי עם כל פרומט אם Gemini מאפשר. כך הספורטאי נראה אותו דבר בכל הסרטונים.
2. העתיקו פרומט והדביקו אותו ב־Gemini.
3. בדקו את התוצאה מול "מה לבדוק".
4. שמרו בשם הקובץ שמופיע ליד התרגיל (למשל \`pullup.mp4\`), כדי שאפשר יהיה לחבר את הסרטונים לאפליקציה לפי שם.

## תמונות ייחוס

`;
const block = it => `### ${it.he}\n\n- **קובץ:** \`${it.file}\`${it.diff ? `\n- **סיכוי לצאת נכון:** ${diffHe[it.diff]}` : ''}${it.camHe ? `\n- **מצלמה:** ${it.camHe}` : ''}\n- **${it.kind === 'mistake' ? 'מה אמור להיראות' : 'מה לבדוק בסרטון'}:** ${it.cue}\n\n\`\`\`text\n${it.prompt}\n\`\`\`\n\n`;
for (const it of items.filter(i => i.kind === 'ref')) md += block(it);
for (const c of CATS) { md += `## ${c.he}\n\n`; for (const it of items.filter(i => i.kind === 'tech' && i.cat === c.key)) md += block(it); }
md += `## טעויות נפוצות\n\nתייגו את הסרטונים האלה באדום באפליקציה כ"טעות נפוצה", ותמיד הציגו אותם אחרי הסרטון הנכון של אותו תרגיל.\n\n`;
for (const it of items.filter(i => i.kind === 'mistake')) md += block(it);
fs.writeFileSync(path.join(here, 'gemini-technique-prompts.md'), md);

// ───────── Page (artifact body) and standalone copy ─────────
const tpl = fs.readFileSync(path.join(here, 'page.template.html'), 'utf8');
const data = JSON.stringify({ cats: CATS, items }).replace(/</g, '\\u003c');
const body = tpl.replace('__DATA__', () => data);
fs.writeFileSync(path.join(here, 'prompts-page.body.html'), body);
const split = body.indexOf('<div id="app"');
fs.writeFileSync(path.join(here, 'prompts-page.html'), `<!doctype html>\n<html lang="he" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n${body.slice(0, split)}</head>\n<body>\n${body.slice(split)}</body>\n</html>\n`);

const long = items.filter(i => i.prompt.length > 1700).map(i => i.id + ':' + i.prompt.length);
console.log(`${items.length} prompts (${items.filter(i => i.kind === 'tech').length} techniques, ${items.filter(i => i.kind === 'mistake').length} mistakes, 2 reference)`);
console.log('prompt length min/max:', Math.min(...items.map(i => i.prompt.length)), Math.max(...items.map(i => i.prompt.length)), long.length ? '| over 1700: ' + long.join(', ') : '');
console.log('difficulty:', ['safe', 'mixed', 'hard'].map(d => d + '=' + items.filter(i => i.kind === 'tech' && i.diff === d).length).join(' '));
