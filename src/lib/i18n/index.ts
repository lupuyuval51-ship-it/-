import { common } from "./dict/common";
import { game } from "./dict/game";
import { app } from "./dict/app";
import { site } from "./dict/site";
import { mobile } from "./dict/mobile";
import { commonEs } from "./dict/es/common";
import { gameEs } from "./dict/es/game";
import { siteEs } from "./dict/es/site";
import { appEs } from "./dict/es/app";
import { mobileEs } from "./dict/es/mobile";

export const LOCALES = ["he", "en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
/** Hebrew / RTL is the product default; English / LTR is fully supported; Spanish / LTR is the third language. */
export const DEFAULT_LOCALE: Locale = "he";

const en = { ...common.en, ...game.en, ...site.en, ...app.en, ...mobile.en };
const he = { ...common.he, ...game.he, ...site.he, ...app.he, ...mobile.he };
const es = { ...commonEs, ...gameEs, ...siteEs, ...appEs, ...mobileEs };

export type DictKey = keyof typeof en;
export type Dictionary = Record<DictKey, string>;

export const DICTIONARIES: Record<Locale, Dictionary> = { en, he, es };

export const isLocale = (v: unknown): v is Locale => v === "he" || v === "en" || v === "es";
/**
 * The language of learning CONTENT (topic library, study engine, LEVEL UP AI games): Hebrew or English.
 * Spanish is an interface language only for now, so Spanish speakers get English content.
 */
export const contentLangOf = (l: Locale): "he" | "en" => (l === "he" ? "he" : "en");
export const dirOf = (l: Locale): "rtl" | "ltr" => (l === "he" ? "rtl" : "ltr");

export type Params = Record<string, string | number>;
export type TFn = (key: DictKey, params?: Params) => string;

const PLACEHOLDER = /\{(\w+)\}/g;
const own = (o: object, k: string): boolean => Object.prototype.hasOwnProperty.call(o, k);

/**
 * The translator of one dictionary. An unknown key prints the key itself, and a `{placeholder}` without a value prints
 * nothing; only the dictionary's and the params' OWN entries count, so a key or placeholder that happens to be an
 * `Object.prototype` member ("constructor", "toString") never prints a function or crashes the page.
 */
export function makeT(dict: Dictionary): TFn {
  return (key, params) => {
    const value: unknown = own(dict, key) ? dict[key] : undefined;
    const template = typeof value === "string" ? value : key;
    if (!params) return template;
    return template.replace(PLACEHOLDER, (_, k: string) => (own(params, k) && params[k] != null ? String(params[k]) : ""));
  };
}
