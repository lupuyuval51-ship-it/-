import { Suspense } from "react";
import type { Metadata } from "next";
import TutorClient from "@/components/tutor/TutorClient";
import { PageSkeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "מורה AI" };

export default function TutorPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TutorClient />
    </Suspense>
  );
}
