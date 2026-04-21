import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import type { Messages } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";
import { LocaleSwitcher } from "./locale-switcher";
import { NavToolCategories } from "./nav-tool-categories";

type Props = {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
};

export function SiteShell({ locale, messages, children }: Props) {
  const homeHref = hrefForLocale(locale, "");
  const base64Href = hrefForLocale(locale, "tools/base64");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface shadow-sm">
        <div className="mx-auto flex min-h-14 max-w-content items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-6">
            <SiteLogo href={homeHref} />
            <nav
              aria-label="Primary"
              className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
            >
              <Link
                href={homeHref}
                className="inline-flex items-center py-1 text-text-secondary no-underline hover:text-text"
              >
                {messages.nav.home}
              </Link>
              <NavToolCategories
                workbenchHref={base64Href}
                labels={{
                  category: messages.nav.categoryBase64,
                  categoryAria: messages.nav.categoryBase64MenuAria,
                  workbenchTitle: messages.tools.base64.navEntryTitle,
                  workbenchDesc: messages.tools.base64.navEntryDescription,
                  soonHex: messages.nav.soonHex,
                  soonUrl: messages.nav.soonUrl,
                  soonBadge: messages.nav.soonBadge,
                }}
              />
            </nav>
          </div>
          <LocaleSwitcher locale={locale} labels={messages.locale} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-16 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-border bg-surface py-8 text-sm text-text-muted">
        <div className="mx-auto flex max-w-content flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{messages.footer.local}</p>
          <nav
            aria-label={messages.footer.legalNavLabel}
            className="flex flex-wrap gap-x-4 gap-y-1 text-text-secondary"
          >
            <Link
              href={hrefForLocale(locale, "privacy")}
              className="no-underline hover:text-text"
            >
              {messages.footer.privacy}
            </Link>
            <Link
              href={hrefForLocale(locale, "terms")}
              className="no-underline hover:text-text"
            >
              {messages.footer.terms}
            </Link>
            <Link
              href={hrefForLocale(locale, "cookies")}
              className="no-underline hover:text-text"
            >
              {messages.footer.cookies}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
