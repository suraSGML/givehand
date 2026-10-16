"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  ShieldCheck,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Building2,
  Clock,
  HeartHandshake,
  QrCode as QrIcon,
} from "lucide-react";
import type { CertificateRecord } from "@/lib/actions/certificates";

interface CertificateCardProps {
  certificate: CertificateRecord;
  showActions?: boolean;
}

export function CertificateCard({
  certificate,
  showActions = true,
}: CertificateCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(certificate.verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("en-ET", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      {showActions && (
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <div>
              <p className="text-xs font-bold text-foreground">
                Cryptographically Verified Record
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {certificate.publicCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-teal-600" />
                  <span className="text-teal-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Share Verification Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Frame-worthy Certificate Element */}
      <div
        id="certificate-print-area"
        className="relative overflow-hidden rounded-3xl border-8 border-amber-600/30 bg-gradient-to-b from-amber-50/40 via-card to-amber-50/20 dark:from-slate-900 dark:via-card dark:to-slate-900 p-8 sm:p-14 shadow-2xl print:border-4 print:p-8 print:shadow-none print:m-0"
        style={{
          boxShadow: "0 25px 50px -12px rgba(180, 83, 9, 0.15)",
        }}
      >
        {/* Inner Ornamental Border */}
        <div className="absolute inset-3 sm:inset-5 pointer-events-none rounded-2xl border-2 border-dashed border-amber-500/40" />

        {/* Corner Flourishes */}
        <div className="absolute top-6 left-6 text-amber-500/60 font-serif text-2xl select-none">❖</div>
        <div className="absolute top-6 right-6 text-amber-500/60 font-serif text-2xl select-none">❖</div>
        <div className="absolute bottom-6 left-6 text-amber-500/60 font-serif text-2xl select-none">❖</div>
        <div className="absolute bottom-6 right-6 text-amber-500/60 font-serif text-2xl select-none">❖</div>

        <div className="relative space-y-8 text-center">
          {/* Header & Seal */}
          <div className="space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-teal-600 text-white shadow-lg ring-4 ring-amber-400/30">
              <Award className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-amber-700 dark:text-amber-400">
                GiveHand ET • Official Humanitarian Service Record
              </p>
              <h1 className="font-display text-2xl sm:text-4xl font-black uppercase tracking-wide text-foreground">
                {certificate.impactTitle}
              </h1>
            </div>
          </div>

          {/* Presentation Subtext */}
          <div className="space-y-3">
            <p className="font-serif italic text-sm text-muted-foreground">
              This digital certificate is officially presented to
            </p>
            <div className="inline-block border-b-2 border-emerald-600/60 pb-2 px-8">
              <span className="font-display text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {certificate.recipientName}
              </span>
            </div>
          </div>

          {/* Statement & Description */}
          <div className="mx-auto max-w-2xl space-y-4">
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground font-serif">
              {certificate.impactDescription}
            </p>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-3.5 inline-block">
              <p className="text-xs font-bold text-foreground">
                Initiative: <span className="text-primary">{certificate.campaignTitle}</span>
              </p>
              {certificate.metrics.hoursLogged && (
                <p className="text-[11px] font-semibold text-teal-600 mt-0.5">
                  ✓ {certificate.metrics.hoursLogged} Hours of Community Service Logged & Check-in Verified
                </p>
              )}
              {certificate.metrics.donationAmount && (
                <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  ✓ {certificate.metrics.donationAmount.toLocaleString()} ETB Confirmed via Verified Payment Gate
                </p>
              )}
            </div>
          </div>

          {/* Signatures & Verification Stamp */}
          <div className="pt-6 border-t border-border/80 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-left">
            {/* Left: Organization Authority */}
            <div className="space-y-1 text-center sm:text-left">
              <div className="h-10 flex items-center justify-center sm:justify-start">
                <span className="font-serif italic text-base text-foreground font-bold underline decoration-amber-500/60">
                  {certificate.orgName}
                </span>
              </div>
              <p className="text-xs font-bold text-foreground">{certificate.orgName}</p>
              <p className="text-[10px] text-muted-foreground">
                Reg: {certificate.orgRegistrationNumber || "CSOA Verified NGO"}
              </p>
            </div>

            {/* Center: Official Seal & Date */}
            <div className="text-center space-y-1">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-teal-600 ring-2 ring-teal-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-bold text-foreground">Officially Issued</p>
              <p className="text-[10px] text-muted-foreground">{formattedDate}</p>
            </div>

            {/* Right: QR Code & Public Code */}
            <div className="flex flex-col items-center sm:items-end space-y-1">
              {certificate.qrCodeDataUrl ? (
                <div className="rounded-xl border border-border p-1 bg-white shadow-xs">
                  <Image
                    src={certificate.qrCodeDataUrl}
                    alt="Public Verification QR Code"
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <QrIcon className="h-8 w-8" />
                </div>
              )}
              <span className="font-mono text-[9px] text-muted-foreground tracking-tighter">
                {certificate.publicCode}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
