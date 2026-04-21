import { defaultLocale, isPrefixedLocale, locales, type Locale } from "@/i18n/config";

/**
 * 浏览器地址栏路径 → 语言 + 去掉语言前缀后的「站点路径」
 * （站点路径不含前导 /，空字符串表示首页）
 */
export function parsePublicPathname(pathname: string): {
  locale: Locale;
  rest: string;
} {
  const normalized = pathname === "" ? "/" : pathname;
  const segments = normalized.split("/").filter(Boolean);
  const first = segments[0];

  if (first && isPrefixedLocale(first)) {
    return {
      locale: first,
      rest: segments.slice(1).join("/"),
    };
  }

  return {
    locale: defaultLocale,
    rest: segments.join("/"),
  };
}

/** 生成浏览器应使用的 href（英文无前缀，其余语言带 /{locale}） */
export function hrefForLocale(locale: Locale, rest: string): string {
  const path = rest ? `/${rest}` : "";
  if (locale === defaultLocale) {
    return path || "/";
  }
  return path ? `/${locale}${path}` : `/${locale}`;
}

/** 与当前页面对应的各语言 URL 路径（pathname，含前导 /） */
export function localePathnames(rest: string): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((l) => [
      l,
      l === defaultLocale
        ? rest
          ? `/${rest}`
          : "/"
        : rest
          ? `/${l}/${rest}`
          : `/${l}`,
    ]),
  ) as Record<Locale, string>;
}
