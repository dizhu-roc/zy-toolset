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

const PREVIEW_HEIGHT_PX = 288;
const CORNER_OPTIONS = [0, 10, 20, 40, 60, 100] as const;

function sizeLabel(copy: Copy, s: IcoOutputSize): string {
  switch (s) {
    case 16:
      return copy.size16;
    case 32:
      return copy.size32;
    case 64:
      return copy.size64;
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
    64: true,
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
        <div
          className={cn(
            "rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <p className="m-0 text-xs text-text-muted leading-relaxed">{copy.introP1}</p>
          <p className="mt-1.5 m-0 text-xs text-text-muted leading-relaxed">{copy.introP2}</p>
        </div>

        <div
          className={cn(
            "rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <label
            htmlFor={uploadId}
            className="block text-sm font-medium text-text"
          >
            {copy.uploadLabel}
          </label>
          <p className="mt-0.5 text-xs text-text-muted">{copy.uploadHint}</p>
          <input
            id={uploadId}
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="mt-2 block w-full max-w-md cursor-pointer text-sm text-text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-text dark:file:bg-zinc-800"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div
          className={cn(
            "rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <h3 className="m-0 text-sm font-medium text-text">{copy.cropSectionTitle}</h3>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">{copy.cropHint}</p>
          <div
            ref={containerRef}
            className="relative mt-3 w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
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
                      "absolute cursor-move touch-none rounded-sm border-2 border-white bg-transparent shadow-[0_0_0_1px_rgba(0,0,0,0.5)]",
                      "ring-2 ring-[#1576BB]/80",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
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
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-text-muted">
                {copy.cropEmpty}
              </div>
            )}
          </div>
        </div>

        <fieldset
          className={cn(
            "rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <legend className="text-sm font-medium text-text">{copy.sizesTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {ICO_OUTPUT_SIZES.map((s) => (
              <label
                key={s}
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-text-secondary"
              >
                <input
                  type="checkbox"
                  checked={sizes[s]}
                  onChange={() => toggleSize(s)}
                  className="size-4 rounded border-zinc-300 text-[#1576BB] focus:ring-accent"
                />
                <span>{sizeLabel(copy, s)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset
          className={cn(
            "rounded-lg border border-zinc-200/90 bg-white p-4 shadow-sm",
            "dark:border-zinc-700/90 dark:bg-zinc-900",
          )}
        >
          <legend className="text-sm font-medium text-text">{copy.radiusTitle}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CORNER_OPTIONS.map((p) => (
              <label
                key={p}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-text-secondary"
              >
                <input
                  type="radio"
                  name="ico-corner"
                  checked={cornerPercent === p}
                  onChange={() => setCornerPercent(p)}
                  className="size-4 border-zinc-300 text-[#1576BB] focus:ring-accent"
                />
                <span>
                  {p}
                  {copy.radiusPercentSuffix}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !file || selectedList.length === 0}
            onClick={() => void downloadZip()}
            className={cn(
              "inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-white transition-colors",
              "bg-[#1576BB] hover:bg-[#125d99] disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
            )}
          >
            {busy ? copy.busy : copy.downloadZip}
          </button>
          <button
            type="button"
            disabled={busy || !file || selectedList.length === 0}
            onClick={() => void downloadIco()}
            className={cn(
              "inline-flex h-9 items-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-text-secondary transition-colors",
              "hover:border-zinc-300 hover:bg-zinc-50 hover:text-text disabled:cursor-not-allowed disabled:opacity-50",
              "dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
            )}
          >
            {busy ? copy.busy : copy.downloadIco}
          </button>
        </div>
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
