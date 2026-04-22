"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64, utf8TextToBytes } from "@/lib/base64";
import { cn } from "@/lib/utils";

const MAX_CHARS = 100_000;

/** 与行号列一致，避免滚动不同步 */
const EDITOR_LINE = "text-[13px] leading-[1.5rem]";

type Copy = Messages["tools"]["base64TextEncode"];

function encodeOutput(text: string, dataUrl: boolean): string {
  if (!text) return "";
  const b64 = bytesToBase64(utf8TextToBytes(text));
  return dataUrl
    ? `data:text/plain;charset=utf-8;base64,${b64}`
    : b64;
}

/**
 * 按与 textarea 相同的可视宽度与字体，测量 soft-wrap 后的行数（用于行号 gutter）。
 * 空内容固定为 1 行，避免在很高 min-height 的 flex 里用 scrollHeight 误判出多行「空行号」。
 */
function measureWrappedLineCount(text: string, sample: HTMLTextAreaElement): number {
  if (text === "") return 1;

  const cs = getComputedStyle(sample);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const borL = parseFloat(cs.borderLeftWidth) || 0;
  const borR = parseFloat(cs.borderRightWidth) || 0;
  const innerW = Math.max(0, sample.clientWidth - padL - padR - borL - borR);
  if (innerW <= 0) return 1;

  const d = document.createElement("div");
  d.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "visibility:hidden",
    "pointer-events:none",
    "z-index:-1",
    `width:${innerW}px`,
    "white-space:pre-wrap",
    "word-break:break-all",
    "overflow-wrap:anywhere",
    `font:${cs.font}`,
    `line-height:${cs.lineHeight}`,
    `letter-spacing:${cs.letterSpacing}`,
  ].join(";");
  const lhProbe = document.createElement("div");
  lhProbe.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    "visibility:hidden",
    "pointer-events:none",
    "z-index:-1",
    `width:${innerW}px`,
    "white-space:pre",
    `font:${cs.font}`,
    `line-height:${cs.lineHeight}`,
    `letter-spacing:${cs.letterSpacing}`,
  ].join(";");
  lhProbe.textContent = "█";
  document.documentElement.appendChild(lhProbe);
  const probeLineHeight = Math.max(1, lhProbe.offsetHeight);
  document.documentElement.removeChild(lhProbe);

  d.textContent = text;
  document.documentElement.appendChild(d);

  let lh = parseFloat(cs.lineHeight);
  if (!Number.isFinite(lh) || lh <= 0) {
    lh = probeLineHeight;
  }
  const lines = Math.max(1, Math.round(d.offsetHeight / lh));

  document.documentElement.removeChild(d);
  return lines;
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
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ToolbarIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors",
        "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
        "dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        "disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
      )}
    >
      {children}
    </button>
  );
}

function LineNumberedField({
  value,
  onChange,
  readOnly,
  mono,
  showGutter = true,
  placeholder,
  maxLength,
  ariaLabel,
}: {
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
  mono?: boolean;
  showGutter?: boolean;
  placeholder?: string;
  maxLength?: number;
  ariaLabel: string;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterInnerRef = useRef<HTMLPreElement>(null);
  const [wrappedLines, setWrappedLines] = useState(1);

  const gutterNumbers = useMemo(
    () => Array.from({ length: wrappedLines }, (_, i) => String(i + 1)).join("\n"),
    [wrappedLines],
  );

  const remeasureWrappedLines = useCallback(() => {
    if (!showGutter) return;
    const el = taRef.current;
    if (!el) return;
    const next = measureWrappedLineCount(value, el);
    setWrappedLines((prev) => (prev === next ? prev : next));
  }, [value, showGutter]);

  useLayoutEffect(() => {
    if (!showGutter) return;
    remeasureWrappedLines();
  }, [remeasureWrappedLines, showGutter]);

  useEffect(() => {
    if (!showGutter) return;
    const el = taRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      remeasureWrappedLines();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [remeasureWrappedLines, showGutter]);

  /** 常见编辑器做法：只有正文可滚动；行号列 overflow:hidden，用 transform 跟随 scrollTop，无第二根滚动条、也不可拖行号区滚动 */
  const syncGutterToTextarea = useCallback(() => {
    const t = taRef.current;
    const g = gutterInnerRef.current;
    if (!t || !g) return;
    g.style.transform = `translate3d(0,-${t.scrollTop}px,0)`;
  }, []);

  useEffect(() => {
    if (!showGutter) return;
    syncGutterToTextarea();
  }, [value, gutterNumbers, syncGutterToTextarea, showGutter]);

  /** 行号必须与正文同族同字号行高，否则行号列与 textarea 逐行对不齐（此前行号用 mono、正文用 sans 会放大差异） */
  const syncedFont = mono ? "font-mono" : "font-sans";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-zinc-950",
        showGutter ? "flex-row" : "flex-col",
      )}
    >
      {showGutter ? (
        <div
          className={cn(
            "relative m-0 min-h-0 w-[2.625rem] shrink-0 overflow-hidden border-r border-zinc-200/90 bg-zinc-100 py-2 pr-1.5 pl-0 dark:border-zinc-600 dark:bg-zinc-800/90",
            EDITOR_LINE,
          )}
          aria-hidden
        >
          <pre
            ref={gutterInnerRef}
            className={cn(
              "m-0 block w-full select-none text-right tabular-nums text-zinc-400 will-change-transform dark:text-zinc-500",
              EDITOR_LINE,
              syncedFont,
            )}
          >
            {gutterNumbers}
          </pre>
        </div>
      ) : null}
      <textarea
        ref={taRef}
        readOnly={readOnly}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onScroll={showGutter ? syncGutterToTextarea : undefined}
        spellCheck={false}
        placeholder={placeholder}
        aria-label={ariaLabel}
        maxLength={maxLength}
        wrap="soft"
        className={cn(
          "min-h-0 min-w-0 w-full flex-1 resize-none overflow-x-hidden overflow-y-auto border-0 bg-transparent py-2 pl-3 pr-3 text-text outline-none focus-visible:ring-0 sm:pr-4",
          "whitespace-pre-wrap break-all [overflow-wrap:anywhere]",
          EDITOR_LINE,
          syncedFont,
        )}
      />
    </div>
  );
}

