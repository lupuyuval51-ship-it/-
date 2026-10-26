// Shared ninja-track onboarding for the older tests (new step order: basics, injuries, track, experience, places, equipment, pull/hang, ladder, strengths, focus, days).
module.exports = async function onboardNinja(page, click, o = {}) {
  await click('[data-act="ob-next"]');
  await page.fill('#obName', o.name || 'יובל');
  await click(`[data-f="age"][data-v="${o.age ?? 2}"]`); await click('[data-act="ob-next"]');
  for (const [k, lv] of o.limits || []) { await click(`[data-act="ob-lim"][data-v="${k}"]`); if (lv === 2) await click(`[data-act="ob-limlv"][data-k="${k}"][data-v="2"]`); }
  await click('[data-act="ob-ack"]'); await click('[data-act="ob-next"]');
  await click('[data-f="track"][data-v="ninja"]'); await page.waitForTimeout(450);
  await click('[data-f="exp"][data-v="1"]'); await page.waitForTimeout(450);
  await click('[data-f="places"][data-v="ninja"]'); await click('[data-f="places"][data-v="home"]'); await click('[data-act="ob-next"]');
  await click('[data-act="ob-next"]');
  await click('[data-f="pull"][data-v="2"]'); await click('[data-f="hang"][data-v="1"]'); await click('[data-act="ob-next"]');
  await click('[data-f="strength"][data-v="6"]'); await click('[data-act="ob-next"]');
  await click('[data-f="strengths"][data-v="grip"]'); await click('[data-f="strengths"][data-v="legs"]'); await page.fill('#obNote', 'אחיזה טובה'); await click('[data-act="ob-next"]');
  await click('[data-f="focus"][data-v="grip"]'); await click('[data-f="focus"][data-v="balance"]'); await click('[data-act="ob-next"]');
  await click('[data-act="ob-next"]'); await page.waitForTimeout(600);
};
