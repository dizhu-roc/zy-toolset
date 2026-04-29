import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TextEncodeAutoSwitchSamples } from "@/components/dev/text-encode-auto-switch-samples";
import { TOOL_ROUTES } from "@/config/tool-registry";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return { title: "Demo" };
  }
  const t = await getMessages(raw);
  return {
    title: `Auto-encode 开关样例 · ${t.site.name}`,
    description: "内部 UI 参考：text-encode 自动编码控件的多种开关样式。",
    robots: { index: false, follow: false },
  };
}

export default async function TextEncodeSwitchSamplesPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const backHref = hrefForLocale(locale, TOOL_ROUTES.base64.textEncode);

  return (
    <TextEncodeAutoSwitchSamples
      autoEncodeLabel={t.tools.base64TextEncode.autoEncode}
      backHref={backHref}
      backLabel={t.tools.base64TextEncode.pageTitle}
    />
  );
}
