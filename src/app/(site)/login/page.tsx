import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { safeNext } from "@/lib/safe-redirect";
import { isGoogleEnabled } from "@/server/auth/google/protocol";
import { getCurrentUser } from "@/server/auth/current";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("nav.login");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const dest = safeNext(next);
  if (await getCurrentUser()) redirect(dest);
  return <AuthForm mode="login" next={dest} defaultRegion={null} googleEnabled={isGoogleEnabled()} googleError={error?.startsWith("google_") ? error.slice(7) : null} />;
}
