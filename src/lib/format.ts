import type { Locale } from "@/lib/types";

export function formatNumber(n: number, locale: Locale, maxFractionDigits = 1): string {
  return new Intl.NumberFormat(locale === "he" ? "he-IL" : "en-US", { maximumFractionDigits: maxFractionDigits }).format(n);
}

export function formatPct(n: number | undefined | null, locale: Locale): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return `${formatNumber(Math.round(n), locale, 0)}%`;
}

export function formatSeconds(s: number | undefined | null, locale: Locale): string {
  if (s === undefined || s === null || Number.isNaN(s)) return "—";
  return locale === "he" ? `${formatNumber(s, locale, 2)} שנ׳` : `${formatNumber(s, locale, 2)} s`;
}

export function formatMeters(m: number | undefined | null, locale: Locale): string {
  if (m === undefined || m === null || Number.isNaN(m)) return "—";
  return locale === "he" ? `${formatNumber(m, locale, 0)} מ׳` : `${formatNumber(m, locale, 0)} m`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pct(successes: number, attempts: number): number | undefined {
  if (!attempts || attempts <= 0) return undefined;
  return Math.round((successes / attempts) * 1000) / 10;
}
