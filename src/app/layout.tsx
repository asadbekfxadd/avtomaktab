import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { hexToRgb } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.schoolName, template: `%s — ${s.schoolName}` },
    description: s.heroTextRu,
    icons: s.logoUrl ? [{ url: s.logoUrl }] : undefined,
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#24282C" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const lang = h.get("x-lang") ?? "ru";
  const s = await getSettings();
  const style = { "--brand": hexToRgb(s.primaryColor), "--mark": hexToRgb(s.accentColor) } as React.CSSProperties;
  return (
    <html lang={lang} style={style}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600;700&family=Unbounded:wght@500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
