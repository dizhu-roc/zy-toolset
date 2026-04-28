import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeToolIcon } from "@/components/icons/home-tool-icons";
import { ToolPageLayout } from "@/components/layout/tool-page-layout";
import { IcoGeneratorPanel } from "@/components/tools/ico/ico-generator-panel";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return {};
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const tc = t.tools.icoGenerator;
  return {
    title: `${tc.metaTitle} · ${t.site.name}`,
    description: tc.metaDescription,
    robots: { index: true, follow: true },
  };
}

export default async function GeneratorIcoPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const tc = t.tools.icoGenerator;
  const privacyHref = hrefForLocale(locale, "privacy");

  return (
    <ToolPageLayout
      heroCompact
      titleIcon={
        <HomeToolIcon id="icoGenerator" className="size-8 text-text-secondary sm:size-9" />
      }
      title={tc.pageTitle}
      description={
        <>
          <p className="m-0">{tc.pageDescription}</p>
          <p className="m-0 text-xs text-text-muted leading-relaxed">{tc.introP1}</p>
        </>
      }
      ancillary={
        <p>
          <Link
            href={privacyHref}
            className="text-text-secondary no-underline hover:text-text"
          >
            {t.toolLayout.privacyHint}
          </Link>
        </p>
      }
    >
      <IcoGeneratorPanel copy={tc} />
    </ToolPageLayout>
  );
}
