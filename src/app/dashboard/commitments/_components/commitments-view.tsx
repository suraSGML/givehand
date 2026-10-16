"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Award,
  CheckCircle2,
  AlertCircle,
  Building2,
  ExternalLink,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { VolunteerQrCard } from "@/components/volunteers/volunteer-qr-card";
import type { SupporterCommitment } from "@/lib/actions/volunteers";

interface CommitmentsViewProps {
  initialCommitments: SupporterCommitment[];
  stats: {
    totalHours: number;
    completedCount: number;
    upcomingCount: number;
    activePassesCount: number;
  };
}

export function CommitmentsView({
  initialCommitments,
  stats: initialStats,
}: CommitmentsViewProps) {
  const router = useRouter();
  const [commitments, setCommitments] = React.useState<SupporterCommitment[]>(
    initialCommitments
  );
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"active" | "history">("active");
  const [selectedPass, setSelectedPass] = React.useState<SupporterCommitment | null>(
    null
  );

  // Sync state when initialCommitments change
  React.useEffect(() => {
    setCommitments(initialCommitments);
  }, [initialCommitments]);

  // Real-time listener & window focus refresh
  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("supporter-commitments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "volunteer_applications",
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    const onFocus = () => {
      router.refresh();
    };
    window.addEventListener("focus", onFocus);
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [router]);

  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [router]);

  // Dynamically calculate stats based on latest commitments state
  const stats = React.useMemo(() => {
    const totalHours = commitments.reduce((acc, cur) => acc + (cur.hoursLogged || 0), 0);
    const completedCount = commitments.filter((c) => c.status === "completed").length;
    const upcomingCount = commitments.filter(
      (c) => c.status === "approved" || c.status === "confirmed" || c.status === "applied"
    ).length;
    const activePassesCount = commitments.filter(
      (c) => c.status === "approved" || c.status === "confirmed"
    ).length;
    return {
      totalHours: totalHours || initialStats.totalHours,
      completedCount,
      upcomingCount,
      activePassesCount,
    };
  }, [commitments, initialStats]);

  const activeCommitments = commitments.filter(
    (c) => c.status !== "completed" && c.status !== "rejected" && c.status !== "cancelled"
  );
  const historyCommitments = commitments.filter(
    (c) => c.status === "completed" || c.status === "rejected" || c.status === "cancelled"
  );

  function formatShiftDate(isoString: string | null) {
    if (!isoString) return "Flexible Date";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  }

  function formatShiftTime(start: string | null, end: string | null) {
    if (!start || !end) return "Flexible Hours";
    try {
      const s = new Date(start).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const e = new Date(end).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${s} - ${e}`;
    } catch {
      return "Scheduled Window";
    }
  }

  // Calculate certificate milestone (e.g. 10 hours for Bronze Certificate)
  const nextMilestone = 10;
  const progressPercent = Math.min(100, Math.round((stats.totalHours / nextMilestone) * 100));

  return (
    <div className="space-y-8">
      {/* Header Refresh Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground">Live Activity Sync</span>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-teal-600 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "Refreshing..." : "Refresh Status"}</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Verified Hours */}
        <div className="rounded-3xl border border-teal-500/20 bg-card p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Verified Hours
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-foreground">
            {stats.totalHours} <span className="text-sm font-semibold text-muted-foreground">hrs</span>
          </div>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
            {stats.completedCount} completed engagements
          </p>
        </div>

        {/* Metric 2: Active Passes */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Passes
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <QrCode className="h-4 w-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-foreground">
            {stats.activePassesCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Ready for entrance check-in</p>
        </div>

        {/* Metric 3: Upcoming Shifts */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Upcoming Shifts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-foreground">
            {stats.upcomingCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Scheduled or pending</p>
        </div>

        {/* Metric 4: Certificate Progress */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Bronze Certificate
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-foreground">{stats.totalHours} / {nextMilestone} hrs</span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {nextMilestone - stats.totalHours > 0
              ? `${Math.max(0, nextMilestone - stats.totalHours)} hrs until verified service award`
              : "Eligible for certificate issuance 🎉"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "active"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Active & Upcoming Passes ({activeCommitments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "history"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Service History ({historyCommitments.length})</span>
        </button>
      </div>

      {/* Content Cards */}
      {activeTab === "active" ? (
        activeCommitments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold">No active volunteer shifts</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Explore urgent volunteer needs in your city to lend a hand and earn verified hours.
              </p>
            </div>
            <Link
              href="/needs"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-colors"
            >
              <span>Browse Volunteer Opportunities</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCommitments.map((commitment) => {
              const isApproved =
                commitment.status === "approved" || commitment.status === "confirmed";
              const isAttended = commitment.status === "attended";

              return (
                <div
                  key={commitment.id}
                  className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition-all"
                >
                  <div>
                    {/* Header Image or Gradient Banner */}
                    <div className="relative h-32 w-full bg-muted">
                      {commitment.needCoverUrl ? (
                        <Image
                          src={commitment.needCoverUrl}
                          alt={commitment.needTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-teal-800 to-emerald-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-white drop-shadow truncate max-w-[240px]">
                          {commitment.orgName}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? "bg-teal-500 text-white"
                              : isAttended
                                ? "bg-blue-500 text-white"
                                : "bg-amber-500 text-black"
                          }`}
                        >
                          {commitment.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">
                          {commitment.roleTitle}
                        </span>
                        <h4 className="font-display text-base font-bold text-foreground leading-snug mt-0.5">
                          {commitment.needTitle}
                        </h4>
                      </div>

                      <div className="rounded-2xl bg-muted/50 p-3.5 space-y-2 text-xs text-muted-foreground border border-border/40">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span>{formatShiftDate(commitment.shiftStartsAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span>
                            {formatShiftTime(
                              commitment.shiftStartsAt,
                              commitment.shiftEndsAt
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span className="truncate">{commitment.locationText}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPass(commitment)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white py-3 text-xs font-bold shadow-md transition-colors cursor-pointer"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Open Digital QR Pass</span>
                    </button>
                    <Link
                      href={`/needs/${commitment.needId}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="View Need Page"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* History Tab */
        historyCommitments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-xs text-muted-foreground">
            No completed volunteer history yet. Your completed shifts and earned hours will appear here.
          </div>
        ) : (
          <div className="space-y-4">
            {historyCommitments.map((commitment) => (
              <div
                key={commitment.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">
                        {commitment.roleTitle}
                      </h4>
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {commitment.needTitle} • {commitment.orgName}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      <span>{formatShiftDate(commitment.shiftStartsAt)}</span>
                      <span>•</span>
                      <span>{commitment.locationText}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-right">
                    <div className="font-display text-lg font-bold text-emerald-600">
                      +{commitment.hoursLogged} hrs
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Verified Service
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPass(commitment)}
                    className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                  >
                    View Pass
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Digital QR Pass Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedPass(null)}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <VolunteerQrCard commitment={selectedPass} />
          </div>
        </div>
      )}
    </div>
  );
}
