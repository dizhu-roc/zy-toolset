import {
  base64ToBytes,
  extensionForMime,
  sniffLikelyBinaryKind,
  stripToRawBase64,
  tryParseDataUrl,
} from "@/lib/base64";

/** 与「文件转 Base64」页单文件解码结果上限对齐 */
export const MAX_FILE_DECODE_BYTES = 8 * 1024 * 1024;

export function mainMime(mime: string): string {
  return mime.split(";")[0].trim().toLowerCase();
}

export function estimateDecodedBytesFromInput(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  const p = tryParseDataUrl(trimmed);
  const normalized = p
    ? p.base64Part.replace(/\s/g, "")
    : stripToRawBase64(trimmed);
  if (!normalized) return 0;
  const pad = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((normalized.length * 3) / 4) - pad);
}

/** 无 Data URL MIME 时，用魔数推断常见类型以便扩展名与预览 */
function inferMimeFromMagic(bytes: Uint8Array): string | null {
  // ZIP（含 .zip、.xlsx 等 OOXML）：PK\x03\x04 本地头，或 EOCD 等其它 PK 段
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    const a = bytes[2];
    const b = bytes[3];
    if (
      (a === 0x03 && b === 0x04) ||
      (a === 0x05 && b === 0x06) ||
      (a === 0x07 && b === 0x08)
    ) {
      return "application/zip";
    }
  }
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    return "application/gzip";
  }
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (bytes.length >= 12) {
    const riff =
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const webp =
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (riff && webp) return "image/webp";
  }
  return null;
}

export type FileDecodePayload = {
  bytes: Uint8Array;
  mime: string;
  suggestedFilename: string;
};

export type FileDecodeErrorKind =
  | "empty"
  | "dataUrlInvalid"
  | "tooLarge"
  | "invalidBase64"
  | "emptyPayload";

export function decodeBase64ToFilePayload(
  input: string,
): { ok: true; value: FileDecodePayload } | { ok: false; error: FileDecodeErrorKind } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "empty" };
  }
  if (/^data:/i.test(trimmed) && !tryParseDataUrl(trimmed)) {
    return { ok: false, error: "dataUrlInvalid" };
  }
  if (estimateDecodedBytesFromInput(trimmed) > MAX_FILE_DECODE_BYTES) {
    return { ok: false, error: "tooLarge" };
  }
  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(trimmed);
  } catch {
    return { ok: false, error: "invalidBase64" };
  }
  if (bytes.length === 0) {
    return { ok: false, error: "emptyPayload" };
  }

  let mime = "application/octet-stream";
  const parsed = tryParseDataUrl(trimmed);
  if (parsed) {
    mime = mainMime(parsed.mime) || "application/octet-stream";
  }
  if (mime === "application/octet-stream") {
    const magic = inferMimeFromMagic(bytes);
    if (magic) {
      mime = magic;
    } else {
      const sniff = sniffLikelyBinaryKind(bytes);
      if (sniff === "image") mime = "image/png";
      if (sniff === "pdf") mime = "application/pdf";
    }
  }

  const ext = extensionForMime(mime);
  const stamp = Date.now();
  const suggestedFilename = `decoded-${stamp}${ext}`;
  return { ok: true, value: { bytes, mime, suggestedFilename } };
}
