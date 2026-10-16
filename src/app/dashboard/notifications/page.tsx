import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  DollarSign,
  CalendarCheck,
  Award,
  Package,
  ShieldCheck,
  ShieldAlert,
  HeartHandshake,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { getNotifications, markAllNotificationsRead, type Notification } from "@/lib/actions/notifications";

async function markAllReadAction(): Promise<void> {
  "use server";
  await markAllNotificationsRead();
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications | GiveHand ET",
  description: "View your activity notifications — donation confirmations, volunteer updates, and more.",
};

function getNotificationIcon(type: Notification["type"]) {
  const base = "h-5 w-5 shrink-0";
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
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "Just now";
}

export default async function NotificationsPage() {
  const { notifications, unreadCount } = await getNotifications("supporter");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Bell className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Your recent activity — donations, volunteer updates, certificates, and more.
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllReadAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </form>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-card/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
            <Bell className="h-7 w-7 stroke-[1.5]" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            All caught up!
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You have no notifications right now. Check back after making a donation or applying to volunteer.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30 ${!notif.readAt ? "bg-primary/[0.03]" : ""
                }`}
            >
              {/* Unread indicator */}
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted relative">
                {getNotificationIcon(notif.type)}
                {!notif.readAt && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border-2 border-card" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-snug ${!notif.readAt ? "text-foreground" : "text-muted-foreground"}`}>
                    {notif.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-muted-foreground/70 mt-0.5">
                    {timeAgo(notif.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">
                  {notif.body}
                </p>
                {notif.actionUrl && (
                  <Link
                    href={notif.actionUrl}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View details →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
