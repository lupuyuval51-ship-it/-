import { useState, type ReactNode } from "react";
import { useT } from "@/components/I18nProvider";
import { Alert, Arrow, Button, Field, Select } from "@/components/ui";
import { GRAPHICS_TIERS, type GraphicsTier } from "@/config/plans";
import { REGION_CHOICES } from "@/lib/offline/first-run";
import { browserKV } from "@/lib/offline/store";
import { regionLabel } from "@/lib/regions";
import { THEMES, type ThemePref } from "@/lib/theme";
import { setSettings, store, useSettings } from "../app-state";
import { showPlans } from "../features";
import { deleteAllGames } from "../reset";
import { AccountPanel } from "./AccountPanel";
import { BackupPanel } from "./BackupPanel";
import { navigate } from "../router";

/**
 * A titled group of settings: a real heading (TalkBack's heading navigation jumps between sections) above a card that holds the
 * group's controls. Where the group brings panels of its own (account, backup), `boxed={false}` only names the region, and the
 * panels' headings stay siblings of the other sections' instead of nesting under a same-level heading.
 */
function Section({ id, title, heading = true, boxed = true, tone = "plain", children }: { id: string; title: string; heading?: boolean; boxed?: boolean; tone?: "plain" | "danger"; children: ReactNode }) {
  const cls = "px-1 text-lg font-bold";
  return (
    <section aria-labelledby={id} className="space-y-3">
      {heading ? <h2 id={id} className={cls}>{title}</h2> : <p id={id} className={cls}>{title}</p>}
      {boxed ? <div className={`space-y-4 rounded-2xl border p-4 ${tone === "danger" ? "border-rose/40" : "border-line bg-ink-900/60"}`}>{children}</div> : <div className="space-y-3">{children}</div>}
    </section>
  );
}

/** One on/off setting: the whole row is the (56px) tap target, the checkbox sits at the end of the line. */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 py-1">
      <span>{label}</span>
      <input type="checkbox" className="size-6 shrink-0 accent-neon" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** A row that opens another screen: label at the start, an arrow at the end (full width, 56px). */
function LinkRow({ label, onOpen, testId }: { label: string; onOpen: () => void; testId: string }) {
  return (
    <Button variant="secondary" className="min-h-14 w-full justify-between text-start" data-testid={testId} onClick={onOpen}>
      <span>{label}</span>
      <Arrow />
    </Button>
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
              <Select id="locale" className="min-h-11" value={s.locale} onChange={(e) => setSettings({ locale: e.target.value as "he" | "en" | "es" })}>
                <option value="en" lang="en">{t("lang.en")}</option>
                <option value="he" lang="he">{t("lang.he")}</option>
                <option value="es" lang="es">{t("lang.es")}</option>
              </Select>
            </Field>
            {/* the country only picks the currency of the prices, so it goes with them (features.ts) */}
            {showPlans() && import.meta.env.VITE_SETUP_PLAN === "1" && (
              <Field label={t("mob.settings.country")} hint={t("mob.setup.country.hint")} htmlFor="region">
                <Select id="region" className="min-h-11" value={s.region} onChange={(e) => setSettings({ region: e.target.value })}>
                  {REGION_CHOICES.map((c) => <option key={c} value={c}>{regionLabel(c, s.locale)}</option>)}
                </Select>
              </Field>
            )}
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
            <div className="divide-y divide-line">
              <Toggle label={t("hud.sound")} checked={s.sound} onChange={(sound) => setSettings({ sound })} />
              <Toggle label={t("hud.music")} checked={s.music} onChange={(music) => setSettings({ music })} />
              <Toggle label={t("mob.settings.vibration")} checked={s.vibration} onChange={(vibration) => setSettings({ vibration })} />
            </div>
          </Section>
        </div>
        <div className="space-y-6">
          <Section id="set-data" title={t("mob.settings.sec.data")} heading={false} boxed={false}>
            <AccountPanel />
            <BackupPanel />
          </Section>
          <Section id="set-about" title={t("mob.settings.sec.about")}>
            <div className="space-y-2 text-sm text-muted">
              <p>{t("mob.settings.privacy")}</p>
              <p>{t("mob.settings.about")}</p>
            </div>
            <div className="space-y-2">
              {showPlans() && <LinkRow label={t("pricing.title")} testId="open-plans" onOpen={() => navigate("/plans")} />}
              <LinkRow label={t("mob.settings.credits")} testId="about-credits" onOpen={() => navigate("/about")} />
              <LinkRow label={t("mob.settings.setupAgain")} testId="setup-again" onOpen={() => { setSettings({ setupDone: false }); navigate("/"); }} />
              <LinkRow label={t("mob.settings.welcome")} testId="welcome-again" onOpen={() => navigate("/?welcome=1")} />
            </div>
          </Section>
        </div>
      </div>
      <Section id="set-erase" title={t("mob.settings.sec.erase")} tone="danger">
        <p id="clear-hint" className="text-sm text-muted">{t("mob.settings.clear.hint")}</p>
        <Button
          variant="danger"
          className="min-h-12 w-full sm:w-auto"
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
      </Section>
    </div>
  );
}
