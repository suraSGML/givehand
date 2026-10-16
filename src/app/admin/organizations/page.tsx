import type { Metadata } from "next";
import { getPendingOrganizations } from "@/lib/actions/organizations";
import { AdminOrgVerificationList } from "./_components/verification-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organization Verification Queue | Admin",
};

export default async function AdminOrganizationsPage() {
  const pendingOrgs = await getPendingOrganizations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Organization Verification Queue
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Review government registration documents and approve organizations to publish public campaigns.
        </p>
      </div>

      <AdminOrgVerificationList initialPending={pendingOrgs} />
    </div>
  );
}
