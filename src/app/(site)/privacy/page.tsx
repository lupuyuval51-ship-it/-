import { PrivacyPolicy } from "@/components/legal/PrivacyPolicy";
import { titleFor } from "@/components/layout/pageTitle";
import { getT } from "@/server/i18n";

export const generateMetadata = titleFor("privacy.title");

export default async function PrivacyPage() {
  const { locale } = await getT();
  return (
    <div className="mx-auto max-w-3xl">
      <PrivacyPolicy locale={locale} />
    </div>
  );
}
