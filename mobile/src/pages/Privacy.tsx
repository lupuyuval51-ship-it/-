import { PrivacyPolicy } from "@/components/legal/PrivacyPolicy";
import { useLocale, useT } from "@/components/I18nProvider";
import { Arrow } from "@/components/ui";

/** The privacy policy, readable offline from Settings. */
export function PrivacyPage() {
  const t = useT();
  const locale = useLocale();
  return (
    <div className="space-y-6" data-testid="mobile-privacy-page">
      <a href="#/settings" className="inline-flex min-h-11 items-center gap-1 text-sm text-muted"><Arrow back /> {t("mob.back")}</a>
      <PrivacyPolicy locale={locale} />
    </div>
  );
}
