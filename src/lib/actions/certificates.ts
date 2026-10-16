"use server";

import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  issueCertificateSchema,
  type IssueCertificateInput,
} from "@/lib/validations/certificate";
import type { CertificateType } from "@/types/supabase";

// ── Public types ────────────────────────────────────────────────────────────

export interface CertificateRecord {
  id: string;
  publicCode: string;
  type: CertificateType;
  userId: string;
  recipientName: string;
  organizationId: string;
  orgName: string;
  orgLogoUrl: string | null;
  orgRegistrationNumber: string | null;
  campaignTitle: string;
  impactTitle: string;
  impactDescription: string;
  metrics: {
    hoursLogged?: number;
    donationAmount?: number;
  };
  issuedAt: string;
  revokedAt: string | null;
  qrCodeDataUrl: string;
  verificationUrl: string;
}

// ── Private helpers ──────────────────────────────────────────────────────────

function generateCertificateCode(type: CertificateType): string {
  const prefix =
    type === "volunteer_service" ? "VOL" :
    type === "donation_receipt"  ? "DON" : "REC";
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GH-ET-${prefix}-${year}-${suffix}`;
}

async function generateQrDataUrl(publicCode: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://givehand.et";
  try {
    return await QRCode.toDataURL(`${base}/verify/${publicCode}`, {
      margin: 1,
      width: 256,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    });
  } catch {
    return "";
  }
}

function defaultTitle(type: CertificateType): string {
  if (type === "volunteer_service") return "Certificate of Volunteer Service";
  if (type === "donation_receipt")  return "Official Donation Receipt";
  return "Certificate of Community Partnership";
}

function defaultDescription(type: CertificateType, d: Record<string, any>): string {
  if (type === "volunteer_service") {
    const h = d.hours_logged ? `${d.hours_logged} hours` : "dedicated hours";
    return `In recognition of contributing ${h} of volunteer service to this humanitarian initiative.`;
  }
  if (type === "donation_receipt") {
    const a = d.donation_amount
      ? `${Number(d.donation_amount).toLocaleString()} ETB`
      : "a generous sum";
    return `In acknowledgment of a donation of ${a} to support vulnerable communities across Ethiopia.`;
  }
  return "In recognition of dedication and service to Ethiopian community welfare.";
}

function mapRow(row: any, baseUrl: string, qrDataUrl: string): CertificateRecord {
  const d   = (row.data as Record<string, any>) ?? {};
  const org = row.organizations as any;
  const prf = row.donor_profile as any;   // named hint used in SELECT

  return {
    id:                   row.id,
    publicCode:           row.public_code,
    type:                 row.type,
    userId:               row.user_id,
    recipientName:        d.recipient_name ?? prf?.full_name ?? "Community Supporter",
    organizationId:       row.organization_id,
    orgName:              org?.name ?? "Organization",
    orgLogoUrl:           org?.logo_url ?? null,
    orgRegistrationNumber:org?.registration_number ?? null,
    campaignTitle:        d.campaign_title ?? "Community Campaign",
    impactTitle:          d.title ?? defaultTitle(row.type),
    impactDescription:    defaultDescription(row.type, d),
    metrics: {
      hoursLogged:    d.hours_logged    ? Number(d.hours_logged)    : undefined,
      donationAmount: d.donation_amount ? Number(d.donation_amount) : undefined,
    },
    issuedAt:   row.issued_at,
    revokedAt:  row.revoked_at ?? null,
    qrCodeDataUrl: qrDataUrl,
    verificationUrl: `${baseUrl}/verify/${row.public_code}`,
  };
}

// certificates table has two FK → profiles (user_id and potentially issued_by)
// Use explicit hint `profiles!certificates_user_id_fkey` aliased to donor_profile.
const CERT_SELECT = `
  id,
  public_code,
  type,
  user_id,
  organization_id,
  data,
  issued_at,
  revoked_at,
  organizations ( id, name, logo_url, registration_number ),
  donor_profile:profiles!certificates_user_id_fkey ( id, full_name )
`;

// ── Internal auto-issue (called by confirmDonation / updateVolunteer) ────────

/**
 * Issue a certificate automatically. Non-fatal — a failure here never
 * blocks the parent confirm/check-out action.
 */
export async function autoIssueCertificate(params: {
  type:           CertificateType;
  userId:         string;
  organizationId: string;
  relatedId:      string;
  recipientName:  string;
  campaignTitle:  string;
  title:          string;
  hoursLogged?:   number;
  donationAmount?:number;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const publicCode = generateCertificateCode(params.type);

    const { error } = await supabase.from("certificates").insert({
      public_code:     publicCode,
      type:            params.type,
      user_id:         params.userId,
      organization_id: params.organizationId,
      related_id:      params.relatedId,
      data: {
        recipient_name:  params.recipientName,
        campaign_title:  params.campaignTitle,
        title:           params.title,
        hours_logged:    params.hoursLogged    ?? null,
        donation_amount: params.donationAmount ?? null,
      },
    });

    if (error) {
      console.error("autoIssueCertificate DB error:", error.message);
      return;
    }

    revalidatePath("/dashboard/certificates");
    revalidatePath(`/verify/${publicCode}`);
  } catch (err) {
    console.error("autoIssueCertificate error:", err);
  }
}

// ── Public actions ───────────────────────────────────────────────────────────

/**
 * Manually issue a certificate (called by org from their pages).
 */
export async function issueCertificateAction(
  input: IssueCertificateInput
): Promise<{ success: boolean; error?: string; certificateId?: string; publicCode?: string }> {
  try {
    const parsed = issueCertificateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Authentication required" };

    const publicCode = generateCertificateCode(parsed.data.type);

    const { data: cert, error: insertError } = await supabase
      .from("certificates")
      .insert({
        public_code:     publicCode,
        type:            parsed.data.type,
        user_id:         parsed.data.recipientId,
        organization_id: parsed.data.organizationId,
        related_id:      parsed.data.relatedId ?? null,
        data: {
          recipient_name:  parsed.data.recipientName,
          campaign_title:  parsed.data.campaignTitle,
          hours_logged:    parsed.data.hoursLogged    ?? null,
          donation_amount: parsed.data.donationAmount ?? null,
          title:           parsed.data.title,
          notes:           parsed.data.notes ?? null,
        },
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message ?? "Failed to create certificate" };
    }

    revalidatePath("/dashboard/certificates");
    revalidatePath(`/verify/${publicCode}`);
    return { success: true, certificateId: cert.id, publicCode };
  } catch (err: any) {
    return { success: false, error: err?.message ?? "Failed to issue certificate" };
  }
}

/**
 * Public verification — anyone can look up a certificate by its code.
 */
export async function getCertificateByCode(
  publicCode: string
): Promise<CertificateRecord | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("certificates")
      .select(CERT_SELECT)
      .eq("public_code", publicCode.trim().toUpperCase())
      .single();

    if (error || !data) return null;

    const qr = await generateQrDataUrl((data as any).public_code);
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://givehand.et";
    return mapRow(data, base, qr);
  } catch (err) {
    console.error("getCertificateByCode error:", err);
    return null;
  }
}

/**
 * Fetch all certificates for the currently logged-in supporter.
 * Uses admin client to bypass RLS so the supporter always sees their own certs.
 */
export async function getUserCertificates(): Promise<{
  certificates: CertificateRecord[];
  stats: { totalCertificates: number; volunteerHours: number; donationsVerifiedEtb: number };
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { certificates: [], stats: emptyCertStats() };

    // Use admin client so RLS never hides the user's own certificates
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("certificates")
      .select(CERT_SELECT)
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false });

    if (error) {
      console.error("getUserCertificates error:", error.message);
      return { certificates: [], stats: emptyCertStats() };
    }
    if (!data || data.length === 0) {
      return { certificates: [], stats: emptyCertStats() };
    }

    const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://givehand.et";
    const certificates = await Promise.all(
      (data as any[]).map(async (row) => {
        const qr = await generateQrDataUrl(row.public_code);
        return mapRow(row, base, qr);
      })
    );

    return { certificates, stats: calcStats(certificates) };
  } catch (err) {
    console.error("getUserCertificates exception:", err);
    return { certificates: [], stats: emptyCertStats() };
  }
}

function emptyCertStats() {
  return { totalCertificates: 0, volunteerHours: 0, donationsVerifiedEtb: 0 };
}

function calcStats(certs: CertificateRecord[]) {
  return {
    totalCertificates:   certs.length,
    volunteerHours:      certs
      .filter((c) => c.type === "volunteer_service")
      .reduce((s, c) => s + (c.metrics.hoursLogged ?? 0), 0),
    donationsVerifiedEtb: certs
      .filter((c) => c.type === "donation_receipt")
      .reduce((s, c) => s + (c.metrics.donationAmount ?? 0), 0),
  };
}
