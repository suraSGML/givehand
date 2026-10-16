"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNeedSchema, type CreateNeedInput } from "@/lib/validations/need";
import type { NeedStatus, ItemType } from "@/types/supabase";

export interface NeedCardData {
  id: string;
  title: string;
  description: string;
  locationText: string;
  city: string;
  lat: number | null;
  lng: number | null;
  urgency: boolean;
  status: NeedStatus;
  coverUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    status: string;
  };
  category: {
    id: string;
    nameEn: string;
    nameAm: string;
    icon: string | null;
  } | null;
  items: Array<{
    id: string;
    itemType: ItemType;
    title: string;
    targetQuantity: number | null;
    targetAmount: number | null;
    unit: string | null;
    progressPercentage: number;
    currentVolunteers?: number;
    receivedQuantity?: number;
    confirmedAmount?: number;
    shifts?: Array<{
      id: string;
      startsAt: string;
      endsAt: string;
      capacity: number;
      confirmedCount?: number;
    }>;
  }>;
  overallProgress: number;
}

interface ItemProgressStats {
  currentVolunteers: number;
  receivedQuantity: number;
  confirmedAmount: number;
  progressPercentage: number;
}

async function fetchNeedItemProgressMap(
  supabase: any,
  itemIds: string[]
): Promise<Map<string, ItemProgressStats>> {
  const map = new Map<string, ItemProgressStats>();
  if (!itemIds || itemIds.length === 0) return map;

  try {
    const { data: progressRows, error } = await supabase
      .from("need_item_progress")
      .select("*")
      .in("need_item_id", itemIds);

    if (!error && progressRows && progressRows.length > 0) {
      for (const r of progressRows) {
        map.set(r.need_item_id, {
          currentVolunteers: Number(r.confirmed_volunteers) || 0,
          receivedQuantity: Number(r.received_material_quantity) || 0,
          confirmedAmount: Number(r.confirmed_money_amount) || 0,
          progressPercentage: Number(r.progress_percentage) || 0,
        });
      }
      return map;
    }
  } catch (_e) {
    // Fall back to direct table aggregation
  }

  try {
    const [volunteersRes, materialsRes, donationsRes] = await Promise.all([
      supabase
        .from("volunteer_applications")
        .select("need_item_id, status")
        .in("need_item_id", itemIds)
        .in("status", ["approved", "confirmed", "attended", "completed"]),
      supabase
        .from("material_pledges")
        .select("need_item_id, quantity, received_quantity, status")
        .in("need_item_id", itemIds)
        .in("status", ["received", "partially_received"]),
      supabase
        .from("money_donations")
        .select("need_item_id, amount, status")
        .in("need_item_id", itemIds)
        .eq("status", "confirmed"),
    ]);

    const volCounts = new Map<string, number>();
    for (const v of volunteersRes.data || []) {
      volCounts.set(v.need_item_id, (volCounts.get(v.need_item_id) || 0) + 1);
    }

    const matCounts = new Map<string, number>();
    for (const m of materialsRes.data || []) {
      const qty = Number(m.received_quantity) || Number(m.quantity) || 0;
      matCounts.set(m.need_item_id, (matCounts.get(m.need_item_id) || 0) + qty);
    }

    const donSums = new Map<string, number>();
    for (const d of donationsRes.data || []) {
      const amt = Number(d.amount) || 0;
      donSums.set(d.need_item_id, (donSums.get(d.need_item_id) || 0) + amt);
    }

    for (const id of itemIds) {
      map.set(id, {
        currentVolunteers: volCounts.get(id) || 0,
        receivedQuantity: matCounts.get(id) || 0,
        confirmedAmount: donSums.get(id) || 0,
        progressPercentage: 0,
      });
    }
  } catch (_e) {
    // ignore
  }

  return map;
}

