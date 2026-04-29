"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64 } from "@/lib/base64";
import { cn } from "@/lib/utils";
import { IconColumnBase64Text } from "@/components/tools/base64/base64-text-column-icons";
import { LineNumberedField } from "@/components/tools/base64/line-numbered-field";
import { isPlausibleTextUpload } from "@/components/tools/base64/text-file-upload-button";
import {
  toolBase64SoftPrimaryClass,
  ToolBarAutoLiftSwitch,
} from "@/components/ui/tool-auto-encode-lift-switch";
import { ToolTitleBarTextButton } from "@/components/ui/tool-title-bar-text-button";
import {
  copyResultBubbleClassName,
  toolChromeTitleBarOutlineButtonClass,
  toolColumnCardFullBleedClass,
  toolSectionBarTitlePlainClass,
  toolSectionHeadingClass,
  toolSectionHeadingIconClass,
  toolSectionTitleActionsClass,
  toolSectionTitleBarClass,
} from "@/lib/ui/tool-surface";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const PREVIEW_TEXT_BYTES = 64 * 1024;
const HEAVY_FILE_BYTES = 2 * 1024 * 1024;

const outputColClass = toolColumnCardFullBleedClass;

type Copy = Messages["tools"]["base64FileEncode"];

type PreviewMode =
  | "empty"
  | "image"
  | "video"
  | "audio"
  | "text"
  | "archive"
  | "generic";

const IMAGE_EXT = new Set(
  "jpg,jpeg,png,gif,webp,bmp,ico,svg,avif,heic,heif,tif,tiff".split(","),
);
const VIDEO_EXT = new Set(
  "mp4,webm,mov,avi,mkv,m4v,wmv,flv,ogv,3gp,3g2,mpg,mpeg,m2ts,ts".split(","),
);
const AUDIO_EXT = new Set(
  "mp3,wav,ogg,oga,flac,m4a,aac,opus,wma,ape,aiff,alac,mid,midi".split(","),
);
const ARCHIVE_EXT = new Set(
  "zip,rar,7z,tar,gz,tgz,bz2,bz,xz,zst,lz,lzma,cab,arj,ace,iso".split(","),
);

function isArchiveMime(m: string): boolean {
  const t = m.toLowerCase();
  if (t === "application/zip" || t === "application/x-zip-compressed")
    return true;
  if (t === "application/x-rar-compressed" || t === "application/vnd.rar")
    return true;
  if (t === "application/x-7z-compressed" || t === "application/7z-compressed")
    return true;
  if (t === "application/gzip" || t === "application/x-gzip") return true;
  if (t === "application/x-tar" || t === "application/x-bzip2" || t === "application/x-lzma")
    return true;
  if (t === "application/x-xz" || t === "application/zstd" || t === "application/x-compress")
    return true;
  return false;
}

function getExtLower(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0) return "";
  return name.slice(i + 1).toLowerCase();
}

function getPreviewMode(file: File | null): PreviewMode {
  if (!file) return "empty";
  const t = (file.type || "").toLowerCase();
  const ext = getExtLower(file.name);
  if (t.startsWith("image/")) return "image";
  if (ext && IMAGE_EXT.has(ext)) return "image";
  if (t.startsWith("video/")) return "video";
  if (ext && VIDEO_EXT.has(ext)) return "video";
  if (t.startsWith("audio/")) return "audio";
  if (ext && AUDIO_EXT.has(ext)) return "audio";
  if (isPlausibleTextUpload(file)) return "text";
  if (isArchiveMime(t) || (ext && ARCHIVE_EXT.has(ext))) return "archive";
  return "generic";
}

function getFileFormatLabel(file: File, noExtCopy: string): string {
  const n = file.name;
  const i = n.lastIndexOf(".");
  if (i > 0 && i < n.length - 1) return n.slice(i).toLowerCase();
  return noExtCopy;
}

