"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";

export function LogoutButton() {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      data-testid="logout"
      className="min-h-10 rounded-lg px-3 text-sm font-medium text-muted hover:bg-white/10 hover:text-text"
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        router.push("/");
        router.refresh();
      }}
    >
      {busy ? t("auth.loggingOut") : t("nav.logout")}
    </button>
  );
}
