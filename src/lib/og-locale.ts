import type { Locale } from "@/i18n/config";

/** BCP 47-ish tags for Next `metadata.openGraph.locale` */
export function openGraphLocaleTag(locale: Locale): string {
  switch (locale) {
    case "zh":
      return "zh_CN";
    case "ja":
      return "ja_JP";
    case "es":
      return "es";
    case "fr":
      return "fr_FR";
    case "en":
    default:
      return "en_US";
  }
}
