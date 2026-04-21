export const locales = ["en", "zh", "ja", "es", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** 非默认语言在 URL 中使用 /{locale}/... 前缀 */
export const prefixedLocales = locales.filter(
  (l): l is Exclude<Locale, "en"> => l !== defaultLocale,
);

/** 下拉选项展示名（各语种自称，与当前 UI 语言无关） */
export const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
  es: "Español",
  fr: "Français",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isPrefixedLocale(value: string): value is Exclude<Locale, "en"> {
  return (prefixedLocales as readonly string[]).includes(value);
}
