import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
const heebo = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-hebrew-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-hebrew-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-hebrew-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-hebrew-700-normal.woff2",
      weight: "700",
    },
  ],
  variable: "--font-heebo",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});
const heeboLatin = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-latin-500-normal.woff2",
      weight: "500",
    },
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-latin-600-normal.woff2",
      weight: "600",
    },
    {
      path: "../../node_modules/@fontsource/heebo/files/heebo-latin-700-normal.woff2",
      weight: "700",
    },
  ],
  variable: "--font-heebo-latin",
  display: "swap",
  preload: true,
  adjustFontFallback: "Arial",
});
import "./globals.css";
export const metadata: Metadata = {
  title: "LEVELUP AI — לומדים. בונים. מתקדמים.",
  description: "מסלולי למידה אישיים, משימות יומיות ומערכת משחקי 3D.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#0B0D12",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={heebo.variable + " " + heeboLatin.variable}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
