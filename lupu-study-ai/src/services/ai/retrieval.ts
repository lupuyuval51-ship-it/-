import type { Citation, StudyMaterial } from "@/types";
import type { MaterialCtx } from "./schemas";

const HEB_PREFIXES = /^[ובהלכמש]{1,2}(?=[א-ת]{3,})/;

function tokens(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9֐-׿]{2,}/g) ?? []).map((t) => t.replace(HEB_PREFIXES, ""));
}

/** מנקה טקסט חומר מתגיות שעלולות לשבור את מבנה ההקשר (הגנה מפני הזרקת פרומפט) */
export function sanitizeMaterialText(s: string): string {
  return s.replace(/<\/?\s*study_material[^>]*>/gi, "").replace(/\s{3,}/g, "  ").trim();
}

export interface ChunkRef {
  materialId: string;
  index: number; // M1, M2...
  title: string;
  page: number | null;
  text: string;
}

/**
 * בוחר את העמודים הרלוונטיים ביותר מהחומרים לפי חפיפת מילים עם השאלה, עד תקרת תווים.
 * מחזיר גם מיפוי M1..Mn למזהי החומרים האמיתיים כדי לאמת הפניות שהמודל מחזיר.
 */
export function buildMaterialContext(materials: StudyMaterial[], query: string, maxChars = 18_000): { ctx: MaterialCtx[]; map: Record<string, { materialId: string; title: string; pages: (number | null)[] }> } {
  const q = new Set(tokens(query));
  const chunks: (ChunkRef & { score: number })[] = [];
  materials.slice(0, 6).forEach((m, mi) => {
    for (const p of m.pages) {
      const text = sanitizeMaterialText(p.text);
      if (!text) continue;
      const toks = tokens(text);
      let score = 0;
      for (const t of toks) if (q.has(t)) score++;
      chunks.push({ materialId: m.id, index: mi + 1, title: m.title, page: m.kind === "pdf" ? p.page : null, text: text.slice(0, 5500), score: m.pages.length === 1 ? score + 1 : score });
    }
  });
  chunks.sort((a, b) => b.score - a.score || a.index - b.index || (a.page ?? 0) - (b.page ?? 0));
  const picked: typeof chunks = [];
  let used = 0;
  for (const c of chunks) {
    if (picked.length >= 14 * 6) break;
    if (used + c.text.length > maxChars) continue;
    picked.push(c);
    used += c.text.length;
  }
  const ctx: MaterialCtx[] = [];
  const map: Record<string, { materialId: string; title: string; pages: (number | null)[] }> = {};
  for (const c of picked.sort((a, b) => a.index - b.index || (a.page ?? 0) - (b.page ?? 0))) {
    const id = `M${c.index}`;
    let m = ctx.find((x) => x.id === id);
    if (!m) {
      m = { id, title: c.title.slice(0, 160), pages: [] };
      ctx.push(m);
      map[id] = { materialId: c.materialId, title: c.title, pages: [] };
    }
    if (m.pages.length < 14) {
      m.pages.push({ page: c.page, text: c.text });
      map[id].pages.push(c.page);
    }
  }
  return { ctx, map };
}

export function renderMaterialsForPrompt(materials: MaterialCtx[] | undefined): string {
  if (!materials?.length) return "";
  return materials
    .flatMap((m) => m.pages.map((p) => `<study_material id="${m.id}" title="${m.title.replace(/["<>]/g, "")}"${p.page ? ` page="${p.page}"` : ""}>\n${sanitizeMaterialText(p.text)}\n</study_material>`))
    .join("\n");
}

const MARKER = /\[\[\s*(M\d{1,2})\s*(?::\s*p?\s*(\d{1,4}))?\s*\]\]/g;

/**
 * מאמת הפניות [[M1:p3]] שה-AI הוסיף: רק הפניות לחומר ולעמוד שנשלחו בפועל נשמרות
 * (מוחלפות בתווית קריאה). הפניות שאינן קיימות מוסרות – לא מציגים מקורות מומצאים.
 */
export function resolveCitations(text: string, map: Record<string, { materialId: string; title: string; pages: (number | null)[] }>): { text: string; citations: Citation[]; dropped: number } {
  const citations: Citation[] = [];
  let dropped = 0;
  const out = text.replace(MARKER, (_m, id: string, page?: string) => {
    const src = map[id];
    const n = page ? Number(page) : null;
    if (!src || (n !== null && !src.pages.includes(n))) {
      dropped++;
      return "";
    }
    if (!citations.some((c) => c.materialId === src.materialId && c.page === n)) citations.push({ materialId: src.materialId, page: n });
    return ` 📎 *${src.title}${n ? `, עמ׳ ${n}` : ""}*`;
  });
  return { text: out.replace(/[ \t]+\n/g, "\n"), citations, dropped };
}
