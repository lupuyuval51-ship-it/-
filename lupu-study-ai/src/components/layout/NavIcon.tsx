import { BarChart3, Camera, CalendarDays, FileText, FolderOpen, GraduationCap, Home, Layers, Library, NotebookPen, Settings, Sparkles, Timer, Trophy, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = { BarChart3, Camera, CalendarDays, FileText, FolderOpen, GraduationCap, Home, Layers, Library, NotebookPen, Settings, Sparkles, Timer, Trophy };

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const C = MAP[name] ?? Home;
  return <C className={className} aria-hidden />;
}
