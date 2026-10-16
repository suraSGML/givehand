import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OrgProfileForm } from "./_components/org-profile-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organization Profile & Verification | GiveHand ET",
  description: "Manage public organization information and official verification documents.",
};

export default async function OrgProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = user
    ? await supabase
        .from("organizations")
        .select(`
          id,
          name,
          registration_number,
          phone,
          email,
          address,
          description,
          status,
          organization_documents (
            id,
            file_path,
            doc_type,
            status,
            review_note,
            created_at
          )
        `)
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const defaultOrg = {
    id: org?.id || "",
    name: org?.name || profile?.full_name || "",
    registration_number: org?.registration_number || "",
    phone: org?.phone || "",
    email: org?.email || user?.email || "",
    address: org?.address || "",
    description: org?.description || "",
    status: org?.status || "pending",
  };

  const initialDocuments = (org as any)?.organization_documents || [];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Organization Profile & Verification
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Manage public organization information and upload legal verification documents for regulatory compliance.
        </p>
      </div>

      <OrgProfileForm initialOrg={defaultOrg} initialDocuments={initialDocuments} />
    </div>
  );
}
