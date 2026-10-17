import type { Metadata, Viewport } from "next";
import { I18nProvider } from "@/components/I18nProvider";
import { DICTIONARIES, dirOf } from "@/lib/i18n";
import { getLocale } from "@/server/i18n";
import { cookies } from "next/headers";
import { isThemePref, THEME_COOKIE } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LEVEL UP", template: "%s · LEVEL UP" },
  description: "Describe what you want to learn and play it as a 3D game.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060914" },
    { media: "(prefers-color-scheme: light)", color: "#f5f7fc" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const theme = (await cookies()).get(THEME_COOKIE)?.value;
  return (
    <html lang={locale} dir={dirOf(locale)} data-theme={isThemePref(theme) && theme !== "system" ? theme : undefined}>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale} dict={DICTIONARIES[locale]}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
