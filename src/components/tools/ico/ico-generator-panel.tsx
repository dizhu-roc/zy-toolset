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

/** 裁剪框边缘/角的可拖动命中宽度（CSS px） */
const CROP_EDGE_HIT_PX = 10;

/** 右侧预览列顺序：导出尺寸从大到小 */
const ICO_PREVIEW_ORDER_DESC = [...ICO_OUTPUT_SIZES].sort((a, b) => b - a);

const CORNER_OPTIONS = [0, 10, 20, 40, 60, 100] as const;

function IcoPreviewSlotPlaceholder({
  className,
  pulsing,
}: {
  className?: string;
  pulsing?: boolean;
}) {
  return (
    <svg
      className={cn(
        "text-zinc-400/90 dark:text-zinc-500",
        pulsing && "animate-pulse",
        className,
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.75" />
      <path d="M4 16.5 8.5 12l3.2 3.2L15 12l5 4.5" />
      <circle cx="8" cy="9.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

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

/** 1:1 裁剪边长下限（源图像素） */
function minCropSide(iw: number, ih: number): number {
  return Math.max(8, Math.min(32, Math.floor((Math.min(iw, ih) * 3) / 100)));
}

type CropResizeZone = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

type CropPointerDrag =
  | {
      kind: "move";
      iw: number;
      ih: number;
      startClientX: number;
      startClientY: number;
      startSx: number;
      startSy: number;
      startS: number;
      scale: number;
    }
  | {
      kind: "resize";
      zone: CropResizeZone;
      iw: number;
      ih: number;
      offsetX: number;
      offsetY: number;
      scale: number;
      minS: number;
      sx0: number;
      sy0: number;
      s0: number;
    };

function clampFullCrop(c: SourceCrop, iw: number, ih: number, minS: number): SourceCrop {
  let { sx, sy, s } = c;
  s = Math.max(minS, Math.min(s, iw, ih));
  sx = Math.min(Math.max(0, sx), iw - minS);
  sy = Math.min(Math.max(0, sy), ih - minS);
  s = Math.min(s, iw - sx, ih - sy);
  s = Math.max(minS, s);
  sx = Math.min(Math.max(0, sx), iw - s);
  sy = Math.min(Math.max(0, sy), ih - s);
  return { sx, sy, s };
}

function applyResizeZone(
  zone: CropResizeZone,
  sx0: number,
  sy0: number,
  s0: number,
  srcX: number,
  srcY: number,
  iw: number,
  ih: number,
  minS: number,
): SourceCrop {
  let sx = sx0;
  let sy = sy0;
  let s = s0;
  const brx0 = sx0 + s0;
  const bry0 = sy0 + s0;

  switch (zone) {
    case "se":
      s = Math.floor(Math.min(srcX - sx0, srcY - sy0));
      sx = sx0;
      sy = sy0;
      break;
    case "nw": {
      s = Math.floor(Math.min(brx0 - srcX, bry0 - srcY));
      sx = brx0 - s;
      sy = bry0 - s;
      break;
    }
    case "ne": {
      s = Math.floor(Math.min(srcX - sx0, bry0 - srcY));
      sx = sx0;
      sy = bry0 - s;
      break;
    }
    case "sw": {
      s = Math.floor(Math.min(brx0 - srcX, srcY - sy0));
      sx = brx0 - s;
      sy = sy0;
      break;
    }
    case "n": {
      const newSy = Math.round(Math.min(Math.max(0, srcY), bry0 - minS));
      s = bry0 - newSy;
      sx = sx0;
      sy = newSy;
      break;
    }
    case "s": {
      s = Math.round(Math.max(minS, Math.min(srcY, ih) - sy0));
      sx = sx0;
      sy = sy0;
      break;
    }
    case "e": {
      s = Math.round(Math.max(minS, Math.min(srcX, iw) - sx0));
      sx = sx0;
      sy = sy0;
      break;
    }
    case "w": {
      const newSx = Math.round(Math.min(Math.max(0, srcX), brx0 - minS));
      s = brx0 - newSx;
      sx = newSx;
      sy = sy0;
      break;
    }
    default: {
      const _z: never = zone;
      void _z;
      return clampFullCrop({ sx: sx0, sy: sy0, s: s0 }, iw, ih, minS);
    }
  }

  return clampFullCrop({ sx, sy, s }, iw, ih, minS);
}

function revokePreviewMap(m: Partial<Record<IcoOutputSize, string>>) {
  for (const u of Object.values(m)) {
    if (u) {
      URL.revokeObjectURL(u);
    }
  }
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
  const [previewBySize, setPreviewBySize] = useState<
    Partial<Record<IcoOutputSize, string>>
  >({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropDragRef = useRef<CropPointerDrag | null>(null);

  const selectedList = useMemo(
    () => ICO_OUTPUT_SIZES.filter((s) => sizes[s]),
    [sizes],
  );

  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;

  const revokePreview = useCallback(() => {
    setPreviewBySize((prev) => {
      revokePreviewMap(prev);
      return {};
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

  /** 预览区用 contain：整图按比例落在框内，与导出用的 source 坐标同一 scale 映射 */
  const layout = useMemo(() => {
    if (!natural || containerWidth < 8) {
      return null;
    }
    const W = containerWidth;
    const H = PREVIEW_HEIGHT_PX;
    const { w: iw, h: ih } = natural;
    const scale = Math.min(W / iw, H / ih);
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
    const c = clampCrop(crop, natural.w, natural.h);

    const run = () => {
      void (async () => {
        const next: Partial<Record<IcoOutputSize, string>> = {};
        try {
          for (const s of ICO_OUTPUT_SIZES) {
            if (!sizesRef.current[s]) {
              continue;
            }
            const blob = await renderIconPng(img, c, s, cornerPercent);
            if (cancelled) {
              revokePreviewMap(next);
              return;
            }
            if (!sizesRef.current[s]) {
              continue;
            }
            next[s] = URL.createObjectURL(blob);
          }
        } catch {
          revokePreviewMap(next);
          if (!cancelled) {
            setError(copy.errorRender);
          }
          return;
        }
        if (cancelled) {
          revokePreviewMap(next);
          return;
        }
        setPreviewBySize((prev) => {
          const out: Partial<Record<IcoOutputSize, string>> = {};
          for (const s of ICO_OUTPUT_SIZES) {
            if (!sizesRef.current[s]) {
              continue;
            }
            if (next[s]) {
              out[s] = next[s]!;
            }
          }
          for (const s of ICO_OUTPUT_SIZES) {
            const oldU = prev[s];
            const newU = out[s];
            if (oldU && oldU !== newU) {
              URL.revokeObjectURL(oldU);
            }
          }
          return out;
        });
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

  const detachCropWindowListeners = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      detachCropWindowListeners.current?.();
    };
  }, []);

  const beginCropInteraction = useCallback(
    (zone: CropResizeZone | "move", e: React.PointerEvent) => {
      if (!layout || !crop || !natural || !containerRef.current) {
        return;
      }
      e.preventDefault();
      const iw = natural.w;
      const ih = natural.h;
      const minS = minCropSide(iw, ih);

      if (zone === "move") {
        cropDragRef.current = {
          kind: "move",
          iw,
          ih,
          startClientX: e.clientX,
          startClientY: e.clientY,
          startSx: crop.sx,
          startSy: crop.sy,
          startS: crop.s,
          scale: layout.scale,
        };
        const onMove = (ev: PointerEvent) => {
          const d = cropDragRef.current;
          if (!d || d.kind !== "move") {
            return;
          }
          const dSx = Math.round((ev.clientX - d.startClientX) / d.scale);
          const dSy = Math.round((ev.clientY - d.startClientY) / d.scale);
          setCrop(
            clampCrop(
              {
                s: d.startS,
                sx: d.startSx + dSx,
                sy: d.startSy + dSy,
              },
              d.iw,
              d.ih,
            ),
          );
        };
        const onEnd = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onEnd);
          window.removeEventListener("pointercancel", onEnd);
          cropDragRef.current = null;
          detachCropWindowListeners.current = null;
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onEnd);
        window.addEventListener("pointercancel", onEnd);
        detachCropWindowListeners.current = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onEnd);
          window.removeEventListener("pointercancel", onEnd);
          cropDragRef.current = null;
        };
        return;
      }

      cropDragRef.current = {
        kind: "resize",
        zone,
        iw,
        ih,
        offsetX: layout.offsetX,
        offsetY: layout.offsetY,
        scale: layout.scale,
        minS,
        sx0: crop.sx,
        sy0: crop.sy,
        s0: crop.s,
      };
      const onMove = (ev: PointerEvent) => {
        const d = cropDragRef.current;
        if (!d || d.kind !== "resize" || !containerRef.current) {
          return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        const srcX = (ev.clientX - rect.left - d.offsetX) / d.scale;
        const srcY = (ev.clientY - rect.top - d.offsetY) / d.scale;
        setCrop(
          applyResizeZone(
            d.zone,
            d.sx0,
            d.sy0,
            d.s0,
            srcX,
            srcY,
            d.iw,
            d.ih,
            d.minS,
          ),
        );
      };
      const onEnd = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        cropDragRef.current = null;
        detachCropWindowListeners.current = null;
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
      detachCropWindowListeners.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        cropDragRef.current = null;
      };
    },
    [layout, crop, natural],
  );

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

  const downloadPackage = useCallback(async () => {
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
      const orderedAsc = [...selectedList].sort((a, b) => a - b);
      const orderedDesc = [...selectedList].sort((a, b) => b - a);
      const blobBySize: Partial<Record<IcoOutputSize, Blob>> = {};
      for (const size of orderedAsc) {
        blobBySize[size] = await renderIconPng(img, c, size, cornerPercent);
        zip.file(`icon-${size}x${size}.png`, blobBySize[size]!);
      }
      const pngs: Uint8Array[] = [];
      for (const size of orderedDesc) {
        pngs.push(await blobToUint8Array(blobBySize[size]!));
      }
      const icoBytes = encodeIcoFromPngs(pngs);
      zip.file("favicon.ico", new Uint8Array(icoBytes));
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
            className="relative isolate w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800"
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
                  className="pointer-events-none absolute z-0 select-none"
                  style={{
                    ...imgStyle,
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                />
                {overlayStyle ? (
                  <div
                    className="absolute z-10 touch-none"
                    style={overlayStyle}
                  >
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-0 z-0 rounded-sm border-2 border-[#F9690E]",
                        "shadow-md ring-2 ring-white/90 ring-offset-0",
                        "dark:border-orange-400 dark:ring-zinc-700",
                      )}
                      aria-hidden
                    />
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-0 z-[5] rounded-sm",
                        "bg-orange-500/10 dark:bg-orange-400/15",
                      )}
                      aria-hidden
                    />
                    <button
                      type="button"
                      aria-label={copy.cropDragLabel}
                      className={cn(
                        "absolute z-[15] cursor-move rounded-sm border-0 bg-transparent p-0",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea580c] focus-visible:ring-offset-1",
                      )}
                      style={{
                        top: CROP_EDGE_HIT_PX,
                        left: CROP_EDGE_HIT_PX,
                        right: CROP_EDGE_HIT_PX,
                        bottom: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => beginCropInteraction("move", e)}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute left-0 top-0 z-30 cursor-nwse-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        width: CROP_EDGE_HIT_PX,
                        height: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("nw", e);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute right-0 top-0 z-30 cursor-nesw-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        width: CROP_EDGE_HIT_PX,
                        height: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("ne", e);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute bottom-0 left-0 z-30 cursor-nesw-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        width: CROP_EDGE_HIT_PX,
                        height: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("sw", e);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute bottom-0 right-0 z-30 cursor-nwse-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        width: CROP_EDGE_HIT_PX,
                        height: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("se", e);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute left-0 right-0 top-0 z-20 cursor-ns-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        height: CROP_EDGE_HIT_PX,
                        left: CROP_EDGE_HIT_PX,
                        right: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("n", e);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute bottom-0 left-0 right-0 z-20 cursor-ns-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        height: CROP_EDGE_HIT_PX,
                        left: CROP_EDGE_HIT_PX,
                        right: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("s", e);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute bottom-0 right-0 top-0 z-20 cursor-ew-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        width: CROP_EDGE_HIT_PX,
                        top: CROP_EDGE_HIT_PX,
                        bottom: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("e", e);
                      }}
                    />
                    <button
                      type="button"
                      aria-label={copy.cropResizeHandleLabel}
                      className="absolute bottom-0 left-0 top-0 z-20 cursor-ew-resize border-0 bg-transparent p-0 opacity-0"
                      style={{
                        width: CROP_EDGE_HIT_PX,
                        top: CROP_EDGE_HIT_PX,
                        bottom: CROP_EDGE_HIT_PX,
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        beginCropInteraction("w", e);
                      }}
                    />
                  </div>
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
        className="flex h-full min-h-0 min-w-0 flex-col gap-4"
      >
        <section
          className={cn(
            "flex min-h-[12rem] flex-1 flex-col gap-2 rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <h3 className="m-0 text-sm font-medium text-text">{copy.previewBlockTitle}</h3>
          <div className="grid min-h-0 w-full flex-1 grid-cols-6 content-end gap-2">
            {ICO_PREVIEW_ORDER_DESC.map((s) => {
              const url = previewBySize[s];
              const active = sizes[s] && url;
              const pending = sizes[s] && !url;
              return (
                <div
                  key={s}
                  className="flex min-w-0 flex-col items-center justify-end gap-1.5"
                >
                  <div
                    className={cn(
                      "flex aspect-square w-full min-w-0 items-center justify-center overflow-hidden rounded-md",
                      active
                        ? "ring-1 ring-orange-200/80 dark:ring-orange-800/60"
                        : "border border-dashed border-zinc-300/90 bg-zinc-100/90 dark:border-zinc-600 dark:bg-zinc-800/80",
                    )}
                  >
                    {active ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt=""
                        draggable={false}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <IcoPreviewSlotPlaceholder
                        className="h-[58%] w-[58%]"
                        pulsing={pending}
                      />
                    )}
                  </div>
                  <span className="w-full shrink-0 text-center text-[10px] font-medium tabular-nums leading-none text-text-muted">
                    {s}×{s}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section
          className={cn(
            "rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <h3 className="m-0 text-sm font-medium text-text">{copy.fileInfoBlockTitle}</h3>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <div className="flex min-w-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="shrink-0 text-xs font-medium text-text-muted">
                {copy.summaryFile}
              </span>
              <span className="min-w-0 flex-1 break-all text-sm text-text">
                {file?.name ?? copy.summaryEmpty}
              </span>
            </div>
            <div className="flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="shrink-0 text-xs font-medium text-text-muted">
                {copy.summarySizes}
              </span>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {selectedList.length > 0 ? (
                  [...selectedList]
                    .sort((a, b) => a - b)
                    .map((sz) => (
                      <span
                        key={sz}
                        className={cn(pillBase, pillActive, "inline-flex cursor-default select-none")}
                      >
                        {sizeLabel(copy, sz)}
                      </span>
                    ))
                ) : (
                  <span
                    className={cn(pillBase, pillInactive, "inline-flex cursor-default select-none")}
                  >
                    {copy.summaryNoneSizes}
                  </span>
                )}
              </div>
            </div>
            <div className="flex min-w-0 flex-row flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="shrink-0 text-xs font-medium text-text-muted">
                {copy.summaryRadius}
              </span>
              <span
                className={cn(pillBase, pillActive, "inline-flex cursor-default select-none")}
              >
                {cornerPercent}
                {copy.radiusPercentSuffix}
              </span>
            </div>
          </div>
        </section>

        <section
          className={cn(
            "overflow-hidden rounded-lg border border-zinc-200/90 bg-white p-0 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <button
            type="button"
            disabled={busy || !file || selectedList.length === 0}
            onClick={() => void downloadPackage()}
            className={cn(
              "flex min-h-11 w-full items-center justify-center px-4 py-3 text-sm font-semibold text-white transition-colors",
              "bg-[#F9690E] hover:bg-[#ea580c] active:bg-[#c2410c]",
              "shadow-none disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F9690E]/55",
            )}
          >
            {busy ? copy.busy : copy.downloadPackage}
          </button>
        </section>
      </aside>
    </div>
  );
}
