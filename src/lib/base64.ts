/**
 * Base64 helpers (browser APIs). Used by the Base64 workbench client UI.
 */

const CHUNK = 0x8000;

export function utf8TextToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const end = Math.min(i + CHUNK, bytes.length);
    for (let j = i; j < end; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
  }
  return btoa(binary);
}

/** RFC 4648 §5 Base64URL：`-`/`_`，无 `=` 填充 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Strip whitespace; if Data URL, return substring after `base64,` */
export function stripToRawBase64(input: string): string {
  let s = input.trim().replace(/\s/g, "");
  const idx = s.indexOf("base64,");
  if (s.startsWith("data:") && idx !== -1) {
    s = s.slice(idx + 7);
  }
  return s.replace(/-/g, "+").replace(/_/g, "/");
}

export function base64ToBytes(b64: string): Uint8Array {
  const normalized = stripToRawBase64(b64);
  const padLen = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + "=".repeat(padLen);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    out[i] = bin.charCodeAt(i);
  }
  return out;
}

export type ParsedDataUrl = { mime: string; base64Part: string };

/** Data URL: `data:{mime};base64,{payload}`（MIME 段不含分号） */
export function tryParseDataUrl(input: string): ParsedDataUrl | null {
  const trimmed = input.trim();
  const m = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/i);
  if (!m) return null;
  return { mime: m[1].trim(), base64Part: m[2].replace(/\s/g, "") };
}

export function tryUtf8Decode(bytes: Uint8Array): { ok: true; text: string } | { ok: false } {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, text };
  } catch {
    return { ok: false };
  }
}

export function extensionForMime(mime: string): string {
  const m = mime.split(";")[0].trim().toLowerCase();
  const map: Record<string, string> = {
    "text/plain": ".txt",
    "text/html": ".html",
    "text/css": ".css",
    "application/json": ".json",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "application/pdf": ".pdf",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "video/mp4": ".mp4",
    "application/octet-stream": ".bin",
  };
  return map[m] ?? ".bin";
}

/** 从裸字节嗅探常见非文本类型（无 Data URL MIME 时用于提示） */
export function sniffLikelyBinaryKind(bytes: Uint8Array): "image" | "pdf" | null {
  if (bytes.length < 4) return null;
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image";
  if (bytes.length >= 12) {
    const riff =
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const webp =
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (riff && webp) return "image";
  }
  return null;
}
