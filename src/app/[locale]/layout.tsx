import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { siteUrl } from "@/config/site";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { localePathnames, parsePublicPathname } from "@/lib/localized-path";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function absoluteUrl(pathname: string) {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, siteUrl).href;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return {};
  }
  const locale = raw;
  const messages = await getMessages(locale);

  const headerStore = await headers();
  const publicPathname =
    headerStore.get("x-public-pathname") ??
    (locale === "en" ? "/" : `/${locale}`);
  const { rest } = parsePublicPathname(publicPathname);
  const paths = localePathnames(rest);

  const languages: Record<string, string> = {
    "x-default": absoluteUrl(paths.en),
  };
  for (const l of locales) {
    languages[l] = absoluteUrl(paths[l]);
  }

  return {
    title: messages.site.name,
    description: messages.site.tagline,
    alternates: {
      canonical: absoluteUrl(publicPathname),
      languages,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const messages = await getMessages(locale);

  return (
    <SiteShell locale={locale} messages={messages}>
      {children}
    </SiteShell>
  );
}
