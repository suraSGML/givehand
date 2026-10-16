"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  QrCode,
  Check,
  X,
  AlertCircle,
  QrCode as ScannerIcon,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import {
  updateVolunteerStatusAction,
  type VolunteerApplicationRecord,
} from "@/lib/actions/volunteers";
import type { VolunteerAppStatus } from "@/types/supabase";

interface VolunteerRosterProps {
  needId: string;
  initialApplications: VolunteerApplicationRecord[];
}

export function VolunteerRoster({
  needId,
  initialApplications,
}: VolunteerRosterProps) {
  const [applications, setApplications] = React.useState<VolunteerApplicationRecord[]>(
    initialApplications
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredApps = React.useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        app.volunteer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.volunteer.phone && app.volunteer.phone.includes(searchQuery)) ||
        (app.message && app.message.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  async function handleStatusChange(
    applicationId: string,
    newStatus: VolunteerAppStatus
  ) {
    setUpdatingId(applicationId);
    setActionMessage(null);

    try {
      const res = await updateVolunteerStatusAction({
        applicationId,
        status: newStatus,
      });

      if (!res.success) {
        setActionMessage({
          type: "error",
          text: res.error || "Failed to update status",
        });
        setUpdatingId(null);
        return;
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      setActionMessage({
        type: "success",
        text: `Volunteer status updated to ${newStatus}.`,
      });
      setUpdatingId(null);
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message || "Failed to update status",
      });
      setUpdatingId(null);
    }
  }

  function getStatusBadge(status: VolunteerAppStatus) {
    switch (status) {
      case "approved":
      case "confirmed":
        return "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20";
      case "attended":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20";
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
      case "waitlisted":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
      case "rejected":
      case "cancelled":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  }

  const counts = {
    all: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    approved: applications.filter((a) => a.status === "approved" || a.status === "confirmed").length,
    attended: applications.filter((a) => a.status === "attended" || a.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Scanner Launcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-background to-emerald-500/5 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-display text-lg font-bold">Volunteer Operations & Attendance</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage applicants, review messages, and launch the real-time event check-in station.
          </p>
        </div>

        <Link
          href={`/org/needs/${needId}/scanner`}
          className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 text-xs font-bold shadow-md transition-all hover:scale-[1.02] cursor-pointer shrink-0"
        >
          <ScannerIcon className="h-4 w-4" />
          <span>Launch QR Scanner Station</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
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

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {/* Status Filters */}
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
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("applied")}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "applied"
                ? "bg-amber-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Review ({counts.applied})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "approved"
                ? "bg-teal-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "completed"
                ? "bg-emerald-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Attended ({counts.attended})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, phone, note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-input bg-background pl-9 pr-3.5 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Volunteer Applications Table */}
      <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No volunteer applications found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              When supporters register for shifts, their applications and attendance tokens will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Volunteer</th>
                  <th className="py-3.5 px-4">Shift & Time</th>
                  <th className="py-3.5 px-4">Note / Experience</th>
                  <th className="py-3.5 px-4">Pass & Status</th>
                  <th className="py-3.5 px-4">Hours</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredApps.map((app) => {
                  const isUpdating = updatingId === app.id;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Volunteer Profile */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                            {app.volunteer.avatarUrl ? (
                              <Image
                                src={app.volunteer.avatarUrl}
                                alt={app.volunteer.fullName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-bold text-muted-foreground">
                                {app.volunteer.fullName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">
                              {app.volunteer.fullName}
                            </div>
                            {app.volunteer.phone && (
                              <a
                                href={`tel:${app.volunteer.phone}`}
                                className="flex items-center gap-1 text-[11px] text-teal-600 hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                {app.volunteer.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Shift Details */}
                      <td className="py-4 px-4 text-muted-foreground">
                        {app.shift ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 font-medium text-foreground">
                              <Calendar className="h-3 w-3 text-teal-600" />
                              <span>
                                {new Date(app.shift.startsAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(app.shift.startsAt).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] italic">Flexible / All Days</span>
                        )}
                      </td>

                      {/* Application Note */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-muted-foreground line-clamp-2 text-[11px]">
                          {app.message || "No motivation note provided."}
                        </p>
                      </td>

                      {/* Pass Code & Status Badge */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                              app.status
                            )}`}
                          >
                            {app.status}
                          </span>
                          {app.checkInToken && (
                            <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                              <QrCode className="h-3 w-3 text-teal-600" />
                              <span>{app.checkInToken}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Logged Hours */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-foreground text-xs">
                          {app.hoursLogged > 0 ? `${app.hoursLogged} hrs` : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status === "applied" && (
                            <>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(app.id, "approved")}
                                className="inline-flex items-center gap-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="h-3 w-3" />
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(app.id, "rejected")}
                                className="inline-flex items-center gap-1 rounded-xl border border-border bg-background hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground px-2 py-1.5 text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </button>
                            </>
                          )}

                          {app.status === "approved" && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(app.id, "attended")}
                              className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3" />
                              Mark Attended
                            </button>
                          )}

                          {app.status === "attended" && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(app.id, "completed")}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Complete (4h)
                            </button>
                          )}

                          {app.status === "completed" && (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
