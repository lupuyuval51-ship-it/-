"use client";
import type { ReactNode } from "react";
import { useAppStore } from "@/store/appStore";
import { useT } from "@/i18n/useT";
import { Skeleton, SkeletonCard } from "./ui/Skeleton";

/** Generic full-page placeholder: header line, a hero block and three list cards. */
export function FullPageSkeleton() {
  const { t } = useT();
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-6" role="status" aria-label={t("ui.skeleton.loading")}>
      <Skeleton variant="text" width="45%" className="[&>div]:h-7" />
      <Skeleton height={140} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

/** Renders children only after the persisted store has hydrated; shows a skeleton until then. */
export function HydrationGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const hydrated = useAppStore((s) => s.hydrated);
  if (!hydrated) return <>{fallback ?? <FullPageSkeleton />}</>;
  return <>{children}</>;
}