export async function getNeeds(filters?: {
  query?: string;
  category?: string;
  type?: string;
  city?: string;
  urgency?: boolean;
  organizationId?: string;
  status?: NeedStatus;
}): Promise<NeedCardData[]> {
  try {
    const supabase = await createClient();
    let dbQuery = supabase
      .from("needs")
      .select(
        `
        id,
        title,
        description,
        location_text,
        lat,
        lng,
        urgency,
        status,
        cover_url,
        start_date,
        end_date,
        organizations (
          id,
          name,
          slug,
          logo_url,
          status
        ),
        categories (
          id,
          name_en,
          name_am,
          icon
        ),
        need_items (
          id,
          item_type,
          title,
          target_quantity,
          target_amount,
          unit
        )
      `
      );

    if (filters?.organizationId) {
      dbQuery = dbQuery.eq("organization_id", filters.organizationId);
      if (filters?.status) {
        dbQuery = dbQuery.eq("status", filters.status);
      }
    } else {
      dbQuery = dbQuery.eq("status", filters?.status || "open");
    }

    if (filters?.category) {
      dbQuery = dbQuery.eq("category_id", filters.category);
    }
    if (filters?.urgency) {
      dbQuery = dbQuery.eq("urgency", true);
    }

    const { data, error } = await dbQuery;

    if (error || !data || data.length === 0) {
      return [];
    }

    const allItemIds = data.flatMap((n: any) => (n.need_items || []).map((i: any) => i.id));
    const progressMap = await fetchNeedItemProgressMap(supabase, allItemIds);

    // Map database result
    let results: NeedCardData[] = data.map((n: any) => {
      const items = (n.need_items || []).map((item: any) => {
        const prog = progressMap.get(item.id);
        const currentVolunteers = prog?.currentVolunteers || 0;
        const receivedQuantity = prog?.receivedQuantity || 0;
        const confirmedAmount = prog?.confirmedAmount || 0;

        let progressPercentage = prog?.progressPercentage || 0;
        if (progressPercentage === 0) {
          if (item.item_type === "volunteer" && item.target_quantity && item.target_quantity > 0) {
            progressPercentage = Math.round(Math.min(100, (currentVolunteers / item.target_quantity) * 100));
          } else if (item.item_type === "material" && item.target_quantity && item.target_quantity > 0) {
            progressPercentage = Math.round(Math.min(100, (receivedQuantity / item.target_quantity) * 100));
          } else if (item.item_type === "money" && item.target_amount && item.target_amount > 0) {
            progressPercentage = Math.round(Math.min(100, (confirmedAmount / item.target_amount) * 100));
          }
        }

        return {
          id: item.id,
          itemType: item.item_type,
          title: item.title,
          targetQuantity: item.target_quantity,
          targetAmount: item.target_amount,
          unit: item.unit,
          progressPercentage,
          currentVolunteers,
          receivedQuantity,
          confirmedAmount,
        };
      });

      const avgProgress =
        items.length > 0
          ? Math.round(
              items.reduce(
                (acc: number, cur: any) => acc + (cur.progressPercentage || 0),
                0
              ) / items.length
            )
          : 0;

      return {
        id: n.id,
        title: n.title,
        description: n.description || "",
        locationText: n.location_text || "",
        city: n.location_text?.includes("Hawassa")
          ? "Hawassa"
          : n.location_text?.includes("Bahir Dar")
            ? "Bahir Dar"
            : "Addis Ababa",
        lat: n.lat,
        lng: n.lng,
        urgency: n.urgency,
        status: n.status,
        coverUrl: n.cover_url,
        startDate: n.start_date,
        endDate: n.end_date,
        organization: {
          id: n.organizations?.id || "",
          name: n.organizations?.name || "Verified Organization",
          slug: n.organizations?.slug || "org",
          logoUrl: n.organizations?.logo_url,
          status: n.organizations?.status || "verified",
        },
        category: n.categories
          ? {
              id: n.categories.id,
              nameEn: n.categories.name_en,
              nameAm: n.categories.name_am,
              icon: n.categories.icon,
            }
          : null,
        items,
        overallProgress: avgProgress,
      };
    });

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description.toLowerCase().includes(q) ||
          n.locationText.toLowerCase().includes(q)
      );
    }

    if (filters?.city && filters.city !== "all") {
      results = results.filter((n) =>
        n.locationText.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }

    if (filters?.type && filters.type !== "all") {
      results = results.filter((n) =>
        n.items.some((i) => i.itemType === filters.type)
      );
    }

    return results;
  } catch (_e) {
    return [];
  }
}

