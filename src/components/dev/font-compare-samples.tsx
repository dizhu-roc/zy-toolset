"use client";

import type { KeyboardEvent } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type FontCompareRole = "mono" | "sans";

export type FontCompareSpec = {
  id: string;
  name: string;
  blurb: string;
  className: string;
  cssFamily: string;
  role: FontCompareRole;
  /** Optional: matching sans/mono superfamily on Google Fonts */
  pairedFamilyNote?: string;
};

type Props = {
  fonts: FontCompareSpec[];
};

const SAMPLE_LINES = [
  "ABCDEFGH abcdefghij 0123456789",
  "The quick brown fox jumps over the lazy dog — π≈3.14159 · £¥€$",
  "const total = 0x1F600;  // Il1| O0 S5 B8",
  "function render() { return <div />; }",
];

function FontCard({
  font,
  isOn,
  onSelect,
}: {
  font: FontCompareSpec;
  isOn: boolean;
  onSelect: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={isOn}
      aria-label={`Select font: ${font.name}`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "w-full rounded-lg border bg-white p-4 text-left shadow-sm outline-none transition-[box-shadow,border-color]",
        "focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-main-bg dark:focus-visible:ring-offset-main-bg",
        "dark:bg-zinc-900",
        isOn
          ? "border-accent ring-2 ring-accent/25"
          : "cursor-pointer border-zinc-200/90 hover:border-zinc-300 dark:border-zinc-600 dark:hover:border-zinc-500",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-text">{font.name}</span>
        {isOn ? (
          <span className="shrink-0 text-[11px] font-medium text-accent">Selected</span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-text-muted leading-snug">{font.blurb}</p>
      {font.pairedFamilyNote ? (
        <p className="mt-1 text-[11px] leading-snug text-accent/90">{font.pairedFamilyNote}</p>
      ) : null}
      <div
        className={cn(
          "mt-3 space-y-3 rounded-md border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 text-sm leading-relaxed",
          "dark:border-zinc-700 dark:bg-zinc-800/50",
          font.className,
        )}
      >
        {font.role === "sans" ? (
          <>
            <div className="space-y-1.5 border-b border-zinc-200/70 pb-3 dark:border-zinc-600/60">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Title scale (same family, weights)
              </p>
              <div
                role="heading"
                aria-level={1}
                className="m-0 text-xl font-bold leading-tight tracking-tight text-text"
              >
                Display · 700
              </div>
              <div
                role="heading"
                aria-level={2}
                className="m-0 text-base font-semibold leading-snug tracking-tight text-text"
              >
                Section · 600
              </div>
              <div
                role="heading"
                aria-level={3}
                className="m-0 text-sm font-medium leading-snug text-text-secondary"
              >
                Minor · 500
              </div>
            </div>
            <div className="space-y-1.5 border-b border-zinc-200/70 pb-3 dark:border-zinc-600/60">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Body & UI (400–700)
              </p>
              <p className="m-0 text-sm font-normal text-text">
                <span className="text-text-muted">400 </span>
                The quick brown fox jumps over the lazy dog.
              </p>
              <p className="m-0 text-sm font-medium text-text">
                <span className="text-text-muted">500 </span>
                Navigation · active state · medium labels
              </p>
              <p className="m-0 text-sm font-semibold text-text">
                <span className="text-text-muted">600 </span>
                Section titles and table headers
              </p>
              <p className="m-0 text-sm font-bold text-text">
                <span className="text-text-muted">700 </span>
                Hero or marketing emphasis
              </p>
            </div>
            <div className="space-y-1.5 border-b border-zinc-200/70 pb-3 dark:border-zinc-600/60">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Italic (same family)
              </p>
              <p className="m-0 text-sm font-normal italic text-text">
                Italic body — captions, quotes, or softer emphasis.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Symbols
              </p>
              <p className="m-0 text-sm font-normal">π≈3.14159 · £¥€$ · Packing five dozen liquor jugs.</p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5 border-b border-zinc-200/70 pb-3 dark:border-zinc-600/60">
              <p className="m-0 text-[10px] font-medium uppercase tracking-wider text-text-muted">
                Heading scale
              </p>
              <div
                role="heading"
                aria-level={1}
                className="m-0 text-xl font-bold leading-tight tracking-tight text-text"
              >
                Display title · H1
              </div>
              <div
                role="heading"
                aria-level={2}
                className="m-0 text-base font-semibold leading-snug tracking-tight text-text"
              >
                Section title · H2
              </div>
              <div
                role="heading"
                aria-level={3}
                className="m-0 text-sm font-medium leading-snug text-text-secondary"
              >
                Minor heading · H3
              </div>
            </div>
            <div className="space-y-1.5">
              {SAMPLE_LINES.map((line) => (
                <p key={line} className="m-0 whitespace-pre-wrap break-all text-sm">
                  {line}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

/** Dev-only: compare monospace + Graphik-like UI sans; copy stack from the footer. */
export function FontCompareSamples({ fonts }: Props) {
  const monoFonts = useMemo(() => fonts.filter((f) => f.role === "mono"), [fonts]);
  const sansFonts = useMemo(() => fonts.filter((f) => f.role === "sans"), [fonts]);
  const [selectedId, setSelectedId] = useState<string | null>(fonts[0]?.id ?? null);
  const selected = useMemo(
    () => fonts.find((f) => f.id === selectedId) ?? null,
    [fonts, selectedId],
  );

  const copyFamily = async () => {
    if (!selected) return;
    const line =
      selected.role === "sans"
        ? `font-family: ${selected.cssFamily};\nfont-weight: 400;\n/* same family on Google Fonts: weights 400–700 + italic */`
        : `font-family: ${selected.cssFamily};`;
    try {
      await navigator.clipboard.writeText(line);
    } catch {
      // ignore
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-text">Font compare: monospace & UI sans</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
        Monospace cards: Google Fonts tuned for <strong className="font-medium text-text/90">code and dense UI</strong>
        . Sans cards: <strong className="font-medium text-text/90">Graphik-adjacent</strong> families—each loads{" "}
        <strong className="font-medium text-text/90">roman 400–700</strong> from one family;{" "}
        <strong className="font-medium text-text/90">true italic</strong> is bundled where Google Fonts ships
        it (Manrope & Outfit use browser oblique for the italic line—see card note). Click a card; copy the{" "}
        <code className="rounded bg-zinc-200/80 px-1 text-xs dark:bg-zinc-700/80">font-family</code> snippet at
        the bottom.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
        If monospace UI feels <strong className="font-medium text-text/90">too dark or heavy</strong>, try
        the <strong className="font-medium text-text/90">Inconsolata → Ubuntu Mono</strong> block—more open
        apertures, lighter strokes, or rounder shapes.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
        For <strong className="font-medium text-text/90">compact structure</strong> (narrow advance width,
        dense bars, DIN / tech silhouettes), scroll to{" "}
        <strong className="font-medium text-text/90">Fira Mono → Share Tech Mono</strong> at the end of the
        grid.
      </p>

      <ul className="mt-4 max-w-3xl list-inside list-disc space-y-1 text-xs text-text-muted">
        <li>
          <strong className="text-text-secondary">JetBrains Mono</strong> — JetBrains; strong punctuation;
          common in IDEs.
        </li>
        <li>
          <strong className="text-text-secondary">IBM Plex Mono</strong> — IBM Plex; neutral, slightly
          geometric; pairs with UI sans.
        </li>
        <li>
          <strong className="text-text-secondary">Source Code Pro</strong> — Adobe open source; slightly wide;
          comfortable for long reads.
        </li>
        <li>
          <strong className="text-text-secondary">Fira Code</strong> — Mozilla; ligatures for operators
          (enable font features in CSS if needed).
        </li>
        <li>
          <strong className="text-text-secondary">Space Mono</strong> — Geometric, narrow; reads “flat” and
          punchy.
        </li>
        <li>
          <strong className="text-text-secondary">Roboto Mono</strong> — Material companion to Roboto.
        </li>
        <li>
          <strong className="text-text-secondary">DM Mono</strong> — Narrow; fits more glyphs per line.
        </li>
        <li>
          <strong className="text-text-secondary">Red Hat Mono</strong> — Matches Red Hat Text; docs and
          product tone.
        </li>
        <li>
          <strong className="text-text-secondary">Inconsolata</strong> — Open, friendly; classic “lighter”
          coding face.
        </li>
        <li>
          <strong className="text-text-secondary">Overpass Mono</strong> — Wide-open forms; less blocky at
          the same size.
        </li>
        <li>
          <strong className="text-text-secondary">Cousine</strong> — Readable Courier-width alternative;
          airy counters.
        </li>
        <li>
          <strong className="text-text-secondary">Oxygen Mono</strong> — Thin strokes; pair with generous
          line-height.
        </li>
        <li>
          <strong className="text-text-secondary">Ubuntu Mono</strong> — Humanist curves; softer than strict
          geometry.
        </li>
        <li>
          <strong className="text-text-secondary">Fira Mono</strong> — Mozilla; no ligatures; denser than
          Fira Code at the same size.
        </li>
        <li>
          <strong className="text-text-secondary">B612 Mono</strong> — Aviation / DIN; tight rhythm for
          dashboards.
        </li>
        <li>
          <strong className="text-text-secondary">Chivo Mono</strong> — Narrow-ish; more glyphs per line.
        </li>
        <li>
          <strong className="text-text-secondary">Fragment Mono</strong> — Geometric, even texture in dense
          blocks.
        </li>
        <li>
          <strong className="text-text-secondary">Nova Mono</strong> — Very narrow advance; distinctive.
        </li>
        <li>
          <strong className="text-text-secondary">Share Tech Mono</strong> — Narrow tech / signage; labels
          and toolbars.
        </li>
      </ul>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Sans — Graphik-like (Google Fonts)
      </p>
      <ul className="mt-2 max-w-3xl list-inside list-disc space-y-1 text-xs text-text-muted">
        <li>
          <strong className="text-text-secondary">DM Sans</strong> — Geometric UI sans; pairs with{" "}
          <strong className="text-text-secondary">DM Mono</strong> (same brand).
        </li>
        <li>
          <strong className="text-text-secondary">Plus Jakarta Sans</strong> — Product / startup UI; large
          weight range on Google Fonts.
        </li>
        <li>
          <strong className="text-text-secondary">Manrope</strong> — Rounded geometric; variable-friendly.
        </li>
        <li>
          <strong className="text-text-secondary">Albert Sans</strong> — Neutral grotesk for apps and forms.
        </li>
        <li>
          <strong className="text-text-secondary">Work Sans</strong> — Grotesk workhorse; many weights.
        </li>
        <li>
          <strong className="text-text-secondary">Outfit</strong> — Geometric display-leaning; good for marketing
          + UI.
        </li>
      </ul>

      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-text-muted">
        <strong className="text-text-secondary">Same superfamily on Google Fonts:</strong>{" "}
        IBM Plex Sans ↔ IBM Plex Mono · Roboto ↔ Roboto Mono · Chivo ↔ Chivo Mono · DM Sans ↔ DM Mono (load
        each face separately; they share metrics intent, not a single variable axis).
      </p>

      <h2 className="mt-10 text-lg font-semibold text-text">Monospace</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {monoFonts.map((f) => (
          <FontCard
            key={f.id}
            font={f}
            isOn={selectedId === f.id}
            onSelect={() => setSelectedId(f.id)}
          />
        ))}
      </div>

      <h2 className="mt-12 text-lg font-semibold text-text">Sans — Graphik-like</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {sansFonts.map((f) => (
          <FontCard
            key={f.id}
            font={f}
            isOn={selectedId === f.id}
            onSelect={() => setSelectedId(f.id)}
          />
        ))}
      </div>

      {selected ? (
        <div className="mt-8 rounded-lg border border-zinc-200/90 bg-zinc-50/80 p-4 dark:border-zinc-600 dark:bg-zinc-800/40">
          <p className="m-0 text-xs font-medium text-text-secondary">Selected: {selected.name}</p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-zinc-900/90 px-3 py-2 text-xs text-zinc-100 dark:bg-black/60">
            <code>{`font-family: ${selected.cssFamily};`}</code>
          </pre>
          <button
            type="button"
            onClick={() => void copyFamily()}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-text shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Copy CSS
          </button>
        </div>
      ) : null}
    </div>
  );
}
