"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64 } from "@/lib/base64";
import { cn } from "@/lib/utils";
import { IconColumnBase64Text } from "@/components/tools/base64/base64-text-column-icons";
import { LineNumberedField } from "@/components/tools/base64/line-numbered-field";
import { isPlausibleTextUpload } from "@/components/tools/base64/text-file-upload-button";
import { ToolTitleBarTextButton } from "@/components/ui/tool-title-bar-text-button";
import {
  copyResultBubbleClassName,
  toolColumnCardFullBleedClass,
  toolSectionHeadingClass,
  toolSectionHeadingIconClass,
  toolSectionTitleActionsClass,
  toolSectionTitleBarClass,
} from "@/lib/ui/tool-surface";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

const outputColClass = toolColumnCardFullBleedClass;

type Copy = Messages["tools"]["base64FileEncode"];

type PreviewMode =
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
  if (t === "application/zip" || t === "application/x-zip-compressed") return true;
  if (t === "application/x-rar-compressed" || t === "application/vnd.rar") return true;
  if (t === "application/x-7z-compressed" || t === "application/7z-compressed")
    return true;
  if (t === "application/gzip" || t === "application/x-gzip") return true;
  if (
    t === "application/x-tar" ||
    t === "application/x-bzip2" ||
    t === "application/x-lzma"
  ) {
    return true;
  }
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
  if (!file) return "generic";
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

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

