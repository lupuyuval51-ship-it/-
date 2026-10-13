import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Credits } from "@/components/about/Credits";
import { I18nProvider } from "@/components/I18nProvider";
import { OPEN_SOURCE_CREDITS } from "@/config/credits";
import { DICTIONARIES, makeT, type Locale } from "@/lib/i18n";
import { AboutPage } from "../../mobile/src/pages/About";

const root = path.resolve(import.meta.dirname, "../..");
const LOCALES: Locale[] = ["en", "he"];

let currentLocale: Locale = "en";
vi.mock("@/server/i18n", () => ({ getT: async () => ({ t: makeT(DICTIONARIES[currentLocale]), locale: currentLocale }) }));

describe("credits / about content", () => {
  for (const locale of LOCALES) {
    const t = makeT(DICTIONARIES[locale]);

    it(`renders in ${locale}: made by LUPU, the three provenance labels with their meaning, the open-source list`, () => {
      const html = renderToStaticMarkup(h(Credits, { t }));
      expect(html).toContain("LUPU");
      expect(html).toContain(t("about.madeBy"));
      for (const [badge, text] of [["ai.badge", "about.labels.ai.text"], ["engine.badge", "about.labels.engine.text"], ["demo.badge", "about.labels.demo.text"]] as const) {
        expect(html).toContain(t(badge));
        expect(html).toContain(t(text));
      }
      for (const c of OPEN_SOURCE_CREDITS) expect(html).toContain(c.name);
      expect(html).not.toContain("credits-version");
    });

    it(`shows the app version in ${locale} only when one is given`, () => {
      expect(renderToStaticMarkup(h(Credits, { t, version: "9.9.9" }))).toContain(t("about.version", { version: "9.9.9" }));
    });

    it(`the app's About page renders in ${locale} and its footer line is not invented`, () => {
      const html = renderToStaticMarkup(h(I18nProvider, { locale, dict: DICTIONARIES[locale] }, h(AboutPage)));
      expect(html).toContain("LUPU");
      expect(html).toContain('data-testid="mobile-about-page"');
      expect(html).not.toContain("credits-version"); // the version is read from the installed app after mount; none in a browser or on the server
    });
  }

  it("the website footer shows the LUPU copyright line and links to /about, in both languages", async () => {
    const { SiteFooter } = await import("@/components/layout/SiteFooter");
    for (const locale of LOCALES) {
      currentLocale = locale;
      const html = renderToStaticMarkup(await SiteFooter());
      expect(html).toContain(`© ${new Date().getFullYear()} LUPU`);
      expect(html).toContain('href="/about"');
      expect(html).toContain(DICTIONARIES[locale]["footer.about"]);
    }
  });

  it("the account name is LUPU ID on the sign-in and register copy, in both languages", () => {
    for (const locale of LOCALES) {
      const d = DICTIONARIES[locale];
      for (const key of ["auth.login.title", "auth.register.title", "acc.title", "mob.account.title"] as const) expect(d[key]).toContain("LUPU ID");
      expect(d["auth.google.button"]).toMatch(/Google/);
    }
    expect(DICTIONARIES.en["auth.login.title"]).toBe("Sign in with LUPU ID");
    expect(DICTIONARIES.en["auth.register.title"]).toBe("Create your LUPU ID");
  });

  it("every credited package is a real dependency and its declared license matches package.json in node_modules", () => {
    const raw = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
    const pkg = { dependencies: { ...raw.dependencies, ...raw.devDependencies } };
    for (const c of OPEN_SOURCE_CREDITS) {
      expect(Object.keys(pkg.dependencies), c.pkg).toContain(c.pkg);
      const file = path.join(root, "node_modules", c.pkg, "package.json");
      if (!existsSync(file)) continue; // dependencies not installed in this checkout: the dependency check above still ran
      const installed = JSON.parse(readFileSync(file, "utf8")) as { license?: string };
      expect(installed.license, c.pkg).toBe(c.license);
    }
  });
});
