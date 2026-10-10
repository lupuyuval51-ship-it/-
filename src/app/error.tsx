"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useT } from "@/components/I18nProvider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-4 text-center" role="alert" data-testid="error-page">
      <div className="space-y-4">
        <p className="text-5xl" aria-hidden>⚠️</p>
        <h1 className="text-2xl font-bold">{t("error.title")}</h1>
        <p className="text-muted">{t("error.text")}</p>
        {error.digest && <p className="text-xs text-muted" dir="ltr">ref: {error.digest}</p>}
        <div className="flex justify-center gap-3">
          <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-neon px-5 text-sm font-semibold text-ink-950 hover:bg-white">{t("common.retry")}</button>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-line px-5 text-sm font-semibold hover:bg-white/10">{t("notfound.cta")}</Link>
        </div>
      </div>
    </main>
  );
}
