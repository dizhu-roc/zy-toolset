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
import { TextFileUploadButton } from "@/components/tools/base64/text-file-upload-button";
import { ToolAutoEncodeLiftSwitch } from "@/components/ui/tool-auto-encode-lift-switch";
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

function encodeDebounceMs(textLen: number): number {
  if (textLen > 400_000) return 700;
  if (textLen > 80_000) return 400;
  if (textLen > 5_000) return 200;
  return 120;
}

/** `base64encode-YYYYMMDDHHmmss.txt`（本地时间） */
function buildBase64DownloadFilename(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `base64encode-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.txt`;
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
      <path d="M4 12h14" strokeWidth={2} strokeLinecap="round" />
      <path d="m13 7 5 5-5 5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
                "border-zinc-200/95 bg-white py-0.5 shadow-lg ring-1 ring-zinc-950/5",
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
                        ? "bg-zinc-100 font-medium text-text dark:bg-zinc-700/80 dark:text-zinc-50"
                        : "text-text-secondary hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700/50",
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
  const [autoEncode, setAutoEncode] = useState(true);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const inputRef = useRef(input);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const prevInputRef = useRef(input);
  const autoEncodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  inputRef.current = input;

  useEffect(() => {
    if (!autoEncode) {
      if (autoEncodeTimerRef.current) {
        clearTimeout(autoEncodeTimerRef.current);
        autoEncodeTimerRef.current = null;
      }
      if (!input) setOutput("");
      prevInputRef.current = input;
      return;
    }

    const inputChanged = prevInputRef.current !== input;
    prevInputRef.current = input;

    if (inputChanged) {
      if (autoEncodeTimerRef.current) {
        clearTimeout(autoEncodeTimerRef.current);
        autoEncodeTimerRef.current = null;
      }
      const delay = encodeDebounceMs(input.length);
      autoEncodeTimerRef.current = setTimeout(() => {
        autoEncodeTimerRef.current = null;
        setOutput(encodeOutput(input, outputMode));
      }, delay);
    } else {
      if (autoEncodeTimerRef.current) {
        clearTimeout(autoEncodeTimerRef.current);
        autoEncodeTimerRef.current = null;
      }
      setOutput(encodeOutput(input, outputMode));
    }

    return () => {
      if (autoEncodeTimerRef.current) {
        clearTimeout(autoEncodeTimerRef.current);
        autoEncodeTimerRef.current = null;
      }
    };
  }, [input, outputMode, autoEncode]);

  useEffect(() => {
    if (autoEncode) return;
    const text = inputRef.current;
    setOutput(encodeOutput(text, outputMode));
  }, [outputMode, autoEncode]);

  const runEncode = () => {
    setOutput(encodeOutput(input, outputMode));
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setCopyHint(null);
    setUploadHint(null);
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

  const encodeDisabled = input.trim() === "";
  const colClass = cn(toolColumnCardClass, EDITOR_PANEL_HEIGHT_CLASS);

  return (
    <div className="grid grid-cols-2 gap-5">
      <section className={colClass} aria-labelledby={inputId}>
        <div className={toolSectionTitleBarClass}>
          <h2 id={inputId} className={toolSectionHeadingClass}>
            <IconColumnSourceText className={toolSectionHeadingIconClass} />
            <span className="min-w-0 truncate">{copy.inputColumnTitle}</span>
          </h2>
          <div className={cn(toolSectionTitleActionsClass, "gap-x-2 gap-y-2")}>
            <TextFileUploadButton
              label={copy.uploadTextFile}
              title={copy.uploadTextFileTooltip}
              onTextLoaded={(text) => {
                setInput(text);
                setUploadHint(null);
              }}
              onInvalid={() => {
                setUploadHint(copy.uploadFileRejectNotText);
                window.setTimeout(() => setUploadHint(null), 5000);
              }}
            />
            <ToolAutoEncodeLiftSwitch
              checked={autoEncode}
              onChange={setAutoEncode}
              label={copy.autoEncode}
            />
            <ToolTitleBarTextButton
              variant="primary"
              disabled={encodeDisabled}
              icon={<IconEncode className="opacity-95" />}
              onClick={runEncode}
            >
              {copy.generate}
            </ToolTitleBarTextButton>
            <ToolTitleBarTextButton
              variant="outline"
              icon={<IconTrash />}
              onClick={clearAll}
            >
              {copy.clearAll}
            </ToolTitleBarTextButton>
          </div>
        </div>
        {uploadHint ? (
          <p
            className="border-b border-red-200 bg-red-50 px-4 py-1.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {uploadHint}
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900">
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
              disabled={!output}
              icon={<IconArrowDownTray />}
              onClick={saveAs}
            >
              {copy.saveAs}
            </ToolTitleBarTextButton>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900">
          <div className="flex min-h-0 flex-1 flex-col">
            <LineNumberedField
              value={output}
              readOnly
              showGutter={false}
              placeholder={copy.outputPlaceholder}
              ariaLabel={copy.outputColumnTitle}
              className="bg-zinc-100 dark:bg-zinc-900"
              textClassName="text-sm leading-6"
              textareaRef={outputTextareaRef}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
