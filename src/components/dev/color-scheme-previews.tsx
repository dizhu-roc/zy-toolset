/**
 * Dev-only：白色底为主的多套配色预览（固定浅色示意，非生产 token）。
 */
export function ColorSchemePreviews() {
  const schemes = [
    {
      id: "w1",
      title: "方案 W1 · 冷静蓝",
      desc: "白底 + 中性灰文字 + 清晰蓝主色，偏 SaaS 与效率工具风格。",
      canvas: "#ffffff",
      surface: "#ffffff",
      border: "#e5e7eb",
      borderStrong: "#d1d5db",
      text: "#0f172a",
      muted: "#64748b",
      accent: "#2563eb",
      accentMuted: "#dbeafe",
      chip: "白底 · 冷蓝",
    },
    {
      id: "w2",
      title: "方案 W2 · 松石绿",
      desc: "白底基础上用青绿做强调，观感轻快，适合图片/文件类工具。",
      canvas: "#ffffff",
      surface: "#ffffff",
      border: "#dde3ea",
      borderStrong: "#c7d1dd",
      text: "#16324f",
      muted: "#5b7086",
      accent: "#0f766e",
      accentMuted: "#ccfbf1",
      chip: "白底 · 清新绿",
    },
    {
      id: "w3",
      title: "方案 W3 · 石墨灰",
      desc: "白底 + 深灰文本 + 石墨色主按钮，克制沉稳，专业感更强。",
      canvas: "#ffffff",
      surface: "#ffffff",
      border: "#e5e7eb",
      borderStrong: "#cfd5de",
      text: "#111827",
      muted: "#6b7280",
      accent: "#374151",
      accentMuted: "#e5e7eb",
      chip: "白底 · 中性灰",
    },
    {
      id: "w4",
      title: "方案 W4 · 柔紫点缀",
      desc: "大面积白底保持干净，用柔和紫色做功能强调，科技感更轻。",
      canvas: "#ffffff",
      surface: "#ffffff",
      border: "#e6e8ef",
      borderStrong: "#d4d8e4",
      text: "#111827",
      muted: "#6b7288",
      accent: "#8b5cf6",
      accentMuted: "#ede9fe",
      chip: "白底 · 柔紫",
    },
    {
      id: "w5",
      title: "方案 W5 · 琥珀暖调",
      desc: "白底中加入暖琥珀强调色，按钮更有行动感，适合营销向页面。",
      canvas: "#ffffff",
      surface: "#ffffff",
      border: "#ece6d8",
      borderStrong: "#d9d0be",
      text: "#3f3420",
      muted: "#75644a",
      accent: "#d97706",
      accentMuted: "#ffedd5",
      chip: "白底 · 暖琥珀",
    },
    {
      id: "w6",
      title: "方案 W6 · 青蓝专业",
      desc: "偏冷白底 + 青蓝强调，清爽理性，适合数据分析与开发者工具。",
      canvas: "#ffffff",
      surface: "#ffffff",
      border: "#dce6ee",
      borderStrong: "#c5d4df",
      text: "#0b2239",
      muted: "#4f6b84",
      accent: "#0284c7",
      accentMuted: "#e0f2fe",
      chip: "白底 · 青蓝",
    },
  ] as const;

  return (
    <div className="py-6 [color-scheme:light]">
      <h1 className="text-2xl font-semibold text-text">白色底配色方案预览（浅色示意）</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
        以下为六套白底方向的独立示意区块，重点对比主色、边框和文本层级。选定方向后可再映射到{" "}
        <code className="rounded bg-zinc-200/80 px-1 text-xs dark:bg-zinc-700/80">tokens.css</code>{" "}
        里的正式变量。
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2 xl:grid-cols-2">
        {schemes.map((s) => (
          <section
            key={s.id}
            aria-labelledby={`scheme-${s.id}-title`}
            className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200/90 shadow-sm dark:border-zinc-600"
            style={{ backgroundColor: s.canvas }}
          >
            <header className="border-b px-4 py-3" style={{ borderColor: s.border }}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={`scheme-${s.id}-title`} className="text-base font-semibold" style={{ color: s.text }}>
                  {s.title}
                </h2>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: s.accentMuted, color: s.accent }}
                >
                  {s.chip}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: s.muted }}>
                {s.desc}
              </p>
            </header>

            <div className="flex flex-1 flex-col gap-4 p-4">
              <article
                className="rounded-lg border p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                style={{
                  backgroundColor: s.surface,
                  borderColor: s.border,
                }}
              >
                <h3 className="text-sm font-semibold" style={{ color: s.text }}>
                  工具卡片标题
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: s.text }}>
                  这是一段正文示例，用来感受对比度与行距是否舒服。
                </p>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: s.muted }}>
                  次要说明文字 · Secondary line for hints and meta.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: s.border }}>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-[filter] hover:brightness-95 active:brightness-90"
                    style={{ backgroundColor: s.accent }}
                  >
                    主按钮
                  </button>
                  <button
                    type="button"
                    className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      borderColor: s.borderStrong,
                      color: s.text,
                      backgroundColor: s.surface,
                    }}
                  >
                    次要
                  </button>
                  <span
                    className="inline-flex cursor-default items-center text-xs font-medium underline underline-offset-2 select-none"
                    style={{ color: s.accent }}
                  >
                    链接样式
                  </span>
                </div>
              </article>

              <div
                className="rounded-lg border px-3 py-2 text-[11px] font-mono tabular-nums"
                style={{
                  borderColor: s.border,
                  backgroundColor: s.surface,
                  color: s.muted,
                }}
              >
                canvas · surface · accent — 示意块结束
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
