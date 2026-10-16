"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Heart,
  Smartphone,
  Building2,
  CreditCard,
  Banknote,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Lock,
  EyeOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pledgeDonationAction } from "@/lib/actions/donations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DonationNeedItem {
  id: string;
  title: string;
  targetAmount: number | null;
  confirmedAmount?: number;
}

type PaymentMethod = "telebirr" | "cbe_birr" | "bank_transfer" | "chapa" | "cash" | "other";

interface PaymentMethodConfig {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  description: string;
  details?: string;
}

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: "telebirr",
    label: "Telebirr",
    icon: <Smartphone className="h-4 w-4" />,
    color: "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-800",
    placeholder: "TB-2026-XXXXXXXX",
    description: "Ethio Telecom mobile wallet",
    details:
      "Send to: *Mekedonia Humanitarian* | Account: 0911223344 · Then paste your Telebirr confirmation code below.",
  },
  {
    id: "cbe_birr",
    label: "CBE Birr",
    icon: <Smartphone className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800",
    placeholder: "CBE-XXXXXXXX",
    description: "Commercial Bank of Ethiopia mobile payment",
    details: "Send to CBE Account: *1000123456789* | Then paste your CBE Birr transaction ID below.",
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    icon: <Building2 className="h-4 w-4" />,
    color: "bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-700",
    placeholder: "Bank reference number",
    description: "Direct bank wire / SWIFT transfer",
    details:
      "Bank: Commercial Bank of Ethiopia | Account Name: Mekedonia Humanitarian Association | Account No: 1000-123456-789",
  },
  {
    id: "chapa",
    label: "Chapa",
    icon: <CreditCard className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800",
    placeholder: "CHAPA-TX-XXXXXXXX",
    description: "Online payment gateway (card / wallet)",
    details:
      "After completing payment on Chapa checkout, copy the transaction ID from the confirmation email.",
  },
  {
    id: "cash",
    label: "Cash (In-Person)",
    icon: <Banknote className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800",
    placeholder: "Optional receipt number",
    description: "Drop cash at the organization office",
    details:
      "Visit the organization office during working hours (Mon–Fri, 8AM–5PM). Ask for an official GiveHand ET cash receipt.",
  },
];

