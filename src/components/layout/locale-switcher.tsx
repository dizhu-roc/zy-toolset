"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { localeLabels, locales, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/dictionaries";
import { hrefForLocale, parsePublicPathname } from "@/lib/localized-path";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  labels: Messages["locale"];
};

const TRIGGER_ID = "locale-menu-trigger";
const LIST_ID = "locale-menu-list";
const CLOSE_DELAY_MS = 140;

function Globe({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-[1.125rem] w-[1.125rem] shrink-0 opacity-95", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a14.5 14.5 0 0 1 0 20M12 2a14.5 14.5 0 0 0 0 20" />
    </svg>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-3.5 w-3.5 shrink-0 opacity-90 transition-transform duration-200", className)}
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

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4 shrink-0 text-text", className)}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function LocaleSwitcher({ locale, labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sortedLocales = [...locales].sort((a, b) =>
    localeLabels[a].localeCompare(localeLabels[b], "en"),
  );
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const { rest } = parsePublicPathname(pathname);

  const navigate = useCallback(
    (next: Locale) => {
      if (next === locale) {
        setOpen(false);
        return;
      }
      const href = hrefForLocale(next, rest);
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
      setOpen(false);
      clearCloseTimer();
      triggerRef.current?.focus();
    },
    [clearCloseTimer, locale, rest, router],
  );

  useEffect(() => {
    setOpen(false);
    clearCloseTimer();
  }, [clearCloseTimer, pathname]);

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
      className="relative flex items-center"
      onMouseEnter={() => {
        clearCloseTimer();
        if (!pending) setOpen(true);
      }}
      onMouseLeave={() => {
        scheduleClose();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        id={TRIGGER_ID}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={LIST_ID}
        aria-label={labels.label}
        onClick={() => {
          if (pending) return;
          setOpen((v) => !v);
        }}
        className={cn(
          "grid w-max min-w-0 max-w-[8.75rem] grid-cols-[auto_1fr_auto] items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-normal",
          "border border-accent/55 bg-surface text-text outline-none",
          "transition-[border-color]",
          open && "border-accent",
          "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "disabled:cursor-wait disabled:opacity-55",
        )}
      >
        <Globe />
        <span className="min-w-0 truncate text-center text-[13px] leading-tight">
          {localeLabels[locale]}
        </span>
        <Chevron className={open ? "rotate-180" : undefined} />
      </button>

      {open ? (
        <div
          id={LIST_ID}
          role="listbox"
          aria-labelledby={TRIGGER_ID}
          className={cn(
            "absolute right-0 top-full z-50 mt-1 w-[min(calc(100vw-1.5rem),28rem)] rounded-2xl bg-surface-raised p-5 shadow-xl",
            "ring-1 ring-text/8",
          )}
        >
          <div
            role="presentation"
            className="grid grid-cols-3 gap-x-8 gap-y-0.5 sm:gap-x-10"
          >
            {sortedLocales.map((l) => {
              const selected = l === locale;
              return (
                <button
                  key={l}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex items-center gap-2 rounded-md py-2.5 pl-1 pr-2 text-left text-sm font-normal text-text transition-colors",
                    "hover:bg-text/[0.04]",
                    selected && "text-accent",
                  )}
                  onClick={() => navigate(l)}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {selected ? <Check /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{localeLabels[l]}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
