"use client";

import { cn } from "@/lib/utils";

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
        "inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 px-2.5 py-1.5 text-left text-xs text-text-secondary transition-all dark:border-zinc-600 dark:bg-zinc-800/20",
        checked
          ? "translate-y-[-1px] border-zinc-200/90 bg-white text-text shadow-[0_4px_12px_rgba(21,118,187,0.12),0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-500/80 dark:bg-zinc-800/50 dark:shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
          : "shadow-none",
        className,
      )}
    >
      <span className="relative flex h-5 w-9 shrink-0 items-center rounded-full p-px" aria-hidden>
        <span
          className={cn(
            "flex h-full w-full items-center rounded-full p-px transition-colors",
            checked ? "bg-[#1576BB]" : "bg-zinc-300 dark:bg-zinc-600",
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
