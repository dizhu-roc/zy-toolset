import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import type { Messages } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";
import { LocaleSwitcher } from "./locale-switcher";

type Props = {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
};

export function SiteShell({ locale, messages, children }: Props) {
  const homeHref = hrefForLocale(locale, "");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-surface shadow-sm">
        <div className="mx-auto flex min-h-14 max-w-content items-center justify-between gap-4 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-6">
            <SiteLogo href={homeHref} />
            <nav
              aria-label="Primary"
              className="hidden items-center text-sm sm:flex"
            >
              <Link
                href={homeHref}
                className="inline-flex items-center py-1 text-text-secondary no-underline hover:text-text"
              >
                {messages.nav.home}
              </Link>
            </nav>
          </div>
          <LocaleSwitcher locale={locale} labels={messages.locale} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-content flex-1 px-4 pb-16 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-border bg-surface py-8 text-sm text-text-muted">
        <div className="mx-auto flex max-w-content flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{messages.footer.local}</p>
          <p className="text-text-secondary">{messages.footer.privacy}</p>
        </div>
      </footer>
    </div>
  );
}
