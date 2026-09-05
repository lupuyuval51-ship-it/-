import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "DiscCoach", template: "%s · DiscCoach" },
  description: "המאמן האישי שלך לפריזבי ול-Ultimate Frisbee: תוכניות אימון אישיות, אימונים של 90 דקות ומעלה, מעקב התקדמות ומאמן AI.",
  applicationName: "DiscCoach",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "DiscCoach" },
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }], apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#176b48" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1411" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Default is Hebrew/RTL; <Providers> flips lang/dir on the client when the locale changes.
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Apply the stored theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('dc-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.setAttribute('data-theme','dark');var l=localStorage.getItem('dc-locale');if(l==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';}var s=localStorage.getItem('dc-text-scale');if(s)document.documentElement.style.setProperty('--text-scale',s);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
