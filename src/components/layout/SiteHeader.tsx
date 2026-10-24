import Link from "next/link";
import { LogoMark } from "@/components/ui/Brand";
import { cookies } from "next/headers";
import { isThemePref, THEME_COOKIE } from "@/lib/theme";
import { ThemeSwitch } from "./ThemeSwitch";
import { Badge } from "@/components/ui";
import { getAllowanceSummary } from "@/server/allowance/summary";
import { levelHasLeft, offeredLevels, shortLeftItems } from "@/components/allowance/quota";
import { getCurrentUser } from "@/server/auth/current";
import { getT } from "@/server/i18n";
import { plansEnabled, plansShown } from "@/server/env";
import { LanguageSwitch } from "./LanguageSwitch";
import { LogoutButton } from "./LogoutButton";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

export async function SiteHeader() {
  const { t } = await getT();
  const themeCookie = (await cookies()).get(THEME_COOKIE)?.value;
  const theme = isThemePref(themeCookie) ? themeCookie : "system";
  const user = await getCurrentUser();
  const allowance = user ? await getAllowanceSummary(user.id) : null;
  const plansOn = plansEnabled();
  const plansVisible = plansShown();
  // every level has its own count: the pill lists what is left at each level the plan offers ("A: 3 · B: 5 · C: ∞")
  const anyLeft = allowance ? offeredLevels(allowance.levels).some(levelHasLeft) : false;
  const leftItems = allowance ? shortLeftItems(t, allowance.levels) : [];
  // each "A: 3" item is its own left-to-right island, so a right-to-left page still reads them from the highest level on
  const pillText = allowance ? (
    <>
      {plansOn && `${t(`plan.${allowance.plan}`)} · `}
      <span className="sr-only">{t("nav.allowance.title")}: </span>
      {anyLeft ? leftItems.map((item, i) => <span key={item}>{i > 0 && " · "}<span className="ltr-num">{item}</span></span>) : t("nav.allowance.none")}
    </>
  ) : null;
  const pillTitle = allowance ? `${plansOn ? `${t(`plan.${allowance.plan}`)} · ` : ""}${t("nav.allowance.title")}` : undefined;
  const links = user
    ? [
        { href: "/dashboard", label: t("nav.dashboard") },
        { href: "/create", label: t("nav.create") },
        { href: "/games", label: t("nav.library") },
        ...(plansVisible ? [{ href: "/pricing", label: t("nav.pricing") }] : []),
        { href: "/account", label: t("nav.account") },
      ]
    : plansVisible ? [{ href: "/pricing", label: t("nav.pricing") }] : [];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.01em]" aria-label={t("app.name")}>
          <span aria-hidden className="mb-[3px] grid size-8 place-items-center rounded-[22%] bg-neon text-ink-950 shadow-[0_2px_0_0_color-mix(in_oklab,var(--color-neon)_55%,#000),inset_0_1px_0_rgb(255_255_255/0.4)]"><LogoMark className="w-[62%]" /></span>
          <span className="hidden whitespace-nowrap min-[420px]:inline">{t("app.name")}</span>
        </Link>
        <nav className="ms-4 hidden flex-1 items-center gap-1 lg:flex" aria-label={t("nav.main")}>
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} className="min-h-10 content-center rounded-lg px-3 text-sm font-medium text-muted hover:bg-text/10 hover:text-text" activeClassName="bg-text/10 text-text">
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          {allowance && (
            <Link href={plansOn ? "/pricing" : "/dashboard"} data-testid="allowance-pill" title={pillTitle} className="hidden sm:block">
              <Badge tone={anyLeft ? "lime" : "amber"}>{pillText}</Badge>
            </Link>
          )}
          <ThemeSwitch initial={theme} />
          <LanguageSwitch />
          {user ? (
            <span className="hidden lg:block"><LogoutButton /></span>
          ) : (
            <>
              <Link href="/login" className="hidden min-h-10 content-center rounded-lg px-3 text-sm font-medium hover:bg-text/10 sm:block">{t("nav.login")}</Link>
              <Link href="/register" className="inline-flex min-h-10 items-center whitespace-nowrap rounded-lg bg-neon px-3 text-sm font-semibold text-ink-950 hover:brightness-110">{t("nav.register")}</Link>
            </>
          )}
          <MobileMenu label={t("nav.menu")}>
            {allowance && (
              <Link href={plansOn ? "/pricing" : "/dashboard"} data-testid="allowance-pill-mobile" className="block rounded-lg px-3 py-2.5 text-sm text-lime hover:bg-text/10">
                {pillText}
              </Link>
            )}
            {links.map((l) => <NavLink key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-text/10" activeClassName="bg-text/10 font-semibold">{l.label}</NavLink>)}
            {user ? <div className="px-1"><LogoutButton /></div> : <Link href="/login" className="block rounded-lg px-3 py-2.5 text-sm hover:bg-text/10">{t("nav.login")}</Link>}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
