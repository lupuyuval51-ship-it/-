import { useEffect, useState } from "react";
import { Credits } from "@/components/about/Credits";
import { useT } from "@/components/I18nProvider";
import { Arrow } from "@/components/ui";

/** The app's own versionName, read from the installed package by Capacitor's App plugin. Not available in a browser: then no version is shown. */
async function installedVersion(): Promise<string | null> {
  try {
    const [{ Capacitor }, { App }] = await Promise.all([import("@capacitor/core"), import("@capacitor/app")]);
    if (!Capacitor.isNativePlatform()) return null;
    return (await App.getInfo()).version || null;
  } catch {
    return null;
  }
}

export function AboutPage() {
  const t = useT();
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void installedVersion().then((v) => { if (alive) setVersion(v); });
    return () => { alive = false; };
  }, []);
  return (
    <div className="space-y-6" data-testid="mobile-about-page">
      <a href="#/settings" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <Credits t={t} version={version} />
    </div>
  );
}
