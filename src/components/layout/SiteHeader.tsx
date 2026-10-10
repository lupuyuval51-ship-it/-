import Link from "next/link";
import { Badge } from "@/components/ui";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { getCurrentUser } from "@/server/auth/current";
import { getT } from "@/server/i18n";
import { LanguageSwitch } from "./LanguageSwitch";
import { LogoutButton } from "./LogoutButton";

export async function SiteHeader() {
  const { t } = await getT();
  const user = await getCurrentUser();
  const allowance = user ? await getAllowanceSummary(user.id) : null;
  const links = user
    ? [
        { href: "/dashboard", label: t("nav.dashboard") },
        { href: "/create", label: t("nav.create") },
        { href: "/games", label: t("nav.library") },
        { href: "/pricing", label: t("nav.pricing") },
        { href: "/account", label: t("nav.account") },
      ]
    : [{ href: "/pricing", label: t("nav.pricing") }];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-extrabold tracking-wide" aria-label={t("app.name")}>
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-neon to-violet text-ink-950">▲</span>
          <span className="whitespace-nowrap">{t("app.name")}</span>
        </Link>
        <nav className="ms-4 hidden flex-1 items-center gap-1 lg:flex" aria-label="main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="min-h-10 content-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-white/10 hover:text-text">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {allowance && (
            <Link href="/pricing" data-testid="allowance-pill" title={`${allowance.plan}`} className="hidden sm:block">
              <Badge tone={allowance.remaining > 0 ? "lime" : "amber"}>
                {t(`plan.${allowance.plan}`)} · {allowance.remaining > 0 ? t("nav.allowance", { n: allowance.remaining }) : t("nav.allowance.none")}
              </Badge>
            </Link>
          )}
          <LanguageSwitch />
          {user ? (
            <span className="hidden lg:block"><LogoutButton /></span>
          ) : (
            <>
              <Link href="/login" className="hidden min-h-10 content-center rounded-lg px-3 text-sm font-medium hover:bg-white/10 sm:block">{t("nav.login")}</Link>
              <Link href="/register" className="inline-flex min-h-10 items-center rounded-lg bg-neon px-3 text-sm font-semibold text-ink-950 hover:bg-white">{t("nav.register")}</Link>
            </>
          )}
          <details className="relative lg:hidden">
            <summary aria-label={t("nav.menu")} className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-line">☰</summary>
            <div className="absolute end-0 top-12 w-56 space-y-1 rounded-xl border border-line bg-ink-800 p-2 shadow-xl">
              {allowance && (
                <Link href="/pricing" data-testid="allowance-pill-mobile" className="block rounded-lg px-3 py-2.5 text-sm text-lime hover:bg-white/10">
                  {t(`plan.${allowance.plan}`)} · {allowance.remaining > 0 ? t("nav.allowance", { n: allowance.remaining }) : t("nav.allowance.none")}
                </Link>
              )}
              {links.map((l) => <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-white/10">{l.label}</Link>)}
              {user ? <div className="px-1"><LogoutButton /></div> : <Link href="/login" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-white/10">{t("nav.login")}</Link>}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
