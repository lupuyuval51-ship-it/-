import type { MaterialPage } from "@/types";

export interface PdfExtraction {
  pages: MaterialPage[];
  pageCount: number;
  /** none = קובץ סרוק (אין שכבת טקסט) */
  status: "ok" | "none";
}

const MIN_CHARS_PER_PAGE = 20;

/**
 * חילוץ טקסט מ-PDF בדפדפן (pdfjs-dist, נטען בעצלתיים). הקובץ לא נשלח לשום שרת.
 * אם כמעט אין טקסט (סריקה) – מחזיר status "none" כדי להציג הודעה ברורה ולא להעמיד פנים שנקרא.
 */
export async function extractPdfText(file: Blob, maxPages = 200): Promise<PdfExtraction> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const pages: MaterialPage[] = [];
  const n = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page: i, text });
  }
  const total = pages.reduce((a, p) => a + p.text.length, 0);
  await doc.destroy();
  return { pages, pageCount: doc.numPages, status: total >= MIN_CHARS_PER_PAGE * Math.max(1, Math.min(n, 3)) ? "ok" : "none" };
}
