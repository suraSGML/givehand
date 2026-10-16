"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  applyVolunteerSchema,
  updateVolunteerStatusSchema,
  type ApplyVolunteerInput,
  type UpdateVolunteerStatusInput,
} from "@/lib/validations/volunteer";
import { generateCheckInToken } from "@/lib/qr";
import { autoIssueCertificate } from "@/lib/actions/certificates";
import type { VolunteerAppStatus } from "@/types/supabase";

export interface VolunteerApplicationRecord {
  id: string;
  needItemId: string;
  shiftId: string | null;
  userId: string;
  message: string | null;
  status: VolunteerAppStatus;
  hoursLogged: number;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  checkInToken: string | null;
  createdAt: string;
  volunteer: {
    id: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    city: string | null;
  };
  shift?: {
    id: string;
    startsAt: string;
    endsAt: string;
    capacity: number;
  } | null;
  need?: {
    id: string;
    title: string;
    locationText: string | null;
    coverUrl: string | null;
    organization: {
      id: string;
      name: string;
      logoUrl: string | null;
    };
  };
}

export interface SupporterCommitment {
  id: string;
  needItemId: string;
  needId: string;
  needTitle: string;
  needCoverUrl: string | null;
  locationText: string;
  orgName: string;
  orgLogoUrl: string | null;
  roleTitle: string;
  shiftId: string | null;
  shiftStartsAt: string | null;
  shiftEndsAt: string | null;
  status: VolunteerAppStatus;
  hoursLogged: number;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  checkInToken: string | null;
  createdAt: string;
}

/**
 * Submit volunteer application for a need item / shift.
 */
export async function applyVolunteerAction(
  data: ApplyVolunteerInput
): Promise<{ success: boolean; error?: string; applicationId?: string; token?: string }> {
  try {
    const parsed = applyVolunteerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please log in to submit a volunteer application" };
    }

    // 1. Check if user has already applied for this need item
    const { data: existingApp } = await supabase
      .from("volunteer_applications")
      .select("id, status")
      .eq("need_item_id", parsed.data.needItemId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingApp) {
      return {
        success: false,
        error: `You have already applied for this volunteer role (Current status: ${existingApp.status}).`,
      };
    }

    // 2. Check shift capacity if shiftId is provided
    if (parsed.data.shiftId) {
      const { data: shift } = await supabase
        .from("volunteer_shifts")
        .select("id, capacity")
        .eq("id", parsed.data.shiftId)
        .single();

      if (shift) {
        const { count } = await supabase
          .from("volunteer_applications")
          .select("id", { count: "exact", head: true })
          .eq("shift_id", parsed.data.shiftId)
          .in("status", ["approved", "confirmed", "attended", "completed"]);

        if ((count || 0) >= shift.capacity) {
          return {
            success: false,
            error: "This shift has reached maximum volunteer capacity. Please select another shift.",
          };
        }
      }
    }

    // 3. Generate secure check-in token
    const token = generateCheckInToken(crypto.randomUUID());

    // 4. Insert application record
    const { data: application, error: insertError } = await supabase
      .from("volunteer_applications")
      .insert({
        need_item_id: parsed.data.needItemId,
        shift_id: parsed.data.shiftId || null,
        user_id: user.id,
        message: parsed.data.message,
        status: "applied",
        check_in_token: token,
      })
      .select("id, check_in_token")
      .single();

    if (insertError) {
      console.error("Volunteer apply error:", insertError);
      return { success: false, error: insertError.message || "Failed to submit application" };
    }

    // 5. Update user profile phone & full_name if not set
    await supabase
      .from("profiles")
      .update({
        phone: parsed.data.phone,
        full_name: parsed.data.fullName,
      })
      .eq("id", user.id);

    revalidatePath(`/needs`);
    revalidatePath(`/dashboard/commitments`);

    return {
      success: true,
      applicationId: application.id,
      token: application.check_in_token || token,
    };
  } catch (err: any) {
    console.error("Volunteer apply exception:", err);
    return { success: false, error: err?.message || "An unexpected error occurred" };
  }
}

