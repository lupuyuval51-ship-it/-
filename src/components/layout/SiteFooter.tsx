import Link from "next/link";
import { getT } from "@/server/i18n";

export async function SiteFooter() {
  const { t } = await getT();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-xs text-muted">
        <p>{t("footer.privacy")}</p>
        <p>{t("footer.demo")}</p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span data-testid="footer-rights">{t("footer.rights", { year: new Date().getFullYear() })}</span>
          <Link href="/about" className="underline underline-offset-2 hover:text-text" data-testid="footer-about">{t("footer.about")}</Link>
        </p>
      </div>
    </footer>
  );
}
