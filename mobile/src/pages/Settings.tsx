import { useT } from "@/components/I18nProvider";
import { Arrow, Button, Card, Field, Select } from "@/components/ui";
import { GRAPHICS_TIERS, type GraphicsTier } from "@/config/plans";
import { THEMES, type ThemePref } from "@/lib/theme";
import { setSettings, store, useSettings } from "../app-state";
import { navigate } from "../router";

export function SettingsPage() {
  const t = useT();
  const s = useSettings();
  return (
    <div className="space-y-4" data-testid="mobile-settings-page">
      <a href="#/" className="text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <h1 className="text-2xl font-extrabold">{t("mob.settings")}</h1>
      <Field label={t("mob.settings.language")} htmlFor="locale">
        <Select id="locale" value={s.locale} onChange={(e) => setSettings({ locale: e.target.value as "he" | "en" })}>
          <option value="he">{t("lang.he")}</option>
          <option value="en">{t("lang.en")}</option>
        </Select>
      </Field>
      <Field label={t("theme.label")} htmlFor="theme">
        <Select id="theme" value={s.theme} onChange={(e) => setSettings({ theme: e.target.value as ThemePref })}>
          {THEMES.map((x) => <option key={x} value={x}>{t(`theme.${x}`)}</option>)}
        </Select>
      </Field>
      <Field label={t("mob.settings.graphics")} hint={t("mob.settings.graphics.hint")} htmlFor="tier">
        <Select id="tier" value={s.tier} onChange={(e) => setSettings({ tier: e.target.value as GraphicsTier })}>
          {GRAPHICS_TIERS.map((x) => <option key={x} value={x}>{t(`tier.${x}`)}</option>)}
        </Select>
      </Field>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-5" checked={s.sound} onChange={(e) => setSettings({ sound: e.target.checked })} />{t("hud.sound")}</label>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" className="size-5" checked={s.music} onChange={(e) => setSettings({ music: e.target.checked })} />{t("hud.music")}</label>
      <Card className="space-y-2 text-sm text-muted">
        <p>{t("mob.settings.privacy")}</p>
        <p>{t("mob.settings.about")}</p>
      </Card>
      <Button variant="danger" onClick={() => {
        if (!window.confirm(t("mob.settings.clear.confirm"))) return;
        for (const g of store.listGames()) store.deleteGame(g.id);
        navigate("/", true);
      }}>{t("mob.settings.clear")}</Button>
    </div>
  );
}
