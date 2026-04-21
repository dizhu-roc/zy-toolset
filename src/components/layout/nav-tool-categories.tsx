"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const CLOSE_DELAY_MS = 140;

type Labels = {
  category: string;
  categoryAria: string;
  workbenchTitle: string;
  workbenchDesc: string;
  /** P1 row — no link */
  soonHex: string;
  soonUrl: string;
  soonBadge: string;
};

type Props = {
  workbenchHref: string;
  labels: Labels;
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

export function NavToolCategories({
  workbenchHref,
  labels,
}: Props) {
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
          "inline-flex cursor-pointer items-center gap-1 rounded-md py-1 pr-1 pl-1 text-text-secondary outline-none",
          "hover:text-text",
          "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={labels.categoryAria}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{labels.category}</span>
        <Chevron className={open ? "rotate-180" : undefined} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={labels.categoryAria}
          className={cn(
            "absolute left-0 top-full z-50 mt-1 min-w-[16rem] rounded-xl border border-border bg-surface-raised py-2 shadow-xl",
            "ring-1 ring-text/8",
          )}
        >
          <Link
            role="menuitem"
            href={workbenchHref}
            className="block px-4 py-2.5 no-underline hover:bg-text/[0.04]"
            onClick={() => {
              clearCloseTimer();
              setOpen(false);
            }}
          >
            <span className="block font-medium text-text">{labels.workbenchTitle}</span>
            <span className="mt-0.5 block text-xs text-text-muted leading-snug">
              {labels.workbenchDesc}
            </span>
          </Link>
          <div
            className="mx-3 my-1 border-t border-border"
            role="separator"
            aria-hidden
          />
          <div
            className="px-4 py-2 text-xs text-text-muted"
            role="menuitem"
            aria-disabled
          >
            <span className="mr-2 inline-block rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
              {labels.soonBadge}
            </span>
            {labels.soonHex}
          </div>
          <div
            className="px-4 py-2 text-xs text-text-muted"
            role="menuitem"
            aria-disabled
          >
            <span className="mr-2 inline-block rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
              {labels.soonBadge}
            </span>
            {labels.soonUrl}
          </div>
        </div>
      ) : null}
    </div>
  );
}
