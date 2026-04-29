"use client";

import { cn } from "@/lib/utils";

/** 文本工具栏：略浅于全站主色 #1576BB，与 text-encode Encode 主按钮同系。 */
const SOFT = {
  track: "bg-[#3a9ad8]",
  /** 开启时容器阴影（品牌色光晕，略轻） */
  ringShadow:
    "shadow-[0_4px_12px_rgba(58,154,216,0.14),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_14px_rgba(58,154,216,0.12),0_1px_2px_rgba(0,0,0,0.2)]",
  /** 关闭态：与标题栏线框按钮同系的中性抬起阴影 */
  offLiftShadow:
    "shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[0_3px_10px_rgba(0,0,0,0.32)]",
} as const;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-main-bg dark:focus-visible:ring-offset-main-bg";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
};

/**
 * 自动编码：整体式开关（创 6 · 抬起阴影），与 text-encode 标题栏搭配。
 * 单颗 `role="switch"`，内联轨为装饰（aria-hidden）。
 */
export function ToolAutoEncodeLiftSwitch({ checked, onChange, label, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "shrink-0 cursor-pointer",
        FOCUS,
        "inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 px-2.5 py-1.5 text-left text-xs text-text-secondary transition-[transform,box-shadow,background-color,border-color,color] duration-150 dark:border-zinc-600 dark:bg-zinc-800/20",
        "translate-y-[-1px]",
        checked
          ? cn(
              "border-zinc-200/90 bg-white text-text",
              SOFT.ringShadow,
              "dark:border-zinc-500/80 dark:bg-zinc-800/50",
            )
          : SOFT.offLiftShadow,
        "hover:translate-y-0 hover:shadow-none hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
        "dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        "active:translate-y-0 active:shadow-none",
        className,
      )}
    >
      <span className="relative flex h-5 w-9 shrink-0 items-center rounded-full p-px" aria-hidden>
        <span
          className={cn(
            "flex h-full w-full items-center rounded-full p-px transition-colors",
            checked ? SOFT.track : "bg-zinc-300 dark:bg-zinc-600",
          )}
        >
          <span
            className={cn(
              "h-3.5 w-3.5 rounded-full bg-white shadow",
              checked ? "ml-auto" : "ml-0",
            )}
          />
        </span>
      </span>
      <span className="min-w-0 max-w-[10rem] select-none truncate leading-snug text-inherit sm:max-w-[12rem]">
        {label}
      </span>
    </button>
  );
}

/** 供同页 Encode 主按钮与 Auto 色系统一（Tailwind 任意值字符串片段）。 */
export const toolTextEncodeSoftPrimaryClass = cn(
  "bg-[#3a9ad8] shadow-[0_4px_12px_rgba(58,154,216,0.2),0_1px_2px_rgba(0,0,0,0.04)]",
  "hover:bg-[#2d8ec8] hover:shadow-none",
  "active:translate-y-0 active:shadow-none",
);
