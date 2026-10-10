import { common } from "./dict/common";
import { game } from "./dict/game";
import { pages } from "./dict/pages";

export const LOCALES = ["he", "en"] as const;
export type Locale = (typeof LOCALES)[number];
/** Hebrew / RTL is the product default; English / LTR is fully supported. */
export const DEFAULT_LOCALE: Locale = "he";

const en = { ...common.en, ...game.en, ...pages.en };
const he = { ...common.he, ...game.he, ...pages.he };

export type DictKey = keyof typeof en;
export type Dictionary = Record<DictKey, string>;

export const DICTIONARIES: Record<Locale, Dictionary> = { en, he };

export const isLocale = (v: unknown): v is Locale => v === "he" || v === "en";
export const dirOf = (l: Locale): "rtl" | "ltr" => (l === "he" ? "rtl" : "ltr");

export type Params = Record<string, string | number>;
export type TFn = (key: DictKey, params?: Params) => string;

export function makeT(dict: Dictionary): TFn {
  return (key, params) => {
    const template = dict[key] ?? key;
    return params ? template.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? "")) : template;
  };
}
