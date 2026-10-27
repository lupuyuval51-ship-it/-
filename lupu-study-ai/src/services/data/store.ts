import type { AppData } from "@/types";
import { emptyData, normalizeData } from "./defaults";

export const STORAGE_KEY = "lupu:data:v1";

type Listener = () => void;
type ChangeListener = (prev: AppData, next: AppData) => void;

/**
 * מאגר נתונים קטן עם אחסון מקומי (localStorage), תואם useSyncExternalStore.
 * כל שינוי מחליף את האובייקט (immutable) כדי שרכיבים ירנדרו מחדש רק כשצריך,
 * ושכבת הסנכרון ל-Supabase תוכל לזהות שינויים לפי השוואת הפניות.
 */
class DataStore {
  private data: AppData = emptyData();
  private ready = false;
  private listeners = new Set<Listener>();
  private changeListeners = new Set<ChangeListener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveError: string | null = null;

  getSnapshot = (): AppData => this.data;
  getServerSnapshot = (): AppData => EMPTY;
  isReady = () => this.ready;
  getSaveError = () => this.saveError;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  onChange(l: ChangeListener) {
    this.changeListeners.add(l);
    return () => this.changeListeners.delete(l);
  }

  /** טעינה ראשונית מהדפדפן – נקראת פעם אחת אחרי hydration */
  init() {
    if (this.ready || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      this.data = raw ? normalizeData(JSON.parse(raw)) : emptyData();
    } catch {
      this.data = emptyData();
    }
    this.ready = true;
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          this.data = normalizeData(JSON.parse(e.newValue));
          this.emit();
        } catch {
          /* מתעלמים מנתון פגום מלשונית אחרת */
        }
      }
    });
    window.addEventListener("pagehide", () => this.flush());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush();
    });
    this.emit();
  }

  update(fn: (d: AppData) => AppData) {
    const prev = this.data;
    const next = fn(prev);
    if (next === prev) return;
    this.data = next;
    this.scheduleSave();
    this.emit();
    this.changeListeners.forEach((l) => l(prev, next));
  }

  /** מחליף את כל הנתונים (למשל אחרי משיכה מהענן או איפוס) */
  replace(next: AppData, notify = true) {
    const prev = this.data;
    this.data = next;
    this.scheduleSave();
    this.emit();
    if (notify) this.changeListeners.forEach((l) => l(prev, next));
  }

  flush() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = null;
    this.save();
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 150);
  }

  private save() {
    if (typeof window === "undefined" || !this.ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.saveError = null;
    } catch (e) {
      // מכסת אחסון מלאה או מצב גלישה פרטי
      this.saveError = e instanceof Error ? e.message : "שמירה נכשלה";
    }
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}

const EMPTY = emptyData();

export const dataStore = new DataStore();
