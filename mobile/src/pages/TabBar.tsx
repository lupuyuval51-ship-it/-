import { BookOpen, Home, Plus, Settings } from "lucide-react";
import { useT } from "@/components/I18nProvider";

const TABS = [
  { href: "/", key: "mob.nav.home", Icon: Home, test: "tab-home" },
  { href: "/create", key: "mob.nav.create", Icon: Plus, test: "tab-create" },
  { href: "/review", key: "mob.nav.review", Icon: BookOpen, test: "tab-review" },
  { href: "/settings", key: "mob.nav.settings", Icon: Settings, test: "tab-settings" },
] as const;

/** Is `path` this tab's screen (or a screen opened from it, e.g. a game's results belong to Home)? */
const isActive = (href: string, path: string) => (href === "/" ? !["/create", "/review", "/settings", "/plans", "/about"].some((p) => path.startsWith(p)) : path.startsWith(href) || (href === "/settings" && (path.startsWith("/plans") || path.startsWith("/about"))));

/**
 * The app's main navigation, at the bottom of the screen where a thumb reaches it: four large tabs (at least 56 px tall),
 * above the system navigation bar. Not shown on the play screen or during the first-run questionnaire.
 */
export function TabBar({ path }: { path: string }) {
  const t = useT();
  return (
    <nav aria-label={t("mob.nav.label")} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-950/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} data-testid="tab-bar">
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {TABS.map(({ href, key, Icon, test }) => {
          const active = isActive(href, path);
          return (
            <li key={href}>
              <a href={`#${href}`} aria-current={active ? "page" : undefined} data-testid={test}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-semibold ${active ? "text-neon" : "text-muted hover:text-text"}`}>
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} />
                <span className="truncate">{t(key)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
