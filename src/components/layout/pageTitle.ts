import type { Metadata } from "next";
import type { DictKey } from "@/lib/i18n";
import { getT } from "@/server/i18n";

/** `export const generateMetadata = titleFor("nav.pricing")`: the browser-tab and history title in the reader's language (WCAG 2.4.2). */
export function titleFor(key: DictKey): () => Promise<Metadata> {
  return async () => ({ title: (await getT()).t(key) });
}
