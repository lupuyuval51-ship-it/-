"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLocale, useT } from "@/components/I18nProvider";
import { cx } from "@/components/ui";

export function LanguageSwitch() {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "he" ? "en" : "he";
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`${t("common.language")}: ${t(`lang.${next}`)}`}
      data-testid="language-switch"
      onClick={() =>
        start(async () => {
          await fetch("/api/locale", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: next }) });
          router.refresh();
        })
      }
      className={cx("min-h-10 rounded-lg border border-line px-2.5 text-sm font-medium transition-colors hover:bg-text/10 sm:px-3", pending && "opacity-60")}
    >
      {t(`lang.${next}`)}
    </button>
  );
}
