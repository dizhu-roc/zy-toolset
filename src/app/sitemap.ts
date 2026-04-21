import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { prefixedLocales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
  for (const l of prefixedLocales) {
    entries.push({
      url: `${siteUrl}/${l}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    });
  }
  return entries;
}