function buildMultiDownloadFilename(): string {
  const shortId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(16).slice(2, 10).padEnd(8, "0");
  return `files-base64-${shortId}.txt`;
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
        "inline-flex h-7 min-w-0 max-w-[min(100%,10rem)] cursor-pointer items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-2 text-left shadow-none transition-colors dark:border-zinc-600 dark:bg-zinc-900",
        "hover:border-zinc-400 hover:bg-zinc-50 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/80",
        "disabled:cursor-not-allowed disabled:opacity-45",
      )}
    >
      <span className="min-w-0 truncate text-xs font-bold uppercase text-text">
        {label}
      </span>
      <span
        className={cn(
          "relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors",
          checked ? "bg-[#0284c7]" : "bg-zinc-300 dark:bg-zinc-600",
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

function FileTypeGlyph({ mode, className }: { mode: PreviewMode; className?: string }) {
  const c = className;
  if (mode === "image") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.5} />
        <circle cx="8.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
        <path d="m3 16 5-5 4.5 4.5L17 10l4 4.5" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }
  if (mode === "video") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <rect x="3" y="6" width="14" height="12" rx="1.5" strokeWidth={1.5} />
        <path d="m19 8 4 4-4 4v-8Z" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (mode === "audio") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M9 18V6l9-2v12"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 12c0 1.1.4 2 1 2.2" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }
  if (mode === "text") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M8 6h12M8 12h12M8 18h6"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <path
          d="M5 3h-1v18h1"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (mode === "archive") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
        <path
          d="M8 3h8v2H8V3Z"
          strokeWidth={1.5}
        />
        <rect x="6" y="5" width="12" height="16" rx="1" strokeWidth={1.5} />
        <path d="M10 9h4M10 13h4" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M8 4h4l3 3v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileChip({
  file,
  onRemove,
  removeAriaLabel,
}: {
  file: File;
  onRemove: () => void;
  removeAriaLabel: string;
}) {
  const mode = useMemo(() => getPreviewMode(file), [file]);
  return (
    <div
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-border",
        "bg-surface-raised px-2 py-1.5",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <FileTypeGlyph
        mode={mode}
        className="size-4 shrink-0 text-accent"
      />
      <span className="min-w-0 max-w-[10rem] truncate text-xs font-medium text-text sm:max-w-[14rem]" title={file.name}>
        {file.name}
      </span>
      <button
        type="button"
        className="ml-0.5 shrink-0 rounded border-0 bg-transparent p-0.5 text-text-muted transition-colors hover:text-text"
        aria-label={removeAriaLabel}
        onClick={onRemove}
      >
        <span className="sr-only">{removeAriaLabel}</span>
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path d="M18 6 6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </button>
    </div>
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

export function FileBase64EncodePanel({ copy }: { copy: Copy }) {
  const uploadRegionId = useId();
  const fileInputId = useId();
  const outputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);
  const dragDepthRef = useRef(0);

  const [files, setFiles] = useState<File[]>([]);
  const [out, setOut] = useState("");
  const [dataUrl, setDataUrl] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);

  const nLabel = String(MAX_FILE_COUNT);
  const isBusy = isEncoding;

  const addFilesFromList = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || (Array.isArray(list) ? list.length : list.length) === 0) {
        return;
      }
      const arr = Array.isArray(list) ? list : Array.from(list);
      setError(null);
      let anyTooLarge = false;
      for (const f of arr) {
        if (f.size > MAX_FILE_BYTES) {
          anyTooLarge = true;
          break;
        }
      }
      if (anyTooLarge) {
        setError(copy.errorTooLarge.replace("{mb}", String(MAX_FILE_BYTES / (1024 * 1024))));
      }
      setFiles((prev) => {
        const next = [...prev];
        for (const f of arr) {
          if (next.length >= MAX_FILE_COUNT) break;
          if (f.size > MAX_FILE_BYTES) continue;
          next.push(f);
        }
        return next;
      });
    },
    [copy.errorTooLarge],
  );

  const onPick = () => inputRef.current?.click();

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files;
    const picked = raw && raw.length > 0 ? Array.from(raw) : [];
    e.target.value = "";
    if (picked.length > 0) {
      addFilesFromList(picked);
    }
  };

  const removeAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    dragDepthRef.current = 0;
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
    setOut("");
    setError(null);
    setCopyHint(null);
    setIsEncoding(false);
  };

  useEffect(() => {
    if (files.length === 0) {
      setOut("");
      setIsEncoding(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsEncoding(true);
      setError(null);
      setCopyHint(null);
      try {
        const parts: string[] = [];
        for (const file of files) {
          if (cancelled) return;
          if (file.size > MAX_FILE_BYTES) {
            setError(
              copy.errorTooLarge.replace("{mb}", String(MAX_FILE_BYTES / (1024 * 1024))),
            );
            return;
          }
          const label = file.name.replace(/\r?\n/g, " ");
          const marker = copy.outputFileMarker.replace("{name}", label);
          if (dataUrl) {
            const s = await readAsDataUrl(file);
            if (cancelled) return;
            parts.push(`${marker}\n${s}`);
          } else {
            const buf = await file.arrayBuffer();
            if (cancelled) return;
            parts.push(`${marker}\n${bytesToBase64(new Uint8Array(buf))}`);
          }
        }
        if (!cancelled) setOut(parts.join("\n\n"));
      } catch {
        if (!cancelled) setError(copy.errorRead);
      } finally {
        if (!cancelled) setIsEncoding(false);
      }
    })();
    return () => {
      cancelled = true;
      setIsEncoding(false);
    };
  }, [files, dataUrl, copy.errorTooLarge, copy.errorRead, copy.outputFileMarker]);

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
    const name = buildMultiDownloadFilename();
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const successFlatClass = cn(
    "translate-y-0 shadow-none border border-[#15803d] bg-[#16a34a] text-white",
    "hover:border-[#166534] hover:bg-[#15803d] hover:text-white hover:shadow-none",
    "dark:border-[#4ade80] dark:bg-[#16a34a] dark:text-white",
    "dark:hover:border-[#86efac] dark:hover:bg-[#15803d] dark:hover:text-white",
  );
  const saveFlatClass = cn(
    "translate-y-0 shadow-none border border-[#5b21b6] bg-[#7c3aed] text-white",
    "hover:border-[#4c1d95] hover:bg-[#6d28d9] hover:text-white hover:shadow-none",
    "dark:border-[#a78bfa] dark:bg-[#7c3aed] dark:text-white",
    "dark:hover:border-[#c4b5fd] dark:hover:bg-[#6d28d9] dark:hover:text-white",
  );
  const titleBarButtonTextClass =
    "h-7 px-2 text-xs font-bold uppercase [&>span:first-child>svg]:size-4";
  const dangerInlineClass = cn(
    "h-7 rounded-md border border-[#b91c1c] bg-[#dc2626] px-2 text-xs font-bold text-white uppercase",
    "hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-40",
  );

  const busyLabel = copy.encodingBusy;

  return (
    <div className="flex flex-col gap-5">
      <input
        id={fileInputId}
        ref={inputRef}
        type="file"
        className="sr-only"
        multiple
        onChange={onFileInputChange}
        aria-label={copy.inputColumnTitle}
      />

      <section
        className="w-full min-w-0 rounded-lg border border-zinc-200/90 bg-main-bg p-3 sm:p-4 dark:border-zinc-600/50"
        role="region"
        aria-labelledby={uploadRegionId}
      >
        <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
          <h2 id={uploadRegionId} className="m-0 text-sm font-semibold text-text">
            {copy.inputColumnTitle}
          </h2>
          {files.length > 0 ? (
            <button
              type="button"
              className={cn(dangerInlineClass, "shrink-0")}
              onClick={clearAll}
              disabled={isBusy}
            >
              <span className="inline-flex items-center gap-1">
                <IconTrash className="size-3" />
                {copy.clearAll}
              </span>
            </button>
          ) : null}
        </div>
        <div
          role="presentation"
          tabIndex={isBusy || files.length >= MAX_FILE_COUNT ? -1 : 0}
          onClick={() => {
            if (isBusy) return;
            if (files.length >= MAX_FILE_COUNT) return;
            onPick();
          }}
          onKeyDown={(e) => {
            if (isBusy) return;
            if (files.length >= MAX_FILE_COUNT) return;
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
            const dropped = e.dataTransfer.files;
            if (dropped && dropped.length > 0) {
              addFilesFromList(Array.from(dropped));
            }
          }}
          className={cn(
            "w-full min-h-[4.5rem] rounded-lg border-2 border-dashed px-3 py-3 transition-colors sm:px-4 sm:py-4",
            "outline-none focus-within:ring-2 focus-within:ring-accent/25",
            isBusy && "pointer-events-none opacity-60",
            !isBusy && files.length < MAX_FILE_COUNT && "cursor-pointer",
            dragOver
              ? "border-accent bg-accent-muted/30"
              : "border-zinc-300 dark:border-zinc-600",
          )}
        >
          {files.length === 0 ? (
            <label
              htmlFor={fileInputId}
              className="flex min-h-[4.5rem] w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <IconUploadZone className="size-8 shrink-0 text-zinc-500 dark:text-zinc-400" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm text-text">
                  {copy.dropZoneHint.replace("{n}", nLabel)}
                </p>
                <p className="m-0 mt-1 text-[11px] leading-relaxed text-text-secondary">
                  {copy.uploadZoneFormatsLine}
                </p>
                <p className="m-0 mt-1 text-[11px] text-text-muted">
                  {copy.uploadMaxFilesLine.replace("{n}", nLabel)}
                </p>
              </div>
            </label>
          ) : (
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:min-h-10">
              {files.map((f, i) => (
                <FileChip
                  key={`${f.name}-${f.size}-${f.lastModified}-${i}`}
                  file={f}
                  onRemove={() => removeAt(i)}
                  removeAriaLabel={copy.removeFileAriaLabel.replace("{name}", f.name)}
                />
              ))}
              {files.length < MAX_FILE_COUNT ? (
                <label
                  htmlFor={fileInputId}
                  className="ml-auto min-w-0 flex-1 cursor-pointer text-right text-sm leading-snug text-text-secondary select-none hover:text-text"
                  onClick={(e) => e.stopPropagation()}
                >
                  {copy.dropZoneHint.replace("{n}", nLabel)}
                </label>
              ) : null}
            </div>
          )}
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </section>

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
                className={cn(successFlatClass, titleBarButtonTextClass)}
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
              className={cn(saveFlatClass, titleBarButtonTextClass)}
              icon={<IconArrowDownTray />}
              onClick={saveAs}
            >
              {copy.saveAs}
            </ToolTitleBarTextButton>
          </div>
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f3f4f6] dark:bg-zinc-900">
          {isEncoding ? (
            <p className="m-0 border-b border-zinc-200/90 bg-[#f3f4f6] px-3 py-1.5 text-xs text-text-secondary dark:border-zinc-700 dark:bg-zinc-800/70">
              {busyLabel}
            </p>
          ) : null}
          <LineNumberedField
            value={out}
            readOnly
            showGutter={false}
            placeholder={isEncoding ? busyLabel : copy.outputPlaceholder}
            ariaLabel={copy.outputColumnTitle}
            className="min-h-[16rem] bg-[#f3f4f6] dark:bg-zinc-900"
            textClassName="text-sm leading-6"
            textareaRef={outputTextareaRef}
          />
        </div>
      </section>

      <div className="max-w-prose space-y-3 border-t border-border pt-6 text-sm text-text-secondary leading-relaxed">
        <h3 className="text-sm font-medium text-text">{copy.supplementTitle}</h3>
        <p className="m-0">{copy.supplementP1}</p>
        <p className="m-0">{copy.supplementP2}</p>
        <p className="m-0">{copy.supplementP3}</p>
      </div>
    </div>
  );
}