export function TextBase64EncodePanel({ copy }: { copy: Copy }) {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dataUrl, setDataUrl] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    if (input.length > MAX_CHARS) {
      setOutput("");
      return;
    }
    if (autoUpdate) {
      setOutput(encodeOutput(input, dataUrl));
    } else if (!input) {
      setOutput("");
    }
  }, [input, dataUrl, autoUpdate]);

  useEffect(() => {
    if (autoUpdate) return;
    const text = inputRef.current;
    if (text.length > MAX_CHARS) {
      setOutput("");
      return;
    }
    setOutput(encodeOutput(text, dataUrl));
  }, [dataUrl, autoUpdate]);

  const runEncode = () => {
    if (input.length > MAX_CHARS) {
      setOutput("");
      return;
    }
    setOutput(encodeOutput(input, dataUrl));
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setCopyHint(null);
  };

  const copyOutput = async () => {
    if (!output) return;
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
    a.download = copy.downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const titleBarClass =
    "flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2 sm:px-4 dark:border-zinc-700 dark:bg-zinc-900";
  const colClass =
    "flex min-h-[min(30rem,62vh)] flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm lg:min-h-[min(36rem,70vh)] dark:border-zinc-700/90 dark:bg-zinc-900";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
      <section className={colClass} aria-labelledby={inputId}>
        <div className={titleBarClass}>
          <h2 id={inputId} className="min-w-0 text-sm font-semibold text-text">
            {copy.inputColumnTitle}
          </h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-2 gap-y-2">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                className="size-3.5 rounded border-zinc-300 accent-[#1675BB]"
                checked={autoUpdate}
                onChange={(e) => setAutoUpdate(e.target.checked)}
              />
              <span>{copy.autoUpdate}</span>
            </label>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md bg-[#1675BB] px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#125d99]"
              onClick={runEncode}
            >
              <IconEncode className="size-3.5 shrink-0 opacity-95" />
              {copy.generate}
            </button>
            <ToolbarIconButton label={copy.clearAll} onClick={clearAll}>
              <IconTrash className="size-4" />
            </ToolbarIconButton>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900">
          <div className="flex min-h-0 flex-1 flex-col">
            <LineNumberedField
              value={input}
              onChange={setInput}
              placeholder={copy.inputPlaceholder}
              maxLength={MAX_CHARS}
              ariaLabel={copy.inputColumnTitle}
            />
          </div>
          <p className="border-t border-zinc-100 px-3 py-2 text-right text-xs text-text-muted dark:border-zinc-800 sm:px-4">
            {copy.charCount
              .replace("{n}", String(input.length))
              .replace("{max}", String(MAX_CHARS))}
          </p>
        </div>
      </section>

      <section className={colClass} aria-labelledby={outputId}>
        <div className={titleBarClass}>
          <h2 id={outputId} className="min-w-0 text-sm font-semibold text-text">
            {copy.outputColumnTitle}
          </h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <span className="sr-only">{copy.outputFormatLabel}</span>
            <div
              className="flex items-center gap-2 rounded-full bg-zinc-100/90 px-2.5 py-1 dark:bg-zinc-800/90"
              role="presentation"
            >
              <span
                className={cn(
                  "text-xs tabular-nums",
                  !dataUrl ? "font-semibold text-text" : "text-text-muted",
                )}
              >
                {copy.formatPlain}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={dataUrl}
                aria-label={copy.outputFormatLabel}
                title={dataUrl ? copy.formatDataUrl : copy.formatPlain}
                onClick={() => setDataUrl((v) => !v)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
                  dataUrl ? "bg-[#1675BB]" : "bg-zinc-400 dark:bg-zinc-600",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out",
                    dataUrl ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
              <span
                className={cn(
                  "max-w-[5.5rem] truncate text-xs sm:max-w-none",
                  dataUrl ? "font-semibold text-text" : "text-text-muted",
                )}
              >
                {copy.formatDataUrl}
              </span>
            </div>
            <ToolbarIconButton
              label={copy.copyOutput}
              onClick={copyOutput}
              disabled={!output}
            >
              <IconClipboard className="size-4" />
            </ToolbarIconButton>
            <ToolbarIconButton label={copy.saveAs} onClick={saveAs} disabled={!output}>
              <IconArrowDownTray className="size-4" />
            </ToolbarIconButton>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900">
          <div className="flex min-h-0 flex-1 flex-col">
            <LineNumberedField
              value={output}
              readOnly
              showGutter={false}
              ariaLabel={copy.outputColumnTitle}
            />
          </div>
          {copyHint ? (
            <p
              className="border-t border-zinc-100 px-3 py-2 text-xs text-text-secondary dark:border-zinc-800 sm:px-4"
              role="status"
            >
              {copyHint}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
