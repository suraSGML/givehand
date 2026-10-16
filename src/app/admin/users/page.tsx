import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listUsersAction } from "@/lib/actions/auth";
import { UserManagementList } from "./_components/user-management-list";

export const metadata: Metadata = { title: "User Management | Admin | GiveHand ET" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/admin/users");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const res = await listUsersAction();
  const users = res.success ? (res.users || []) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          View, manage roles, ban, or remove users registered on the platform.
        </p>
      </div>
      {!res.success && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
          {(res as any).error || "Failed to load users"}
        </div>
      )}
      <UserManagementList initialUsers={users} currentUserId={user.id} />
    </div>
  );
}