/**
 * Fetch volunteer applications for an organization's need.
 */
export async function getVolunteerApplicationsForOrg(
  needId: string,
  shiftId?: string
): Promise<VolunteerApplicationRecord[]> {
  try {
    const supabase = await createClient();

    // Query need items of type 'volunteer'
    let query = supabase
      .from("volunteer_applications")
      .select(
        `
        id,
        need_item_id,
        shift_id,
        user_id,
        message,
        status,
        hours_logged,
        checked_in_at,
        checked_out_at,
        check_in_token,
        created_at,
        profiles (
          id,
          full_name,
          phone,
          avatar_url,
          city
        ),
        volunteer_shifts (
          id,
          starts_at,
          ends_at,
          capacity
        ),
        need_items!inner (
          id,
          need_id,
          title
        )
      `
      )
      .eq("need_items.need_id", needId);

    if (shiftId && shiftId !== "all") {
      query = query.eq("shift_id", shiftId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("getVolunteerApplicationsForOrg error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as any[]).map((row) => ({
      id: row.id,
      needItemId: row.need_item_id,
      shiftId: row.shift_id,
      userId: row.user_id,
      message: row.message,
      status: row.status,
      hoursLogged: Number(row.hours_logged) || 0,
      checkedInAt: row.checked_in_at,
      checkedOutAt: row.checked_out_at,
      checkInToken: row.check_in_token,
      createdAt: row.created_at,
      volunteer: {
        id: row.profiles?.id || row.user_id,
        fullName: row.profiles?.full_name || "Community Volunteer",
        phone: row.profiles?.phone || "+251 900 000 000",
        avatarUrl: row.profiles?.avatar_url || null,
        city: row.profiles?.city || "Addis Ababa",
      },
      shift: row.volunteer_shifts
        ? {
            id: row.volunteer_shifts.id,
            startsAt: row.volunteer_shifts.starts_at,
            endsAt: row.volunteer_shifts.ends_at,
            capacity: row.volunteer_shifts.capacity,
          }
        : null,
    }));
  } catch (err) {
    console.error("getVolunteerApplicationsForOrg exception:", err);
    return [];
  }
}

/**
 * Update a volunteer application's status (Approve, Waitlist, Reject, etc.)
 */
