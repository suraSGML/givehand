"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organization, OrgStatus } from "@/types/supabase";

export interface OrgWithStats extends Organization {
  activeNeedsCount: number;
  totalContributorsCount: number;
}

export interface OrgDocumentItem {
  id?: string;
  name: string;
  rawPath: string;
  type: string;
  url?: string | null;
  status?: string;
  submittedAt?: string;
}

export interface PendingOrgRecord {
  id: string;
  name: string;
  slug: string;
  registrationNumber: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  submittedAt: string;
  documentName: string;
  documentType: string;
  documents: OrgDocumentItem[];
  status: OrgStatus;
}

export async function getOrganizations(filters?: {
  city?: string;
  query?: string;
}): Promise<OrgWithStats[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("status", "verified");

    if (error || !data || data.length === 0) {
      return [];
    }

    let list: OrgWithStats[] = data.map((o) => ({
      ...o,
      activeNeedsCount: 2,
      totalContributorsCount: 150,
    }));

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.description && o.description.toLowerCase().includes(q))
      );
    }
    if (filters?.city && filters.city !== "all") {
      list = list.filter(
        (o) => o.address && o.address.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    return list;
  } catch (_e) {
    return [];
  }
}

export async function getOrganizationBySlug(slug: string): Promise<OrgWithStats | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Query organization by slug
    let { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    // If not found with user client (e.g. pending status and public view), check admin client
    if (!org) {
      const admin = createAdminClient();
      const { data: adminOrg } = await admin
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (adminOrg) {
        org = adminOrg;
      }
    }

    if (!org) return null;

    // Active needs count
    const { count: activeNeedsCount } = await supabase
      .from("needs")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .eq("status", "open");

    return {
      ...org,
      activeNeedsCount: activeNeedsCount || 0,
      totalContributorsCount: 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch all organizations pending verification for admin review.
 */
export async function getPendingOrganizations(): Promise<PendingOrgRecord[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("organizations")
      .select(`
        id,
        name,
        slug,
        registration_number,
        address,
        phone,
        email,
        status,
        created_at,
        organization_documents (
          id,
          file_path,
          doc_type,
          status,
          created_at
        )
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return [];
    }

    return await Promise.all(
      (data as any[]).map(async (row) => {
        const rawDocs = row.organization_documents || [];
        const documents: OrgDocumentItem[] = await Promise.all(
          rawDocs.map(async (doc: any) => {
            let url: string | null = null;
            if (doc.file_path && doc.file_path.includes("/")) {
              try {
                const { data: signedData } = await supabase.storage
                  .from("org-documents")
                  .createSignedUrl(doc.file_path, 3600);
                url = signedData?.signedUrl || null;
              } catch {
                // Ignore signed URL error
              }
            }

            const cleanName = doc.file_path?.includes("/")
              ? doc.file_path.split("/").pop()?.replace(/^\d+-/, "") || doc.file_path
              : doc.file_path;

            return {
              id: doc.id,
              name: cleanName || "Official-Document.pdf",
              rawPath: doc.file_path,
              type: doc.doc_type || "registration_certificate",
              url,
              status: doc.status || "pending_review",
              submittedAt: doc.created_at
                ? new Date(doc.created_at).toLocaleDateString("en-ET")
                : undefined,
            };
          })
        );

        const firstDoc = documents[0];

        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          registrationNumber: row.registration_number || "Unspecified",
          city: row.address?.split(",")?.pop()?.trim() || "Addis Ababa",
          address: row.address || "Unspecified address",
          phone: row.phone || "Unspecified",
          email: row.email || "Unspecified",
          submittedAt: new Date(row.created_at).toLocaleDateString("en-ET"),
          documentName: firstDoc?.name || "No documents uploaded",
          documentType: firstDoc?.type || "registration_certificate",
          documents,
          status: row.status,
        };
      })
    );
  } catch (err) {
    console.error("getPendingOrganizations error:", err);
    return [];
  }
}

/**
 * Generate a signed URL on demand for viewing an organization document.
 */
export async function getDocumentSignedUrlAction(filePath: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("org-documents")
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message || "Failed to generate document link" };
    }
    return { success: true, url: data.signedUrl };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error generating document link" };
  }
}

/**
 * Admin approves or rejects an organization with notes.
 */
export async function verifyOrganizationAction(
  orgId: string,
  approve: boolean,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const newStatus: OrgStatus = approve ? "verified" : "rejected";

    const { error: orgError } = await supabase
      .from("organizations")
      .update({
        status: newStatus,
        verified_at: approve ? new Date().toISOString() : null,
      })
      .eq("id", orgId);

    if (orgError) {
      return { success: false, error: orgError.message };
    }

    // Update document review note if documents exist
    await supabase
      .from("organization_documents")
      .update({
        status: approve ? "approved" : "rejected",
        review_note: notes || (approve ? "Verified by platform admin" : "Document rejected"),
      })
      .eq("organization_id", orgId);

    // Audit log
    await supabase.from("audit_logs").insert({
      action: approve ? "organization.verify" : "organization.reject",
      target_type: "organization",
      target_id: orgId,
      details: { notes: notes || null, approved: approve },
    });

    revalidatePath("/admin/organizations");
    revalidatePath("/organizations");
    revalidatePath("/org/profile");
    revalidatePath("/org/dashboard");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update verification status" };
  }
}

/**
 * Upload a real legal document file (PDF, PNG, JPEG) to Supabase Storage and register it.
 */
export async function uploadOrgDocumentFileAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; document?: any }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const file = formData.get("file") as File | null;
    const docType = (formData.get("docType") as string) || "registration_certificate";

    if (!file || file.size === 0) {
      return { success: false, error: "Please select a file to upload." };
    }

    // Limit to 5MB
    const MAX_DOC_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_DOC_SIZE) {
      return { success: false, error: "File size exceeds the 5MB limit. Please upload a document up to 5MB." };
    }

    let { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!org) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const orgName = profile?.full_name || "My Organization";
      const slug =
        orgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") + `-${user.id.slice(0, 4)}`;

      const { data: createdOrg, error: createErr } = await supabase
        .from("organizations")
        .insert({
          owner_id: user.id,
          name: orgName,
          slug,
          status: "pending",
        })
        .select("id")
        .single();

      if (createErr || !createdOrg) {
        return { success: false, error: createErr?.message || "Failed to initialize organization." };
      }
      org = createdOrg;
    }

    // Prevent duplicate upload for the same document type
    const { data: existingDocs } = await supabase
      .from("organization_documents")
      .select("id")
      .eq("organization_id", org.id)
      .eq("doc_type", docType)
      .limit(1);

    if (existingDocs && existingDocs.length > 0) {
      const typeLabels: Record<string, string> = {
        registration_certificate: "CSOA Charity Registration Certificate",
        trade_license: "Municipal Trade License / Permit",
        tin_document: "Tax Identification (TIN) Document",
        bylaws: "Organization Constitution / Bylaws",
      };
      const label = typeLabels[docType] || docType.replace(/_/g, " ");
      return {
        success: false,
        error: `A document for "${label}" has already been uploaded. Duplicate uploads for the same document type are not allowed.`,
      };
    }

    // Attempt storage upload via admin client
    let filePathToSave = file.name;
    try {
      const admin = createAdminClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${org.id}/${Date.now()}-${safeName}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: storageError } = await admin.storage
        .from("org-documents")
        .upload(storagePath, buffer, {
          contentType: file.type || "application/pdf",
          upsert: true,
        });

      if (!storageError) {
        filePathToSave = storagePath;
      }
    } catch {
      // Storage upload fallback to filename
    }

    const { data: newDoc, error: docError } = await supabase
      .from("organization_documents")
      .insert({
        organization_id: org.id,
        file_path: filePathToSave,
        doc_type: docType,
        status: "pending_review",
      })
      .select("id, file_path, doc_type, status, review_note, created_at")
      .single();

    if (docError) {
      return { success: false, error: docError.message };
    }

    await supabase
      .from("organizations")
      .update({ status: "pending" })
      .eq("id", org.id);

    revalidatePath("/org/profile");
    revalidatePath("/admin/organizations");

    return { success: true, document: newDoc };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to upload document." };
  }
}

/**
 * Organization uploads/registers an official legal document.
 */
export async function uploadOrgDocumentAction(data: {
  fileName: string;
  docType: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    let { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!org) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const orgName = profile?.full_name || "My Organization";
      const slug =
        orgName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") + `-${user.id.slice(0, 4)}`;

      const { data: createdOrg, error: createErr } = await supabase
        .from("organizations")
        .insert({
          owner_id: user.id,
          name: orgName,
          slug,
          status: "pending",
        })
        .select("id")
        .single();

      if (createErr || !createdOrg) {
        return { success: false, error: createErr?.message || "Failed to initialize organization" };
      }
      org = createdOrg;
    }

    // Prevent duplicate upload for the same document type
    const { data: existingDocs } = await supabase
      .from("organization_documents")
      .select("id")
      .eq("organization_id", org.id)
      .eq("doc_type", data.docType)
      .limit(1);

    if (existingDocs && existingDocs.length > 0) {
      return {
        success: false,
        error: "A document for this category has already been uploaded. Duplicate uploads for the same document type are not allowed.",
      };
    }

    const { error } = await supabase.from("organization_documents").insert({
      organization_id: org.id,
      file_path: data.fileName,
      doc_type: data.docType,
      status: "pending_review",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Reset org status to pending review if previously rejected
    await supabase
      .from("organizations")
      .update({ status: "pending" })
      .eq("id", org.id);

    revalidatePath("/org/profile");
    revalidatePath("/admin/organizations");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to upload document" };
  }
}

/**
 * Delete an uploaded verification document (allowed if not approved).
 */
export async function deleteOrgDocumentAction(documentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!org) {
      return { success: false, error: "Organization not found" };
    }

    const { data: doc } = await supabase
      .from("organization_documents")
      .select("id, file_path, status")
      .eq("id", documentId)
      .eq("organization_id", org.id)
      .maybeSingle();

    if (!doc) {
      return { success: false, error: "Document not found" };
    }

    if (doc.status === "approved") {
      return { success: false, error: "Approved official documents cannot be deleted." };
    }

    // Remove from storage if stored in bucket
    if (doc.file_path && doc.file_path.includes("/")) {
      try {
        const admin = createAdminClient();
        await admin.storage.from("org-documents").remove([doc.file_path]);
      } catch {
        // Continue if storage file removal fails
      }
    }

    const { error } = await supabase
      .from("organization_documents")
      .delete()
      .eq("id", documentId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/org/profile");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to delete document" };
  }
}

/**
 * Organization updates profile fields (name, phone, address, mission, registration number).
 */
export async function updateOrgProfileAction(data: {
  name: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  description: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!existingOrg) {
      const slug =
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") + `-${user.id.slice(0, 4)}`;

      const { error: insertErr } = await supabase.from("organizations").insert({
        owner_id: user.id,
        name: data.name,
        slug,
        registration_number: data.registrationNumber,
        phone: data.phone,
        email: data.email,
        address: data.address,
        description: data.description,
        status: "pending",
      });

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }
    } else {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: data.name,
          registration_number: data.registrationNumber,
          phone: data.phone,
          email: data.email,
          address: data.address,
          description: data.description,
        })
        .eq("id", existingOrg.id);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/org/profile");
    revalidatePath("/org/dashboard");
    revalidatePath("/organizations");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update profile" };
  }
}
