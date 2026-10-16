"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function CertificateVerificationDirectoryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError("Please enter a valid certificate code.");
      return;
    }
    router.push(`/verify/${cleanCode}`);
  };

  const sampleCodes = [
    {
      code: "GH-ET-VOL-2026-X89102",
      type: "Volunteer Service (16 Hours)",
      recipient: "Abebe Bikila",
      org: "Mekedonia Humanitarian",
    },
    {
      code: "GH-ET-DON-2026-D44129",
      type: "Donation Receipt (5,000 ETB)",
      recipient: "Abebe Bikila",
      org: "Mekedonia Humanitarian",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 ring-8 ring-teal-500/5">
            <Award className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <span className="rounded-full bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
              Tamper-Proof Verification Directory
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Verify Digital Certificates
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Verify the authenticity of volunteer service credentials and official donation receipts issued by registered Ethiopian civil society organizations.
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Enter Certificate Verification Code
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g. GH-ET-VOL-2026-X89102"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-2xl border border-input bg-background pl-10 pr-4 py-3 text-sm font-mono uppercase font-semibold outline-none focus:border-primary shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-2xl bg-primary text-primary-foreground px-6 py-3 text-xs font-bold shadow hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
                >
                  Verify Now
                </button>
              </div>
            </div>

            {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
          </form>

          {/* Sample quick links */}
          <div className="pt-4 border-t border-border/80 space-y-2">
            <p className="text-xs font-bold text-muted-foreground">
              Try Sample Verification Records:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sampleCodes.map((s) => (
                <Link
                  key={s.code}
                  href={`/verify/${s.code}`}
                  className="rounded-xl border border-border/80 bg-background/60 p-3 hover:border-primary/50 transition-colors flex items-center justify-between group"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-mono text-xs font-bold text-primary truncate">
                      {s.code}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.type} • {s.recipient}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Architecture Guarantee */}
        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <ShieldCheck className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-foreground">Government NGO Registry</h3>
            <p className="text-muted-foreground leading-relaxed">
              Certificates can only be created by organizations verified with the Ethiopian Civil Society Organizations Authority.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-foreground">Cryptographic IDs</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every certificate contains an immutable unique reference number with real-time revocation checks.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-foreground">Direct Print & PDF</h3>
            <p className="text-muted-foreground leading-relaxed">
              Recipients can export frame-worthy high-resolution certificates suitable for university, job, or donor records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