function buildDownloadName(file: File): string {
  const ext = "txt";
  const base = file.name.replace(/[/\\?%*:|"<>]/g, "_");
  if (!base || base === "." || base === "_") {
    return `file-base64.${ext}`;
  }
  const i = base.lastIndexOf(".");
  if (i <= 0) {
    return `${base}-base64.${ext}`;
  }
  return `${base.slice(0, i)}-base64.${ext}`;
}

function buildTimestampedDownloadName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `base64encode-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.txt`;
}

/** 信息区用：小写单位，与日志式展示一致 */
function formatFileSizeCompact(bytes: number): string {
  if (bytes < 1024) return `${bytes} b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}mb`;
}

function IconEncode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M4 12h14" strokeWidth={2} strokeLinecap="round" />
      <path d="m13 7 5 5-5 5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

function IconUploadZone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      />
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m17 8-5-5-5 5" />
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
    </svg>
  );
}

function IconInfo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
      <path d="M12 10.25v6" strokeWidth={1.8} strokeLinecap="round" />
      <circle cx="12" cy="7.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const filePreviewBoxClass = cn(
  "h-32 w-full min-w-0 shrink-0 overflow-hidden",
  "bg-zinc-100 dark:bg-zinc-900",
);

function FilePreviewTextBlock({
  file,
  copy,
}: {
  file: File;
  copy: Copy;
}) {
  const [textBody, setTextBody] = useState<string | null>(null);
  const [textStatus, setTextStatus] = useState<"loading" | "ok" | "err">("loading");

  useEffect(() => {
    const chunk =
      file.size > PREVIEW_TEXT_BYTES
        ? file.slice(0, PREVIEW_TEXT_BYTES)
        : file;
    const reader = new FileReader();
    reader.onload = () => {
      const s = typeof reader.result === "string" ? reader.result : "";
      setTextStatus("ok");
      if (file.size > PREVIEW_TEXT_BYTES) {
        setTextBody(`${s}\n\n${copy.textPreviewTruncated}`);
      } else {
        setTextBody(s);
      }
    };
    reader.onerror = () => {
      setTextStatus("err");
      setTextBody(null);
    };
    reader.readAsText(chunk, "UTF-8");
  }, [file, copy.textPreviewTruncated]);

  if (textStatus === "loading") {
    return (
      <p className="m-0 flex min-h-0 flex-1 items-center justify-center px-1 text-center text-xs text-text-muted">
        {copy.textPreviewLoading}
      </p>
    );
  }
  if (textStatus === "err") {
    return (
      <p
        className="m-0 flex min-h-0 flex-1 items-center justify-center px-1 text-center text-xs text-text-muted"
        role="alert"
      >
        {copy.textPreviewReadError}
      </p>
    );
  }
  return (
    <pre
      className="m-0 h-full min-h-0 w-full flex-1 overflow-auto overflow-x-auto whitespace-pre-wrap break-words p-1 text-left text-[0.65rem] leading-snug text-text [scrollbar-gutter:stable]"
      role="log"
      aria-label={file.name}
    >
      {textBody}
    </pre>
  );
}

