"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  pledgeMaterialSchema,
  receiveMaterialSchema,
  type PledgeMaterialInput,
  type ReceiveMaterialInput,
} from "@/lib/validations/material";
import type { MaterialPledgeStatus } from "@/types/supabase";

export interface MaterialPledgeRecord {
  id: string;
  needItemId: string;
  userId: string;
  quantity: number;
  receivedQuantity: number;
  deliveryMethod: "dropoff" | "pickup_requested" | "courier";
  status: MaterialPledgeStatus;
  conditionNote: string | null;
  photoUrl: string | null;
  createdAt: string;
  donor: {
    id: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    city: string | null;
  };
  itemTitle: string;
  unit: string;
  need?: {
    id: string;
    title: string;
    locationText: string | null;
    organization: {
      id: string;
      name: string;
      address: string | null;
      phone: string | null;
    };
  };
}

export interface SupporterMaterialPledge {
  id: string;
  needItemId: string;
  needId: string;
  needTitle: string;
  itemTitle: string;
  unit: string;
  quantity: number;
  receivedQuantity: number;
  deliveryMethod: "dropoff" | "pickup_requested" | "courier";
  status: MaterialPledgeStatus;
  conditionNote: string | null;
  photoUrl: string | null;
  orgName: string;
  orgAddress: string | null;
  orgPhone: string | null;
  createdAt: string;
}

/**
 * Submit physical goods pledge.
 */
export async function pledgeMaterialAction(
  data: PledgeMaterialInput
): Promise<{ success: boolean; error?: string; pledgeId?: string }> {
  try {
    const parsed = pledgeMaterialSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please log in to submit a material pledge" };
    }

    const { data: pledge, error: insertError } = await supabase
      .from("material_pledges")
      .insert({
        need_item_id: parsed.data.needItemId,
        user_id: user.id,
        quantity: parsed.data.quantity,
        received_quantity: 0,
        delivery_method: parsed.data.deliveryMethod,
        condition_note: parsed.data.conditionNote,
        photo_url: parsed.data.photoUrl || null,
        status: "pledged",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Material pledge insert error:", insertError);
      return { success: false, error: insertError.message || "Failed to submit material pledge" };
    }

    // Update profile phone & name if not set
    await supabase
      .from("profiles")
      .update({
        phone: parsed.data.phone,
        full_name: parsed.data.fullName,
      })
      .eq("id", user.id);

    revalidatePath(`/needs`);
    revalidatePath(`/dashboard/materials`);
    revalidatePath(`/org/needs`);

    return { success: true, pledgeId: pledge.id };
  } catch (err: any) {
    console.error("Material pledge exception:", err);
    return { success: false, error: err?.message || "An unexpected error occurred" };
  }
}

/**
 * Fetch pledges for an organization's need.
 */
export async function getMaterialPledgesForOrg(
  needId: string,
  statusFilter?: string
): Promise<{
  pledges: MaterialPledgeRecord[];
  summary: {
    totalPledged: number;
    totalReceived: number;
    pendingCount: number;
  };
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("material_pledges")
      .select(
        `
        id,
        need_item_id,
        user_id,
        quantity,
        received_quantity,
        delivery_method,
        status,
        condition_note,
        photo_url,
        created_at,
        profiles (
          id,
          full_name,
          phone,
          avatar_url,
          city
        ),
        need_items!inner (
          id,
          need_id,
          title,
          unit,
          needs (
            id,
            title,
            location_text,
            organizations (
              id,
              name,
              address,
              phone
            )
          )
        )
      `
      )
      .eq("need_items.need_id", needId);

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter as MaterialPledgeStatus);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return {
        pledges: [],
        summary: calculateMaterialSummary([]),
      };
    }

    const pledges: MaterialPledgeRecord[] = (data as any[]).map((row) => {
      const item = row.need_items;
      const need = item?.needs;
      const org = need?.organizations;

      return {
        id: row.id,
        needItemId: row.need_item_id,
        userId: row.user_id,
        quantity: Number(row.quantity) || 0,
        receivedQuantity: Number(row.received_quantity) || 0,
        deliveryMethod: row.delivery_method || "dropoff",
        status: row.status,
        conditionNote: row.condition_note,
        photoUrl: row.photo_url,
        createdAt: row.created_at,
        donor: {
          id: row.profiles?.id || row.user_id,
          fullName: row.profiles?.full_name || "Community Donor",
          phone: row.profiles?.phone || "+251 900 000 000",
          avatarUrl: row.profiles?.avatar_url || null,
          city: row.profiles?.city || "Addis Ababa",
        },
        itemTitle: item?.title || "Materials",
        unit: item?.unit || "units",
        need: {
          id: need?.id || needId,
          title: need?.title || "Campaign",
          locationText: need?.location_text || null,
          organization: {
            id: org?.id || "",
            name: org?.name || "Organization",
            address: org?.address || null,
            phone: org?.phone || null,
          },
        },
      };
    });

    return {
      pledges,
      summary: calculateMaterialSummary(pledges),
    };
  } catch (err) {
    console.error("getMaterialPledgesForOrg exception:", err);
    return {
      pledges: [],
      summary: calculateMaterialSummary([]),
    };
  }
}

