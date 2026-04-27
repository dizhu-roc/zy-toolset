"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import {
  PASSWORD_LENGTH_DEFAULT,
  PASSWORD_LENGTH_MAX,
  PASSWORD_LENGTH_MIN,
  buildPools,
  estimateEntropyBits,
  generatePassword,
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

export function PasswordGeneratorPanel({ copy }: { copy: Copy }) {
  const optionsRegionId = useId();
  const resultRegionId = useId();
  const [length, setLength] = useState(PASSWORD_LENGTH_DEFAULT);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [eachRequired, setEachRequired] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<"NO_CHARSET" | "EMPTY_POOL" | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);

  const opts = useMemo(
    () => ({
      length,
      uppercase,
      lowercase,
      numbers,
      symbols,
      eachRequired,
      excludeAmbiguous,
    }),
    [length, uppercase, lowercase, numbers, symbols, eachRequired, excludeAmbiguous],
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
      setPassword(generatePassword(opts));
    } catch (e) {
      if (e instanceof Error && e.message === "EMPTY_POOL") {
        setErrorKey("EMPTY_POOL");
      } else {
        setErrorKey("NO_CHARSET");
      }
      setPassword("");
    }
  }, [opts]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const resetDefaults = () => {
    setLength(PASSWORD_LENGTH_DEFAULT);
    setUppercase(true);
    setLowercase(true);
    setNumbers(true);
    setSymbols(true);
    setEachRequired(true);
    setExcludeAmbiguous(false);
    setErrorKey(null);
    setCopyHint(null);
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopyHint(copy.copied);
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint(copy.copyFailed);
      window.setTimeout(() => setCopyHint(null), 2500);
    }
  };

  const errorMessage =
    errorKey === "NO_CHARSET"
      ? copy.errorNoCharset
      : errorKey === "EMPTY_POOL"
        ? copy.errorEmptyPool
        : null;

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "grid grid-cols-1 gap-5 gap-x-4 sm:gap-x-5",
          "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-stretch",
        )}
      >
        <section className={cn(panelShellClass, "flex flex-col")} aria-labelledby={optionsRegionId}>
          <div className={titleBarClass}>
            <h2 id={optionsRegionId} className="m-0 min-w-0 flex-1 text-sm font-semibold text-text">
              {copy.optionsTitle}
            </h2>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 p-3 sm:p-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="pw-length" className="text-sm font-medium text-text">
                  {copy.lengthLabel}
                </label>
                <span className="font-mono text-sm tabular-nums text-text-secondary">{length}</span>
              </div>
              <input
                id="pw-length"
                type="range"
                min={PASSWORD_LENGTH_MIN}
                max={PASSWORD_LENGTH_MAX}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full accent-[#1576BB]"
              />
              <input
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
                  "w-full max-w-[6rem] rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-sm tabular-nums",
                  "dark:border-zinc-600 dark:bg-zinc-950",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                )}
                aria-label={copy.lengthLabel}
              />
            </div>

            <fieldset className="m-0 min-w-0 space-y-2.5 border-0 p-0">
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
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text">
                <input
                  type="checkbox"
                  className="size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                  checked={symbols}
                  onChange={(e) => setSymbols(e.target.checked)}
                />
                <span>{copy.symbolsLabel}</span>
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

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-text-secondary">
              <input
                type="checkbox"
                className="size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                checked={excludeAmbiguous}
                onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              />
              <span>{copy.excludeAmbiguousLabel}</span>
            </label>

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

        <section className={cn(panelShellClass, "flex flex-col")} aria-labelledby={resultRegionId}>
          <div className={titleBarClass}>
            <h2 id={resultRegionId} className="m-0 min-w-0 flex-1 text-sm font-semibold text-text">
              {copy.resultTitle}
            </h2>
            <button
              type="button"
              onClick={copyPassword}
              disabled={!password}
              className={cn(
                "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-text-secondary transition-colors",
                "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
                "dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
                "disabled:pointer-events-none disabled:opacity-40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
              )}
            >
              <IconClipboard className="size-4 shrink-0" />
              {copy.copyAction}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
            <output
              className={cn(
                "block min-h-[4.5rem] w-full break-all rounded-md border border-zinc-200/90 bg-zinc-50 px-3 py-3 font-mono text-sm leading-relaxed text-text sm:min-h-[5.5rem] sm:text-base",
                "dark:border-zinc-600 dark:bg-zinc-950",
              )}
              aria-live="polite"
              aria-label={copy.resultTitle}
            >
              {password || (errorMessage ? "" : copy.generatedEmptyHint)}
            </output>

            {charsetSize > 0 && password ? (
              <p className="m-0 text-xs text-text-muted">
                {copy.entropyHint.replace("{bits}", String(entropyBits))}
              </p>
            ) : null}

            {copyHint ? (
              <p className="m-0 text-xs text-text-secondary" role="status">
                {copyHint}
              </p>
            ) : null}

            <p className="m-0 mt-auto text-xs leading-relaxed text-text-muted">{copy.localHint}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
