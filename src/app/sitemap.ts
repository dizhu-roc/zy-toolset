import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { locales } from "@/i18n/config";
import { localePathnames } from "@/lib/localized-path";

/** 各语言下需要入站的静态「站点路径」（不含语言前缀段） */
const STATIC_REST = [
  "",
  "privacy",
  "terms",
  "cookies",
  "tools/base64/text-encode",
  "tools/base64/text-decode",
  "tools/base64/file-encode",
  "tools/generator/password",
  "tools/generator/ico",
  "tools/image/compress",
  "tools/image/crop",
  "tools/image/resize",
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
