import {
  Atom, BookMarked, BookOpen, BookOpenText, Brain, Calculator, CalendarCheck, CalendarHeart, CheckCheck, ClipboardCheck, Code2,
  Crown, Dna, FlaskConical, Flame, Globe2, GraduationCap, Landmark, Languages, Layers, Lightbulb, Medal, Music, NotebookPen,
  Palette, Rocket, ScrollText, Sigma, SpellCheck, Sparkles, Target, Timer, TrendingUp, Trophy, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Atom, BookMarked, BookOpen, BookOpenText, Brain, Calculator, CalendarCheck, CalendarHeart, CheckCheck, ClipboardCheck, Code2,
  Crown, Dna, FlaskConical, Flame, Globe2, GraduationCap, Landmark, Languages, Layers, Lightbulb, Medal, Music, NotebookPen,
  Palette, Rocket, ScrollText, Sigma, SpellCheck, Sparkles, Target, Timer, TrendingUp, Trophy,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? BookOpen;
  return <C className={className} aria-hidden />;
}
