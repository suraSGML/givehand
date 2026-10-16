"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Notification {
  id: string;
  type:
    | "donation_confirmed"
    | "donation_rejected"
    | "volunteer_approved"
    | "volunteer_rejected"
    | "volunteer_checked_in"
    | "material_confirmed"
    | "material_rejected"
    | "certificate_issued"
    | "org_verified"
    | "org_rejected"
    | "need_published"
    | "new_volunteer_application"
    | "new_donation"
    | "new_material_pledge";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Fetch the latest 20 notifications for the currently authenticated user.
 * Returns an empty list when not authenticated or on DB error.
 */
export async function getNotifications(_role?: string): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { notifications: [], unreadCount: 0 };

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !data) return { notifications: [], unreadCount: 0 };

    const notifications: Notification[] = data.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.read_at,
      createdAt: n.created_at,
      actionUrl: n.action_url ?? null,
      metadata: n.metadata ?? {},
    }));

    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.readAt).length,
    };
  } catch {
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark a single notification as read (owned by the current user).
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    revalidatePath("/dashboard");
    revalidatePath("/org/dashboard");
  } catch {
    // silently ignore
  }
}

/**
 * Mark every unread notification as read for the current user.
 */
export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    revalidatePath("/dashboard");
    revalidatePath("/org/dashboard");
    return { success: true };
  } catch {
    return { success: false };
  }
}
