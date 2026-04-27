"use client";

import type { Messages } from "@/i18n/dictionaries";
import { encodeIcoFromPngs } from "@/lib/encode-ico";
import {
  ICO_OUTPUT_SIZES,
  type IcoOutputSize,
  type SourceCrop,
  blobToUint8Array,
  renderIconPng,
} from "@/lib/ico-render";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Copy = Messages["tools"]["icoGenerator"];

/** 回显区高度（较上一版再增加一半：144 × 1.5） */
const PREVIEW_HEIGHT_PX = 216;

const CORNER_OPTIONS = [0, 10, 20, 40, 60, 100] as const;

const neutralCard = cn(
  "rounded-lg border border-zinc-200/90 bg-white shadow-sm",
  "dark:border-zinc-700/90 dark:bg-zinc-900",
);

function IconImageUpload({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}

function sizeLabel(copy: Copy, s: IcoOutputSize): string {
  switch (s) {
    case 16:
      return copy.size16;
    case 32:
      return copy.size32;
    case 48:
      return copy.size48;
    case 64:
      return copy.size64;
    case 180:
      return copy.size180;
    case 512:
      return copy.size512;
    default: {
      const _x: never = s;
      return _x;
    }
  }
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function defaultCrop(iw: number, ih: number): SourceCrop {
  const s = Math.min(iw, ih);
  return {
    s,
    sx: Math.max(0, Math.floor((iw - s) / 2)),
    sy: Math.max(0, Math.floor((ih - s) / 2)),
  };
}

function clampCrop(crop: SourceCrop, iw: number, ih: number): SourceCrop {
  const s = crop.s;
  return {
    s,
    sx: Math.min(Math.max(0, crop.sx), Math.max(0, iw - s)),
    sy: Math.min(Math.max(0, crop.sy), Math.max(0, ih - s)),
  };
}

export function IcoGeneratorPanel({ copy }: { copy: Copy }) {
  const uploadId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<SourceCrop | null>(null);
  const [sizes, setSizes] = useState<Record<IcoOutputSize, boolean>>({
    16: true,
    32: true,
    48: false,
    64: true,
    180: false,
    512: false,
  });
  const [cornerPercent, setCornerPercent] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startSx: number;
    startSy: number;
    scale: number;
  } | null>(null);

  const selectedList = useMemo(
    () => ICO_OUTPUT_SIZES.filter((s) => sizes[s]),
    [sizes],
  );

  const revokePreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
      }
      revokePreview();
    };
  }, [imgSrc, revokePreview]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imgSrc]);

  const layout = useMemo(() => {
    if (!natural || containerWidth < 8) {
      return null;
    }
    const W = containerWidth;
    const H = PREVIEW_HEIGHT_PX;
    const { w: iw, h: ih } = natural;
    const scale = Math.max(W / iw, H / ih);
    const dispW = iw * scale;
    const dispH = ih * scale;
    const offsetX = (W - dispW) / 2;
    const offsetY = (H - dispH) / 2;
    return { W, H, iw, ih, scale, dispW, dispH, offsetX, offsetY };
  }, [natural, containerWidth]);

  const onFile = useCallback(
    (f: File | null) => {
      setError(null);
      revokePreview();
      if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
      }
      setImgSrc(null);
      setNatural(null);
      setCrop(null);
      setFile(null);
      if (!f) {
        return;
      }
      if (!/^image\/(png|jpeg|webp)$/i.test(f.type)) {
        setError(copy.errorBadType);
        return;
      }
      if (f.size > 15 * 1024 * 1024) {
        setError(copy.errorTooLarge);
        return;
      }
      const url = URL.createObjectURL(f);
      setFile(f);
      setImgSrc(url);
    },
    [copy.errorBadType, copy.errorTooLarge, imgSrc, revokePreview],
  );

  const onImgLoad = useCallback(() => {
    const el = imgRef.current;
    if (!el) {
      return;
    }
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    if (w < 1 || h < 1) {
      setError(copy.errorLoad);
      return;
    }
    setNatural({ w, h });
    setCrop(defaultCrop(w, h));
  }, [copy.errorLoad]);

  useEffect(() => {
    if (!imgSrc || !natural || !crop || !imgRef.current) {
      return;
    }
    const img = imgRef.current;
    if (!img.complete || img.naturalWidth === 0) {
      return;
    }
    if (selectedList.length === 0) {
      const clearId = window.setTimeout(() => {
        revokePreview();
      }, 0);
      return () => window.clearTimeout(clearId);
    }

    let cancelled = false;
    const maxSize = Math.max(...selectedList);
    const c = clampCrop(crop, natural.w, natural.h);

    const run = () => {
      void (async () => {
        try {
          const blob = await renderIconPng(img, c, maxSize, cornerPercent);
          if (cancelled) {
            return;
          }
          const url = URL.createObjectURL(blob);
          setPreviewUrl((prev) => {
            if (prev) {
              URL.revokeObjectURL(prev);
            }
            return url;
          });
        } catch {
          if (!cancelled) {
            setError(copy.errorRender);
          }
        }
      })();
    };

    const t = window.setTimeout(run, 90);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [
    imgSrc,
    natural,
    crop,
    cornerPercent,
    selectedList,
    copy.errorRender,
    revokePreview,
  ]);

  const onPointerDownCrop = useCallback(
    (e: React.PointerEvent) => {
      if (!layout || !crop || !natural) {
        return;
      }
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startSx: crop.sx,
        startSy: crop.sy,
        scale: layout.scale,
      };
    },
    [layout, crop, natural],
  );

  const onPointerMoveCrop = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d || !natural || !crop) {
        return;
      }
      const dx = e.clientX - d.startClientX;
      const dy = e.clientY - d.startClientY;
      const dSx = Math.round(dx / d.scale);
      const dSy = Math.round(dy / d.scale);
      const next = clampCrop(
        {
          s: crop.s,
          sx: d.startSx + dSx,
          sy: d.startSy + dSy,
        },
        natural.w,
        natural.h,
      );
      setCrop(next);
    },
    [natural, crop],
  );

  const onPointerUpCrop = useCallback((e: React.PointerEvent) => {
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }, []);

  const toggleSize = (s: IcoOutputSize) => {
    setSizes((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  const onUploadZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onUploadZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      onFile(f);
    }
  };

  const pillBase =
    "rounded-md px-3 py-1 text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9690E]/22";
  const pillInactive = cn(
    "bg-zinc-100 text-text-secondary hover:bg-zinc-200/90",
    "dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/90",
  );
  const pillActive = cn(
    "bg-[#F9690E]/11 text-[#b45309]/88 dark:bg-[#F9690E]/14 dark:text-orange-100/90",
  );

  const downloadZip = useCallback(async () => {
    setError(null);
    if (!file || !natural || !crop || !imgRef.current) {
      setError(copy.errorNoImage);
      return;
    }
    if (selectedList.length === 0) {
      setError(copy.errorNoSize);
      return;
    }
    setBusy(true);
    try {
      const img = imgRef.current;
      const c = clampCrop(crop, natural.w, natural.h);
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const ordered = [...selectedList].sort((a, b) => a - b);
      for (const size of ordered) {
        const blob = await renderIconPng(img, c, size, cornerPercent);
        zip.file(`icon-${size}x${size}.png`, blob);
      }
      const zblob = await zip.generateAsync({ type: "blob" });
      const base = file.name.replace(/\.[^.]+$/, "") || "icon";
      downloadBlob(`${base}-icons.zip`, zblob);
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setBusy(false);
    }
  }, [
    file,
    natural,
    crop,
    selectedList,
    cornerPercent,
    copy.errorNoImage,
    copy.errorNoSize,
    copy.errorGeneric,
  ]);

  const downloadIco = useCallback(async () => {
    setError(null);
    if (!file || !natural || !crop || !imgRef.current) {
      setError(copy.errorNoImage);
      return;
    }
    if (selectedList.length === 0) {
      setError(copy.errorNoSize);
      return;
    }
    setBusy(true);
    try {
      const img = imgRef.current;
      const c = clampCrop(crop, natural.w, natural.h);
      const ordered = [...selectedList].sort((a, b) => b - a);
      const pngs: Uint8Array[] = [];
      for (const size of ordered) {
        const blob = await renderIconPng(img, c, size, cornerPercent);
        pngs.push(await blobToUint8Array(blob));
      }
      const icoBytes = encodeIcoFromPngs(pngs);
      const blob = new Blob([new Uint8Array(icoBytes)], { type: "image/x-icon" });
      downloadBlob("favicon.ico", blob);
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setBusy(false);
    }
  }, [
    file,
    natural,
    crop,
    selectedList,
    cornerPercent,
    copy.errorNoImage,
    copy.errorNoSize,
    copy.errorGeneric,
  ]);

  const overlayStyle = useMemo(() => {
    if (!layout || !crop) {
      return undefined;
    }
    const { scale, offsetX, offsetY } = layout;
    const left = offsetX + crop.sx * scale;
    const top = offsetY + crop.sy * scale;
    const side = crop.s * scale;
    return {
      left,
      top,
      width: side,
      height: side,
    };
  }, [layout, crop]);

  const imgStyle = useMemo(() => {
    if (!layout) {
      return undefined;
    }
    const { dispW, dispH, offsetX, offsetY } = layout;
    return {
      width: dispW,
      height: dispH,
      left: offsetX,
      top: offsetY,
    };
  }, [layout]);

  return (
    <div className="grid min-h-0 min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
      <div className="flex min-w-0 flex-col gap-4">
        <input
          id={uploadId}
          type="file"
          accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
          className="sr-only"
          aria-label={copy.uploadLabel}
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <label
          htmlFor={uploadId}
          onDragOver={onUploadZoneDragOver}
          onDrop={onUploadZoneDrop}
          className={cn(
            "flex min-h-[13rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-4 py-10 text-center",
            "bg-gradient-to-br from-[#F9690E]/14 via-[#ffb380]/10 to-amber-50/70",
            "hover:from-[#F9690E]/20 hover:via-[#ffc090]/14 hover:to-amber-50/80",
            "dark:from-[#F9690E]/12 dark:via-orange-950/25 dark:to-zinc-900",
            "dark:hover:from-[#F9690E]/18 dark:hover:via-orange-950/32 dark:hover:to-zinc-900",
            "shadow-inner shadow-white/40 transition-[background,box-shadow] duration-200 dark:shadow-inner dark:shadow-black/25",
            "focus-within:ring-2 focus-within:ring-[#F9690E]/30 focus-within:ring-offset-2 focus-within:ring-offset-orange-50/90 dark:focus-within:ring-offset-zinc-900",
          )}
        >
          <IconImageUpload className="size-11 shrink-0 text-[#F9690E]/75 dark:text-orange-400/85" />
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-md px-4 py-1.5 text-xs font-semibold",
              "bg-white/92 text-[#b45309] shadow-md shadow-orange-900/8",
              "ring-1 ring-orange-200/50 dark:bg-zinc-900/75 dark:text-orange-200/95 dark:ring-orange-800/40",
            )}
          >
            {copy.uploadChooseButton}
          </span>
          <span className="text-xs font-medium text-text">{copy.uploadZoneCta}</span>
          <span className="max-w-sm text-xs text-text-muted leading-relaxed">
            {copy.uploadZoneFormats}
          </span>
        </label>

        <div className={cn("overflow-hidden p-0", neutralCard)}>
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
            style={{ height: PREVIEW_HEIGHT_PX }}
          >
            {imgSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imgSrc}
                  alt=""
                  draggable={false}
                  onLoad={onImgLoad}
                  className="pointer-events-none absolute select-none"
                  style={{
                    ...imgStyle,
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                />
                {overlayStyle ? (
                  <button
                    type="button"
                    aria-label={copy.cropDragLabel}
                    className={cn(
                      "absolute cursor-move touch-none rounded-sm border-2 border-white/95 bg-transparent",
                      "shadow-[0_0_0_1px_rgba(0,0,0,0.45)] ring-2 ring-[#F9690E]/85 ring-offset-1 ring-offset-orange-100/50",
                      "dark:ring-offset-zinc-900",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] focus-visible:ring-offset-2",
                    )}
                    style={overlayStyle}
                    onPointerDown={onPointerDownCrop}
                    onPointerMove={onPointerMoveCrop}
                    onPointerUp={onPointerUpCrop}
                    onPointerCancel={onPointerUpCrop}
                  />
                ) : null}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-0 text-center text-xs text-text-muted">
                {copy.cropEmpty}
              </div>
            )}
          </div>
        </div>

        <div className={cn("flex flex-col gap-3 p-4", neutralCard)}>
          <div
            className={cn(
              "rounded-md border border-zinc-200/80 bg-zinc-50/80 p-3",
              "dark:border-zinc-600/70 dark:bg-zinc-800/50",
            )}
          >
            <p className="m-0 mb-2 text-xs font-medium text-orange-950/55 dark:text-orange-200/65">
              {copy.sizesTitle}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ICO_OUTPUT_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sizes[s]}
                  onClick={() => toggleSize(s)}
                  className={cn(pillBase, sizes[s] ? pillActive : pillInactive)}
                >
                  {sizeLabel(copy, s)}
                </button>
              ))}
            </div>
          </div>
          <div
            className={cn(
              "rounded-md border border-zinc-200/80 bg-zinc-50/80 p-3",
              "dark:border-zinc-600/70 dark:bg-zinc-800/50",
            )}
          >
            <p className="m-0 mb-2 text-xs font-medium text-orange-950/55 dark:text-orange-200/65">
              {copy.radiusTitle}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {CORNER_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={cornerPercent === p}
                  onClick={() => setCornerPercent(p)}
                  className={cn(
                    pillBase,
                    cornerPercent === p ? pillActive : pillInactive,
                  )}
                >
                  {p}
                  {copy.radiusPercentSuffix}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <aside
        className={cn(
          "flex min-h-0 min-w-0 flex-col gap-4 rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
          "dark:border-zinc-700/90 dark:bg-zinc-900",
        )}
      >
        <div>
          <h3 className="m-0 text-sm font-medium text-text">{copy.previewSectionTitle}</h3>
          <p className="mt-1 text-xs text-text-muted">{copy.previewHint}</p>
        </div>

        <div className="flex min-h-[12rem] items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-800/80">
          {previewUrl && selectedList.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="max-h-56 max-w-full object-contain"
            />
          ) : (
            <span className="text-center text-sm text-text-muted">{copy.previewPlaceholder}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !file || selectedList.length === 0}
            onClick={() => void downloadZip()}
            className={cn(
              "inline-flex h-8 items-center rounded-md px-3 text-xs font-semibold text-white transition-colors",
              "bg-[#F9690E] hover:bg-[#ea580c] active:bg-[#c2410c]",
              "shadow-sm shadow-orange-900/15 disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9690E]/45 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
            )}
          >
            {busy ? copy.busy : copy.downloadZip}
          </button>
          <button
            type="button"
            disabled={busy || !file || selectedList.length === 0}
            onClick={() => void downloadIco()}
            className={cn(
              "inline-flex h-8 items-center rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-text-secondary transition-colors",
              "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/35 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
            )}
          >
            {busy ? copy.busy : copy.downloadIco}
          </button>
        </div>

        <dl className="m-0 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {copy.summaryFile}
            </dt>
            <dd className="mt-0.5 break-all text-text">{file?.name ?? copy.summaryEmpty}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {copy.summarySizes}
            </dt>
            <dd className="mt-0.5 text-text">
              {selectedList.length > 0
                ? selectedList
                    .slice()
                    .sort((a, b) => a - b)
                    .map((s) => `${s}×${s}`)
                    .join(", ")
                : copy.summaryNoneSizes}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {copy.summaryRadius}
            </dt>
            <dd className="mt-0.5 text-text">
              {cornerPercent}
              {copy.radiusPercentSuffix}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