export async function updateVolunteerStatusAction(
  data: UpdateVolunteerStatusInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = updateVolunteerStatusSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const supabase = await createClient();

    const updatePayload: Record<string, any> = {
      status: parsed.data.status,
    };

    if (parsed.data.hoursLogged !== undefined) {
      updatePayload.hours_logged = parsed.data.hoursLogged;
    }

    // Ensure check-in token exists if approved
    if (parsed.data.status === "approved" || parsed.data.status === "confirmed") {
      const { data: current } = await supabase
        .from("volunteer_applications")
        .select("check_in_token")
        .eq("id", parsed.data.applicationId)
        .single();

      if (!current?.check_in_token) {
        updatePayload.check_in_token = generateCheckInToken(parsed.data.applicationId);
      }
    }

    const { error } = await supabase
      .from("volunteer_applications")
      .update(updatePayload as any)
      .eq("id", parsed.data.applicationId);

    if (error) {
      return { success: false, error: error.message };
    }

    // ── Auto-issue volunteer service certificate ──────────────────────────
    // Issue when org manually marks a volunteer as attended or completed
    if (
      parsed.data.status === "attended" ||
      parsed.data.status === "completed"
    ) {
      const { data: appRow } = await supabase
        .from("volunteer_applications")
        .select(`
          id,
          user_id,
          hours_logged,
          need_items (
            id,
            title,
            needs (
              id,
              title,
              organizations ( id, name )
            )
          ),
          profiles (
            full_name
          )
        `)
        .eq("id", parsed.data.applicationId)
        .single();

      if (appRow) {
        const item    = (appRow as any).need_items;
        const need    = item?.needs;
        const org     = need?.organizations;
        const profile = (appRow as any).profiles;
        const hours   = parsed.data.hoursLogged ?? Number((appRow as any).hours_logged) ?? 0;

        await autoIssueCertificate({
          type:           "volunteer_service",
          userId:         (appRow as any).user_id,
          organizationId: org?.id ?? "",
          relatedId:      (appRow as any).id,
          recipientName:  profile?.full_name ?? "Community Volunteer",
          campaignTitle:  need?.title ?? "Community Campaign",
          title:          "Certificate of Volunteer Service",
          hoursLogged:    hours,
        });
      }
    }

    revalidatePath(`/org/needs`);
    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/commitments`);
    revalidatePath(`/dashboard/certificates`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update status" };
  }
}

/**
 * Process QR Code or manual check-in / check-out.
 * Automatically switches between check-in and check-out based on current status:
 * - If not checked in: sets checked_in_at, status='attended'
 * - If already checked in and not checked out: sets checked_out_at, calculates hours, status='completed'
 */
export async function processVolunteerCheckInAction(params: {
  tokenOrId: string;
  action?: "auto" | "check_in" | "check_out";
}): Promise<{
  success: boolean;
  error?: string;
  actionType?: "check_in" | "check_out";
  volunteerName?: string;
  hoursLogged?: number;
  timestamp?: string;
}> {
  try {
    const { tokenOrId, action = "auto" } = params;
    if (!tokenOrId.trim()) {
      return { success: false, error: "Token or application ID is required" };
    }

    const supabase = await createClient();

    // Find the application by check_in_token OR id
    const { data: app, error } = await supabase
      .from("volunteer_applications")
      .select(
        `
        id,
        status,
        checked_in_at,
        checked_out_at,
        hours_logged,
        user_id,
        profiles (
          full_name,
          phone
        )
      `
      )
      .or(`check_in_token.eq.${tokenOrId.trim()},id.eq.${tokenOrId.trim()}`)
      .maybeSingle();

    if (error || !app) {
      return { success: false, error: "No matching volunteer registration found for this QR pass." };
    }

    const profileData = app.profiles as any;
    const volunteerName = profileData?.full_name || "Volunteer";
    const nowIso = new Date().toISOString();

    const isCheckingIn =
      action === "check_in" ||
      (action === "auto" && !app.checked_in_at);

    if (isCheckingIn) {
      const { error: updateError } = await supabase
        .from("volunteer_applications")
        .update({
          checked_in_at: nowIso,
          status: "attended",
        })
        .eq("id", app.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      revalidatePath(`/org/needs`);
      revalidatePath(`/dashboard`);
      revalidatePath(`/dashboard/commitments`);
      return {
        success: true,
        actionType: "check_in",
        volunteerName,
        timestamp: new Date().toLocaleTimeString(),
      };
    } else {
      // Check-out flow
      if (!app.checked_in_at) {
        return {
          success: false,
          error: "Volunteer must be checked in first before checking out.",
        };
      }

      if (app.checked_out_at && action === "auto") {
        return {
          success: false,
          error: `Volunteer ${volunteerName} was already checked out at ${new Date(app.checked_out_at).toLocaleTimeString()}.`,
        };
      }

      // Calculate hours
      const checkInTime = new Date(app.checked_in_at).getTime();
      const checkOutTime = new Date(nowIso).getTime();
      const diffHours = Math.max(0.5, Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 10) / 10);

      const { error: updateError } = await supabase
        .from("volunteer_applications")
        .update({
          checked_out_at: nowIso,
          hours_logged: diffHours,
          status: "completed",
        })
        .eq("id", app.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // ── Auto-issue volunteer service certificate on check-out ───────────
      // Fetch the need/org context needed for the certificate
      const { data: appDetail } = await supabase
        .from("volunteer_applications")
        .select(`
          id,
          user_id,
          need_items (
            id,
            title,
            needs (
              id,
              title,
              organizations ( id, name )
            )
          )
        `)
        .eq("id", app.id)
        .single();

      if (appDetail) {
        const item = (appDetail as any).need_items;
        const need = item?.needs;
        const org  = need?.organizations;

        await autoIssueCertificate({
          type:           "volunteer_service",
          userId:         (appDetail as any).user_id,
          organizationId: org?.id ?? "",
          relatedId:      (appDetail as any).id,
          recipientName:  volunteerName,
          campaignTitle:  need?.title ?? "Community Campaign",
          title:          "Certificate of Volunteer Service",
          hoursLogged:    diffHours,
        });
      }

      revalidatePath(`/org/needs`);
      revalidatePath(`/dashboard`);
      revalidatePath(`/dashboard/commitments`);
      revalidatePath(`/dashboard/certificates`);
      return {
        success: true,
        actionType: "check_out",
        volunteerName,
        hoursLogged: diffHours,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to process check-in" };
  }
}

/**
 * Fetch all commitments for the currently logged in supporter.
 */
export async function getUserCommitments(): Promise<{
  commitments: SupporterCommitment[];
  stats: {
    totalHours: number;
    completedCount: number;
    upcomingCount: number;
    activePassesCount: number;
  };
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        commitments: [],
        stats: calculateCommitmentStats([]),
      };
    }

    const { data, error } = await supabase
      .from("volunteer_applications")
      .select(
        `
        id,
        need_item_id,
        shift_id,
        status,
        hours_logged,
        checked_in_at,
        checked_out_at,
        check_in_token,
        created_at,
        volunteer_shifts (
          id,
          starts_at,
          ends_at
        ),
        need_items (
          id,
          title,
          needs (
            id,
            title,
            cover_url,
            location_text,
            organizations (
              id,
              name,
              logo_url
            )
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return {
        commitments: [],
        stats: calculateCommitmentStats([]),
      };
    }

    const commitments: SupporterCommitment[] = (data as any[]).map((row) => {
      const item = row.need_items;
      const need = item?.needs;
      const org = need?.organizations;
      const shift = row.volunteer_shifts;

      return {
        id: row.id,
        needItemId: row.need_item_id,
        needId: need?.id || "",
        needTitle: need?.title || "Community Outreach",
        needCoverUrl: need?.cover_url || null,
        locationText: need?.location_text || "Addis Ababa",
        orgName: org?.name || "GiveHand Partner",
        orgLogoUrl: org?.logo_url || null,
        roleTitle: item?.title || "Volunteer Contributor",
        shiftId: row.shift_id,
        shiftStartsAt: shift?.starts_at || null,
        shiftEndsAt: shift?.ends_at || null,
        status: row.status,
        hoursLogged: Number(row.hours_logged) || 0,
        checkedInAt: row.checked_in_at,
        checkedOutAt: row.checked_out_at,
        checkInToken: row.check_in_token,
        createdAt: row.created_at,
      };
    });

    return {
      commitments,
      stats: calculateCommitmentStats(commitments),
    };
  } catch (err) {
    console.error("getUserCommitments exception:", err);
    return {
      commitments: [],
      stats: calculateCommitmentStats([]),
    };
  }
}

function calculateCommitmentStats(commitments: SupporterCommitment[]) {
  const totalHours = commitments.reduce((acc, cur) => acc + (cur.hoursLogged || 0), 0);
  const completedCount = commitments.filter((c) => c.status === "completed").length;
  const upcomingCount = commitments.filter(
    (c) => c.status === "approved" || c.status === "confirmed" || c.status === "applied"
  ).length;
  const activePassesCount = commitments.filter(
    (c) => c.status === "approved" || c.status === "confirmed"
  ).length;

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    completedCount,
    upcomingCount,
    activePassesCount,
  };
}
