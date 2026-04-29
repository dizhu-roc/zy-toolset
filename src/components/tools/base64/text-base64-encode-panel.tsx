"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64, bytesToBase64Url, utf8TextToBytes } from "@/lib/base64";
import { cn } from "@/lib/utils";
import {
  IconColumnBase64Text,
  IconColumnSourceText,
} from "@/components/tools/base64/base64-text-column-icons";
import { LineNumberedField } from "@/components/tools/base64/line-numbered-field";
import { ToolTitleBarTextButton } from "@/components/ui/tool-title-bar-text-button";
import {
  copyResultBubbleClassName,
  toolColumnCardClass,
  toolSectionHeadingClass,
  toolSectionHeadingIconClass,
  toolSectionTitleActionsClass,
  toolSectionTitleBarClass,
} from "@/lib/ui/tool-surface";

/** 桌面专用：左右卡片固定总高，正文在 textarea 内滚动 */
const EDITOR_PANEL_HEIGHT_CLASS = "h-[34rem]";

/** `text-base64-uuid前8位.txt` */
function buildBase64DownloadFilename(): string {
  const shortId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(16).slice(2, 10).padEnd(8, "0");
  return `text-base64-${shortId}.txt`;
}

type Copy = Messages["tools"]["base64TextEncode"];

const OUTPUT_MODES = ["standard", "base64url", "dataUrl"] as const;
type TextBase64OutputMode = (typeof OUTPUT_MODES)[number];

