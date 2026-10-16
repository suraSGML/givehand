"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  X,
  Truck,
  MapPin,
  ArrowRight,
  Sparkles,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { pledgeMaterialAction } from "@/lib/actions/materials";

interface MaterialPledgeModalProps {
  needId: string;
  needTitle: string;
  orgName: string;
  orgAddress?: string;
  item: {
    id: string;
    title: string;
    targetQuantity: number | null;
    receivedQuantity?: number;
    unit: string | null;
  };
  triggerClassName?: string;
  buttonLabel?: string;
}

export function MaterialPledgeModal({
  needId,
  needTitle,
  orgName,
  orgAddress = "Addis Ababa, Ethiopia",
  item,
  triggerClassName,
  buttonLabel = "Pledge Items",
}: MaterialPledgeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [quantity, setQuantity] = React.useState<number>(10);
  const [deliveryMethod, setDeliveryMethod] = React.useState<
    "dropoff" | "pickup_requested" | "courier"
  >("dropoff");
  const [pickupAddress, setPickupAddress] = React.useState("");
  const [conditionNote, setConditionNote] = React.useState("Brand new");
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const remaining = Math.max(
    1,
    (item.targetQuantity || 100) - (item.receivedQuantity || 0)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await pledgeMaterialAction({
        needItemId: item.id,
        quantity: Number(quantity),
        deliveryMethod,
        pickupAddress: deliveryMethod === "pickup_requested" ? pickupAddress : undefined,
        conditionNote,
        fullName: fullName.trim(),
        phone: phone.trim(),
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit material pledge");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setError(null);
    if (success) {
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          triggerClassName ||
          "inline-flex items-center justify-center rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        }
      >
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {success ? (
              <div className="py-4 text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-8 ring-amber-500/5">
                  <CheckCircle2 className="h-9 w-9 text-amber-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-bold tracking-tight">
                    Material Pledge Confirmed!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you, <span className="font-semibold text-foreground">{fullName}</span>!
                    Your pledge of <strong className="text-foreground">{quantity} {item.unit || "items"}</strong> has been registered.
                  </p>
                </div>

                {/* Drop-off / Delivery Instructions Box */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left space-y-2 text-xs">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    Delivery Destination:
                  </div>
                  <div className="text-muted-foreground pl-5.5">
                    <strong>{orgName}</strong>
                    <br />
                    {orgAddress}
                  </div>
                  <div className="text-[11px] text-muted-foreground pt-1 border-t border-amber-500/10 pl-5.5">
                    Operating Hours: Monday – Saturday (8:30 AM – 5:30 PM)
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/dashboard/materials");
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-3 text-sm font-semibold shadow-md transition-colors cursor-pointer"
                  >
                    View My Material Pledges
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-background hover:bg-muted py-3 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Pledge Form */
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 mb-2">
                    <Package className="h-3.5 w-3.5" />
                    Material Contribution
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Recipient: {orgName} • Remaining needed: {remaining} {item.unit || "items"}
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Quantity to Pledge */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Pledge Quantity ({item.unit || "items"})</span>
                      <span className="text-[10px] text-amber-600 font-bold">
                        Target remaining: {remaining}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Delivery Method Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Delivery / Handover Method
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label
                        onClick={() => setDeliveryMethod("dropoff")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center text-xs transition-all ${
                          deliveryMethod === "dropoff"
                            ? "border-amber-500 bg-amber-500/10 font-bold text-foreground ring-1 ring-amber-500"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <MapPin className="h-4 w-4 mb-1 text-amber-600" />
                        <span>Self Drop-off</span>
                      </label>
                      <label
                        onClick={() => setDeliveryMethod("pickup_requested")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center text-xs transition-all ${
                          deliveryMethod === "pickup_requested"
                            ? "border-amber-500 bg-amber-500/10 font-bold text-foreground ring-1 ring-amber-500"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <Truck className="h-4 w-4 mb-1 text-amber-600" />
                        <span>Request Pickup</span>
                      </label>
                      <label
                        onClick={() => setDeliveryMethod("courier")}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer text-center text-xs transition-all ${
                          deliveryMethod === "courier"
                            ? "border-amber-500 bg-amber-500/10 font-bold text-foreground ring-1 ring-amber-500"
                            : "border-border bg-background hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        <Package className="h-4 w-4 mb-1 text-amber-600" />
                        <span>Courier / Dispatch</span>
                      </label>
                    </div>
                  </div>

                  {/* Pickup address input if requested */}
                  {deliveryMethod === "pickup_requested" && (
                    <div className="space-y-1.5 animate-in fade-in">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Pickup Address / Neighborhood
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bole Subcity, Woreda 03, near Medhanialem Church"
                        value={pickupAddress}
                        onChange={(e) => setPickupAddress(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* Item Condition Note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Item Condition
                    </label>
                    <select
                      value={conditionNote}
                      onChange={(e) => setConditionNote(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Brand new">Brand new / Unopened</option>
                      <option value="Gently used">Gently used & cleaned</option>
                      <option value="Sealed sterile">Sealed & sterile (Medical / Consumables)</option>
                      <option value="Good condition">Good working condition</option>
                    </select>
                  </div>

                  {/* Full Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dawit Haile"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0911223344"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Additional Notes / Package details
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Packed in 2 boxes, ready for collection on Thursday..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-1/3 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-2/3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white py-2.5 text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? "Submitting Pledge..." : "Confirm Material Pledge"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
