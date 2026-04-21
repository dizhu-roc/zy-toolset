import type { Metadata } from "next";
import { headers } from "next/headers";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { defaultLocale, isLocale } from "@/i18n/config";
import { siteName, siteUrl } from "@/config/site";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description:
    "Browser-side utilities for text, data, and media. Local-first by default.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerLocale = (await headers()).get("x-locale");
  const lang = headerLocale && isLocale(headerLocale) ? headerLocale : defaultLocale;

  return (
    <html
      lang={lang}
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-canvas font-sans text-text antialiased">
        {children}
      </body>
    </html>
  );
}
