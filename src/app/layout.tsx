import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Fragment_Mono } from "next/font/google";
import { defaultLocale, isLocale } from "@/i18n/config";
import { siteName, siteUrl } from "@/config/site";
import { cn } from "@/lib/utils";
import "./globals.css";

/** UI：标题 / 正文 / 按钮等（400–700 + italic） */
const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

/** 代码、等宽字段：`font-mono` / `code` */
const fragmentMono = Fragment_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-fragment-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description:
    "Browser tools for text, data, and media—local-first by default.",
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
      className={cn(dmSans.variable, fragmentMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-canvas font-sans text-text antialiased">
        {children}
      </body>
    </html>
  );
}
