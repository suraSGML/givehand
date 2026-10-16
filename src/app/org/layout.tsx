import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  Building,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getNotifications } from "@/lib/actions/notifications";

export default async function OrgPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in
  if (!user) redirect("/login?redirectTo=/org/dashboard");

  // Check role — only organization and admin may access the org portal
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "organization" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  // Fetch the user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("name, status, slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  const isVerified = org?.status === "verified";
  const orgName    = org?.name ?? "Your Organization";

  const { notifications, unreadCount } = await getNotifications("organization");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Org portal top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: brand + org name + verification badge */}
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="shrink-0 text-lg font-black text-teal-600 dark:text-teal-400">
              GH<span className="text-amber-500">ET</span>
            </Link>
            <span className="hidden text-slate-300 dark:text-slate-600 sm:block">/</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {orgName}
              </span>
              {isVerified ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <ShieldAlert className="h-3 w-3" /> Pending
                </span>
              )}
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/org/needs/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Post Need</span>
            </Link>

            <NotificationBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Sub-navigation */}
        <div className="border-t border-slate-100 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto text-xs font-semibold">
            <Link href="/org/dashboard" className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent py-3 text-slate-500 transition-colors hover:border-teal-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <Link href="/org/needs" className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent py-3 text-slate-500 transition-colors hover:border-teal-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
              <Layers className="h-3.5 w-3.5" /> Needs
            </Link>
            <Link href="/org/profile" className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent py-3 text-slate-500 transition-colors hover:border-teal-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400">
              <Building className="h-3.5 w-3.5" /> Profile &amp; Docs
            </Link>
            {org?.slug && (
              <Link href={`/organizations/${org.slug}`} target="_blank" className="ml-auto flex shrink-0 items-center gap-1 py-3 text-slate-400 transition-colors hover:text-teal-600 dark:hover:text-teal-400">
                Public page <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Pending-verification banner */}
      {!isVerified && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Pending verification.</strong> Upload your registration documents so an admin can approve your organization. You can create draft needs in the meantime.
              </span>
            </div>
            <Link href="/org/profile" className="shrink-0 font-bold underline hover:no-underline">
              Upload docs →
            </Link>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
