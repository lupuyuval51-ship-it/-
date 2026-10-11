import type { ReactNode } from "react";
import { useT } from "@/components/I18nProvider";
import { Arrow, Button, Card, Field, Select } from "@/components/ui";
import { GRAPHICS_TIERS, type GraphicsTier } from "@/config/plans";
import { THEMES, type ThemePref } from "@/lib/theme";
import { setSettings, store, useSettings } from "../app-state";
import { AccountPanel } from "./AccountPanel";
import { BackupPanel } from "./BackupPanel";
import { navigate } from "../router";

/** A titled group of settings: a real heading so TalkBack's heading navigation can jump between sections. */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
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
          <Section id="set-data" title={t("mob.settings.sec.data")}>
            <AccountPanel />
            <BackupPanel />
          </Section>
          <Section id="set-about" title={t("mob.settings.sec.about")}>
            <Card className="space-y-2 text-sm text-muted">
              <p>{t("mob.settings.privacy")}</p>
              <p>{t("mob.settings.about")}</p>
            </Card>
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
            for (const g of store.listGames()) store.deleteGame(g.id);
            navigate("/", true);
          }}
        >
          {t("mob.settings.clear")}
        </Button>
      </section>
    </div>
  );
}
