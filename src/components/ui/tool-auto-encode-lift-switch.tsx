"use client";

import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-main-bg dark:focus-visible:ring-offset-main-bg";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
  /** 与标题栏主操作同规范：忙时禁用 */
  disabled?: boolean;
};

/**
 * 自动编码：整体式开关（扁平有边框），与 text-encode 标题栏搭配。
 * 单颗 `role="switch"`，内联轨为装饰（aria-hidden）。
 */
export function ToolAutoEncodeLiftSwitch({
  checked,
  onChange,
  label,
  className,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "shrink-0 cursor-pointer",
        FOCUS,
        "inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-lg border border-zinc-300 bg-transparent px-2.5 py-1.5 text-left text-xs text-text-secondary transition-[background-color,border-color,color,opacity] duration-150",
        checked
          ? "border-[#0284c7]/55 bg-[#e0f2fe] text-[#0369a1] dark:border-[#38bdf8]/55 dark:bg-[#0c4a6e]/35 dark:text-[#7dd3fc]"
          : "dark:border-zinc-600 dark:bg-transparent dark:text-zinc-300",
        "hover:border-zinc-400 hover:bg-zinc-50 hover:text-text dark:hover:border-zinc-500 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      <span className="relative flex h-5 w-9 shrink-0 items-center rounded-full p-px" aria-hidden>
        <span
          className={cn(
            "flex h-full w-full items-center rounded-full p-px transition-colors",
            checked ? "bg-[#0284c7] dark:bg-[#38bdf8]" : "bg-zinc-300 dark:bg-zinc-600",
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

/** 供 text-encode / text-decode 主操作按钮与 Auto 开关同系略浅主色。 */
export const toolTextEncodeSoftPrimaryClass = cn(
  "bg-[#6b7280] shadow-[0_4px_12px_rgba(55,65,81,0.24),0_1px_2px_rgba(0,0,0,0.04)]",
  "hover:bg-[#4b5563] hover:shadow-none",
  "active:translate-y-0 active:shadow-none",
);

export const toolBase64SoftPrimaryClass = toolTextEncodeSoftPrimaryClass;

/** 与 Encode/Decode 页 Auto 开关同组件，供命名区分。 */
export { ToolAutoEncodeLiftSwitch as ToolBarAutoLiftSwitch };
