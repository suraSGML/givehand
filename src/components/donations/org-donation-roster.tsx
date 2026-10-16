"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Building2,
  CreditCard,
  BanknoteIcon,
  User,
  Phone,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmDonationAction } from "@/lib/actions/donations";
import type { MoneyDonationRecord } from "@/lib/actions/donations";
import type { MoneyDonationStatus, PaymentMethod } from "@/types/supabase";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: MoneyDonationStatus }) {
  const map: Record<MoneyDonationStatus, { label: string; cls: string }> = {
    pledged: { label: "Pledged", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    payment_submitted: { label: "Payment Submitted", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    confirmed: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    cancelled: { label: "Cancelled", cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  };
  const { label, cls } = map[status] || map["pledged"];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

function MethodLabel({ method }: { method: PaymentMethod }) {
  const labels: Record<PaymentMethod, string> = {
    telebirr: "Telebirr",
    cbe_birr: "CBE Birr",
    bank_transfer: "Bank Transfer",
    chapa: "Chapa",
    cash: "Cash",
    other: "Other",
  };
  return <span className="text-xs font-semibold">{labels[method] ?? method}</span>;
}

// ---------------------------------------------------------------------------
// Single Donation Row
// ---------------------------------------------------------------------------
function DonationRow({ donation }: { donation: MoneyDonationRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState<MoneyDonationStatus>(donation.status);
  const [feedback, setFeedback] = useState<string | null>(null);

  const canConfirm = localStatus === "payment_submitted" || localStatus === "pledged";

  function handleConfirm(status: "confirmed" | "rejected") {
    setFeedback(null);
    startTransition(async () => {
      const result = await confirmDonationAction({
        donationId: donation.id,
        status,
      });
      if (result.success) {
        setLocalStatus(status);
        setFeedback(status === "confirmed" ? "Payment confirmed!" : "Donation marked as rejected.");
      } else {
        setFeedback(result.error || "Action failed.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Summary row */}
      <div
        className="flex cursor-pointer items-center justify-between gap-3 p-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            {donation.isAnonymous ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">
              {donation.isAnonymous ? "Anonymous Donor" : (donation.donor?.fullName || "—")}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(donation.createdAt).toLocaleDateString("en-ET", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-base font-black text-emerald-600">
            {donation.amount.toLocaleString()} ETB
          </span>
          <StatusBadge status={localStatus} />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border/60 px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Payment Method</p>
              <MethodLabel method={donation.method} />
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Reference No.</p>
              <p className="font-mono font-bold">{donation.referenceNumber || "—"}</p>
            </div>
            {!donation.isAnonymous && donation.donor?.phone && (
              <div>
                <p className="text-muted-foreground mb-0.5">Phone</p>
                <p className="font-semibold flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {donation.donor.phone}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-0.5">Fund</p>
              <p className="font-semibold">{donation.itemTitle}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {canConfirm && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => handleConfirm("confirmed")}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                Confirm Receipt
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleConfirm("rejected")}
                className="flex-1 rounded-xl font-bold gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          )}

          {feedback && (
            <p
              className={`text-xs font-semibold text-center pt-1 ${
                localStatus === "confirmed"
                  ? "text-emerald-600"
                  : localStatus === "rejected"
                  ? "text-red-600"
                  : "text-muted-foreground"
              }`}
            >
              {feedback}
            </p>
          )}

          {!canConfirm && (
            <div
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                localStatus === "confirmed"
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              }`}
            >
              {localStatus === "confirmed" ? (
                <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span className="font-semibold">
                {localStatus === "confirmed"
                  ? `Confirmed${donation.confirmedAt ? ` on ${new Date(donation.confirmedAt).toLocaleDateString("en-ET")}` : ""}`
                  : "This donation was rejected or cancelled."}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props & Component
// ---------------------------------------------------------------------------
interface OrgDonationRosterProps {
  donations: MoneyDonationRecord[];
  summary: {
    totalPledged: number;
    totalConfirmed: number;
    pendingCount: number;
    targetAmount: number;
  };
}

export function OrgDonationRoster({ donations, summary }: OrgDonationRosterProps) {
  const progressPercent = summary.targetAmount
    ? Math.min(100, (summary.totalConfirmed / summary.targetAmount) * 100)
    : 0;

  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <h3 className="font-display text-lg font-bold">No Donations Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Monetary donations for this campaign will appear here once submitted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm font-bold text-foreground">
          <span>
            {summary.totalConfirmed.toLocaleString()} ETB Confirmed
          </span>
          <span className="text-muted-foreground font-medium">
            Goal: {summary.targetAmount.toLocaleString()} ETB
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/60 dark:bg-black/20">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">
              {donations.length}
            </p>
            <p className="text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-lg font-black text-amber-600">
              {summary.pendingCount}
            </p>
            <p className="text-muted-foreground">Pending</p>
          </div>
          <div>
            <p className="text-lg font-black text-foreground">
              {progressPercent.toFixed(0)}%
            </p>
            <p className="text-muted-foreground">Funded</p>
          </div>
        </div>
      </div>

      {/* Donation Rows */}
      <div className="space-y-3">
        {donations.map((donation) => (
          <DonationRow key={donation.id} donation={donation} />
        ))}
      </div>
    </div>
  );
}
