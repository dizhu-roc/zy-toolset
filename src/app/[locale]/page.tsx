import Link from "next/link";
import { HomeToolIcon } from "@/components/icons/home-tool-icons";
import { HOME_GRID_TOOL_ENTRIES, TOOL_ROUTES } from "@/config/tool-registry";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/config";
import { hrefForLocale } from "@/lib/localized-path";

type Props = { params: Promise<{ locale: string }> };

const cardClassName =
  "group flex gap-3.5 rounded-lg border border-tool-card-border bg-white p-5 text-text shadow-sm no-underline hover:text-text motion-safe:transition-[transform,box-shadow] motion-safe:duration-500 motion-safe:ease-in-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md";

export default async function HomePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return null;
  }
  const locale: Locale = raw;
  const t = await getMessages(locale);
  const textBase64Href = hrefForLocale(locale, TOOL_ROUTES.base64.textEncode);
  const fileBase64Href = hrefForLocale(locale, TOOL_ROUTES.base64.fileEncode);

  return (
    <article className="w-full py-10">
      <header className="mx-auto max-w-5xl overflow-x-auto text-center">
        <h1 className="inline-block whitespace-nowrap font-semibold tracking-tight text-text text-4xl leading-tight sm:text-5xl">
          {t.home.introTitle}
        </h1>
        <p className="mt-2 text-lg text-text-muted leading-relaxed">{t.site.tagline}</p>
      </header>

      <section id="tools" className="mt-8">
        <h2 className="sr-only">{t.home.toolsSectionTitle}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link href={textBase64Href} className={cardClassName}>
            <HomeToolIcon id="base64Text" className="text-text-secondary" />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold tracking-tight text-text">
                {t.home.base64TextCardTitle}
              </h3>
              <p className="mt-1.5 text-sm text-text-secondary leading-snug">
                {t.home.base64TextCardDesc}
              </p>
            </div>
          </Link>
          <Link href={fileBase64Href} className={cardClassName}>
            <HomeToolIcon id="base64File" className="text-text-secondary" />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold tracking-tight text-text">
                {t.home.base64FileCardTitle}
              </h3>
              <p className="mt-1.5 text-sm text-text-secondary leading-snug">
                {t.home.base64FileCardDesc}
              </p>
            </div>
          </Link>
          {HOME_GRID_TOOL_ENTRIES.map(({ rest, key, icon }) => {
            const tc = t.tools[key];
            return (
              <Link
                key={rest}
                href={hrefForLocale(locale, rest)}
                className={cardClassName}
              >
                <HomeToolIcon id={icon} className="text-text-secondary" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold tracking-tight text-text">
                    {tc.pageTitle}
                  </h3>
                  <p className="mt-1.5 text-sm text-text-secondary leading-snug">
                    {tc.pageDescription}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </article>
  );
}
