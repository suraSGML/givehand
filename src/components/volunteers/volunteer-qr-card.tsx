"use client";

import * as React from "react";
import Image from "next/image";
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  ShieldCheck,
  Building2,
  Award,
} from "lucide-react";
import { generateQrDataUrl } from "@/lib/qr";
import type { SupporterCommitment } from "@/lib/actions/volunteers";

interface VolunteerQrCardProps {
  commitment: SupporterCommitment;
  volunteerName?: string;
}

export function VolunteerQrCard({
  commitment,
  volunteerName = "Verified Volunteer",
}: VolunteerQrCardProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = React.useState(true);

  const token = commitment.checkInToken || commitment.id;

  React.useEffect(() => {
    let isMounted = true;
    async function loadQr() {
      setIsLoadingQr(true);
      try {
        const url = await generateQrDataUrl(token, {
          width: 280,
          margin: 1,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (isMounted) {
          setQrDataUrl(url);
          setIsLoadingQr(false);
        }
      } catch (err) {
        if (isMounted) setIsLoadingQr(false);
      }
    }
    loadQr();
    return () => {
      isMounted = false;
    };
  }, [token]);

  function formatDateTime(iso: string | null) {
    if (!iso) return "Flexible Date";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function formatTimeWindow(start: string | null, end: string | null) {
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

  function handlePrint() {
    window.print();
  }

  const isCompleted = commitment.status === "completed";
  const isAttended = commitment.status === "attended";
  const isApproved = commitment.status === "approved" || commitment.status === "confirmed";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg print:border-none print:shadow-none">
      {/* Top Header Badge */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100">
              GiveHand ET Official Pass
            </span>
          </div>
          <span
            className={`rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
              isCompleted
                ? "bg-emerald-950/40 text-emerald-200 border border-emerald-300/30"
                : isAttended
                  ? "bg-blue-950/40 text-blue-200 border border-blue-300/30"
                  : isApproved
                    ? "bg-teal-950/40 text-teal-200 border border-teal-300/30"
                    : "bg-amber-950/40 text-amber-200 border border-amber-300/30"
            }`}
          >
            {commitment.status}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Organization & Campaign Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {commitment.orgLogoUrl ? (
              <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  src={commitment.orgLogoUrl}
                  alt={commitment.orgName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                <Building2 className="h-6 w-6" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                {commitment.orgName}
              </p>
              <h4 className="font-display text-lg font-bold text-foreground leading-snug">
                {commitment.needTitle}
              </h4>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/50 p-4 space-y-2 border border-border/50">
            <div className="text-xs font-semibold text-foreground">
              Role: <span className="text-teal-600 font-bold">{commitment.roleTitle}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <span>{formatDateTime(commitment.shiftStartsAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <span>
                  {formatTimeWindow(commitment.shiftStartsAt, commitment.shiftEndsAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{commitment.locationText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Presentation Box */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background p-6 text-center space-y-3">
          <div className="relative flex h-52 w-52 items-center justify-center rounded-xl bg-white p-2 shadow-inner">
            {isLoadingQr ? (
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <QrCode className="h-8 w-8 animate-pulse text-teal-600" />
                <span>Generating secure QR pass...</span>
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Check-in Pass ${token}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="text-xs text-rose-500">Failed to render QR Code</div>
            )}
          </div>

          <div className="space-y-1">
            <div className="font-mono text-sm font-bold tracking-wider text-foreground">
              {token}
            </div>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              Present this QR code on your phone screen to the organization coordinator upon arrival.
            </p>
          </div>
        </div>

        {/* Attendance & Hours Summary */}
        {isCompleted && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2.5">
              <Award className="h-5 w-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold block">Service Completed</span>
                <span className="text-[11px] text-muted-foreground">
                  Verified by {commitment.orgName}
                </span>
              </div>
            </div>
            <span className="font-display text-lg font-bold">
              +{commitment.hoursLogged} hrs
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 text-xs print:hidden">
          <div className="text-[11px] text-muted-foreground">
            Passholder: <strong className="text-foreground">{volunteerName}</strong>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Print / Save Pass
          </button>
        </div>
      </div>
    </div>
  );
}
