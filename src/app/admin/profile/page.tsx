import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminProfileForm } from "./_components/admin-profile-form";

export const metadata: Metadata = { title: "Admin Profile | GiveHand ET" };
export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin/profile");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Profile</h1>
        <p className="mt-1 text-xs text-muted-foreground">Manage your administrator account details.</p>
      </div>
      <AdminProfileForm
        initialProfile={{ id: user.id, email: user.email || "", fullName: profile?.full_name || "", phone: profile?.phone || "", bio: profile?.bio || "", city: profile?.city || "Addis Ababa" }}
      />
    </div>
  );
}
