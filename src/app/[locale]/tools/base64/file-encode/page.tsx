import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ToolPageLayout } from "@/components/layout/tool-page-layout";
import { Base64Workbench } from "@/components/tools/base64/base64-workbench";
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
    title: `${t.home.base64FileCardTitle} · ${t.site.name}`,
    description: t.home.base64FileCardDesc,
    robots: { index: true, follow: true },
  };
}

export default async function Base64FileEncodePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const privacyHref = hrefForLocale(locale, "privacy");

  return (
    <ToolPageLayout
      title={t.home.base64FileCardTitle}
      description={t.home.base64FileCardDesc}
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
      <Base64Workbench
        copy={t.tools.base64}
        privacyHref={privacyHref}
        defaultTab="file"
      />
    </ToolPageLayout>
  );
}
