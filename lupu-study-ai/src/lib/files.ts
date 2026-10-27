/** מגבלות וסוגי קבצים מותרים – משותפות ללקוח ולשרת */
export const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
export const MAX_TEXT_BYTES = 1 * 1024 * 1024;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const AI_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export type FileCheck = { ok: true; kind: "image" | "pdf" | "text" } | { ok: false; error: string };

export function checkFile(file: { name: string; type: string; size: number }, allow: ("image" | "pdf" | "text")[] = ["image", "pdf", "text"]): FileCheck {
  const type = file.type || guessType(file.name);
  if ((IMAGE_TYPES as readonly string[]).includes(type) && allow.includes("image")) {
    return file.size > MAX_IMAGE_BYTES ? { ok: false, error: `התמונה גדולה מדי (מקסימום ${MAX_IMAGE_BYTES / 1024 / 1024}MB)` } : { ok: true, kind: "image" };
  }
  if (type === "application/pdf" && allow.includes("pdf")) {
    return file.size > MAX_PDF_BYTES ? { ok: false, error: `קובץ ה-PDF גדול מדי (מקסימום ${MAX_PDF_BYTES / 1024 / 1024}MB)` } : { ok: true, kind: "pdf" };
  }
  if ((type === "text/plain" || type === "text/markdown") && allow.includes("text")) {
    return file.size > MAX_TEXT_BYTES ? { ok: false, error: "קובץ הטקסט גדול מדי (מקסימום 1MB)" } : { ok: true, kind: "text" };
  }
  return { ok: false, error: "סוג קובץ לא נתמך. אפשר להעלות תמונות (JPG, PNG, WebP), PDF וקובצי טקסט." };
}

function guessType(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".txt")) return "text/plain";
  if (n.endsWith(".md")) return "text/markdown";
  return "";
}

export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** מקטין תמונה גדולה (צילום טלפון) לפני שליחה לניתוח, כדי לחסוך רוחב פס ועלות */
export async function downscaleImage(file: Blob, maxSide = 1600, quality = 0.85): Promise<Blob> {
  if (typeof createImageBitmap === "undefined") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res) => canvas.toBlob((b) => res(b ?? file), "image/jpeg", quality));
  } catch {
    return file;
  }
}
