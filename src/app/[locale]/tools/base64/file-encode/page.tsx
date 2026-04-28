import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeToolIcon } from "@/components/icons/home-tool-icons";
import { ToolPageLayout } from "@/components/layout/tool-page-layout";
import { FileBase64EncodePanel } from "@/components/tools/base64/file-base64-encode-panel";
import { TOOL_ROUTES } from "@/config/tool-registry";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";
import { toolPageCrossLinkClass } from "@/lib/ui/tool-surface";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return {};
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const p = t.tools.base64FileEncode;
  return {
    title: `${p.metaTitle} · ${t.site.name}`,
    description: p.metaDescription,
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
  const textEncodeHref = hrefForLocale(locale, TOOL_ROUTES.base64.textEncode);
  const p = t.tools.base64FileEncode;

  return (
    <ToolPageLayout
      heroCompact
      titleIcon={
        <HomeToolIcon id="base64File" className="size-8 text-text-secondary sm:size-9" />
      }
      title={p.pageTitle}
      description={
        <>
          <p className="m-0">{p.pageDescription}</p>
          <p className="m-0 text-xs text-text-muted leading-relaxed">
            {p.pageDescriptionHintBefore}
            <Link href={textEncodeHref} className={toolPageCrossLinkClass}>
              {p.textEncodeLinkLabel}
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
      <FileBase64EncodePanel copy={p} />
    </ToolPageLayout>
  );
}
