import { createElement, type ComponentProps, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, type Locale } from "@/lib/i18n";
import { googleAuthEnabled, googleRequired } from "../../mobile/src/cloud/google";

vi.mock("../../mobile/src/cloud/google-native", () => ({ onGoogleResult: () => () => undefined, signInWithGoogle: async () => ({ ok: true }) }));
const { GoogleGate } = await import("../../mobile/src/pages/GoogleGate");

const Provider = I18nProvider as unknown as ComponentType<Omit<ComponentProps<typeof I18nProvider>, "children">>;
const render = (locale: Locale) => renderToStaticMarkup(createElement(Provider, { locale, dict: DICTIONARIES[locale] }, createElement(GoogleGate)));

describe("the Google sign-in the app asks for first", () => {
  it("is on in a normal build and can be switched off", () => {
    expect(googleAuthEnabled("1")).toBe(true);
    expect(googleRequired()).toBe(true);
    expect(googleRequired("0")).toBe(false);
  });
  it("shows one button and says what Google is used for, in all three languages", () => {
    for (const locale of ["he", "en", "es"] as const) {
      const html = render(locale);
      expect(html).toContain('data-testid="google-gate-button"');
      expect(html).toContain(DICTIONARIES[locale]["mob.gate.title"]);
      expect(html).toContain(DICTIONARIES[locale]["mob.account.google"]);
    }
  });
});
