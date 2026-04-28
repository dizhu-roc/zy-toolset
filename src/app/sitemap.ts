import type { MetadataRoute } from "next";
import { SITEMAP_TOOL_RESTS } from "@/config/tool-registry";
import { siteUrl } from "@/config/site";
import { locales } from "@/i18n/config";
import { localePathnames } from "@/lib/localized-path";

/** 各语言下需要入站的静态「站点路径」（不含语言前缀段） */
const STATIC_REST = [
  "",
  "privacy",
  "terms",
  "cookies",
  ...SITEMAP_TOOL_RESTS,
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const rest of STATIC_REST) {
    const paths = localePathnames(rest);
    for (const locale of locales) {
      const pathname = paths[locale];
      const url = new URL(pathname, siteUrl).href;
      entries.push({
        url,
        lastModified,
        changeFrequency: rest === "" ? "weekly" : "monthly",
        priority: rest === "" ? 1 : 0.6,
      });
    }
  }

  return entries;
}
