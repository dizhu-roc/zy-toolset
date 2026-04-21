import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { WebSiteJsonLd } from "@/components/seo/web-site-json-ld";
import { brandLogoSrc, siteUrl } from "@/config/site";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { openGraphLocaleTag } from "@/lib/og-locale";
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

  const canonical = absoluteUrl(publicPathname);
  const ogLocales = locales
    .filter((l) => l !== locale)
    .map((l) => openGraphLocaleTag(l));

  return {
    title: messages.site.name,
    description: messages.site.tagline,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: messages.site.name,
      title: messages.site.name,
      description: messages.site.tagline,
      locale: openGraphLocaleTag(locale),
      alternateLocale: ogLocales.length ? ogLocales : undefined,
      images: [{ url: brandLogoSrc, alt: messages.site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: messages.site.name,
      description: messages.site.tagline,
      images: [brandLogoSrc],
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const messages = await getMessages(locale);
  const homePath = localePathnames("")[locale];
  const homeUrl = absoluteUrl(homePath);

  const headerStore = await headers();
  const publicPathname =
    headerStore.get("x-public-pathname") ??
    (locale === "en" ? "/" : `/${locale}`);
  const { rest } = parsePublicPathname(publicPathname);
  const homeMain = rest === "";

  return (
    <>
      <WebSiteJsonLd
        locale={locale}
        name={messages.site.name}
        description={messages.site.tagline}
        homeUrl={homeUrl}
      />
      <SiteShell locale={locale} messages={messages} homeMain={homeMain}>
        {children}
      </SiteShell>
    </>
  );
}
