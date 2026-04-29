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

/**
 * 工具区块标题栏（列顶）：统一高度、背景与底边分割。
 * 标题文字请配合 {@link toolSectionHeadingClass}。
 */
export const toolSectionTitleBarClass = cn(
  "flex min-h-[2.75rem] shrink-0 flex-wrap items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-3 py-2 sm:px-4",
  "dark:border-zinc-600 dark:bg-zinc-800/95",
);

/** 标题栏内主标题（H2/H3）：字号与色值统一 */
export const toolSectionHeadingClass =
  "flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold leading-snug text-text";

/** 无列图标时的单行标题（ICO 预览栏、文件信息条等） */
export const toolSectionBarTitlePlainClass =
  "m-0 min-w-0 text-sm font-semibold leading-snug text-text";

/** 标题栏标题左侧图标 */
export const toolSectionHeadingIconClass = "size-4 shrink-0 text-text-secondary";

/** 标题栏右侧操作按钮组容器（勿 shrink，避免主标题 flex-1 把按钮挤到裁切） */
export const toolSectionTitleActionsClass =
  "ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2";

/** @deprecated 使用 {@link toolSectionTitleBarClass} */
export const toolTitleBarClass = toolSectionTitleBarClass;

/** 标题栏内：主按钮（蓝底 #1576BB，图标 + 文案，固定栏高）。默认微抬+浅阴影，悬停归位贴栏。 */
export const toolChromeTitleBarPrimaryButtonClass = cn(
  "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-white",
  "transition-[transform,box-shadow,background-color,opacity] duration-150",
  "translate-y-[-1px] bg-[#1576BB] shadow-[0_4px_12px_rgba(21,118,187,0.22),0_1px_2px_rgba(0,0,0,0.06)]",
  "hover:translate-y-0 hover:shadow-none hover:bg-[#125d99]",
  "active:translate-y-0 active:shadow-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none disabled:opacity-45 disabled:hover:bg-[#1576BB]",
);

/** 标题栏内：线框按钮（图标 + 文案，与主按钮同高）。默认微抬+中性阴影，悬停归位贴栏。 */
export const toolChromeTitleBarOutlineButtonClass = cn(
  "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-text-secondary",
  "transition-[transform,box-shadow,background-color,border-color,color,opacity] duration-150",
  "translate-y-[-1px] shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
  "dark:shadow-[0_3px_10px_rgba(0,0,0,0.32)]",
  "hover:translate-y-0 hover:shadow-none hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
  "active:translate-y-0 active:shadow-none",
  "dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none disabled:opacity-40",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
);

/** @deprecated 使用 {@link toolChromeTitleBarPrimaryButtonClass} */
export const toolPrimaryToolbarButtonClass = toolChromeTitleBarPrimaryButtonClass;

/** @deprecated 使用 {@link toolChromeTitleBarOutlineButtonClass} */
export const toolSecondaryToolbarButtonClass = toolChromeTitleBarOutlineButtonClass;

/** 独立大块区域：主按钮（图标 + 文案，min-h-10） */
export const toolChromeStandalonePrimaryButtonClass = cn(
  "inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors sm:w-auto",
  "bg-[#1576BB] hover:bg-[#125d99] active:bg-[#0f4a6a]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#1576BB]",
);

/** 独立大块区域：次要按钮（图标 + 文案） */
export const toolChromeStandaloneSecondaryButtonClass = cn(
  "inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-200 bg-transparent px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors sm:w-auto",
  "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
  "dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
);

/** 主操作按钮（仅样式基类；全宽下载等可与独立类组合） */
export const toolPrimaryButtonClass = cn(
  "inline-flex items-center justify-center font-medium text-white transition-colors",
  "bg-[#1576BB] hover:bg-[#125d99] active:bg-[#0f4a6a]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#1576BB]",
);

/** 工具页 Hero 内交叉链接（encode ↔ decode） */
export const toolPageCrossLinkClass = cn(
  "font-medium text-[#1576BB] underline decoration-[#1576BB]/35 underline-offset-2 hover:decoration-[#1576BB]",
);

export const toolCheckboxClass =
  "size-3.5 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600";

/** range 控件与主色一致 */
export const toolRangeInputClass = "min-w-0 flex-1 accent-[#1576BB]";

/**
 * 复制结果浮动提示（成功 / 失败）的背景与 ring，与密码工具内联气泡一致。
 * 与按钮 `relative` 容器搭配：`absolute left-1/2 top-full -translate-x-1/2 mt-1.5 …`
 */
export function copyResultBubbleClassName(success: boolean) {
  return success
    ? "bg-zinc-800 text-white ring-zinc-600/40 dark:bg-zinc-600 dark:ring-zinc-500/40"
    : "bg-red-700 text-white ring-red-600/50";
}
