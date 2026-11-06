import { expect, onboard, test } from './fixtures.ts';

/** Words that only make sense with an account or a server. In the standalone build they may appear only in sentences that say there is none. */
const HOSTED_WORDS: Record<'en' | 'he', RegExp> = {
  en: /\b(sign(?:ed|ing)?[ -]?(?:in|out|up)|log[ -]?(?:in|out)|login|logout|password|server|servers|cloud|sync(?:hroni[sz]e[sd]?)?|account|accounts|operator|hosted|reconnect|e-?mail|username)\b/gi,
  he: /(התחבר\S*|התנתק\S*|סיסמ\S*|שרת\S*|ענן|סנכרון|מסתנכרנ\S*|חשבון|חשבונות|(?<![א-ת])מפעיל(?![א-ת])|מתארח|אימייל|שם משתמש)/g,
};
/** Sentences (or parts of them) that are allowed to name those words because they state the absence. Anything else fails the test. */
const ALLOWED: RegExp[] = [
  /there is no (account|cloud)/i, /no account/i, /no sign-?in/i, /no cloud copy/i, /not (uploaded|sent) to a server/i, /nothing is sent to a server/i, /no (server|operator)/i, /no e-?mail/i, /no push server/i,
  /not sent from a server/i, /cloud drive/i, /no name, e-?mail or password/i, /not back anything up to a cloud/i, /adds no password/i,
  /נשלחות משרת/, /נשלח לשרת/, /מועלים לשרת/, /אימייל או סיסמה שבחרתם/, /לא מגבה שום דבר לענן/, /לא מוסיפה סיסמה/,
  /אין חשבון/, /אין התחברות/, /אין עותק (של הנתונים )?בענן/, /לא (הועלו|מועלים|נשלחים) לשרת/, /אין שרת/, /אין אימייל/, /אין מפעיל/, /לא נשלח\S* לשום שרת/, /אף גורם/, /שרת (שמחזיק|שמופעל)/, /אין חשבון/, /ללא חשבון/, /בענן/, /לאימייל|באימייל/, /בכונן ענן/,
];

const ROUTES = ['/', '/workouts', '/workouts?tab=generator', '/workouts?tab=ready', '/workouts/history', '/exercises', '/exercises/back_squat', '/nutrition', '/nutrition/log', '/nutrition/menu', '/coach', '/progress', '/notifications', '/profile', '/privacy', '/terms', '/account-deletion'];

test('no screen of the standalone build talks about accounts, servers, sign-in or sync unless it says there are none', async ({ app: page, lang }) => {
  test.setTimeout(180_000);
  const offenders: string[] = [];
  const scan = async (where: string): Promise<void> => {
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    const text = await page.locator('body').innerText();
    for (const sentence of text.split(/(?<=[.!?:])\s+|\n+/)) {
      const hit = sentence.match(HOSTED_WORDS[lang]);
      if (!hit || ALLOWED.some((re) => re.test(sentence))) continue;
      offenders.push(`${where}: [${hit.join(', ')}] ${sentence.slice(0, 160)}`);
    }
  };
  // First launch: welcome and every onboarding step.
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await scan('/welcome');
  await page.locator('a[href="/onboarding"]').click();
  for (const step of ['about', 'experience', 'goal', 'training', 'preferences', 'nutrition', 'review']) {
    await expect(page.locator(`.onb[data-step="${step}"]`)).toBeVisible();
    await scan(`onboarding:${step}`);
    await page.locator('.onb-primary').click();
  }
  await expect(page.locator('.hero-card')).toBeVisible();
  await scan('/');
  for (const r of ROUTES.slice(1)) {
    // In-app navigation (no reload): a reload would boot the on-device database again for every route.
    await page.evaluate((x) => { history.pushState({}, '', x); window.dispatchEvent(new PopStateEvent('popstate')); }, r);
    await expect(page.locator('main#main')).toBeVisible();
    await page.waitForTimeout(600);
    await scan(r);
  }
  expect(offenders).toEqual([]);
});
