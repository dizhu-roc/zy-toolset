"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64, bytesToBase64Url, utf8TextToBytes } from "@/lib/base64";
import { cn } from "@/lib/utils";
import {
  IconColumnBase64Text,
  IconColumnSourceText,
} from "@/components/tools/base64/base64-text-column-icons";
import { LineNumberedField } from "@/components/tools/base64/line-numbered-field";

/** 桌面专用：左右卡片固定总高，正文在 textarea 内滚动 */
const EDITOR_PANEL_HEIGHT_CLASS = "h-[34rem]";

/** `base64-output-YYYYMMDDHHmmss.txt`（本地时间） */
function buildBase64DownloadFilename(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `base64-output-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.txt`;
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
        "inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors",
        "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
        "dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
      )}
    >
      {children}
    </button>
  );
}

export function TextBase64EncodePanel({ copy }: { copy: Copy }) {
  const inputId = useId();
  const outputId = useId();
  const outputFormatRadioName = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputMode, setOutputMode] = useState<TextBase64OutputMode>("standard");
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    if (autoUpdate) {
      setOutput(encodeOutput(input, outputMode));
    } else if (!input) {
      setOutput("");
    }
  }, [input, outputMode, autoUpdate]);

  useEffect(() => {
    if (autoUpdate) return;
    const text = inputRef.current;
    setOutput(encodeOutput(text, outputMode));
  }, [outputMode, autoUpdate]);

  const runEncode = () => {
    setOutput(encodeOutput(input, outputMode));
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
    a.download = buildBase64DownloadFilename();
    a.click();
    URL.revokeObjectURL(url);
  };

  const titleBarClass =
    "flex flex-wrap items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800/95";
  const encodeDisabled = input.trim() === "";
  const colClass = cn(
    "flex flex-col overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900",
    EDITOR_PANEL_HEIGHT_CLASS,
  );

  return (
    <div className="grid grid-cols-2 gap-5">
      <section className={colClass} aria-labelledby={inputId}>
        <div className={titleBarClass}>
          <h2
            id={inputId}
            className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-text"
          >
            <IconColumnSourceText className="size-4 shrink-0 text-text-secondary" />
            <span className="min-w-0 truncate">{copy.inputColumnTitle}</span>
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
              disabled={encodeDisabled}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white transition-colors",
                "bg-[#1675BB] hover:bg-[#125d99]",
                "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-[#1675BB]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
              )}
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
              ariaLabel={copy.inputColumnTitle}
            />
          </div>
          <p className="border-t border-zinc-100 px-4 py-2 text-right text-xs text-text-muted dark:border-zinc-800">
            {copy.charCount.replace("{n}", String(input.length))}
          </p>
        </div>
      </section>

      <section className={colClass} aria-labelledby={outputId}>
        <div className={titleBarClass}>
          <h2
            id={outputId}
            className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-text"
          >
            <IconColumnBase64Text className="size-4 shrink-0 text-text-secondary" />
            <span className="min-w-0 truncate">{copy.outputColumnTitle}</span>
          </h2>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <fieldset className="m-0 shrink-0 border-0 p-0">
              <legend className="sr-only">{copy.outputFormatLabel}</legend>
              <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-600 dark:bg-zinc-800/90">
                {(
                  [
                    ["standard", copy.formatPlain] as const,
                    ["base64url", copy.formatBase64Url] as const,
                    ["dataUrl", copy.formatDataUrl] as const,
                  ] as const
                ).map(([id, label], i) => (
                  <label
                    key={id}
                    className={cn(
                      "cursor-pointer select-none px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                      i === 0 && "rounded-l-full",
                      i === 1 && "rounded-none",
                      i === 2 && "rounded-r-full",
                      outputMode === id
                        ? "bg-[#1675BB] text-white"
                        : cn(
                            "text-text-secondary hover:text-text",
                            "hover:bg-zinc-200/90 dark:hover:bg-zinc-700/80 dark:hover:text-zinc-100",
                          ),
                    )}
                  >
                    <input
                      type="radio"
                      name={outputFormatRadioName}
                      value={id}
                      checked={outputMode === id}
                      onChange={() => setOutputMode(id)}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
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
              className="border-t border-zinc-100 px-4 py-2 text-xs text-text-secondary dark:border-zinc-800"
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