// Quick donation amounts in ETB
const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface DonationModalProps {
  needId: string;
  needTitle: string;
  orgName: string;
  item: DonationNeedItem;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function DonationModal({ needTitle, orgName, item }: DonationModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [isPending, startTransition] = useTransition();

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<PaymentMethod>("telebirr");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method) || PAYMENT_METHODS[0];
  const progressPercent = Math.min(
    100,
    ((item.confirmedAmount || 0) / (item.targetAmount || 1)) * 100
  );
  const remaining = Math.max(0, (item.targetAmount || 0) - (item.confirmedAmount || 0));

  function handleReset() {
    setStep("form");
    setAmount("");
    setMethod("telebirr");
    setReferenceNumber("");
    setFullName("");
    setPhone("");
    setIsAnonymous(false);
    setNotes("");
    setError(null);
    setDonationId(null);
  }

  function handleClose() {
    setOpen(false);
    handleReset();
  }

  function handleQuickAmount(val: number) {
    setAmount(String(val));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid ETB donation amount.");
      return;
    }
    if (!fullName.trim() && !isAnonymous) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim() && !isAnonymous) {
      setError("Please enter your phone number.");
      return;
    }
    if (!referenceNumber.trim() && method !== "cash") {
      setError(
        "Please enter the transaction reference number from your payment confirmation."
      );
      return;
    }

    startTransition(async () => {
      const result = await pledgeDonationAction({
        needItemId: item.id,
        amount: numAmount,
        method,
        referenceNumber: referenceNumber.trim(),
        isAnonymous,
        fullName: isAnonymous ? "Anonymous Donor" : fullName.trim(),
        phone: isAnonymous ? "0900000000" : phone.trim(),
        notes: notes.trim(),
      });

      if (result.success && result.donationId) {
        setDonationId(result.donationId);
        setStep("success");
      } else {
        setError(result.error || "Failed to submit donation. Please try again.");
      }
    });
  }

  return (
    <>
      <Button
        id={`donate-btn-${item.id}`}
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
      >
        <Heart className="mr-1.5 h-3.5 w-3.5" />
        Donate ETB
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {step === "form" ? (
              <>
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pt-8 pb-6 text-white">
                  <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />
                  <div className="relative">
                    <h2 className="font-display text-xl font-extrabold text-white">
                      Make a Donation
                    </h2>
                    <p className="mt-1 text-xs text-emerald-100 leading-relaxed max-w-[280px]">
                      {needTitle}
                    </p>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span>
                        {(item.confirmedAmount || 0).toLocaleString()} ETB raised
                      </span>
                      <span>Goal: {(item.targetAmount || 0).toLocaleString()} ETB</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-emerald-200">
                      {remaining.toLocaleString()} ETB remaining • {progressPercent.toFixed(0)}% funded
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Donation Amount (ETB)
                    </Label>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {QUICK_AMOUNTS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickAmount(val)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                            amount === String(val)
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-border bg-muted text-muted-foreground hover:bg-background hover:text-foreground"
                          }`}
                        >
                          {val.toLocaleString()}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        ETB
                      </span>
                      <Input
                        id={`donation-amount-${item.id}`}
                        type="number"
                        min={1}
                        step="0.01"
                        className="pl-12 rounded-xl text-sm font-bold"
                        placeholder="Enter custom amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Payment Method
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PAYMENT_METHODS.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setMethod(pm.id)}
                          className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-semibold transition-all ${
                            method === pm.id
                              ? `${pm.color} ring-2 ring-offset-1 ring-emerald-500`
                              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {pm.icon}
                          <span>{pm.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Payment instructions */}
                    {selectedMethod.details && (
                      <div className="mt-2 flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-[11px] text-blue-800 dark:text-blue-200">
                        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                        <p className="leading-relaxed">{selectedMethod.details}</p>
                      </div>
                    )}
                  </div>

                  {/* Reference number */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {method === "cash" ? "Receipt No. (Optional)" : "Transaction Reference *"}
                    </Label>
                    <Input
                      id={`donation-reference-${item.id}`}
                      className="rounded-xl text-sm font-mono"
                      placeholder={selectedMethod.placeholder}
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      required={method !== "cash"}
                    />
                  </div>

                  <hr className="border-border/50" />

                  {/* Donor Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Your Details
                      </Label>
                      <button
                        type="button"
                        onClick={() => setIsAnonymous(!isAnonymous)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                          isAnonymous
                            ? "bg-slate-600 text-white"
                            : "bg-muted text-muted-foreground hover:bg-background"
                        }`}
                      >
                        <EyeOff className="h-3 w-3" />
                        {isAnonymous ? "Anonymous ON" : "Donate Anonymously"}
                      </button>
                    </div>

                    <Input
                      id={`donor-name-${item.id}`}
                      className="rounded-xl text-sm"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isAnonymous}
                      disabled={isAnonymous}
                    />
                    <Input
                      id={`donor-phone-${item.id}`}
                      type="tel"
                      className="rounded-xl text-sm"
                      placeholder="0911 22 33 44"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required={!isAnonymous}
                      disabled={isAnonymous}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 p-3 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Trust badge */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>
                      All donations are verified by <strong>{orgName}</strong> before confirmation.
                    </span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isPending || !amount}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 shadow-lg transition-all"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Submit Donation (
                        {amount ? `${Number(amount).toLocaleString()} ETB` : "…"})
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="flex flex-col items-center gap-5 px-8 py-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckCircle className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-extrabold text-foreground">
                    Thank You! 🙏
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                    Your donation of <strong>{Number(amount).toLocaleString()} ETB</strong> has been
                    submitted. The organization will review and confirm your payment shortly.
                  </p>
                </div>

                {donationId && (
                  <div className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-center">
                    <p className="text-[11px] text-muted-foreground mb-1">Donation Reference</p>
                    <p className="font-mono text-xs font-bold text-foreground break-all">
                      {donationId}
                    </p>
                  </div>
                )}

                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    📧 A confirmation will appear in your{" "}
                    <strong>Supporter Dashboard → Donations</strong> once verified.
                  </p>
                </div>

                <div className="flex w-full gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={handleClose}
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={handleReset}
                  >
                    Donate Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
