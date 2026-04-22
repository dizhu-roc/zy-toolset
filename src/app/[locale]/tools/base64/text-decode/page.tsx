import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeToolIcon } from "@/components/icons/home-tool-icons";
import { ToolPageLayout } from "@/components/layout/tool-page-layout";
import { TextBase64DecodePanel } from "@/components/tools/base64/text-base64-decode-panel";
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
  const p = t.tools.base64TextDecode;
  return {
    title: `${p.metaTitle} · ${t.site.name}`,
    description: p.metaDescription,
    robots: { index: true, follow: true },
  };
}

export default async function Base64TextDecodePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const privacyHref = hrefForLocale(locale, "privacy");
  const encodeHref = hrefForLocale(locale, "tools/base64/text-encode");
  const p = t.tools.base64TextDecode;

  return (
    <ToolPageLayout
      heroCompact
      titleIcon={
        <HomeToolIcon id="base64Text" className="size-8 text-text-secondary sm:size-9" />
      }
      title={p.pageTitle}
      description={
        <>
          <p className="m-0">{p.pageDescription}</p>
          <p className="m-0 text-xs text-text-muted leading-relaxed">
            {p.pageDescriptionHintBefore}
            <Link
              href={encodeHref}
              className="font-medium text-accent underline decoration-accent/35 underline-offset-2 hover:decoration-accent"
            >
              {p.encodeLinkLabel}
            </Link>
            {p.pageDescriptionHintAfter}
          </p>
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
      <TextBase64DecodePanel copy={p} />
    </ToolPageLayout>
  );
}
