"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import {
  type FileDecodeErrorKind,
  decodeBase64ToFilePayload,
  estimateDecodedBytesFromInput,
  MAX_FILE_DECODE_BYTES,
  mainMime,
} from "@/lib/file-base64-decode";
import { tryUtf8Decode } from "@/lib/base64";
import { cn } from "@/lib/utils";
import {
  IconColumnBase64Text,
  IconColumnSourceText,
} from "@/components/tools/base64/base64-text-column-icons";
import { LineNumberedField } from "@/components/tools/base64/line-numbered-field";
import { TextFileUploadButton } from "@/components/tools/base64/text-file-upload-button";

type Copy = Messages["tools"]["base64FileDecode"];

const PANEL_FIXED_H = "h-[36rem] sm:h-[38rem]";

function isStructuredBinaryMime(m: string): boolean {
  const x = mainMime(m);
  if (x.startsWith("image/")) return true;
  if (x.startsWith("audio/")) return true;
  if (x.startsWith("video/")) return true;
  if (x === "application/pdf") return true;
  return false;
}

function looksLikeUtf8Text(bytes: Uint8Array, maxLen: number): boolean {
  if (bytes.length > maxLen) return false;
  const r = tryUtf8Decode(bytes);
  if (!r.ok) return false;
  if (r.text.length === 0) return false;
  let printable = 0;
  for (let i = 0; i < r.text.length; i++) {
    const c = r.text.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13 || (c >= 0x20 && c !== 0x7f)) printable++;
  }
  return printable / r.text.length > 0.92;
}

function IconDecode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" transform="rotate(180 12 12)" />
    </svg>
  );
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

const titleBarClass =
  "flex flex-wrap items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-3 py-2 sm:px-4 dark:border-zinc-600 dark:bg-zinc-800/95";

const panelShellClass = cn(
  "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-sm",
  "dark:border-zinc-700/90 dark:bg-zinc-900",
);