function FilePreviewPanel({ file, copy }: { file: File | null; copy: Copy }) {
  const mode = useMemo(() => getPreviewMode(file), [file]);
  const objectUrl = useMemo(() => {
    if (!file) return null;
    if (mode === "image" || mode === "video" || mode === "audio")
      return URL.createObjectURL(file);
    return null;
  }, [file, mode]);

  useEffect(() => {
    if (!objectUrl) return;
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return (
    <div
      className="shrink-0 w-full min-w-0"
      role="region"
      aria-label={copy.filePreviewLabel}
    >
      <div
        className={cn(
          filePreviewBoxClass,
          "p-1.5 sm:p-2",
          !file
            ? "flex items-center justify-center"
            : mode === "text"
              ? "flex min-h-0 flex-col"
              : "flex min-h-0 items-center justify-center",
        )}
      >
        {!file ? (
          <div className="flex max-w-[20rem] flex-col items-center justify-center gap-2 px-3 text-center">
            <p className="m-0 text-[0.7rem] leading-snug text-text-secondary">
              {copy.filePreviewEmptyHint}
            </p>
          </div>
        ) : mode === "text" && file ? (
          <div className="flex min-h-0 w-full flex-1 flex-col">
            <FilePreviewTextBlock
              key={`${file.name}-${file.size}-${file.lastModified}`}
              file={file}
              copy={copy}
            />
          </div>
        ) : mode === "image" && objectUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 本地 object URL 预览
          <img
            src={objectUrl}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : mode === "video" && objectUrl ? (
          <div className="flex h-full min-h-0 w-full items-center justify-center p-0.5">
            <video
              src={objectUrl}
              controls
              playsInline
              className="max-h-full w-full object-contain"
              aria-label={file.name}
              preload="metadata"
            />
          </div>
        ) : mode === "audio" && objectUrl ? (
          <div className="flex h-full w-full min-w-0 items-center justify-center px-2">
            <audio
              src={objectUrl}
              controls
              className="w-full [max-width:18rem]"
              aria-label={file.name}
              preload="metadata"
            />
          </div>
        ) : mode === "archive" ? (
          <p className="m-0 px-3 text-center text-[0.7rem] leading-snug text-text-secondary">
            {copy.filePreviewEmptyHint}
          </p>
        ) : (
          <p className="m-0 px-3 text-center text-[0.7rem] leading-snug text-text-secondary">
            {copy.filePreviewEmptyHint}
          </p>
        )}
      </div>
    </div>
  );
}

function DataUrlSwitch({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        toolChromeTitleBarOutlineButtonClass,
        "min-w-0 max-w-[min(100%,10rem)] shrink-0 justify-center gap-1.5 px-2",
      )}
    >
      <span className="min-w-0 truncate text-xs font-medium leading-tight text-text-secondary">
        {label}
      </span>
      <span
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#3a9ad8]" : "bg-zinc-300 dark:bg-zinc-600",
        )}
        aria-hidden
      >
        <span
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-3" : "translate-x-0",
          )}
        />
      </span>
    </button>
  );
}

