"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PlatformImpactMetrics {
  overview: {
    totalOrganizations: number;
    verifiedOrganizations: number;
    pendingOrganizations: number;
    totalNeeds: number;
    activeNeeds: number;
    completedNeeds: number;
    totalSupporters: number;
  };
  financials: {
    totalConfirmedEtb: number;
    totalPledgedEtb: number;
    averageDonationEtb: number;
    byMethod: {
      telebirr: number;
      cbe_birr: number;
      bank_transfer: number;
      chapa: number;
      cash: number;
    };
  };
  volunteering: {
    totalApplications: number;
    confirmedVolunteers: number;
    hoursServed: number;
    certificatesIssued: number;
  };
  materials: {
    totalPledges: number;
    itemsDelivered: number;
  };
  regionalDistribution: Array<{
    city: string;
    needsCount: number;
    fundsRaisedEtb: number;
    volunteersCount: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    percentage: number;
    campaignsCount: number;
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    targetType: string;
    actor: string;
    createdAt: string;
    details: string;
  }>;
}

export async function getPlatformImpactMetrics(): Promise<PlatformImpactMetrics> {
  const emptyMetrics: PlatformImpactMetrics = {
    overview: {
      totalOrganizations: 0,
      verifiedOrganizations: 0,
      pendingOrganizations: 0,
      totalNeeds: 0,
      activeNeeds: 0,
      completedNeeds: 0,
      totalSupporters: 0,
    },
    financials: {
      totalConfirmedEtb: 0,
      totalPledgedEtb: 0,
      averageDonationEtb: 0,
      byMethod: {
        telebirr: 0,
        cbe_birr: 0,
        bank_transfer: 0,
        chapa: 0,
        cash: 0,
      },
    },
    volunteering: {
      totalApplications: 0,
      confirmedVolunteers: 0,
      hoursServed: 0,
      certificatesIssued: 0,
    },
    materials: {
      totalPledges: 0,
      itemsDelivered: 0,
    },
    regionalDistribution: [],
    categoryDistribution: [],
    recentAuditLogs: [],
  };

  try {
    const supabase = createAdminClient();

    // Query core aggregates in parallel
    const [
      orgsRes,
      needsRes,
      donationsRes,
      volunteersRes,
      certificatesRes,
      auditRes,
      supportersRes,
      pledgesRes,
    ] = await Promise.all([
      supabase.from("organizations").select("id, status"),
      supabase.from("needs").select("id, status, location_text"),
      supabase.from("money_donations").select("id, amount, method, status"),
      supabase.from("volunteer_applications").select("id, status, hours_logged"),
      supabase.from("certificates").select("id, type"),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("profiles").select("id").eq("role", "supporter"),
      supabase.from("material_pledges").select("id, status, received_quantity"),
    ]);

    const orgs = orgsRes.data || [];
    const needs = needsRes.data || [];
    const donations = donationsRes.data || [];
    const volunteers = volunteersRes.data || [];
    const certificates = certificatesRes.data || [];
    const auditLogs = auditRes.data || [];
    const supporters = supportersRes.data || [];
    const pledges = pledgesRes.data || [];

    const verifiedOrgs = orgs.filter((o) => o.status === "verified").length;
    const pendingOrgs = orgs.filter((o) => o.status === "pending").length;

    const activeNeeds = needs.filter((n) => n.status === "open" || n.status === "in_progress").length;
    const completedNeeds = needs.filter((n) => n.status === "completed").length;

    const confirmedDonations = donations.filter((d) => d.status === "confirmed");
    const totalConfirmedEtb = confirmedDonations.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalPledgedEtb = donations.reduce((sum, d) => sum + Number(d.amount), 0);

    const hoursServed = volunteers.reduce((sum, v) => sum + (Number(v.hours_logged) || 0), 0);

    const telebirrSum = confirmedDonations.filter((d) => d.method === "telebirr").reduce((s, d) => s + Number(d.amount), 0);
    const cbeBirrSum = confirmedDonations.filter((d) => d.method === "cbe_birr").reduce((s, d) => s + Number(d.amount), 0);
    const bankSum = confirmedDonations.filter((d) => d.method === "bank_transfer").reduce((s, d) => s + Number(d.amount), 0);
    const chapaSum = confirmedDonations.filter((d) => d.method === "chapa").reduce((s, d) => s + Number(d.amount), 0);
    const cashSum = confirmedDonations.filter((d) => d.method === "cash").reduce((s, d) => s + Number(d.amount), 0);

    const deliveredItemsCount = pledges
      .filter((p) => p.status === "received" || p.status === "partially_received")
      .reduce((sum, p) => sum + (Number(p.received_quantity) || 0), 0);

    return {
      overview: {
        totalOrganizations: orgs.length,
        verifiedOrganizations: verifiedOrgs,
        pendingOrganizations: pendingOrgs,
        totalNeeds: needs.length,
        activeNeeds,
        completedNeeds,
        totalSupporters: supporters.length,
      },
      financials: {
        totalConfirmedEtb,
        totalPledgedEtb,
        averageDonationEtb: confirmedDonations.length > 0 ? Math.round(totalConfirmedEtb / confirmedDonations.length) : 0,
        byMethod: {
          telebirr: telebirrSum,
          cbe_birr: cbeBirrSum,
          bank_transfer: bankSum,
          chapa: chapaSum,
          cash: cashSum,
        },
      },
      volunteering: {
        totalApplications: volunteers.length,
        confirmedVolunteers: volunteers.filter((v) => v.status === "attended" || v.status === "completed").length,
        hoursServed,
        certificatesIssued: certificates.length,
      },
      materials: {
        totalPledges: pledges.length,
        itemsDelivered: deliveredItemsCount,
      },
      regionalDistribution: [],
      categoryDistribution: [],
      recentAuditLogs: auditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        targetType: log.target_type,
        actor: log.actor_id || "System Administrator",
        createdAt: new Date(log.created_at).toLocaleDateString("en-ET", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        details: JSON.stringify(log.details || {}),
      })),
    };
  } catch (err) {
    console.error("getPlatformImpactMetrics exception:", err);
    return emptyMetrics;
  }
}
