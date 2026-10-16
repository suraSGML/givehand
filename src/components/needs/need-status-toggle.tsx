"use client";

import { useState, useTransition } from "react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { updateNeedStatusAction } from "@/lib/actions/needs";
import type { NeedStatus } from "@/types/supabase";

interface NeedStatusToggleProps {
  needId: string;
  currentStatus: NeedStatus;
  isOrgVerified?: boolean;
}

export function NeedStatusToggle({
  needId,
  currentStatus,
  isOrgVerified = true,
}: NeedStatusToggleProps) {
  const [status, setStatus] = useState<NeedStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleStatusChange = (newStatus: NeedStatus) => {
    if (newStatus === status) return;
    setError(null);
    setSuccess(false);

    if (newStatus === "open" && !isOrgVerified) {
      setError("Cannot publish as open: Organization verification is pending admin approval.");
      return;
    }

    startTransition(async () => {
      const res = await updateNeedStatusAction(needId, newStatus);
      if (res.success) {
        setStatus(newStatus);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || "Failed to change campaign status");
      }
    });
  };

  const getBadgeStyle = (s: NeedStatus) => {
    switch (s) {
      case "open":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "completed":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "draft":
      default:
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value as NeedStatus)}
          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold outline-none cursor-pointer transition-colors ${getBadgeStyle(
            status
          )}`}
        >
          <option value="draft">DRAFT</option>
          <option value="open">OPEN (PUBLIC)</option>
          <option value="in_progress">IN PROGRESS</option>
          <option value="completed">COMPLETED</option>
          <option value="cancelled">CANCELLED</option>
        </select>

        {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {success && <CheckCircle className="h-3 w-3 text-emerald-600" />}
      </div>

      {error && (
        <div className="flex items-center gap-1 text-[10px] text-destructive max-w-xs">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
