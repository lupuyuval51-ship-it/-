"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface MasteryPoint {
  name: string;
  percent: number;
  color: string;
}
export interface ScorePoint {
  label: string;
  score: number;
}

const axis = { fill: "hsl(var(--muted-foreground))", fontSize: 12 };
const tooltipStyle = { borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))", direction: "rtl" as const };

export function MasteryChart({ points }: { points: MasteryPoint[] }) {
  return (
    <div style={{ height: Math.max(160, points.length * 44 + 30) }} dir="ltr" role="img" aria-label={`שליטה משוערת לפי מקצוע: ${points.map((p) => `${p.name} ${p.percent}%`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={axis} unit="%" reversed />
          <YAxis type="category" dataKey="name" orientation="right" width={80} tickLine={false} axisLine={false} tick={axis} />
          <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "שליטה משוערת"]} />
          <Bar dataKey="percent" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {points.map((p, i) => <Cell key={i} fill={p.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreChart({ points }: { points: ScorePoint[] }) {
  return (
    <div style={{ height: 220 }} dir="ltr" role="img" aria-label={`ציוני סימולציות: ${points.map((p) => `${p.label} ${p.score}%`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: -12, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" reversed tickLine={false} axisLine={false} tick={axis} />
          <YAxis orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} tick={axis} unit="%" />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "ציון"]} />
          <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
