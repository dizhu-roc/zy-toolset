import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isPrefixedLocale, type Locale } from "@/i18n/config";

function pathnameHasFileExtension(pathname: string) {
  return /\.[a-zA-Z0-9]{1,8}$/.test(pathname);
}

function withLocaleHeaders(
  request: NextRequest,
  locale: Locale,
  publicPathname: string,
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set(
    "x-public-pathname",
    publicPathname === "" ? "/" : publicPathname,
  );
  return requestHeaders;
}

/**
 * Next.js 16+：须放在 **`src/proxy.ts`**（与 `src/app` 同级）。
 * - 英文无前缀：对外 `/`、`/foo` rewrite 为内部 `/en`、`/en/foo`。
 * - 其它语言：`/zh`、`/ja`、`/es`、`/fr` 及其子路径原样进入对应 `[locale]`。
 * - 旧链接 `/en/...` → 308 到无前缀 URL。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/favicon.ico") {
    return NextResponse.redirect(new URL("/icon.svg", request.url), 307);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathnameHasFileExtension(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const dest =
      pathname === "/en" ? "/" : pathname.slice("/en".length) || "/";
    return NextResponse.redirect(new URL(dest, request.url), 308);
  }

  const publicPathname = pathname;
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && isPrefixedLocale(first)) {
    const headers = withLocaleHeaders(request, first, publicPathname);
    return NextResponse.next({ request: { headers } });
  }

  const internalPath = pathname === "/" ? "/en" : `/en${pathname}`;
  const headers = withLocaleHeaders(request, defaultLocale, publicPathname);
  return NextResponse.rewrite(new URL(internalPath, request.url), {
    request: { headers },
  });
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image).*)",
  ],
};
