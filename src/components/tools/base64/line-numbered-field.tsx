"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  type RefObject,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/** 与行号列一致，避免滚动不同步（略小于正文，长 Base64 更易扫读） */
export const EDITOR_LINE = "text-xs leading-5 font-normal";

/**
 * 按与 textarea 相同的可视宽度与字体，测量 soft-wrap 后的行数（用于行号 gutter）。
 * 空内容固定为 1 行，避免在很高 min-height 的 flex 里用 scrollHeight 误判出多行「空行号」。
 */
export function measureWrappedLineCount(text: string, sample: HTMLTextAreaElement): number {
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

export function LineNumberedField({
  value,
  onChange,
  readOnly,
  mono,
  showGutter = true,
  placeholder,
  maxLength,
  ariaLabel,
  className,
  textClassName,
  textareaRef,
}: {
  value: string;
  onChange?: (next: string) => void;
  readOnly?: boolean;
  mono?: boolean;
  showGutter?: boolean;
  placeholder?: string;
  maxLength?: number;
  ariaLabel: string;
  className?: string;
  textClassName?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
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

  const syncedFont = mono ? "font-mono" : "font-sans";
  const editorTextClass = textClassName ?? EDITOR_LINE;

  useEffect(() => {
    if (!textareaRef) return;
    textareaRef.current = taRef.current;
    return () => {
      textareaRef.current = null;
    };
  }, [textareaRef]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-zinc-950",
        showGutter ? "flex-row" : "flex-col",
        className,
      )}
    >
      {showGutter ? (
        <div
          className={cn(
            "relative m-0 min-h-0 w-[2.625rem] shrink-0 overflow-hidden border-r border-zinc-200/90 bg-zinc-100 py-2 pr-1.5 pl-0 dark:border-zinc-600 dark:bg-zinc-800/90",
            editorTextClass,
          )}
          aria-hidden
        >
          <pre
            ref={gutterInnerRef}
            className={cn(
              "m-0 block w-full select-none text-right tabular-nums text-zinc-400 will-change-transform dark:text-zinc-500",
              editorTextClass,
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
        {...(typeof maxLength === "number" ? { maxLength } : {})}
        wrap="soft"
        className={cn(
          "min-h-0 min-w-0 w-full flex-1 resize-none overflow-x-hidden overflow-y-auto border-0 bg-transparent py-2 pr-4 pl-3 text-text outline-none focus-visible:ring-0",
          "whitespace-pre-wrap break-all [overflow-wrap:anywhere]",
          editorTextClass,
          syncedFont,
        )}
      />
    </div>
  );
}
