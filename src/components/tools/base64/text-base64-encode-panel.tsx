"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64, utf8TextToBytes } from "@/lib/base64";
import { cn } from "@/lib/utils";

const MAX_CHARS = 100_000;

type Copy = Messages["tools"]["base64TextEncode"];

function encodeOutput(text: string, dataUrl: boolean): string {
  if (!text) return "";
  const b64 = bytesToBase64(utf8TextToBytes(text));
  return dataUrl
    ? `data:text/plain;charset=utf-8;base64,${b64}`
    : b64;
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
    "flex min-h-[min(30rem,62vh)] flex-col rounded-xl border border-zinc-200/90 bg-white shadow-sm lg:min-h-[min(36rem,70vh)] dark:border-zinc-700/90 dark:bg-zinc-900";

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
        <div className="flex flex-1 flex-col gap-1.5 bg-white p-3 sm:p-4 dark:bg-zinc-900">
          <textarea
            className="min-h-0 w-full flex-1 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 font-sans text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/25 dark:border-zinc-700 dark:bg-zinc-950"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_CHARS}
            spellCheck={false}
            placeholder={copy.inputPlaceholder}
            aria-label={copy.inputColumnTitle}
          />
          <p className="text-right text-xs text-text-muted">
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
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
            <span className="sr-only">{copy.outputFormatLabel}</span>
            <div
              className="inline-flex rounded-md border border-zinc-200 bg-zinc-50/80 p-0.5 dark:border-zinc-600 dark:bg-zinc-800/80"
              role="group"
              aria-label={copy.outputFormatLabel}
            >
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-medium transition-colors sm:text-xs",
                  !dataUrl
                    ? "bg-[#1675BB] text-white shadow-sm"
                    : "text-text-secondary hover:text-text",
                )}
                aria-pressed={!dataUrl}
                onClick={() => setDataUrl(false)}
              >
                {copy.formatPlain}
              </button>
              <button
                type="button"
                className={cn(
                  "rounded px-2 py-0.5 text-[11px] font-medium transition-colors sm:text-xs",
                  dataUrl
                    ? "bg-[#1675BB] text-white shadow-sm"
                    : "text-text-secondary hover:text-text",
                )}
                aria-pressed={dataUrl}
                onClick={() => setDataUrl(true)}
              >
                {copy.formatDataUrl}
              </button>
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
        <div className="flex flex-1 flex-col bg-white p-3 sm:p-4 dark:bg-zinc-900">
          <textarea
            readOnly
            className="min-h-0 w-full flex-1 resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-text dark:border-zinc-700 dark:bg-zinc-950"
            value={output}
            spellCheck={false}
            aria-label={copy.outputColumnTitle}
          />
          {copyHint ? (
            <p className="mt-1.5 text-xs text-text-secondary" role="status">
              {copyHint}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
