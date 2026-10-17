import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getT } from "@/server/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <>
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-neon focus:px-3 focus:py-2 focus:text-ink-950">
        {t("nav.skip")}
      </a>
      <SiteHeader />
      <main id="content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
