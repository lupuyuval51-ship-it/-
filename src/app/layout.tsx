import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, dirOf } from "@/lib/i18n";
import { getLocale } from "@/server/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LEVEL UP", template: "%s · LEVEL UP" },
  description: "Describe what you want to learn and play it as a 3D game.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#060914" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale} dict={DICTIONARIES[locale]}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