// ── Featured Needs (Home Page) ─────────────────────────────────────────────

export async function getFeaturedNeeds(limit = 6): Promise<NeedCardData[]> {
  try {
    const supabase = await createClient();

    // First try urgent needs, then fall back to most recent open needs
    const { data: urgentData } = await supabase
      .from("needs")
      .select(
        `id, title, description, location_text, lat, lng, urgency, status,
         cover_url, start_date, end_date,
         organizations ( id, name, slug, logo_url, status ),
         categories ( id, name_en, name_am, icon ),
         need_items ( id, item_type, title, target_quantity, target_amount, unit )`
      )
      .eq("status", "open")
      .eq("urgency", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    let pool = urgentData || [];

    if (pool.length < limit) {
      const { data: recentData } = await supabase
        .from("needs")
        .select(
          `id, title, description, location_text, lat, lng, urgency, status,
           cover_url, start_date, end_date,
           organizations ( id, name, slug, logo_url, status ),
           categories ( id, name_en, name_am, icon ),
           need_items ( id, item_type, title, target_quantity, target_amount, unit )`
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(limit);

      const existing = new Set(pool.map((n: any) => n.id));
      const extras = (recentData || []).filter((n: any) => !existing.has(n.id));
      pool = [...pool, ...extras].slice(0, limit);
    }

    const allItemIds = pool.flatMap((n: any) => (n.need_items || []).map((i: any) => i.id));
    const progressMap = await fetchNeedItemProgressMap(supabase, allItemIds);

    return pool.map((n: any) => {
      const items = (n.need_items || []).map((item: any) => {
        const prog = progressMap.get(item.id);
        const currentVolunteers = prog?.currentVolunteers || 0;
        const receivedQuantity = prog?.receivedQuantity || 0;
        const confirmedAmount = prog?.confirmedAmount || 0;

        let progressPercentage = prog?.progressPercentage || 0;
        if (progressPercentage === 0) {
          if (item.item_type === "volunteer" && item.target_quantity && item.target_quantity > 0) {
            progressPercentage = Math.round(Math.min(100, (currentVolunteers / item.target_quantity) * 100));
          } else if (item.item_type === "material" && item.target_quantity && item.target_quantity > 0) {
            progressPercentage = Math.round(Math.min(100, (receivedQuantity / item.target_quantity) * 100));
          } else if (item.item_type === "money" && item.target_amount && item.target_amount > 0) {
            progressPercentage = Math.round(Math.min(100, (confirmedAmount / item.target_amount) * 100));
          }
        }

        return {
          id: item.id,
          itemType: item.item_type,
          title: item.title,
          targetQuantity: item.target_quantity,
          targetAmount: item.target_amount,
          unit: item.unit,
          progressPercentage,
          currentVolunteers,
          receivedQuantity,
          confirmedAmount,
        };
      });

      const overallProgress =
        items.length > 0
          ? Math.round(items.reduce((a: number, c: any) => a + (c.progressPercentage || 0), 0) / items.length)
          : 0;

      return {
        id: n.id,
        title: n.title,
        description: n.description || "",
        locationText: n.location_text || "",
        city: n.location_text || "",
        lat: n.lat,
        lng: n.lng,
        urgency: n.urgency,
        status: n.status,
        coverUrl: n.cover_url,
        startDate: n.start_date,
        endDate: n.end_date,
        organization: {
          id: n.organizations?.id || "",
          name: n.organizations?.name || "Verified Organization",
          slug: n.organizations?.slug || "org",
          logoUrl: n.organizations?.logo_url,
          status: n.organizations?.status || "verified",
        },
        category: n.categories
          ? { id: n.categories.id, nameEn: n.categories.name_en, nameAm: n.categories.name_am, icon: n.categories.icon }
          : null,
        items,
        overallProgress,
      };
    });
  } catch {
    return [];
  }
}


export async function getNeedById(id: string): Promise<NeedCardData | null> {
  try {
    const supabase = await createClient();
    const { data: n, error } = await supabase
      .from("needs")
      .select(
        `
        id,
        title,
        description,
        location_text,
        lat,
        lng,
        urgency,
        status,
        cover_url,
        start_date,
        end_date,
        organizations (
          id,
          name,
          slug,
          logo_url,
          status
        ),
        categories (
          id,
          name_en,
          name_am,
          icon
        ),
        need_items (
          id,
          item_type,
          title,
          target_quantity,
          target_amount,
          unit,
          volunteer_shifts (
            id,
            starts_at,
            ends_at,
            capacity
          )
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error || !n) {
      return null;
    }

    const itemIds = ((n as any).need_items || []).map((item: any) => item.id);
    const progressMap = await fetchNeedItemProgressMap(supabase, itemIds);

    const items = ((n as any).need_items || []).map((item: any) => {
      const prog = progressMap.get(item.id);
      const currentVolunteers = prog?.currentVolunteers || 0;
      const receivedQuantity = prog?.receivedQuantity || 0;
      const confirmedAmount = prog?.confirmedAmount || 0;

      let progressPercentage = prog?.progressPercentage || 0;
      if (progressPercentage === 0) {
        if (item.item_type === "volunteer" && item.target_quantity && item.target_quantity > 0) {
          progressPercentage = Math.round(Math.min(100, (currentVolunteers / item.target_quantity) * 100));
        } else if (item.item_type === "material" && item.target_quantity && item.target_quantity > 0) {
          progressPercentage = Math.round(Math.min(100, (receivedQuantity / item.target_quantity) * 100));
        } else if (item.item_type === "money" && item.target_amount && item.target_amount > 0) {
          progressPercentage = Math.round(Math.min(100, (confirmedAmount / item.target_amount) * 100));
        }
      }

      return {
        id: item.id,
        itemType: item.item_type,
        title: item.title,
        targetQuantity: item.target_quantity,
        targetAmount: item.target_amount,
        unit: item.unit,
        progressPercentage,
        currentVolunteers,
        receivedQuantity,
        confirmedAmount,
        shifts: (item.volunteer_shifts || []).map((s: any) => ({
          id: s.id,
          startsAt: s.starts_at,
          endsAt: s.ends_at,
          capacity: s.capacity,
        })),
      };
    });

    const overallProgress =
      items.length > 0
        ? Math.round(items.reduce((acc: number, cur: any) => acc + (cur.progressPercentage || 0), 0) / items.length)
        : 0;

    return {
      id: n.id,
      title: n.title,
      description: n.description || "",
      locationText: n.location_text || "",
      city: n.location_text?.includes("Hawassa")
        ? "Hawassa"
        : n.location_text?.includes("Bahir Dar")
          ? "Bahir Dar"
          : "Addis Ababa",
      lat: n.lat,
      lng: n.lng,
      urgency: n.urgency,
      status: n.status,
      coverUrl: n.cover_url,
      startDate: n.start_date,
      endDate: n.end_date,
      organization: {
        id: (n.organizations as any)?.id || "",
        name: (n.organizations as any)?.name || "Verified Organization",
        slug: (n.organizations as any)?.slug || "org",
        logoUrl: (n.organizations as any)?.logo_url,
        status: (n.organizations as any)?.status || "verified",
      },
      category: n.categories
        ? {
            id: (n.categories as any).id,
            nameEn: (n.categories as any).name_en,
            nameAm: (n.categories as any).name_am,
            icon: (n.categories as any).icon,
          }
        : null,
      items,
      overallProgress,
    };
  } catch (_e) {
    return null;
  }
}

export async function createNeedAction(
  data: CreateNeedInput
): Promise<{ success: boolean; error?: string; needId?: string }> {
  const parsed = createNeedSchema.safeParse(data);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => i.message)
      .filter(Boolean)
      .join(". ");
    return { success: false, error: errorDetails || "Validation failed" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  // Get user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id, status")
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    return {
      success: false,
      error: "No organization found for your account. Please complete organization onboarding first.",
    };
  }

  // Only verified orgs can publish as 'open'
  const finalStatus: NeedStatus =
    org.status === "verified" && parsed.data.status === "open"
      ? "open"
      : "draft";

  const { data: insertedNeed, error: needError } = await supabase
    .from("needs")
    .insert({
      organization_id: org.id,
      category_id: parsed.data.categoryId || null,
      title: parsed.data.title,
      description: parsed.data.description,
      location_text: `${parsed.data.locationText}, ${parsed.data.city}`,
      lat: parsed.data.lat || null,
      lng: parsed.data.lng || null,
      is_remote: parsed.data.isRemote,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      urgency: parsed.data.urgency,
      cover_url: parsed.data.coverUrl || null,
      status: finalStatus,
    })
    .select("id")
    .single();

  if (needError || !insertedNeed) {
    return { success: false, error: needError?.message || "Failed to create campaign" };
  }

  // Insert items
  for (const item of parsed.data.items) {
    const { data: insertedItem } = await supabase
      .from("need_items")
      .insert({
        need_id: insertedNeed.id,
        item_type: item.itemType,
        title: item.title,
        description: item.description || null,
        target_quantity: item.targetQuantity || null,
        target_amount: item.targetAmount || null,
        unit: item.unit || (item.itemType === "money" ? "ETB" : "items"),
      })
      .select("id")
      .single();

    if (insertedItem && item.shifts && item.shifts.length > 0) {
      for (const shift of item.shifts) {
        if (shift.startsAt && shift.endsAt) {
          await supabase.from("volunteer_shifts").insert({
            need_item_id: insertedItem.id,
            starts_at: shift.startsAt,
            ends_at: shift.endsAt,
            capacity: shift.capacity || 10,
          });
        }
      }
    }
  }

  revalidatePath("/needs");
  revalidatePath("/org/needs");
  return { success: true, needId: insertedNeed.id };
}

/**
 * Update the status of a need (draft, open, in_progress, completed, cancelled).
 * Guard: only verified organizations can change status to 'open'.
 */
export async function updateNeedStatusAction(
  needId: string,
  newStatus: NeedStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify need and org ownership
    const { data: need, error: fetchError } = await supabase
      .from("needs")
      .select("id, organization_id, organizations!inner(id, owner_id, status)")
      .eq("id", needId)
      .single();

    if (fetchError || !need) {
      revalidatePath("/org/needs");
      revalidatePath("/needs");
      return { success: true };
    }

    const org = need.organizations as any;
    if (org.owner_id !== user.id) {
      return { success: false, error: "Unauthorized: You do not manage this campaign" };
    }

    if (newStatus === "open" && org.status !== "verified") {
      return {
        success: false,
        error:
          "Your organization must be verified by a platform admin before publishing campaigns as open.",
      };
    }

    const { error: updateError } = await supabase
      .from("needs")
      .update({ status: newStatus })
      .eq("id", needId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/needs");
    revalidatePath("/org/needs");
    revalidatePath(`/needs/${needId}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update campaign status" };
  }
}

