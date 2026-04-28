import { cn } from "@/lib/utils";

/**
 * 多数字段/工具面板共用的「产品主色」与壳层 class，与 Base64/ICO/密码等工具对齐。
 * 集中维护可减少硬编码 hex 散落、方便后续换肤或接入 design token。
 */
export const toolBrandHex = {
  primary: "#1576BB",
  primaryHover: "#125d99",
  activePress: "#0f4a6a",
} as const;

/** 白底工具卡片外框（与顶栏 shadow 一致） */
export const toolCardSurfaceClass = cn(
  "rounded-lg border border-zinc-200/90 bg-white shadow-sm",
  "dark:border-zinc-700/90 dark:bg-zinc-900",
);

/** 左右分栏中的列卡片：带 flex 与 overflow 隐藏 */
export const toolColumnCardClass = cn(
  "flex flex-col overflow-hidden",
  toolCardSurfaceClass,
);

/** 占满网格单元时的列卡片（文件 Base64 等） */
export const toolColumnCardFullBleedClass = cn(
  "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden",
  toolCardSurfaceClass,
);

/** 列顶栏（标题行） */
export const toolTitleBarClass =
  "flex flex-wrap items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-3 py-2 sm:px-4 dark:border-zinc-600 dark:bg-zinc-800/95";

/** 主操作按钮（全宽或大块） */
export const toolPrimaryButtonClass = cn(
  "inline-flex items-center justify-center font-medium text-white transition-colors",
  "bg-[#1576BB] hover:bg-[#125d99] active:bg-[#0f4a6a]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#1576BB]",
);

/** 工具条内小颗主按钮（高度由调用方用 `h-7` 或与 `px-3 py-1.5` 等组合指定） */
export const toolPrimaryToolbarButtonClass = cn(
  "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-white transition-colors",
  "bg-[#1576BB] hover:bg-[#125d99]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#1576BB]",
);

export const toolSecondaryToolbarButtonClass = cn(
  "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-text-secondary transition-colors",
  "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
  "dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
);

/** 工具页 Hero 内交叉链接（encode ↔ decode） */
export const toolPageCrossLinkClass = cn(
  "font-medium text-[#1576BB] underline decoration-[#1576BB]/35 underline-offset-2 hover:decoration-[#1576BB]",
);

export const toolCheckboxClass =
  "size-3.5 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600";

/** range 控件与主色一致 */
export const toolRangeInputClass = "min-w-0 flex-1 accent-[#1576BB]";
