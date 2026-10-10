import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/AuthForm";
import { getCurrentUser } from "@/server/auth/current";
import { getRegion } from "@/server/region";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthForm mode="register" next="/dashboard" defaultRegion={await getRegion()} />;
}