export function FileBase64EncodePanel({ copy }: { copy: Copy }) {
  const inputRegionId = useId();
  const fileInputId = useId();
  const outputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dragDepthRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [out, setOut] = useState("");
  const [dataUrl, setDataUrl] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [autoEncode, setAutoEncode] = useState(true);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);
  const isBusy = isFileLoading || isEncoding;
  const busyHint = "Processing file, please wait...";

  const onPick = () => inputRef.current?.click();

  const applyFile = useCallback((f: File | null) => {
    if (!f) return;
    setIsFileLoading(f.size >= HEAVY_FILE_BYTES);
    setFile(f);
    setOut("");
    setError(null);
    setCopyHint(null);
  }, []);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    applyFile(f);
  };

  const encode = useCallback(async () => {
    setIsEncoding(true);
    setError(null);
    setOut("");
    setCopyHint(null);
    if (!file) {
      setError(copy.errorPick);
      setIsFileLoading(false);
      setIsEncoding(false);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(
        copy.errorTooLarge.replace("{mb}", String(MAX_FILE_BYTES / (1024 * 1024))),
      );
      setIsFileLoading(false);
      setIsEncoding(false);
      return;
    }
    try {
      if (dataUrl) {
        const s = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("read"));
          reader.readAsDataURL(file);
        });
        setOut(s);
      } else {
        const buf = await file.arrayBuffer();
        setOut(bytesToBase64(new Uint8Array(buf)));
      }
    } catch {
      setError(copy.errorRead);
    } finally {
      setIsFileLoading(false);
      setIsEncoding(false);
    }
  }, [copy, dataUrl, file]);

  useEffect(() => {
    if (!autoEncode || !file) return;
    void encode();
  }, [autoEncode, file, dataUrl, encode]);

  const clearAll = () => {
    setFile(null);
    dragDepthRef.current = 0;
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
    setOut("");
    setError(null);
    setCopyHint(null);
    setIsFileLoading(false);
    setIsEncoding(false);
  };

  useEffect(() => {
    if (!isFileLoading || autoEncode || !file) return;
    const timer = window.setTimeout(() => setIsFileLoading(false), 260);
    return () => window.clearTimeout(timer);
  }, [autoEncode, file, isFileLoading]);

  const copyOut = async () => {
    if (!out) return;
    outputTextareaRef.current?.focus();
    outputTextareaRef.current?.select();
    try {
      await navigator.clipboard.writeText(out);
      setCopyHint(copy.copied);
      window.setTimeout(() => setCopyHint(null), 2000);
    } catch {
      setCopyHint(copy.copyFailed);
      window.setTimeout(() => setCopyHint(null), 2500);
    }
  };

  const saveAs = () => {
    if (!out) return;
    const name = buildTimestampedDownloadName();
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <div
        className="grid grid-cols-1 gap-5 gap-x-4 sm:gap-x-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-stretch"
      >
        <div
          className="flex h-full min-h-0 min-w-0 flex-col gap-4 overflow-hidden rounded-lg border border-zinc-200/90 dark:border-zinc-600/50"
          role="region"
          aria-labelledby={inputRegionId}
        >
          <div className={toolSectionTitleBarClass}>
            <h2 id={inputRegionId} className={toolSectionHeadingClass}>
              <IconUploadZone className={toolSectionHeadingIconClass} />
              <span className="min-w-0 truncate">{copy.inputPanelTitle}</span>
            </h2>
            <div className={cn(toolSectionTitleActionsClass, "gap-x-2 gap-y-2")}>
              <ToolBarAutoLiftSwitch
                checked={autoEncode}
                onChange={setAutoEncode}
                label={copy.autoEncode}
                disabled={isBusy}
              />
              <ToolTitleBarTextButton
                variant="primary"
                className={toolBase64SoftPrimaryClass}
                disabled={isBusy}
                icon={<IconEncode className="opacity-95" />}
                onClick={() => void encode()}
              >
                {copy.encodeAction}
              </ToolTitleBarTextButton>
              <ToolTitleBarTextButton
                variant="outline"
                disabled={isBusy}
                icon={<IconTrash />}
                onClick={clearAll}
              >
                {copy.clearAll}
              </ToolTitleBarTextButton>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 px-3 pb-3 pt-0 sm:px-4 sm:pb-4 sm:pt-0.5">
          <input
            id={fileInputId}
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={onFileInputChange}
          />

          <div className="flex min-w-0 flex-col gap-3">
            <div
              role="button"
              tabIndex={0}
              aria-label={file ? copy.dropZoneReplace : copy.inputColumnTitle}
              onClick={() => {
                if (isBusy) return;
                onPick();
              }}
              onKeyDown={(e) => {
                if (isBusy) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick();
                }
              }}
              onDragEnter={(e) => {
                if (isBusy) return;
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current += 1;
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                if (isBusy) return;
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current -= 1;
                if (dragDepthRef.current <= 0) {
                  dragDepthRef.current = 0;
                  setDragOver(false);
                }
              }}
              onDragOver={(e) => {
                if (isBusy) return;
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                if (isBusy) return;
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current = 0;
                setDragOver(false);
                const f = e.dataTransfer.files?.[0] ?? null;
                applyFile(f);
              }}
              className={cn(
                "flex min-h-[9.5rem] shrink-0 cursor-pointer flex-col items-center justify-center gap-2 text-center transition-colors sm:min-h-[10.5rem]",
                "overflow-hidden rounded-lg border border-zinc-200/90 dark:border-zinc-600/50",
                "outline-none focus-visible:ring-2 focus-visible:ring-[#1576BB]/30",
                isBusy && "cursor-not-allowed opacity-75",
                dragOver
                  ? "bg-sky-100 dark:bg-sky-900/55"
                  : "bg-sky-50 dark:bg-sky-950/45",
              )}
            >
              {!file ? (
                <>
                  <IconUploadZone className="size-8 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBusy) return;
                      onPick();
                    }}
                    disabled={isBusy}
                    className={cn(
                      "inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium",
                      "border-zinc-300 bg-white text-text shadow-sm hover:bg-zinc-50",
                      "dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    {copy.pickFile}
                  </button>
                  <p className="m-0 max-w-[22rem] text-center text-[11px] leading-relaxed text-text-secondary">
                    Click or drop an file here.
                  </p>
                  <p className="m-0 max-w-[22rem] text-center text-xs leading-relaxed text-text-secondary">
                    {copy.uploadZoneFormatsLine.replace(/^Supported:\s*/i, "")}
                  </p>
                </>
              ) : (
                <div className="flex w-full min-w-0 flex-col items-center justify-center gap-1.5">
                  <IconUploadZone className="size-7 shrink-0 text-[#125d99] dark:text-[#3d93c9]" />
                  <p className="m-0 text-sm font-medium text-text-secondary">
                    {copy.dropZoneReplace}
                  </p>
                </div>
              )}
            </div>

            <div className="min-w-0 overflow-hidden rounded-lg border border-zinc-200/90 dark:border-zinc-600/50">
              <FilePreviewPanel file={file} copy={copy} />
            </div>
          </div>

          <div
            className={cn(
              "shrink-0 overflow-hidden rounded-lg border border-zinc-200/80",
              "dark:border-zinc-600/40",
            )}
            aria-live="polite"
          >
            <div className={toolSectionTitleBarClass}>
              <p className={cn(toolSectionBarTitlePlainClass, "flex w-full items-center gap-2")}>
                <IconInfo className={toolSectionHeadingIconClass} />
                <span className="min-w-0 truncate">{copy.fileInfoTitle}</span>
              </p>
            </div>
            <div className="bg-zinc-100 px-3 py-3 dark:bg-zinc-900">
              <dl className="m-0 grid min-w-0 grid-cols-[max-content_minmax(0,1fr)] items-center gap-x-2 gap-y-1.5 text-sm">
                <dt className="m-0 text-left text-xs text-text-muted">
                  {copy.fileInfoLabelName}
                </dt>
                <dd
                  className={cn(
                    "m-0 min-w-0 truncate text-left text-[0.7rem] leading-tight whitespace-nowrap",
                    file ? "text-text" : "text-text-muted",
                  )}
                  id={`${fileInputId}-name`}
                  title={file ? file.name : undefined}
                >
                  {file ? file.name : copy.fileInfoValueEmpty}
                </dd>
                <dt className="m-0 text-left text-xs text-text-muted">
                  {copy.fileInfoLabelFormat}
                </dt>
                <dd
                  className={cn(
                    "m-0 min-w-0 break-all text-left text-[0.7rem] leading-tight",
                    file ? "text-text" : "text-text-muted",
                  )}
                  id={`${fileInputId}-format`}
                >
                  {file
                    ? getFileFormatLabel(file, copy.fileFormatNoExtension)
                    : copy.fileInfoValueEmpty}
                </dd>
                <dt className="m-0 text-left text-xs text-text-muted">
                  {copy.fileInfoLabelSize}
                </dt>
                <dd
                  className={cn(
                    "m-0 min-w-0 text-left text-[0.7rem] leading-tight tabular-nums",
                    file ? "text-text" : "text-text-muted",
                  )}
                  id={`${fileInputId}-size`}
                >
                  {file
                    ? formatFileSizeCompact(file.size)
                    : copy.fileInfoValueEmpty}
                </dd>
              </dl>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          </div>
        </div>

        <section className={outputColClass} aria-labelledby={outputId}>
          <div className={toolSectionTitleBarClass}>
            <h2 id={outputId} className={toolSectionHeadingClass}>
              <IconColumnBase64Text className={toolSectionHeadingIconClass} />
              <span className="min-w-0 truncate">{copy.outputColumnTitle}</span>
            </h2>
            <div className={cn(toolSectionTitleActionsClass, "gap-x-2 gap-y-2")}>
              <DataUrlSwitch
                checked={dataUrl}
                onChange={setDataUrl}
                label={copy.dataUrlToggleLabel}
                ariaLabel={copy.asDataUrl}
                disabled={isBusy}
              />
              <div className="relative inline-flex">
                <ToolTitleBarTextButton
                  variant="outline"
                  disabled={!out || isBusy}
                  icon={<IconClipboard />}
                  onClick={copyOut}
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
                disabled={!out || isBusy}
                icon={<IconArrowDownTray />}
                onClick={saveAs}
              >
                {copy.saveAs}
              </ToolTitleBarTextButton>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              {isBusy ? (
                <p className="m-0 border-b border-zinc-200/80 bg-zinc-50 px-3 py-1.5 text-xs text-[#1576BB] dark:border-zinc-700 dark:bg-zinc-800/70">
                  {busyHint}
                </p>
              ) : null}
              <LineNumberedField
                value={out}
                readOnly
                showGutter={false}
                placeholder={isBusy ? busyHint : copy.outputPlaceholder}
                ariaLabel={copy.outputColumnTitle}
                className="bg-zinc-100 dark:bg-zinc-900"
                textareaRef={outputTextareaRef}
              />
            </div>
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
