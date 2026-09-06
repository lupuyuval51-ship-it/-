"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { AppShell } from "@/components/AppShell";
import { FullPageSkeleton, HydrationGate } from "@/components/HydrationGate";

/** Sends users without a completed profile to onboarding (built outside this route group). */
function OnboardingGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const onboardingCompleted = useAppStore((s) => s.profile?.onboardingCompleted ?? false);
  const needsOnboarding = hydrated && !onboardingCompleted;

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  if (needsOnboarding) return <FullPageSkeleton />;
  return <>{children}</>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <HydrationGate>
      <OnboardingGuard>
        <AppShell>{children}</AppShell>
      </OnboardingGuard>
    </HydrationGate>
  );
}
