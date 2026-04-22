"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  HomeToolIcon,
  type HomeToolIconId,
} from "@/components/icons/home-tool-icons";
import { cn } from "@/lib/utils";

const CLOSE_DELAY_MS = 140;

const MENU_ICON_CLASS = "size-[1.125rem] shrink-0 text-text-secondary";

export type NavCategoryMenuItem = {
  href: string;
  title: string;
  icon: HomeToolIconId;
};

type Props = {
  category: string;
  categoryAria: string;
  items: NavCategoryMenuItem[];
};

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0 opacity-90", className)}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function NavCategoryMenu({ category, categoryAria, items }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuId = useId();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current != null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        clearCloseTimer();
        setOpen(false);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        clearCloseTimer();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [clearCloseTimer, open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={() => {
        scheduleClose();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 rounded-md py-1 pr-1 pl-1 font-semibold text-text outline-none",
          "hover:opacity-85",
          "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={categoryAria}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{category}</span>
        <Chevron className={open ? "rotate-180" : undefined} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={categoryAria}
          className={cn(
            "absolute left-0 top-full z-50 mt-1 min-w-[16rem] rounded-xl border border-border bg-surface-raised py-2 shadow-xl",
            "ring-1 ring-text/8",
          )}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              role="menuitem"
              href={item.href}
              className="flex items-center gap-2.5 px-4 py-2 font-normal text-text no-underline hover:bg-text/[0.04]"
              onClick={() => {
                clearCloseTimer();
                setOpen(false);
              }}
            >
              <HomeToolIcon id={item.icon} className={MENU_ICON_CLASS} />
              <span className="min-w-0">{item.title}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
