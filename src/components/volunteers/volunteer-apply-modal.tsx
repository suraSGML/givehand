"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { applyVolunteerAction } from "@/lib/actions/volunteers";

interface ShiftOption {
  id: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  confirmedCount?: number;
}

interface VolunteerApplyModalProps {
  needId: string;
  needTitle: string;
  needItem: {
    id: string;
    title: string;
    targetQuantity: number | null;
    currentVolunteers?: number;
    shifts?: ShiftOption[];
  };
  triggerClassName?: string;
  buttonLabel?: string;
}

export function VolunteerApplyModal({
  needId,
  needTitle,
  needItem,
  triggerClassName,
  buttonLabel = "Apply as Volunteer",
}: VolunteerApplyModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedShiftId, setSelectedShiftId] = React.useState<string>(
    needItem.shifts && needItem.shifts.length > 0 ? needItem.shifts[0].id : ""
  );
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successData, setSuccessData] = React.useState<{
    applicationId: string;
    token: string;
  } | null>(null);

  const shifts = needItem.shifts || [];

  function formatShiftDate(isoString: string) {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  }

  function formatShiftTime(isoString: string) {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await applyVolunteerAction({
        needItemId: needItem.id,
        shiftId: selectedShiftId || undefined,
        fullName: fullName.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });

      if (!res.success) {
        setError(res.error || "Failed to submit application");
        setIsSubmitting(false);
        return;
      }

      setSuccessData({
        applicationId: res.applicationId!,
        token: res.token!,
      });
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setError(null);
    if (successData) {
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
          "inline-flex items-center justify-center rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
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
              className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {successData ? (
              /* Success confirmation state */
              <div className="py-4 text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 ring-8 ring-teal-500/5">
                  <CheckCircle2 className="h-9 w-9 text-teal-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-2xl font-bold tracking-tight">
                    Application Submitted!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thank you, <span className="font-semibold text-foreground">{fullName}</span>!
                    Your volunteer registration has been recorded. Once approved by the organization,
                    your digital QR check-in pass will activate.
                  </p>
                </div>

                {/* Ticket Summary Box */}
                <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 text-left space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Campaign:</span>
                    <span className="font-semibold text-foreground truncate max-w-[220px]">
                      {needTitle}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Volunteer Role:</span>
                    <span className="font-semibold text-teal-700 dark:text-teal-400">
                      {needItem.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Check-in Pass Code:</span>
                    <span className="font-mono font-bold text-foreground">
                      {successData.token}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/dashboard/commitments");
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-3 text-sm font-semibold shadow-md transition-colors"
                  >
                    View My Volunteer Passes
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-background hover:bg-muted py-3 text-sm font-semibold transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Application Form */
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-600 mb-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Volunteer Application
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    {needItem.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    Campaign: {needTitle}
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Shift Selection (if shifts exist) */}
                  {shifts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Select Date & Shift</span>
                        <span className="text-[10px] text-teal-600 lowercase font-normal">
                          required
                        </span>
                      </label>
                      <div className="space-y-2">
                        {shifts.map((shift) => {
                          const spotsLeft = Math.max(
                            0,
                            shift.capacity - (shift.confirmedCount || 0)
                          );
                          const isSelected = selectedShiftId === shift.id;

                          return (
                            <label
                              key={shift.id}
                              onClick={() => setSelectedShiftId(shift.id)}
                              className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                                isSelected
                                  ? "border-teal-500 bg-teal-500/5 ring-1 ring-teal-500"
                                  : "border-border bg-background/50 hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="shift"
                                  checked={isSelected}
                                  onChange={() => setSelectedShiftId(shift.id)}
                                  className="accent-teal-600"
                                />
                                <div>
                                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                    <Calendar className="h-3.5 w-3.5 text-teal-600" />
                                    <span>{formatShiftDate(shift.startsAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {formatShiftTime(shift.startsAt)} -{" "}
                                      {formatShiftTime(shift.endsAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  {spotsLeft} spots left
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Volunteer Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abebe Bikila"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Ethiopian Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Phone Number (SMS / Call)</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        e.g. 0911223344 or +251911223344
                      </span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0911223344"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Motivation / Skills Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Skills, Experience or Note to Organization
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Briefly describe your experience, availability or why you'd like to support this initiative..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-teal-600" />
                    <span>
                      Attending verified shifts earns official community service hours tracked
                      towards verified certificates on GiveHand ET.
                    </span>
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
                      className="w-2/3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white py-2.5 text-xs font-semibold shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isSubmitting ? "Submitting Application..." : "Submit Volunteer Application"}
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
