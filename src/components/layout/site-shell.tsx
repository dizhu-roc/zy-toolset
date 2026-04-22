import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import type { Messages } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "./locale-switcher";
import { NavCategoryMenu } from "./nav-category-menu";
import { NavToolCategories } from "./nav-tool-categories";

type Props = {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
  /** 首页 main 内容列略窄于顶栏/页脚（1240px） */
  homeMain?: boolean;
};

export function SiteShell({ locale, messages, children, homeMain }: Props) {
  const homeHref = hrefForLocale(locale, "");
  const base64TextEncodeHref = hrefForLocale(locale, "tools/base64/text-encode");
  const base64FileEncodeHref = hrefForLocale(locale, "tools/base64/file-encode");
  const passwordHref = hrefForLocale(locale, "tools/generator/password");
  const icoHref = hrefForLocale(locale, "tools/generator/ico");
  const imageCompressHref = hrefForLocale(locale, "tools/image/compress");
  const imageCropHref = hrefForLocale(locale, "tools/image/crop");
  const imageResizeHref = hrefForLocale(locale, "tools/image/resize");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface-raised shadow-sm">
        <div className="mx-auto grid min-h-14 max-w-content grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2 sm:px-6">
          <SiteLogo href={homeHref} />
          <nav
            aria-label="Primary"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.875rem]"
          >
            <Link
              href={homeHref}
              className="inline-flex items-center py-1 font-semibold text-text no-underline hover:opacity-85"
            >
              {messages.nav.home}
            </Link>
            <NavToolCategories
              category={messages.nav.categoryBase64}
              categoryAria={messages.nav.categoryBase64MenuAria}
              items={[
                {
                  href: base64TextEncodeHref,
                  title: messages.nav.textToBase64,
                  icon: "base64Text",
                },
                {
                  href: `${base64FileEncodeHref}#decode`,
                  title: messages.nav.base64ToText,
                  icon: "base64Text",
                },
                {
                  href: base64FileEncodeHref,
                  title: messages.nav.fileToBase64,
                  icon: "base64File",
                },
                {
                  href: `${base64FileEncodeHref}#decode`,
                  title: messages.nav.base64ToFile,
                  icon: "base64File",
                },
              ]}
            />
            <NavCategoryMenu
              category={messages.nav.categoryGenerators}
              categoryAria={messages.nav.categoryGeneratorsMenuAria}
              items={[
                {
                  href: passwordHref,
                  title: messages.tools.passwordGenerator.pageTitle,
                  icon: "passwordGenerator",
                },
                {
                  href: icoHref,
                  title: messages.tools.icoGenerator.pageTitle,
                  icon: "icoGenerator",
                },
              ]}
            />
            <NavCategoryMenu
              category={messages.nav.categoryImages}
              categoryAria={messages.nav.categoryImagesMenuAria}
              items={[
                {
                  href: imageCompressHref,
                  title: messages.tools.imageCompressor.pageTitle,
                  icon: "imageCompressor",
                },
                {
                  href: imageCropHref,
                  title: messages.tools.imageCropper.pageTitle,
                  icon: "imageCropper",
                },
                {
                  href: imageResizeHref,
                  title: messages.tools.imageResizer.pageTitle,
                  icon: "imageResizer",
                },
              ]}
            />
          </nav>
          <div className="justify-self-end">
            <LocaleSwitcher locale={locale} labels={messages.locale} />
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full flex-1 bg-main-bg px-4 pb-16 sm:px-6",
          homeMain ? "max-w-[1240px]" : "max-w-content",
        )}
      >
        {children}
      </main>

      <footer className="border-t border-footer-border bg-footer-bg py-8 text-sm text-footer-text-muted">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{messages.footer.local}</p>
          <nav
            aria-label={messages.footer.legalNavLabel}
            className="flex flex-wrap gap-x-4 gap-y-1"
          >
            <Link
              href={hrefForLocale(locale, "privacy")}
              className="text-footer-text/90 no-underline transition-colors hover:text-footer-text"
            >
              {messages.footer.privacy}
            </Link>
            <Link
              href={hrefForLocale(locale, "terms")}
              className="text-footer-text/90 no-underline transition-colors hover:text-footer-text"
            >
              {messages.footer.terms}
            </Link>
            <Link
              href={hrefForLocale(locale, "cookies")}
              className="text-footer-text/90 no-underline transition-colors hover:text-footer-text"
            >
              {messages.footer.cookies}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
