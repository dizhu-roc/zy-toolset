/**
 * Build a Windows .ico containing PNG-compressed frames (Vista+).
 * Each `png` must be a complete PNG file including signature; IHDR width/height are read for directory entries.
 */
export function encodeIcoFromPngs(pngs: readonly Uint8Array[]): Uint8Array {
  if (pngs.length === 0 || pngs.length > 255) {
    throw new Error("ICO must contain 1–255 images.");
  }
  const n = pngs.length;
  const headerSize = 6 + n * 16;
  let dataOffset = headerSize;
  const total = headerSize + pngs.reduce((acc, p) => acc + p.byteLength, 0);
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, n, true);

  for (let i = 0; i < n; i++) {
    const png = pngs[i]!;
    if (png.byteLength < 24 || png[0] !== 0x89) {
      throw new Error("Invalid PNG buffer.");
    }
    const w = readU32BE(png, 16);
    const h = readU32BE(png, 20);
    const entry = 6 + i * 16;
    view.setUint8(entry + 0, w > 255 ? 0 : w);
    view.setUint8(entry + 1, h > 255 ? 0 : h);
    view.setUint8(entry + 2, 0);
    view.setUint8(entry + 3, 0);
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, png.byteLength, true);
    view.setUint32(entry + 12, dataOffset, true);
    dataOffset += png.byteLength;
  }

  let o = headerSize;
  for (const png of pngs) {
    out.set(png, o);
    o += png.byteLength;
  }

  return out;
}

function readU32BE(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset]! << 24) | (buf[offset + 1]! << 16) | (buf[offset + 2]! << 8) | buf[offset + 3]!) >>>
    0
  );
}
