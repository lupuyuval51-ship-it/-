"use client";

import { useT } from "@/components/I18nProvider";

/** Shown inside the site layout while a page loads, so the header stays put and screen readers hear a translated status. */
export default function SiteLoading() {
  const t = useT();
  return (
    <div className="space-y-4" aria-busy="true" role="status" aria-label={t("common.loading")} data-testid="page-loading">
      <div className="lu-skeleton h-9 w-64 max-w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="lu-skeleton h-40 rounded-2xl border border-line" />)}
      </div>
    </div>
  );
}
