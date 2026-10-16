"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { autoIssueCertificate } from "@/lib/actions/certificates";
import {
  pledgeDonationSchema,
  confirmDonationSchema,
  type PledgeDonationInput,
  type ConfirmDonationInput,
} from "@/lib/validations/donation";
import type { MoneyDonationStatus, PaymentMethod } from "@/types/supabase";

export interface MoneyDonationRecord {
  id: string;
  needItemId: string;
  userId: string | null;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string | null;
  proofUrl: string | null;
  isAnonymous: boolean;
  status: MoneyDonationStatus;
  confirmedAt: string | null;
  createdAt: string;
  donor: {
    id: string;
    fullName: string;
    phone: string | null;
  } | null;
  itemTitle: string;
  targetAmount: number | null;
  needTitle: string;
  orgName: string;
}

export interface SupporterDonationRecord {
  id: string;
  needItemId: string;
  needId: string;
  needTitle: string;
  itemTitle: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber: string | null;
  isAnonymous: boolean;
  status: MoneyDonationStatus;
  confirmedAt: string | null;
  createdAt: string;
  orgName: string;
}

/**
 * Submit an ETB donation pledge (before payment proof upload).
 */
export async function pledgeDonationAction(
  data: PledgeDonationInput
): Promise<{ success: boolean; error?: string; donationId?: string }> {
  try {
    const parsed = pledgeDonationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    // Verify session server-side — user must be authenticated even for anonymous donations
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Please log in to make a donation" };
    }

    // Use admin client to bypass RLS for the insert — security is enforced above
    const { data: donation, error: insertError } = await supabaseAdmin
      .from("money_donations")
      .insert({
        need_item_id: parsed.data.needItemId,
        // null for anonymous mode — donor is logged in but hides identity
        user_id: parsed.data.isAnonymous ? null : user.id,
        amount: parsed.data.amount,
        method: parsed.data.method,
        reference_number: parsed.data.referenceNumber || null,
        is_anonymous: parsed.data.isAnonymous,
        status: "payment_submitted",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Donation insert error:", insertError);
      return { success: false, error: insertError.message || "Failed to submit donation" };
    }

    // Update donor profile with provided name/phone
    if (!parsed.data.isAnonymous) {
      await supabaseAdmin
        .from("profiles")
        .update({ phone: parsed.data.phone, full_name: parsed.data.fullName })
        .eq("id", user.id);
    }

    revalidatePath("/needs");
    revalidatePath("/dashboard/donations");
    revalidatePath("/org/needs");

    return { success: true, donationId: donation.id };
  } catch (err: any) {
    console.error("Donation exception:", err);
    return { success: false, error: err?.message || "An unexpected error occurred" };
  }
}

/**
 * Fetch money donations for an organization's need.
 * Resolves need_item IDs first, then queries donations — avoids
 * PostgREST join-filter limitations that caused empty results.
 */
export async function getMoneyDonationsForOrg(
  needId: string
): Promise<{
  donations: MoneyDonationRecord[];
  summary: {
    totalPledged: number;
    totalConfirmed: number;
    pendingCount: number;
    targetAmount: number;
  };
}> {
  try {
    // Step 1: Get all money-type need_items for this need
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("need_items")
      .select("id, title, target_amount, needs ( id, title, organizations ( id, name ) )")
      .eq("need_id", needId)
      .eq("item_type", "money");

    if (itemsError || !items || items.length === 0) {
      return { donations: [], summary: calculateDonationSummary([]) };
    }

    const needItemIds = items.map((i: any) => i.id);
    const itemMap: Record<string, any> = {};
    for (const item of items as any[]) {
      itemMap[item.id] = item;
    }

    // Step 2: Fetch all donations for those need_item IDs
    const { data, error } = await supabaseAdmin
      .from("money_donations")
      .select(
        `
        id,
        need_item_id,
        user_id,
        amount,
        method,
        reference_number,
        proof_url,
        is_anonymous,
        status,
        confirmed_at,
        created_at,
        profiles!money_donations_user_id_fkey (
          id,
          full_name,
          phone
        )
      `
      )
      .in("need_item_id", needItemIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getMoneyDonationsForOrg error:", error.message);
      return { donations: [], summary: calculateDonationSummary([]) };
    }

    if (!data || data.length === 0) {
      return { donations: [], summary: calculateDonationSummary([]) };
    }

    const donations: MoneyDonationRecord[] = (data as any[]).map((row) => {
      const item = itemMap[row.need_item_id];
      const need = item?.needs;
      const org = need?.organizations;
      const profile = row.profiles;

      return {
        id: row.id,
        needItemId: row.need_item_id,
        userId: row.user_id,
        amount: Number(row.amount) || 0,
        method: row.method,
        referenceNumber: row.reference_number,
        proofUrl: row.proof_url,
        isAnonymous: row.is_anonymous,
        status: row.status,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
        donor: row.is_anonymous
          ? null
          : {
              id: profile?.id || row.user_id,
              fullName: profile?.full_name || "Unknown Donor",
              phone: profile?.phone || null,
            },
        itemTitle: item?.title || "Donation Fund",
        targetAmount: Number(item?.target_amount) || null,
        needTitle: need?.title || "Campaign",
        orgName: org?.name || "Organization",
      };
    });

    return {
      donations,
      summary: calculateDonationSummary(donations),
    };
  } catch (err) {
    console.error("getMoneyDonationsForOrg exception:", err);
    return { donations: [], summary: calculateDonationSummary([]) };
  }
}

