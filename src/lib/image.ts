// OWNER: Member A (Camera / Capture)
// Client-side only. Converts the picked/captured photo into a small JPEG data URL for upload.
//
// A2: resize to max 1024px on the longest side, re-encode as JPEG (~0.8). Raw phone photos are
//     3–12 MB and Vercel's serverless body limit is 4.5 MB, so this is required in production.
// A3: EXIF orientation is applied via `imageOrientation: "from-image"` (and by <img> natively);
//     if createImageBitmap is missing or fails (older Safari, some HEIC files) we fall back to
//     <img> + canvas; HEIC that the browser can't decode gets a friendly error.

export const MAX_DIMENSION = 1024;
export const JPEG_QUALITY = 0.8;
/** Target size of the final data URL string (base64 inflates ~33%). */
export const TARGET_DATA_URL_BYTES = 500 * 1024;
/** Refuse absurd inputs before trying to decode them (protects low-memory phones). */
const MAX_INPUT_BYTES = 40 * 1024 * 1024;

/** Error with a message that is safe to show to the user. */
export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

type Drawable = ImageBitmap | HTMLImageElement;

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

function looksLikeImage(file: File): boolean {
  // Some Android pickers report an empty type; let the decoder decide in that case.
  return file.type === "" || file.type.startsWith("image/") || isHeic(file);
}

async function decodeWithBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap !== "function") throw new Error("createImageBitmap unsupported");
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Some older engines reject the options bag; retry without it.
    return await createImageBitmap(file);
  }
}

function decodeWithImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("img decode failed"));
    };
    img.src = url;
  });
}

async function decode(file: File): Promise<Drawable> {
  try {
    return await decodeWithBitmap(file);
  } catch {
    try {
      return await decodeWithImg(file);
    } catch {
      throw new ImageProcessingError(
        isHeic(file)
          ? "This browser can't read HEIC photos. Use the camera button, or change your iPhone to Settings → Camera → Formats → Most Compatible."
          : "Couldn't read that image. Please try a different photo.",
      );
    }
  }
}

function sizeOf(src: Drawable): { w: number; h: number } {
  return src instanceof HTMLImageElement
    ? { w: src.naturalWidth, h: src.naturalHeight }
    : { w: src.width, h: src.height };
}

function render(src: Drawable, maxDim: number, quality: number): string {
  const { w, h } = sizeOf(src);
  if (!w || !h) throw new ImageProcessingError("That image appears to be empty.");
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageProcessingError("Your browser couldn't process the image.");
  ctx.fillStyle = "#fff"; // JPEG has no alpha; avoid transparent PNGs turning black
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, width, height);
  const out = canvas.toDataURL("image/jpeg", quality);
  // Free canvas memory early (matters on iOS, which caps total canvas memory).
  canvas.width = canvas.height = 0;
  if (!out.startsWith("data:image/jpeg")) {
    throw new ImageProcessingError("Your browser couldn't encode the image.");
  }
  return out;
}

/**
 * Turns a camera/library File into a JPEG data URL, ≤1024px on the longest side and
 * (in practice) under ~500 KB. Throws ImageProcessingError with a user-friendly message.
 */
export async function fileToResizedDataUrl(file: File): Promise<string> {
  if (!looksLikeImage(file)) throw new ImageProcessingError("Please choose an image file.");
  if (file.size > MAX_INPUT_BYTES) throw new ImageProcessingError("That photo is too large (over 40 MB).");

  const src = await decode(file);
  try {
    // Step quality down, then size, until we're under the target budget.
    const attempts: Array<[number, number]> = [
      [MAX_DIMENSION, JPEG_QUALITY],
      [MAX_DIMENSION, 0.7],
      [MAX_DIMENSION, 0.6],
      [800, 0.6],
      [640, 0.55],
    ];
    let out = "";
    for (const [dim, q] of attempts) {
      out = render(src, dim, q);
      if (out.length <= TARGET_DATA_URL_BYTES) break;
    }
    return out;
  } finally {
    if ("close" in src) src.close();
  }
}
