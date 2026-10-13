import Link from "next/link";
import { primaryLink, secondaryLink, StateView } from "@/components/ui/StateView";
import { getT } from "@/server/i18n";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="px-4">
      <StateView
        kind="notfound"
        headingLevel={1}
        data-testid="not-found"
        title={t("notfound.title")}
        text={t("notfound.text")}
        actions={
          <>
            <Link href="/" className={primaryLink}>{t("notfound.cta")}</Link>
            <Link href="/games" className={secondaryLink}>{t("nav.library")}</Link>
          </>
        }
      />
    </main>
  );
}
