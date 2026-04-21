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
          href={`${hrefForLocale(locale, "")}#tools`}
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
      </section>
    </article>
  );
}
