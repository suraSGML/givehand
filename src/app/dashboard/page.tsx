import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  Package,
  DollarSign,
  Award,
  ArrowRight,
  Clock,
  QrCode,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserCommitments } from "@/lib/actions/volunteers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Supporter Dashboard | GiveHand ET",
  description: "Track your community impact, volunteer shifts, material pledges, and donations.",
};

export default async function SupporterDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, city, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const fullName = profile?.full_name || "Abebe Bikila";
  const { stats, commitments } = await getUserCommitments();

  const nextShift = commitments.find(
    (c) => c.status === "approved" || c.status === "confirmed"
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-teal-200" />
            <span>Community Impact Hub</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {fullName}!
          </h1>

          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
            Your contributions empower vulnerable communities across Ethiopia.
            You have earned <strong className="text-white">{stats.totalHours} verified service hours</strong> and currently have <strong className="text-white">{stats.activePassesCount} active digital passes</strong>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/commitments"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-teal-900 px-5 py-3 text-xs font-bold shadow-md hover:bg-teal-50 transition-all cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>View My Passes</span>
            </Link>
            <Link
              href="/needs"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white px-5 py-3 text-xs font-bold backdrop-blur-md transition-all cursor-pointer"
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Explore Active Campaigns</span>
            </Link>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Grid of Main Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Volunteer Hours & Passes */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-teal-500/10 text-teal-600 px-2.5 py-0.5 text-xs font-bold">
                {stats.activePassesCount} Active
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Volunteer Service
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Verified community hours and event check-in passes.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/60 p-4 space-y-2 border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Logged Hours:</span>
                <span className="font-bold text-foreground font-display text-base">
                  {stats.totalHours} hrs
                </span>
              </div>
              {nextShift && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">Next Event:</span>
                  <span className="font-semibold text-teal-600 truncate max-w-[150px]">
                    {nextShift.needTitle}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/dashboard/commitments"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2.5 text-xs font-bold shadow transition-colors"
            >
              <span>Manage Passes & Hours</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Module 2: Material Donations (Preview for Phase 5) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                <Package className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-amber-500/10 text-amber-600 px-2.5 py-0.5 text-xs font-bold">
                Physical Goods
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Material Pledges
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Books, medical supplies, warm blankets, and equipment.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/60 p-4 space-y-2 border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Pledges:</span>
                <span className="font-bold text-foreground font-display text-base">
                  2 shipments
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold text-amber-600">
                  Drop-off Scheduled
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/needs?type=material"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground py-2.5 text-xs font-bold transition-colors"
            >
              <span>Pledge Items</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Module 3: Monetary Support (Preview for Phase 6) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between hover:border-emerald-500/50 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 text-xs font-bold">
                Telebirr / CBE
              </span>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Financial Giving
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Direct ETB donations with instant transaction receipts.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/60 p-4 space-y-2 border border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Contributed:</span>
                <span className="font-bold text-foreground font-display text-base">
                  5,000 ETB
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Verified Receipts:</span>
                <span className="font-semibold text-emerald-600">
                  1 Receipt Issued
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/needs?type=money"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground py-2.5 text-xs font-bold transition-colors"
            >
              <span>Donate in ETB</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
