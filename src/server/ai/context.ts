/** Renders the validated CoachContext to a compact text block for the (uncached) second system block. */
import type { CoachContext, Locale } from "@/lib/types";

const HE = {
  profile: "פרופיל", stats: "סטטיסטיקה", recent: "אימונים אחרונים", load: "עומס השבוע", pbs: "שיאים אישיים", plan: "תוכנית נוכחית", checkin: "צ'ק-אין היום",
  name: "שם", age: "קבוצת גיל", hand: "יד", level: "רמה", years: "ותק", role: "תפקיד", secondary: "תפקיד משני", intent: "כוונה", goals: "מטרות",
  participants: "משתתפים", equipment: "ציוד", field: "מגרש", wind: "רוח", duration: "משך אימון", perWeek: "אימונים בשבוע", fitness: "כושר",
  sessions: "אימונים", minutes: "דקות", throws: "זריקות", catches: "תפיסות", streak: "רצף ימים", xpLevel: "רמת XP", weak: "מיומנויות לחיזוק",
  strong: "מיומנויות חזקות", readiness: "מוכנות לתפקיד", none: "ללא", yes: "כן", no: "לא", week: "שבוע", theme: "נושא", feeling: "הרגשה", energy: "אנרגיה", pain: "כאב", surface: "משטח",
};
const EN: typeof HE = {
  profile: "Profile", stats: "Stats", recent: "Recent sessions", load: "This week's load", pbs: "Personal bests", plan: "Current plan", checkin: "Today's check-in",
  name: "Name", age: "Age group", hand: "Hand", level: "Level", years: "Experience", role: "Role", secondary: "Secondary role", intent: "Intent", goals: "Goals",
  participants: "Participants", equipment: "Equipment", field: "Field", wind: "Wind", duration: "Session length", perWeek: "Sessions per week", fitness: "Fitness",
  sessions: "Sessions", minutes: "Minutes", throws: "Throws", catches: "Catches", streak: "Streak days", xpLevel: "XP level", weak: "Skills to strengthen",
  strong: "Strong skills", readiness: "Role readiness", none: "none", yes: "yes", no: "no", week: "Week", theme: "Theme", feeling: "Feeling", energy: "Energy", pain: "Pain", surface: "Surface",
};

function kv(entries: [string, unknown][]): string {
  return entries
    .filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
    .join(" | ");
}

function metrics(m: Partial<Record<string, number>> | undefined): string {
  if (!m) return "";
  return Object.entries(m)
    .filter(([, v]) => typeof v === "number")
    .slice(0, 12)
    .map(([k, v]) => `${k}=${Math.round((v as number) * 10) / 10}`)
    .join(", ");
}

export function renderContext(ctx: CoachContext): string {
  const locale: Locale = ctx.locale;
  const t = locale === "he" ? HE : EN;
  const lines: string[] = [locale === "he" ? "הקשר המתאמן (נתונים בלבד):" : "Athlete context (data only):", `locale: ${locale}`];
  if (ctx.profile) {
    const p = ctx.profile;
    lines.push(`${t.profile}: ${kv([
      [t.name, p.name], [t.age, p.ageGroup], [t.hand, p.hand], [t.level, p.level], [t.years, p.yearsPlaying], [t.role, p.primaryRole], [t.secondary, p.secondaryRole],
      [t.intent, p.roleIntent], [t.goals, p.goals], [t.participants, p.participants], [t.equipment, p.equipment.length ? p.equipment : t.none], [t.field, p.fieldSize],
      [t.wind, p.wind], [t.duration, `${p.durationMinutes} min`], [t.perWeek, p.sessionsPerWeek], [t.fitness, p.includeFitness ? t.yes : t.no],
    ])}`);
  }
  if (ctx.stats) {
    const s = ctx.stats;
    lines.push(`${t.stats}: ${kv([
      [t.sessions, s.sessionsCompleted], [t.minutes, s.totalMinutes], [t.throws, s.totalThrows], [t.catches, s.totalCatches], [t.streak, s.streakDays], [t.xpLevel, s.level],
      ["backhand%", s.backhandAccuracy], ["forehand%", s.forehandAccuracy], ["hammer%", s.hammerAccuracy], ["longest_throw_m", s.longestThrowM], ["catch_streak", s.catchStreak],
      ["sprint_s", s.sprintTimeS], ["cod_s", s.codTimeS], [t.weak, s.weakSkills], [t.strong, s.strongSkills], [t.readiness, metrics(s.readiness)],
    ])}`);
  }
  if (ctx.recentSessions?.length) {
    lines.push(`${t.recent}:`);
    for (const r of ctx.recentSessions) {
      lines.push(`- ${r.date} "${r.title}" ${r.minutes}min ${r.role}` + kv([
        [" acc%", r.accuracyPct], ["bh%", r.backhandAccuracy], ["fh%", r.forehandAccuracy], ["difficulty", r.difficulty], ["feeling", r.feeling], ["metrics", metrics(r.keyMetrics)], ["note", r.note],
      ]).replace(/^/, " "));
    }
  }
  if (ctx.weeklyLoad) lines.push(`${t.load}: ${kv([[t.sessions, ctx.weeklyLoad.sessionsThisWeek], [t.minutes, ctx.weeklyLoad.minutesThisWeek], ["planned", ctx.weeklyLoad.plannedThisWeek]])}`);
  if (ctx.personalBests && Object.keys(ctx.personalBests).length) lines.push(`${t.pbs}: ${metrics(ctx.personalBests)}`);
  if (ctx.currentPlan) lines.push(`${t.plan}: ${t.week} ${ctx.currentPlan.weekIndex + 1}/${ctx.currentPlan.weeksCount}, ${t.theme}: ${ctx.currentPlan.weekTheme}, ${t.role}: ${ctx.currentPlan.role}`);
  if (ctx.checkin) lines.push(`${t.checkin}: ${kv([[t.feeling, ctx.checkin.feeling], [t.energy, ctx.checkin.energy], [t.pain, ctx.checkin.pain], [t.surface, ctx.checkin.surface], [t.wind, ctx.checkin.wind]])}`);
  return lines.join("\n");
}
