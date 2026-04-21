import Link from "next/link";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return null;
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);

  return (
    <article className="mx-auto max-w-prose py-10">
      <h1 className="font-semibold tracking-tight text-text text-3xl leading-tight sm:text-4xl">
        {t.home.introTitle}
      </h1>
      <p className="mt-6 text-lg text-text-secondary leading-relaxed">
        {t.home.introBody}
      </p>
      <p className="mt-4 text-text-muted leading-relaxed">{t.site.tagline}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-md border border-border bg-surface-raised px-4 py-2 text-sm text-text-secondary shadow-sm">
          {t.home.ctaSoon}
        </span>
        <Link
          href={hrefForLocale(locale, "tools/base64")}
          className="inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface-raised no-underline shadow-sm transition-colors hover:bg-accent-hover"
        >
          {t.home.ctaBrowse}
        </Link>
      </div>

      <section
        id="tools"
        aria-labelledby="tools-heading"
        className="mt-20 border-t border-border pt-12"
      >
        <h2
          id="tools-heading"
          className="text-lg font-semibold tracking-tight text-text"
        >
          {t.home.toolsSectionTitle}
        </h2>
        <p className="mt-3 max-w-prose text-text-muted leading-relaxed">
          {t.home.toolsPlaceholder}
        </p>

        <section
          aria-labelledby="base64-heading"
          className="mt-10 rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          <h3
            id="base64-heading"
            className="text-base font-semibold tracking-tight text-text"
          >
            {t.home.base64SectionTitle}
          </h3>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {t.home.base64SectionBody}
          </p>
          <Link
            href={hrefForLocale(locale, "tools/base64")}
            className="mt-4 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface-raised no-underline shadow-sm transition-colors hover:bg-accent-hover"
          >
            {t.home.base64Cta}
          </Link>
          <ul className="mt-6 space-y-2 border-t border-border pt-4 text-sm text-text-muted">
            <li>
              <span className="mr-2 inline-block rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                {t.home.soonBadge}
              </span>
              {t.home.soonHex}
            </li>
            <li>
              <span className="mr-2 inline-block rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                {t.home.soonBadge}
              </span>
              {t.home.soonUrl}
            </li>
          </ul>
        </section>
      </section>
    </article>
  );
}
