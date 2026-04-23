"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64 } from "@/lib/base64";
import { cn } from "@/lib/utils";
import { IconColumnBase64Text } from "@/components/tools/base64/base64-text-column-icons";
import { LineNumberedField } from "@/components/tools/base64/line-numbered-field";
import { isPlausibleTextUpload } from "@/components/tools/base64/text-file-upload-button";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const PREVIEW_TEXT_BYTES = 64 * 1024;

const titleBarClass =
  "flex flex-wrap items-center gap-2 border-b border-zinc-200/90 bg-zinc-100 px-3 py-2 sm:px-4 dark:border-zinc-600 dark:bg-zinc-800/95";
const outputColClass = cn(
  "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-700/90 dark:bg-zinc-900",
);

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

/** 信息区用：小写单位，与日志式展示一致 */
function formatFileSizeCompact(bytes: number): string {
  if (bytes < 1024) return `${bytes} b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}mb`;
}

function IconEncode({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
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

/** 未选文件 / 普通文件：默认文档轮廓 */
function IconPreviewDefaultFile({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        fill="currentColor"
        fillOpacity={0.12}
        d="M12 8a4 4 0 0 1 4-4h24l12 12v36a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V8Z"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        d="M40 4v12h12M12 8a4 4 0 0 1 4-4h20M12 60V8a4 4 0 0 1 4-4h24l12 12v40a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4Z"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.4}
        d="M20 32h20M20 40h16"
      />
    </svg>
  );
}

/** 压缩包示意图：分层文件夹 + 拉链感竖线 */
function IconPreviewArchive({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        fill="currentColor"
        fillOpacity={0.1}
        d="M8 20h20l4-4h20a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        d="M8 20h20l4-4h20a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V24a4 4 0 0 1 4-4Z"
      />
      <path
        fill="currentColor"
        fillOpacity={0.14}
        d="M20 8h10l2 2H52v8H8V10a2 2 0 0 1 2-2Z"
      />
      <rect x="10" y="4" width="20" height="8" rx="1.5" stroke="currentColor" strokeWidth={1.2} fill="none" />
      <path
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        d="M30 28v24M32 30v2M32 35v2M32 40v2M32 45v2M32 50v2M34 28v24"
        strokeOpacity={0.45}
      />
    </svg>
  );
}

const filePreviewBoxClass = cn(
  "h-32 w-full min-w-0 shrink-0 overflow-hidden",
  "bg-white dark:bg-zinc-950",
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
            <IconPreviewDefaultFile className="h-10 w-10 shrink-0 text-zinc-300 dark:text-zinc-600" />
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
          <IconPreviewArchive className="h-[4.5rem] w-[4.5rem] shrink-0 text-zinc-300 dark:text-zinc-600" />
        ) : (
          <IconPreviewDefaultFile className="h-[4.5rem] w-[4.5rem] shrink-0 text-zinc-300 dark:text-zinc-600" />
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
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1",
        "border-zinc-200 bg-white text-text-secondary dark:border-zinc-600 dark:bg-zinc-900",
        "hover:border-zinc-300 dark:hover:border-zinc-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
      )}
    >
      <span className="text-[0.7rem] font-medium leading-none">{label}</span>
      <span
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#1576BB]" : "bg-zinc-300 dark:bg-zinc-600",
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

