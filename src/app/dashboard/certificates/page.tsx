import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  Clock,
  HeartHandshake,
  ShieldCheck,
  ExternalLink,
  Printer,
  ChevronRight,
} from "lucide-react";
import { getUserCertificates } from "@/lib/actions/certificates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Certificates | GiveHand ET",
  description: "View and print your official humanitarian service and donation certificates.",
};

export default async function SupporterCertificatesPage() {
  const { certificates, stats } = await getUserCertificates();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            My Certificates & Digital Receipts
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Official verified credentials recognized for academic, professional, and civic impact.
          </p>
        </div>

        <Link
          href="/verify"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors self-start sm:self-auto"
        >
          <ShieldCheck className="h-4 w-4 text-teal-600" />
          Verify Credentials
        </Link>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Issued Certificates</span>
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats.totalCertificates}
          </div>
          <p className="text-[11px] text-muted-foreground">Tamper-proof digital credentials</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Volunteer Service</span>
            <Clock className="h-4 w-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-600">
            {stats.volunteerHours} hrs
          </div>
          <p className="text-[11px] text-muted-foreground">QR-verified attendance hours</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Verified Contributions</span>
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats.donationsVerifiedEtb.toLocaleString()} ETB
          </div>
          <p className="text-[11px] text-muted-foreground">Official donation tax receipts</p>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-4">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <div
              key={cert.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 text-amber-600 shrink-0">
                  <Award className="h-6 w-6" />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                      {cert.type === "volunteer_service"
                        ? "VOLUNTEER SERVICE"
                        : "DONATION RECEIPT"}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {cert.publicCode}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-foreground">
                    {cert.impactTitle}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {cert.impactDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span>
                      Organized by: <strong className="text-foreground">{cert.orgName}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Issued {new Date(cert.issuedAt).toLocaleDateString("en-ET")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
                <Link
                  href={`/verify/${cert.publicCode}`}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-bold shadow hover:bg-primary/90 transition-colors"
                >
                  <span>View Full Certificate</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href={`/verify/${cert.publicCode}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2.5 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Public Link</span>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3">
            <Award className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="font-display text-base font-bold">No Certificates Yet</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Participate as a volunteer or contribute to community causes to earn verified certificates and receipts.
            </p>
            <Link
              href="/needs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow"
            >
              Browse Needs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
