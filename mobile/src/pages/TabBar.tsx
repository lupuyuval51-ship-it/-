import { BookOpen, Home, Plus, Settings } from "lucide-react";
import { useT } from "@/components/I18nProvider";
import { showPlans } from "../features";

const TABS = [
  { href: "/", key: "mob.nav.home", Icon: Home, test: "tab-home" },
  { href: "/create", key: "mob.nav.create", Icon: Plus, test: "tab-create" },
  { href: "/review", key: "mob.nav.review", Icon: BookOpen, test: "tab-review" },
  { href: "/settings", key: "mob.nav.settings", Icon: Settings, test: "tab-settings" },
] as const;

export type TabHref = (typeof TABS)[number]["href"];

/**
 * The tab whose screen `path` shows (a screen opened from a tab belongs to it: a game's results and a course to Home; plans,
 * about and privacy to Settings). It follows App's `route()` exactly: a path that `route()` does not know, such as the plans
 * screen in a build that hides the plans, opens the library, so it belongs to Home and the bar never marks another tab as
 * the current page above the library.
 */
export function tabOf(path: string, plansShown: boolean = showPlans()): TabHref {
  if (path === "/create") return "/create";
  if (path === "/review") return "/review";
  if (path === "/settings" || path === "/about" || path === "/privacy" || (path === "/plans" && plansShown)) return "/settings";
  return "/";
}

/**
 * The app's main navigation, at the bottom of the screen where a thumb reaches it: four large tabs (at least 56 px tall),
 * above the system navigation bar. Not shown on the play screen or during the first-run questionnaire.
 */
export function TabBar({ path }: { path: string }) {
  const t = useT();
  const current = tabOf(path);
  return (
    <nav aria-label={t("mob.nav.label")} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-950/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} data-testid="tab-bar">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {TABS.map(({ href, key, Icon, test }) => {
          const active = href === current;
          return (
            <li key={href}>
              <a href={`#${href}`} aria-current={active ? "page" : undefined} data-testid={test} data-active={active ? "1" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 pb-1 pt-1.5 text-xs transition-colors focus-visible:-outline-offset-4 ${active ? "font-bold text-neon" : "font-semibold text-muted hover:text-text"}`}>
                {/* the active tab is marked by a pill behind its icon and a bolder label, not by colour alone */}
                <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${active ? "bg-neon/20" : ""}`}>
                  <Icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className="max-w-full truncate">{t(key)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