/**
 * Organization confirms or rejects a donation.
 */
export async function confirmDonationAction(
  data: ConfirmDonationInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = confirmDonationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Validation failed" };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const updatePayload: Record<string, any> = {
      status: parsed.data.status,
    };

    if (parsed.data.status === "confirmed") {
      updatePayload.confirmed_by = user.id;
      updatePayload.confirmed_at = new Date().toISOString();
    }

    // Use admin client to update — user auth is already verified above
    const { error } = await supabaseAdmin
      .from("money_donations")
      .update(updatePayload as any)
      .eq("id", parsed.data.donationId);

    if (error) {
      return { success: false, error: error.message };
    }

    // ── Auto-issue a donation receipt certificate ─────────────────────────
    if (parsed.data.status === "confirmed") {
      const { data: donRow } = await supabaseAdmin
        .from("money_donations")
        .select(`
          id,
          amount,
          user_id,
          need_items (
            id,
            title,
            needs (
              id,
              title,
              organizations ( id, name )
            )
          ),
          donor_profile:profiles!money_donations_user_id_fkey ( full_name )
        `)
        .eq("id", parsed.data.donationId)
        .single();

      if (donRow && (donRow as any).user_id) {
        const item    = (donRow as any).need_items;
        const need    = item?.needs;
        const org     = need?.organizations;
        const profile = (donRow as any).donor_profile;

        await autoIssueCertificate({
          type:            "donation_receipt",
          userId:          (donRow as any).user_id,
          organizationId:  org?.id ?? "",
          relatedId:       (donRow as any).id,
          recipientName:   profile?.full_name ?? "Community Supporter",
          campaignTitle:   need?.title ?? "Community Campaign",
          title:           "Official Certificate of Philanthropic Contribution",
          donationAmount:  Number((donRow as any).amount),
        });
      }
    }

    revalidatePath("/org/needs");
    revalidatePath("/org/needs/[id]/donations", "page");
    revalidatePath("/needs");
    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/certificates");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to confirm donation" };
  }
}

/**
 * Fetch money donations made by the currently logged-in supporter.
 * Also fetches anonymous donations linked to this user's session
 * by looking up by user_id (non-anonymous) OR by checking the session.
 */
export async function getUserDonations(): Promise<{
  donations: SupporterDonationRecord[];
  stats: {
    totalDonated: number;
    confirmedCount: number;
    pendingCount: number;
  };
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { donations: [], stats: calculateSupporterDonationStats([]) };
    }

    // Fetch by user_id (covers both anonymous=false and any row linked to this user)
    const { data, error } = await supabaseAdmin
      .from("money_donations")
      .select(
        `
        id,
        need_item_id,
        amount,
        method,
        reference_number,
        is_anonymous,
        status,
        confirmed_at,
        created_at,
        need_items (
          id,
          title,
          needs (
            id,
            title,
            organizations (
              id,
              name
            )
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getUserDonations error:", error.message);
      return { donations: [], stats: calculateSupporterDonationStats([]) };
    }

    if (!data || data.length === 0) {
      return { donations: [], stats: calculateSupporterDonationStats([]) };
    }

    const donations: SupporterDonationRecord[] = (data as any[]).map((row) => {
      const item = row.need_items;
      const need = item?.needs;
      const org = need?.organizations;

      return {
        id: row.id,
        needItemId: row.need_item_id,
        needId: need?.id || "",
        needTitle: need?.title || "Community Campaign",
        itemTitle: item?.title || "Donation Fund",
        amount: Number(row.amount) || 0,
        method: row.method,
        referenceNumber: row.reference_number,
        isAnonymous: row.is_anonymous,
        status: row.status,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
        orgName: org?.name || "GiveHand Partner",
      };
    });

    return {
      donations,
      stats: calculateSupporterDonationStats(donations),
    };
  } catch (err) {
    console.error("getUserDonations exception:", err);
    return { donations: [], stats: calculateSupporterDonationStats([]) };
  }
}

function calculateDonationSummary(donations: MoneyDonationRecord[]) {
  const totalPledged = donations.reduce((acc, cur) => acc + cur.amount, 0);
  const totalConfirmed = donations
    .filter((d) => d.status === "confirmed")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const pendingCount = donations.filter(
    (d) => d.status === "pledged" || d.status === "payment_submitted"
  ).length;
  const targetAmount = donations[0]?.targetAmount || 0;

  return { totalPledged, totalConfirmed, pendingCount, targetAmount };
}

function calculateSupporterDonationStats(donations: SupporterDonationRecord[]) {
  const totalDonated = donations
    .filter((d) => d.status === "confirmed")
    .reduce((acc, cur) => acc + cur.amount, 0);
  const confirmedCount = donations.filter((d) => d.status === "confirmed").length;
  const pendingCount = donations.filter(
    (d) => d.status === "pledged" || d.status === "payment_submitted"
  ).length;

  return { totalDonated, confirmedCount, pendingCount };
}
