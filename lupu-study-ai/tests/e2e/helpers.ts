import type { Page } from "@playwright/test";
import { emptyData } from "@/services/data/defaults";
import * as R from "@/services/data/reducers";
import type { AppData } from "@/types";

export const NOKEY = "http://localhost:3102";
export const LIMITED = "http://localhost:3103";
export const MOCK = "http://127.0.0.1:4010";

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T12:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** נתוני משתמש שסיים הקמה (שם נועה, כיתה ח׳, מתמטיקה+אנגלית) */
export function onboarded(mutate: (d: AppData) => AppData = (d) => d): AppData {
  const d = R.completeOnboarding(emptyData(), { displayName: "נועה", grade: 8, subjectKeys: ["math", "english"], goals: ["exams"], dailyMinutes: 30 }).data;
  return mutate(d);
}

/** מזריע את האחסון המקומי לפני טעינת האפליקציה (רק אם עוד אין נתונים, כך שרענון לא דורס שינויים) */
export async function seed(page: Page, data: AppData | null) {
  await page.addInitScript((payload) => {
    try {
      if (payload && !localStorage.getItem("lupu:data:v1")) localStorage.setItem("lupu:data:v1", payload);
    } catch { /* ignore */ }
  }, data ? JSON.stringify(data) : null);
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      // משאבי רשת שנחסמו בכוונה בבדיקות (offline) אינם שגיאות אפליקציה
      if (/Failed to load resource|net::ERR|ERR_INTERNET_DISCONNECTED|Failed to fetch RSC payload|unknown error occurred when fetching the script/.test(t)) return;
      errors.push(`console: ${t}`);
    }
  });
  return errors;
}

export async function storeData(page: Page): Promise<AppData> {
  await page.waitForTimeout(400); // שמירה מושהית (debounce)
  return page.evaluate(() => JSON.parse(localStorage.getItem("lupu:data:v1") ?? "{}"));
}

/** PNG סולידי בגודל נתון (ללא תלות חיצונית) */
import { deflateSync } from "node:zlib";
export function makePng(size: number, rgb: [number, number, number]): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf: Buffer) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => rgb).flat())]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** PDF מינימלי עם שכבת טקסט (עמוד לכל מחרוזת). אם הרשימה ריקה – עמוד ריק (כמו סריקה). */
export function makePdf(pages: string[]): Buffer {
  const objs: string[] = [];
  const n = Math.max(1, pages.length);
  objs.push("<< /Type /Catalog /Pages 2 0 R >>");
  objs.push(`<< /Type /Pages /Kids [${Array.from({ length: n }, (_, i) => `${4 + i * 2} 0 R`).join(" ")}] /Count ${n} >>`);
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  for (let i = 0; i < n; i++) {
    objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${5 + i * 2} 0 R /Resources << /Font << /F1 3 0 R >> >> >>`);
    const stream = pages[i] ? `BT /F1 18 Tf 72 700 Td (${pages[i].replace(/[()\\]/g, "")}) Tj ET` : "";
    objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}