export function FileBase64DecodePanel({
  copy,
  textDecodeHref,
}: {
  copy: Copy;
  textDecodeHref: string;
}) {
  const inputId = useId();
  const previewRegionId = useId();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<{
    bytes: Uint8Array;
    mime: string;
    suggestedFilename: string;
  } | null>(null);
  const [downloadName, setDownloadName] = useState("");
  type ErrKey =
    | "errorEmpty"
    | "errorInvalidBase64"
    | "errorDataUrlInvalid"
    | "errorEmptyPayload"
    | "errorTooLarge"
    | "uploadFileRejectNotText";
  const [errorKey, setErrorKey] = useState<ErrKey | null>(null);
  const [errorMbToken, setErrorMbToken] = useState<string | null>(null);

  const mbLimit = String(MAX_FILE_DECODE_BYTES / (1024 * 1024));

  const clearError = useCallback(() => {
    setErrorKey(null);
    setErrorMbToken(null);
  }, []);

  const runPreview = useCallback(() => {
    clearError();
    setPreview(null);
    const t = input.trim();
    if (!t) {
      setErrorKey("errorEmpty");
      return;
    }
    const est = estimateDecodedBytesFromInput(t);
    if (est > MAX_FILE_DECODE_BYTES) {
      setErrorKey("errorTooLarge");
      setErrorMbToken(mbLimit);
      return;
    }
    const r = decodeBase64ToFilePayload(input);
    if (!r.ok) {
      if (r.error === "tooLarge") {
        setErrorKey("errorTooLarge");
        setErrorMbToken(mbLimit);
      } else {
        const map: Record<Exclude<FileDecodeErrorKind, "tooLarge">, ErrKey> = {
          empty: "errorEmpty",
          dataUrlInvalid: "errorDataUrlInvalid",
          invalidBase64: "errorInvalidBase64",
          emptyPayload: "errorEmptyPayload",
        };
        setErrorKey(map[r.error]);
      }
      return;
    }
    setPreview(r.value);
    setDownloadName(r.value.suggestedFilename);
  }, [clearError, input, mbLimit]);

  const clearAll = () => {
    setInput("");
    setPreview(null);
    setDownloadName("");
    clearError();
  };

  const objectUrl = useMemo(() => {
    if (!preview) return null;
    const m = mainMime(preview.mime);
    if (m.startsWith("image/") || m.startsWith("video/") || m.startsWith("audio/")) {
      return URL.createObjectURL(new Blob([preview.bytes as BlobPart], { type: preview.mime }));
    }
    if (m === "application/pdf") {
      return URL.createObjectURL(new Blob([preview.bytes as BlobPart], { type: "application/pdf" }));
    }
    return null;
  }, [preview]);

  useEffect(() => {
    if (!objectUrl) return;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const showTextHint =
    preview &&
    !isStructuredBinaryMime(preview.mime) &&
    looksLikeUtf8Text(preview.bytes, 16_384);

  const downloadFile = () => {
    if (!preview) return;
    const name = downloadName.trim() || preview.suggestedFilename;
    const blob = new Blob([preview.bytes as BlobPart], { type: preview.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const errorMessage = errorKey
    ? (() => {
        const mb = errorMbToken ?? mbLimit;
        switch (errorKey) {
          case "errorTooLarge":
            return copy.errorTooLarge.replace("{mb}", mb);
          case "errorEmpty":
            return copy.errorEmpty;
          case "errorInvalidBase64":
            return copy.errorInvalidBase64;
          case "errorDataUrlInvalid":
            return copy.errorDataUrlInvalid;
          case "errorEmptyPayload":
            return copy.errorEmptyPayload;
          case "uploadFileRejectNotText":
            return copy.uploadFileRejectNotText;
          default:
            return null;
        }
      })()
    : null;

  const previewMime = preview ? mainMime(preview.mime) : "";

  return (
    <div className="space-y-10">
      <div
        className={cn(
          "grid grid-cols-1 gap-5 gap-x-4 sm:gap-x-5",
          "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch",
        )}
      >
        <section
          className={cn(panelShellClass, PANEL_FIXED_H, "flex flex-col")}
          aria-labelledby={inputId}
        >
          <div className={titleBarClass}>
            <h2
              id={inputId}
              className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-text"
            >
              <IconColumnSourceText className="size-4 shrink-0 text-text-secondary" />
              <span className="min-w-0 truncate">{copy.inputColumnTitle}</span>
            </h2>
            <TextFileUploadButton
              label={copy.uploadTextFile}
              title={copy.uploadTextFileTooltip}
              onTextLoaded={(text) => {
                setInput(text);
                clearError();
                setPreview(null);
              }}
              onInvalid={() => setErrorKey("uploadFileRejectNotText")}
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-zinc-200/90 dark:border-zinc-600/60">
              <LineNumberedField
                value={input}
                onChange={setInput}
                placeholder={copy.inputPlaceholder}
                ariaLabel={copy.inputColumnTitle}
                mono
              />
            </div>
            <p className="m-0 text-xs text-text-muted">
              {copy.maxDecodedHint.replace("{mb}", mbLimit)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={runPreview}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium text-white transition-colors",
                  "bg-[#1576BB] hover:bg-[#125d99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                )}
              >
                <IconDecode className="size-3.5 shrink-0 opacity-95" />
                {copy.decodePreviewAction}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-transparent px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors",
                  "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
                  "dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                )}
              >
                <IconTrash className="size-3.5 shrink-0" />
                {copy.clearAll}
              </button>
            </div>
          </div>
        </section>

        <section
          className={cn(panelShellClass, PANEL_FIXED_H, "flex flex-col")}
          aria-labelledby={previewRegionId}
        >
          <div className={titleBarClass}>
            <h2
              id={previewRegionId}
              className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-text"
            >
              <IconColumnBase64Text className="size-4 shrink-0 text-text-secondary" />
              <span className="min-w-0 truncate">{copy.previewColumnTitle}</span>
            </h2>
          </div>
          <div
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:p-4"
          >
            {errorMessage ? (
              <p className="m-0 text-sm text-red-600 dark:text-red-400" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {showTextHint ? (
              <p className="m-0 rounded-md border border-zinc-200/90 bg-sky-50/60 px-2.5 py-2 text-xs text-text-secondary dark:border-zinc-600 dark:bg-sky-950/30">
                {copy.textLikeHintBefore}
                <Link
                  href={textDecodeHref}
                  className="font-medium text-[#1576BB] underline decoration-[#1576BB]/35 underline-offset-2 hover:decoration-[#1576BB]"
                >
                  {copy.textLikeHintLink}
                </Link>
                {copy.textLikeHintAfter}
              </p>
            ) : null}

            {preview ? (
              <>
                <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-xs">
                  <dt className="m-0 text-text-muted">{copy.metaSizeLabel}</dt>
                  <dd className="m-0 font-mono tabular-nums text-text">{preview.bytes.length} B</dd>
                  <dt className="m-0 text-text-muted">{copy.metaMimeLabel}</dt>
                  <dd className="m-0 min-w-0 break-all font-mono text-[0.7rem] text-text">
                    {preview.mime}
                  </dd>
                  <dt className="m-0 self-center text-text-muted">{copy.metaFilenameLabel}</dt>
                  <dd className="m-0 min-w-0">
                    <input
                      type="text"
                      value={downloadName}
                      onChange={(e) => setDownloadName(e.target.value)}
                      className={cn(
                        "w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-text",
                        "dark:border-zinc-600 dark:bg-zinc-950",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                      )}
                      placeholder={copy.filenamePlaceholder}
                      aria-label={copy.metaFilenameLabel}
                    />
                  </dd>
                </dl>

                <div
                  className={cn(
                    "flex min-h-[10rem] flex-1 flex-col overflow-hidden rounded-md border border-zinc-200/90 bg-white",
                    "dark:border-zinc-600 dark:bg-zinc-950",
                  )}
                >
                  {objectUrl && previewMime.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- blob preview
                    <img
                      src={objectUrl}
                      alt=""
                      className="mx-auto max-h-48 max-w-full object-contain p-2"
                    />
                  ) : objectUrl && previewMime.startsWith("video/") ? (
                    <video
                      src={objectUrl}
                      controls
                      playsInline
                      className="max-h-48 w-full object-contain p-1"
                      preload="metadata"
                    />
                  ) : objectUrl && previewMime.startsWith("audio/") ? (
                    <div className="flex flex-1 items-center justify-center p-3">
                      <audio src={objectUrl} controls className="w-full max-w-xs" preload="metadata" />
                    </div>
                  ) : objectUrl && previewMime === "application/pdf" ? (
                    <iframe
                      title={copy.previewPdfTitle}
                      src={objectUrl}
                      className="min-h-[12rem] w-full flex-1 border-0"
                    />
                  ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
                      <p className="m-0 text-sm font-medium text-text-secondary">
                        {copy.previewBinaryTitle}
                      </p>
                      <p className="m-0 max-w-[18rem] text-xs text-text-muted">
                        {copy.unknownTypeHint}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={downloadFile}
                  className={cn(
                    "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md px-3.5 py-2.5 text-sm font-medium text-white transition-colors",
                    "bg-[#1576BB] hover:bg-[#125d99]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                  )}
                >
                  <IconArrowDownTray className="size-4 shrink-0" />
                  {copy.downloadAction}
                </button>
              </>
            ) : (
              <p className="m-0 flex flex-1 items-center justify-center text-center text-sm text-text-muted">
                {copy.previewPlaceholder}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="max-w-prose space-y-3 border-t border-border pt-8 text-sm text-text-secondary leading-relaxed">
        <h3 className="text-sm font-medium text-text">{copy.supplementTitle}</h3>
        <p className="m-0">{copy.supplementP1}</p>
        <p className="m-0">{copy.supplementP2}</p>
        <p className="m-0">{copy.supplementP3}</p>
      </div>
    </div>
  );
}
