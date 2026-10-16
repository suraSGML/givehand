"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  X,
  DollarSign,
  CalendarCheck,
  Award,
  Package,
  ShieldCheck,
  ShieldAlert,
  HeartHandshake,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { type Notification, markAllNotificationsRead } from "@/lib/actions/notifications";

interface NotificationBellProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

function getNotificationIcon(type: Notification["type"]) {
  const base = "h-4 w-4 shrink-0";
  switch (type) {
    case "donation_confirmed":
    case "new_donation":
      return <DollarSign className={`${base} text-emerald-500`} />;
    case "donation_rejected":
      return <DollarSign className={`${base} text-red-500`} />;
    case "volunteer_approved":
    case "volunteer_checked_in":
    case "new_volunteer_application":
      return <CalendarCheck className={`${base} text-teal-500`} />;
    case "volunteer_rejected":
      return <CalendarCheck className={`${base} text-red-500`} />;
    case "certificate_issued":
      return <Award className={`${base} text-amber-500`} />;
    case "material_confirmed":
    case "new_material_pledge":
      return <Package className={`${base} text-amber-600`} />;
    case "material_rejected":
      return <Package className={`${base} text-red-500`} />;
    case "org_verified":
      return <ShieldCheck className={`${base} text-teal-500`} />;
    case "org_rejected":
      return <ShieldAlert className={`${base} text-red-500`} />;
    case "need_published":
      return <HeartHandshake className={`${base} text-primary`} />;
    default:
      return <AlertCircle className={`${base} text-muted-foreground`} />;
  }
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  function handleOpen() {
    setIsOpen((prev) => !prev);
  }

  function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
      );
      setUnreadCount(0);
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-150"
          role="dialog"
          aria-label="Notifications panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={isPending}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3" />
                  )}
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-0.5">No new notifications.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 ${
                    !notif.readAt ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  {/* Unread dot */}
                  {!notif.readAt && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                  )}

                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {notif.actionUrl ? (
                      <Link
                        href={notif.actionUrl}
                        onClick={() => {
                          if (!notif.readAt) handleMarkRead(notif.id);
                          setIsOpen(false);
                        }}
                        className="block"
                      >
                        <p
                          className={`text-xs font-semibold leading-tight ${
                            !notif.readAt ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-2">
                          {notif.body}
                        </p>
                      </Link>
                    ) : (
                      <div>
                        <p
                          className={`text-xs font-semibold leading-tight ${
                            !notif.readAt ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-2">
                          {notif.body}
                        </p>
                      </div>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground/70">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {!notif.readAt && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition-all"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5 text-center bg-muted/20">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
