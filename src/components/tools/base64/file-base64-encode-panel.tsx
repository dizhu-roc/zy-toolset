"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, MutableRefObject } from "react";
import type { Messages } from "@/i18n/dictionaries";
import { bytesToBase64 } from "@/lib/base64";
import { cn } from "@/lib/utils";
import {
  IconColumnBase64Text,
  IconColumnSourceText,
} from "@/components/tools/base64/base64-text-column-icons";
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
/** 静默上限，不在界面展示具体个数 */
const MAX_FILE_COUNT = 100;

/** items-stretch：换行时同一行/整格高度由最高项决定，上传区用 h-full 吃满 */
const FILE_LIST_GRID =
  "grid w-full min-w-0 grid-cols-2 content-start items-stretch gap-3 min-[420px]:grid-cols-3 min-[700px]:grid-cols-4 min-[1024px]:grid-cols-5 sm:gap-4";

const FILE_LIST_ITEM_SHELL =
  "h-full min-h-[12.5rem] w-full min-w-0 self-stretch";

/** 与 AddFileSlot 内预览区同高，保持两卡对齐 */
const FILE_CARD_PREVIEW = "h-32 w-full min-h-[8rem] shrink-0";

const outputColClass = toolColumnCardFullBleedClass;
const uploadSectionClass = toolColumnCardFullBleedClass;

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

