import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./_components/profile-form";
import { PasswordForm } from "./_components/password-form";
import { User, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "My Profile | GiveHand ET",
  description: "Update your supporter profile, skills, and preferences.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/dashboard/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role === "organization") {
    redirect("/org/profile");
  }
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update your personal information and preferences.
        </p>
      </div>

      {/* Profile info section */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30">
            <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Personal Information
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visible to organizations you apply to
            </p>
          </div>
        </div>
        <div className="p-6">
          <ProfileForm
            userId={user.id}
            email={user.email ?? ""}
            initialData={{
              fullName:     profile?.full_name     ?? "",
              phone:        profile?.phone         ?? "",
              city:         profile?.city          ?? "",
              subcity:      profile?.subcity        ?? "",
              bio:          profile?.bio            ?? "",
              skills:       profile?.skills         ?? [],
              interests:    profile?.interests      ?? [],
              availability: profile?.availability   ?? "",
            }}
          />
        </div>
      </div>

      {/* Password section */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
            <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Change Password
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Leave blank to keep your current password
            </p>
          </div>
        </div>
        <div className="p-6">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
