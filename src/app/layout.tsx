import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "LEVEL UP", description: "Describe what you want to learn. Play it as a 3D game." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
