import type { Locale } from "@/i18n/config";

type Props = {
  locale: Locale;
  name: string;
  description: string;
  /** 当前语言下的站点首页绝对 URL */
  homeUrl: string;
};

/**
 * WebSite 结构化数据占位（随正式域名与法务文案再细化）。
 * @see https://schema.org/WebSite
 */
export function WebSiteJsonLd({ locale, name, description, homeUrl }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    description,
    url: homeUrl,
    inLanguage: locale,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
