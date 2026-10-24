"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/I18nProvider";
import { cx } from "@/components/ui";
import { applyTheme, THEME_COOKIE, THEMES, type ThemePref } from "@/lib/theme";

const ICON = { system: Monitor, light: Sun, dark: Moon } as const;

/** Cycles system → light → dark. Stored in a cookie so the server renders the right theme (no flash). */
export function ThemeSwitch({ initial, className }: { initial: ThemePref; className?: string }) {
  const t = useT();
  const [pref, setPref] = useState<ThemePref>(initial);
  const next = THEMES[(THEMES.indexOf(pref) + 1) % THEMES.length]!;
  const Icon = ICON[pref];
  return (
    <button
      type="button"
      data-testid="theme-switch"
      data-theme-pref={pref}
      aria-label={`${t("theme.label")}: ${t(`theme.${pref}`)}`}
      title={`${t("theme.label")}: ${t(`theme.${pref}`)}`}
      onClick={() => {
        setPref(next);
        applyTheme(next);
        document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      }}
      className={cx("grid size-10 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-text/10 hover:text-text", className)}
    >
      <Icon aria-hidden className="size-[18px]" />
    </button>
  );
}
