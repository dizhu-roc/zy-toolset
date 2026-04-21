import { cn } from "@/lib/utils";

type Props = {
  /** 页内 H1，可为字符串或由调用方传入已翻译节点 */
  title: React.ReactNode;
  /** 标题下说明，可选 */
  description?: React.ReactNode;
  /** 主工作区：可为 Server 内容或内嵌 Client 子树 */
  children: React.ReactNode;
  /** 标题区下方、主工作区之上的可选区域（如工具级提示） */
  intro?: React.ReactNode;
  /** 主工作区下方：如链向全站隐私页的说明 */
  ancillary?: React.ReactNode;
  className?: string;
};

/**
 * 工具页通用壳层（Server Component）。
 * 与 `SiteShell` 的 `main` 同宽：依赖父级 `max-w-content`，此处 `w-full` 铺满内容列。
 */
export function ToolPageLayout({
  title,
  description,
  children,
  intro,
  ancillary,
  className,
}: Props) {
  return (
    <article
      className={cn("w-full py-10", className)}
      aria-labelledby="tool-page-title"
    >
      <header className="border-b border-border pb-8">
        <h1
          id="tool-page-title"
          className="text-2xl font-semibold tracking-tight text-text sm:text-[1.75rem] sm:leading-snug"
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-prose text-base text-text-secondary leading-relaxed">
            {description}
          </p>
        ) : null}
      </header>

      {intro ? <div className="mt-6 max-w-prose">{intro}</div> : null}

      <div className={intro ? "mt-6" : "mt-8"}>{children}</div>

      {ancillary ? (
        <div className="mt-12 border-t border-border pt-8 text-sm text-text-muted">
          {ancillary}
        </div>
      ) : null}
    </article>
  );
}
