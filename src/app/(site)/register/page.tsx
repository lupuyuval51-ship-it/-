import { redirect } from "next/navigation";
import { plansEnabled } from "@/server/env";
import { AuthForm } from "@/components/forms/AuthForm";
import { isGoogleEnabled } from "@/server/auth/google/protocol";
import { getCurrentUser } from "@/server/auth/current";
import { getRegion } from "@/server/region";
import { titleFor } from "@/components/layout/pageTitle";

export const generateMetadata = titleFor("auth.submit.register");

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthForm mode="register" next="/dashboard" defaultRegion={await getRegion()} googleEnabled={isGoogleEnabled()} plansOff={!plansEnabled()} />;
}
