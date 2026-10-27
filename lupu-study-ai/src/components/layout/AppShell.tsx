"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { useData, useReady } from "@/hooks/useApp";
import { useOnline } from "@/hooks/useOnline";
import { PageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { DemoBanner } from "./DemoBanner";
import { SyncHost } from "@/components/layout/SyncHost";
import { ReminderHost } from "./ReminderHost";

export function AppShell({ children }: { children: ReactNode }) {
  const ready = useReady();
  const data = useData();
  const online = useOnline();
  const router = useRouter();
  const pathname = usePathname();
  /** מסכי "מילוי גובה" (שיחה): המסך עצמו לא גולל, ורק אזור ההודעות גולל */
  const fill = pathname.startsWith("/tutor");
  const onboarded = !!data.profile?.onboarded;

  useEffect(() => {
    if (ready && !onboarded) router.replace("/onboarding");
  }, [ready, onboarded, router]);

  return (
    <div className={fill ? "h-dvh overflow-hidden" : "min-h-dvh"}>
      <Sidebar />
      <div className={cn("lg:ps-64", fill && "flex h-full flex-col")}>
        <Header />
        {!online && (
          <div role="status" className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-center text-sm font-semibold text-warning">
            <WifiOff className="size-4" /> אין חיבור לאינטרנט. הנתונים נשמרים במכשיר, ופיצ׳רי ה-AI יחזרו כשהחיבור יחזור.
          </div>
        )}
        {ready && onboarded && <DemoBanner />}
        <main id="main" tabIndex={-1} className={cn("mx-auto w-full max-w-6xl px-4 outline-none lg:px-8", fill ? "min-h-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-3 lg:pb-4" : "pb-28 pt-6 lg:pb-12")}>
          {ready && onboarded ? children : <PageSkeleton />}
        </main>
      </div>
      <BottomNav />
      <SyncHost />
      {ready && onboarded && <ReminderHost />}
    </div>
  );
}


