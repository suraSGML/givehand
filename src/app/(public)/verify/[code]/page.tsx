import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Building,
  ExternalLink,
} from "lucide-react";
import { getCertificateByCode } from "@/lib/actions/certificates";
import { CertificateCard } from "@/components/certificates/certificate-card";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Certificate Verification: ${code} | GiveHand ET`,
    description: `Official public verification portal for humanitarian certificate ${code}`,
  };
}

export default async function PublicCertificateVerificationPage({ params }: Props) {
  const { code } = await params;
  const certificate = await getCertificateByCode(code);

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation */}
        <div className="print:hidden flex items-center justify-between">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Verification Directory
          </Link>

          <Link
            href="/"
            className="text-xs font-bold text-primary hover:underline"
          >
            GiveHand ET Platform
          </Link>
        </div>

        {certificate ? (
          <>
            {/* Authenticity Banner */}
            <div
              className={`print:hidden rounded-3xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                certificate.revokedAt
                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                  : "border-teal-500/30 bg-teal-500/10 text-teal-800 dark:text-teal-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {certificate.revokedAt ? (
                  <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h2 className="font-display text-base font-bold">
                    {certificate.revokedAt
                      ? "Certificate Revoked"
                      : "Official Authentic Humanitarian Certificate"}
                  </h2>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {certificate.revokedAt
                      ? "This certificate was officially revoked by the issuing authority."
                      : `Digitally registered on GiveHand ET by ${certificate.orgName}. Authenticity is verified and tamper-proof.`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span className="font-mono text-xs font-bold bg-background/80 px-3 py-1.5 rounded-xl border border-border">
                  {certificate.publicCode}
                </span>
              </div>
            </div>

            {/* Certificate Frame */}
            <CertificateCard certificate={certificate} showActions={true} />
          </>
        ) : (
          /* Not Found State */
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Certificate Not Found
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              No active certificate was found with public code{" "}
              <strong className="font-mono text-foreground">{code}</strong>. Please ensure the code is typed accurately, or check with the issuing organization.
            </p>
            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow"
              >
                Search Another Code
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
