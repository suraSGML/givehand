import type { Metadata } from "next";
import Link from "next/link";
import {
  PlusCircle,
  Users,
  Package,
  DollarSign,
  ExternalLink,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { getNeeds } from "@/lib/actions/needs";
import { createClient } from "@/lib/supabase/server";
import { NeedStatusToggle } from "@/components/needs/need-status-toggle";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage Campaigns | Organization Portal",
};

export default async function OrgNeedsManagementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = user
    ? await supabase.from("organizations").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  const isVerified = org ? org.status === "verified" : false;
  const needs = org?.id ? await getNeeds({ organizationId: org.id }) : [];

  return (
    <div className="space-y-6">
      {/* Unverified Warning Banner if organization is pending verification */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display text-sm font-bold text-amber-900 dark:text-amber-200">
                Organization Verification Pending
              </h3>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                Your organization is under regulatory review. Newly created campaigns remain in{" "}
                <strong>Draft</strong> mode until legal verification documents are approved by platform administrators.
              </p>
            </div>
          </div>
          <Link
            href="/org/profile"
            className="inline-flex items-center justify-center shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-sm transition-colors"
          >
            Upload Documents
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Campaigns & Needs Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Monitor contribution progress, review volunteer applications, and post new requests.
          </p>
        </div>

        <Link
          href="/org/needs/new"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Campaign
        </Link>
      </div>

      {needs.length > 0 ? (
        <div className="space-y-4">
          {needs.map((need) => (
            <div
              key={need.id}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/40 transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <NeedStatusToggle
                    needId={need.id}
                    currentStatus={need.status}
                    isOrgVerified={isVerified}
                  />
                  {need.urgency && (
                    <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      URGENT
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">• 📍 {need.city}</span>
                </div>

                <h3 className="font-display text-base font-bold text-foreground">
                  {need.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-teal-600" />
                    {need.items.filter((i) => i.itemType === "volunteer").length} Volunteer Roles
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-amber-600" />
                    {need.items.filter((i) => i.itemType === "material").length} Material Items
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    {need.items.filter((i) => i.itemType === "money").length} Donation Funds
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2 shrink-0">
                <div className="text-xs font-bold text-primary">
                  Progress: {need.overallProgress}%
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/org/needs/${need.id}/volunteers`}
                    className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    <Users className="h-3 w-3" />
                    Volunteers
                  </Link>
                  <Link
                    href={`/org/needs/${need.id}/materials`}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    <Package className="h-3 w-3" />
                    Materials
                  </Link>
                  <Link
                    href={`/org/needs/${need.id}/donations`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    <DollarSign className="h-3 w-3" />
                    Donations
                  </Link>
                  <Link
                    href={`/org/needs/${need.id}/scanner`}
                    className="inline-flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 transition-colors"
                  >
                    Scanner
                  </Link>
                  <Link
                    href={`/needs/${need.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                  >
                    Public View
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card/40">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <PlusCircle className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-foreground">
            No campaigns published yet
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            You haven&apos;t posted any community needs. Start by creating a request for volunteers, physical goods, or donations.
          </p>
          <Link
            href="/org/needs/new"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow"
          >
            <PlusCircle className="h-4 w-4" />
            Create Your First Campaign
          </Link>
        </div>
      )}
    </div>
  );
}
