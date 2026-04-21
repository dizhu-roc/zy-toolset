import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolPageLayout } from "@/components/layout/tool-page-layout";
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
  return {
    title: `${t.tools.template.title} · ${t.site.name}`,
    description: t.tools.template.description,
    robots: { index: true, follow: true },
  };
}

export default async function ToolTemplatePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const privacyHref = hrefForLocale(locale, "privacy");

  return (
    <ToolPageLayout
      title={t.tools.template.title}
      description={t.tools.template.description}
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
      <p className="max-w-prose text-text-secondary leading-relaxed">
        {t.tools.template.body}
      </p>
    </ToolPageLayout>
  );
}
