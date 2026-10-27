"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WEEKDAYS_SHORT, parseDateStr } from "@/lib/dates";

export interface DayPoint {
  day: string;
  minutes: number;
}

/** עמודות זמן לימוד לפי יום. הציר ממוקם בצד ימין כדי להתאים ל-RTL */
export default function WeeklyBars({ points, goal, height = 180 }: { points: DayPoint[]; goal?: number; height?: number }) {
  const rows = points.map((p) => ({ ...p, label: points.length <= 7 ? WEEKDAYS_SHORT[parseDateStr(p.day).getDay()] : `${parseDateStr(p.day).getDate()}/${parseDateStr(p.day).getMonth() + 1}` }));
  return (
    <div style={{ height }} dir="ltr" role="img" aria-label={`זמן לימוד: ${rows.map((r) => `${r.label} ${r.minutes} דקות`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: -18, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" reversed tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} interval={points.length > 14 ? 4 : 0} />
          <YAxis orientation="right" tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", direction: "rtl" }}
            formatter={(v: number) => [`${v} דקות`, "לימוד"]}
            labelFormatter={(l) => `יום ${l}`}
          />
          <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={36}>
            {rows.map((r, i) => (
              <Cell key={i} fill={goal && r.minutes >= goal ? "hsl(var(--accent))" : "hsl(var(--primary))"} fillOpacity={r.minutes === 0 ? 0.25 : 1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