function formatFileSize(n: number): string {
  if (n < 1000) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(n < 10_240 ? 2 : 1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(n < 10_485_760 ? 2 : 1)} MB`;
}

function buildDownloadFilenameForFile(file: File | undefined | null): string {
  if (!file) {
    return buildMultiDownloadFilename();
  }
  const base = file.name
    .replace(/\r?\n/g, " ")
    .replace(/[/\\?*:|"<>]/g, "_")
    .trim();
  if (!base) {
    return `file-base64.txt`;
  }
  const noExt = base.replace(/(\.[^./\\]+)+$/, "");
  return `${noExt || "file"}-base64.txt`;
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

function FileMediaOrGlyph({
  file,
  mode,
  onFallback,
}: {
  file: File;
  mode: PreviewMode;
  onFallback: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "image" || mode === "video" || mode === "audio") {
      const u = URL.createObjectURL(file);
      // 同步自 URL.createObjectURL，需在挂载时写入供渲染使用
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUrl(u);
      return () => {
        URL.revokeObjectURL(u);
      };
    }
  }, [file, mode]);

  if ((mode !== "image" && mode !== "video" && mode !== "audio") || !url) {
    return (
      <div className="flex h-full w-full items-center justify-center p-1">
        <FileTypeGlyph mode={mode} className="size-10 text-accent" />
      </div>
    );
  }
  if (mode === "image") {
    return (
      // 本地 object URL 预览，不适用 next/image
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={url}
        src={url}
        alt=""
        className="h-full w-full object-contain"
        onError={onFallback}
      />
    );
  }
  if (mode === "video") {
    return (
      <video
        key={url}
        src={url}
        className="h-full w-full object-contain"
        muted
        playsInline
        preload="metadata"
        onError={onFallback}
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center p-1">
      <audio
        key={url}
        src={url}
        className="w-full max-w-[9rem] scale-90"
        controls
        preload="metadata"
        onError={onFallback}
      />
    </div>
  );
}

function FileTextPreview({ file, copy }: { file: File; copy: Copy }) {
  const [textSample, setTextSample] = useState<
    string | "loading" | "error" | null
  >("loading");

  useEffect(() => {
    const part = file.slice(0, 12_000);
    const r = new FileReader();
    r.onload = () => {
      setTextSample(String(r.result ?? "").slice(0, 550));
    };
    r.onerror = () => setTextSample("error");
    r.readAsText(part);
  }, [file]);

  if (textSample === "loading") {
    return (
      <p className="m-0 line-clamp-3 overflow-hidden p-1 text-center text-[9px] leading-snug text-text-muted">
        {copy.textPreviewLoading}
      </p>
    );
  }
  if (textSample === "error" || !textSample) {
    return (
      <p className="m-0 p-1 text-center text-[9px] text-text-secondary">
        {textSample === "error" ? copy.textPreviewReadError : "—"}
      </p>
    );
  }
  return (
    <p
      className="m-0 line-clamp-3 overflow-hidden whitespace-pre-wrap p-1 text-center font-mono text-[8px] leading-tight text-text"
      title={file.name}
    >
      {textSample}
    </p>
  );
}

function IconXMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function FileEntryCard({
  file,
  selected,
  onSelect,
  onRemove,
  copy,
}: {
  file: File;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  copy: Copy;
}) {
  const mode = useMemo(() => getPreviewMode(file), [file]);
  const [mediaAsGlyph, setMediaAsGlyph] = useState(false);
  const mediaKey = `${file.name}-${file.size}-${file.lastModified}-${mode}`;

  const removeLabel = copy.removeFileAriaLabel.replace("{name}", file.name);

  function previewBody() {
    if (mode === "text") {
      return <FileTextPreview key={mediaKey} file={file} copy={copy} />;
    }
    if (mediaAsGlyph) {
      return (
        <FileTypeGlyph mode={mode} className="size-10 shrink-0 text-accent" />
      );
    }
    if (mode === "image" || mode === "video" || mode === "audio") {
      return (
        <FileMediaOrGlyph
          key={mediaKey + String(mediaAsGlyph)}
          file={file}
          mode={mode}
          onFallback={() => setMediaAsGlyph(true)}
        />
      );
    }
    return <FileTypeGlyph mode={mode} className="size-10 shrink-0 text-accent" />;
  }

  return (
    <div
      className={cn(
        "relative box-border flex w-full min-w-0 flex-col overflow-hidden rounded-lg border-2 bg-surface-raised p-2.5 text-left shadow-sm",
        FILE_LIST_ITEM_SHELL,
        "transition sm:p-3",
        selected
          ? "z-[1] border-zinc-600 dark:border-zinc-500"
          : "border-zinc-200/90 dark:border-zinc-600/60 hover:border-zinc-400/80 dark:hover:border-zinc-500/80",
      )}
    >
      <button
        type="button"
        className="absolute right-1.5 top-1.5 z-20 flex size-7 cursor-pointer items-center justify-center rounded-full border border-zinc-300/90 bg-white/95 text-text shadow-sm transition hover:bg-zinc-100/95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-zinc-600 dark:bg-zinc-800/95 dark:hover:bg-zinc-700"
        aria-label={removeLabel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
      >
        <span className="sr-only">{removeLabel}</span>
        <IconXMark className="size-3.5" />
      </button>
      <button
        type="button"
        className="flex w-full min-h-0 min-w-0 flex-1 flex-col p-0 pr-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 sm:pr-0"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={copy.fileCardSelectAriaLabel.replace("{name}", file.name)}
      >
        <div
          className={cn(
            FILE_CARD_PREVIEW,
            "flex cursor-pointer items-center justify-center overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800/90",
          )}
        >
          {previewBody()}
        </div>
        <div className="mt-2.5 space-y-2 text-left text-[10px] sm:text-xs">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 font-medium text-text-secondary">
              {copy.fileCardLabelName}
            </span>
            <span
              className="min-w-0 flex-1 truncate text-text"
              title={file.name}
            >
              {file.name}
            </span>
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="shrink-0 font-medium text-text-secondary">
              {copy.fileCardLabelSize}
            </span>
            <span
              className="min-w-0 flex-1 truncate text-text tabular-nums"
              title={formatFileSize(file.size)}
            >
              {formatFileSize(file.size)}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

function AddFileSlot({
  fileInputId,
  copy,
  isBusy,
  canAdd,
  dragOver,
  onPick,
  setDragOver,
  dragDepthRef,
  onDropList,
}: {
  fileInputId: string;
  copy: Copy;
  isBusy: boolean;
  canAdd: boolean;
  dragOver: boolean;
  onPick: () => void;
  setDragOver: (v: boolean) => void;
  dragDepthRef: MutableRefObject<number>;
  onDropList: (list: File[]) => void;
}) {
  if (!canAdd) {
    return null;
  }
  const active = dragOver;
  return (
    <div
      role="presentation"
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden rounded-xl border-2 border-dashed p-0 text-left text-text-secondary",
        FILE_LIST_ITEM_SHELL,
        "border-sky-400/55 bg-sky-50/60 dark:border-sky-500/40 dark:bg-sky-950/20",
        active
          ? "ring-2 ring-sky-400/35 ring-offset-0 dark:ring-sky-500/30"
          : "hover:border-sky-500/70",
      )}
      tabIndex={isBusy ? -1 : 0}
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
        const dropped = e.dataTransfer.files;
        if (dropped && dropped.length > 0) {
          onDropList(Array.from(dropped));
        }
      }}
    >
      <label
        htmlFor={fileInputId}
        className={cn(
          "flex h-full w-full min-h-0 min-w-0 flex-1 flex-col justify-center gap-2.5 p-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:gap-3",
          isBusy && "pointer-events-none opacity-50",
          !isBusy && "cursor-pointer",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-200/80 bg-white text-sky-600 min-[400px]:self-center sm:h-11 sm:w-11",
            "dark:border-sky-500/30 dark:bg-zinc-900/80 dark:text-sky-400/90",
            active && "bg-sky-100/80 dark:bg-sky-900/30",
          )}
        >
          <IconUploadZone className="size-5 sm:size-6" />
        </div>
        <div className="min-w-0 flex-1 self-stretch text-left min-[400px]:flex min-[400px]:flex-col min-[400px]:justify-center">
          <p className="m-0 text-sm font-semibold leading-snug text-text">
            {copy.dropZoneReplace}
          </p>
          <p className="m-0 mt-1.5 text-[11px] leading-relaxed text-text-secondary min-[400px]:mt-1.5 sm:text-xs">
            {copy.dropZoneHint}
          </p>
        </div>
      </label>
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [out, setOut] = useState("");
  const [dataUrl, setDataUrl] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isEncoding, setIsEncoding] = useState(false);

  const isBusy = isEncoding;
  const canAddMore = files.length < MAX_FILE_COUNT;

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
        if (next.length > prev.length) {
          setSelectedIndex(next.length - 1);
        }
        return next;
      });
    },
    [copy.errorTooLarge],
  );

  const onPick = () => inputRef.current?.click();

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files;
    const picked = raw && raw.length > 0 ? Array.from(raw) : [];
    e.target.value = "";
    if (picked.length > 0) {
      addFilesFromList(picked);
    }
  };

  const removeAt = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setSelectedIndex((sel) => {
        if (next.length === 0) {
          return 0;
        }
        if (index < sel) {
          return sel - 1;
        }
        if (index === sel) {
          return Math.min(sel, next.length - 1);
        }
        return sel;
      });
      return next;
    });
  };

  const clearAll = () => {
    setFiles([]);
    setSelectedIndex(0);
    dragDepthRef.current = 0;
    setDragOver(false);
    if (inputRef.current) inputRef.current.value = "";
    setOut("");
    setError(null);
    setCopyHint(null);
    setIsEncoding(false);
  };

  const selectedFile =
    files.length > 0
      ? files[Math.min(Math.max(0, selectedIndex), files.length - 1)]
      : null;

  // 无选中/切换文件时需清空或重算 out，并异步读取 File
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (files.length === 0) {
      setOut("");
      setIsEncoding(false);
      return;
    }
    if (!selectedFile) {
      setOut("");
      setIsEncoding(false);
      return;
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setOut("");
      return;
    }
    let cancelled = false;
    (async () => {
      setIsEncoding(true);
      setError(null);
      setCopyHint(null);
      try {
        if (dataUrl) {
          const s = await readAsDataUrl(selectedFile);
          if (cancelled) return;
          setOut(s);
        } else {
          const buf = await selectedFile.arrayBuffer();
          if (cancelled) return;
          setOut(bytesToBase64(new Uint8Array(buf)));
        }
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
  }, [files, selectedFile, dataUrl, selectedIndex, copy.errorRead]);
  /* eslint-enable react-hooks/set-state-in-effect */

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
    const name = buildDownloadFilenameForFile(selectedFile ?? null);
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
  const dangerFlatClass = cn(
    "translate-y-0 shadow-none border border-[#b91c1c] bg-[#dc2626] text-white",
    "hover:border-[#991b1b] hover:bg-[#b91c1c] hover:text-white hover:shadow-none",
    "dark:border-[#ef4444] dark:bg-[#dc2626] dark:text-white",
    "dark:hover:border-[#f87171] dark:hover:bg-[#b91c1c] dark:hover:text-white",
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
        className={cn(uploadSectionClass, "w-full min-w-0")}
        role="region"
        aria-labelledby={uploadRegionId}
      >
        <div className={toolSectionTitleBarClass}>
          <h2 id={uploadRegionId} className={toolSectionHeadingClass}>
            <IconColumnSourceText className={toolSectionHeadingIconClass} />
            <span className="min-w-0 truncate">{copy.inputColumnTitle}</span>
          </h2>
          {files.length > 0 ? (
            <div className={toolSectionTitleActionsClass}>
              <ToolTitleBarTextButton
                variant="outline"
                className={cn(dangerFlatClass, titleBarButtonTextClass, "disabled:opacity-40")}
                icon={<IconTrash />}
                onClick={clearAll}
                disabled={isBusy}
              >
                {copy.clearAll}
              </ToolTitleBarTextButton>
            </div>
          ) : null}
        </div>
        <div className="m-2 p-3 sm:m-3 sm:p-4">
          {files.length === 0 ? (
            <div
              role="presentation"
              tabIndex={isBusy || !canAddMore ? -1 : 0}
              onClick={() => {
                if (isBusy) return;
                if (!canAddMore) return;
                onPick();
              }}
              onKeyDown={(e) => {
                if (isBusy) return;
                if (!canAddMore) return;
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
                "w-full min-h-40 rounded-lg border-2 border-dashed px-3 py-3 transition-colors sm:min-h-44 sm:px-4 sm:py-4",
                "outline-none focus-within:ring-2 focus-within:ring-accent/25",
                isBusy && "pointer-events-none opacity-60",
                !isBusy && "cursor-pointer",
                dragOver
                  ? "border-accent bg-accent-muted/30"
                  : "border-zinc-300 dark:border-zinc-600",
              )}
            >
              <label
                htmlFor={fileInputId}
                className="flex min-h-[10rem] w-full min-w-0 cursor-pointer flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-4 sm:text-left sm:min-h-[11rem]"
                onClick={(e) => e.stopPropagation()}
              >
                <IconUploadZone className="size-8 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm text-text">
                    {copy.dropZoneHint}
                  </p>
                  <p className="m-0 mt-1 text-[11px] leading-relaxed text-text-secondary">
                    {copy.uploadZoneFormatsLine}
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div
              className={cn(
                FILE_LIST_GRID,
                "min-h-0 items-stretch",
              )}
            >
              {files.map((f, i) => (
                <FileEntryCard
                  key={`${f.name}-${f.size}-${f.lastModified}-${i}`}
                  file={f}
                  copy={copy}
                  selected={i === selectedIndex}
                  onSelect={() => {
                    setSelectedIndex(i);
                  }}
                  onRemove={() => {
                    removeAt(i);
                  }}
                />
              ))}
              <AddFileSlot
                fileInputId={fileInputId}
                copy={copy}
                isBusy={isBusy}
                canAdd={canAddMore}
                dragOver={dragOver}
                onPick={onPick}
                setDragOver={setDragOver}
                dragDepthRef={dragDepthRef}
                onDropList={(list) => {
                  addFilesFromList(list);
                }}
              />
            </div>
          )}
          {error ? (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className={outputColClass} aria-labelledby={outputId}>
        <div
          className={cn(
            toolSectionTitleBarClass,
            "grid w-full min-w-0 grid-cols-3 items-center gap-2",
          )}
        >
          <div className="flex min-w-0 items-center justify-start">
            <IconColumnBase64Text className={toolSectionHeadingIconClass} />
          </div>
          <h2
            id={outputId}
            className="m-0 min-w-0 justify-self-center self-center text-center text-sm font-semibold leading-tight text-text"
          >
            <span
              className="block w-full min-w-0 max-w-full truncate"
              title={selectedFile ? selectedFile.name : copy.outputColumnTitle}
            >
              {selectedFile ? selectedFile.name : copy.outputColumnTitle}
            </span>
          </h2>
          <div
            className={cn(
              toolSectionTitleActionsClass,
              "col-start-3 w-full min-w-0 items-center justify-end gap-2",
            )}
          >
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
            ariaLabel={
              selectedFile
                ? `${copy.outputColumnTitle} — ${selectedFile.name}`
                : copy.outputColumnTitle
            }
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
