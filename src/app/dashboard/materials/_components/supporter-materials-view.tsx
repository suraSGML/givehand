"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Truck,
  Phone,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Eye,
} from "lucide-react";
import type { SupporterMaterialPledge } from "@/lib/actions/materials";

interface SupporterMaterialsViewProps {
  initialPledges: SupporterMaterialPledge[];
  stats: {
    totalPledgesCount: number;
    deliveredCount: number;
    pendingCount: number;
  };
}

export function SupporterMaterialsView({
  initialPledges,
  stats,
}: SupporterMaterialsViewProps) {
  const [pledges] = React.useState<SupporterMaterialPledge[]>(initialPledges);
  const [filter, setFilter] = React.useState<"all" | "pending" | "delivered">("all");

  const filtered = pledges.filter((p) => {
    if (filter === "pending") {
      return p.status === "pledged" || p.status === "in_transit" || p.status === "delivered";
    }
    if (filter === "delivered") {
      return p.status === "received" || p.status === "partially_received";
    }
    return true;
  });

  function formatPledgeDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-amber-500/20 bg-card p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Total Pledged</span>
            <Package className="h-4 w-4 text-amber-600" />
          </div>
          <div className="font-display text-3xl font-extrabold text-foreground">
            {stats.totalPledgesCount} <span className="text-sm font-semibold text-muted-foreground">pledges</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Physical items committed</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-card p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Delivered & Verified</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="font-display text-3xl font-extrabold text-emerald-600">
            {stats.deliveredCount}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Confirmed received by organizations
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>In Transit / Scheduled</span>
            <Clock className="h-4 w-4 text-teal-600" />
          </div>
          <div className="font-display text-3xl font-extrabold text-foreground">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-muted-foreground">Awaiting drop-off or pickup</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            filter === "all" ? "bg-amber-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          All Pledges ({pledges.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            filter === "pending" ? "bg-amber-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Pending Handover ({stats.pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("delivered")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
            filter === "delivered" ? "bg-amber-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Verified Received ({stats.deliveredCount})
        </button>
      </div>

      {/* Pledges List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <div className="space-y-1">
            <h3 className="font-display text-lg font-bold">No material pledges found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Contribute essential supplies like books, clothes, or nutrition packets to open campaigns.
            </p>
          </div>
          <Link
            href="/needs?type=material"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-colors"
          >
            <span>Browse Material Needs</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((pledge) => {
            const isReceived =
              pledge.status === "received" || pledge.status === "partially_received";

            return (
              <div
                key={pledge.id}
                className="rounded-3xl border border-border bg-card p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-amber-500/40 transition-all"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isReceived
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {pledge.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • Pledged on {formatPledgeDate(pledge.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">
                      {pledge.quantity} {pledge.unit} — {pledge.itemTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Campaign: <strong className="text-foreground">{pledge.needTitle}</strong> ({pledge.orgName})
                    </p>
                  </div>

                  {/* Delivery Location & Method */}
                  <div className="rounded-2xl bg-muted/50 p-3.5 space-y-1.5 text-xs border border-border/50">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Drop-off Location: {pledge.orgAddress}</span>
                    </div>
                    {pledge.orgPhone && (
                      <div className="flex items-center gap-2 text-muted-foreground pl-5.5 text-[11px]">
                        <Phone className="h-3 w-3" />
                        <span>Contact Center: {pledge.orgPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground pl-5.5 text-[11px]">
                      <Truck className="h-3 w-3" />
                      <span>Handover: {pledge.deliveryMethod === "dropoff" ? "Self Drop-off" : pledge.deliveryMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-3 shrink-0">
                  {isReceived ? (
                    <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Verified in Depot ({pledge.receivedQuantity} {pledge.unit})
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      Awaiting verification at drop-off location
                    </div>
                  )}

                  <Link
                    href={`/needs/${pledge.needId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background hover:bg-muted px-4 py-2 text-xs font-semibold transition-colors"
                  >
                    <span>View Campaign</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
