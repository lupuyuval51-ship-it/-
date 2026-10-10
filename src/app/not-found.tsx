import Link from "next/link";
import { getT } from "@/server/i18n";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-center" data-testid="not-found">
      <div className="space-y-4">
        <p className="text-6xl font-extrabold text-neon" aria-hidden>404</p>
        <h1 className="text-2xl font-bold">{t("notfound.title")}</h1>
        <p className="text-muted">{t("notfound.text")}</p>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:bg-white">{t("notfound.cta")}</Link>
      </div>
    </main>
  );
}
