import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalArticle } from "@/components/legal/legal-article";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return {};
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  return {
    title: `${t.terms.title} · ${t.site.name}`,
    description: t.terms.description,
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);

  return (
    <LegalArticle
      title={t.terms.title}
      lead={t.terms.lead}
      paragraphs={t.terms.paragraphs}
    />
  );
}
