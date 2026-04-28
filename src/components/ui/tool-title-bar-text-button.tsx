"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  toolChromeTitleBarOutlineButtonClass,
  toolChromeTitleBarPrimaryButtonClass,
} from "@/lib/ui/tool-surface";
import { cn } from "@/lib/utils";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  /** 主色或线框 */
  variant?: "primary" | "outline";
  /** 左侧图标（建议 14–16px SVG） */
  icon: ReactNode;
  /** 可见标题文案 */
  children: ReactNode;
};

/**
 * 标题栏内操作按钮：固定高度、图标 + 文案，与 {@link toolSectionTitleBarClass} 搭配。
 */
export function ToolTitleBarTextButton({
  variant = "outline",
  icon,
  children,
  className,
  type = "button",
  ...rest
}: Props) {
  const base =
    variant === "primary"
      ? toolChromeTitleBarPrimaryButtonClass
      : toolChromeTitleBarOutlineButtonClass;
  return (
    <button type={type} className={cn(base, className)} {...rest}>
      <span className="flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-3.5">
        {icon}
      </span>
      <span className="min-w-0 max-w-[10rem] truncate sm:max-w-[12rem]">{children}</span>
    </button>
  );
}
