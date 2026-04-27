export const ICO_OUTPUT_SIZES = [16, 32, 64, 512] as const;
export type IcoOutputSize = (typeof ICO_OUTPUT_SIZES)[number];

export type SourceCrop = {
  /** Top-left X in source image pixels */
  sx: number;
  /** Top-left Y in source image pixels */
  sy: number;
  /** Square side in source pixels */
  s: number;
};

/**
 * Rasterize a square crop from `image` into `outSize × outSize` PNG with optional rounded corners.
 * Corner radius = (cornerPercent / 100) * (outSize / 2); 100% yields a circle.
 */
export function renderIconPng(
  image: CanvasImageSource,
  crop: SourceCrop,
  outSize: number,
  cornerPercent: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return Promise.reject(new Error("2D context unavailable."));
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const rMax = outSize / 2;
  const radius = (Math.min(100, Math.max(0, cornerPercent)) / 100) * rMax;

  ctx.save();
  ctx.beginPath();
  if (radius > 0) {
    ctx.roundRect(0, 0, outSize, outSize, radius);
  } else {
    ctx.rect(0, 0, outSize, outSize);
  }
  ctx.clip();

  ctx.drawImage(
    image,
    crop.sx,
    crop.sy,
    crop.s,
    crop.s,
    0,
    0,
    outSize,
    outSize,
  );
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("PNG encode failed."));
        }
      },
      "image/png",
      undefined,
    );
  });
}

export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}
