type Props = {
  title: string;
  lead: string;
  paragraphs: string[];
};

/** 隐私 / 条款 / Cookie 等合规类文章的统一排版（Server） */
export function LegalArticle({ title, lead, paragraphs }: Props) {
  return (
    <article className="mx-auto w-full max-w-prose py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-[1.75rem] sm:leading-snug">
        {title}
      </h1>
      <p className="mt-6 text-base text-text-secondary leading-relaxed">{lead}</p>
      <div className="mt-8 space-y-4 text-text-secondary leading-relaxed">
        {paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </article>
  );
}
