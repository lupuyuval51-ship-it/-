export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** מוצג בניווט התחתון בטלפון */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "בית", icon: "Home", primary: true },
  { href: "/tutor", label: "מורה AI", icon: "Sparkles", primary: true },
  { href: "/subjects", label: "מקצועות", icon: "Library", primary: true },
  { href: "/homework", label: "שיעורי בית", icon: "NotebookPen", primary: true },
  { href: "/exams", label: "מבחנים", icon: "GraduationCap", primary: true },
  { href: "/scan", label: "צלם שאלה", icon: "Camera" },
  { href: "/library", label: "ספריית חומרים", icon: "FolderOpen" },
  { href: "/summaries", label: "סיכומים", icon: "FileText" },
  { href: "/flashcards", label: "כרטיסיות", icon: "Layers" },
  { href: "/calendar", label: "לוח שנה", icon: "CalendarDays" },
  { href: "/focus", label: "מצב ריכוז", icon: "Timer" },
  { href: "/progress", label: "התקדמות", icon: "BarChart3" },
  { href: "/achievements", label: "הישגים", icon: "Trophy" },
  { href: "/settings", label: "הגדרות", icon: "Settings" },
];

export const SIDEBAR_GROUPS: { title: string; hrefs: string[] }[] = [
  { title: "ראשי", hrefs: ["/dashboard", "/tutor", "/scan"] },
  { title: "לימוד", hrefs: ["/subjects", "/library", "/summaries", "/flashcards", "/exams", "/focus"] },
  { title: "ארגון", hrefs: ["/homework", "/calendar", "/progress", "/achievements"] },
  { title: "חשבון", hrefs: ["/settings"] },
];
