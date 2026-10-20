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
  it("is off in a normal build and only on with both switches", () => {
    expect(googleAuthEnabled("1")).toBe(true);
    expect(googleRequired()).toBe(false);
    expect(googleRequired("1", true)).toBe(true);
    expect(googleRequired("1", false)).toBe(false);
    expect(googleRequired("0", true)).toBe(false);
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

describe("the gate stands aside while Google is not enabled in Supabase", () => {
  const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }; };
  const answer = (body: unknown, ok = true) => (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

  it("on / off follow the public settings and are remembered", async () => {
    const { checkGoogleProvider, readProviderState } = await import("../../mobile/src/cloud/google");
    const store = mem();
    expect(readProviderState(store)).toBe("unknown");
    expect(await checkGoogleProvider("https://x.supabase.co", "k", answer({ external: { google: false } }), store)).toBe("off");
    expect(readProviderState(store)).toBe("off");
    expect(await checkGoogleProvider("https://x.supabase.co", "k", answer({ external: { google: true } }), store)).toBe("on");
    expect(readProviderState(store)).toBe("on");
  });
  it("when Supabase cannot be reached the last answer stays, and with none the gate stays (unknown)", async () => {
    const { checkGoogleProvider } = await import("../../mobile/src/cloud/google");
    const down = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    const store = mem();
    expect(await checkGoogleProvider("https://x.supabase.co", "k", down, store)).toBe("unknown");
    store.setItem("levelup.googleProvider", "on");
    expect(await checkGoogleProvider("https://x.supabase.co", "k", down, store)).toBe("on");
    expect(await checkGoogleProvider("https://x.supabase.co", "k", answer({}, false), store)).toBe("on");
  });
});
