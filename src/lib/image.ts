// OWNER: Member A (Camera / Capture)
// Client-side only. Converts the picked/captured photo into a data URL for upload.

/**
 * TODO(A2): Resize to max 1024px on the longest side and re-encode as JPEG (~0.8 quality)
 *   using createImageBitmap + <canvas>. Raw phone photos are 3–12 MB, and Vercel's
 *   serverless body limit is 4.5 MB, so without this real uploads WILL fail in production.
 * TODO(A3): Handle HEIC / EXIF orientation / createImageBitmap failures.
 */
export async function fileToResizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file); // placeholder: NO resizing yet
  });
}
