import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE } from "@/config/limits";
import { DEFAULT_LOCALE, DICTIONARIES, dirOf, isLocale, makeT, type Locale, type TFn } from "@/lib/i18n";
import { getCurrentUser } from "./auth/current";

/** Hebrew by default. A visitor's choice (cookie) wins; otherwise a signed-in user's saved language. */
export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const user = await getCurrentUser();
  return user?.locale ?? DEFAULT_LOCALE;
}

export async function getT(): Promise<{ t: TFn; locale: Locale; dir: "rtl" | "ltr" }> {
  const locale = await getLocale();
  return { t: makeT(DICTIONARIES[locale]), locale, dir: dirOf(locale) };
}
