"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const fallback = () => <Skeleton className="h-44 w-full" />;

/** גרפים נטענים בעצלתיים כדי לא לנפח את החבילה הראשונית */
export const WeeklyBars = dynamic(() => import("./WeeklyBars"), { ssr: false, loading: fallback });
export const MasteryChart = dynamic(() => import("./ProgressCharts").then((m) => m.MasteryChart), { ssr: false, loading: fallback });
export const ScoreChart = dynamic(() => import("./ProgressCharts").then((m) => m.ScoreChart), { ssr: false, loading: fallback });
