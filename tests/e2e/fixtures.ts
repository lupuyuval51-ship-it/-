import { expect, test as base } from "@playwright/test";

/** Browser noise that is expected when a test deliberately provokes a 4xx/5xx from the API. */
const EXPECTED_NETWORK_NOISE = /Failed to load resource: the server responded with a status of (400|401|403|404|409|429|503)/;

/**
 * Every test fails if the page throws or logs a console error. This is how "no runtime errors" is enforced
 * on every screen the suite visits, rather than checked once by hand.
 */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() === "error" && !EXPECTED_NETWORK_NOISE.test(m.text())) errors.push(`console.error: ${m.text()}`);
      });
      await use(errors);
      expect(errors, "uncaught page errors / console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
