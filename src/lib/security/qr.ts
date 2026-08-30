/**
 * QR reading — decodes a QR code from a camera frame or an image file.
 *
 * Two paths, because coverage matters more than elegance here:
 *   1. `BarcodeDetector` — native, fast, no download. Chrome/Android.
 *   2. `jsQR` — WASM-free JS fallback. Needed for iOS Safari, which has no
 *      BarcodeDetector, and iOS is half the audience.
 *
 * Decoding is deterministic: it either reads the code or it doesn't. Whatever
 * comes out is handed to analyzePix, so the risk analysis is the same one the
 * pasted copia-e-cola already goes through.
 */
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => BarcodeDetectorLike;

function nativeDetector(): BarcodeDetectorLike | null {
  const Ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

/** Draws a source onto a canvas and returns its pixels for jsQR. */
function toImageData(source: CanvasImageSource, w: number, h: number): ImageData | null {
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

async function decodeWithJsQR(source: CanvasImageSource, w: number, h: number) {
  const data = toImageData(source, w, h);
  if (!data) return null;
  // Loaded on demand so the parser never costs anything to users who don't scan.
  const { default: jsQR } = await import("jsqr");
  const found = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
  return found?.data ?? null;
}

/** Reads a QR from an already-decoded image (a <video> frame or an <img>). */
export async function decodeFromSource(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<string | null> {
  const native = nativeDetector();
  if (native) {
    try {
      const codes = await native.detect(source);
      if (codes.length > 0) return codes[0].rawValue;
      // Native detector present but found nothing — fall through to jsQR, which
      // is more tolerant of low contrast and odd angles.
    } catch {
      /* fall through */
    }
  }
  return decodeWithJsQR(source, width, height);
}

/** Reads a QR from a photo the user picked (gallery or camera roll). */
export async function decodeFromFile(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    // Cap the working size: a 12MP photo would be slow to scan at full size.
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    return await decodeFromSource(img, w, h);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
