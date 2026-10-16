import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Building, Award, BarChart3, LogOut, ExternalLink, Users, UserCircle } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in
  if (!user) redirect("/login?redirectTo=/admin");

  // Logged in but wrong role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Admin top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-slate-950 text-xs font-black">
              GH
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">
                GiveHand ET{" "}
                <span className="text-amber-400">Admin</span>
              </span>
              <span className="block text-[10px] text-slate-400">
                Governance &amp; Verification
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-slate-400">
              {profile?.full_name || user.email}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-white"
            >
              Public site <ExternalLink className="h-3 w-3" />
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="border-t border-slate-800 bg-slate-900/80 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto py-2.5 text-xs font-semibold">
            <Link href="/admin" className="flex shrink-0 items-center gap-1.5 text-slate-300 transition-colors hover:text-white">
              <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
              Analytics
            </Link>
            <Link href="/admin/organizations" className="flex shrink-0 items-center gap-1.5 text-slate-300 transition-colors hover:text-white">
              <Building className="h-3.5 w-3.5 text-amber-400" />
              Organization Verification
            </Link>
            <Link href="/admin/users" className="flex shrink-0 items-center gap-1.5 text-slate-300 transition-colors hover:text-white">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              User Management
            </Link>
            <Link href="/verify" className="flex shrink-0 items-center gap-1.5 text-slate-300 transition-colors hover:text-white">
              <Award className="h-3.5 w-3.5 text-teal-400" />
              Certificate Registry
            </Link>
            <Link href="/admin/profile" className="flex shrink-0 items-center gap-1.5 text-slate-300 transition-colors hover:text-white">
              <UserCircle className="h-3.5 w-3.5 text-slate-400" />
              My Profile
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
