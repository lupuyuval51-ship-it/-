import { Credits } from "@/components/about/Credits";
import { titleFor } from "@/components/layout/pageTitle";
import { getT } from "@/server/i18n";

export const generateMetadata = titleFor("about.title");

export default async function AboutPage() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-3xl">
      <Credits t={t} />
    </div>
  );
}
