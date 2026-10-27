"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/shared/Toaster";
import { RewardHost } from "@/components/shared/RewardHost";
import { ServiceWorkerRegistrar } from "@/components/layout/ServiceWorkerRegistrar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
      <RewardHost />
      <ServiceWorkerRegistrar />
    </>
  );
}
