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
import { ToolTitleBarTextButton } from "@/components/ui/tool-title-bar-text-button";
import {
  copyResultBubbleClassName,
  toolCheckboxClass,
  toolChromeStandalonePrimaryButtonClass,
  toolChromeStandaloneSecondaryButtonClass,
  toolChromeTitleBarOutlineButtonClass,
  toolColumnCardClass,
  toolRangeInputClass,
  toolSectionBarTitlePlainClass,
  toolSectionTitleActionsClass,
  toolSectionTitleBarClass,
} from "@/lib/ui/tool-surface";
import { cn } from "@/lib/utils";

type Copy = Messages["tools"]["passwordGenerator"];

const panelShellClass = cn(
  "min-h-0 min-w-0",
  toolColumnCardClass,
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

function IconArrowUturnLeft({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 14 4 9l5-5" />
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 9h10.5a5.5 5.5 0 0 1 0 11H13"
      />
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
  const rowTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allTipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  /** 单行复制：气泡提示（index + 是否失败） */
  const [rowCopyTip, setRowCopyTip] = useState<{ index: number; error: boolean } | null>(null);
  /** 全部复制：气泡提示 */
  const [allCopyTip, setAllCopyTip] = useState<"ok" | "err" | null>(null);

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
    setRowCopyTip(null);
    setAllCopyTip(null);
    if (rowTipTimerRef.current) clearTimeout(rowTipTimerRef.current);
    if (allTipTimerRef.current) clearTimeout(allTipTimerRef.current);
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

  useEffect(() => {
    return () => {
      if (rowTipTimerRef.current) clearTimeout(rowTipTimerRef.current);
      if (allTipTimerRef.current) clearTimeout(allTipTimerRef.current);
    };
  }, []);

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
    setRowCopyTip(null);
    setAllCopyTip(null);
    if (rowTipTimerRef.current) clearTimeout(rowTipTimerRef.current);
    if (allTipTimerRef.current) clearTimeout(allTipTimerRef.current);
  };

  const copyAll = async () => {
    if (passwords.length === 0) return;
    const text = passwords.join("\n");
    if (allTipTimerRef.current) clearTimeout(allTipTimerRef.current);
    try {
      await navigator.clipboard.writeText(text);
      setAllCopyTip("ok");
      allTipTimerRef.current = setTimeout(() => {
        setAllCopyTip(null);
        allTipTimerRef.current = null;
      }, 2000);
    } catch {
      setAllCopyTip("err");
      allTipTimerRef.current = setTimeout(() => {
        setAllCopyTip(null);
        allTipTimerRef.current = null;
      }, 2500);
    }
  };

  const copyOne = async (line: string, index: number) => {
    if (rowTipTimerRef.current) clearTimeout(rowTipTimerRef.current);
    try {
      await navigator.clipboard.writeText(line);
      setRowCopyTip({ index, error: false });
      rowTipTimerRef.current = setTimeout(() => {
        setRowCopyTip(null);
        rowTipTimerRef.current = null;
      }, 2000);
    } catch {
      setRowCopyTip({ index, error: true });
      rowTipTimerRef.current = setTimeout(() => {
        setRowCopyTip(null);
        rowTipTimerRef.current = null;
      }, 2500);
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

  return (
    <div>
      <div
        className={cn(
          "grid grid-cols-1 gap-5 gap-x-4 sm:gap-x-5",
          "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-stretch lg:min-h-0",
        )}
      >
        <section className={cn(panelShellClass, "flex flex-col lg:h-full")} aria-labelledby={optionsRegionId}>
          <div className={cn(toolSectionTitleBarClass, "items-center")}>
            <h2 id={optionsRegionId} className={cn(toolSectionBarTitlePlainClass, "flex-1")}>
              {copy.optionsTitle}
            </h2>
            <div className={cn(toolSectionTitleActionsClass, "gap-1.5")}>
              <ToolTitleBarTextButton variant="primary" icon={<IconRefresh className="opacity-95" />} onClick={regenerate}>
                {copy.regenerateAction}
              </ToolTitleBarTextButton>
              <ToolTitleBarTextButton variant="outline" icon={<IconArrowUturnLeft />} onClick={resetDefaults}>
                {copy.resetAction}
              </ToolTitleBarTextButton>
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
                  className={toolRangeInputClass}
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
                  className={toolCheckboxClass}
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                />
                <span>{copy.uppercaseLabel}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className={toolCheckboxClass}
                  checked={lowercase}
                  onChange={(e) => setLowercase(e.target.checked)}
                />
                <span>{copy.lowercaseLabel}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className={toolCheckboxClass}
                  checked={numbers}
                  onChange={(e) => setNumbers(e.target.checked)}
                />
                <span>{copy.numbersLabel}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className={cn("mt-0.5", toolCheckboxClass)}
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
                className={toolCheckboxClass}
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
                className={cn(toolChromeStandalonePrimaryButtonClass, "flex-1 gap-2 sm:flex-initial [&>svg]:size-4")}
              >
                <IconRefresh className="opacity-95" />
                {copy.regenerateAction}
              </button>
              <button
                type="button"
                onClick={resetDefaults}
                className={cn(toolChromeStandaloneSecondaryButtonClass, "gap-2 [&>svg]:size-4")}
              >
                <IconArrowUturnLeft />
                {copy.resetAction}
              </button>
            </div>
          </div>
        </section>

        <section className={cn(panelShellClass, "flex flex-col lg:h-full")} aria-labelledby={resultRegionId}>
          <div className={cn(toolSectionTitleBarClass, "items-center")}>
            <h2
              id={resultRegionId}
              className={cn(toolSectionBarTitlePlainClass, "min-w-0 flex-1 truncate pr-2")}
              title={copy.resultTitle}
            >
              {copy.resultTitle}
            </h2>
            <div className={cn(toolSectionTitleActionsClass, "gap-1.5")}>
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
                    toolChromeTitleBarOutlineButtonClass,
                    "max-w-none gap-1 px-2 disabled:pointer-events-none disabled:opacity-40 sm:px-2.5",
                  )}
                >
                  <IconArrowDownTray className="size-3.5 shrink-0" />
                  <span className="min-w-0 whitespace-nowrap">{copy.saveAsAction}</span>
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
              <div className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => void copyAll()}
                  disabled={passwords.length === 0}
                  className={cn(
                    toolChromeTitleBarOutlineButtonClass,
                    "max-w-none gap-1 px-2 disabled:pointer-events-none disabled:opacity-40 sm:px-2.5",
                  )}
                >
                  <IconClipboard className="size-3.5 shrink-0" />
                  <span className="min-w-0 whitespace-nowrap">{copy.copyAllAction}</span>
                </button>
                {allCopyTip ? (
                  <span
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium shadow-md ring-1",
                      copyResultBubbleClassName(allCopyTip === "ok"),
                    )}
                  >
                    {allCopyTip === "ok" ? copy.copySuccessBubble : copy.copyFailedBubble}
                  </span>
                ) : null}
              </div>
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
                      <div className="relative shrink-0 self-center">
                        <button
                          type="button"
                          onClick={() => void copyOne(p, i)}
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
                        {rowCopyTip?.index === i ? (
                          <span
                            role="status"
                            aria-live="polite"
                            className={cn(
                              "pointer-events-none absolute right-full top-1/2 z-30 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium shadow-md ring-1",
                              copyResultBubbleClassName(!rowCopyTip.error),
                            )}
                          >
                            {rowCopyTip.error ? copy.copyFailedBubble : copy.copySuccessBubble}
                          </span>
                        ) : null}
                      </div>
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

          </div>
        </section>
      </div>
    </div>
  );
}