function encodeOutput(text: string, mode: TextBase64OutputMode): string {
  if (!text) return "";
  const bytes = utf8TextToBytes(text);
  if (mode === "dataUrl") {
    return `data:text/plain;charset=utf-8;base64,${bytesToBase64(bytes)}`;
  }
  if (mode === "base64url") {
    return bytesToBase64Url(bytes);
  }
  return bytesToBase64(bytes);
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function IconArrowDownTray({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function IconEncode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="m9 8-4 4 4 4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="m15 8 4 4-4 4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 6 10 18" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function OutputFormatMenu({
  value,
  onChange,
  copy,
}: {
  value: TextBase64OutputMode;
  onChange: (m: TextBase64OutputMode) => void;
  copy: Copy;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const [place, setPlace] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const options: { id: TextBase64OutputMode; label: string }[] = [
    { id: "standard", label: copy.formatPlain },
    { id: "base64url", label: copy.formatBase64Url },
    { id: "dataUrl", label: copy.formatDataUrl },
  ];
  const currentLabel = options.find((o) => o.id === value)?.label ?? value;

  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setPlace({
        top: r.bottom + 2,
        right: globalThis.innerWidth - r.right,
      });
    };
    update();
    globalThis.addEventListener("scroll", update, true);
    globalThis.addEventListener("resize", update);
    return () => {
      globalThis.removeEventListener("scroll", update, true);
      globalThis.removeEventListener("resize", update);
    };
  }, [open]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      clearCloseTimer();
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearCloseTimer();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const touchOrNoHoverToggle = () => {
    if (globalThis.matchMedia("(hover: none)").matches) {
      setOpen((o) => !o);
    }
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "inline-flex min-w-0 max-w-full cursor-pointer items-center gap-0.5 rounded-sm border-0 bg-transparent py-1 pl-0 pr-0.5 text-xs font-medium",
          "text-text-secondary shadow-none ring-0 outline-none",
          "hover:text-text",
          "dark:text-zinc-400 dark:hover:text-zinc-100",
          "focus-visible:ring-2 focus-visible:ring-accent/25",
        )}
        aria-label={copy.outputFormatLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onMouseEnter={() => {
          clearCloseTimer();
          setOpen(true);
        }}
        onMouseLeave={scheduleClose}
        onClick={touchOrNoHoverToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span className="min-w-0 truncate">{currentLabel}</span>
        <IconChevronDown
          className={cn("size-3.5 shrink-0 opacity-80 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && place
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              className={cn(
                "fixed z-[200] w-max min-w-0 max-w-[min(11rem,calc(100vw-1.5rem))] rounded-lg border",
                "border-[#d1d5db] bg-white py-0.5 shadow-lg ring-1 ring-[#111827]/8",
                "dark:border-zinc-600 dark:bg-zinc-800 dark:ring-zinc-950/40",
              )}
              style={{ top: place.top, right: place.right }}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
            >
              {options.map((o) => {
                const selected = value === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      "flex w-full cursor-pointer items-center whitespace-nowrap px-2 py-1.5 text-left text-xs",
                      selected
                        ? "bg-[#e5e7eb] font-medium text-[#111827] dark:bg-zinc-700/80 dark:text-zinc-50"
                        : "text-text-secondary hover:bg-[#f3f4f6] dark:text-zinc-300 dark:hover:bg-zinc-700/50",
                    )}
                    onClick={() => {
                      clearCloseTimer();
                      onChange(o.id);
                      setOpen(false);
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export function TextBase64EncodePanel({ copy }: { copy: Copy }) {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputMode, setOutputMode] = useState<TextBase64OutputMode>("standard");
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  /** 在输出列展示的「空内容点 Encode」提示，非气泡 */
  const [outputEncodeEmptyHint, setOutputEncodeEmptyHint] = useState<string | null>(null);

  useEffect(() => {
    if (input.trim() !== "") {
      setOutputEncodeEmptyHint(null);
    }
  }, [input]);

  // 保持手动编码模式：仅在切换输出格式时，基于当前输入自动刷新输出。
  useEffect(() => {
    if (!input.trim()) return;
    setOutput(encodeOutput(input, outputMode));
  }, [outputMode]);

  const runEncode = () => {
    setOutput(encodeOutput(input, outputMode));
  };

  const onEncodeButtonClick = () => {
    if (input.trim() === "") {
      setOutputEncodeEmptyHint(copy.encodeEmptyHint);
      return;
    }
    setOutputEncodeEmptyHint(null);
    runEncode();
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setCopyHint(null);
    setOutputEncodeEmptyHint(null);
  };

  const copyOutput = async () => {
    if (!output) return;
    outputTextareaRef.current?.focus();
    outputTextareaRef.current?.select();
    try {
      await navigator.clipboard.writeText(output);
      setCopyHint(copy.copied);
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint(copy.copyFailed);
      window.setTimeout(() => setCopyHint(null), 2500);
    }
  };

  const saveAs = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildBase64DownloadFilename();
    a.click();
    URL.revokeObjectURL(url);
  };

  const colClass = cn(toolColumnCardClass, EDITOR_PANEL_HEIGHT_CLASS);
  const bluePrimaryFlatClass = cn(
    "translate-y-0 shadow-none border border-[#0369a1] bg-[#0284c7] text-white",
    "hover:border-[#075985] hover:bg-[#0369a1] hover:text-white hover:shadow-none",
    "dark:border-[#0ea5e9] dark:bg-[#0284c7] dark:text-white",
    "dark:hover:border-[#38bdf8] dark:hover:bg-[#0369a1] dark:hover:text-white",
  );
  const neutralFlatClass = cn(
    "translate-y-0 shadow-none border border-[#0369a1] bg-[#0284c7] text-white",
    "hover:border-[#075985] hover:bg-[#0369a1] hover:text-white hover:shadow-none",
    "dark:border-[#0ea5e9] dark:bg-[#0284c7] dark:text-white",
    "dark:hover:border-[#38bdf8] dark:hover:bg-[#0369a1] dark:hover:text-white",
  );
  const titleBarButtonTextClass =
    "h-7 px-2 text-xs font-bold uppercase [&>span:first-child>svg]:size-4";
  const dangerFlatClass = cn(
    "translate-y-0 shadow-none border border-[#b91c1c] bg-[#dc2626] text-white",
    "hover:border-[#991b1b] hover:bg-[#b91c1c] hover:text-white hover:shadow-none",
    "dark:border-[#ef4444] dark:bg-[#dc2626] dark:text-white",
    "dark:hover:border-[#f87171] dark:hover:bg-[#b91c1c] dark:hover:text-white",
  );
  const successFlatClass = cn(
    "translate-y-0 shadow-none border border-[#15803d] bg-[#16a34a] text-white",
    "hover:border-[#166534] hover:bg-[#15803d] hover:text-white hover:shadow-none",
    "dark:border-[#4ade80] dark:bg-[#16a34a] dark:text-white",
    "dark:hover:border-[#86efac] dark:hover:bg-[#15803d] dark:hover:text-white",
  );
  const saveFlatClass = cn(
    "translate-y-0 shadow-none border border-[#5b21b6] bg-[#7c3aed] text-white",
    "hover:border-[#4c1d95] hover:bg-[#6d28d9] hover:text-white hover:shadow-none",
    "dark:border-[#a78bfa] dark:bg-[#7c3aed] dark:text-white",
    "dark:hover:border-[#c4b5fd] dark:hover:bg-[#6d28d9] dark:hover:text-white",
  );

  return (
    <div className="grid grid-cols-2 gap-5">
      <section className={colClass} aria-labelledby={inputId}>
        <div className={toolSectionTitleBarClass}>
          <h2 id={inputId} className={toolSectionHeadingClass}>
            <IconColumnSourceText className={toolSectionHeadingIconClass} />
            <span className="min-w-0 truncate">{copy.inputColumnTitle}</span>
          </h2>
          <div className={cn(toolSectionTitleActionsClass, "gap-x-2 gap-y-2")}>
            <ToolTitleBarTextButton
              variant="primary"
              className={cn(bluePrimaryFlatClass, titleBarButtonTextClass, "disabled:opacity-45")}
              icon={<IconEncode className="opacity-95" />}
              onClick={onEncodeButtonClick}
            >
              {copy.generate}
            </ToolTitleBarTextButton>
            <ToolTitleBarTextButton
              variant="outline"
              className={cn(dangerFlatClass, titleBarButtonTextClass)}
              icon={<IconTrash />}
              onClick={clearAll}
            >
              {copy.clearAll}
            </ToolTitleBarTextButton>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-[#f3f4f6] dark:bg-zinc-900">
          <div className="flex min-h-0 flex-1 flex-col">
            <LineNumberedField
              value={input}
              onChange={setInput}
              placeholder={copy.inputPlaceholder}
              ariaLabel={copy.inputColumnTitle}
              textClassName="text-sm leading-6"
            />
          </div>
        </div>
      </section>

      <section className={colClass} aria-labelledby={outputId}>
        <div className={toolSectionTitleBarClass}>
          <h2 id={outputId} className={toolSectionHeadingClass}>
            <IconColumnBase64Text className={toolSectionHeadingIconClass} />
            <span className="min-w-0 truncate">{copy.outputColumnTitle}</span>
          </h2>
          <div className={toolSectionTitleActionsClass}>
            <OutputFormatMenu
              value={outputMode}
              onChange={setOutputMode}
              copy={copy}
            />
            <div className="relative inline-flex">
              <ToolTitleBarTextButton
                variant="outline"
                className={cn(successFlatClass, titleBarButtonTextClass)}
                disabled={!output}
                icon={<IconClipboard />}
                onClick={copyOutput}
              >
                {copy.copyOutput}
              </ToolTitleBarTextButton>
              {copyHint ? (
                <span
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "pointer-events-none absolute top-full left-1/2 z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium shadow-md ring-1",
                    copyResultBubbleClassName(copyHint === copy.copied),
                  )}
                >
                  {copyHint}
                </span>
              ) : null}
            </div>
            <ToolTitleBarTextButton
              variant="outline"
              className={cn(saveFlatClass, titleBarButtonTextClass)}
              disabled={!output}
              icon={<IconArrowDownTray />}
              onClick={saveAs}
            >
              {copy.saveAs}
            </ToolTitleBarTextButton>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900">
          {outputEncodeEmptyHint ? (
            <p
              className="m-0 shrink-0 border-b border-red-200/90 bg-red-50/60 px-4 py-2.5 text-base font-medium leading-snug text-red-700 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-300"
              role="alert"
              aria-live="polite"
            >
              {outputEncodeEmptyHint}
            </p>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col">
            <LineNumberedField
              value={output}
              readOnly
              showGutter={false}
              placeholder={copy.outputPlaceholder}
              ariaLabel={copy.outputColumnTitle}
              className="bg-[#f3f4f6] dark:bg-zinc-900"
              textClassName="text-sm leading-6"
              textareaRef={outputTextareaRef}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