/**
 * Organization records material delivery or receipt (supports partial receiving).
 */
export async function updateMaterialPledgeStatusAction(
  data: ReceiveMaterialInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = receiveMaterialSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const supabase = await createClient();

    const updatePayload: Record<string, any> = {
      status: parsed.data.status,
      received_quantity: parsed.data.receivedQuantity,
    };

    if (parsed.data.inspectionNote) {
      updatePayload.condition_note = parsed.data.inspectionNote;
    }

    const { error } = await supabase
      .from("material_pledges")
      .update(updatePayload as any)
      .eq("id", parsed.data.pledgeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/org/needs`);
    revalidatePath(`/dashboard/materials`);
    revalidatePath(`/needs`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update material pledge" };
  }
}

/**
 * Fetch pledges made by the currently logged-in supporter.
 */
export async function getUserMaterialPledges(): Promise<{
  pledges: SupporterMaterialPledge[];
  stats: {
    totalPledgesCount: number;
    deliveredCount: number;
    pendingCount: number;
  };
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        pledges: [],
        stats: calculateSupporterMaterialStats([]),
      };
    }

    const { data, error } = await supabase
      .from("material_pledges")
      .select(
        `
        id,
        need_item_id,
        quantity,
        received_quantity,
        delivery_method,
        status,
        condition_note,
        photo_url,
        created_at,
        need_items (
          id,
          title,
          unit,
          needs (
            id,
            title,
            organizations (
              id,
              name,
              address,
              phone
            )
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return {
        pledges: [],
        stats: calculateSupporterMaterialStats([]),
      };
    }

    const pledges: SupporterMaterialPledge[] = (data as any[]).map((row) => {
      const item = row.need_items;
      const need = item?.needs;
      const org = need?.organizations;

      return {
        id: row.id,
        needItemId: row.need_item_id,
        needId: need?.id || "",
        needTitle: need?.title || "Community Campaign",
        itemTitle: item?.title || "Material Items",
        unit: item?.unit || "units",
        quantity: Number(row.quantity) || 0,
        receivedQuantity: Number(row.received_quantity) || 0,
        deliveryMethod: row.delivery_method || "dropoff",
        status: row.status,
        conditionNote: row.condition_note,
        photoUrl: row.photo_url,
        orgName: org?.name || "GiveHand Partner",
        orgAddress: org?.address || "Addis Ababa",
        orgPhone: org?.phone || "+251 11 000 0000",
        createdAt: row.created_at,
      };
    });

    return {
      pledges,
      stats: calculateSupporterMaterialStats(pledges),
    };
  } catch (err) {
    console.error("getUserMaterialPledges exception:", err);
    return {
      pledges: [],
      stats: calculateSupporterMaterialStats([]),
    };
  }
}

function calculateMaterialSummary(pledges: MaterialPledgeRecord[]) {
  const totalPledged = pledges.reduce((acc, cur) => acc + cur.quantity, 0);
  const totalReceived = pledges.reduce((acc, cur) => acc + cur.receivedQuantity, 0);
  const pendingCount = pledges.filter(
    (p) => p.status === "pledged" || p.status === "in_transit"
  ).length;

  return { totalPledged, totalReceived, pendingCount };
}

function calculateSupporterMaterialStats(pledges: SupporterMaterialPledge[]) {
  const totalPledgesCount = pledges.length;
  const deliveredCount = pledges.filter(
    (p) => p.status === "received" || p.status === "partially_received"
  ).length;
  const pendingCount = pledges.filter(
    (p) => p.status === "pledged" || p.status === "in_transit" || p.status === "delivered"
  ).length;

  return { totalPledgesCount, deliveredCount, pendingCount };
}
