import * as React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  Package,
  HeartHandshake,
  HandHeart,
  Award,
  LayoutDashboard,
  Building2,
  User,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "@/components/layout/notification-bell";
import { getNotifications } from "@/lib/actions/notifications";
import { logoutAction } from "@/lib/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "organization") {
    redirect("/org/dashboard");
  }
  if (profile?.role === "admin") {
    redirect("/admin");
  }

  const role = profile?.role as string | undefined;

  const fullName = profile?.full_name || "Supporter";

  const { notifications, unreadCount } = await getNotifications("supporter");

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Sub-header navigation bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-bold text-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-sm">
                GH
              </div>
              <span className="hidden sm:inline">GiveHand ET</span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </Link>
              <Link
                href="/dashboard/commitments"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                <span>Volunteer Passes</span>
              </Link>
              <Link
                href="/dashboard/materials"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Package className="h-3.5 w-3.5 text-amber-600" />
                <span>Material Pledges</span>
              </Link>
              <Link
                href="/dashboard/donations"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <HandHeart className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Donations</span>
              </Link>
              <Link
                href="/dashboard/certificates"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Award className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Certificates</span>
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <User className="h-3.5 w-3.5 text-teal-600" />
                <span>Profile</span>
              </Link>
              <Link
                href="/needs"
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <HeartHandshake className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Browse Needs</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {role === "organization" && (
              <Link
                href="/org/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
                <span className="hidden sm:inline">Org Portal</span>
              </Link>
            )}

            {/* Notification Bell */}
            <NotificationBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />

            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2 rounded-xl p-1 hover:bg-muted transition-colors"
              title="My Profile"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold shadow-sm">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-semibold text-foreground truncate max-w-[120px]">
                  {fullName}
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {role}
                </div>
              </div>
            </Link>

            {/* Sign Out Button */}
            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign out"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
