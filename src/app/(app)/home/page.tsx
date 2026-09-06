"use client";
/* TEMPORARY placeholder so the /home route exists inside the shell. The home-screen agent replaces this file. */
import { useT } from "@/i18n/useT";
import { PageHeader } from "@/components/PageHeader";

export default function HomePage() {
  const { t } = useT();
  return <PageHeader title={t("nav.home")} subtitle={t("app.tagline")} size="lg" />;
}
