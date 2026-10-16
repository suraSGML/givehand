"use client";

import * as React from "react";
import Image from "next/image";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Truck,
  MapPin,
  Check,
  X,
  AlertCircle,
  Eye,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import {
  updateMaterialPledgeStatusAction,
  type MaterialPledgeRecord,
} from "@/lib/actions/materials";
import type { MaterialPledgeStatus } from "@/types/supabase";

interface MaterialInventoryListProps {
  needId: string;
  initialPledges: MaterialPledgeRecord[];
  summary: {
    totalPledged: number;
    totalReceived: number;
    pendingCount: number;
  };
}

export function MaterialInventoryList({
  needId,
  initialPledges,
  summary: initialSummary,
}: MaterialInventoryListProps) {
  const [pledges, setPledges] = React.useState<MaterialPledgeRecord[]>(initialPledges);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [inspectingPledge, setInspectingPledge] = React.useState<MaterialPledgeRecord | null>(null);
  const [receivedQty, setReceivedQty] = React.useState<number>(0);
  const [inspectStatus, setInspectStatus] = React.useState<
    "received" | "partially_received" | "rejected" | "in_transit"
  >("received");
  const [inspectNote, setInspectNote] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [actionMessage, setActionMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredPledges = React.useMemo(() => {
    return pledges.filter((p) => {
      const matchesSearch =
        p.donor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.donor.phone && p.donor.phone.includes(searchQuery)) ||
        p.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.conditionNote && p.conditionNote.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [pledges, searchQuery, statusFilter]);

  function openInspection(pledge: MaterialPledgeRecord) {
    setInspectingPledge(pledge);
    setReceivedQty(pledge.quantity);
    setInspectStatus("received");
    setInspectNote(pledge.conditionNote || "");
    setActionMessage(null);
  }

  async function handleConfirmReceipt(e: React.FormEvent) {
    e.preventDefault();
    if (!inspectingPledge) return;

    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const finalStatus =
        receivedQty < inspectingPledge.quantity && inspectStatus === "received"
          ? "partially_received"
          : inspectStatus;

      const res = await updateMaterialPledgeStatusAction({
        pledgeId: inspectingPledge.id,
        receivedQuantity: Number(receivedQty),
        status: finalStatus,
        inspectionNote: inspectNote.trim() || undefined,
      });

      if (!res.success) {
        setActionMessage({
          type: "error",
          text: res.error || "Failed to update material pledge",
        });
        setIsSubmitting(false);
        return;
      }

      setPledges((prev) =>
        prev.map((p) =>
          p.id === inspectingPledge.id
            ? {
                ...p,
                receivedQuantity: Number(receivedQty),
                status: finalStatus as MaterialPledgeStatus,
                conditionNote: inspectNote.trim() || p.conditionNote,
              }
            : p
        )
      );

      setActionMessage({
        type: "success",
        text: `Recorded receipt of ${receivedQty} ${inspectingPledge.unit} from ${inspectingPledge.donor.fullName}.`,
      });
      setIsSubmitting(false);
      setInspectingPledge(null);
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message || "Failed to update pledge",
      });
      setIsSubmitting(false);
    }
  }

  function getStatusBadge(status: MaterialPledgeStatus) {
    switch (status) {
      case "received":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      case "partially_received":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "in_transit":
      case "delivered":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      case "rejected":
      case "cancelled":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  }

  const counts = {
    all: pledges.length,
    pledged: pledges.filter((p) => p.status === "pledged").length,
    received: pledges.filter((p) => p.status === "received" || p.status === "partially_received").length,
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Total Pledged</span>
            <Package className="h-4 w-4 text-amber-600" />
          </div>
          <div className="font-display text-2xl font-bold text-foreground">
            {initialSummary.totalPledged} <span className="text-xs text-muted-foreground font-normal">units</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Registered commitments</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-card p-6 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Received In-Hand</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="font-display text-2xl font-bold text-emerald-600">
            {initialSummary.totalReceived} <span className="text-xs text-muted-foreground font-normal">units</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Verified in storage</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            <span>Pending Delivery</span>
            <Clock className="h-4 w-4 text-teal-600" />
          </div>
          <div className="font-display text-2xl font-bold text-foreground">
            {initialSummary.pendingCount} <span className="text-xs text-muted-foreground font-normal">shipments</span>
          </div>
          <p className="text-[11px] text-muted-foreground">In transit or scheduled drop-offs</p>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`flex items-center gap-3 rounded-2xl p-4 text-xs ${
            actionMessage.type === "success"
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Pledges ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pledged")}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "pledged"
                ? "bg-amber-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Delivery ({counts.pledged})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("received")}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "received"
                ? "bg-emerald-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Received & Verified ({counts.received})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search donor, item, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-input bg-background pl-9 pr-3.5 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Table of Material Pledges */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        {filteredPledges.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No material pledges found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              When donors pledge items or ship packages, their records will appear here for receiving and quality checks.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Donor</th>
                  <th className="py-3.5 px-4">Item & Quantity</th>
                  <th className="py-3.5 px-4">Delivery Method</th>
                  <th className="py-3.5 px-4">Condition Note</th>
                  <th className="py-3.5 px-4">Status & Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPledges.map((pledge) => (
                  <tr
                    key={pledge.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Donor Profile */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                          {pledge.donor.avatarUrl ? (
                            <Image
                              src={pledge.donor.avatarUrl}
                              alt={pledge.donor.fullName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-bold text-muted-foreground">
                              {pledge.donor.fullName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {pledge.donor.fullName}
                          </div>
                          {pledge.donor.phone && (
                            <a
                              href={`tel:${pledge.donor.phone}`}
                              className="flex items-center gap-1 text-[11px] text-teal-600 hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {pledge.donor.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Item & Quantity */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-foreground text-xs">
                        {pledge.itemTitle}
                      </div>
                      <div className="text-amber-600 font-bold text-xs mt-0.5">
                        {pledge.quantity} {pledge.unit}
                      </div>
                    </td>

                    {/* Delivery Method */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground">
                        {pledge.deliveryMethod === "dropoff" ? (
                          <>
                            <MapPin className="h-3 w-3 text-amber-600" />
                            <span>Self Drop-off</span>
                          </>
                        ) : pledge.deliveryMethod === "pickup_requested" ? (
                          <>
                            <Truck className="h-3 w-3 text-amber-600" />
                            <span>Pickup Requested</span>
                          </>
                        ) : (
                          <>
                            <Package className="h-3 w-3 text-amber-600" />
                            <span>Courier</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Condition Note & Photo */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-muted-foreground line-clamp-2 text-[11px]">
                        {pledge.conditionNote || "No condition note"}
                      </p>
                      {pledge.photoUrl && (
                        <a
                          href={pledge.photoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:underline mt-1 font-semibold"
                        >
                          <Eye className="h-3 w-3" />
                          View Photo
                        </a>
                      )}
                    </td>

                    {/* Status & Received Amount */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                            pledge.status
                          )}`}
                        >
                          {pledge.status.replace("_", " ")}
                        </span>
                        {pledge.receivedQuantity > 0 && (
                          <div className="text-[11px] font-semibold text-emerald-600">
                            {pledge.receivedQuantity} / {pledge.quantity} {pledge.unit} received
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openInspection(pledge)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        <span>Inspect & Receive</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect & Receive Modal */}
      {inspectingPledge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setInspectingPledge(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <form onSubmit={handleConfirmReceipt} className="space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 mb-1">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Material Quality Check
                </div>
                <h3 className="font-display text-xl font-bold">
                  Inspect & Record Receipt
                </h3>
                <p className="text-xs text-muted-foreground">
                  Donor: <strong className="text-foreground">{inspectingPledge.donor.fullName}</strong> • Pledged: {inspectingPledge.quantity} {inspectingPledge.unit}
                </p>
              </div>

              {/* Quantity Verified */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Actual Quantity Received ({inspectingPledge.unit})</span>
                  <span className="text-[10px] text-amber-600 font-bold">
                    Pledged: {inspectingPledge.quantity}
                  </span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={inspectingPledge.quantity}
                  required
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Status Outcome */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification Status
                </label>
                <select
                  value={inspectStatus}
                  onChange={(e) => setInspectStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="received">Received (Full quantity verified)</option>
                  <option value="partially_received">Partially Received (Short shipment)</option>
                  <option value="in_transit">In Transit (Package picked up)</option>
                  <option value="rejected">Rejected (Failed inspection / damaged)</option>
                </select>
              </div>

              {/* Inspection Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inspection / Warehouse Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Clean blankets stored in Depot Section B..."
                  value={inspectNote}
                  onChange={(e) => setInspectNote(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInspectingPledge(null)}
                  className="w-1/3 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-2.5 text-xs font-bold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Updating..." : "Save Receipt Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
