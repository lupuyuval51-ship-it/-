import { useState, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Arrow, Button, Card, Field, Select } from "@/components/ui";
import { GRAPHICS_TIERS, type GraphicsTier } from "@/config/plans";
import { browserKV } from "@/lib/offline/store";
import { THEMES, type ThemePref } from "@/lib/theme";
import { setSettings, store, useSettings } from "../app-state";
import { deleteAllGames } from "../reset";
import { AccountPanel } from "./AccountPanel";
import { BackupPanel } from "./BackupPanel";
import { navigate } from "../router";

/**
 * A titled group of settings. The title is a real heading so TalkBack's heading navigation can jump between sections,
 * except where the group's own panels bring their headings (account, backup): then it only names the region, and the
 * panels' headings stay siblings of the other sections' instead of nesting under a same-level heading.
 */
function Section({ id, title, heading = true, children }: { id: string; title: string; heading?: boolean; children: ReactNode }) {
  const cls = "text-sm font-bold uppercase tracking-wide text-muted";
  return (
    <section aria-labelledby={id} className="space-y-3">
      {heading ? <h2 id={id} className={cls}>{title}</h2> : <p id={id} className={cls}>{title}</p>}
      {children}
    </section>
  );
}

/** One on/off setting: the whole row is the (48px) tap target, the checkbox sits at the end of the line. */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-line bg-ink-900/60 px-4">
      <span>{label}</span>
      <input type="checkbox" className="size-5 shrink-0 accent-neon" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function SettingsPage() {
  const t = useT();
  const s = useSettings();
  const [clearFailed, setClearFailed] = useState(false);
  return (
    <div className="space-y-6" data-testid="mobile-settings-page">
      <a href="#/" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <h1 className="text-2xl font-extrabold">{t("mob.settings")}</h1>
      <div className="space-y-6 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:space-y-0" data-testid="settings-columns">
        <div className="space-y-6">
          <Section id="set-look" title={t("mob.settings.sec.look")}>
            <Field label={t("mob.settings.language")} htmlFor="locale">
              <Select id="locale" className="min-h-11" value={s.locale} onChange={(e) => setSettings({ locale: e.target.value as "he" | "en" })}>
                <option value="he" lang="he">{t("lang.he")}</option>
                <option value="en" lang="en">{t("lang.en")}</option>
              </Select>
            </Field>
            <Field label={t("theme.label")} htmlFor="theme">
              <Select id="theme" className="min-h-11" value={s.theme} onChange={(e) => setSettings({ theme: e.target.value as ThemePref })}>
                {THEMES.map((x) => <option key={x} value={x}>{t(`theme.${x}`)}</option>)}
              </Select>
            </Field>
            <Field label={t("mob.settings.graphics")} hint={t("mob.settings.graphics.hint")} htmlFor="tier">
              <Select id="tier" className="min-h-11" value={s.tier} onChange={(e) => setSettings({ tier: e.target.value as GraphicsTier })}>
                {GRAPHICS_TIERS.map((x) => <option key={x} value={x}>{t(`tier.${x}`)}</option>)}
              </Select>
            </Field>
          </Section>
          <Section id="set-feel" title={t("mob.settings.sec.feel")}>
            <div className="space-y-2">
              <Toggle label={t("hud.sound")} checked={s.sound} onChange={(sound) => setSettings({ sound })} />
              <Toggle label={t("hud.music")} checked={s.music} onChange={(music) => setSettings({ music })} />
              <Toggle label={t("mob.settings.vibration")} checked={s.vibration} onChange={(vibration) => setSettings({ vibration })} />
            </div>
          </Section>
        </div>
        <div className="space-y-6">
          <Section id="set-data" title={t("mob.settings.sec.data")} heading={false}>
            <AccountPanel />
            <BackupPanel />
          </Section>
          <Section id="set-about" title={t("mob.settings.sec.about")}>
            <Card className="space-y-2 text-sm text-muted">
              <p>{t("mob.settings.privacy")}</p>
              <p>{t("mob.settings.about")}</p>
            </Card>
            <Button variant="secondary" data-testid="about-credits" onClick={() => navigate("/about")}>{t("mob.settings.credits")}</Button>
            <Button variant="secondary" data-testid="welcome-again" onClick={() => navigate("/?welcome=1")}>{t("mob.settings.welcome")}</Button>
          </Section>
        </div>
      </div>
      <section aria-label={t("mob.settings.clear")} className="space-y-2 rounded-2xl border border-rose/40 p-4">
        <p id="clear-hint" className="text-sm text-muted">{t("mob.settings.clear.hint")}</p>
        <Button
          variant="danger"
          className="w-full sm:w-auto"
          aria-describedby="clear-hint"
          data-testid="clear-all"
          onClick={() => {
            if (!window.confirm(t("mob.settings.clear.confirm"))) return;
            try {
              deleteAllGames(store, browserKV());
              navigate("/", true);
            } catch {
              setClearFailed(true);
            }
          }}
        >
          {t("mob.settings.clear")}
        </Button>
        {clearFailed && <Alert tone="error" data-testid="clear-error">{t("mob.settings.clear.error")}</Alert>}
      </section>
    </div>
  );
}
