import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: { default: "LUPU Study AI – המורה הפרטי שלך", template: "%s · LUPU Study AI" },
  description: "פלטפורמת לימודים אישית מבוססת בינה מלאכותית לתלמידי חטיבת ביניים ותיכון: מורה AI, הכנה למבחנים, כרטיסיות, שיעורי בית ועוד.",
  applicationName: "LUPU Study AI",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "LUPU Study AI", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1f" },
  ],
};

/** מחיל את ערכת הנושא לפני הציור הראשון כדי למנוע הבהוב */
const themeScript = `try{var t=localStorage.getItem('lupu:theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
          דלג לתוכן הראשי
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
