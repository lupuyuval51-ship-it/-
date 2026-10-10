import { getT } from "@/server/i18n";

export async function SiteFooter() {
  const { t } = await getT();
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-xs text-muted">
        <p>{t("footer.privacy")}</p>
        <p>{t("footer.demo")}</p>
        <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
