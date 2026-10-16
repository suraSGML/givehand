import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./_components/onboarding-form";

export const metadata: Metadata = {
  title: "Complete Your Profile",
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If profile is complete, redirect to appropriate dashboard
  if (profile?.full_name && profile?.city) {
    const role = profile.role;
    redirect(
      role === "admin" ? "/admin" : role === "organization" ? "/org/dashboard" : "/dashboard"
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">
            Welcome to GiveHand ET! 🎉
          </h1>
          <p className="mt-2 text-muted-foreground">
            Complete your profile to get started
          </p>
        </div>
        <div className="card-glass rounded-2xl p-6 md:p-8 shadow-lg">
          <OnboardingForm
            userId={user.id}
            role={profile?.role ?? "supporter"}
            email={user.email ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
