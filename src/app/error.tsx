"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useT } from "@/components/I18nProvider";
import { primaryLink, secondaryLink, StateView } from "@/components/ui/StateView";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="px-4" role="alert">
      <StateView
        kind="error"
        data-testid="error-page"
        title={t("error.title")}
        text={t("error.text")}
        actions={
          <>
            <button type="button" onClick={reset} className={primaryLink}>{t("common.retry")}</button>
            <Link href="/games" className={secondaryLink}>{t("nav.library")}</Link>
            <Link href="/" className={secondaryLink}>{t("notfound.cta")}</Link>
          </>
        }
      >
        {error.digest && <p className="text-xs text-muted" dir="ltr">ref: {error.digest}</p>}
      </StateView>
    </main>
  );
}
