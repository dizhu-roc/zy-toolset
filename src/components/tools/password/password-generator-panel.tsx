"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import {
  PASSWORD_BATCH_DEFAULT,
  PASSWORD_BATCH_MAX,
  PASSWORD_BATCH_MIN,
  PASSWORD_LENGTH_DEFAULT,
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  buildPools,
  estimateEntropyBits,
  generatePasswordBatch,
  mergeCharset,
} from "@/lib/password-generate";
import { cn } from "@/lib/utils";

type Copy = Messages["tools"]["passwordGenerator"];

const titleBarClass =
  "flex flex-wrap items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-3 py-2 sm:px-4 dark:border-zinc-600 dark:bg-zinc-800/95";

const panelShellClass = cn(
  "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-sm",
  "dark:border-zinc-700/90 dark:bg-zinc-900",
);

const toolbarBtnPrimary = cn(
  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-xs font-medium text-white transition-colors",
  "bg-[#1576BB] hover:bg-[#125d99]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
);

const toolbarBtnSecondary = cn(
  "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-text-secondary transition-colors",
  "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
  "dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
);

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function escapeCsvField(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function PasswordGeneratorPanel({ copy }: { copy: Copy }) {
  const optionsRegionId = useId();
  const resultRegionId = useId();
  const saveMenuRef = useRef<HTMLDivElement>(null);

  const [length, setLength] = useState(PASSWORD_LENGTH_DEFAULT);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [eachRequired, setEachRequired] = useState(true);
  const [batchCount, setBatchCount] = useState(PASSWORD_BATCH_DEFAULT);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);

  type ErrKey = "NO_CHARSET" | "EMPTY_POOL" | null;
  const [errorKey, setErrorKey] = useState<ErrKey>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const opts = useMemo(
    () => ({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      eachRequired,
    }),
    [length, uppercase, lowercase, numbers, symbols, eachRequired],
  );

  const charsetSize = useMemo(() => mergeCharset(buildPools(opts)).length, [opts]);

  const entropyBits = useMemo(
    () => estimateEntropyBits(charsetSize, Math.min(PASSWORD_LENGTH_MAX, Math.max(PASSWORD_LENGTH_MIN, length))),
    [charsetSize, length],
  );

  const regenerate = useCallback(() => {
    setErrorKey(null);
    setCopyHint(null);
    try {
      const next = generatePasswordBatch(opts, batchCount);
      setPasswords(next);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      if (code === "EMPTY_POOL") setErrorKey("EMPTY_POOL");
      else setErrorKey("NO_CHARSET");
      setPasswords([]);
    }
  }, [opts, batchCount]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  /** 键盘离开「保存为」区域时收起（鼠标由 onMouseLeave 处理） */
  useEffect(() => {
    if (!saveMenuOpen) return;
    const el = saveMenuRef.current;
    if (!el) return;
    const onFocusOut = (ev: FocusEvent) => {
      const next = ev.relatedTarget as Node | null;
      if (next && el.contains(next)) return;
      setSaveMenuOpen(false);
    };
    el.addEventListener("focusout", onFocusOut);
    return () => el.removeEventListener("focusout", onFocusOut);
  }, [saveMenuOpen]);

  const resetDefaults = () => {
    setLength(PASSWORD_LENGTH_DEFAULT);
    setUppercase(true);
    setLowercase(true);
    setNumbers(true);
    setSymbols(false);
    setEachRequired(true);
    setBatchCount(PASSWORD_BATCH_DEFAULT);
    setErrorKey(null);
    setCopyHint(null);
  };

  const copyAll = async () => {
    if (passwords.length === 0) return;
    const text = passwords.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyHint(copy.copied);
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint(copy.copyFailed);
      window.setTimeout(() => setCopyHint(null), 2500);
    }
  };

  const copyOne = async (line: string) => {
    try {
      await navigator.clipboard.writeText(line);
      setCopyHint(copy.copied);
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint(copy.copyFailed);
      window.setTimeout(() => setCopyHint(null), 2500);
    }
  };

  const baseFilename = () => `password-${Date.now()}`;

  const saveAsTxt = () => {
    if (passwords.length === 0) return;
    downloadText(`${baseFilename()}.txt`, passwords.join("\n"), "text/plain;charset=utf-8");
    setSaveMenuOpen(false);
  };

  const saveAsCsv = () => {
    if (passwords.length === 0) return;
    const header = "index,password";
    const body = passwords.map((p, i) => `${i + 1},${escapeCsvField(p)}`).join("\n");
    downloadText(`${baseFilename()}.csv`, `${header}\n${body}`, "text/csv;charset=utf-8");
    setSaveMenuOpen(false);
  };

  const errorMessage =
    errorKey === "NO_CHARSET"
      ? copy.errorNoCharset
      : errorKey === "EMPTY_POOL"
        ? copy.errorEmptyPool
        : null;

  const toolbarRegenerate = (
    <button type="button" onClick={regenerate} className={toolbarBtnPrimary}>
      <IconRefresh className="size-3 shrink-0 opacity-95" />
      {copy.regenerateAction}
    </button>
  );

  const toolbarReset = (
    <button type="button" onClick={resetDefaults} className={toolbarBtnSecondary}>
      {copy.resetAction}
    </button>
  );

  return (
    <div>
      <div
        className={cn(
          "grid grid-cols-1 gap-5 gap-x-4 sm:gap-x-5",
          "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-stretch lg:min-h-0",
        )}
      >
        <section className={cn(panelShellClass, "flex flex-col lg:h-full")} aria-labelledby={optionsRegionId}>
          <div className={cn(titleBarClass, "items-center")}>
            <h2 id={optionsRegionId} className="m-0 min-w-0 flex-1 text-sm font-semibold text-text">
              {copy.optionsTitle}
            </h2>
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {toolbarRegenerate}
              {toolbarReset}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-3 sm:p-4">
            <div className="space-y-2">
              <label id="pw-length-label" className="block text-sm font-medium text-text">
                {copy.lengthLabel}
              </label>
              <div className="flex min-w-0 items-center gap-3">
                <input
                  id="pw-length-range"
                  type="range"
                  min={PASSWORD_LENGTH_MIN}
                  max={PASSWORD_LENGTH_MAX}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="min-w-0 flex-1 accent-[#1576BB]"
                  aria-labelledby="pw-length-label"
                  aria-valuemin={PASSWORD_LENGTH_MIN}
                  aria-valuemax={PASSWORD_LENGTH_MAX}
                  aria-valuenow={length}
                />
                <input
                  id="pw-length-num"
                  type="number"
                  min={PASSWORD_LENGTH_MIN}
                  max={PASSWORD_LENGTH_MAX}
                  value={length}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isNaN(v)) return;
                    setLength(Math.min(PASSWORD_LENGTH_MAX, Math.max(PASSWORD_LENGTH_MIN, v)));
                  }}
                  className={cn(
                    "w-[4.25rem] shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-center font-mono text-sm tabular-nums",
                    "dark:border-zinc-600 dark:bg-zinc-950",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                  )}
                  aria-labelledby="pw-length-label"
                />
              </div>
            </div>

            <fieldset className="m-0 min-w-0 space-y-3.5 border-0 p-0">
              <legend className="sr-only">{copy.charsetLegend}</legend>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className="size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                />
                <span>{copy.uppercaseLabel}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className="size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                />
                <span>{copy.lowercaseLabel}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className="size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                  checked={numbers}
                  onChange={(e) => setNumbers(e.target.checked)}
                />
                <span>{copy.numbersLabel}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className="mt-0.5 size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                  checked={symbols}
                  onChange={(e) => setSymbols(e.target.checked)}
                />
                <span className="min-w-0 leading-snug">
                  <span className="text-text">{copy.symbolsLabel}</span>
                  <span className="ml-1.5 text-xs font-normal text-text-muted">{copy.symbolsHint}</span>
                </span>
              </label>
            </fieldset>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                checked={eachRequired}
                onChange={(e) => setEachRequired(e.target.checked)}
              />
              <span>{copy.eachRequiredLabel}</span>
            </label>

            <div className="space-y-1.5">
              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <label htmlFor="pw-batch-count" className="m-0 shrink-0 text-sm font-medium text-text">
                  {copy.batchCountLabel}
                </label>
                <input
                  id="pw-batch-count"
                  type="number"
                  min={PASSWORD_BATCH_MIN}
                  max={PASSWORD_BATCH_MAX}
                  value={batchCount}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isNaN(v)) return;
                    setBatchCount(Math.min(PASSWORD_BATCH_MAX, Math.max(PASSWORD_BATCH_MIN, v)));
                  }}
                  className={cn(
                    "w-[4.25rem] shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-center font-mono text-sm tabular-nums",
                    "dark:border-zinc-600 dark:bg-zinc-950",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                  )}
                />
              </div>
              <p className="m-0 text-xs text-text-muted">{copy.batchCountHint}</p>
            </div>

            {errorMessage ? (
              <p className="m-0 text-sm text-red-600 dark:text-red-400" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={regenerate}
                className={cn(
                  "inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors sm:flex-initial",
                  "bg-[#1576BB] hover:bg-[#125d99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                )}
              >
                <IconRefresh className="size-4 shrink-0 opacity-95" />
                {copy.regenerateAction}
              </button>
              <button
                type="button"
                onClick={resetDefaults}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm font-medium text-text-secondary transition-colors",
                  "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
                  "dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                )}
              >
                {copy.resetAction}
              </button>
            </div>
          </div>
        </section>

        <section className={cn(panelShellClass, "flex flex-col lg:h-full")} aria-labelledby={resultRegionId}>
          <div className={cn(titleBarClass, "items-center")}>
            <h2 id={resultRegionId} className="m-0 min-w-0 flex-1 text-sm font-semibold text-text">
              {copy.resultTitle}
            </h2>
            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              <div
                ref={saveMenuRef}
                className="relative inline-block"
                onMouseEnter={() => passwords.length > 0 && setSaveMenuOpen(true)}
                onMouseLeave={() => setSaveMenuOpen(false)}
              >
                <button
                  type="button"
                  disabled={passwords.length === 0}
                  aria-expanded={saveMenuOpen}
                  aria-haspopup="menu"
                  onFocus={() => passwords.length > 0 && setSaveMenuOpen(true)}
                  className={cn(
                    toolbarBtnSecondary,
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  {copy.saveAsAction}
                  <IconChevronDown className="size-3 shrink-0 opacity-80" />
                </button>
                {saveMenuOpen ? (
                  <div
                    className={cn(
                      "absolute right-0 top-full z-20 min-w-[9rem] rounded-md border border-zinc-200 bg-white py-1 shadow-md",
                      "dark:border-zinc-600 dark:bg-zinc-900",
                    )}
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={saveAsTxt}
                      className="block w-full px-3 py-2 text-left text-xs text-text hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {copy.saveAsTxt}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={saveAsCsv}
                      className="block w-full px-3 py-2 text-left text-xs text-text hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {copy.saveAsCsv}
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={copyAll}
                disabled={passwords.length === 0}
                className={cn(toolbarBtnSecondary, "disabled:pointer-events-none disabled:opacity-40")}
              >
                <IconClipboard className="size-3 shrink-0" />
                {copy.copyAllAction}
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4">
            <div className="h-[21rem] min-h-0 shrink-0 overflow-hidden">
              <ul
                className={cn(
                  "m-0 h-full min-h-0 list-none space-y-2 overflow-y-auto overflow-x-hidden p-0",
                  "[scrollbar-gutter:stable]",
                )}
                aria-live="polite"
                aria-label={copy.resultTitle}
              >
                {passwords.length === 0 ? (
                  <li className="rounded-md border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-text-muted dark:border-zinc-600">
                    {errorMessage ? "" : copy.generatedEmptyHint}
                  </li>
                ) : (
                  passwords.map((p, i) => (
                    <li
                      key={`${i}-${p.slice(0, 8)}`}
                      className="flex min-w-0 items-center gap-2 rounded-md border border-zinc-200/90 bg-zinc-50 px-2 py-2 font-mono text-sm leading-relaxed text-text dark:border-zinc-600 dark:bg-zinc-950 sm:px-3"
                    >
                      <div className="min-w-0 flex-1 break-all">
                        <span className="mr-2 select-none font-sans text-xs tabular-nums text-text-muted">
                          {i + 1}.
                        </span>
                        {p}
                      </div>
                      <button
                        type="button"
                        onClick={() => void copyOne(p)}
                        className={cn(
                          "inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-sans text-xs font-medium text-text-secondary transition-colors",
                          "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
                          "dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                        )}
                        aria-label={`${copy.copyOneAction} ${i + 1}`}
                        title={copy.copyOneAction}
                      >
                        <IconClipboard className="size-3.5 shrink-0" />
                        {copy.copyOneAction}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {charsetSize > 0 && passwords.length > 0 ? (
              <p className="m-0 shrink-0 text-xs text-text-muted">
                {copy.entropyHint.replace("{bits}", String(entropyBits))}
              </p>
            ) : null}

            {copyHint ? (
              <p className="m-0 shrink-0 text-xs text-text-secondary" role="status">
                {copyHint}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
