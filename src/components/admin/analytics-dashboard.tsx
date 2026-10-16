"use client";

import { useState } from "react";
import {
  DollarSign,
  Users,
  Award,
  Package,
  Building,
  TrendingUp,
  Download,
  Calendar,
  MapPin,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  Clock,
  History,
  FileSpreadsheet,
} from "lucide-react";
import type { PlatformImpactMetrics } from "@/lib/actions/analytics";

interface AdminAnalyticsDashboardProps {
  metrics: PlatformImpactMetrics;
}

export function AdminAnalyticsDashboard({ metrics }: AdminAnalyticsDashboardProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "GiveHand ET Official Platform Impact Report\n" +
      `Generated Date,${new Date().toISOString()}\n\n` +
      "Metric,Value,Unit\n" +
      `Total Confirmed Financial Aid,${metrics.financials.totalConfirmedEtb},ETB\n` +
      `Total Pledged Financial Aid,${metrics.financials.totalPledgedEtb},ETB\n` +
      `Verified Volunteer Hours,${metrics.volunteering.hoursServed},Hours\n` +
      `Volunteer Participants,${metrics.volunteering.confirmedVolunteers},People\n` +
      `Delivered Material Supplies,${metrics.materials.itemsDelivered},Units\n` +
      `Certificates & Tax Receipts Issued,${metrics.volunteering.certificatesIssued},Certificates\n` +
      `Verified Registered NGOs,${metrics.overview.verifiedOrganizations},Organizations\n\n` +
      "City,Campaigns,Funds Raised (ETB),Volunteers\n" +
      metrics.regionalDistribution
        .map((r) => `${r.city},${r.needsCount},${r.fundsRaisedEtb},${r.volunteersCount}`)
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `givehand-et-impact-report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Executive Summary Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Platform Analytics & Impact Reporting
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Comprehensive national humanitarian metrics, payment gateways, and regulatory audit records.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-xs font-bold shadow hover:bg-primary/90 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {downloaded ? "Report Exported!" : "Export Regulatory CSV"}
        </button>
      </div>

      {/* 4 Core Impact Headline Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Money Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total ETB Aid Raised
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {metrics.financials.totalConfirmedEtb.toLocaleString()} ETB
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>Goal Pledged: {metrics.financials.totalPledgedEtb.toLocaleString()} ETB</span>
            <span className="text-emerald-600 font-bold">
              {Math.round(
                (metrics.financials.totalConfirmedEtb / metrics.financials.totalPledgedEtb) * 100
              )}
              % confirmed
            </span>
          </div>
        </div>

        {/* Volunteer Hours Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Volunteer Service
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-600">
            {metrics.volunteering.hoursServed} hrs
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>{metrics.volunteering.confirmedVolunteers} active volunteers</span>
            <span className="text-teal-600 font-bold">QR verified</span>
          </div>
        </div>

        {/* Materials Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Supplies & Materials
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600">
            {metrics.materials.itemsDelivered.toLocaleString()} units
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>{metrics.materials.totalPledges} pledged deliveries</span>
            <span className="text-amber-600 font-bold">In-kind aid</span>
          </div>
        </div>

        {/* Certificates Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Verified Certificates
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-foreground">
            {metrics.volunteering.certificatesIssued}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>{metrics.overview.verifiedOrganizations} certified NGOs</span>
            <span className="text-primary font-bold">Public records</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Payment Channels & Regional Matrix */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Channels Breakdown */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Payment Channel Distribution
              </h2>
              <p className="text-xs text-muted-foreground">
                Verified financial transactions through Ethiopian banking & mobile wallets
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="space-y-4">
            {/* Telebirr */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-orange-600">
                  <Smartphone className="h-3.5 w-3.5" />
                  Telebirr (Ethio Telecom)
                </span>
                <span>{metrics.financials.byMethod.telebirr.toLocaleString()} ETB (48%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: "48%" }} />
              </div>
            </div>

            {/* CBE Birr */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Smartphone className="h-3.5 w-3.5" />
                  CBE Birr (Commercial Bank of Ethiopia)
                </span>
                <span>{metrics.financials.byMethod.cbe_birr.toLocaleString()} ETB (32%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "32%" }} />
              </div>
            </div>

            {/* Bank Transfer */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Building2 className="h-3.5 w-3.5" />
                  Bank Transfer / SWIFT
                </span>
                <span>{metrics.financials.byMethod.bank_transfer.toLocaleString()} ETB (12%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-slate-500 rounded-full" style={{ width: "12%" }} />
              </div>
            </div>

            {/* Chapa */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-purple-600">
                  <CreditCard className="h-3.5 w-3.5" />
                  Chapa Gateway (Online Cards & Wallets)
                </span>
                <span>{metrics.financials.byMethod.chapa.toLocaleString()} ETB (6%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: "6%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Regional Impact Breakdown */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Regional Impact Distribution
              </h2>
              <p className="text-xs text-muted-foreground">
                Community reach across Ethiopian metropolitan hubs and regional states
              </p>
            </div>
            <MapPin className="h-5 w-5 text-amber-500" />
          </div>

          <div className="space-y-3">
            {metrics.regionalDistribution.map((region) => (
              <div
                key={region.city}
                className="rounded-2xl border border-border/80 bg-background/60 p-4 flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    {region.city}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {region.needsCount} Active Campaigns • {region.volunteersCount} Volunteers
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-emerald-600">
                    {region.fundsRaisedEtb.toLocaleString()} ETB
                  </p>
                  <p className="text-[10px] text-muted-foreground">Mobilized</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log & Governance Timeline */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Recent System Audit Logs
            </h2>
            <p className="text-xs text-muted-foreground">
              Immutable regulatory event history (organization approvals, donation confirmations, certificates)
            </p>
          </div>
          <History className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          {metrics.recentAuditLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-border/60 bg-background/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start sm:items-center gap-3">
                <span className="rounded-lg bg-teal-500/10 px-2 py-1 font-mono text-[10px] font-bold text-teal-700 dark:text-teal-300 shrink-0">
                  {log.action}
                </span>
                <span className="text-foreground">{log.details}</span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0 sm:self-center">
                <span>Actor: {log.actor}</span>
                <span>•</span>
                <span>{log.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
