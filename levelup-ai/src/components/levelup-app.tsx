"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Gamepad2,
  Compass,
  User,
  Settings,
  ShieldCheck,
  LogOut,
  Bell,
  Search,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  Flame,
  Zap,
  Users,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
import { AppContext } from "./context";
import { translate, type Locale, type MessageKey } from "@/lib/i18n";
import { api } from "@/lib/client";
import { Button, Empty, Modal, Notice } from "./ui";
import { Landing, Auth, Onboarding } from "./screens/entry";
import {
  Dashboard,
  Paths,
  PathDetail,
  Task,
  Coach,
  Marketplace,
  MarketplaceDetail,
} from "./screens/learning";
import {
  Pricing,
  Payment,
  Quest,
  Profile,
  SettingsScreen,
  Admin,
  Community,
  Legal,
  Creator,
} from "./screens/account";
export default function LevelupApp() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>({ paths: [], plans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locale, setLocale] = useState<Locale>("he");
  const [theme, setTheme] = useState("dark");
  const [toastMessage, setToast] = useState("");
  const [offline, setOffline] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const basicPrice = catalog.plans?.find(
    (plan: any) => plan.id === "BASIC",
  )?.price;
  const t = useCallback(
    (key: MessageKey) =>
      translate(locale, key).replaceAll(
        "{basicPrice}",
        String(basicPrice ?? "…"),
      ),
    [locale, basicPrice],
  );
  const l = useCallback(
    (v: any): string =>
      typeof v === "string" ? v : v?.[locale] || v?.he || v?.en || "",
    [locale],
  );
  const refresh = useCallback(async () => {
    const [s, c] = await Promise.all([api("/state"), api("/catalog")]);
    setState(s.state || s);
    setCatalog(c);
  }, []);
  useEffect(() => {
    Promise.all([api("/catalog"), api("/state").catch(() => null)])
      .then(([c, s]) => {
        setCatalog(c);
        setState(s?.state || s);
        if (s?.profile?.locale) setLocale(s.profile.locale);
        if (s?.profile?.theme) setTheme(s.profile.theme);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    const stored = localStorage.getItem("levelup-locale");
    if (stored === "en" || stored === "he") setLocale(stored);
    const th = localStorage.getItem("levelup-theme");
    if (th) setTheme(th);
    const online = () => setOffline(!navigator.onLine);
    online();
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("levelup-locale", locale);
    localStorage.setItem("levelup-theme", theme);
  }, [locale, theme]);
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toastMessage]);
  const userId = state?.user?.id;
  useEffect(() => {
    if (!userId) return;
    const sync = () => {
      if (document.hidden) return;
      api("/state")
        .then((s) => setState(s.state || s))
        .catch(async () => {
          // A swallowed 401 left a signed-in shell driving a session the server had dropped, so
          // every later action failed with no explanation. Confirm the session is really gone —
          // a transient network blip must not sign anyone out — then clear it.
          try {
            const probe = await fetch("/api/health", { cache: "no-store" });
            if (!probe.ok) return;
            const check = await fetch("/api/state", {
              credentials: "same-origin",
              cache: "no-store",
            });
            if (check.status === 401) setState(null);
          } catch {
            /* Offline: keep the current view and let the banner explain. */
          }
        });
    };
    const timer = setInterval(sync, 20000);
    window.addEventListener("focus", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", sync);
    };
  }, [userId]);
  /**
   * Opening an account can legitimately fail — the guest burst limit returns 429. Every caller
   * used to let that reject unhandled, leaving a button that silently did nothing, so this
   * reports the reason and returns null instead of throwing.
   */
  const start = useCallback(async () => {
    try {
      const response = await api("/auth/guest", { locale });
      const next = response.state || response;
      setState(next);
      return next;
    } catch (error) {
      setToast((error as Error).message);
      return null;
    }
  }, [locale]);
  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", {});
    } catch {
      // The local session is dropped either way; the cookie expires on its own.
      setToast(translate(locale, "logoutFailed"));
    }
    setState(null);
    router.push("/");
  }, [locale, router]);
  const openNotifications = useCallback(async () => {
    setNotifications(true);
    if (!state?.notifications?.some((item: any) => !item.read)) return;
    try {
      const response = await api("/notifications/read", {});
      if (response.state) setState(response.state);
    } catch {
      // Reading is a convenience; a failure must not block the panel.
    }
  }, [state?.notifications]);
  const ctx = {
    state,
    catalog,
    locale,
    t,
    l,
    refresh,
    setState,
    toast: setToast,
    go: (p: string) => router.push(p),
    setLocale,
    setTheme,
    theme,
    logout,
    start,
  };
  // Without a session there is no sidebar, plan badge or logout to render, so every route a
  // signed-out visitor lands on is public — otherwise the marketing page appears inside the
  // signed-in shell, wired to a `state` that does not exist. A signed-in learner still gets the
  // app shell on /pricing and /marketplace, which is where those screens belong.
  const marketingRoute = ["/", "/login", "/privacy", "/terms"].includes(pathname);
  const publicRoute = marketingRoute || !state?.user;
  const publicBrowse =
    !state?.user &&
    (pathname === "/pricing" ||
      (pathname.startsWith("/marketplace") && pathname !== "/marketplace/create"));
  let screen: React.ReactNode;
  if (pathname === "/") screen = <Landing />;
  else if (pathname === "/login") screen = <Auth />;
  else if (pathname === "/terms" || pathname === "/privacy")
    screen = <Legal type={pathname.slice(1)} />;
  else if (pathname === "/pricing") screen = <Pricing />;
  else if (!state?.user && pathname === "/marketplace")
    screen = <Marketplace />;
  else if (
    !state?.user &&
    pathname.startsWith("/marketplace/") &&
    pathname !== "/marketplace/create"
  )
    screen = <MarketplaceDetail id={pathname.split("/")[2]} />;
  else if (!state?.user) screen = <Landing />;
  else if (pathname === "/dashboard") screen = <Dashboard />;
  else if (pathname === "/onboarding") screen = <Onboarding />;
  else if (pathname === "/paths") screen = <Paths />;
  else if (pathname.startsWith("/paths/"))
    screen = <PathDetail id={pathname.split("/")[2]} />;
  else if (pathname.startsWith("/tasks/"))
    screen = (
      <Task id={pathname.split("/")[2]} taskId={pathname.split("/")[3]} />
    );
  else if (pathname === "/coach") screen = <Coach />;
  else if (pathname === "/marketplace") screen = <Marketplace />;
  else if (pathname === "/marketplace/create") screen = <Creator />;
  else if (pathname.startsWith("/marketplace/"))
    screen = <MarketplaceDetail id={pathname.split("/")[2]} />;
  else if (pathname === "/quest") screen = <Quest />;
  else if (pathname.startsWith("/payment"))
    screen = <Payment id={pathname.split("/")[2]} />;
  else if (pathname === "/profile") screen = <Profile />;
  else if (pathname === "/settings") screen = <SettingsScreen />;
  else if (pathname === "/admin") screen = <Admin />;
  else if (pathname === "/community") screen = <Community />;
  else
    screen = (
      <Empty
        title={t("notFound")}
        description={t("notFoundSub")}
        action={
          <Link className="button primary" href="/dashboard">
            {t("goHome")}
          </Link>
        }
      />
    );
  const nav: [string, MessageKey, any][] = [
    ["/dashboard", "dashboard", LayoutDashboard],
    ["/paths", "paths", BookOpen],
    ["/quest", "quest", Gamepad2],
    ["/marketplace", "marketplace", Compass],
    ["/coach", "coach", Zap],
    ["/community", "community", Users],
  ];
  const activeTitle =
    nav.find(([p]) => pathname.startsWith(p))?.[1] ||
    (["profile", "settings", "admin", "pricing"].includes(pathname.slice(1))
      ? (pathname.slice(1) as MessageKey)
      : "yourPlan");
  return (
    <AppContext.Provider value={ctx}>
      <a href="#main" className="skip-link">
        {t("skipToContent")}
      </a>
      {loading ? (
        <div className="app-loading">
          <Logo />
          <LoaderCircle className="spin" />
          <p>{t("loading")}</p>
        </div>
      ) : error ? (
        <main className="error-page">
          <Empty
            title={t("error")}
            description={error}
            action={
              <Button onClick={() => window.location.reload()}>
                {t("retry")}
              </Button>
            }
          />
        </main>
      ) : publicRoute ? (
        // Only wrap real marketing content; a signed-out visitor bounced to the landing page
        // brings its own header, so the wrapper would render a second one above it.
        publicBrowse ? (
          <div className="public-workspace">
            <header className="marketing-nav">
              <Link href="/">
                <Logo />
              </Link>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (await start()) router.push("/onboarding");
                }}
              >
                {t("startNow")}
              </Button>
            </header>
            <main className="public-main" id="main">
              <Suspense fallback={<div className="app-loading">{t("loading")}</div>}>
                {screen}
              </Suspense>
            </main>
          </div>
        ) : (
          <>{screen}</>
        )
      ) : (
        <div
          className={
            "app-shell " +
            (collapsed ? "collapsed " : "") +
            (pathname === "/quest" ? "quest-shell" : "")
          }
        >
          <aside className="sidebar">
            <Link href="/dashboard" className="brand-link">
              <Logo small={collapsed} />
            </Link>
            <button
              className="collapse-button icon-button"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={t(collapsed ? "expand" : "collapse")}
            >
              {collapsed ? (
                <PanelRightOpen size={17} />
              ) : (
                <PanelRightClose size={17} />
              )}
            </button>
            <div className="sidebar-section-label">{t("yourPlan")}</div>
            <nav aria-label={t("yourPlan")}>
              {nav.map(([href, label, Icon]) => (
                <Link
                  title={t(label)}
                  key={href}
                  href={href}
                  className={
                    pathname.startsWith(href) ? "nav-link active" : "nav-link"
                  }
                >
                  <Icon size={20} />
                  <span>{t(label)}</span>
                  {href === "/quest" && <span className="nav-dot" />}
                </Link>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <Link className="sidebar-upgrade" href="/pricing">
                <Gamepad2 size={22} />
                <div>
                  <b>{state?.plan || "FREE"}</b>
                  <small>{t("upgrade")}</small>
                </div>
                <ArrowUpRight size={16} />
              </Link>
              <Link className="nav-link" href="/profile">
                <User size={20} />
                <span>{t("profile")}</span>
              </Link>
              <Link className="nav-link" href="/settings">
                <Settings size={20} />
                <span>{t("settings")}</span>
              </Link>
              {state?.user?.role === "admin" && (
                <Link className="nav-link" href="/admin">
                  <ShieldCheck size={20} />
                  <span>{t("admin")}</span>
                </Link>
              )}
              <button className="nav-link" onClick={logout}>
                <LogOut size={20} />
                <span>{t("logout")}</span>
              </button>
              <div className="sidebar-profile">
                <div className="avatar small">
                  {(
                    state?.profile?.displayName ||
                    state?.user?.displayName ||
                    "L"
                  ).slice(0, 1)}
                </div>
                <div>
                  <b>
                    {state?.profile?.displayName || state?.user?.displayName}
                  </b>
                  <small>
                    {t("level")} {Math.floor((state?.xp || 0) / 500) + 1}
                  </small>
                </div>
              </div>
            </div>
          </aside>
          <div className="main-column">
            <header className="topbar">
              <div className="breadcrumb">
                <Link href="/dashboard" aria-label={t("goHome")}>
                  LEVELUP AI
                </Link>
                <ChevronLeft size={14} />
                <b>{t(activeTitle)}</b>
              </div>
              <div className="topbar-actions">
                <form
                  className="top-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    router.push("/marketplace?q=" + encodeURIComponent(search));
                  }}
                >
                  <Search size={16} />
                  <input
                    aria-label={t("search")}
                    placeholder={t("search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </form>
                <span className="top-streak">
                  <Flame size={17} />
                  {state?.streak || 0}
                </span>
                <button
                  className="icon-button"
                  aria-label={t("notifications")}
                  onClick={openNotifications}
                >
                  <Bell size={19} />
                  {state?.notifications?.some((n: any) => !n.read) && (
                    <i className="notification-dot" />
                  )}
                </button>
                <Link
                  href="/profile"
                  className="avatar small"
                  aria-label={t("profile")}
                >
                  {(state?.profile?.displayName || "L").slice(0, 1)}
                </Link>
              </div>
            </header>
            {state?.isDemo && (
              <div className="demo-ribbon">
                <span>{t("demoLabel")}</span>
                <button
                  onClick={async () => {
                    const wasAdmin = state?.user?.role === "admin";
                    try {
                      const r = await api("/auth/demo", {
                        role: wasAdmin ? "learner" : "admin",
                      });
                      setState(r.state || r);
                      router.push(wasAdmin ? "/dashboard" : "/admin");
                    } catch (e) {
                      setToast((e as Error).message);
                    }
                  }}
                >
                  {state?.user?.role === "admin"
                    ? t("dashboard")
                    : t("demoAdmin")}
                  <ArrowUpRight size={13} />
                </button>
              </div>
            )}
            {offline && <Notice type="error">{t("offline")}</Notice>}
            <main id="main" className="main-content" key={pathname}>
              <Suspense fallback={<div className="app-loading">{t("loading")}</div>}>
                {screen}
              </Suspense>
            </main>
            <footer className="app-footer">
              <span>LEVELUP AI</span>
              <span>{t("brandTag")}</span>
              <Link href="/privacy">{t("privacy")}</Link>
            </footer>
          </div>
          <nav className="mobile-nav" aria-label={t("yourPlan")}>
            {nav
              .filter((_, i) => i < 4)
              .map(([href, label, Icon]) => (
                <Link
                  className={pathname.startsWith(href) ? "active" : ""}
                  href={href}
                  key={href}
                >
                  <Icon size={20} />
                  <span>{t(label)}</span>
                </Link>
              ))}
            <Link href="/settings">
              <Settings size={20} />
              <span>{t("settings")}</span>
            </Link>
          </nav>
        </div>
      )}
      {toastMessage && (
        <div className="toast" role="status">
          <ShieldCheck size={18} />
          {toastMessage}
        </div>
      )}
      {notifications && (
        <Modal
          title={t("notifications")}
          onClose={() => setNotifications(false)}
        >
          {state?.notifications?.length ? (
            state.notifications.map((n: any) => (
              <div className="notification" key={n.id}>
                <Bell size={18} />
                <div>
                  <p>{l(n.message)}</p>
                  <small>
                    {new Date(n.createdAt).toLocaleDateString(locale)}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <p>{t("noNotifications")}</p>
          )}
        </Modal>
      )}
    </AppContext.Provider>
  );
}
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="logo" dir="ltr">
      <span className="logo-mark">
        <span />
        <span />
        <span />
      </span>
      {!small && (
        <span>
          LEVELUP <b>AI</b>
        </span>
      )}
    </div>
  );
}
