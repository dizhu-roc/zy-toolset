"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import {
  base64ToBytes,
  sniffLikelyBinaryKind,
  tryParseDataUrl,
  tryUtf8Decode,
} from "@/lib/base64";
import { cn } from "@/lib/utils";
import {
  IconColumnBase64Text,
  IconColumnSourceText,
} from "@/components/tools/base64/base64-text-column-icons";
import { LineNumberedField } from "@/components/tools/base64/line-numbered-field";
import { TextFileUploadButton } from "@/components/tools/base64/text-file-upload-button";
import { ToolTitleBarTextButton } from "@/components/ui/tool-title-bar-text-button";
import {
  copyResultBubbleClassName,
  toolCheckboxClass,
  toolColumnCardClass,
  toolSectionHeadingClass,
  toolSectionHeadingIconClass,
  toolSectionTitleActionsClass,
  toolSectionTitleBarClass,
} from "@/lib/ui/tool-surface";

const EDITOR_PANEL_HEIGHT_CLASS = "h-[34rem]";

type PageCopy = Messages["tools"]["base64TextDecode"];

function mainMime(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase();
}

/** 本页仅做 UTF-8 文本预览：图片 / 音视频 / PDF 等走专用工具（提示在输出区） */
function isStructuredBinaryMime(m: string): boolean {
  if (m.startsWith("image/")) return true;
  if (m.startsWith("audio/")) return true;
  if (m.startsWith("video/")) return true;
  if (m === "application/pdf") return true;
  return false;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

function typeLabelFromMime(mime: string, copy: PageCopy): string {
  if (mime.startsWith("image/")) return copy.decodeTypeImage;
  if (mime.startsWith("audio/")) return copy.decodeTypeAudio;
  if (mime.startsWith("video/")) return copy.decodeTypeVideo;
  if (mime === "application/pdf") return copy.decodeTypePdf;
  return copy.decodeTypeBinary;
}

function typeLabelFromSniff(kind: "image" | "pdf" | null, copy: PageCopy): string {
  if (kind === "image") return copy.decodeTypeImage;
  if (kind === "pdf") return copy.decodeTypePdf;
  return copy.decodeTypeBinary;
}

function buildDecodedDownloadFilename(mime: string): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `base64decode-${stamp}.txt`;
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

function IconDecode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" transform="rotate(180 12 12)" />
    </svg>
  );
}

export function TextBase64DecodePanel({ copy }: { copy: PageCopy }) {
  const inputId = useId();
  const outputId = useId();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputFailureText, setOutputFailureText] = useState<string | null>(null);
  const [rawBytes, setRawBytes] = useState<Uint8Array | null>(null);
  const [rawMime, setRawMime] = useState("application/octet-stream");
  const [autoDecode, setAutoDecode] = useState(true);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [uploadHint, setUploadHint] = useState<string | null>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);

  const runDecode = useCallback(
    (source: "auto" | "manual") => {
      setOutput("");
      setOutputFailureText(null);
      setCopyHint(null);
      setRawBytes(null);
      const trimmed = input.trim();
      if (!trimmed) {
        if (source === "manual") {
          setOutputFailureText(copy.emptyInputHint);
        }
        return;
      }

      const tool = copy.decodeToolPlaceholder;

      try {
        const data = tryParseDataUrl(trimmed);
        let bytes: Uint8Array;
        let mimeHeader = "text/plain;charset=utf-8";

        if (data) {
          bytes = base64ToBytes(data.base64Part);
          mimeHeader = data.mime;
        } else {
          bytes = base64ToBytes(trimmed);
        }

        const mime = mainMime(mimeHeader);
        setRawMime(mime);

        if (data && isStructuredBinaryMime(mime)) {
          const type = typeLabelFromMime(mime, copy);
          setOutputFailureText(fillTemplate(copy.decodeOutputFailMedia, { type, tool }));
          setRawBytes(bytes);
          return;
        }

        const utf = tryUtf8Decode(bytes);
        if (utf.ok) {
          setOutput(utf.text);
          setRawBytes(bytes);
          return;
        }

        const sniffed = sniffLikelyBinaryKind(bytes);
        const type = data ? typeLabelFromMime(mime, copy) : typeLabelFromSniff(sniffed, copy);
        setOutputFailureText(fillTemplate(copy.decodeOutputFailBinary, { type, tool }));
        setRawBytes(bytes);
      } catch {
        setOutputFailureText(fillTemplate(copy.decodeOutputFailInvalid, { tool }));
      }
    },
    [input, copy],
  );

  const runDecodeRef = useRef(runDecode);
  runDecodeRef.current = runDecode;

  useEffect(() => {
    if (!autoDecode) return;
    const t = input.trim();
    if (!t) {
      setOutput("");
      setOutputFailureText(null);
      setRawBytes(null);
      setUploadHint(null);
      return;
    }
    runDecodeRef.current("auto");
  }, [input, autoDecode]);

  const manualDecode = () => {
    runDecode("manual");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setOutputFailureText(null);
    setRawBytes(null);
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

  const downloadRaw = () => {
    if (!rawBytes) return;
    const blob = new Blob([new Uint8Array(rawBytes)], { type: rawMime || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildDecodedDownloadFilename(rawMime);
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const decodeDisabled = input.trim() === "";

  const colClass = cn(toolColumnCardClass, EDITOR_PANEL_HEIGHT_CLASS);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-5">
        <section className={colClass} aria-labelledby={inputId}>
          <div className={toolSectionTitleBarClass}>
            <h2 id={inputId} className={toolSectionHeadingClass}>
              <IconColumnBase64Text className={toolSectionHeadingIconClass} />
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
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary">
                <input
                  type="checkbox"
                  className={toolCheckboxClass}
                  checked={autoDecode}
                  onChange={(e) => setAutoDecode(e.target.checked)}
                />
                <span>{copy.autoDecode}</span>
              </label>
              <ToolTitleBarTextButton
                variant="primary"
                disabled={decodeDisabled}
                icon={<IconDecode className="opacity-95" />}
                onClick={manualDecode}
              >
                {copy.decodeAction}
              </ToolTitleBarTextButton>
              <ToolTitleBarTextButton variant="outline" icon={<IconTrash />} onClick={clearAll}>
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
              <IconColumnSourceText className={toolSectionHeadingIconClass} />
              <span className="min-w-0 truncate">{copy.outputColumnTitle}</span>
            </h2>
            <div className={toolSectionTitleActionsClass}>
              <div className="relative inline-flex">
                <ToolTitleBarTextButton
                  variant="outline"
                  disabled={!output || outputFailureText !== null}
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
                disabled={!rawBytes}
                icon={<IconArrowDownTray />}
                onClick={downloadRaw}
              >
                {copy.downloadDecoded}
              </ToolTitleBarTextButton>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col bg-zinc-100 dark:bg-zinc-900">
            <div className="flex min-h-0 flex-1 flex-col">
              {outputFailureText ? (
                <div
                  role="alert"
                  aria-live="polite"
                  className={cn(
                    "min-h-0 flex-1 overflow-auto px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    "text-red-600 dark:text-red-400",
                  )}
                >
                  {outputFailureText}
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
