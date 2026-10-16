"use client";

import {
  CheckCircle,
  Clock,
  XCircle,
  BanknoteIcon,
  Smartphone,
  Building2,
  CreditCard,
  ExternalLink,
  TrendingUp,
  HandHeart,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { SupporterDonationRecord } from "@/lib/actions/donations";
import type { MoneyDonationStatus, PaymentMethod } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: MoneyDonationStatus }) {
  const map: Record<
    MoneyDonationStatus,
    { label: string; icon: React.ReactNode; cls: string }
  > = {
    pledged: {
      label: "Pledged",
      icon: <Clock className="h-3 w-3" />,
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    payment_submitted: {
      label: "Awaiting Confirmation",
      icon: <Clock className="h-3 w-3" />,
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    confirmed: {
      label: "Confirmed",
      icon: <CheckCircle className="h-3 w-3" />,
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    rejected: {
      label: "Rejected",
      icon: <XCircle className="h-3 w-3" />,
      cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    cancelled: {
      label: "Cancelled",
      icon: <XCircle className="h-3 w-3" />,
      cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    },
  };

  const { label, icon, cls } = map[status] || map["pledged"];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

function MethodIcon({ method }: { method: PaymentMethod }) {
  const icons: Record<PaymentMethod, React.ReactNode> = {
    telebirr: <Smartphone className="h-3.5 w-3.5 text-orange-500" />,
    cbe_birr: <Smartphone className="h-3.5 w-3.5 text-blue-500" />,
    bank_transfer: <Building2 className="h-3.5 w-3.5 text-slate-500" />,
    chapa: <CreditCard className="h-3.5 w-3.5 text-purple-500" />,
    cash: <BanknoteIcon className="h-3.5 w-3.5 text-emerald-500" />,
    other: <BanknoteIcon className="h-3.5 w-3.5 text-slate-400" />,
  };
  const labels: Record<PaymentMethod, string> = {
    telebirr: "Telebirr",
    cbe_birr: "CBE Birr",
    bank_transfer: "Bank Transfer",
    chapa: "Chapa",
    cash: "Cash",
    other: "Other",
  };
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      {icons[method]}
      {labels[method]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------
interface DonationHistoryListProps {
  donations: SupporterDonationRecord[];
  stats: {
    totalDonated: number;
    confirmedCount: number;
    pendingCount: number;
  };
}

export function DonationHistoryList({ donations, stats }: DonationHistoryListProps) {
  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <HandHeart className="h-16 w-16 text-muted-foreground/30" />
        <div>
          <h3 className="font-display text-lg font-bold">No Donations Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
            Your financial contributions to Ethiopian communities will appear here.
          </p>
        </div>
        <Link
          href="/needs"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-sm font-bold shadow transition-colors"
        >
          Browse Campaigns
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm text-center">
          <p className="text-2xl font-black text-emerald-600">
            {stats.totalDonated.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">ETB Confirmed</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm text-center">
          <p className="text-2xl font-black text-foreground">{stats.confirmedCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Confirmed Donations</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm text-center">
          <p className="text-2xl font-black text-amber-500">{stats.pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Awaiting Confirmation</p>
        </div>
      </div>

      {/* Donation Cards */}
      <div className="space-y-4">
        {donations.map((donation) => (
          <div
            key={donation.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow"
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate">{donation.itemTitle}</h3>
                <p className="text-xs text-muted-foreground truncate">{donation.needTitle}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {donation.orgName}
                </p>
              </div>
              <StatusBadge status={donation.status} />
            </div>

            {/* Details row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="text-base font-black text-emerald-600">
                {donation.amount.toLocaleString()} ETB
              </span>
              <span className="text-border">|</span>
              <MethodIcon method={donation.method} />
              {donation.referenceNumber && (
                <>
                  <span className="text-border">|</span>
                  <span className="font-mono text-[11px]">{donation.referenceNumber}</span>
                </>
              )}
            </div>

            {/* Status messages */}
            {donation.status === "payment_submitted" && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-[11px] text-blue-700 dark:text-blue-300">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  Under review — the organization will confirm your payment within 24–48 hours.
                </span>
              </div>
            )}
            {donation.status === "confirmed" && donation.confirmedAt && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-[11px] text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  Payment confirmed on{" "}
                  {new Date(donation.confirmedAt).toLocaleDateString("en-ET", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground">
                {new Date(donation.createdAt).toLocaleDateString("en-ET", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {donation.needId && (
                <Link
                  href={`/needs/${donation.needId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  View Campaign
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Motivational Footer */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 flex items-start gap-3">
        <TrendingUp className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
            Your Impact in Numbers
          </p>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70 mt-1 leading-relaxed">
            You've contributed <strong>{stats.totalDonated.toLocaleString()} ETB</strong> that
            directly supports real communities across Ethiopia. Thank you for being a GiveHand ET
            champion.
          </p>
        </div>
      </div>
    </div>
  );
}