export function FileBase64EncodePanel({ copy }: { copy: Copy }) {
  const fileInputId = useId();
  const outputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [out, setOut] = useState("");
  const [dataUrl, setDataUrl] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [autoEncode, setAutoEncode] = useState(true);

  const onPick = () => inputRef.current?.click();

  const applyFile = useCallback((f: File | null) => {
    if (!f) return;
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
    setError(null);
    setOut("");
    setCopyHint(null);
    if (!file) {
      setError(copy.errorPick);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(
        copy.errorTooLarge.replace("{mb}", String(MAX_FILE_BYTES / (1024 * 1024))),
      );
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
  };

  const copyOut = async () => {
    if (!out) return;
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
    const name = file ? buildDownloadName(file) : "file-base64.txt";
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
        className="grid grid-cols-1 gap-5 gap-x-4 sm:gap-x-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-stretch"
      >
        <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
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
              onClick={onPick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick();
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current += 1;
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current -= 1;
                if (dragDepthRef.current <= 0) {
                  dragDepthRef.current = 0;
                  setDragOver(false);
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragDepthRef.current = 0;
                setDragOver(false);
                const f = e.dataTransfer.files?.[0] ?? null;
                applyFile(f);
              }}
              className={cn(
                "flex min-h-[11.5rem] shrink-0 cursor-pointer flex-col items-center justify-center gap-2 text-center transition-colors sm:min-h-[12.5rem]",
                "overflow-hidden rounded-lg border border-zinc-200/90 dark:border-zinc-600/50",
                "outline-none focus-visible:ring-2 focus-visible:ring-[#1576BB]/30",
                dragOver
                  ? "bg-sky-100 dark:bg-sky-900/55"
                  : "bg-sky-50 dark:bg-sky-950/45",
              )}
            >
              {!file ? (
                <>
                  <IconUploadZone className="size-8 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <p className="m-0 max-w-[22rem] text-base font-medium text-text">
                    {copy.dropZoneHint}
                  </p>
                  <div className="w-full max-w-[22rem] space-y-1 text-center text-xs leading-relaxed text-text-secondary">
                    <p className="m-0">{copy.uploadZoneFormatsLine}</p>
                    <p className="m-0">
                      {copy.uploadZoneSizeLine.replace(
                        "{mb}",
                        String(MAX_FILE_BYTES / (1024 * 1024)),
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex w-full min-w-0 flex-col items-center justify-center gap-1.5">
                  <IconUploadZone className="size-7 shrink-0 text-[#125d99] dark:text-[#3d93c9]" />
                  <p className="m-0 text-sm font-medium text-text-secondary">
                    {copy.dropZoneReplace}
                  </p>
                  <p className="m-0 max-w-[22rem] text-center text-xs leading-relaxed text-text-secondary">
                    {copy.uploadZoneSizeLine.replace(
                      "{mb}",
                      String(MAX_FILE_BYTES / (1024 * 1024)),
                    )}
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
            <div className="border-b border-zinc-200/80 bg-zinc-100/70 px-3 py-2 text-xs font-medium text-text-secondary dark:border-zinc-600/40 dark:bg-zinc-800/60">
              {copy.fileInfoTitle}
            </div>
            <div className="bg-zinc-50/40 px-3 py-3 dark:bg-zinc-800/25">
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

          <div className="mt-auto flex w-full min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-sm text-text-secondary sm:pt-0.5">
              <input
                type="checkbox"
                className="size-3.5 shrink-0 rounded border-zinc-300 accent-[#1576BB] dark:border-zinc-600"
                checked={autoEncode}
                onChange={(e) => setAutoEncode(e.target.checked)}
              />
              <span>{copy.autoEncode}</span>
            </label>
            <div className="flex min-h-0 min-w-0 flex-1 gap-2">
              <button
                type="button"
                onClick={() => void encode()}
                className={cn(
                  "flex-[2] basis-0 inline-flex min-h-10 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors",
                  "bg-[#1576BB] hover:bg-[#125d99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
                )}
              >
                <IconEncode className="size-3.5 shrink-0 opacity-95" />
                {copy.encodeAction}
              </button>
              <button
                type="button"
                onClick={clearAll}
                className={cn(
                  "flex-[1] basis-0 inline-flex min-h-10 min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-transparent px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors",
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
        </div>

        <section className={outputColClass} aria-labelledby={outputId}>
          <div className={titleBarClass}>
            <h2
              id={outputId}
              className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-text"
            >
              <IconColumnBase64Text className="size-4 shrink-0 text-text-secondary" />
              <span className="min-w-0 truncate">{copy.outputColumnTitle}</span>
            </h2>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <DataUrlSwitch
                checked={dataUrl}
                onChange={setDataUrl}
                label={copy.dataUrlToggleLabel}
                ariaLabel={copy.asDataUrl}
              />
              <ToolbarIconButton
                label={copy.copyOutput}
                onClick={copyOut}
                disabled={!out}
              >
                <IconClipboard className="size-4" />
              </ToolbarIconButton>
              <ToolbarIconButton
                label={copy.saveAs}
                onClick={saveAs}
                disabled={!out}
              >
                <IconArrowDownTray className="size-4" />
              </ToolbarIconButton>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-900">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <LineNumberedField
                value={out}
                readOnly
                showGutter={false}
                ariaLabel={copy.outputColumnTitle}
              />
            </div>
            {copyHint ? (
              <p
                className="shrink-0 border-t border-zinc-100 px-4 py-2 text-xs text-text-secondary dark:border-zinc-800"
                role="status"
              >
                {copyHint}
              </p>
            ) : null}
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
